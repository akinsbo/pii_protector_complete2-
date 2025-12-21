# PII Protector — Electron + TypeScript

## Dev (hot reload UI + Electron)

npm install
npm run dev:electron

## Prod run (compiled)

npm start

## Build a macOS .dmg (electron-builder)

npm run dist:mac

# or universal binary (arm64 + x64)

npm run dist:mac-universal

Artifacts appear in `dist/`.

## Build a macOS .dmg (electron-forge)

npm run make
