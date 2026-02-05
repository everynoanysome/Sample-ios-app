export const theme = {
  colors: {
    background: '#F8F7F4',
    surface: '#FFFFFF',
    surfaceAlt: '#F2F0EB',
    text: '#1C1C1E',
    textSecondary: '#6B6B6F',
    textTertiary: '#AEAEB2',
    accent: '#C45C4A',
    accentSoft: '#FBF0EE',
    success: '#5A8F65',
    successSoft: '#EBF4EC',
    border: '#E8E6E1',
    borderLight: '#F0EEEA',
    overlay: 'rgba(0,0,0,0.4)',
    tagColors: [
      '#C45C4A', // vermillion
      '#5A8F65', // moss green
      '#D4A574', // amber
      '#6B89A8', // steel blue
      '#9B7EBD', // wisteria
      '#C4856A', // terracotta
      '#7B9E87', // sage
      '#B08D57', // gold
    ],
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
  },
} as const;

export const JAPANESE_DAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

export const JAPANESE_DAY_MEANINGS = [
  'Sun', 'Moon', 'Fire', 'Water', 'Wood', 'Gold', 'Earth',
] as const;

export const DEFAULT_TAGS = [
  { id: 'tag-work', name: 'Work', color: '#6B89A8' },
  { id: 'tag-health', name: 'Health', color: '#5A8F65' },
  { id: 'tag-learning', name: 'Learning', color: '#D4A574' },
  { id: 'tag-creative', name: 'Creative', color: '#9B7EBD' },
  { id: 'tag-personal', name: 'Personal', color: '#C45C4A' },
];

export const ZEN_QUOTES = [
  'Three stones, placed with intention.',
  'Do less, but do it fully.',
  'The obstacle is the path.',
  'Begin again, with care.',
  'Simplicity is the ultimate sophistication.',
  'One step at a time.',
  'Be where you are.',
];

export function getTodayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function getJapaneseDay(): string {
  return JAPANESE_DAYS[new Date().getDay()];
}

export function getJapaneseDayMeaning(): string {
  return JAPANESE_DAY_MEANINGS[new Date().getDay()];
}

export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function getRandomZenQuote(): string {
  return ZEN_QUOTES[Math.floor(Math.random() * ZEN_QUOTES.length)];
}
