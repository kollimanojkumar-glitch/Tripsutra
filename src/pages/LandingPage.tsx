import { Globe, Sparkles, CalendarDays, CreditCard as Edit3, ArrowRight, MapPin, Compass } from 'lucide-react';
import { useRouter } from '../context/RouterContext';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Planning',
    desc: 'Describe your dream trip and our AI instantly crafts a detailed, personalized day-by-day itinerary.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: CalendarDays,
    title: 'Day-by-Day Structure',
    desc: 'Every itinerary is organized by day with time slots, durations, and location details ready to go.',
    color: 'text-sky-500',
    bg: 'bg-sky-50',
  },
  {
    icon: Edit3,
    title: 'Fully Customizable',
    desc: 'Add, remove, edit, and reorder activities with ease. Make every trip truly your own.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Globe,
    title: 'Any Destination',
    desc: 'From weekend city breaks to month-long adventures — TripCraft handles itineraries for trips worldwide.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
];

const DESTINATIONS = [
  { name: 'Tokyo', image: 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Paris', image: 'https://images.pexels.com/photos/532826/pexels-photo-532826.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name: 'Santorini', image: 'https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

export default function LandingPage() {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-sky-900 via-sky-800 to-slate-900 pt-24 pb-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-500/30 text-sky-300 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              AI-powered travel planning
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              Plan Your Perfect Trip{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-amber-300">
                in Minutes
              </span>
            </h1>

            <p className="text-xl text-sky-100/80 max-w-2xl mb-10 leading-relaxed">
              Tell us where you're going and what you love. TripCraft's AI creates a beautiful,
              detailed itinerary tailored to your pace and interests — ready to edit and share.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate({ name: 'auth', mode: 'signup' })}
                className="group flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-400/30 hover:-translate-y-0.5"
              >
                Start Planning Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate({ name: 'auth', mode: 'login' })}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-all backdrop-blur-sm"
              >
                <Compass className="w-4 h-4" />
                Log In
              </button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-3 max-w-3xl mx-auto">
            {DESTINATIONS.map(dest => (
              <div key={dest.name} className="relative rounded-2xl overflow-hidden aspect-[4/3] group">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-sm font-semibold">{dest.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4">
            Everything you need to travel smarter
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            From first idea to packed bag — TripCraft has every step covered.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map(feat => (
            <div key={feat.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className={`w-11 h-11 ${feat.bg} rounded-xl flex items-center justify-center mb-4`}>
                <feat.icon className={`w-5 h-5 ${feat.color}`} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-sky-600 to-sky-700 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Your next adventure starts here
          </h2>
          <p className="text-sky-100 text-lg mb-8">
            Join thousands of travelers who plan smarter with TripCraft.
          </p>
          <button
            onClick={() => navigate({ name: 'auth', mode: 'signup' })}
            className="group inline-flex items-center gap-2 bg-white text-sky-600 font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Create Your First Trip
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <footer className="bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-sky-500 rounded-md flex items-center justify-center">
              <Compass className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-sm">TripCraft</span>
          </div>
          <p className="text-slate-500 text-sm">© 2024 TripCraft. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
