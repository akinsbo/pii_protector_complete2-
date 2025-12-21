# Test Coverage Documentation

## Automated E2E Tests (Headless)

Run with: `npm run test:e2e`

### Current Tests

1. **App Launch** - Verifies Electron app starts successfully
2. **Stability** - Confirms app runs without crashes for extended period
3. **Runtime** - Validates process management and lifecycle

## Manual Feature Testing Checklist

Since Playwright's Electron launcher has limitations, use this checklist for manual feature validation:

### Core Features

- [ ] **PII Masking**
  - [ ] Email addresses (test@example.com → [[LDB:EMAIL_1]])
  - [ ] Phone numbers (555-1234 → [[LDB:PHONE_1]])
  - [ ] IP addresses (192.168.1.1 → [[LDB:IP_1]])
  - [ ] Credit cards (4111-1111-1111-1111 → [[LDB:CARD_1]])

- [ ] **Custom Terms**
  - [ ] Single custom term masking
  - [ ] Multiple custom terms (one per line)
  - [ ] Case-insensitive matching

- [ ] **Text Restoration**
  - [ ] Unmask protected text correctly
  - [ ] Maintain placeholder consistency

### UI Features

- [ ] **Protection Toggle**
  - [ ] Enable/disable protection
  - [ ] Shield indicator updates

- [ ] **Dark Mode**
  - [ ] Toggle dark/light theme
  - [ ] Preference persists

- [ ] **Copy Buttons**
  - [ ] Copy protected prompt
  - [ ] Copy restored result
  - [ ] Visual feedback on copy

- [ ] **Feedback Form**
  - [ ] Accept text input
  - [ ] Submit feedback
  - [ ] Clear after submission

### Integration Tests

- [ ] Process text with protection ON
- [ ] Process text with protection OFF
- [ ] Multiple PII types in single text
- [ ] Custom terms + built-in PII detection
- [ ] Large text processing
- [ ] Special characters handling

## Running Manual Tests

1. Start app: `npm run dev:electron`
2. Follow checklist above
3. Document any issues found

## CI/CD Integration

```yaml
- name: Run E2E Tests
  run: npm run test:e2e
```

Tests run in headless mode and verify app stability.
