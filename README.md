# <p align="center">Brain Assistant App</p>

<p align="center">
  <img src="./.github/assets/logos/ba.png" alt="Brain Assistant Logo" width="120">
</p>

#### <i>This is a lean personal task manager, originally built to support my [YouTube channel](https://www.youtube.com/@kirillushakov-webmobiledev6785) with a real-world codebase. Over time, it has evolved into my personal playground for experimenting with new technologies, APIs, and development approaches.</i>

## Architecture & Tech Stack

#### Frontend:

- Angular 19 (SPA framework)

- NGXS + NgxsStoragePlugin (state management + offline storage)

- Service Workers (PWA offline support)

- Angular Material (UI component library)

- HTML/SCSS (UI implementation)

#### Backend:

- Node.js/Express.js (backend framework)

- MongoDB + Mongoose.js (persistence layer)

- Passport.js (authentication library)

#### Client-Server Communication:

- REST API (client-server interaction)

- JSON over HTTPS (data exchange format)

- HTTPS + JWT (secure authentication and data transfer)

#### 3rd-party API (overview)

- The app integrates external APIs across the main use cases: identity/authentication, file storage, communication/notifications, and AI capabilities.

## Tech Features

#### *This is [Mobile-First](#mobile-first-aspects), [Installable & offline PWA](#pwa-features), and uses [AI features](#ai-features).*

#### Mobile-First Aspects

- 📱 The UI is aimed at **phones first**, then **adapts up** for larger screens. Breakpoints and media-query mixins live in [`_breakpoints.scss`](./frontend/src/scss/_breakpoints.scss).
- 🔤 [Typography](./frontend/src/scss/_typography.scss): `rem`-based type and spacing; `html` font-size steps up at sm/md/lg/xl/xxl so the whole UI scales proportionally.
- 📐 Layout & media: `flex` / `grid` in mobile screens, fluid images (`max-width: 100%`, `height: auto`) in [`styles.scss`](./frontend/src/styles.scss); [example component SCSS](./frontend/src/app/mobile-app/components/common/task-tiles-panel/task-tiles-panel.component.scss).
- ⚡ Caching configured via [ngsw-config.json](./frontend/ngsw-config.json) for offline support and faster load times.

#### PWA features

- ⚡ Offline caching & fast loading via [ngsw-config.json](./frontend/ngsw-config.json)
- 📱 [Installable](./frontend/src/app/shared/services/pwa/pwa-install.service.ts) as a mobile app [(Add to Home Screen)](./frontend/src/app/shared/components/ui-elements/pwa-install-dialog)
- 🔄 Automatic app updates: [PwaVersionUpdateService](./frontend/src/app/shared/services/pwa/pwa-version-update.service.ts) reloads the app when a new service worker version is ready, so users always get the latest build.
- 📸 Taking pictures with device cam using [Capacitor Camera Plugin](./frontend/src/app/shared/services/pwa/device-camera.service.ts)
- 🎙️ Voice recording with device microphone using [Web Media API](./frontend/src/app/shared/services/pwa/voice-recorder.service.ts)

#### Authorization

- 🔐 Classic login/password auth: [`login`](./backend/src/modules/auth/usecases/login), [`signup`](./backend/src/modules/auth/usecases/sing-up), [`logout`](./backend/src/modules/auth/usecases/logout), [`verify-email`](./backend/src/modules/auth/usecases/verify-email).
- <img src="./.github/assets/icons/google.svg" alt="Google" width="16" style="vertical-align: text-bottom;" /> Google auth (OAuth 2.0): [Google consent screen usecase](./backend/src/modules/integrations/google/usecases/get-oauth-consent-screen) + [Google auth exchange usecase](./backend/src/modules/auth/usecases/google-auth).

#### 3rd-Party API Integrations

- 🔐 Auth & Identity with Google Auth: [backend auth flow](./backend/src/modules/auth/usecases/google-auth/google-auth.usecase.ts), [OAuth consent screen](./backend/src/modules/integrations/google/usecases/get-oauth-consent-screen/get-oauth-consent-screen.controller.ts), [frontend redirect](./frontend/src/app/shared/components/redirects/google/google-auth-redirect/google-auth-redirect.component.ts)
- 📁 File Storage with Google Drive API: [Google Drive service](./backend/src/modules/integrations/google/services/google-drive.service.ts), [upload image usecase](./backend/src/modules/files/usecases/upload-image/upload-image.usecase.ts)
- 💬 Communication with Slack API, SendGrid API, Mailgun API: [Slack service](./backend/src/shared/infra/integrations/slack/slack.service.ts), [SendGrid provider](./backend/src/modules/auth/services/email/providers/sendgrid.provider.ts), [Mailgun provider](./backend/src/modules/auth/services/email/providers/mailgun.provider.ts)
- 🤖 AI Services with Text-to-Speech API: [OpenAI client](./backend/src/modules/ai/services/open-ai-client.service.ts), [speech-to-text usecase](./backend/src/modules/ai/usecases/speech-to-text/speech-to-text.usecase.ts)

#### AI features

- 🗣️ Use [Open AI](./backend/src/modules/ai/services/open-ai-client.service.ts) to [converting speech to text](./backend/src/modules/ai/usecases/speech-to-text)

## Testing

**Backend Integration Tests**

The backend includes comprehensive integration tests that test the entire request-response flow with real services (in-memory MongoDB) and mocked external APIs.
Run instructions are documented in the backend test guide.

Examples: [task synchronization tests](./backend/test/integration/sync/) and [file upload and image processing tests](./backend/test/integration/files/).

📚 [Backend Test Documentation](./backend/test/README.md)

**Frontend E2E Tests** (Playwright)

The frontend includes browser-based integration tests with Playwright that validate key user flows through the UI. Tests run against the frontend only: backend requests are mocked, and device APIs (for example, camera) are stubbed for deterministic behavior.
Run instructions are documented in the frontend E2E test guide.

Example: [task creation user flows](./frontend/e2e/create-task.spec.ts).

📚 [Frontend E2E Test Documentation](./frontend/e2e/README.md)

## CI/CD

The project uses GitHub Actions for continuous integration:

**Workflows:**
- 🧪 **Backend Tests** (`.github/workflows/backend-tests.yml`) - Runs on Node.js 18.x and 20.x
  - Integration tests with in-memory MongoDB
  - Uploads coverage to Codecov
  - Triggers on backend code changes

- 🎭 **Frontend Tests** (`.github/workflows/frontend-tests.yml`)
  - E2E tests with Playwright
  - Unit tests with Jest/Karma
  - Triggers on frontend code changes

- 🔒 **Security Scan** (`.github/workflows/security.yml`)
  - Trivy vulnerability scanning
  - Runs on push/PR and daily at 2 AM UTC
  - Uploads results to GitHub Security tab

