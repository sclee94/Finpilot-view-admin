import type { User } from '../types';

const USER_KEY = 'loginUser';

export const authStorage = {
  save: (user: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  get: (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  clear: () => {
    localStorage.removeItem(USER_KEY);
  },
};
