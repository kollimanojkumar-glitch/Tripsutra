import { FormEvent, useState } from 'react';
import { ArrowLeft, MapPin, CalendarDays, Zap, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import LoadingSpinner from '../components/LoadingSpinner';

const INTERESTS = [
  { value: 'culture', label: 'Culture & History', emoji: '🏛️' },
  { value: 'food', label: 'Food & Drink', emoji: '🍜' },
  { value: 'nature', label: 'Nature & Outdoors', emoji: '🌿' },
  { value: 'nightlife', label: 'Nightlife', emoji: '🎶' },
];

const PACE_OPTIONS = [
  { value: 'relaxed', label: 'Relaxed', desc: 'Slow down, fewer activities, lots of breathing room', icon: '☕' },
  { value: 'moderate', label: 'Moderate', desc: 'Balanced mix of sightseeing and downtime', icon: '🗺️' },
  { value: 'packed', label: 'Packed', desc: 'Action-packed, see and do as much as possible', icon: '⚡' },
] as const;

type Pace = 'relaxed' | 'moderate' | 'packed';

export default function CreateTrip() {
  const { user } = useAuth();
  const { navigate } = useRouter();

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pace, setPace] = useState<Pace>('moderate');
  const [interests, setInterests] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const toggleInterest = (val: string) => {
    setInterests(prev =>
      prev.includes(val) ? prev.filter(i => i !== val) : [...prev, val]
    );
  };

  const today = new Date().toISOString().split('T')[0];

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!destination.trim()) { setError('Please enter a destination.'); return; }
    if (!startDate) { setError('Please select a start date.'); return; }
    if (!endDate) { setError('Please select an end date.'); return; }
    if (startDate > endDate) { setError('End date must be after start date.'); return; }

    setGenerating(true);

    try {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .insert({
          user_id: user!.id,
          destination: destination.trim(),
          start_date: startDate,
          end_date: endDate,
          preferences: { pace, interests },
        })
        .select()
        .single();

      if (tripError || !tripData) throw new Error(tripError?.message || 'Failed to create trip');

      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-itinerary`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            destination: destination.trim(),
            start_date: startDate,
            end_date: endDate,
            preferences: { pace, interests },
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to generate itinerary');

      const { days } = await response.json();

      if (!days || !Array.isArray(days)) throw new Error('Invalid itinerary data received');

      for (const day of days) {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + (day.day_number - 1));

        const { data: dayData, error: dayError } = await supabase
          .from('days')
          .insert({
            trip_id: tripData.id,
            day_number: day.day_number,
            date: dayDate.toISOString().split('T')[0],
            title: day.title || `Day ${day.day_number}`,
          })
          .select()
          .single();

        if (dayError || !dayData) continue;

        if (Array.isArray(day.activities)) {
          const activityRows = day.activities.map((act: { name: string; start_time: string; duration_minutes: number; description: string; location_text: string }, idx: number) => ({
            day_id: dayData.id,
            name: act.name,
            start_time: act.start_time || null,
            duration_minutes: act.duration_minutes || 60,
            description: act.description || '',
            location_text: act.location_text || '',
            sort_order: idx,
          }));

          await supabase.from('activities').insert(activityRows);
        }
      }

      navigate({ name: 'itinerary', tripId: tripData.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner message="Crafting your perfect itinerary..." />
          <p className="text-sm text-slate-400 mt-4 max-w-xs mx-auto">
            Our AI is curating experiences tailored just for you. This takes about 10–20 seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate({ name: 'dashboard' })}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> My Trips
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Plan a New Trip</h1>
          <p className="text-slate-500 text-sm">Fill in the details and we'll generate your perfect itinerary.</p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-7">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-500" /> Destination
            </h2>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="e.g. Tokyo, Japan or Tuscany, Italy"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition text-base"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-sky-500" /> Travel Dates
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={e => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate(''); }}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-500" /> Trip Pace
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {PACE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPace(opt.value)}
                  className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all text-center ${
                    pace === opt.value
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-2xl mb-2">{opt.icon}</span>
                  <span className={`text-sm font-semibold mb-1 ${pace === opt.value ? 'text-sky-700' : 'text-slate-700'}`}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-slate-400 leading-tight hidden sm:block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-slate-700">Interests</h2>
            <p className="text-xs text-slate-400">Select all that apply — we'll tailor your activities accordingly.</p>
            <div className="grid grid-cols-2 gap-3">
              {INTERESTS.map(interest => (
                <button
                  key={interest.value}
                  type="button"
                  onClick={() => toggleInterest(interest.value)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                    interests.includes(interest.value)
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-xl">{interest.emoji}</span>
                  <span className={`text-sm font-medium ${interests.includes(interest.value) ? 'text-sky-700' : 'text-slate-600'}`}>
                    {interest.label}
                  </span>
                  <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                    interests.includes(interest.value)
                      ? 'border-sky-500 bg-sky-500'
                      : 'border-slate-300'
                  }`}>
                    {interests.includes(interest.value) && (
                      <svg className="w-full h-full text-white" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-semibold py-4 rounded-xl shadow-md shadow-sky-200 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <Sparkles className="w-5 h-5" />
            Generate Itinerary
          </button>
        </form>
      </div>
    </div>
  );
}
