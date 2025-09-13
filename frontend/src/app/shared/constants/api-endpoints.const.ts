export const BASE_URL = `/api/`;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: BASE_URL + 'auth/login',
    LOGOUT: BASE_URL + 'auth/logout',
    SIGNUP: BASE_URL + 'auth/signup',
    VERIFY_EMAIL: BASE_URL + 'auth/verify-email',
  },
  SYNC: {
    RELEASE_CLIENTID: BASE_URL + 'sync/release-client-id',
    CHANGES: BASE_URL + 'sync/changes',
    TASK: BASE_URL + 'sync/task',
    TAG: BASE_URL + 'sync/tag',
  },
  INTEGRATIONS: {
    SLACK: BASE_URL + 'integrations/slack/install',
  },
  FILES: {
    IMAGE: BASE_URL + 'files/image',
  },
};
