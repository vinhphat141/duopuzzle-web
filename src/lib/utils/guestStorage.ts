// src/lib/utils/guestStorage.ts
const GUEST_KEY = 'duopuzzle_guest_progress_v1';

export interface GuestProgress {
  completedLevelIds: number[];
  guestXp: number;
}

export function getGuestProgress(): GuestProgress {
  if (typeof window === 'undefined') return { completedLevelIds: [], guestXp: 0 };
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : { completedLevelIds: [], guestXp: 0 };
  } catch {
    return { completedLevelIds: [], guestXp: 0 };
  }
}

export function saveGuestLevelComplete(levelId: number, xpReward: number): GuestProgress {
  const current = getGuestProgress();
  if (!current.completedLevelIds.includes(levelId)) {
    const updated: GuestProgress = {
      completedLevelIds: [...current.completedLevelIds, levelId],
      guestXp: current.guestXp + xpReward,
    };
    localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
    return updated;
  }
  return current;
}

export function clearGuestProgress() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_KEY);
  }
}