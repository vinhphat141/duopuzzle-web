export type QuestionType = 'letter_boxes' | 'fill_blank';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
  role: 'player' | 'admin';
  updated_at: string;
}

export interface Chapter {
  id: number;
  title: string;
  description: string | null;
  order_index: number;
}

export interface Level {
  id: number;
  chapter_id: number;
  title: string;
  order_index: number;
  xp_reward: number;
}

export interface LetterSlot {
  is_separator: boolean;
  hint: string | null;
}

export interface SafeQuestion {
  id: number;
  type: QuestionType;
  prompt: string;
  order_index: number;
  slots: LetterSlot[] | null;
}

export interface VerifyAnswerResponse {
  is_correct: boolean;
  full_answer: string | null;
  error?: string;
}