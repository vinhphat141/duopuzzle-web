'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Lock, Star, Play } from 'lucide-react';
import { Chapter, Level } from '@/types/database';

interface DuolingoPathMapProps {
  chapters: Chapter[];
  levels: Level[];
  completedLevelIds: number[];
}

export default function DuolingoPathMap({
  chapters,
  levels,
  completedLevelIds,
}: DuolingoPathMapProps) {
  // Sắp xếp toàn bộ màn chơi theo thứ tự chương -> thứ tự màn
  const orderedLevels = [...levels].sort((a, b) => {
    const chapA = chapters.find((c) => c.id === a.chapter_id)?.order_index ?? 0;
    const chapB = chapters.find((c) => c.id === b.chapter_id)?.order_index ?? 0;
    if (chapA !== chapB) return chapA - chapB;
    return a.order_index - b.order_index;
  });

  // Tìm màn đầu tiên chưa hoàn thành để mở khóa
  const firstUncompletedId =
    orderedLevels.find((lvl) => !completedLevelIds.includes(lvl.id))?.id ?? -1;

  // Tạo độ lệch ngang hình sin tạo hiệu ứng đường đi dích-dắc đặc trưng của Duolingo
  const getHorizontalOffset = (index: number) => {
    const pattern = [0, -45, -65, -45, 0, 45, 65, 45];
    return pattern[index % pattern.length];
  };

  let globalNodeIndex = 0;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col gap-12">
      {chapters
        .sort((a, b) => a.order_index - b.order_index)
        .map((chapter, cIdx) => {
          const chapterLevels = orderedLevels.filter((l) => l.chapter_id === chapter.id);
          const bannerColors = [
            'bg-emerald-500 border-emerald-700',
            'bg-sky-500 border-sky-700',
            'bg-violet-500 border-violet-700',
            'bg-amber-500 border-amber-700',
          ];
          const bannerClass = bannerColors[cIdx % bannerColors.length];

          return (
            <section key={chapter.id} className="flex flex-col items-center">
              {/* Banner Chương */}
              <div className={`w-full p-5 rounded-3xl text-white border-b-4 shadow-sm mb-10 ${bannerClass}`}>
                <h2 className="text-xl font-extrabold">{chapter.title}</h2>
                {chapter.description && (
                  <p className="text-sm text-white/90 mt-1">{chapter.description}</p>
                )}
              </div>

              {/* Đường đi các Node tròn */}
              <div className="flex flex-col items-center gap-7 w-full">
                {chapterLevels.map((level) => {
                  const isCompleted = completedLevelIds.includes(level.id);
                  const isUnlocked = isCompleted || level.id === firstUncompletedId;
                  const offsetX = getHorizontalOffset(globalNodeIndex++);

                  return (
                    <div
                      key={level.id}
                      style={{ transform: `translateX(${offsetX}px)` }}
                      className="flex flex-col items-center relative group"
                    >
                      {isUnlocked && !isCompleted && (
                        <div className="mb-2 px-3 py-1 bg-white text-emerald-600 font-extrabold text-xs uppercase rounded-xl border-2 border-slate-200 shadow-sm animate-bounce">
                          BẮT ĐẦU
                        </div>
                      )}

                      {isUnlocked ? (
                        <Link
                          href={`/play/${level.id}`}
                          className={`w-20 h-20 rounded-full flex items-center justify-center border-b-[6px] active:translate-y-1 transition-all shadow-md
                            ${isCompleted
                              ? 'bg-amber-400 border-amber-600 text-white hover:bg-amber-300'
                              : 'bg-emerald-500 border-emerald-700 text-white hover:bg-emerald-400'
                            }
                          `}
                        >
                          {isCompleted ? (
                            <Check className="w-9 h-9 stroke-[3]" />
                          ) : (
                            <Play className="w-8 h-8 fill-white ml-1" />
                          )}
                        </Link>
                      ) : (
                        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-slate-200 border-b-[6px] border-slate-300 text-slate-400 cursor-not-allowed">
                          <Lock className="w-7 h-7" />
                        </div>
                      )}

                      <span className="mt-2 text-sm font-bold text-slate-700 text-center max-w-[140px]">
                        {level.title}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> +{level.xp_reward} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
    </div>
  );
}