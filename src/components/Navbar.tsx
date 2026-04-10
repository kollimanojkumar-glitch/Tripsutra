import { Compass, LogOut, Map } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { navigate } = useRouter();

  const handleSignOut = async () => {
    await signOut();
    navigate({ name: 'landing' });
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => navigate(user ? { name: 'dashboard' } : { name: 'landing' })}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-sky-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">
              Trip<span className="text-sky-500">Craft</span>
            </span>
          </button>

          <nav className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => navigate({ name: 'dashboard' })}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors px-3 py-2 rounded-lg hover:bg-sky-50"
                >
                  <Map className="w-4 h-4" />
                  My Trips
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate({ name: 'auth', mode: 'login' })}
                  className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors px-4 py-2 rounded-lg hover:bg-sky-50"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate({ name: 'auth', mode: 'signup' })}
                  className="text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors px-4 py-2 rounded-lg shadow-sm"
                >
                  Sign Up
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
