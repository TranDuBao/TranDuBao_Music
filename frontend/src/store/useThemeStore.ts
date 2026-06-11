import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggleTheme: () => void;
  initTheme: () => void;
}

const applyTheme = (dark: boolean) => {
  const html = document.documentElement;
  if (dark) {
    html.classList.add('dark');
    html.classList.remove('light');
  } else {
    html.classList.add('light');
    html.classList.remove('dark');
  }
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  isDark: true,

  initTheme: () => {
    const saved = localStorage.getItem('ms_theme');
    const dark = saved !== 'light';
    applyTheme(dark);
    set({ isDark: dark });
  },

  toggleTheme: () => {
    const newDark = !get().isDark;
    localStorage.setItem('ms_theme', newDark ? 'dark' : 'light');
    applyTheme(newDark);
    set({ isDark: newDark });
  },
}));
