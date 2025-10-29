# Setup Shared Contracts Package

This guide helps you set up the shared contracts package for type-safe API contracts.

## Quick Setup (Recommended)

Run the automated installation script from the project root:

```powershell
.\install-contracts.ps1
```

This will automatically:
1. Build the contracts package
2. Link it to backend
3. Link it to frontend

---

## Manual Setup (Alternative)

If you prefer to do it manually:

### Step 1: Install Contracts Package Dependencies

```powershell
cd contracts
npm install
npm run build
cd ..
```

### Step 2: Link Contracts to Backend

```powershell
cd backend
npm install
cd ..
```

### Step 3: Link Contracts to Frontend

```powershell
cd frontend
npm install
cd ..
```

## Verify Build

Both backend and frontend package.json now reference:
```json
"@brainassistant/contracts": "file:../contracts"
```

When you run `npm install` in backend or frontend, it will automatically link the local contracts package.

## Rebuilding Contracts

Whenever you modify contracts, rebuild them:

```powershell
cd contracts
npm run build
```

For development, you can run watch mode:

```powershell
cd contracts
npm run watch
```

This will automatically rebuild whenever you change contract files.

## Next Steps

After installation, you'll need to:
1. Update backend imports to use `@brainassistant/contracts`
2. Update frontend imports to use `@brainassistant/contracts`
3. Update E2E tests to use shared types
4. Remove old duplicate DTO files


