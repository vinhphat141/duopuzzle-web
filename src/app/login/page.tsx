'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getGuestProgress, clearGuestProgress } from '@/lib/utils/guestStorage';

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const syncGuestDataToAccount = async (userId: string) => {
    const guest = getGuestProgress();
    if (guest.completedLevelIds.length === 0) return;

    const rows = guest.completedLevelIds.map((lvlId) => ({
      user_id: userId,
      level_id: lvlId,
      stars: 3,
    }));

    await supabase.from('user_progress').upsert(rows, { onConflict: 'user_id,level_id' });
    if (guest.guestXp > 0) {
      await supabase.rpc('award_xp', { xp_to_add: guest.guestXp });
    }
    clearGuestProgress();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Đăng ký thành công! Vui lòng kiểm tra email hoặc đăng nhập ngay.');
        setIsSignUp(false);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else if (data.user) {
        await syncGuestDataToAccount(data.user.id);
        router.push('/');
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col gap-5">
        <h1 className="text-2xl font-extrabold text-center text-slate-800">
          {isSignUp ? 'Tạo tài khoản mới' : 'Đăng nhập DuoPuzzle'}
        </h1>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-3 px-4 rounded-2xl border-2 border-b-4 border-slate-200 hover:bg-slate-50 font-bold text-slate-700 transition flex items-center justify-center gap-2"
        >
          <span>Tiếp tục với Google</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200" />
          <span className="flex-shrink mx-3 text-xs font-bold text-slate-400 uppercase">Hoặc Email</span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="Email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 outline-none font-medium"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Mật khẩu (tối thiểu 6 ký tự)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 outline-none font-medium"
          />

          {message && <p className="text-sm font-semibold text-rose-600 text-center">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl border-b-4 border-emerald-700 transition"
          >
            {loading ? 'Đang xử lý...' : isSignUp ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm font-bold text-sky-600 hover:underline text-center"
        >
          {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
        </button>
      </div>
    </div>
  );
}