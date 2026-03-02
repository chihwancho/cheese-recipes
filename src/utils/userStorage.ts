export type StorageKey = 'recipes' | 'shoppingList' | 'mealPlan' | 'settings';

function buildKey(userId: string, key: StorageKey): string {
  return `mealplan_${userId}_${key}`;
}

export function loadUserData<T>(userId: string, key: StorageKey): T | null {
  const raw = localStorage.getItem(buildKey(userId, key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveUserData<T>(userId: string, key: StorageKey, data: T): void {
  localStorage.setItem(buildKey(userId, key), JSON.stringify(data));
}
