import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CreateTrip from './pages/CreateTrip';
import ItineraryView from './pages/ItineraryView';

function AppContent() {
  const { page, navigate } = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user && page.name === 'landing') {
        navigate({ name: 'dashboard' });
      }
      if (!user && (page.name === 'dashboard' || page.name === 'create-trip' || page.name === 'itinerary')) {
        navigate({ name: 'landing' });
      }
    }
  }, [user, loading, page.name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showNavbar = page.name !== 'landing';

  return (
    <div className="min-h-screen bg-slate-50">
      {showNavbar && <Navbar />}
      {page.name === 'landing' && <LandingPage />}
      {page.name === 'auth' && <AuthPage mode={page.mode} />}
      {page.name === 'dashboard' && user && <Dashboard />}
      {page.name === 'create-trip' && user && <CreateTrip />}
      {page.name === 'itinerary' && user && <ItineraryView tripId={page.tripId} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}
