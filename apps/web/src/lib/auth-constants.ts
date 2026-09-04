export const AUTH_ROUTES = {
  login: '/login',
} as const;

export const AUTH_STORAGE_KEYS = {
  accessToken: 'kafei_access_token',
  user: 'kafei_auth_user',
  legacyAccessToken: 'atlas_access_token',
  legacyUser: 'atlas_auth_user',
} as const;
