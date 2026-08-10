export const AUTH_UNAUTHORIZED_EVENT =
  'atlas:auth:unauthorized';

export function emitUnauthorizedEvent() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new Event(AUTH_UNAUTHORIZED_EVENT),
  );
}
