# <p align="center">Brain Assistant App</p>

<p align="center">
  <img src="./.github/assets/logos/ba.png" alt="Brain Assistant Logo" width="120">
</p>

<p align="center">
  <a href="https://github.com/kirillushakov/BrainAssistant/actions/workflows/backend-tests.yml">
    <img src="https://github.com/kirillushakov/BrainAssistant/actions/workflows/backend-tests.yml/badge.svg" alt="Backend Tests">
  </a>
  <a href="https://github.com/kirillushakov/BrainAssistant/actions/workflows/frontend-tests.yml">
    <img src="https://github.com/kirillushakov/BrainAssistant/actions/workflows/frontend-tests.yml/badge.svg" alt="Frontend Tests">
  </a>
  <a href="https://github.com/kirillushakov/BrainAssistant/actions/workflows/security.yml">
    <img src="https://github.com/kirillushakov/BrainAssistant/actions/workflows/security.yml/badge.svg" alt="Security Scan">
  </a>
</p>

<p align="center">

  <img src="./.github/assets/icons/under-construction.jpg" alt="Under construction icon" width="24">
  (Description Under Development)
  <img src="./.github/assets/icons/under-construction.jpg" alt="Under construction icon" width="24">

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

#### 3rd-party API

- Auth & Identity → Google Auth

- File Storage → Google Drive

- Communication → Slack, SendGrid/Mailgun

- AI Services → Text-to-Speech API

## Tech Features

#### This is [Mobile-First](#mobile-first-aspects) [PWA](#pwa-features)

#### Mobile-First Aspects

**_CSS Layout & Breakpoints_**

- Default styles optimized for small viewports.
- Larger layouts enabled via media queries (min-width).
- [SCSS breakpoints map and media-query mixins](./frontend/src/scss/_breakpoints.scss)

**_Responsive Components_**

- Angular components use flexible containers (`flex`, `grid`) instead of fixed widths. [Example of component styles](./frontend/src/app/mobile-app/components/common/task-tiles-panel/task-tiles-panel.component.scss).
- Images and icons scale with `max-width: 100%` and `height: auto` to prevents overflow and keeps aspect ratio intact on narrow screens. [Main SCSS File](./frontend/src/styles.scss).
- All font sizes, paddings, and margins use `rem` units.
- The root font-size (`html { font-size: ... }`) changes with breakpoints, allowing proportional scaling. [Typography Styles](./frontend/src/scss/_typography.scss).

**_Performance Optimizations for Mobile_**

- Lazy loading of images & modules.
- PWA caching configured via [ngsw-config.json](./frontend/ngsw-config.json) for offline support and faster load times

#### AI features

- 🗣️ Use [Open AI](./backend/src/modules/ai/services/open-ai-client.service.ts) to [converting speech to text](./backend/src/modules/ai/usecases/speech-to-text)

#### Testing

**Backend Integration Tests**

The backend includes comprehensive integration tests that test the entire request-response flow with real services (in-memory MongoDB) and mocked external APIs.

```bash
# Run all tests
cd backend && npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Structure:**
- `backend/test/integration/sync/` - Task synchronization tests
- `backend/test/integration/files/` - File upload & image processing tests
- Uses in-memory MongoDB for realistic database testing
- Mocks external services (Google Drive, Slack) to avoid network calls

📚 [Backend Test Documentation](./backend/test/README.md)

**Frontend E2E Tests** (Playwright)

```bash
# Run E2E tests
cd frontend && npm run e2e

# Run in headed mode
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

**Test Coverage:**
- `frontend/e2e/create-task.spec.ts` - Task creation user flows
- Page Object Model for maintainable tests
- Mocked backend responses for isolation
- Mobile and desktop viewport testing

📚 [Frontend E2E Test Documentation](./frontend/e2e/README.md)

#### CI/CD

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

#### PWA features

- ⚡ Offline caching & fast loading via [ngsw-config.json](./frontend/ngsw-config.json) 
- 📱 [Installable](./frontend/src/app/shared/services/pwa/pwa-install.service.ts) as a mobile app [(Add to Home Screen)](./frontend/src/app/shared/components/ui-elements/pwa-install-dialog) 
- 🔄 Automatic app updates: [PwaVersionUpdateService](./frontend/src/app/shared/services/pwa/pwa-version-update.service.ts) reloads the app when a new service worker version is ready, so users always get the latest build.
- 📸 Taking pictures with device cam using [Capacitor Camera Plugin](./frontend/src/app/shared/services/pwa/device-camera.service.ts)
- 🎙️ Voice recording with device microphone using [Web Media API](./frontend/src/app/shared/services/pwa/voice-recorder.service.ts)
