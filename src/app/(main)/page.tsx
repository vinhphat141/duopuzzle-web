'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/shared/Navbar';
import DuolingoPathMap from '@/components/game/DuolingoPathMap';
import { createClient } from '@/lib/supabase/client';
import { Chapter, Level } from '@/types/database';
import { getGuestProgress } from '@/lib/utils/guestStorage';

export default function HomePage() {
  const supabase = createClient();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: chapData }, { data: lvlData }, { data: { user } }] = await Promise.all([
        supabase.from('chapters').select('*').order('order_index'),
        supabase.from('levels').select('*').order('order_index'),
        supabase.auth.getUser(),
      ]);

      if (chapData) setChapters(chapData);
      if (lvlData) setLevels(lvlData);

      if (user) {
        const { data: progData } = await supabase
          .from('user_progress')
          .select('level_id')
          .eq('user_id', user.id);
        if (progData) {
          setCompletedIds(progData.map((p) => p.level_id));
        }
      } else {
        setCompletedIds(getGuestProgress().completedLevelIds);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pb-20">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400 font-bold">
            Đang tải bản đồ hành trình...
          </div>
        ) : (
          <DuolingoPathMap
            chapters={chapters}
            levels={levels}
            completedLevelIds={completedIds}
          />
        )}
      </main>
    </div>
  );
}