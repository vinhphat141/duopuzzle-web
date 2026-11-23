'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LetterSlot } from '@/types/database';
import { normalizeVietnameseText } from '@/lib/utils/textNormalize';

interface LetterBoxPuzzleProps {
  questionId: number;
  prompt: string;
  slots: LetterSlot[];
  disabled?: boolean;
  revealedAnswer?: string | null;
  status: 'idle' | 'checking' | 'correct' | 'wrong';
  onSubmitAnswer: (userAnswer: string) => void;
}

export default function LetterBoxPuzzle({
  questionId,
  prompt,
  slots,
  disabled = false,
  revealedAnswer = null,
  status,
  onSubmitAnswer,
}: LetterBoxPuzzleProps) {
  const createInitialValues = () =>
    slots.map((slot) => (slot.hint !== null ? slot.hint : ''));

  const [values, setValues] = useState<string[]>(createInitialValues);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setValues(createInitialValues());
    const firstEditable = slots.findIndex((s) => !s.is_separator && s.hint === null);
    if (firstEditable !== -1) {
      setTimeout(() => inputRefs.current[firstEditable]?.focus(), 50);
    }
  }, [questionId]);

  // Khi server xác nhận đúng và trả về đáp án có dấu đầy đủ, lật sang đáp án có dấu
  useEffect(() => {
    if (status === 'correct' && revealedAnswer) {
      const accentedChars = revealedAnswer.toUpperCase().trim().split('');
      if (accentedChars.length === slots.length) {
        setValues(accentedChars);
      }
    }
  }, [status, revealedAnswer, slots.length]);

  const isLocked = (idx: number) =>
    disabled || slots[idx].is_separator || slots[idx].hint !== null;

  const handleChange = (index: number, rawVal: string) => {
    if (isLocked(index)) return;
    const cleanChar = normalizeVietnameseText(rawVal).slice(-1);
    const nextValues = [...values];
    nextValues[index] = cleanChar;
    setValues(nextValues);

    if (cleanChar) {
      for (let i = index + 1; i < slots.length; i++) {
        if (!isLocked(i)) {
          inputRefs.current[i]?.focus();
          break;
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index]) {
      for (let i = index - 1; i >= 0; i--) {
        if (!isLocked(i)) {
          const nextValues = [...values];
          nextValues[i] = '';
          setValues(nextValues);
          inputRefs.current[i]?.focus();
          break;
        }
      }
    } else if (e.key === 'Enter') {
      handleCheck();
    }
  };

  const handleCheck = () => {
    if (disabled || status === 'checking' || status === 'correct') return;
    const assembled = values.join('');
    onSubmitAnswer(assembled);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 sm:p-8 bg-white rounded-3xl shadow-sm border-2 border-slate-200 w-full">
      <span className="px-3 py-1 bg-sky-100 text-sky-700 text-xs font-extrabold uppercase tracking-wider rounded-full">
        Điền ô chữ gợi ý
      </span>

      <p className="text-lg sm:text-xl font-bold text-slate-800 text-center leading-relaxed">
        {prompt}
      </p>

      <div className="flex flex-wrap justify-center gap-2 my-2">
        {slots.map((slot, idx) => {
          if (slot.is_separator) {
            return (
              <div key={idx} className="w-4 sm:w-6 flex items-center justify-center font-bold text-slate-400">
                {slot.hint === '-' ? '-' : ''}
              </div>
            );
          }

          const isHint = slot.hint !== null;

          return (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="text"
              autoComplete="off"
              maxLength={2}
              value={values[idx] ?? ''}
              disabled={isHint || disabled || status === 'correct'}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-extrabold uppercase rounded-2xl border-b-4 transition-all outline-none
                ${isHint
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-800 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-sky-500 focus:bg-sky-50 focus:-translate-y-0.5'
                }
                ${status === 'wrong' && !isHint ? 'border-rose-500 bg-rose-50 text-rose-700' : ''}
                ${status === 'correct' ? 'border-emerald-500 bg-emerald-100 text-emerald-800' : ''}
              `}
            />
          );
        })}
      </div>

      <button
        onClick={handleCheck}
        disabled={disabled || status === 'checking' || status === 'correct'}
        className="w-full sm:w-auto px-10 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:border-slate-400 active:translate-y-0.5 text-white font-extrabold rounded-2xl border-b-4 border-emerald-700 transition cursor-pointer"
      >
        {status === 'checking' ? 'ĐANG KIỂM TRA...' : 'KIỂM TRA'}
      </button>
    </div>
  );
}