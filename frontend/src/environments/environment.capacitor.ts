export const environment = {
  production: true,
  /**
   * Capacitor Android app runs under a local origin (usually https://localhost),
   * so API must be an absolute URL to the production backend.
   */
  baseUrl: `https://brainassistant.app/api/`,
  slackAppClientId: '4302912159520.6331710262610',
  e2eBypassAuth: false,
};

