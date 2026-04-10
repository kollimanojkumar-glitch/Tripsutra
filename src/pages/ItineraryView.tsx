import { useEffect, useState, useRef, DragEvent } from 'react';
import {
  ArrowLeft, Plus, Clock, MapPin, Pencil, Trash2,
  GripVertical, Calendar, AlignLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Trip, Day, Activity, ActivityFormData } from '../types';
import { useRouter } from '../context/RouterContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ActivityModal from '../components/ActivityModal';

interface ItineraryViewProps {
  tripId: string;
}

function formatTime(time: string | null) {
  if (!time) return null;
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDayDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function ItineraryView({ tripId }: ItineraryViewProps) {
  const { navigate } = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [activities, setActivities] = useState<Record<string, Activity[]>>({});
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [targetDayId, setTargetDayId] = useState<string | null>(null);

  const dragItem = useRef<{ id: string; dayId: string } | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  useEffect(() => {
    loadAll();
  }, [tripId]);

  const loadAll = async () => {
    setLoading(true);
    const { data: tripData } = await supabase
      .from('trips').select('*').eq('id', tripId).maybeSingle();
    if (tripData) setTrip(tripData as Trip);

    const { data: daysData } = await supabase
      .from('days').select('*').eq('trip_id', tripId).order('day_number');
    const loadedDays = (daysData || []) as Day[];
    setDays(loadedDays);

    if (loadedDays.length > 0) {
      setSelectedDayId(loadedDays[0].id);
      const dayIds = loadedDays.map(d => d.id);
      const { data: actsData } = await supabase
        .from('activities').select('*').in('day_id', dayIds).order('sort_order');

      const grouped: Record<string, Activity[]> = {};
      loadedDays.forEach(d => { grouped[d.id] = []; });
      (actsData || []).forEach((a: Activity) => {
        if (grouped[a.day_id]) grouped[a.day_id].push(a);
      });
      setActivities(grouped);
    }
    setLoading(false);
  };

  const currentActivities = selectedDayId ? (activities[selectedDayId] || []) : [];

  const openAddModal = (dayId: string) => {
    setEditingActivity(null);
    setTargetDayId(dayId);
    setModalOpen(true);
  };

  const openEditModal = (activity: Activity) => {
    setEditingActivity(activity);
    setTargetDayId(activity.day_id);
    setModalOpen(true);
  };

  const handleSaveActivity = async (data: ActivityFormData) => {
    if (editingActivity) {
      const { data: updated } = await supabase
        .from('activities')
        .update({
          name: data.name,
          start_time: data.start_time || null,
          duration_minutes: data.duration_minutes,
          description: data.description,
          location_text: data.location_text,
        })
        .eq('id', editingActivity.id)
        .select()
        .single();

      if (updated) {
        setActivities(prev => ({
          ...prev,
          [editingActivity.day_id]: prev[editingActivity.day_id].map(a =>
            a.id === editingActivity.id ? (updated as Activity) : a
          ),
        }));
      }
    } else {
      const dayId = targetDayId!;
      const existing = activities[dayId] || [];
      const { data: inserted } = await supabase
        .from('activities')
        .insert({
          day_id: dayId,
          name: data.name,
          start_time: data.start_time || null,
          duration_minutes: data.duration_minutes,
          description: data.description,
          location_text: data.location_text,
          sort_order: existing.length,
        })
        .select()
        .single();

      if (inserted) {
        setActivities(prev => ({
          ...prev,
          [dayId]: [...(prev[dayId] || []), inserted as Activity],
        }));
      }
    }
  };

  const handleDeleteActivity = async (activity: Activity) => {
    if (!confirm('Delete this activity?')) return;
    const { error } = await supabase.from('activities').delete().eq('id', activity.id);
    if (!error) {
      setActivities(prev => ({
        ...prev,
        [activity.day_id]: prev[activity.day_id].filter(a => a.id !== activity.id),
      }));
    }
  };

  const handleDragStart = (e: DragEvent, id: string, dayId: string) => {
    dragItem.current = { id, dayId };
    e.dataTransfer.effectAllowed = 'move';
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '0.5';
  };

  const handleDragEnd = (e: DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '1';
    dragOverIndex.current = null;
  };

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndex.current = index;
  };

  const handleDrop = async (e: DragEvent, dropIndex: number, dayId: string) => {
    e.preventDefault();
    if (!dragItem.current || dragItem.current.dayId !== dayId) return;

    const dayActs = [...(activities[dayId] || [])];
    const dragIndex = dayActs.findIndex(a => a.id === dragItem.current!.id);
    if (dragIndex === -1 || dragIndex === dropIndex) return;

    const [moved] = dayActs.splice(dragIndex, 1);
    dayActs.splice(dropIndex, 0, moved);

    const reordered = dayActs.map((a, i) => ({ ...a, sort_order: i }));
    setActivities(prev => ({ ...prev, [dayId]: reordered }));

    await Promise.all(
      reordered.map(a =>
        supabase.from('activities').update({ sort_order: a.sort_order }).eq('id', a.id)
      )
    );

    dragItem.current = null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20">
        <LoadingSpinner message="Loading your itinerary..." />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Trip not found.</p>
          <button onClick={() => navigate({ name: 'dashboard' })} className="text-sky-600 hover:text-sky-700 font-medium">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selectedDay = days.find(d => d.id === selectedDayId);

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ name: 'dashboard' })}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{trip.destination}</h1>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(trip.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="capitalize">{trip.preferences?.pace || 'moderate'} pace</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 h-full">
          <aside className="w-56 flex-shrink-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">Days</p>
            <nav className="space-y-1">
              {days.map(day => (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id)}
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all ${
                    selectedDayId === day.id
                      ? 'bg-sky-500 text-white shadow-sm shadow-sky-200'
                      : 'text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100'
                  }`}
                >
                  <div className={`text-xs font-semibold mb-0.5 ${selectedDayId === day.id ? 'text-sky-100' : 'text-slate-400'}`}>
                    Day {day.day_number}
                  </div>
                  <div className="text-sm font-medium leading-tight line-clamp-2">
                    {day.title || formatDayDate(day.date)}
                  </div>
                  <div className={`text-xs mt-1 ${selectedDayId === day.id ? 'text-sky-200' : 'text-slate-400'}`}>
                    {(activities[day.id] || []).length} activities
                  </div>
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            {selectedDay && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">{selectedDay.title || `Day ${selectedDay.day_number}`}</h2>
                    <p className="text-sm text-slate-400">{formatDayDate(selectedDay.date)}</p>
                  </div>
                  <button
                    onClick={() => openAddModal(selectedDay.id)}
                    className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Activity
                  </button>
                </div>

                {currentActivities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <AlignLeft className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium mb-1">No activities yet</p>
                    <p className="text-slate-400 text-sm mb-4">Add your first activity for this day.</p>
                    <button
                      onClick={() => openAddModal(selectedDay.id)}
                      className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Activity
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentActivities.map((act, index) => (
                      <div
                        key={act.id}
                        draggable
                        onDragStart={e => handleDragStart(e, act.id, act.day_id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => handleDragOver(e, index)}
                        onDrop={e => handleDrop(e, index, act.day_id)}
                        className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex items-stretch">
                          <div
                            className="flex items-center justify-center w-10 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 transition-colors border-r border-slate-100 rounded-l-2xl hover:bg-slate-50"
                            title="Drag to reorder"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <div className="flex-1 p-4 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                  {act.start_time && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(act.start_time)}
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-400">
                                    {formatDuration(act.duration_minutes)}
                                  </span>
                                </div>
                                <h3 className="font-semibold text-slate-800 text-base leading-snug">{act.name}</h3>
                                {act.location_text && (
                                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{act.location_text}</span>
                                  </div>
                                )}
                                {act.description && (
                                  <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-2">
                                    {act.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                  onClick={() => openEditModal(act)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteActivity(act)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => openAddModal(selectedDay.id)}
                      className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-sky-300 hover:text-sky-500 hover:bg-sky-50/50 transition-all text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" /> Add Activity
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {modalOpen && (
        <ActivityModal
          activity={editingActivity}
          onSave={handleSaveActivity}
          onClose={() => { setModalOpen(false); setEditingActivity(null); }}
        />
      )}
    </div>
  );
}
