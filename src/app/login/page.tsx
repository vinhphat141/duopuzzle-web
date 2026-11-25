'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getGuestProgress, clearGuestProgress } from '@/lib/utils/guestStorage';

export default function LoginPage() {
  const supabase = createClient();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
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
      const displayName = username.trim() || email.split('@')[0];
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
          },
        },
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else if (data.session && data.user) {
        // Khi đã tắt Confirm email trên Supabase, tài khoản được đăng nhập ngay
        await syncGuestDataToAccount(data.user.id);
        window.location.href = '/';
        return;
      } else {
        setMessage({
          type: 'success',
          text: 'Đăng ký thành công! Vui lòng kiểm tra hộp thư email để xác nhận trước khi đăng nhập.',
        });
        setIsSignUp(false);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({
          type: 'error',
          text:
            error.message === 'Invalid login credentials'
              ? 'Sai email hoặc mật khẩu!'
              : error.message,
        });
      } else if (data.user) {
        await syncGuestDataToAccount(data.user.id);
        window.location.href = '/';
        return;
      }
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({
        type: 'error',
        text: 'Đăng nhập Google chưa được bật trên Supabase. Vui lòng dùng Email/Mật khẩu hoặc cấu hình Google OAuth.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại bản đồ</span>
        </Link>
      </div>

      <div className="max-w-md w-full bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col gap-5">
        <h1 className="text-2xl font-extrabold text-center text-slate-800">
          {isSignUp ? 'Tạo tài khoản mới' : 'Đăng nhập DuoPuzzle'}
        </h1>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-3 px-4 rounded-2xl border-2 border-b-4 border-slate-200 hover:bg-slate-50 font-bold text-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Tiếp tục với Google</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200" />
          <span className="flex-shrink mx-3 text-xs font-bold text-slate-400 uppercase">Hoặc Email</span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          {isSignUp && (
            <input
              type="text"
              required
              placeholder="Tên hiển thị (VD: Minh Anh)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-sky-500 outline-none font-medium"
            />
          )}

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

          {message && (
            <p
              className={`text-sm font-semibold text-center ${
                message.type === 'error' ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-extrabold rounded-2xl border-b-4 border-emerald-700 transition cursor-pointer"
          >
            {loading ? 'Đang xử lý...' : isSignUp ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage(null);
          }}
          className="text-sm font-bold text-sky-600 hover:underline text-center cursor-pointer"
        >
          {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
        </button>
      </div>
    </div>
  );
}