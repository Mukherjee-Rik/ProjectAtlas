export const AUTH_UNAUTHORIZED_EVENT = 'atlas:auth:unauthorized';

export function emitUnauthorizedEvent() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
}

export function onUnauthorizedEvent(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener(AUTH_UNAUTHORIZED_EVENT, callback);
  return () => {
    window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, callback);
  };
}
