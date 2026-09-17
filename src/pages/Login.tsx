import { useState, FormEvent } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiLogin } from '../api/auth';

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { token, user } = await apiLogin(email.trim(), password);
      login(token, user);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base px-6"
         style={{ paddingTop: 'var(--sat)', paddingBottom: 'var(--sab)' }}>

      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <img src="/icons/icon-192.png" alt="TNL" className="w-16 h-16 rounded-2xl object-cover mb-4" />
        <h1 className="font-display text-4xl text-white tracking-wider">TNL Tracker</h1>
        <p className="text-sm text-[--fg-3] mt-1">VTC Driver Dashboard</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm card border-[--bd-gold]">
        <p className="eyebrow mb-5">Sign In</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[--fg-2] mb-1.5 tracking-wider uppercase">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              placeholder="your TNL account email"
              className="w-full px-4 py-3 rounded-lg bg-elevated border border-soft text-white text-sm
                         placeholder:text-[--fg-3] focus:outline-none focus:border-[--bd-gold]
                         transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[--fg-2] mb-1.5 tracking-wider uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-lg bg-elevated border border-soft text-white text-sm
                         placeholder:text-[--fg-3] focus:outline-none focus:border-[--bd-gold]
                         transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-3 text-sm mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>

      <p className="text-xs text-[--fg-3] mt-6 text-center">
        Use your TNL account email &amp; password
      </p>
    </div>
  );
}
