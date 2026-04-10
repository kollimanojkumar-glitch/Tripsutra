import { FormEvent, useState } from 'react';
import { Compass, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';

interface AuthPageProps {
  mode: 'login' | 'signup';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isLogin = mode === 'login';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (authError) {
        setError(authError.message);
      } else {
        navigate({ name: 'dashboard' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate({ name: 'landing' })}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-br from-sky-600 to-sky-700 p-8 text-center">
            <div className="inline-flex w-14 h-14 bg-white/20 rounded-2xl items-center justify-center mb-4 backdrop-blur-sm">
              <Compass className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sky-100 text-sm">
              {isLogin ? 'Sign in to access your trips' : 'Start planning your perfect trips'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete={isLogin ? 'email' : 'new-email'}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={isLogin ? '••••••••' : 'Min. 6 characters'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold rounded-xl transition-colors shadow-sm shadow-sky-200"
            >
              {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Sign In' : 'Create Account')}
            </button>

            <p className="text-center text-sm text-slate-500">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => navigate({ name: 'auth', mode: isLogin ? 'signup' : 'login' })}
                className="text-sky-600 font-medium hover:text-sky-700 transition-colors"
              >
                {isLogin ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
