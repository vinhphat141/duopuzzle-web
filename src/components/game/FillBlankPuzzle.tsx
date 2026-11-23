'use client';

import React, { useState, useEffect, useRef } from 'react';

interface FillBlankPuzzleProps {
  questionId: number;
  prompt: string;
  disabled?: boolean;
  revealedAnswer?: string | null;
  status: 'idle' | 'checking' | 'correct' | 'wrong';
  onSubmitAnswer: (userAnswer: string) => void;
}

export default function FillBlankPuzzle({
  questionId,
  prompt,
  disabled = false,
  revealedAnswer = null,
  status,
  onSubmitAnswer,
}: FillBlankPuzzleProps) {
  const [answerText, setAnswerText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setAnswerText('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [questionId]);

  useEffect(() => {
    if (status === 'correct' && revealedAnswer) {
      setAnswerText(revealedAnswer);
    }
  }, [status, revealedAnswer]);

  const parts = prompt.split('___');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || disabled || status === 'checking' || status === 'correct') return;
    onSubmitAnswer(answerText);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center gap-6 p-6 sm:p-8 bg-white rounded-3xl shadow-sm border-2 border-slate-200 w-full"
    >
      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-extrabold uppercase tracking-wider rounded-full">
        Điền từ vào chỗ trống
      </span>

      <div className="text-lg sm:text-xl font-bold text-slate-800 text-center leading-loose">
        {parts.length > 1 ? (
          <>
            <span>{parts[0]}</span>
            <span className="inline-block mx-2 px-4 py-0.5 min-w-[130px] border-b-4 border-dashed border-sky-400 text-sky-600 font-extrabold bg-sky-50 rounded-lg">
              {answerText || '?'}
            </span>
            <span>{parts.slice(1).join('___')}</span>
          </>
        ) : (
          <p>{prompt}</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={answerText}
        disabled={disabled || status === 'correct'}
        onChange={(e) => setAnswerText(e.target.value)}
        placeholder="Nhập từ còn thiếu..."
        className={`w-full max-w-md px-5 py-3.5 text-center text-lg font-bold rounded-2xl border-2 border-b-4 outline-none transition
          ${status === 'wrong'
            ? 'border-rose-500 bg-rose-50 text-rose-700'
            : status === 'correct'
            ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
            : 'border-slate-300 bg-slate-50 text-slate-800 focus:border-sky-500 focus:bg-white'
          }
        `}
      />

      <button
        type="submit"
        disabled={!answerText.trim() || disabled || status === 'checking' || status === 'correct'}
        className="w-full sm:w-auto px-10 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:border-slate-400 active:translate-y-0.5 text-white font-extrabold rounded-2xl border-b-4 border-emerald-700 transition cursor-pointer"
      >
        {status === 'checking' ? 'ĐANG KIỂM TRA...' : 'KIỂM TRA'}
      </button>
    </form>
  );
}