const HISTORY_KEY = 'browseHistory';
const HISTORY_MAX = 50;

interface HistoryItem {
  _id: string;
  content: string;
  category: string;
  categoryLabel: string;
  townLabel: string;
  timeText: string;
}

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

export function addHistory(post: {
  _id?: string;
  id?: string;
  content: string;
  category: string;
  categoryLabel: string;
  townLabel: string;
  timeText: string;
}) {
  if (typeof window === 'undefined') return;
  const history = getHistory();
  const postId = post._id || post.id || '';
  const idx = history.findIndex(h => h._id === postId);
  if (idx >= 0) history.splice(idx, 1);
  history.unshift({
    _id: postId,
    content: post.content,
    category: post.category,
    categoryLabel: post.categoryLabel,
    townLabel: post.townLabel,
    timeText: post.timeText
  });
  if (history.length > HISTORY_MAX) history.length = HISTORY_MAX;
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch {}
}

export function clearHistory() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(HISTORY_KEY); } catch {}
}

// Favorites stored in localStorage as fallback for non-logged-in users
const FAV_KEY = 'localFavorites';

export function getLocalFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch { return []; }
}

export function addLocalFavorite(postId: string) {
  if (typeof window === 'undefined') return;
  const favs = getLocalFavorites();
  if (!favs.includes(postId)) { favs.push(postId); }
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

export function removeLocalFavorite(postId: string) {
  if (typeof window === 'undefined') return;
  const favs = getLocalFavorites().filter(id => id !== postId);
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}
