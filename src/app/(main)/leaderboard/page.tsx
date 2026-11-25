'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Trophy, Crown, Flame, Zap, RefreshCw, User } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

export default function LeaderboardPage() {
  const supabase = createClient();
  const [leaders, setLeaders] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);

    const [{ data: topData }, { data: { user } }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .order('total_xp', { ascending: false })
        .order('updated_at', { ascending: true })
        .limit(50),
      supabase.auth.getUser(),
    ]);

    const list = (topData as Profile[]) || [];
    setLeaders(list);

    if (user) {
      setCurrentUserId(user.id);
      const indexInTop = list.findIndex((p) => p.id === user.id);

      if (indexInTop !== -1) {
        setMyProfile(list[indexInTop]);
        setMyRank(indexInTop + 1);
      } else {
        const { data: userProf } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userProf) {
          setMyProfile(userProf as Profile);
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gt('total_xp', userProf.total_xp);
          setMyRank((count ?? 0) + 1);
        }
      }
    } else {
      setCurrentUserId(null);
      setMyProfile(null);
      setMyRank(null);
    }

    setLoading(false);
    setRefreshing(false);
  }, [supabase]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const showPodium = leaders.length >= 3;
  const remainingList = showPodium ? leaders.slice(3) : leaders;
  const startRank = showPodium ? 4 : 1;

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-8">
        {/* Header Bảng Xếp Hạng */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-6 text-white border-b-4 border-orange-600 shadow-sm flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">Bảng Xếp Hạng</h1>
              <p className="text-sm text-white/90 font-medium mt-0.5">
                Top 50 người chơi có điểm kinh nghiệm (XP) cao nhất
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchLeaderboard(true)}
            disabled={refreshing}
            title="Làm mới thứ hạng"
            className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 active:scale-95 transition cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Banner nhắc đăng nhập nếu đang chơi chế độ Khách */}
        {!loading && !currentUserId && (
          <div className="mb-6 p-4 bg-sky-50 border-2 border-sky-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm font-bold text-sky-800 text-center sm:text-left">
              Đăng nhập để lưu điểm XP và ghi tên mình lên bảng xếp hạng!
            </p>
            <Link
              href="/login"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold rounded-xl border-b-4 border-sky-700 transition shrink-0"
            >
              ĐĂNG NHẬP NGAY
            </Link>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-16 bg-white rounded-2xl border-2 border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-10 text-center">
            <p className="font-extrabold text-slate-700 text-lg">Chưa có dữ liệu xếp hạng</p>
            <p className="text-sm text-slate-500 mt-1">
              Hãy là người đầu tiên đăng ký tài khoản và hoàn thành màn chơi để chiếm ngôi đầu!
            </p>
          </div>
        ) : (
          <>
            {/* Bục vinh danh Top 3 (hiển thị khi có từ 3 người chơi trở lên) */}
            {showPodium && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end mb-8 pt-6">
                {/* Hạng 2 */}
                <PodiumCard player={leaders[1]} rank={2} isMe={leaders[1].id === currentUserId} />
                {/* Hạng 1 */}
                <PodiumCard player={leaders[0]} rank={1} isMe={leaders[0].id === currentUserId} />
                {/* Hạng 3 */}
                <PodiumCard player={leaders[2]} rank={3} isMe={leaders[2].id === currentUserId} />
              </div>
            )}

            {/* Danh sách xếp hạng chi tiết */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
              {remainingList.map((player, idx) => {
                const rank = startRank + idx;
                const isMe = player.id === currentUserId;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between px-4 sm:px-6 py-3.5 border-b last:border-b-0 border-slate-100 transition
                      ${isMe ? 'bg-emerald-50/90' : 'hover:bg-slate-50'}
                    `}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <span
                        className={`w-8 text-center font-extrabold text-sm shrink-0 ${
                          rank === 1
                            ? 'text-amber-500 text-base'
                            : rank === 2
                            ? 'text-slate-500 text-base'
                            : rank === 3
                            ? 'text-amber-700 text-base'
                            : 'text-slate-400'
                        }`}
                      >
                        #{rank}
                      </span>

                      <AvatarBadge username={player.username} avatarUrl={player.avatar_url} />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-slate-800 truncate text-sm sm:text-base">
                            {player.username}
                          </p>
                          {isMe && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-emerald-500 text-white rounded-md shrink-0">
                              Bạn
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-orange-500 mt-0.5">
                          <Flame className="w-3.5 h-3.5 fill-orange-500" />
                          <span>{player.current_streak} ngày</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 font-extrabold text-amber-500 text-sm sm:text-base shrink-0 ml-2">
                      <Zap className="w-4 h-4 fill-amber-400" />
                      <span>{player.total_xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Thanh ghim thứ hạng cá nhân ở đáy màn hình nếu đã đăng nhập */}
      {myProfile && myRank !== null && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t-2 border-emerald-400 shadow-lg z-30">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold text-sm">
                Hạng #{myRank}
              </span>
              <span className="font-extrabold text-slate-800 text-sm sm:text-base truncate max-w-[160px] sm:max-w-xs">
                {myProfile.username}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-black text-amber-500">
              <Zap className="w-5 h-5 fill-amber-400" />
              <span>{myProfile.total_xp.toLocaleString()} XP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AvatarBadge({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 shrink-0"
      />
    );
  }

  const initial = username?.charAt(0)?.toUpperCase() || <User className="w-5 h-5" />;
  return (
    <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 border-2 border-sky-200 font-extrabold flex items-center justify-center shrink-0">
      {initial}
    </div>
  );
}

function PodiumCard({
  player,
  rank,
  isMe,
}: {
  player: Profile;
  rank: 1 | 2 | 3;
  isMe: boolean;
}) {
  const styles = {
    1: {
      height: 'pt-6 pb-5',
      border: 'border-amber-400 bg-amber-50/70',
      badge: 'bg-amber-400 text-white',
    },
    2: {
      height: 'pt-4 pb-4',
      border: 'border-slate-300 bg-white',
      badge: 'bg-slate-400 text-white',
    },
    3: {
      height: 'pt-3 pb-4',
      border: 'border-orange-300 bg-orange-50/40',
      badge: 'bg-amber-700 text-white',
    },
  }[rank];

  return (
    <div
      className={`rounded-3xl border-2 border-b-4 px-2 sm:px-3 flex flex-col items-center text-center relative shadow-sm ${styles.height} ${styles.border}`}
    >
      {rank === 1 && (
        <Crown className="w-7 h-7 text-amber-500 fill-amber-400 -mt-10 mb-1 drop-shadow-sm" />
      )}

      <div className="relative mb-2">
        <AvatarBadge username={player.username} avatarUrl={player.avatar_url} />
        <span
          className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center shadow ${styles.badge}`}
        >
          {rank}
        </span>
      </div>

      <p className="font-extrabold text-slate-800 text-xs sm:text-sm truncate w-full">
        {player.username} {isMe ? '(Bạn)' : ''}
      </p>

      <div className="mt-1 flex items-center gap-0.5 text-xs font-black text-amber-500">
        <Zap className="w-3.5 h-3.5 fill-amber-400" />
        <span>{player.total_xp}</span>
      </div>
    </div>
  );
}