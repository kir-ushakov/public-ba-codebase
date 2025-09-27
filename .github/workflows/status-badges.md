# Workflow Status Badges

Add these badges to your README.md to show the status of your GitHub Actions workflows:

```markdown
![CI Pipeline](https://github.com/YOUR_USERNAME/YOUR_REPO/workflows/CI%20Pipeline/badge.svg)
```

## Workflow Overview

### 1. CI Pipeline (`ci.yml`)

- **Triggers**: Push to main/develop, Pull Requests
- **Jobs**:
  - Frontend Tests (with Jest)
  - Security Scan (Trivy)

## Required Secrets

No additional secrets are required for the basic CI pipeline. The `GITHUB_TOKEN` is automatically provided.

## Features

### Frontend Tests (Jest)

- Runs Jest tests for the Angular frontend
- Generates test coverage reports
- Uploads coverage to Codecov (optional)

### Security Scan (Trivy)

- Scans the entire codebase for vulnerabilities
- Generates SARIF reports
- Uploads results to GitHub Security tab

## Customization

1. **Add Codecov token** (optional) for coverage reporting
2. **Configure Trivy scan paths** if you want to scan specific directories
3. **Add more test jobs** as needed for backend or other components
