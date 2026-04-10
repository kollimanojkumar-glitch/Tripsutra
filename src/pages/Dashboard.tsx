import { useEffect, useState } from 'react';
import { Plus, MapPin, Calendar, Trash2, Compass, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Trip } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import LoadingSpinner from '../components/LoadingSpinner';

const GRADIENTS = [
  'from-sky-400 to-blue-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-violet-400 to-purple-600',
  'from-cyan-400 to-sky-600',
];

function getGradient(destination: string) {
  let hash = 0;
  for (let i = 0; i < destination.length; i++) hash = destination.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const sameYear = s.getFullYear() === e.getFullYear();
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { ...opts, year: sameYear ? undefined : 'numeric' })}, ${e.getFullYear()}`;
}

function getDayCount(start: string, end: string) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchTrips();
  }, [user]);

  const fetchTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setTrips(data as Trip[]);
    setLoading(false);
  };

  const handleDelete = async (tripId: string) => {
    if (!confirm('Delete this trip and all its activities?')) return;
    setDeletingId(tripId);
    const { error } = await supabase.from('trips').delete().eq('id', tripId);
    if (!error) setTrips(ts => ts.filter(t => t.id !== tripId));
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Trips</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {trips.length === 0 ? 'No trips yet — create your first one!' : `${trips.length} trip${trips.length !== 1 ? 's' : ''} planned`}
            </p>
          </div>
          <button
            onClick={() => navigate({ name: 'create-trip' })}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            New Trip
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 border border-sky-100">
              <Compass className="w-10 h-10 text-sky-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No trips planned yet</h2>
            <p className="text-slate-400 mb-8 max-w-sm">
              Create your first trip and let AI craft a perfect itinerary for you in seconds.
            </p>
            <button
              onClick={() => navigate({ name: 'create-trip' })}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Trip
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map(trip => (
              <div
                key={trip.id}
                className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                onClick={() => navigate({ name: 'itinerary', tripId: trip.id })}
              >
                <div className={`h-40 bg-gradient-to-br ${getGradient(trip.destination)} relative overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Compass className="w-16 h-16 text-white/20" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white tracking-tight leading-tight">
                      {trip.destination}
                    </h3>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(trip.id); }}
                    disabled={deletingId === trip.id}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-red-500 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete trip"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-2">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-full capitalize">
                        {trip.preferences?.pace || 'moderate'} pace
                      </span>
                      <span className="text-xs text-slate-400">
                        {getDayCount(trip.start_date, trip.end_date)} days
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  {trip.preferences?.interests?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {trip.preferences.interests.slice(0, 3).map(interest => (
                        <span key={interest} className="text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md capitalize">
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={() => navigate({ name: 'create-trip' })}
              className="flex flex-col items-center justify-center h-full min-h-52 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-sky-300 hover:text-sky-500 hover:bg-sky-50/50 transition-all group"
            >
              <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Plan a new trip</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
