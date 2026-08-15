import { AUTH_STORAGE_KEYS } from './auth-constants';

let inMemoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  if (inMemoryAccessToken) {
    return inMemoryAccessToken;
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
    if (token) {
      inMemoryAccessToken = token;
      return token;
    }
  }
  return null;
}

export function setAccessToken(token: string) {
  inMemoryAccessToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, token);
  }
}

export function removeAccessToken() {
  inMemoryAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  }
}

export function getStoredUser<T>(): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const user = localStorage.getItem(
    AUTH_STORAGE_KEYS.user,
  );

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user) as T;
  } catch {
    return null;
  }
}

export function setStoredUser<T>(user: T) {
  localStorage.setItem(
    AUTH_STORAGE_KEYS.user,
    JSON.stringify(user),
  );
}

export function removeStoredUser() {
  localStorage.removeItem(
    AUTH_STORAGE_KEYS.user,
  );
}

export function clearAuthStorage() {
  removeAccessToken();
  removeStoredUser();
}
