'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Zap, Trophy, Swords, ShieldCheck, LogOut, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { getGuestProgress } from '@/lib/utils/guestStorage';

export default function Navbar() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [guestXp, setGuestXp] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      } else {
        setGuestXp(getGuestProgress().guestXp);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b-2 border-slate-200">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-xl text-emerald-600 tracking-tight">
          <span className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
            D
          </span>
          <span className="hidden sm:inline">DuoPuzzle</span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/arena"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition"
          >
            <Swords className="w-4 h-4" />
            <span>Đấu 10 Người</span>
          </Link>

          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Xếp hạng</span>
          </Link>

          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-sm text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Quản trò</span>
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-orange-500 font-extrabold text-sm" title="Chuỗi ngày chơi">
            <Flame className="w-5 h-5 fill-orange-500" />
            <span>{profile?.current_streak ?? 0}</span>
          </div>

          <div className="flex items-center gap-1 text-amber-500 font-extrabold text-sm" title="Điểm kinh nghiệm XP">
            <Zap className="w-5 h-5 fill-amber-400" />
            <span>{profile ? profile.total_xp : guestXp}</span>
          </div>

          {profile ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <span className="text-sm font-bold text-slate-700 hidden md:inline max-w-[110px] truncate">
                {profile.username}
              </span>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold rounded-xl border-b-4 border-emerald-700 transition"
            >
              <User className="w-4 h-4" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}