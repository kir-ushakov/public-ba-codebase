# Workflow Status Badges

Add these badges to your README.md to show the status of your GitHub Actions workflows:

```markdown
![CI Pipeline](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI%20Pipeline/badge.svg)
```

## Workflow Overview

### 1. Backend Tests (`backend-tests.yml`)

- **Triggers**: Push/PR when `backend/**` or `contracts/**` change
- **Jobs**: Lint, Jest (integration + unit), Codecov upload

### 2. Frontend Tests (`frontend-tests.yml`)

- **Triggers**: Push/PR when `frontend/**` or `contracts/**` change
- **Jobs**: Playwright E2E

### 3. Security Scan (`security.yml`)

## Required Secrets

No additional secrets are required for the basic CI pipeline. The `GITHUB_TOKEN` is automatically provided.

## Features

### Backend Tests (Jest)

- Runs backend unit and integration tests
- Runs ESLint (must pass; no `|| true` masking)
- Uploads coverage to Codecov (optional)

### Frontend E2E (Playwright)

- Runs Playwright browser tests against the Angular app

### Security Scan (Trivy)

- Scans frontend and backend for vulnerabilities
- Generates SARIF reports
- Uploads results to GitHub Security tab

## Customization

1. **Add Codecov token** (optional) for coverage reporting
2. **Configure Trivy scan paths** if you want to scan specific directories
