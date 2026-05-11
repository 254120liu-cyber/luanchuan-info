export const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'job', label: '求职招聘' },
  { key: 'house', label: '房屋租售' },
  { key: 'secondhand', label: '二手交易' },
  { key: 'service', label: '生活服务' },
  { key: 'carpool', label: '顺风车' },
  { key: 'lostfound', label: '寻人寻物' },
  { key: 'help', label: '打听求助' },
  { key: 'other', label: '其他' }
] as const;

export const TOWNS = [
  { key: 'chengguan', label: '城关镇（县城）' },
  { key: 'tantou', label: '潭头镇' },
  { key: 'sanchuan', label: '三川镇' },
  { key: 'lengshui', label: '冷水镇' },
  { key: 'jiaohe', label: '叫河镇' },
  { key: 'taowan', label: '陶湾镇' },
  { key: 'chitudian', label: '赤土店镇' },
  { key: 'miaozi', label: '庙子镇' },
  { key: 'heyu', label: '合峪镇' },
  { key: 'luanchuanxiang', label: '栾川乡' }
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  all: '#FF6B4A',
  job: '#FF6B4A',
  house: '#3498DB',
  secondhand: '#00B894',
  service: '#6C5CE7',
  carpool: '#F39C12',
  lostfound: '#E17055',
  help: '#00CEC9',
  other: '#636E72'
};

export const POST_EXPIRE_HOURS = 720; // 30 days
export const LOCAL_DOMAIN = '@lc.local';

export type PostStatus = 'normal' | 'reported' | 'deleted';
export type BanStatus = 'normal' | 'temp_banned' | 'perm_banned';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export type CategoryKey = typeof CATEGORIES[number]['key'];
export type TownKey = typeof TOWNS[number]['key'];

// O(1) lookup maps
export const catMap: Record<string, { label: string; color: string }> = {};
CATEGORIES.forEach(c => {
  catMap[c.key] = { label: c.label, color: CATEGORY_COLORS[c.key] || CATEGORY_COLORS.other };
});

export const townMap: Record<string, string> = {};
TOWNS.forEach(t => { townMap[t.key] = t.label; });

// Formatting
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return minutes + '分钟前';
  if (hours < 24) return hours + '小时前';
  if (days < 3) return days + '天前';
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return y + '-' + m + '-' + day;
}

export function getRemainingHours(expireAt: string | Date): number {
  const now = new Date();
  const expire = new Date(expireAt);
  return Math.max(0, Math.ceil((expire.getTime() - now.getTime()) / 3600000));
}
