'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { X, Heart, CheckCircle2, XCircle, ArrowRight, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Level, SafeQuestion, VerifyAnswerResponse } from '@/types/database';
import LetterBoxPuzzle from '@/components/game/LetterBoxPuzzle';
import FillBlankPuzzle from '@/components/game/FillBlankPuzzle';
import { saveGuestLevelComplete } from '@/lib/utils/guestStorage';

export default function PlayLevelPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const levelId = Number(params.levelId);

  const [level, setLevel] = useState<Level | null>(null);
  const [questions, setQuestions] = useState<SafeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [status, setStatus] = useState<'idle' | 'checking' | 'correct' | 'wrong'>('idle');
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLevelData = async () => {
      const [{ data: lvl }, { data: safeQs }] = await Promise.all([
        supabase.from('levels').select('*').eq('id', levelId).single(),
        supabase.rpc('get_safe_questions_by_level', { p_level_id: levelId }),
      ]);

      if (lvl) setLevel(lvl);
      if (safeQs) setQuestions(safeQs as SafeQuestion[]);
      setLoading(false);
    };

    if (levelId) loadLevelData();
  }, [levelId]);

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  const handleVerifyAnswer = async (userAnswer: string) => {
    if (!currentQuestion) return;
    setStatus('checking');

    const { data, error } = await supabase.rpc('verify_question_answer', {
      p_question_id: currentQuestion.id,
      p_user_answer: userAnswer,
    });

    if (error || !data) {
      setStatus('idle');
      return;
    }

    const res = data as VerifyAnswerResponse;
    if (res.is_correct) {
      setStatus('correct');
      setRevealedAnswer(res.full_answer);
    } else {
      setStatus('wrong');
      setHearts((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setStatus('idle');
      setRevealedAnswer(null);
    } else {
      // Hoàn thành màn chơi -> Lưu tiến độ & cộng XP
      setIsFinished(true);
      const xpReward = level?.xp_reward ?? 20;
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: existing } = await supabase
          .from('user_progress')
          .select('level_id')
          .eq('user_id', user.id)
          .eq('level_id', levelId)
          .maybeSingle();

        if (!existing) {
          await supabase.from('user_progress').insert({
            user_id: user.id,
            level_id: levelId,
            stars: hearts,
          });
          await supabase.rpc('award_xp', { xp_to_add: xpReward });
        }
      } else {
        saveGuestLevelComplete(levelId, xpReward);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">
        Đang chuẩn bị câu đố...
      </div>
    );
  }

  // Màn hình hết mạng sống
  if (hearts === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center">
          <Heart className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800">Bạn đã hết lượt thử!</h1>
        <p className="text-slate-500 max-w-sm">Hãy thử lại màn chơi này để rèn luyện trí nhớ nhé.</p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-2xl font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 transition"
          >
            Về bản đồ
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-2xl font-bold text-white bg-emerald-500 border-b-4 border-emerald-700 hover:bg-emerald-600 transition"
          >
            Chơi lại
          </button>
        </div>
      </div>
    );
  }

  // Màn hình hoàn thành màn chơi
  if (isFinished) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center gap-6">
        <div className="w-24 h-24 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center animate-bounce">
          <Trophy className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-extrabold text-emerald-600">Hoàn thành xuất sắc!</h1>
        <div className="px-6 py-4 bg-white rounded-2xl border-2 border-amber-300 shadow-sm">
          <p className="text-xs font-extrabold uppercase text-slate-400">Phần thưởng nhận được</p>
          <p className="text-2xl font-black text-amber-500 mt-1">+{level?.xp_reward ?? 20} XP</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="px-10 py-3.5 rounded-2xl font-extrabold text-white bg-emerald-500 border-b-4 border-emerald-700 hover:bg-emerald-600 transition"
        >
          TIẾP TỤC HÀNH TRÌNH
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Thanh tiến trình & Tim */}
      <div className="max-w-3xl w-full mx-auto px-4 pt-6 flex items-center gap-4">
        <button
          onClick={() => router.push('/')}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center gap-1.5 text-rose-500 font-extrabold">
          <Heart className="w-6 h-6 fill-rose-500" />
          <span>{hearts}</span>
        </div>
      </div>

      {/* Khu vực câu hỏi */}
      <main className="max-w-2xl w-full mx-auto px-4 my-auto py-8">
        {currentQuestion?.type === 'letter_boxes' && currentQuestion.slots && (
          <LetterBoxPuzzle
            questionId={currentQuestion.id}
            prompt={currentQuestion.prompt}
            slots={currentQuestion.slots}
            status={status}
            revealedAnswer={revealedAnswer}
            onSubmitAnswer={handleVerifyAnswer}
          />
        )}

        {currentQuestion?.type === 'fill_blank' && (
          <FillBlankPuzzle
            questionId={currentQuestion.id}
            prompt={currentQuestion.prompt}
            status={status}
            revealedAnswer={revealedAnswer}
            onSubmitAnswer={handleVerifyAnswer}
          />
        )}
      </main>

      {/* Thanh phản hồi dưới đáy màn hình kiểu Duolingo */}
      <footer
        className={`border-t-2 transition-colors duration-200 ${
          status === 'correct'
            ? 'bg-emerald-100 border-emerald-300'
            : status === 'wrong'
            ? 'bg-rose-100 border-rose-300'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {status === 'correct' && (
            <>
              <div className="flex items-center gap-3 text-emerald-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-extrabold text-lg">Chính xác!</p>
                  {revealedAnswer && (
                    <p className="text-sm font-semibold">Đáp án chuẩn: {revealedAnswer}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleNext}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl border-b-4 border-emerald-700 transition"
              >
                <span>TIẾP TỤC</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {status === 'wrong' && (
            <>
              <div className="flex items-center gap-3 text-rose-800">
                <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
                <div>
                  <p className="font-extrabold text-lg">Chưa chính xác!</p>
                  <p className="text-sm font-semibold">Hãy kiểm tra lại chữ cái và thử lại nhé.</p>
                </div>
              </div>
              <button
                onClick={() => setStatus('idle')}
                className="w-full sm:w-auto px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-2xl border-b-4 border-rose-700 transition"
              >
                THỬ LẠI
              </button>
            </>
          )}

          {(status === 'idle' || status === 'checking') && (
            <p className="text-sm font-semibold text-slate-400">
              Câu {currentIndex + 1} / {questions.length}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}