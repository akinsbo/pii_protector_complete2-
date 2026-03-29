# Ledebe Protector — Full Feature List

## Core PII Protection
- Automatic detection and masking of emails, phone numbers, and custom terms
- Real-time protection as user types
- Placeholder token system (e.g., `[LDB_EMAIL1]`) with cumulative mapping across conversation turns
- Toggle between plain text and protected text views
- All processing happens locally — original PII never leaves the device

## Document Processing
- Supported formats: `.txt`, `.md`, `.csv`, `.pdf`, `.docx`, and images (OCR via Tesseract.js)
- Drag-and-drop file upload
- Document preview modal with pagination
- Side-by-side plain/protected document comparison
- Protected document download
- Document statistics: page count, word count, protected items count
- Exact formatting preservation (tables, columns, spacing, layout)
- PDFs rendered as images to preserve visual structure

## Multi-AI Integration
- Supported providers: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini)
- 4 model options per provider
- Send protected text to multiple AIs simultaneously
- Per-provider API key management and model selection
- Connection testing before saving keys
- PII automatically restored in AI responses for display
- Conversation history with context awareness

## Chat & History Management
- Multi-turn conversation with cumulative context
- Auto-saved chat history (up to 20 sessions)
- Search and filter chat history
- Rename, delete, and reload previous sessions
- Named sessions based on content
- Per-message actions: copy, edit, delete
- Toggle plain/protected view per message
- Message timestamps

## Custom Terms Management
- Add, edit, and delete user-defined protected words or phrases
- Custom terms persist across sessions
- Company Terms Sync — pull shared terms from a company S3 bucket via Company ID
- Auto-sync every 5 minutes
- Merge company terms with personal terms
- Employee onboarding flow via join-company page

## User Interface & UX
- Dark/light mode toggle with persistence
- Collapsible sidebar: history, custom terms, AI selector
- Toast notifications for key actions
- PII highlighted in amber in protected view
- Loading states and spinners
- Hover effects and smooth transitions
- Fully responsive (desktop, tablet, mobile)
- Off-white monochromatic design (light mode), grey (dark mode)

## Keyboard Shortcuts
| Shortcut              | Action                    |
|-----------------------|---------------------------|
| `Cmd/Ctrl + Enter`    | Send message              |
| `Cmd/Ctrl + K`        | New chat                  |
| `Cmd/Ctrl + Shift + C`| Copy protected text       |
| `Cmd/Ctrl + /`        | Show shortcuts help modal |

## Settings & Configuration
- Language selection (EN, ES, FR, AR, ZH)
- Auto-save history toggle
- Enable/disable AI chat integration
- Dark mode preference
- Per-provider AI model selection

## Security & Privacy
- All PII protection processed locally — no server uploads
- Only masked/tokenised text transmitted to AI providers
- Original PII never sent to any external service
- Context isolation, sandboxed Electron renderer
- No data retained by Ledebe

## Platform & Build
- Electron desktop app: macOS (Apple Silicon + Intel), Windows 10+, Linux (AppImage)
- TypeScript + Vite
- Code-signed and notarisation-ready
- DMG, NSIS installer, and portable formats

## Admin & Company Features
- Company admin portal for managing shared protected terms
- Employee join flow (company code + work email verification)
- Crash reporting with Slack webhook + email backup
- Management portal with analytics and crash monitoring

## Testing
- 36+ Cypress automated tests
- Playwright end-to-end test suite
- Coverage: PII detection, file upload, history, dark mode, keyboard shortcuts, responsive design

---

## Planned / Coming Soon
- Clipboard auto-protect (paste-and-protect workflow)
- Custom regex PII patterns (e.g., SSN, credit cards, IP addresses)
- Export/import chat history (JSON/CSV)
- Batch file upload and bulk download as ZIP
- Analytics summary (monthly stats: emails protected, phone numbers masked, etc.)
- Browser extension (Chrome/Firefox — right-click to protect)
- VSCode extension with inline protection
- Mobile app (iOS/Android with camera OCR workflow)
- GDPR/HIPAA compliance mode with audit logs
- SSO integration (Google, Microsoft, Okta)
- Undo for message edits
- App lock / PIN after idle timeout
