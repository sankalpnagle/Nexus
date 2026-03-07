import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { Button, Input } from '../components/ui';
import { Zap, Shield, Users, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const features = [
  { icon: Users, label: 'Connect with friends and discover new people' },
  { icon: MessageCircle, label: 'Real-time messaging with read receipts' },
  { icon: Shield, label: 'Your data secured with row-level access control' },
  { icon: Zap, label: 'Live updates via WebSocket connections' },
];

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', birthday: '' });
  const { login, register } = useAuth();
  const nav = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form);
      nav('/');
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#0d0f14] border-r border-[#232736] p-12 relative overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#00d4b4 1px, transparent 1px), linear-gradient(90deg, #00d4b4 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-[#00d4b4] opacity-[0.06] rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-[#00d4b4] flex items-center justify-center shadow-[0_0_30px_rgba(0,212,180,0.4)]">
              <span className="text-[#0d0f14] font-black text-xl font-[var(--font-display)]">N</span>
            </div>
            <span className="text-2xl font-black text-[#f4f6fc] font-[var(--font-display)] tracking-tight">Nexus</span>
          </div>
          <p className="text-[#6b7280] text-sm">Social platform for the modern web.</p>
        </div>

        <div className="relative space-y-4">
          <h1 className="text-4xl font-black text-[#f4f6fc] leading-tight font-[var(--font-display)] tracking-tight">
            Connect with<br />
            <span className="text-[#00d4b4]">your world.</span>
          </h1>
          <p className="text-[#6b7280] text-lg leading-relaxed">
            Share moments, build communities, and stay connected — all in one place.
          </p>
          <div className="space-y-3 pt-2">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[rgba(0,212,180,0.1)] flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-[#00d4b4]" />
                </div>
                <p className="text-sm text-[#9ca3af]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-[#6b7280]">
          © 2025 Nexus — Built with MERN + Tailwind CSS v4
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#0d0f14]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-[#00d4b4] flex items-center justify-center">
              <span className="text-[#0d0f14] font-black text-lg font-[var(--font-display)]">N</span>
            </div>
            <span className="text-xl font-black text-[#f4f6fc] font-[var(--font-display)]">Nexus</span>
          </div>

          <div className="bg-[#13161e] border border-[#232736] rounded-2xl p-7">
            <h2 className="text-xl font-bold text-[#f4f6fc] mb-1 font-[var(--font-display)]">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-sm text-[#6b7280] mb-6">
              {isLogin ? 'Sign in to your Nexus account' : 'Join Nexus in seconds'}
            </p>

            <form onSubmit={submit} className="space-y-3">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="First name" value={form.firstName} onChange={set('firstName')} required />
                  <Input placeholder="Last name" value={form.lastName} onChange={set('lastName')} required />
                </div>
              )}
              <Input type="email" placeholder="Email address" value={form.email} onChange={set('email')} required />
              <Input type="password" placeholder="Password" value={form.password} onChange={set('password')} required />
              {!isLogin && (
                <Input type="date" label="Birthday (optional)" value={form.birthday} onChange={set('birthday')} />
              )}
              <Button type="submit" variant="primary" fullWidth size="lg" loading={loading} className="mt-1">
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-[#232736]" />
              <span className="text-xs text-[#6b7280]">or</span>
              <div className="flex-1 h-px bg-[#232736]" />
            </div>

            <Button variant="outline" fullWidth onClick={() => setIsLogin(v => !v)}>
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
