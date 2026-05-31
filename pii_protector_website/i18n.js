const translations = {
  en: {
    nav: { home: "Home", pricing: "Pricing", docs: "Docs", bookDemo: "Book a Demo" },
    hero: {
      badge: "Privacy-first AI protection",
      title: 'Stop Your Sensitive Data <span>Reaching AI</span>',
      subtitle: "Ledebe masks emails, phone numbers, API keys, and personal data before it ever leaves your device — so you can use ChatGPT, Claude, and Copilot safely.",
      bookDemoBtn: "Book a Free Demo →",
      webAppBtn: "Try Web App →"
    },
    mockup: { yourInput: "Your input", protectedOutput: "Protected output", badge: "🛡️ 3 items protected" },
    proof: {
      works: "Works with ChatGPT, Claude & Gemini",
      local: "100% local — no data sent to servers",
      instant: "Instant masking, fully reversible",
      vscode: "VS Code extension available"
    },
    hiw: {
      label: "How it works", title: "Three steps to safe AI use",
      sub: "No setup, no configuration. Paste, protect, and share — in seconds.",
      step1: { title: "Paste your text", desc: "Paste any text, document, or code that contains sensitive information into Ledebe." },
      step2: { title: "Ledebe masks it", desc: "All PII is replaced with placeholders like [LDB_EMAIL1] locally on your device — nothing leaves." },
      step3: { title: "Share safely", desc: "Copy the protected text into any AI tool. Restore the original anytime with one click." }
    },
    feat: {
      label: "Features", title: "Everything you need to use AI safely",
      sub: "Built for individuals, developers, and teams.",
      auto:       { title: "Automatic PII Detection",   desc: "Instantly detects and masks emails, phone numbers, NI numbers, credit cards, API keys, and more — no manual selection needed." },
      custom:     { title: "Custom Terms",              desc: "Add your own sensitive words — company names, project codes, client names — and they're masked automatically every time." },
      reversible: { title: "Fully Reversible",          desc: "Placeholders map back to your original data. Restore the full text anytime — nothing is ever lost." },
      doc:        { title: "Document Upload",           desc: "Upload PDFs, Word docs, images, and CSV files. PII is masked across the full document with a side-by-side preview." },
      ai:         { title: "Ask AI Mode",               desc: "Send your masked text directly to ChatGPT, Claude, or Gemini using your own API key — your real data never reaches the AI." },
      highlight:  { title: "Highlight to Protect",      desc: "Highlight any word in a sent message to instantly protect or unprotect it. Changes apply immediately — no re-sending needed." },
      sync:       { title: "Company Sync",              desc: "Share a protected terms list across your whole team. One admin update protects everyone instantly." },
      ocr:        { title: "Image OCR",                 desc: "Extract and protect text from images automatically. Perfect for scanned documents, screenshots, and photos." },
      keyboard:   { title: "Keyboard First",            desc: "Full keyboard navigation with ⌘K search, ⌘⇧N new chat, and ⌘↵ to send. Built for speed." }
    },
    trust: {
      title: "Your data never leaves your device",
      desc: "Every piece of PII detection and masking happens locally — in your browser or desktop app. Ledebe has no server that sees your content.",
      li1: "Local processing — masking happens on your device, not our servers",
      li2: "API keys stored locally only — never uploaded to Ledebe",
      li3: "Chat history saved in your browser's local storage only",
      li4: "GDPR compliant — no personal data processed by Ledebe",
      li5: "Fully reversible — your original data is never destroyed",
      card1: "No server-side processing",
      card2: "Local AI detection on your device",
      card3: "Fully reversible masking",
      card4: "GDPR ready by design"
    },
    vscode: {
      title: "Also available as a VS Code extension",
      desc: "Protect code, configs, and logs right in your editor. Right-click → Protect on any file. Auto-detects PII in .env, .json, and .log files.",
      btn: "Install Extension →"
    },
    pp: {
      label: "Pricing", title: "Start free, scale when ready",
      sub: "No hidden fees. Cancel any time. Core PII protection is always free.",
      popular: "Most popular",
      personal: { name: "Personal", price: "Free", per: "forever", f1: "Unlimited text protection", f2: "Up to 20 custom terms", f3: "3 file uploads/day", f4: "VS Code extension", btn: "Get started →" },
      pro:      { name: "Professional", per: "per month", f1: "Unlimited custom terms", f2: "Unlimited file uploads", f3: "AI chat (own API key)", f4: "Priority support", btn: "Get Pro →" },
      team:     { name: "Business", per: "per user / month", f1: "Company-wide term sync", f2: "Admin dashboard", f3: "Audit log", f4: "Invoice billing", btn: "Get Team →" },
      ent:      { name: "Enterprise", price: "Custom", per: "annual contract", f1: "On-premise deployment", f2: "GDPR / HIPAA reports", f3: "99.9% uptime SLA", f4: "Dedicated onboarding", btn: "Talk to us →" },
      seeAll: "See full pricing & feature comparison →"
    },
    cta: {
      title: "Start protecting your data today",
      sub: "Free to use. No account required. Works on Mac, Windows, and Linux.",
      bookDemoBtn: "Book a Free Demo →"
    },
    footer: {
      tagline: "Privacy-first protection for anyone using AI. Your data stays on your device, always.",
      product: "Product", company: "Company", legal: "Legal",
      downloads: "Downloads", pricing: "Pricing", documentation: "Documentation",
      vscodeExt: "VS Code Extension", webApp: "Web App",
      about: "About", contact: "Contact", bookDemo: "Book a Demo",
      privacy: "Privacy Policy", terms: "Terms of Service",
      copyright: "© 2026 Ledebe Technologies. All rights reserved. Built with privacy in mind."
    },
    pricing: {
      hero: {
        label: "Pricing",
        title: "Simple, honest pricing",
        intro: 'Start free — no card required. Upgrade when you need more. Cancel any time. All paid plans include a <strong>14-day money-back guarantee</strong>.'
      },
      billing: {
        monthly: "Monthly", annual: "Annual", save: "Save 20%",
        perMonth: "per month", perYear: "per year",
        perUserMonth: "per user / month", perUserYear: "per user / year",
        forever: "forever", annualContract: "annual contract",
        minUsers: "Minimum 3 users"
      },
      featured: "Most popular",
      whatsIncluded: "What's included",
      everythingInFree: "Everything in Free, plus",
      everythingInPro: "Everything in Pro, plus",
      everythingInTeam: "Everything in Team, plus",
      personal: {
        name: "Personal", title: "Free",
        desc: "For individuals trying it out or light daily use.",
        cta: "Get started free",
        f1: "Unlimited text protection", f2: "Up to 20 custom terms",
        f3: "3 file uploads per day", f4: "Last 30 conversations",
        f5: "VS Code extension", f6: "Dark / light mode",
        f7: "AI chat (bring your own key)", f8: "Unlimited file uploads",
        f9: "Company sync", f10: "Priority support"
      },
      pro: {
        name: "Professional", title: "Pro",
        desc: "For power users, freelancers, and professionals who want more.",
        cta: "Get Started →",
        annualNote: "Save £21 vs monthly",
        f1: "Unlimited custom terms",
        f2: "Unlimited file uploads (50 MB/file)",
        f3: "AI chat with your own API key",
        f4: "Full chat history (unlimited)",
        f5: "Export protected documents",
        f6: "Priority email support",
        f7: "Early access to new features",
        f8: "Company sync", f9: "Admin dashboard"
      },
      team: {
        name: "Business", title: "Team",
        desc: "For SMBs and departments that need shared control and visibility.",
        cta: "Get Started →",
        annualNote: "Save £56 per user vs monthly",
        f1: "Company sync — shared terms",
        f2: "Admin dashboard & team management",
        f3: "Centrally managed protected terms",
        f4: "Audit log",
        f5: "Dedicated account manager (10+ users)",
        f6: "Invoice billing available",
        f7: "SSO — coming soon"
      },
      ent: {
        name: "Enterprise", title: "Custom",
        desc: "For large organisations and regulated industries.",
        priceLabel: "Custom", cta: "Talk to us →",
        f1: "On-premise deployment option", f2: "Custom integrations",
        f3: "Uptime SLA (terms in contract)",
        f4: "Compliance documentation on request",
        f5: "Custom term library", f6: "Dedicated onboarding",
        f7: "Volume discounts"
      },
      trust: {
        t1Title: "No card needed",      t1Sub: "Start free, upgrade later",
        t2Title: "Cancel any time",     t2Sub: "No lock-ins or penalties",
        t3Title: "Switch plans freely", t3Sub: "Upgrade or downgrade instantly",
        t4Title: "Invoices included",   t4Sub: "Automatic receipts for every payment",
        t5Title: "Payments via Paddle", t5Sub: "PCI-compliant, secure checkout"
      },
      faq: {
        title: "Frequently asked questions",
        q1: "Is the free plan really free forever?",
        a1: "Yes. The Personal plan is free indefinitely — no trial period, no credit card required. Core PII masking will always be free.",
        q2: 'What counts as a "file upload"?',
        a2: "Any PDF, Word document, image (JPEG/PNG), or CSV you upload for PII scanning. Free users get 3 uploads per day. Pro and above have unlimited uploads up to 50 MB per file.",
        q3: "Do I need to provide my own AI API key?",
        a3: 'Yes — for AI chat ("Ask AI" mode), you supply your own OpenAI, Anthropic, or Gemini API key. This keeps your protected data completely out of our systems. Your key is stored locally and never uploaded to Ledebe.',
        q4: "How does billing work for the Team plan?",
        a4: "Team plans are billed per active user per month (minimum 3 users). You can add or remove seats at any time — billing adjusts automatically at the next cycle. Invoice billing is available on request.",
        q5: "Can I switch plans at any time?",
        a5: "Yes. Upgrades apply immediately. Downgrades take effect at the end of your current billing period, and you keep access to paid features until then.",
        q6: "What payment methods do you accept?",
        a6: "We accept all major credit and debit cards (Visa, Mastercard, Amex) via Paddle, our payments provider. Enterprise clients can pay by bank transfer or invoice.",
        q7: "Is there a refund policy?",
        a7: "We offer a 14-day refund on all paid plans if you're not satisfied. Contact hello@ledebe.com and we'll sort it, no questions asked."
      }
    },
    downloads: {
      hero: {
        label: "Get the app",
        title: "Download Ledebe",
        desc: "Free to use. No account required. Available on Mac, Windows, Linux — or use it directly in your browser."
      },
      vscode: {
        title: "VS Code Extension",
        desc: 'Protect code, configs, and logs right in your editor. Search "Ledebe Protector" in the Extensions panel.',
        btn: "Install Extension →"
      },
      mac: {
        heading: "macOS",
        siliconTitle: "Apple Silicon (M1, M2, M3)",
        siliconReq: "Requires macOS 11 Big Sur or later",
        intelTitle: "Intel Mac",
        intelReq: "Requires macOS 10.15 Catalina or later",
        btnDmg: "Download .dmg",
        btnZip: "Download .zip",
        notice: "🍎 <strong>One-time setup on macOS:</strong> While we complete Apple notarisation, macOS will show a security prompt on first launch. Simply right-click the app icon → <strong>Open</strong> → <strong>Open</strong>. This only happens once — it's a standard step for new apps distributed outside the App Store."
      },
      win: {
        heading: "Windows",
        storeTitle: "Microsoft Store",
        storeBadge: "Recommended",
        storeReq: "Signed by Microsoft, auto-updates, no security warnings",
        storeBtn: "Get it from Microsoft Store →",
        directTitle: "Direct Installer",
        directReq: "Compatible with Windows 10 and Windows 11",
        directBtn: "Download Setup .exe",
        notice: '⚠️ <strong>SmartScreen warning</strong> only applies to the Direct Installer. If you see "Windows protected your PC", click <strong>More info</strong> → <strong>Run anyway</strong>. The Microsoft Store version is signed by Microsoft and skips this warning entirely.'
      },
      linux: {
        heading: "Linux",
        appimageTitle: "AppImage (Universal)",
        appimageReq: "Works on Ubuntu 18.04+, Fedora, Debian, and most distros",
        appimageBtn: "Download .AppImage",
        snapTitle: "Snap Package",
        snapReq: "For Ubuntu and Snap-enabled distributions",
        snapBtn: "Download .snap",
        noticeIntro: "AppImage setup:",
        noticeStep1: "After downloading, make the file executable before running:",
        noticeStep2: "If it fails to launch, install libfuse2:"
      }
    },
    demo: {
      hero: {
        label: "See it in action",
        title: "Book a Free Demo",
        desc: "30 minutes. No obligation. See exactly how Ledebe protects your sensitive data before it reaches AI."
      },
      cover: "What we'll cover",
      points: {
        p1Title: "Live masking demo",
        p1Desc: "See PII detection and masking in real time on your type of content.",
        p2Title: "AI workflow walkthrough",
        p2Desc: "How to use Ledebe safely with ChatGPT, Claude, or Gemini.",
        p3Title: "Document protection",
        p3Desc: "Upload and scan PDFs, Word docs, and spreadsheets for PII.",
        p4Title: "Team & enterprise options",
        p4Desc: "How shared term libraries and admin dashboards work for teams.",
        p5Title: "Your questions answered",
        p5Desc: "Bring your specific use case — we'll show you how Ledebe handles it."
      },
      meta: {
        durationLabel: "Duration:", durationVal: "30 minutes",
        formatLabel: "Format:",     formatVal: "Video call (link sent on confirmation)",
        costLabel: "Cost:",         costVal: "Free, no obligation",
        whoLabel: "Who:",           whoVal: "Founders, IT leads, compliance officers, developers"
      }
    },
    contact: {
      hero: {
        label: "Get in touch",
        title: "Contact Us",
        desc: "We're a small team and we read every message. We typically respond within 24 hours."
      },
      responseNotice: "Email us at <strong>hello@ledebe.com</strong> — we typically respond within 24 hours on business days.",
      cards: {
        generalTitle: "General Enquiries", generalDesc: "Questions about Ledebe, the product, or how it works.",
        supportTitle: "Support",            supportDesc: "Having trouble with the app or need help with your account.",
        entTitle: "Enterprise",             entDesc: "Interested in Team or Enterprise plans for your organisation.",
        privTitle: "Privacy",               privDesc: "Data privacy requests, GDPR rights, or security concerns."
      },
      faqPrompt: {
        title: "Looking for quick answers?",
        desc: "Check our documentation — most common questions are answered there.",
        btn: "Browse Documentation →"
      }
    },
    about: {
      hero: {
        label: "Our story",
        title: "About Ledebe",
        desc: "We built the tool we wished existed — a simple way to work with AI without exposing sensitive data."
      },
      why: {
        title: "Why Ledebe Exists",
        p1: "AI tools like ChatGPT, Claude, and Gemini are transforming how people work. But there is a problem nobody talks about enough — to use these tools effectively, people paste in real emails, real names, real phone numbers, real documents. Sensitive data leaves devices and enters AI systems every day, often without users realising the risk.",
        p2: "Ledebe was built to fix that. It lets you work with AI freely — without exposing the data that isn't yours to share.",
        highlight: "The core idea is simple: mask the sensitive parts before they leave your device. Use AI freely with the masked version. Restore the original whenever you need it."
      },
      what: {
        title: "What We Build",
        intro: "Ledebe is a suite of privacy tools for individuals, teams, and organisations who work with AI daily.",
        p1: "<strong>Desktop app</strong> — available on Mac, Windows, and Linux. Works offline, no account required.",
        p2: "<strong>VS Code extension</strong> — protect code, configs, and logs directly inside your editor.",
        p3: "<strong>File protection</strong> — upload PDFs, Word documents, and images to scan and mask PII before sharing."
      },
      principles: {
        title: "Our Principles",
        v1Title: "Local first",        v1Desc: "All detection and masking happens on your device. Your data never touches our servers.",
        v2Title: "Fully reversible",   v2Desc: "Masked data can always be restored. You're never locked out of your own content.",
        v3Title: "No tracking",        v3Desc: "We don't collect what you protect. No analytics on your content, ever.",
        v4Title: "Built for everyone", v4Desc: "From solo developers to enterprise compliance teams — Ledebe works for all."
      },
      who: {
        title: "Who We Are",
        p1: "Ledebe is built by Ledebe Technologies — a software company focused on privacy tools and data protection products. We are a small, focused team that believes privacy should be the default, not an afterthought.",
        p2: 'Have a question or want to work with us? Reach out at <strong><a href="mailto:hello@ledebe.com" style="color:var(--primary-blue);">hello@ledebe.com</a></strong>'
      },
      ctaBox: {
        title: "Ready to protect your data?",
        desc: "Free to use. No account required. Works on Mac, Windows, and Linux.",
        bookBtn: "Book a Free Demo →"
      }
    },
    docs: {
      hero: { title: "Documentation", subtitle: "Everything you need to install and use Ledebe Protector" },
      pageTitle: "Ledebe Protector Docs",
      pageLead: "Ledebe Protector detects and masks personally identifiable information (PII) before you share text with AI tools, colleagues, or external services. Your original data never leaves your device.",
      sidebar: {
        started: "Getting Started",
        overview: "Overview", howToUse: "How to Use", requirements: "System Requirements",
        install: "Installation",
        macSilicon: "macOS (Apple Silicon)", macIntel: "macOS (Intel)", windows: "Windows", linux: "Linux",
        using: "Using Ledebe",
        protectText: "Protecting Text", highlightProtect: "Highlight to Protect / Unprotect", customTerms: "Custom Terms",
        fileUpload: "File Upload", aiChat: "AI Chat", history: "History & Search", keyboard: "Keyboard Shortcuts",
        extensions: "Extensions",
        vscode: "VS Code Extension",
        help: "Help",
        faq: "FAQ", troubleshooting: "Troubleshooting"
      },
      overview: {
        title: "Overview",
        p1: "Ledebe Protector works by replacing sensitive information in your text with safe placeholders, letting you share or process the text freely. You can then restore the original content at any time.",
        typesIntro: "Supported PII types:"
      },
      howToUse: {
        title: "How to Use Ledebe",
        subtitle: "New to Ledebe? Follow these steps to protect and share text safely in under a minute.",
        s1Title: "Step 1 — Type or paste your text",
        s1Body: "Open the app and type (or paste) any text that contains sensitive information into the main input area. It could be an email, a support ticket, a contract excerpt — anything.",
        s1Example: 'Example: <em>"Hi, my name is Sarah Jones, email sarah@company.com and my phone is 07911 123456."</em>',
        s2Title: "Step 2 — Click Send / Protect",
        s2Body: "Click the <strong>Send</strong> button (or press <strong>Ctrl + Enter</strong> / <strong>⌘ Cmd + Enter</strong> on Mac). Ledebe automatically scans your text and replaces every piece of detected PII with a safe placeholder.",
        s2Example: 'The result will look like: <em>"Hi, my name is [LDB_CUSTOM1], email [LDB_EMAIL1] and my phone is [LDB_PHONE1]."</em> — safe to share anywhere.',
        s3Title: "Step 3 — Switch between views",
        s3Body: "Each message has two tabs beneath it: <strong>Plain Text</strong> — your original, unmasked text (visible only to you). <strong>Protected Text</strong> — the masked version with placeholders, safe to copy and share.",
        s4Title: "Step 4 — Copy the protected text",
        s4Body: "Click the <strong>📋 Copy</strong> button on the message, or press <strong>Ctrl/⌘ Cmd + Shift + X</strong>, to copy the protected version to your clipboard. Paste it into ChatGPT, an email, a support system — wherever you need it.",
        s5Title: "Step 5 — Restore the original (optional)",
        s5Body: "If you receive a reply that contains placeholders (e.g. from an AI tool), paste it back into Ledebe. It will automatically swap the placeholders back to the real values, so you can read the response with your actual data.",
        s6Title: "Step 6 — Add custom terms (optional)",
        s6Body: "Have specific words you always want to hide — like your company name, a project code, or a client name? Add them to <strong>Custom Terms</strong> in the sidebar. They'll be masked automatically every time.",
        s6Tip: '<strong>Quick tip:</strong> As you type, Ledebe suggests words to add as custom terms. If a word is already protected, it shows a green <em>"already protected"</em> chip so you never add the same term twice.',
        modeTitle: "Switching between Protect and Ask AI",
        modeIntro: "At the bottom of the screen, just above the text box, you'll see a mode toggle:",
        modeProtect: "<strong>🛡️ Protect (default)</strong> — masks your text and shows you the safe version to copy. Nothing is sent to any AI. Use this when you just want to sanitise text before pasting it elsewhere.",
        modeAsk: "<strong>🤖 Ask AI</strong> — sends your message directly to an AI (OpenAI, Anthropic, or Google) with PII already masked. The AI replies, and you see both the AI's response and a re-masked \"Safe to Share\" version. Use this for a full private AI chat experience.",
        modeTip: "You can switch modes at any time — even mid-conversation. The mode toggle remembers your last choice."
      },
      reqs: {
        title: "System Requirements"
      },
      macSilicon: {
        title: "macOS",
        intro: "For M1, M2, and M3 Macs. Download the <strong>arm64.dmg</strong> file.",
        stepsTitle: "Installation steps",
        gateWarning: "<strong>Gatekeeper warning:</strong> On first launch, macOS may show \"Ledebe Protector cannot be opened because it is from an unidentified developer.\" To bypass: right-click the app icon → click <strong>Open</strong> → click <strong>Open</strong> in the dialog. You only need to do this once.",
        altTip: "Alternatively, go to <strong>System Settings → Privacy &amp; Security</strong> and click <strong>Open Anyway</strong> next to the Ledebe Protector entry."
      },
      macIntel: {
        title: "macOS",
        intro: "For Intel-based Macs. Download the <strong>x64.dmg</strong> file.",
        stepsTitle: "Installation steps",
        gateWarning: "Same Gatekeeper behaviour as Apple Silicon — right-click → <strong>Open</strong> on first launch if macOS blocks it."
      },
      windows: {
        title: "Windows",
        intro: "Download the <strong>Ledebe Protector Setup 1.0.0.exe</strong> NSIS installer. This creates Start Menu shortcuts, a desktop icon, and an uninstaller.",
        stepsTitle: "Installation steps",
        smartScreen: "<strong>SmartScreen warning</strong> is normal for newly published apps without an EV code signing certificate. The app is safe — click <strong>More info → Run anyway</strong> to proceed.",
        uninstall: "To uninstall: go to <strong>Settings → Apps</strong>, find Ledebe Protector, and click <strong>Uninstall</strong>."
      },
      linux: {
        title: "Linux",
        intro: "Ledebe Protector ships as a universal <strong>AppImage</strong> — no installation required. It runs on Ubuntu, Debian, Fedora, Arch, and most other distros.",
        stepsTitle: "Installation steps",
        gui: "You can also right-click the AppImage in your file manager → <strong>Properties → Permissions</strong> → check <strong>\"Allow executing file as program\"</strong>, then double-click to run.",
        fuseHelp: "Some distros require <code>libfuse2</code> for AppImages. If the app fails to launch, install it:"
      },
      protectText: {
        title: "Protecting Text",
        tip: "Placeholders are consistent within a session — the same email always maps to the same placeholder, so your text structure is preserved."
      },
      highlightProtect: {
        title: "Highlight to Protect / Unprotect",
        intro: "You can protect or unprotect individual words directly from any sent message — without retyping anything.",
        protectTitle: "Protect a word",
        unprotectTitle: "Unprotect a word",
        info: "This works inside chat messages and inside the document preview. Changes take effect immediately — no need to re-send the message."
      },
      customTerms: {
        title: "Custom Terms",
        intro: "Add your own words or phrases to always protect — names, company names, project codes, anything sensitive.",
        addTitle: "Adding a term",
        searchTitle: "Searching your terms",
        searchIntro: "If you have many terms saved, use the built-in search to find them quickly.",
        searchTip: 'The search popup shows a count e.g. <em>"4 of 47 terms"</em> so you always know how many terms match your query.'
      },
      fileUpload: {
        title: "File Upload",
        intro: "Ledebe can process entire documents — not just typed text. Upload a file and it extracts, protects, and previews the content for you.",
        uploadTitle: "How to upload",
        supportedTitle: "Supported file types",
        previewTitle: "Document preview",
        previewIntro: "After uploading, click the document card to open the preview modal. It shows two side-by-side views:",
        previewDownload: "From the preview you can <strong>📥 Download</strong> the protected version as a file.",
        previewHighlight: "You can also highlight text inside the document preview to trigger the <strong>🛡️ Protect</strong> / <strong>🔓 Unprotect</strong> floating button, just like in chat messages."
      },
      aiChat: {
        title: "AI Chat",
        intro: "Switch to <strong>Ask AI</strong> mode to send questions directly to an AI. Ledebe masks your PII before the message is sent, so the AI never sees your real data.",
        setupTitle: "Setup",
        keyInfo: "API keys are stored locally only — they are never sent to Ledebe servers."
      },
      history: {
        title: "History & Search",
        intro: "Every conversation is automatically saved to your local history. The sidebar on the left lists all past chats.",
        usingTitle: "Using history",
        searchTitle: "Searching history with ⌘K",
        searchIntro: "Press <strong>⌘K</strong> (Mac) or <strong>Ctrl+K</strong> (Windows) to open the command palette — a fast search over all your past chats.",
        searchTip: "You can also click the <strong>Search history</strong> button at the top of the sidebar to open the same palette."
      },
      keyboard: {
        title: "Keyboard Shortcuts",
        intro: "Ledebe is fully keyboard-navigable. Use these shortcuts to work faster:",
        colAction: "Action", colMac: "Mac", colWin: "Windows / Linux",
        rSearch: "Search history (command palette)",
        rNew: "New chat",
        rSend: "Send message",
        rToggle: "Toggle sidebar",
        rAll: "Show all shortcuts"
      },
      vscode: {
        title: "VS Code Extension",
        intro: "Ledebe is also available as a <strong>VS Code extension</strong> — built for developers who want to protect sensitive data before sharing code, logs, or config files with AI tools like GitHub Copilot or ChatGPT.",
        installTitle: "Install",
        featuresTitle: "Features",
        shortcutTitle: "Keyboard shortcut",
        colAction: "Action", colShortcut: "Shortcut",
        rProtect: "Protect selected text",
        tip: "Custom terms added in the VS Code extension are saved per VS Code profile — separate from the desktop app's terms list."
      },
      faq: {
        title: "FAQ",
        q1: "How do I unprotect a word I already protected?",
        a1: "Highlight the word inside any sent message. If it's already in your protected terms, the floating button will show <strong>🔓 Unprotect</strong> (in red). Click it and the word is removed from your terms and the message updates immediately.",
        q2: "How do I search my chat history?",
        a2: "Press <strong>⌘K</strong> (Mac) or <strong>Ctrl+K</strong> (Windows) to open the command palette. Start typing to filter past chats, use arrow keys to navigate, and press Enter to open one. Press Esc to close.",
        q3: "Does Ledebe send my data anywhere?",
        a3: "No. All PII detection and masking happens locally on your device. The only outbound traffic is when you use the AI chat feature — in that case, only the <em>masked</em> text (with placeholders, not your real data) is sent to the AI provider's API.",
        q4: "Can I restore the original text after sharing the protected version?",
        a4: "Yes — as long as you are in the same session or the placeholder map has been saved. Paste the protected text back into Ledebe and click <strong>Restore</strong>.",
        q5: "Where are my API keys stored?",
        a5: "API keys are stored in your device's local storage only. They are never uploaded to Ledebe servers or included in any crash reports.",
        q6: "The app says it's from an unidentified developer on Mac — is it safe?",
        a6: "Yes, it is safe. This warning appears because the app is not yet enrolled in Apple's notarisation program. Right-click the app → <strong>Open</strong> → <strong>Open</strong> to bypass it. You only need to do this once.",
        q7: "Windows SmartScreen blocked the installer — what do I do?",
        a7: "Click <strong>More info</strong> in the SmartScreen dialog, then click <strong>Run anyway</strong>. This warning appears for newly published apps. The installer is safe.",
        q8: "The Linux AppImage won't launch — what do I do?",
        a8: 'Make sure the file has execute permission: <code>chmod +x "Ledebe Protector-1.0.0.AppImage"</code>. If it still fails, install <code>libfuse2</code>: on Ubuntu/Debian run <code>sudo apt install libfuse2</code>.'
      },
      trouble: {
        title: "Troubleshooting",
        crashTitle: "App crashes on launch",
        crashBody: "Crash reports are stored at <code>~/.ledebe-crashes/</code>. If you need support, include the latest crash log when contacting us.",
        piiTitle: "PII not being detected",
        piiBody: "Ensure the text format matches a supported pattern. For unusual formats (e.g. non-standard phone formats), add the value as a <strong>Custom Term</strong>.",
        aiTitle: "AI chat not responding",
        darkTitle: "Dark mode not saving",
        darkBody: "Dark mode preference is stored in local storage. Clearing your browser cache (in Electron: <strong>Settings → Clear Data</strong>) will reset it.",
        helpInfo: 'Need more help? Email us at <a href="mailto:hello@ledebe.com" style="color: var(--primary-blue);">hello@ledebe.com</a> or visit the <a href="/contact/" style="color: var(--primary-blue);">contact page</a>.'
      }
    },
    privacy: {
      hero: {
        label: "Legal",
        title: "Privacy Policy",
        desc: "How Ledebe handles your data — and why most of it never leaves your device."
      },
      lastUpdated: "Last updated: April 2026",
      highlight: "🛡️ The short version: Ledebe masks your sensitive data locally on your device. We do not collect, store, or transmit your personal data or the content you protect. Your data stays yours.",
      s1: {
        title: "1. Who We Are",
        p1: "Ledebe is a privacy tool built by Ledebe Technologies. Our product helps individuals and organisations protect personally identifiable information (PII) before sharing content with AI tools, colleagues, or third parties.",
        p2: "If you have questions about this policy, contact us at: <strong>hello@ledebe.com</strong>"
      },
      s2: {
        title: "2. What Data We Collect",
        notTitle: "Data we do NOT collect",
        not1: "The text you paste into Ledebe",
        not2: "The PII detected in your content (names, emails, phone numbers, etc.)",
        not3: "Your custom terms list",
        not4: "Your chat history",
        not5: "Your API keys for OpenAI, Anthropic, Google, or any other provider",
        not6: "Your documents or uploaded files",
        mayTitle: "Data we may collect (anonymised)",
        may1: "Basic usage analytics — page visits, which features are used (no personal data attached)",
        may2: "Error reports — if the app crashes, an anonymous report may be generated to help us fix bugs",
        may3: "Download counts — how many times the desktop app is downloaded"
      },
      s3: {
        title: "3. Where Your Data Lives",
        p1: "All PII detection and masking happens <strong>locally on your device</strong> — in your browser or desktop app. No content is sent to Ledebe servers during this process.",
        localTitle: "Local storage",
        local1: "<strong>Custom terms</strong> — stored in your browser's localStorage or the desktop app's local storage. Never uploaded.",
        local2: "<strong>Chat history</strong> — stored locally on your device only.",
        local3: "<strong>API keys</strong> — stored in your browser's localStorage or VS Code settings. Never transmitted to Ledebe.",
        local4: "<strong>Theme / settings preferences</strong> — stored locally.",
        aiTitle: "When you use AI Chat mode",
        aiBody: "If you use Ledebe's Ask AI feature, your masked text (with placeholders like [LDB_EMAIL1], never your real data) is sent directly from your device to your chosen AI provider (OpenAI, Anthropic, or Google) using your own API key. Ledebe does not see, intercept, or store this communication."
      },
      s4: {
        title: "4. Third Party Services",
        aws: "<strong>AWS S3</strong> — hosts the Ledebe website and desktop app downloads. AWS's privacy policy applies to hosting infrastructure.",
        cf: "<strong>Cloudflare</strong> — provides DNS, CDN, and DDoS protection for ledebe.com. Cloudflare may log anonymised traffic data.",
        ai: "<strong>OpenAI / Anthropic / Google</strong> — if you use AI Chat mode with your own API key, your masked prompts are sent to these providers. Their respective privacy policies apply.",
        vsm: "<strong>VS Code Marketplace</strong> — the VS Code extension is distributed via Microsoft's marketplace. Microsoft's privacy policy applies to the download and install process.",
        trail: "Ledebe does not sell, rent, or share your data with any third party for marketing purposes."
      },
      s5: {
        title: "5. Cookies",
        p1: "The Ledebe website uses minimal cookies:",
        func: "<strong>Functional cookies</strong> — remember your language preference and theme setting.",
        noAds: "We do not use advertising cookies or cross-site tracking cookies."
      },
      s6: {
        title: "6. Your Rights (GDPR)",
        p1: "If you are in the European Economic Area (EEA) or United Kingdom, you have the following rights:",
        access: "<strong>Right to access</strong> — request a copy of any personal data we hold about you.",
        erasure: "<strong>Right to erasure</strong> — request deletion of your personal data.",
        portability: "<strong>Right to portability</strong> — receive your data in a machine-readable format.",
        object: "<strong>Right to object</strong> — object to processing of your personal data.",
        rectify: "<strong>Right to rectification</strong> — request correction of inaccurate data.",
        trail: "Since Ledebe stores almost no personal data, most of these rights are satisfied automatically. To exercise any right, contact: <strong>hello@ledebe.com</strong>"
      },
      s7: {
        title: "7. Data Security",
        p1: "We take security seriously:",
        https: "The website is served over HTTPS.",
        noServer: "No sensitive user content ever reaches our servers.",
        keys: "API keys are stored locally and are never transmitted to Ledebe.",
        review: "We regularly review our infrastructure for security vulnerabilities."
      },
      s8: {
        title: "8. Children's Privacy",
        p1: "Ledebe is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, contact us at hello@ledebe.com and we will delete it."
      },
      s9: {
        title: "9. Changes to This Policy",
        p1: 'We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the "Last updated" date at the top of this page. Continued use of Ledebe after changes constitutes acceptance of the updated policy.'
      },
      s10: {
        title: "10. Contact",
        p1: "For any privacy-related questions or requests:",
        email: "Email: <strong>hello@ledebe.com</strong>",
        site: "Website: <strong>ledebe.com</strong>"
      }
    },
    terms: {
      hero: { label: "Legal", title: "Terms of Service", desc: "The rules and guidelines for using Ledebe." },
      lastUpdated: "Last updated: April 2026",
      highlight: "By using Ledebe, you agree to these terms. Please read them — they are written in plain English and designed to be fair to both you and us.",
      s1: {
        title: "1. Acceptance of Terms",
        p1: "By accessing or using Ledebe (the web app, desktop app, or VS Code extension), you agree to be bound by these Terms of Service. If you do not agree, please do not use the product.",
        p2: "These terms apply to all users — individuals, teams, and organisations."
      },
      s2: {
        title: "2. What Ledebe Does",
        p1: "Ledebe is a privacy tool that detects and masks personally identifiable information (PII) in text and documents before you share them with AI tools or other parties. The masking process happens locally on your device.",
        p2: "Ledebe is a tool to assist with privacy — it is not a guarantee of complete data protection. You remain responsible for reviewing your content before sharing."
      },
      s3: {
        title: "3. Your Account and Responsibility",
        i1: "You are responsible for maintaining the security of your API keys stored in Ledebe.",
        i2: "You are responsible for the content you process through Ledebe.",
        i3: "You must not use Ledebe for any unlawful purpose.",
        i4: "You must not attempt to reverse-engineer, modify, or distribute the Ledebe software without permission."
      },
      s4: {
        title: "4. Acceptable Use",
        p1: "You agree not to use Ledebe to:",
        i1: "Process content that violates any applicable law or regulation",
        i2: "Attempt to bypass, circumvent, or disable any security features",
        i3: "Scrape, copy, or redistribute Ledebe's software or interface",
        i4: "Use Ledebe in any way that could harm other users or third parties",
        i5: "Impersonate any person or organisation"
      },
      s5: {
        title: "5. Free and Paid Tiers",
        p1: "Ledebe offers a free tier and paid subscription plans. The features available in each tier are described on our pricing page.",
        i1: "Free tier features may change over time with reasonable notice.",
        i2: "Paid subscriptions are billed in advance on a monthly or annual basis.",
        i3: "We offer a 14-day money-back guarantee on all paid plans. Contact hello@ledebe.com within 14 days of payment and we will issue a full refund, no questions asked.",
        i4: "We reserve the right to change pricing with 30 days notice to existing subscribers."
      },
      s6: {
        title: "6. Intellectual Property",
        p1: "Ledebe and all its components — including the software, design, logo, and documentation — are owned by Ledebe Technologies. You may not copy, reproduce, or distribute any part of Ledebe without written permission.",
        p2: "Your content remains yours. By using Ledebe, you do not grant us any rights to your content."
      },
      s7: {
        title: "7. Third Party Services",
        p1: "Ledebe integrates with third party AI providers (OpenAI, Anthropic, Google) through your own API keys. Your use of these services is governed by their respective terms of service. Ledebe is not responsible for the behaviour, availability, or policies of these third party services."
      },
      s8: {
        title: "8. Disclaimer of Warranties",
        p1: 'Ledebe is provided "as is" without warranties of any kind, express or implied. We do not warrant that:',
        i1: "Ledebe will detect all PII in every piece of content",
        i2: "The service will be uninterrupted or error-free",
        i3: "The results will meet your specific requirements",
        p2: "You are responsible for verifying that Ledebe has correctly masked all sensitive data before sharing any content."
      },
      s9: {
        title: "9. Limitation of Liability",
        p1: "To the maximum extent permitted by law, Ledebe Technologies shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of Ledebe — including but not limited to data breaches resulting from content you shared after processing through Ledebe.",
        p2: "Our total liability to you for any claim shall not exceed the amount you paid us in the 12 months preceding the claim."
      },
      s10: {
        title: "10. Termination",
        p1: "We reserve the right to suspend or terminate access to Ledebe for users who violate these terms, with or without notice.",
        p2: "You may stop using Ledebe at any time. If you have a paid subscription, you may cancel it at any time — access continues until the end of the billing period."
      },
      s11: {
        title: "11. Changes to These Terms",
        p1: 'We may update these Terms of Service from time to time. We will notify users of significant changes by updating the "Last updated" date and, where appropriate, by email. Continued use of Ledebe after changes constitutes acceptance of the updated terms.'
      },
      s12: {
        title: "12. Governing Law",
        p1: "These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales."
      },
      s13: {
        title: "13. Contact",
        p1: "For questions about these terms:",
        email: "Email: <strong>hello@ledebe.com</strong>",
        site: "Website: <strong>ledebe.com</strong>"
      }
    }
  },

  es: {
    nav: { home: "Inicio", pricing: "Precios", docs: "Docs", bookDemo: "Reservar Demo" },
    hero: {
      badge: "Protección de IA con privacidad primero",
      title: 'Protege Tus Datos <span>Antes de la IA</span>',
      subtitle: "Ledebe enmascara correos, teléfonos, claves API y datos personales antes de que salgan de tu dispositivo — para usar ChatGPT, Claude y Copilot con seguridad.",
      bookDemoBtn: "Reservar Demo Gratis →",
      webAppBtn: "Probar Web App →"
    },
    mockup: { yourInput: "Tu entrada", protectedOutput: "Salida protegida", badge: "🛡️ 3 elementos protegidos" },
    proof: {
      works: "Compatible con ChatGPT, Claude y Gemini",
      local: "100% local — sin envío de datos a servidores",
      instant: "Enmascaramiento instantáneo, completamente reversible",
      vscode: "Extensión para VS Code disponible"
    },
    hiw: {
      label: "Cómo funciona", title: "Tres pasos para usar la IA de forma segura",
      sub: "Sin configuración previa. Pega, protege y comparte — en segundos.",
      step1: { title: "Pega tu texto", desc: "Pega cualquier texto, documento o código con información sensible en Ledebe." },
      step2: { title: "Ledebe lo enmascara", desc: "Todo el PII es reemplazado con marcadores como [LDB_EMAIL1] localmente — nada sale de tu dispositivo." },
      step3: { title: "Comparte con seguridad", desc: "Copia el texto protegido a cualquier herramienta de IA. Restaura el original en cualquier momento con un clic." }
    },
    feat: {
      label: "Funciones", title: "Todo lo que necesitas para usar la IA con seguridad",
      sub: "Para individuos, desarrolladores y equipos.",
      auto:       { title: "Detección Automática de PII",  desc: "Detecta y enmascara al instante correos, teléfonos, números NI, tarjetas de crédito, claves API y más." },
      custom:     { title: "Términos Personalizados",       desc: "Agrega tus propias palabras sensibles — nombres de empresas, códigos de proyecto, nombres de clientes." },
      reversible: { title: "Totalmente Reversible",         desc: "Los marcadores apuntan de vuelta a tus datos originales. Restaura el texto completo cuando quieras." },
      doc:        { title: "Carga de Documentos",           desc: "Sube PDFs, documentos Word, imágenes y archivos CSV. El PII se enmascara con vista previa lado a lado." },
      ai:         { title: "Modo Preguntar a la IA",        desc: "Envía tu texto enmascarado directamente a ChatGPT, Claude o Gemini con tu propia clave API." },
      highlight:  { title: "Seleccionar para Proteger",     desc: "Selecciona cualquier palabra en un mensaje para protegerla o desprotegerla instantáneamente." },
      sync:       { title: "Sincronización de Empresa",     desc: "Comparte una lista de términos protegidos en todo tu equipo. Una actualización del admin protege a todos." },
      ocr:        { title: "OCR de Imágenes",               desc: "Extrae y protege texto de imágenes automáticamente. Ideal para documentos escaneados y capturas." },
      keyboard:   { title: "Primero el Teclado",            desc: "Navegación completa por teclado con búsqueda ⌘K, nuevo chat ⌘⇧N y enviar ⌘↵." }
    },
    trust: {
      title: "Tus datos nunca salen de tu dispositivo",
      desc: "Toda la detección y enmascaramiento de PII ocurre localmente — en tu navegador o app de escritorio. Ledebe no tiene ningún servidor que vea tu contenido.",
      li1: "Procesamiento local — el enmascaramiento ocurre en tu dispositivo, no en nuestros servidores",
      li2: "Claves API almacenadas solo localmente — nunca subidas a Ledebe",
      li3: "Historial de chats guardado solo en el almacenamiento local de tu navegador",
      li4: "Compatible con GDPR — Ledebe no procesa datos personales",
      li5: "Totalmente reversible — tus datos originales nunca se destruyen",
      card1: "Sin procesamiento en servidor",
      card2: "Detección de IA local en tu dispositivo",
      card3: "Enmascaramiento totalmente reversible",
      card4: "Diseñado para cumplir con GDPR"
    },
    vscode: {
      title: "🧩 También disponible como extensión de VS Code",
      desc: "Protege código, configs y logs directamente en tu editor. Clic derecho → Proteger en cualquier archivo.",
      btn: "Instalar Extensión →"
    },
    pp: {
      label: "Precios", title: "Empieza gratis, escala cuando estés listo",
      sub: "Sin tarifas ocultas. Cancela en cualquier momento. La protección PII principal es siempre gratuita.",
      popular: "Más popular",
      personal: { name: "Personal", price: "Gratis", per: "siempre", f1: "Protección de texto ilimitada", f2: "Hasta 20 términos personalizados", f3: "3 cargas de archivos/día", f4: "Extensión VS Code", btn: "Comenzar →" },
      pro:      { name: "Profesional", per: "por mes", f1: "Términos personalizados ilimitados", f2: "Cargas de archivos ilimitadas", f3: "Chat IA (tu propia clave API)", f4: "Soporte prioritario", btn: "Obtener Pro →" },
      team:     { name: "Empresarial", per: "por usuario / mes", f1: "Sincronización de términos corporativos", f2: "Panel de administración", f3: "Registro de auditoría", f4: "Facturación por invoice", btn: "Obtener Equipo →" },
      ent:      { name: "Empresa", price: "Personalizado", per: "contrato anual", f1: "Despliegue en local", f2: "Informes GDPR / HIPAA", f3: "SLA de 99.9% de disponibilidad", f4: "Incorporación dedicada", btn: "Contáctanos →" },
      seeAll: "Ver comparación completa de precios y funciones →"
    },
    cta: {
      title: "Empieza a proteger tus datos hoy",
      sub: "Gratis. Sin cuenta requerida. Funciona en Mac, Windows y Linux.",
      bookDemoBtn: "Reservar Demo Gratis →"
    },
    footer: {
      tagline: "Protección de privacidad para todos los que usan IA. Tus datos se quedan en tu dispositivo, siempre.",
      product: "Producto", company: "Empresa", legal: "Legal",
      downloads: "Descargas", pricing: "Precios", documentation: "Documentación",
      vscodeExt: "Extensión VS Code", webApp: "App Web",
      about: "Acerca de", contact: "Contacto", bookDemo: "Reservar Demo",
      privacy: "Política de Privacidad", terms: "Términos de Servicio",
      copyright: "© 2026 Ledebe Technologies. Todos los derechos reservados."
    },
    pricing: {
      hero: {
        label: "Precios",
        title: "Precios simples y honestos",
        intro: 'Empieza gratis — sin tarjeta. Mejora cuando necesites más. Cancela en cualquier momento. Todos los planes de pago incluyen una <strong>garantía de devolución de 14 días</strong>.'
      },
      billing: {
        monthly: "Mensual", annual: "Anual", save: "Ahorra 20%",
        perMonth: "por mes", perYear: "por año",
        perUserMonth: "por usuario / mes", perUserYear: "por usuario / año",
        forever: "siempre", annualContract: "contrato anual",
        minUsers: "Mínimo 3 usuarios"
      },
      featured: "Más popular",
      whatsIncluded: "Qué incluye",
      everythingInFree: "Todo lo de Gratis, además",
      everythingInPro: "Todo lo de Pro, además",
      everythingInTeam: "Todo lo de Equipo, además",
      personal: {
        name: "Personal", title: "Gratis",
        desc: "Para quienes lo prueban o un uso diario ligero.",
        cta: "Empezar gratis",
        f1: "Protección de texto ilimitada", f2: "Hasta 20 términos personalizados",
        f3: "3 archivos al día", f4: "Últimas 30 conversaciones",
        f5: "Extensión VS Code", f6: "Modo oscuro / claro",
        f7: "Chat IA (con tu propia clave)", f8: "Subidas de archivos ilimitadas",
        f9: "Sincronización empresarial", f10: "Soporte prioritario"
      },
      pro: {
        name: "Profesional", title: "Pro",
        desc: "Para usuarios avanzados, freelancers y profesionales que necesitan más.",
        cta: "Empezar →",
        annualNote: "Ahorra £21 vs mensual",
        f1: "Términos personalizados ilimitados",
        f2: "Subidas de archivos ilimitadas (50 MB/archivo)",
        f3: "Chat IA con tu propia clave API",
        f4: "Historial de chat completo (ilimitado)",
        f5: "Exportar documentos protegidos",
        f6: "Soporte por email prioritario",
        f7: "Acceso anticipado a nuevas funciones",
        f8: "Sincronización empresarial", f9: "Panel de administración"
      },
      team: {
        name: "Empresarial", title: "Equipo",
        desc: "Para PYMEs y departamentos que necesitan control y visibilidad compartidos.",
        cta: "Empezar →",
        annualNote: "Ahorra £56 por usuario vs mensual",
        f1: "Sincronización empresarial — términos compartidos",
        f2: "Panel de administración y gestión de equipo",
        f3: "Términos protegidos gestionados centralmente",
        f4: "Registro de auditoría",
        f5: "Gestor de cuenta dedicado (10+ usuarios)",
        f6: "Facturación por invoice disponible",
        f7: "SSO — próximamente"
      },
      ent: {
        name: "Empresa", title: "Personalizado",
        desc: "Para grandes organizaciones e industrias reguladas.",
        priceLabel: "Personalizado", cta: "Habla con nosotros →",
        f1: "Opción de despliegue en local", f2: "Integraciones personalizadas",
        f3: "SLA de disponibilidad (términos en contrato)",
        f4: "Documentación de cumplimiento bajo petición",
        f5: "Biblioteca de términos personalizada",
        f6: "Onboarding dedicado", f7: "Descuentos por volumen"
      },
      trust: {
        t1Title: "Sin tarjeta",                t1Sub: "Empieza gratis, mejora después",
        t2Title: "Cancela cuando quieras",     t2Sub: "Sin compromisos ni penalizaciones",
        t3Title: "Cambia de plan libremente",  t3Sub: "Sube o baja al instante",
        t4Title: "Facturas incluidas",         t4Sub: "Recibos automáticos por cada pago",
        t5Title: "Pagos con Paddle",           t5Sub: "Pago seguro y compatible con PCI"
      },
      faq: {
        title: "Preguntas frecuentes",
        q1: "¿El plan gratuito es realmente gratis para siempre?",
        a1: "Sí. El plan Personal es gratuito indefinidamente — sin período de prueba, sin tarjeta de crédito. La protección PII principal siempre será gratuita.",
        q2: '¿Qué cuenta como una "subida de archivo"?',
        a2: "Cualquier PDF, documento Word, imagen (JPEG/PNG) o CSV que subas para análisis de PII. Los usuarios gratuitos tienen 3 subidas al día. Pro y superiores tienen subidas ilimitadas de hasta 50 MB por archivo.",
        q3: "¿Necesito proporcionar mi propia clave API de IA?",
        a3: 'Sí — para el chat IA (modo "Preguntar a la IA"), proporcionas tu propia clave API de OpenAI, Anthropic o Gemini. Esto mantiene tus datos protegidos completamente fuera de nuestros sistemas. Tu clave se almacena localmente y nunca se sube a Ledebe.',
        q4: "¿Cómo funciona la facturación del plan Equipo?",
        a4: "Los planes Equipo se facturan por usuario activo al mes (mínimo 3 usuarios). Puedes añadir o quitar puestos en cualquier momento — la facturación se ajusta automáticamente en el siguiente ciclo. Facturación por invoice disponible bajo petición.",
        q5: "¿Puedo cambiar de plan en cualquier momento?",
        a5: "Sí. Las mejoras se aplican inmediatamente. Las bajadas surten efecto al final del período de facturación actual, y mantienes acceso a las funciones de pago hasta entonces.",
        q6: "¿Qué métodos de pago aceptan?",
        a6: "Aceptamos todas las principales tarjetas de crédito y débito (Visa, Mastercard, Amex) a través de Paddle, nuestro proveedor de pagos. Los clientes empresariales pueden pagar por transferencia bancaria o factura.",
        q7: "¿Hay política de reembolso?",
        a7: "Ofrecemos un reembolso de 14 días en todos los planes de pago si no estás satisfecho. Contacta con hello@ledebe.com y lo gestionaremos sin preguntas."
      }
    },
    downloads: {
      hero: {
        label: "Consigue la app",
        title: "Descargar Ledebe",
        desc: "Gratis. Sin cuenta requerida. Disponible para Mac, Windows, Linux — o úsala directamente en tu navegador."
      },
      vscode: {
        title: "Extensión VS Code",
        desc: 'Protege código, configs y logs directamente en tu editor. Busca "Ledebe Protector" en el panel de Extensiones.',
        btn: "Instalar Extensión →"
      },
      mac: {
        heading: "macOS",
        siliconTitle: "Apple Silicon (M1, M2, M3)",
        siliconReq: "Requiere macOS 11 Big Sur o posterior",
        intelTitle: "Mac Intel",
        intelReq: "Requiere macOS 10.15 Catalina o posterior",
        btnDmg: "Descargar .dmg",
        btnZip: "Descargar .zip",
        notice: "🍎 <strong>Configuración inicial en macOS:</strong> Mientras completamos la notarización de Apple, macOS mostrará un aviso de seguridad en el primer inicio. Simplemente haz clic derecho en el icono → <strong>Abrir</strong> → <strong>Abrir</strong>. Esto solo ocurre una vez — es un paso estándar para apps nuevas distribuidas fuera del App Store."
      },
      win: {
        heading: "Windows",
        storeTitle: "Microsoft Store",
        storeBadge: "Recomendado",
        storeReq: "Firmado por Microsoft, auto-actualizaciones, sin avisos de seguridad",
        storeBtn: "Obtener de Microsoft Store →",
        directTitle: "Instalador Directo",
        directReq: "Compatible con Windows 10 y Windows 11",
        directBtn: "Descargar Setup .exe",
        notice: '⚠️ El aviso de <strong>SmartScreen</strong> solo aplica al Instalador Directo. Si ves "Windows protegió tu PC", haz clic en <strong>Más información</strong> → <strong>Ejecutar de todos modos</strong>. La versión de Microsoft Store está firmada por Microsoft y omite este aviso.'
      },
      linux: {
        heading: "Linux",
        appimageTitle: "AppImage (Universal)",
        appimageReq: "Funciona en Ubuntu 18.04+, Fedora, Debian y la mayoría de distros",
        appimageBtn: "Descargar .AppImage",
        snapTitle: "Paquete Snap",
        snapReq: "Para Ubuntu y distribuciones compatibles con Snap",
        snapBtn: "Descargar .snap",
        noticeIntro: "Configuración de AppImage:",
        noticeStep1: "Después de descargar, haz el archivo ejecutable antes de ejecutar:",
        noticeStep2: "Si no se inicia, instala libfuse2:"
      }
    },
    demo: {
      hero: {
        label: "Velo en acción",
        title: "Reserva una Demo Gratis",
        desc: "30 minutos. Sin compromiso. Ve exactamente cómo Ledebe protege tus datos sensibles antes de que lleguen a la IA."
      },
      cover: "Qué cubriremos",
      points: {
        p1Title: "Demo de enmascaramiento en vivo",
        p1Desc: "Ve la detección y enmascaramiento de PII en tiempo real con tu tipo de contenido.",
        p2Title: "Recorrido por el flujo con IA",
        p2Desc: "Cómo usar Ledebe con seguridad con ChatGPT, Claude o Gemini.",
        p3Title: "Protección de documentos",
        p3Desc: "Sube y analiza PDFs, documentos Word y hojas de cálculo en busca de PII.",
        p4Title: "Opciones para equipo y empresa",
        p4Desc: "Cómo funcionan las bibliotecas de términos compartidos y los paneles de admin para equipos.",
        p5Title: "Resolvemos tus dudas",
        p5Desc: "Trae tu caso de uso específico — te mostraremos cómo Ledebe lo gestiona."
      },
      meta: {
        durationLabel: "Duración:", durationVal: "30 minutos",
        formatLabel: "Formato:",    formatVal: "Videollamada (enlace enviado al confirmar)",
        costLabel: "Coste:",        costVal: "Gratis, sin compromiso",
        whoLabel: "Para quién:",    whoVal: "Fundadores, líderes de IT, responsables de cumplimiento, desarrolladores"
      }
    },
    contact: {
      hero: {
        label: "Ponte en contacto",
        title: "Contáctanos",
        desc: "Somos un equipo pequeño y leemos cada mensaje. Solemos responder en 24 horas."
      },
      responseNotice: "Escríbenos a <strong>hello@ledebe.com</strong> — solemos responder en 24 horas en días laborables.",
      cards: {
        generalTitle: "Consultas generales", generalDesc: "Preguntas sobre Ledebe, el producto, o cómo funciona.",
        supportTitle: "Soporte",              supportDesc: "Tienes problemas con la app o necesitas ayuda con tu cuenta.",
        entTitle: "Empresa",                  entDesc: "Interesado en planes Equipo o Empresa para tu organización.",
        privTitle: "Privacidad",              privDesc: "Solicitudes de privacidad, derechos GDPR o cuestiones de seguridad."
      },
      faqPrompt: {
        title: "¿Buscas respuestas rápidas?",
        desc: "Consulta nuestra documentación — la mayoría de las preguntas frecuentes están respondidas allí.",
        btn: "Explorar Documentación →"
      }
    },
    about: {
      hero: {
        label: "Nuestra historia",
        title: "Sobre Ledebe",
        desc: "Construimos la herramienta que deseábamos que existiera — una forma sencilla de trabajar con IA sin exponer datos sensibles."
      },
      why: {
        title: "Por qué existe Ledebe",
        p1: "Herramientas de IA como ChatGPT, Claude y Gemini están transformando la forma de trabajar. Pero hay un problema del que no se habla lo suficiente — para usar estas herramientas eficazmente, la gente pega correos reales, nombres reales, números de teléfono reales, documentos reales. Datos sensibles salen de los dispositivos y entran en sistemas de IA a diario, a menudo sin que los usuarios sean conscientes del riesgo.",
        p2: "Ledebe fue creado para resolver esto. Te permite trabajar con IA con libertad — sin exponer los datos que no te corresponde compartir.",
        highlight: "La idea central es simple: enmascara las partes sensibles antes de que salgan de tu dispositivo. Usa la IA libremente con la versión enmascarada. Restaura el original cuando lo necesites."
      },
      what: {
        title: "Qué construimos",
        intro: "Ledebe es una suite de herramientas de privacidad para personas, equipos y organizaciones que trabajan con IA a diario.",
        p1: "<strong>App de escritorio</strong> — disponible para Mac, Windows y Linux. Funciona offline, sin cuenta requerida.",
        p2: "<strong>Extensión VS Code</strong> — protege código, configs y logs directamente en tu editor.",
        p3: "<strong>Protección de archivos</strong> — sube PDFs, documentos Word e imágenes para escanear y enmascarar PII antes de compartir."
      },
      principles: {
        title: "Nuestros principios",
        v1Title: "Local primero",       v1Desc: "Toda la detección y enmascaramiento ocurre en tu dispositivo. Tus datos nunca tocan nuestros servidores.",
        v2Title: "Totalmente reversible", v2Desc: "Los datos enmascarados siempre se pueden restaurar. Nunca te bloqueamos el acceso a tu propio contenido.",
        v3Title: "Sin seguimiento",     v3Desc: "No recopilamos lo que proteges. Sin analíticas sobre tu contenido, nunca.",
        v4Title: "Para todos",          v4Desc: "Desde desarrolladores en solitario hasta equipos de cumplimiento empresarial — Ledebe funciona para todos."
      },
      who: {
        title: "Quiénes somos",
        p1: "Ledebe lo construye Ledebe Technologies — una empresa de software enfocada en herramientas de privacidad y productos de protección de datos. Somos un equipo pequeño y centrado que cree que la privacidad debería ser la opción por defecto, no algo añadido.",
        p2: '¿Tienes una pregunta o quieres trabajar con nosotros? Escríbenos a <strong><a href="mailto:hello@ledebe.com" style="color:var(--primary-blue);">hello@ledebe.com</a></strong>'
      },
      ctaBox: {
        title: "¿Listo para proteger tus datos?",
        desc: "Gratis. Sin cuenta requerida. Funciona en Mac, Windows y Linux.",
        bookBtn: "Reservar Demo Gratis →"
      }
    },
    docs: {
      hero: { title: "Documentación", subtitle: "Todo lo que necesitas para instalar y usar Ledebe Protector" },
      pageTitle: "Docs de Ledebe Protector",
      pageLead: "Ledebe Protector detecta y enmascara información de identificación personal (PII) antes de que compartas texto con herramientas de IA, colegas o servicios externos. Tus datos originales nunca salen de tu dispositivo.",
      sidebar: {
        started: "Empezar",
        overview: "Resumen", howToUse: "Cómo usar", requirements: "Requisitos del sistema",
        install: "Instalación",
        macSilicon: "macOS (Apple Silicon)", macIntel: "macOS (Intel)", windows: "Windows", linux: "Linux",
        using: "Usando Ledebe",
        protectText: "Proteger texto", highlightProtect: "Seleccionar para proteger/desproteger", customTerms: "Términos personalizados",
        fileUpload: "Subida de archivos", aiChat: "Chat IA", history: "Historial y búsqueda", keyboard: "Atajos de teclado",
        extensions: "Extensiones",
        vscode: "Extensión VS Code",
        help: "Ayuda",
        faq: "FAQ", troubleshooting: "Solución de problemas"
      },
      overview: {
        title: "Resumen",
        p1: "Ledebe Protector funciona reemplazando información sensible en tu texto con marcadores seguros, permitiéndote compartir o procesar el texto libremente. Puedes restaurar el contenido original en cualquier momento.",
        typesIntro: "Tipos de PII soportados:"
      },
      howToUse: {
        title: "Cómo usar Ledebe",
        subtitle: "¿Nuevo en Ledebe? Sigue estos pasos para proteger y compartir texto con seguridad en menos de un minuto.",
        s1Title: "Paso 1 — Escribe o pega tu texto",
        s1Body: "Abre la app y escribe (o pega) cualquier texto con información sensible en el área de entrada principal. Puede ser un correo, un ticket de soporte, un extracto de contrato — lo que sea.",
        s1Example: 'Ejemplo: <em>"Hola, mi nombre es Sarah Jones, correo sarah@company.com y mi teléfono es 07911 123456."</em>',
        s2Title: "Paso 2 — Pulsa Enviar / Proteger",
        s2Body: "Pulsa el botón <strong>Enviar</strong> (o pulsa <strong>Ctrl + Enter</strong> / <strong>⌘ Cmd + Enter</strong> en Mac). Ledebe analiza tu texto automáticamente y reemplaza cada PII detectado con un marcador seguro.",
        s2Example: 'El resultado se verá así: <em>"Hola, mi nombre es [LDB_CUSTOM1], correo [LDB_EMAIL1] y mi teléfono es [LDB_PHONE1]."</em> — seguro para compartir en cualquier sitio.',
        s3Title: "Paso 3 — Alterna entre vistas",
        s3Body: "Cada mensaje tiene dos pestañas debajo: <strong>Texto sin formato</strong> — tu texto original, sin enmascarar (visible solo para ti). <strong>Texto protegido</strong> — la versión enmascarada con marcadores, seguro para copiar y compartir.",
        s4Title: "Paso 4 — Copia el texto protegido",
        s4Body: "Pulsa el botón <strong>📋 Copiar</strong> en el mensaje, o pulsa <strong>Ctrl/⌘ Cmd + Shift + X</strong>, para copiar la versión protegida al portapapeles. Pégalo en ChatGPT, un correo, un sistema de soporte — donde lo necesites.",
        s5Title: "Paso 5 — Restaura el original (opcional)",
        s5Body: "Si recibes una respuesta que contiene marcadores (p. ej. de una herramienta de IA), pégala de vuelta en Ledebe. Cambiará automáticamente los marcadores por los valores reales, para que puedas leer la respuesta con tus datos.",
        s6Title: "Paso 6 — Añade términos personalizados (opcional)",
        s6Body: "¿Tienes palabras específicas que siempre quieres ocultar — como el nombre de tu empresa, un código de proyecto o un nombre de cliente? Añádelos a <strong>Términos personalizados</strong> en la barra lateral. Se enmascararán automáticamente cada vez.",
        s6Tip: '<strong>Consejo rápido:</strong> Mientras escribes, Ledebe sugiere palabras para añadir como términos personalizados. Si una palabra ya está protegida, muestra un chip verde <em>"ya protegida"</em> para que no añadas el mismo término dos veces.',
        modeTitle: "Cambiar entre Proteger y Preguntar a la IA",
        modeIntro: "En la parte inferior de la pantalla, justo encima del cuadro de texto, verás un selector de modo:",
        modeProtect: "<strong>🛡️ Proteger (por defecto)</strong> — enmascara tu texto y te muestra la versión segura para copiar. No se envía nada a ninguna IA. Úsalo cuando solo quieras sanear texto antes de pegarlo.",
        modeAsk: "<strong>🤖 Preguntar a la IA</strong> — envía tu mensaje directamente a una IA (OpenAI, Anthropic o Google) con el PII ya enmascarado. La IA responde, y ves tanto la respuesta como una versión \"Segura para compartir\" re-enmascarada. Úsalo para una experiencia de chat IA totalmente privada.",
        modeTip: "Puedes cambiar de modo en cualquier momento — incluso en mitad de la conversación. El selector recuerda tu última elección."
      },
      reqs: {
        title: "Requisitos del sistema"
      },
      macSilicon: {
        title: "macOS",
        intro: "Para Macs M1, M2 y M3. Descarga el archivo <strong>arm64.dmg</strong>.",
        stepsTitle: "Pasos de instalación",
        gateWarning: "<strong>Aviso de Gatekeeper:</strong> En el primer inicio, macOS puede mostrar \"No se puede abrir Ledebe Protector porque proviene de un desarrollador no identificado.\" Para evitarlo: clic derecho en el icono → <strong>Abrir</strong> → <strong>Abrir</strong> en el diálogo. Solo necesitas hacerlo una vez.",
        altTip: "Alternativamente, ve a <strong>Ajustes del Sistema → Privacidad y Seguridad</strong> y pulsa <strong>Abrir de todos modos</strong> junto a la entrada de Ledebe Protector."
      },
      macIntel: {
        title: "macOS",
        intro: "Para Macs basados en Intel. Descarga el archivo <strong>x64.dmg</strong>.",
        stepsTitle: "Pasos de instalación",
        gateWarning: "Mismo comportamiento de Gatekeeper que Apple Silicon — clic derecho → <strong>Abrir</strong> en el primer inicio si macOS lo bloquea."
      },
      windows: {
        title: "Windows",
        intro: "Descarga el instalador NSIS <strong>Ledebe Protector Setup 1.0.0.exe</strong>. Esto crea accesos directos en el Menú Inicio, un icono en el escritorio y un desinstalador.",
        stepsTitle: "Pasos de instalación",
        smartScreen: "El aviso de <strong>SmartScreen</strong> es normal para apps recién publicadas sin un certificado EV de firma de código. La app es segura — pulsa <strong>Más información → Ejecutar de todos modos</strong> para continuar.",
        uninstall: "Para desinstalar: ve a <strong>Configuración → Aplicaciones</strong>, encuentra Ledebe Protector y pulsa <strong>Desinstalar</strong>."
      },
      linux: {
        title: "Linux",
        intro: "Ledebe Protector se distribuye como un <strong>AppImage</strong> universal — sin instalación requerida. Funciona en Ubuntu, Debian, Fedora, Arch y la mayoría de distros.",
        stepsTitle: "Pasos de instalación",
        gui: "También puedes hacer clic derecho en el AppImage en tu administrador de archivos → <strong>Propiedades → Permisos</strong> → marcar <strong>\"Permitir ejecutar el archivo como programa\"</strong>, y luego doble clic para ejecutar.",
        fuseHelp: "Algunas distros requieren <code>libfuse2</code> para AppImages. Si la app no se inicia, instálalo:"
      },
      protectText: {
        title: "Proteger texto",
        tip: "Los marcadores son consistentes dentro de una sesión — el mismo correo siempre se mapea al mismo marcador, por lo que la estructura de tu texto se preserva."
      },
      highlightProtect: {
        title: "Seleccionar para proteger/desproteger",
        intro: "Puedes proteger o desproteger palabras individuales directamente desde cualquier mensaje enviado — sin reescribir nada.",
        protectTitle: "Proteger una palabra",
        unprotectTitle: "Desproteger una palabra",
        info: "Esto funciona dentro de los mensajes del chat y dentro de la vista previa del documento. Los cambios surten efecto inmediatamente — no es necesario reenviar el mensaje."
      },
      customTerms: {
        title: "Términos personalizados",
        intro: "Añade tus propias palabras o frases para proteger siempre — nombres, nombres de empresa, códigos de proyecto, cualquier cosa sensible.",
        addTitle: "Añadir un término",
        searchTitle: "Buscar tus términos",
        searchIntro: "Si tienes muchos términos guardados, usa la búsqueda integrada para encontrarlos rápidamente.",
        searchTip: 'El popup de búsqueda muestra un contador, p. ej. <em>"4 de 47 términos"</em>, para que siempre sepas cuántos términos coinciden con tu consulta.'
      },
      fileUpload: {
        title: "Subida de archivos",
        intro: "Ledebe puede procesar documentos enteros — no solo texto escrito. Sube un archivo y extrae, protege y muestra el contenido por ti.",
        uploadTitle: "Cómo subir",
        supportedTitle: "Tipos de archivo soportados",
        previewTitle: "Vista previa del documento",
        previewIntro: "Después de subir, pulsa la tarjeta del documento para abrir el modal de vista previa. Muestra dos vistas en paralelo:",
        previewDownload: "Desde la vista previa puedes <strong>📥 Descargar</strong> la versión protegida como archivo.",
        previewHighlight: "También puedes seleccionar texto dentro de la vista previa para activar el botón flotante <strong>🛡️ Proteger</strong> / <strong>🔓 Desproteger</strong>, igual que en los mensajes del chat."
      },
      aiChat: {
        title: "Chat IA",
        intro: "Cambia al modo <strong>Preguntar a la IA</strong> para enviar preguntas directamente a una IA. Ledebe enmascara tu PII antes de que se envíe el mensaje, por lo que la IA nunca ve tus datos reales.",
        setupTitle: "Configuración",
        keyInfo: "Las claves API se almacenan solo localmente — nunca se envían a los servidores de Ledebe."
      },
      history: {
        title: "Historial y búsqueda",
        intro: "Cada conversación se guarda automáticamente en tu historial local. La barra lateral izquierda lista todos los chats anteriores.",
        usingTitle: "Usar el historial",
        searchTitle: "Buscar el historial con ⌘K",
        searchIntro: "Pulsa <strong>⌘K</strong> (Mac) o <strong>Ctrl+K</strong> (Windows) para abrir la paleta de comandos — una búsqueda rápida sobre todos tus chats anteriores.",
        searchTip: "También puedes pulsar el botón <strong>Buscar historial</strong> en la parte superior de la barra lateral para abrir la misma paleta."
      },
      keyboard: {
        title: "Atajos de teclado",
        intro: "Ledebe es totalmente navegable por teclado. Usa estos atajos para trabajar más rápido:",
        colAction: "Acción", colMac: "Mac", colWin: "Windows / Linux",
        rSearch: "Buscar historial (paleta de comandos)",
        rNew: "Nuevo chat",
        rSend: "Enviar mensaje",
        rToggle: "Alternar barra lateral",
        rAll: "Mostrar todos los atajos"
      },
      vscode: {
        title: "Extensión VS Code",
        intro: "Ledebe también está disponible como <strong>extensión de VS Code</strong> — creada para desarrolladores que quieren proteger datos sensibles antes de compartir código, logs o archivos de configuración con herramientas de IA como GitHub Copilot o ChatGPT.",
        installTitle: "Instalar",
        featuresTitle: "Funciones",
        shortcutTitle: "Atajo de teclado",
        colAction: "Acción", colShortcut: "Atajo",
        rProtect: "Proteger el texto seleccionado",
        tip: "Los términos personalizados añadidos en la extensión VS Code se guardan por perfil de VS Code — separados de la lista de términos de la app de escritorio."
      },
      faq: {
        title: "FAQ",
        q1: "¿Cómo desprotejo una palabra que ya he protegido?",
        a1: "Selecciona la palabra dentro de cualquier mensaje enviado. Si ya está en tus términos protegidos, el botón flotante mostrará <strong>🔓 Desproteger</strong> (en rojo). Púlsalo y la palabra se elimina de tus términos y el mensaje se actualiza inmediatamente.",
        q2: "¿Cómo busco en mi historial de chat?",
        a2: "Pulsa <strong>⌘K</strong> (Mac) o <strong>Ctrl+K</strong> (Windows) para abrir la paleta de comandos. Empieza a escribir para filtrar chats anteriores, usa las flechas para navegar y pulsa Enter para abrir uno. Pulsa Esc para cerrar.",
        q3: "¿Ledebe envía mis datos a algún sitio?",
        a3: "No. Toda la detección y enmascaramiento de PII ocurre localmente en tu dispositivo. El único tráfico saliente es cuando usas la función de chat IA — en ese caso, solo el texto <em>enmascarado</em> (con marcadores, no tus datos reales) se envía a la API del proveedor de IA.",
        q4: "¿Puedo restaurar el texto original después de compartir la versión protegida?",
        a4: "Sí — mientras estés en la misma sesión o el mapa de marcadores se haya guardado. Pega el texto protegido de vuelta en Ledebe y pulsa <strong>Restaurar</strong>.",
        q5: "¿Dónde se almacenan mis claves API?",
        a5: "Las claves API se almacenan solo en el almacenamiento local de tu dispositivo. Nunca se suben a los servidores de Ledebe ni se incluyen en ningún informe de fallo.",
        q6: "La app dice que es de un desarrollador no identificado en Mac — ¿es segura?",
        a6: "Sí, es segura. Este aviso aparece porque la app aún no está inscrita en el programa de notarización de Apple. Clic derecho en la app → <strong>Abrir</strong> → <strong>Abrir</strong> para evitarlo. Solo necesitas hacerlo una vez.",
        q7: "Windows SmartScreen bloqueó el instalador — ¿qué hago?",
        a7: "Pulsa <strong>Más información</strong> en el diálogo de SmartScreen, luego pulsa <strong>Ejecutar de todos modos</strong>. Este aviso aparece para apps recién publicadas. El instalador es seguro.",
        q8: "El AppImage de Linux no se inicia — ¿qué hago?",
        a8: 'Asegúrate de que el archivo tiene permiso de ejecución: <code>chmod +x "Ledebe Protector-1.0.0.AppImage"</code>. Si sigue fallando, instala <code>libfuse2</code>: en Ubuntu/Debian ejecuta <code>sudo apt install libfuse2</code>.'
      },
      trouble: {
        title: "Solución de problemas",
        crashTitle: "La app se cierra al iniciar",
        crashBody: "Los informes de fallo se almacenan en <code>~/.ledebe-crashes/</code>. Si necesitas soporte, incluye el último log de fallo cuando nos contactes.",
        piiTitle: "El PII no se detecta",
        piiBody: "Asegúrate de que el formato del texto coincide con un patrón soportado. Para formatos inusuales (p. ej. formatos de teléfono no estándar), añade el valor como <strong>Término personalizado</strong>.",
        aiTitle: "El chat IA no responde",
        darkTitle: "El modo oscuro no se guarda",
        darkBody: "La preferencia del modo oscuro se almacena en el almacenamiento local. Limpiar la caché del navegador (en Electron: <strong>Configuración → Borrar datos</strong>) la restablecerá.",
        helpInfo: '¿Necesitas más ayuda? Escríbenos a <a href="mailto:hello@ledebe.com" style="color: var(--primary-blue);">hello@ledebe.com</a> o visita la <a href="/contact/" style="color: var(--primary-blue);">página de contacto</a>.'
      }
    },
    privacy: {
      hero: {
        label: "Legal",
        title: "Política de Privacidad",
        desc: "Cómo Ledebe gestiona tus datos — y por qué la mayoría nunca sale de tu dispositivo."
      },
      lastUpdated: "Última actualización: abril de 2026",
      highlight: "🛡️ La versión corta: Ledebe enmascara tus datos sensibles localmente en tu dispositivo. No recopilamos, almacenamos ni transmitimos tus datos personales ni el contenido que proteges. Tus datos son tuyos.",
      s1: {
        title: "1. Quiénes somos",
        p1: "Ledebe es una herramienta de privacidad creada por Ledebe Technologies. Nuestro producto ayuda a personas y organizaciones a proteger información de identificación personal (PII) antes de compartir contenido con herramientas de IA, colegas o terceros.",
        p2: "Si tienes preguntas sobre esta política, contáctanos en: <strong>hello@ledebe.com</strong>"
      },
      s2: {
        title: "2. Qué datos recopilamos",
        notTitle: "Datos que NO recopilamos",
        not1: "El texto que pegas en Ledebe",
        not2: "El PII detectado en tu contenido (nombres, correos, teléfonos, etc.)",
        not3: "Tu lista de términos personalizados",
        not4: "Tu historial de chat",
        not5: "Tus claves API para OpenAI, Anthropic, Google o cualquier otro proveedor",
        not6: "Tus documentos o archivos subidos",
        mayTitle: "Datos que podemos recopilar (anonimizados)",
        may1: "Analíticas básicas de uso — visitas de página, qué funciones se usan (sin datos personales asociados)",
        may2: "Informes de error — si la app falla, puede generarse un informe anónimo para ayudarnos a corregir errores",
        may3: "Conteo de descargas — cuántas veces se descarga la app de escritorio"
      },
      s3: {
        title: "3. Dónde residen tus datos",
        p1: "Toda la detección y enmascaramiento de PII ocurre <strong>localmente en tu dispositivo</strong> — en tu navegador o app de escritorio. Ningún contenido se envía a los servidores de Ledebe durante este proceso.",
        localTitle: "Almacenamiento local",
        local1: "<strong>Términos personalizados</strong> — almacenados en el localStorage de tu navegador o en el almacenamiento local de la app de escritorio. Nunca se suben.",
        local2: "<strong>Historial de chat</strong> — almacenado solo localmente en tu dispositivo.",
        local3: "<strong>Claves API</strong> — almacenadas en el localStorage de tu navegador o en los ajustes de VS Code. Nunca se transmiten a Ledebe.",
        local4: "<strong>Preferencias de tema/ajustes</strong> — almacenadas localmente.",
        aiTitle: "Cuando usas el modo Chat IA",
        aiBody: "Si usas la función Preguntar a la IA de Ledebe, tu texto enmascarado (con marcadores como [LDB_EMAIL1], nunca tus datos reales) se envía directamente desde tu dispositivo al proveedor de IA elegido (OpenAI, Anthropic o Google) usando tu propia clave API. Ledebe no ve, intercepta ni almacena esta comunicación."
      },
      s4: {
        title: "4. Servicios de terceros",
        aws: "<strong>AWS S3</strong> — aloja el sitio web de Ledebe y las descargas de la app. La política de privacidad de AWS se aplica a la infraestructura de alojamiento.",
        cf: "<strong>Cloudflare</strong> — proporciona DNS, CDN y protección DDoS para ledebe.com. Cloudflare puede registrar datos de tráfico anonimizados.",
        ai: "<strong>OpenAI / Anthropic / Google</strong> — si usas el modo Chat IA con tu propia clave API, tus prompts enmascarados se envían a estos proveedores. Se aplican sus respectivas políticas de privacidad.",
        vsm: "<strong>VS Code Marketplace</strong> — la extensión VS Code se distribuye a través del marketplace de Microsoft. La política de privacidad de Microsoft se aplica al proceso de descarga e instalación.",
        trail: "Ledebe no vende, alquila ni comparte tus datos con ningún tercero con fines de marketing."
      },
      s5: {
        title: "5. Cookies",
        p1: "El sitio web de Ledebe usa cookies mínimas:",
        func: "<strong>Cookies funcionales</strong> — recuerdan tu preferencia de idioma y tema.",
        noAds: "No usamos cookies publicitarias ni cookies de seguimiento entre sitios."
      },
      s6: {
        title: "6. Tus derechos (GDPR)",
        p1: "Si te encuentras en el Espacio Económico Europeo (EEE) o el Reino Unido, tienes los siguientes derechos:",
        access: "<strong>Derecho de acceso</strong> — solicitar una copia de los datos personales que tengamos sobre ti.",
        erasure: "<strong>Derecho de supresión</strong> — solicitar la eliminación de tus datos personales.",
        portability: "<strong>Derecho de portabilidad</strong> — recibir tus datos en formato legible por máquina.",
        object: "<strong>Derecho de oposición</strong> — oponerte al tratamiento de tus datos personales.",
        rectify: "<strong>Derecho de rectificación</strong> — solicitar la corrección de datos inexactos.",
        trail: "Dado que Ledebe almacena casi ningún dato personal, la mayoría de estos derechos se satisfacen automáticamente. Para ejercer cualquier derecho, contacta: <strong>hello@ledebe.com</strong>"
      },
      s7: {
        title: "7. Seguridad de los datos",
        p1: "Nos tomamos la seguridad en serio:",
        https: "El sitio web se sirve a través de HTTPS.",
        noServer: "Ningún contenido sensible del usuario llega a nuestros servidores.",
        keys: "Las claves API se almacenan localmente y nunca se transmiten a Ledebe.",
        review: "Revisamos regularmente nuestra infraestructura para detectar vulnerabilidades de seguridad."
      },
      s8: {
        title: "8. Privacidad de los menores",
        p1: "Ledebe no está dirigido a menores de 13 años. No recopilamos conscientemente información personal de menores. Si crees que un menor nos ha proporcionado información personal, contáctanos en hello@ledebe.com y la eliminaremos."
      },
      s9: {
        title: "9. Cambios en esta política",
        p1: 'Podemos actualizar esta Política de Privacidad de vez en cuando. Notificaremos a los usuarios sobre cambios significativos actualizando la fecha de "Última actualización" en la parte superior de esta página. El uso continuado de Ledebe después de los cambios constituye la aceptación de la política actualizada.'
      },
      s10: {
        title: "10. Contacto",
        p1: "Para cualquier pregunta o solicitud relacionada con la privacidad:",
        email: "Email: <strong>hello@ledebe.com</strong>",
        site: "Sitio web: <strong>ledebe.com</strong>"
      }
    },
    terms: {
      hero: { label: "Legal", title: "Términos de Servicio", desc: "Las reglas y directrices para usar Ledebe." },
      lastUpdated: "Última actualización: abril de 2026",
      highlight: "Al usar Ledebe, aceptas estos términos. Por favor léelos — están escritos en lenguaje sencillo y diseñados para ser justos tanto para ti como para nosotros.",
      s1: {
        title: "1. Aceptación de los Términos",
        p1: "Al acceder o usar Ledebe (la app web, la app de escritorio o la extensión VS Code), aceptas estar vinculado por estos Términos de Servicio. Si no estás de acuerdo, por favor no uses el producto.",
        p2: "Estos términos se aplican a todos los usuarios — personas, equipos y organizaciones."
      },
      s2: {
        title: "2. Qué hace Ledebe",
        p1: "Ledebe es una herramienta de privacidad que detecta y enmascara información de identificación personal (PII) en texto y documentos antes de que los compartas con herramientas de IA u otras partes. El proceso de enmascaramiento ocurre localmente en tu dispositivo.",
        p2: "Ledebe es una herramienta para ayudar con la privacidad — no es una garantía de protección total de los datos. Sigues siendo responsable de revisar tu contenido antes de compartirlo."
      },
      s3: {
        title: "3. Tu cuenta y responsabilidad",
        i1: "Eres responsable de mantener la seguridad de las claves API almacenadas en Ledebe.",
        i2: "Eres responsable del contenido que procesas a través de Ledebe.",
        i3: "No debes usar Ledebe para ningún propósito ilegal.",
        i4: "No debes intentar realizar ingeniería inversa, modificar o distribuir el software de Ledebe sin permiso."
      },
      s4: {
        title: "4. Uso aceptable",
        p1: "Aceptas no usar Ledebe para:",
        i1: "Procesar contenido que viole cualquier ley o regulación aplicable",
        i2: "Intentar eludir, sortear o desactivar cualquier función de seguridad",
        i3: "Raspar, copiar o redistribuir el software o la interfaz de Ledebe",
        i4: "Usar Ledebe de cualquier forma que pueda dañar a otros usuarios o terceros",
        i5: "Suplantar a cualquier persona u organización"
      },
      s5: {
        title: "5. Niveles gratuitos y de pago",
        p1: "Ledebe ofrece un nivel gratuito y planes de suscripción de pago. Las funciones disponibles en cada nivel se describen en nuestra página de precios.",
        i1: "Las funciones del nivel gratuito pueden cambiar con el tiempo con aviso razonable.",
        i2: "Las suscripciones de pago se facturan por adelantado de forma mensual o anual.",
        i3: "Ofrecemos una garantía de devolución de 14 días en todos los planes de pago. Contacta con hello@ledebe.com dentro de los 14 días posteriores al pago y emitiremos un reembolso completo, sin preguntas.",
        i4: "Nos reservamos el derecho de cambiar los precios con 30 días de aviso a los suscriptores existentes."
      },
      s6: {
        title: "6. Propiedad intelectual",
        p1: "Ledebe y todos sus componentes — incluidos el software, el diseño, el logotipo y la documentación — son propiedad de Ledebe Technologies. No puedes copiar, reproducir ni distribuir ninguna parte de Ledebe sin permiso por escrito.",
        p2: "Tu contenido sigue siendo tuyo. Al usar Ledebe, no nos concedes ningún derecho sobre tu contenido."
      },
      s7: {
        title: "7. Servicios de terceros",
        p1: "Ledebe se integra con proveedores de IA de terceros (OpenAI, Anthropic, Google) a través de tus propias claves API. Tu uso de estos servicios se rige por sus respectivos términos de servicio. Ledebe no es responsable del comportamiento, la disponibilidad ni las políticas de estos servicios de terceros."
      },
      s8: {
        title: "8. Exención de garantías",
        p1: 'Ledebe se proporciona "tal cual" sin garantías de ningún tipo, expresas o implícitas. No garantizamos que:',
        i1: "Ledebe detectará todo el PII en cada pieza de contenido",
        i2: "El servicio será ininterrumpido o libre de errores",
        i3: "Los resultados cumplirán tus requisitos específicos",
        p2: "Eres responsable de verificar que Ledebe ha enmascarado correctamente todos los datos sensibles antes de compartir cualquier contenido."
      },
      s9: {
        title: "9. Limitación de responsabilidad",
        p1: "En la máxima medida permitida por la ley, Ledebe Technologies no será responsable de daños indirectos, incidentales, especiales, consecuentes o punitivos derivados de tu uso de Ledebe — incluidas, entre otras, las filtraciones de datos resultantes del contenido que compartiste después de procesarlo a través de Ledebe.",
        p2: "Nuestra responsabilidad total ante ti por cualquier reclamación no excederá el importe que nos pagaste en los 12 meses anteriores a la reclamación."
      },
      s10: {
        title: "10. Terminación",
        p1: "Nos reservamos el derecho de suspender o cancelar el acceso a Ledebe para usuarios que violen estos términos, con o sin previo aviso.",
        p2: "Puedes dejar de usar Ledebe en cualquier momento. Si tienes una suscripción de pago, puedes cancelarla en cualquier momento — el acceso continúa hasta el final del período de facturación."
      },
      s11: {
        title: "11. Cambios en estos términos",
        p1: 'Podemos actualizar estos Términos de Servicio de vez en cuando. Notificaremos a los usuarios sobre cambios significativos actualizando la fecha de "Última actualización" y, cuando corresponda, por correo electrónico. El uso continuado de Ledebe después de los cambios constituye la aceptación de los términos actualizados.'
      },
      s12: {
        title: "12. Ley aplicable",
        p1: "Estos términos se rigen por las leyes de Inglaterra y Gales. Cualquier disputa estará sujeta a la jurisdicción exclusiva de los tribunales de Inglaterra y Gales."
      },
      s13: {
        title: "13. Contacto",
        p1: "Para preguntas sobre estos términos:",
        email: "Email: <strong>hello@ledebe.com</strong>",
        site: "Sitio web: <strong>ledebe.com</strong>"
      }
    }
  },

  fr: {
    nav: { home: "Accueil", pricing: "Tarifs", docs: "Docs", bookDemo: "Réserver une Démo" },
    hero: {
      badge: "Protection IA axée sur la vie privée",
      title: 'Protégez Vos Données <span>Avant l\'IA</span>',
      subtitle: "Ledebe masque les emails, numéros de téléphone, clés API et données personnelles avant qu'ils quittent votre appareil — pour utiliser ChatGPT, Claude et Copilot en toute sécurité.",
      bookDemoBtn: "Réserver une Démo Gratuite →",
      webAppBtn: "Essayer l'App Web →"
    },
    mockup: { yourInput: "Votre saisie", protectedOutput: "Sortie protégée", badge: "🛡️ 3 éléments protégés" },
    proof: {
      works: "Compatible avec ChatGPT, Claude et Gemini",
      local: "100% local — aucune donnée envoyée aux serveurs",
      instant: "Masquage instantané, entièrement réversible",
      vscode: "Extension VS Code disponible"
    },
    hiw: {
      label: "Comment ça marche", title: "Trois étapes pour utiliser l'IA en sécurité",
      sub: "Sans configuration. Collez, protégez et partagez — en quelques secondes.",
      step1: { title: "Collez votre texte", desc: "Collez n'importe quel texte, document ou code contenant des informations sensibles dans Ledebe." },
      step2: { title: "Ledebe le masque", desc: "Toutes les données PII sont remplacées par des marqueurs comme [LDB_EMAIL1] localement — rien ne quitte l'appareil." },
      step3: { title: "Partagez en sécurité", desc: "Copiez le texte protégé dans n'importe quel outil IA. Restaurez l'original à tout moment en un clic." }
    },
    feat: {
      label: "Fonctionnalités", title: "Tout ce qu'il faut pour utiliser l'IA en toute sécurité",
      sub: "Pour les particuliers, les développeurs et les équipes.",
      auto:       { title: "Détection Automatique des PII",  desc: "Détecte et masque instantanément les emails, numéros de téléphone, numéros NI, cartes de crédit, clés API et plus." },
      custom:     { title: "Termes Personnalisés",            desc: "Ajoutez vos propres mots sensibles — noms d'entreprises, codes de projet, noms de clients." },
      reversible: { title: "Entièrement Réversible",          desc: "Les marqueurs pointent vers vos données d'origine. Restaurez le texte complet à tout moment." },
      doc:        { title: "Téléchargement de Documents",     desc: "Téléchargez des PDFs, docs Word, images et fichiers CSV. Les PII sont masquées avec un aperçu côte à côte." },
      ai:         { title: "Mode Interroger l'IA",            desc: "Envoyez votre texte masqué directement à ChatGPT, Claude ou Gemini avec votre propre clé API." },
      highlight:  { title: "Surligner pour Protéger",         desc: "Surlignez n'importe quel mot dans un message pour le protéger ou le déprotéger instantanément." },
      sync:       { title: "Synchronisation d'Entreprise",    desc: "Partagez une liste de termes protégés dans toute votre équipe. Une mise à jour admin protège tout le monde." },
      ocr:        { title: "OCR d'Images",                    desc: "Extrayez et protégez automatiquement le texte des images. Idéal pour les documents scannés et captures d'écran." },
      keyboard:   { title: "Navigation au Clavier",           desc: "Navigation complète au clavier avec recherche ⌘K, nouveau chat ⌘⇧N et envoyer ⌘↵." }
    },
    trust: {
      title: "Vos données ne quittent jamais votre appareil",
      desc: "Toute la détection et le masquage des PII s'effectuent localement — dans votre navigateur ou application de bureau. Ledebe n'a aucun serveur qui voit votre contenu.",
      li1: "Traitement local — le masquage se fait sur votre appareil, pas sur nos serveurs",
      li2: "Clés API stockées localement uniquement — jamais téléchargées vers Ledebe",
      li3: "Historique des chats enregistré uniquement dans le stockage local de votre navigateur",
      li4: "Conforme RGPD — aucune donnée personnelle traitée par Ledebe",
      li5: "Entièrement réversible — vos données originales ne sont jamais détruites",
      card1: "Aucun traitement côté serveur",
      card2: "Détection IA locale sur votre appareil",
      card3: "Masquage entièrement réversible",
      card4: "Conçu pour le RGPD"
    },
    vscode: {
      title: "🧩 Aussi disponible comme extension VS Code",
      desc: "Protégez le code, les configs et les logs directement dans votre éditeur. Clic droit → Protéger sur n'importe quel fichier.",
      btn: "Installer l'Extension →"
    },
    pp: {
      label: "Tarifs", title: "Commencez gratuitement, évoluez à votre rythme",
      sub: "Pas de frais cachés. Annulez à tout moment. La protection PII de base est toujours gratuite.",
      popular: "Le plus populaire",
      personal: { name: "Personnel", price: "Gratuit", per: "pour toujours", f1: "Protection de texte illimitée", f2: "Jusqu'à 20 termes personnalisés", f3: "3 téléchargements de fichiers/jour", f4: "Extension VS Code", btn: "Commencer →" },
      pro:      { name: "Professionnel", per: "par mois", f1: "Termes personnalisés illimités", f2: "Téléchargements illimités", f3: "Chat IA (votre propre clé API)", f4: "Support prioritaire", btn: "Obtenir Pro →" },
      team:     { name: "Business", per: "par utilisateur / mois", f1: "Synchronisation des termes d'entreprise", f2: "Tableau de bord admin", f3: "Journal d'audit", f4: "Facturation sur facture", btn: "Obtenir l'Équipe →" },
      ent:      { name: "Entreprise", price: "Sur mesure", per: "contrat annuel", f1: "Déploiement sur site", f2: "Rapports RGPD / HIPAA", f3: "SLA de disponibilité 99,9%", f4: "Onboarding dédié", btn: "Nous contacter →" },
      seeAll: "Voir la comparaison complète des tarifs et fonctionnalités →"
    },
    cta: {
      title: "Commencez à protéger vos données aujourd'hui",
      sub: "Gratuit. Aucun compte requis. Fonctionne sur Mac, Windows et Linux.",
      bookDemoBtn: "Réserver une Démo Gratuite →"
    },
    footer: {
      tagline: "Protection axée sur la vie privée pour tous ceux qui utilisent l'IA. Vos données restent sur votre appareil, toujours.",
      product: "Produit", company: "Entreprise", legal: "Légal",
      downloads: "Téléchargements", pricing: "Tarifs", documentation: "Documentation",
      vscodeExt: "Extension VS Code", webApp: "App Web",
      about: "À propos", contact: "Contact", bookDemo: "Réserver une Démo",
      privacy: "Politique de Confidentialité", terms: "Conditions d'Utilisation",
      copyright: "© 2026 Ledebe Technologies. Tous droits réservés."
    },
    pricing: {
      hero: {
        label: "Tarifs",
        title: "Tarifs simples et honnêtes",
        intro: 'Commencez gratuitement — sans carte. Évoluez quand vous en avez besoin. Annulez à tout moment. Tous les plans payants incluent une <strong>garantie de remboursement de 14 jours</strong>.'
      },
      billing: {
        monthly: "Mensuel", annual: "Annuel", save: "Économisez 20%",
        perMonth: "par mois", perYear: "par an",
        perUserMonth: "par utilisateur / mois", perUserYear: "par utilisateur / an",
        forever: "pour toujours", annualContract: "contrat annuel",
        minUsers: "Minimum 3 utilisateurs"
      },
      featured: "Le plus populaire",
      whatsIncluded: "Ce qui est inclus",
      everythingInFree: "Tout ce qui est dans Gratuit, plus",
      everythingInPro: "Tout ce qui est dans Pro, plus",
      everythingInTeam: "Tout ce qui est dans Équipe, plus",
      personal: {
        name: "Personnel", title: "Gratuit",
        desc: "Pour les particuliers qui essaient ou un usage quotidien léger.",
        cta: "Commencer gratuitement",
        f1: "Protection de texte illimitée", f2: "Jusqu'à 20 termes personnalisés",
        f3: "3 fichiers par jour", f4: "30 dernières conversations",
        f5: "Extension VS Code", f6: "Mode sombre / clair",
        f7: "Chat IA (avec votre propre clé)", f8: "Téléchargements illimités",
        f9: "Synchronisation d'entreprise", f10: "Support prioritaire"
      },
      pro: {
        name: "Professionnel", title: "Pro",
        desc: "Pour les utilisateurs avancés, freelances et professionnels qui en veulent plus.",
        cta: "Commencer →",
        annualNote: "Économisez £21 vs mensuel",
        f1: "Termes personnalisés illimités",
        f2: "Téléchargements illimités (50 Mo/fichier)",
        f3: "Chat IA avec votre propre clé API",
        f4: "Historique complet (illimité)",
        f5: "Exporter les documents protégés",
        f6: "Support email prioritaire",
        f7: "Accès anticipé aux nouvelles fonctionnalités",
        f8: "Synchronisation d'entreprise", f9: "Tableau de bord admin"
      },
      team: {
        name: "Business", title: "Équipe",
        desc: "Pour PME et services qui ont besoin de contrôle et visibilité partagés.",
        cta: "Commencer →",
        annualNote: "Économisez £56 par utilisateur vs mensuel",
        f1: "Synchronisation d'entreprise — termes partagés",
        f2: "Tableau de bord admin et gestion d'équipe",
        f3: "Termes protégés gérés de façon centralisée",
        f4: "Journal d'audit",
        f5: "Gestionnaire de compte dédié (10+ utilisateurs)",
        f6: "Facturation sur facture disponible",
        f7: "SSO — bientôt"
      },
      ent: {
        name: "Entreprise", title: "Sur mesure",
        desc: "Pour les grandes organisations et industries réglementées.",
        priceLabel: "Sur mesure", cta: "Contactez-nous →",
        f1: "Option de déploiement sur site", f2: "Intégrations personnalisées",
        f3: "SLA de disponibilité (termes au contrat)",
        f4: "Documentation de conformité sur demande",
        f5: "Bibliothèque de termes personnalisée",
        f6: "Onboarding dédié", f7: "Remises sur volume"
      },
      trust: {
        t1Title: "Pas de carte",              t1Sub: "Commencez gratuit, évoluez ensuite",
        t2Title: "Annulez à tout moment",     t2Sub: "Sans engagement ni pénalité",
        t3Title: "Changez librement de plan", t3Sub: "Évoluez ou réduisez instantanément",
        t4Title: "Factures incluses",         t4Sub: "Reçus automatiques pour chaque paiement",
        t5Title: "Paiements via Paddle",      t5Sub: "Conforme PCI, paiement sécurisé"
      },
      faq: {
        title: "Questions fréquentes",
        q1: "Le plan gratuit est-il vraiment gratuit pour toujours ?",
        a1: "Oui. Le plan Personnel est gratuit indéfiniment — pas de période d'essai, pas de carte de crédit requise. La protection PII de base sera toujours gratuite.",
        q2: 'Qu\'est-ce qui compte comme un "téléchargement de fichier" ?',
        a2: "Tout PDF, document Word, image (JPEG/PNG) ou CSV que vous téléchargez pour analyse PII. Les utilisateurs gratuits ont 3 téléchargements par jour. Pro et supérieur ont des téléchargements illimités jusqu'à 50 Mo par fichier.",
        q3: "Dois-je fournir ma propre clé API IA ?",
        a3: 'Oui — pour le chat IA (mode "Demander à l\'IA"), vous fournissez votre propre clé API OpenAI, Anthropic ou Gemini. Cela garde vos données protégées totalement hors de nos systèmes. Votre clé est stockée localement et n\'est jamais téléversée vers Ledebe.',
        q4: "Comment fonctionne la facturation du plan Équipe ?",
        a4: "Les plans Équipe sont facturés par utilisateur actif par mois (minimum 3 utilisateurs). Vous pouvez ajouter ou retirer des sièges à tout moment — la facturation s'ajuste automatiquement au prochain cycle. Facturation sur facture disponible sur demande.",
        q5: "Puis-je changer de plan à tout moment ?",
        a5: "Oui. Les mises à niveau s'appliquent immédiatement. Les baisses prennent effet à la fin de votre période de facturation actuelle, et vous gardez accès aux fonctionnalités payantes jusque-là.",
        q6: "Quels moyens de paiement acceptez-vous ?",
        a6: "Nous acceptons toutes les principales cartes de crédit et débit (Visa, Mastercard, Amex) via Paddle, notre prestataire de paiement. Les clients entreprise peuvent payer par virement bancaire ou facture.",
        q7: "Y a-t-il une politique de remboursement ?",
        a7: "Nous offrons un remboursement de 14 jours sur tous les plans payants si vous n'êtes pas satisfait. Contactez hello@ledebe.com et nous gérerons cela, sans question."
      }
    },
    downloads: {
      hero: {
        label: "Obtenir l'app",
        title: "Télécharger Ledebe",
        desc: "Gratuit. Aucun compte requis. Disponible sur Mac, Windows, Linux — ou utilisez-le directement dans votre navigateur."
      },
      vscode: {
        title: "Extension VS Code",
        desc: 'Protégez le code, les configs et les logs directement dans votre éditeur. Recherchez "Ledebe Protector" dans le panneau Extensions.',
        btn: "Installer l'Extension →"
      },
      mac: {
        heading: "macOS",
        siliconTitle: "Apple Silicon (M1, M2, M3)",
        siliconReq: "Nécessite macOS 11 Big Sur ou ultérieur",
        intelTitle: "Mac Intel",
        intelReq: "Nécessite macOS 10.15 Catalina ou ultérieur",
        btnDmg: "Télécharger .dmg",
        btnZip: "Télécharger .zip",
        notice: "🍎 <strong>Configuration initiale sur macOS :</strong> Le temps que nous complétions la notarisation Apple, macOS affichera une invite de sécurité au premier lancement. Faites simplement clic droit sur l'icône → <strong>Ouvrir</strong> → <strong>Ouvrir</strong>. Cela n'arrive qu'une fois — c'est une étape standard pour les nouvelles apps distribuées hors App Store."
      },
      win: {
        heading: "Windows",
        storeTitle: "Microsoft Store",
        storeBadge: "Recommandé",
        storeReq: "Signé par Microsoft, mises à jour automatiques, sans avertissements de sécurité",
        storeBtn: "Obtenir depuis Microsoft Store →",
        directTitle: "Installateur Direct",
        directReq: "Compatible avec Windows 10 et Windows 11",
        directBtn: "Télécharger Setup .exe",
        notice: '⚠️ L\'avertissement <strong>SmartScreen</strong> ne s\'applique qu\'à l\'Installateur Direct. Si vous voyez "Windows a protégé votre PC", cliquez sur <strong>Informations complémentaires</strong> → <strong>Exécuter quand même</strong>. La version Microsoft Store est signée par Microsoft et évite cet avertissement.'
      },
      linux: {
        heading: "Linux",
        appimageTitle: "AppImage (Universel)",
        appimageReq: "Fonctionne sur Ubuntu 18.04+, Fedora, Debian et la plupart des distros",
        appimageBtn: "Télécharger .AppImage",
        snapTitle: "Paquet Snap",
        snapReq: "Pour Ubuntu et les distributions compatibles Snap",
        snapBtn: "Télécharger .snap",
        noticeIntro: "Configuration AppImage :",
        noticeStep1: "Après téléchargement, rendez le fichier exécutable avant de l'exécuter :",
        noticeStep2: "S'il ne se lance pas, installez libfuse2 :"
      }
    },
    demo: {
      hero: {
        label: "Voyez-le en action",
        title: "Réserver une Démo Gratuite",
        desc: "30 minutes. Sans engagement. Voyez exactement comment Ledebe protège vos données sensibles avant qu'elles n'atteignent l'IA."
      },
      cover: "Ce que nous couvrirons",
      points: {
        p1Title: "Démo de masquage en direct",
        p1Desc: "Voyez la détection et le masquage des PII en temps réel sur votre type de contenu.",
        p2Title: "Parcours du workflow IA",
        p2Desc: "Comment utiliser Ledebe en toute sécurité avec ChatGPT, Claude ou Gemini.",
        p3Title: "Protection de documents",
        p3Desc: "Téléchargez et analysez PDFs, docs Word et tableurs à la recherche de PII.",
        p4Title: "Options équipe et entreprise",
        p4Desc: "Comment fonctionnent les bibliothèques de termes partagés et les tableaux de bord admin.",
        p5Title: "Vos questions résolues",
        p5Desc: "Apportez votre cas d'usage spécifique — nous vous montrerons comment Ledebe le gère."
      },
      meta: {
        durationLabel: "Durée :",    durationVal: "30 minutes",
        formatLabel: "Format :",     formatVal: "Appel vidéo (lien envoyé à la confirmation)",
        costLabel: "Coût :",         costVal: "Gratuit, sans engagement",
        whoLabel: "Pour qui :",      whoVal: "Fondateurs, responsables IT, responsables conformité, développeurs"
      }
    },
    contact: {
      hero: {
        label: "Prenez contact",
        title: "Nous contacter",
        desc: "Nous sommes une petite équipe et nous lisons chaque message. Nous répondons généralement sous 24 heures."
      },
      responseNotice: "Écrivez-nous à <strong>hello@ledebe.com</strong> — nous répondons généralement sous 24 heures les jours ouvrés.",
      cards: {
        generalTitle: "Questions générales", generalDesc: "Questions sur Ledebe, le produit, ou son fonctionnement.",
        supportTitle: "Support",              supportDesc: "Vous avez un problème avec l'app ou besoin d'aide avec votre compte.",
        entTitle: "Entreprise",               entDesc: "Intéressé par les plans Équipe ou Entreprise pour votre organisation.",
        privTitle: "Confidentialité",         privDesc: "Demandes de confidentialité, droits RGPD ou questions de sécurité."
      },
      faqPrompt: {
        title: "Vous cherchez des réponses rapides ?",
        desc: "Consultez notre documentation — la plupart des questions courantes y sont répondues.",
        btn: "Parcourir la Documentation →"
      }
    },
    about: {
      hero: {
        label: "Notre histoire",
        title: "À propos de Ledebe",
        desc: "Nous avons construit l'outil que nous aurions voulu — une façon simple de travailler avec l'IA sans exposer de données sensibles."
      },
      why: {
        title: "Pourquoi Ledebe existe",
        p1: "Les outils IA comme ChatGPT, Claude et Gemini transforment la façon dont les gens travaillent. Mais il y a un problème dont on parle trop peu — pour utiliser efficacement ces outils, les gens collent de vrais emails, de vrais noms, de vrais numéros de téléphone, de vrais documents. Des données sensibles quittent les appareils et entrent dans les systèmes IA chaque jour, souvent sans que les utilisateurs réalisent le risque.",
        p2: "Ledebe a été créé pour résoudre cela. Il vous permet de travailler avec l'IA librement — sans exposer les données qui ne vous appartiennent pas de partager.",
        highlight: "L'idée centrale est simple : masquer les parties sensibles avant qu'elles ne quittent votre appareil. Utiliser l'IA librement avec la version masquée. Restaurer l'original quand vous en avez besoin."
      },
      what: {
        title: "Ce que nous construisons",
        intro: "Ledebe est une suite d'outils de confidentialité pour les particuliers, équipes et organisations qui travaillent avec l'IA au quotidien.",
        p1: "<strong>App de bureau</strong> — disponible sur Mac, Windows et Linux. Fonctionne hors-ligne, aucun compte requis.",
        p2: "<strong>Extension VS Code</strong> — protégez le code, les configs et les logs directement dans votre éditeur.",
        p3: "<strong>Protection de fichiers</strong> — téléchargez PDFs, documents Word et images pour scanner et masquer les PII avant de partager."
      },
      principles: {
        title: "Nos principes",
        v1Title: "Local d'abord",         v1Desc: "Toute la détection et le masquage se font sur votre appareil. Vos données ne touchent jamais nos serveurs.",
        v2Title: "Entièrement réversible", v2Desc: "Les données masquées peuvent toujours être restaurées. Vous n'êtes jamais bloqué hors de votre propre contenu.",
        v3Title: "Pas de suivi",          v3Desc: "Nous ne collectons pas ce que vous protégez. Pas d'analytique sur votre contenu, jamais.",
        v4Title: "Pour tous",             v4Desc: "Du développeur solo aux équipes de conformité d'entreprise — Ledebe fonctionne pour tous."
      },
      who: {
        title: "Qui nous sommes",
        p1: "Ledebe est construit par Ledebe Technologies — une société de logiciels axée sur les outils de confidentialité et les produits de protection des données. Nous sommes une petite équipe concentrée qui croit que la confidentialité devrait être l'option par défaut, pas une réflexion après coup.",
        p2: 'Une question ou envie de travailler avec nous ? Écrivez à <strong><a href="mailto:hello@ledebe.com" style="color:var(--primary-blue);">hello@ledebe.com</a></strong>'
      },
      ctaBox: {
        title: "Prêt à protéger vos données ?",
        desc: "Gratuit. Aucun compte requis. Fonctionne sur Mac, Windows et Linux.",
        bookBtn: "Réserver une Démo Gratuite →"
      }
    },
    docs: {
      hero: { title: "Documentation", subtitle: "Tout ce qu'il faut pour installer et utiliser Ledebe Protector" },
      pageTitle: "Docs Ledebe Protector",
      pageLead: "Ledebe Protector détecte et masque les informations personnelles identifiables (PII) avant que vous ne partagiez du texte avec des outils IA, des collègues ou des services externes. Vos données originales ne quittent jamais votre appareil.",
      sidebar: {
        started: "Démarrer",
        overview: "Aperçu", howToUse: "Comment utiliser", requirements: "Configuration requise",
        install: "Installation",
        macSilicon: "macOS (Apple Silicon)", macIntel: "macOS (Intel)", windows: "Windows", linux: "Linux",
        using: "Utiliser Ledebe",
        protectText: "Protéger le texte", highlightProtect: "Sélectionner pour protéger/déprotéger", customTerms: "Termes personnalisés",
        fileUpload: "Téléchargement de fichiers", aiChat: "Chat IA", history: "Historique et recherche", keyboard: "Raccourcis clavier",
        extensions: "Extensions",
        vscode: "Extension VS Code",
        help: "Aide",
        faq: "FAQ", troubleshooting: "Dépannage"
      },
      overview: {
        title: "Aperçu",
        p1: "Ledebe Protector fonctionne en remplaçant les informations sensibles de votre texte par des marqueurs sûrs, vous permettant de partager ou traiter le texte librement. Vous pouvez restaurer le contenu original à tout moment.",
        typesIntro: "Types de PII pris en charge :"
      },
      howToUse: {
        title: "Comment utiliser Ledebe",
        subtitle: "Nouveau sur Ledebe ? Suivez ces étapes pour protéger et partager du texte en moins d'une minute.",
        s1Title: "Étape 1 — Tapez ou collez votre texte",
        s1Body: "Ouvrez l'app et tapez (ou collez) tout texte contenant des informations sensibles dans la zone de saisie principale. Cela peut être un email, un ticket de support, un extrait de contrat — n'importe quoi.",
        s1Example: 'Exemple : <em>"Bonjour, je m\'appelle Sarah Jones, email sarah@company.com et mon téléphone est 07911 123456."</em>',
        s2Title: "Étape 2 — Cliquez sur Envoyer / Protéger",
        s2Body: "Cliquez sur le bouton <strong>Envoyer</strong> (ou appuyez sur <strong>Ctrl + Entrée</strong> / <strong>⌘ Cmd + Entrée</strong> sur Mac). Ledebe scanne automatiquement votre texte et remplace chaque PII détecté par un marqueur sûr.",
        s2Example: 'Le résultat ressemblera à : <em>"Bonjour, je m\'appelle [LDB_CUSTOM1], email [LDB_EMAIL1] et mon téléphone est [LDB_PHONE1]."</em> — sûr à partager n\'importe où.',
        s3Title: "Étape 3 — Basculez entre les vues",
        s3Body: "Chaque message a deux onglets en dessous : <strong>Texte brut</strong> — votre texte original, non masqué (visible uniquement par vous). <strong>Texte protégé</strong> — la version masquée avec des marqueurs, sûre à copier et partager.",
        s4Title: "Étape 4 — Copiez le texte protégé",
        s4Body: "Cliquez sur le bouton <strong>📋 Copier</strong> sur le message, ou appuyez sur <strong>Ctrl/⌘ Cmd + Shift + X</strong>, pour copier la version protégée dans le presse-papiers. Collez-la dans ChatGPT, un email, un système de support — où vous voulez.",
        s5Title: "Étape 5 — Restaurez l'original (optionnel)",
        s5Body: "Si vous recevez une réponse contenant des marqueurs (p. ex. d'un outil IA), collez-la dans Ledebe. Il remplacera automatiquement les marqueurs par les valeurs réelles, pour que vous puissiez lire la réponse avec vos vraies données.",
        s6Title: "Étape 6 — Ajoutez des termes personnalisés (optionnel)",
        s6Body: "Vous avez des mots spécifiques à toujours cacher — comme le nom de votre entreprise, un code de projet ou un nom de client ? Ajoutez-les aux <strong>Termes personnalisés</strong> dans la barre latérale. Ils seront masqués automatiquement à chaque fois.",
        s6Tip: '<strong>Astuce rapide :</strong> Pendant que vous tapez, Ledebe suggère des mots à ajouter comme termes personnalisés. Si un mot est déjà protégé, il affiche une puce verte <em>"déjà protégé"</em> pour ne jamais ajouter le même terme deux fois.',
        modeTitle: "Basculer entre Protéger et Demander à l'IA",
        modeIntro: "En bas de l'écran, juste au-dessus de la zone de texte, vous verrez un sélecteur de mode :",
        modeProtect: "<strong>🛡️ Protéger (par défaut)</strong> — masque votre texte et vous montre la version sûre à copier. Rien n'est envoyé à aucune IA. Utilisez-le quand vous voulez juste sanitiser le texte avant de le coller ailleurs.",
        modeAsk: "<strong>🤖 Demander à l'IA</strong> — envoie votre message directement à une IA (OpenAI, Anthropic ou Google) avec le PII déjà masqué. L'IA répond, et vous voyez la réponse ainsi qu'une version \"Sûr à partager\" remasquée. Utilisez-le pour une expérience de chat IA totalement privée.",
        modeTip: "Vous pouvez changer de mode à tout moment — même en pleine conversation. Le sélecteur mémorise votre dernier choix."
      },
      reqs: {
        title: "Configuration requise"
      },
      macSilicon: {
        title: "macOS",
        intro: "Pour les Macs M1, M2 et M3. Téléchargez le fichier <strong>arm64.dmg</strong>.",
        stepsTitle: "Étapes d'installation",
        gateWarning: "<strong>Avertissement Gatekeeper :</strong> Au premier lancement, macOS peut afficher \"Ledebe Protector ne peut pas être ouvert car il provient d'un développeur non identifié.\" Pour contourner : clic droit sur l'icône → cliquez sur <strong>Ouvrir</strong> → cliquez sur <strong>Ouvrir</strong> dans la boîte de dialogue. À faire une seule fois.",
        altTip: "Sinon, allez dans <strong>Réglages Système → Confidentialité et sécurité</strong> et cliquez sur <strong>Ouvrir quand même</strong> à côté de l'entrée Ledebe Protector."
      },
      macIntel: {
        title: "macOS",
        intro: "Pour les Macs basés sur Intel. Téléchargez le fichier <strong>x64.dmg</strong>.",
        stepsTitle: "Étapes d'installation",
        gateWarning: "Même comportement Gatekeeper qu'Apple Silicon — clic droit → <strong>Ouvrir</strong> au premier lancement si macOS le bloque."
      },
      windows: {
        title: "Windows",
        intro: "Téléchargez l'installateur NSIS <strong>Ledebe Protector Setup 1.0.0.exe</strong>. Il crée des raccourcis dans le menu Démarrer, une icône de bureau et un désinstallateur.",
        stepsTitle: "Étapes d'installation",
        smartScreen: "L'avertissement <strong>SmartScreen</strong> est normal pour les apps récemment publiées sans certificat de signature de code EV. L'app est sûre — cliquez sur <strong>Informations complémentaires → Exécuter quand même</strong> pour continuer.",
        uninstall: "Pour désinstaller : allez dans <strong>Paramètres → Applications</strong>, trouvez Ledebe Protector et cliquez sur <strong>Désinstaller</strong>."
      },
      linux: {
        title: "Linux",
        intro: "Ledebe Protector est distribué sous forme d'<strong>AppImage</strong> universel — aucune installation requise. Il fonctionne sur Ubuntu, Debian, Fedora, Arch et la plupart des autres distros.",
        stepsTitle: "Étapes d'installation",
        gui: "Vous pouvez aussi faire clic droit sur l'AppImage dans votre gestionnaire de fichiers → <strong>Propriétés → Permissions</strong> → cocher <strong>\"Autoriser l'exécution du fichier comme programme\"</strong>, puis double-cliquer pour lancer.",
        fuseHelp: "Certaines distros nécessitent <code>libfuse2</code> pour les AppImages. Si l'app ne se lance pas, installez-le :"
      },
      protectText: {
        title: "Protéger le texte",
        tip: "Les marqueurs sont cohérents au sein d'une session — le même email mappe toujours au même marqueur, donc la structure de votre texte est préservée."
      },
      highlightProtect: {
        title: "Sélectionner pour protéger/déprotéger",
        intro: "Vous pouvez protéger ou déprotéger des mots individuels directement depuis n'importe quel message envoyé — sans rien retaper.",
        protectTitle: "Protéger un mot",
        unprotectTitle: "Déprotéger un mot",
        info: "Cela fonctionne dans les messages du chat et dans l'aperçu du document. Les changements prennent effet immédiatement — pas besoin de renvoyer le message."
      },
      customTerms: {
        title: "Termes personnalisés",
        intro: "Ajoutez vos propres mots ou phrases à toujours protéger — noms, noms d'entreprise, codes de projet, tout ce qui est sensible.",
        addTitle: "Ajouter un terme",
        searchTitle: "Rechercher vos termes",
        searchIntro: "Si vous avez beaucoup de termes enregistrés, utilisez la recherche intégrée pour les trouver rapidement.",
        searchTip: 'Le popup de recherche affiche un compteur, p. ex. <em>"4 sur 47 termes"</em>, pour que vous sachiez toujours combien de termes correspondent à votre requête.'
      },
      fileUpload: {
        title: "Téléchargement de fichiers",
        intro: "Ledebe peut traiter des documents entiers — pas seulement du texte tapé. Téléchargez un fichier et il extrait, protège et prévisualise le contenu pour vous.",
        uploadTitle: "Comment télécharger",
        supportedTitle: "Types de fichiers pris en charge",
        previewTitle: "Aperçu du document",
        previewIntro: "Après téléchargement, cliquez sur la carte du document pour ouvrir le modal d'aperçu. Il affiche deux vues côte à côte :",
        previewDownload: "Depuis l'aperçu vous pouvez <strong>📥 Télécharger</strong> la version protégée comme fichier.",
        previewHighlight: "Vous pouvez aussi sélectionner du texte dans l'aperçu du document pour déclencher le bouton flottant <strong>🛡️ Protéger</strong> / <strong>🔓 Déprotéger</strong>, comme dans les messages du chat."
      },
      aiChat: {
        title: "Chat IA",
        intro: "Passez en mode <strong>Demander à l'IA</strong> pour envoyer des questions directement à une IA. Ledebe masque vos PII avant l'envoi du message, donc l'IA ne voit jamais vos vraies données.",
        setupTitle: "Configuration",
        keyInfo: "Les clés API sont stockées localement uniquement — elles ne sont jamais envoyées aux serveurs Ledebe."
      },
      history: {
        title: "Historique et recherche",
        intro: "Chaque conversation est automatiquement enregistrée dans votre historique local. La barre latérale gauche liste tous les chats passés.",
        usingTitle: "Utiliser l'historique",
        searchTitle: "Rechercher l'historique avec ⌘K",
        searchIntro: "Appuyez sur <strong>⌘K</strong> (Mac) ou <strong>Ctrl+K</strong> (Windows) pour ouvrir la palette de commandes — une recherche rapide sur tous vos chats passés.",
        searchTip: "Vous pouvez aussi cliquer sur le bouton <strong>Rechercher l'historique</strong> en haut de la barre latérale pour ouvrir la même palette."
      },
      keyboard: {
        title: "Raccourcis clavier",
        intro: "Ledebe est entièrement navigable au clavier. Utilisez ces raccourcis pour travailler plus vite :",
        colAction: "Action", colMac: "Mac", colWin: "Windows / Linux",
        rSearch: "Rechercher dans l'historique (palette de commandes)",
        rNew: "Nouveau chat",
        rSend: "Envoyer le message",
        rToggle: "Basculer la barre latérale",
        rAll: "Afficher tous les raccourcis"
      },
      vscode: {
        title: "Extension VS Code",
        intro: "Ledebe est aussi disponible comme <strong>extension VS Code</strong> — créée pour les développeurs qui veulent protéger des données sensibles avant de partager du code, des logs ou des fichiers de configuration avec des outils IA comme GitHub Copilot ou ChatGPT.",
        installTitle: "Installation",
        featuresTitle: "Fonctionnalités",
        shortcutTitle: "Raccourci clavier",
        colAction: "Action", colShortcut: "Raccourci",
        rProtect: "Protéger le texte sélectionné",
        tip: "Les termes personnalisés ajoutés dans l'extension VS Code sont enregistrés par profil VS Code — séparés de la liste de termes de l'app de bureau."
      },
      faq: {
        title: "FAQ",
        q1: "Comment déprotéger un mot que j'ai déjà protégé ?",
        a1: "Sélectionnez le mot dans n'importe quel message envoyé. S'il est déjà dans vos termes protégés, le bouton flottant affichera <strong>🔓 Déprotéger</strong> (en rouge). Cliquez dessus et le mot est retiré de vos termes et le message se met à jour immédiatement.",
        q2: "Comment rechercher dans mon historique de chat ?",
        a2: "Appuyez sur <strong>⌘K</strong> (Mac) ou <strong>Ctrl+K</strong> (Windows) pour ouvrir la palette de commandes. Commencez à taper pour filtrer les chats passés, utilisez les flèches pour naviguer et appuyez sur Entrée pour en ouvrir un. Esc pour fermer.",
        q3: "Ledebe envoie-t-il mes données quelque part ?",
        a3: "Non. Toute la détection et le masquage des PII se font localement sur votre appareil. Le seul trafic sortant est quand vous utilisez la fonction de chat IA — dans ce cas, seul le texte <em>masqué</em> (avec marqueurs, pas vos vraies données) est envoyé à l'API du fournisseur d'IA.",
        q4: "Puis-je restaurer le texte original après avoir partagé la version protégée ?",
        a4: "Oui — tant que vous êtes dans la même session ou que la carte de marqueurs a été enregistrée. Collez le texte protégé dans Ledebe et cliquez sur <strong>Restaurer</strong>.",
        q5: "Où sont stockées mes clés API ?",
        a5: "Les clés API sont stockées uniquement dans le stockage local de votre appareil. Elles ne sont jamais téléversées vers les serveurs Ledebe ni incluses dans les rapports de plantage.",
        q6: "L'app dit qu'elle provient d'un développeur non identifié sur Mac — est-elle sûre ?",
        a6: "Oui, elle est sûre. Cet avertissement apparaît car l'app n'est pas encore enrôlée dans le programme de notarisation d'Apple. Clic droit sur l'app → <strong>Ouvrir</strong> → <strong>Ouvrir</strong> pour le contourner. À faire une seule fois.",
        q7: "Windows SmartScreen a bloqué l'installateur — que faire ?",
        a7: "Cliquez sur <strong>Informations complémentaires</strong> dans la boîte SmartScreen, puis sur <strong>Exécuter quand même</strong>. Cet avertissement apparaît pour les apps récemment publiées. L'installateur est sûr.",
        q8: "L'AppImage Linux ne se lance pas — que faire ?",
        a8: 'Assurez-vous que le fichier a les droits d\'exécution : <code>chmod +x "Ledebe Protector-1.0.0.AppImage"</code>. Si ça échoue toujours, installez <code>libfuse2</code> : sur Ubuntu/Debian exécutez <code>sudo apt install libfuse2</code>.'
      },
      trouble: {
        title: "Dépannage",
        crashTitle: "L'app plante au lancement",
        crashBody: "Les rapports de plantage sont stockés dans <code>~/.ledebe-crashes/</code>. Si vous avez besoin de support, incluez le dernier log de plantage en nous contactant.",
        piiTitle: "Le PII n'est pas détecté",
        piiBody: "Assurez-vous que le format du texte correspond à un motif pris en charge. Pour les formats inhabituels (p. ex. formats de téléphone non standard), ajoutez la valeur comme <strong>Terme personnalisé</strong>.",
        aiTitle: "Le chat IA ne répond pas",
        darkTitle: "Le mode sombre ne s'enregistre pas",
        darkBody: "La préférence du mode sombre est stockée dans le stockage local. Effacer le cache du navigateur (dans Electron : <strong>Paramètres → Effacer les données</strong>) la réinitialisera.",
        helpInfo: 'Besoin de plus d\'aide ? Écrivez-nous à <a href="mailto:hello@ledebe.com" style="color: var(--primary-blue);">hello@ledebe.com</a> ou visitez la <a href="/contact/" style="color: var(--primary-blue);">page de contact</a>.'
      }
    },
    privacy: {
      hero: {
        label: "Légal",
        title: "Politique de Confidentialité",
        desc: "Comment Ledebe gère vos données — et pourquoi la plupart ne quittent jamais votre appareil."
      },
      lastUpdated: "Dernière mise à jour : avril 2026",
      highlight: "🛡️ La version courte : Ledebe masque vos données sensibles localement sur votre appareil. Nous ne collectons, stockons ni transmettons vos données personnelles ou le contenu que vous protégez. Vos données restent les vôtres.",
      s1: {
        title: "1. Qui nous sommes",
        p1: "Ledebe est un outil de confidentialité construit par Ledebe Technologies. Notre produit aide les particuliers et les organisations à protéger les informations personnelles identifiables (PII) avant de partager du contenu avec des outils IA, des collègues ou des tiers.",
        p2: "Si vous avez des questions sur cette politique, contactez-nous à : <strong>hello@ledebe.com</strong>"
      },
      s2: {
        title: "2. Quelles données nous collectons",
        notTitle: "Données que nous ne collectons PAS",
        not1: "Le texte que vous collez dans Ledebe",
        not2: "Les PII détectées dans votre contenu (noms, emails, numéros de téléphone, etc.)",
        not3: "Votre liste de termes personnalisés",
        not4: "Votre historique de chat",
        not5: "Vos clés API pour OpenAI, Anthropic, Google ou tout autre fournisseur",
        not6: "Vos documents ou fichiers téléchargés",
        mayTitle: "Données que nous pouvons collecter (anonymisées)",
        may1: "Analyses d'utilisation basiques — visites de pages, fonctionnalités utilisées (sans données personnelles associées)",
        may2: "Rapports d'erreur — si l'app plante, un rapport anonyme peut être généré pour nous aider à corriger les bugs",
        may3: "Compteurs de téléchargement — combien de fois l'app de bureau est téléchargée"
      },
      s3: {
        title: "3. Où vos données résident",
        p1: "Toute la détection et le masquage des PII se font <strong>localement sur votre appareil</strong> — dans votre navigateur ou app de bureau. Aucun contenu n'est envoyé aux serveurs Ledebe pendant ce processus.",
        localTitle: "Stockage local",
        local1: "<strong>Termes personnalisés</strong> — stockés dans le localStorage de votre navigateur ou le stockage local de l'app de bureau. Jamais téléversés.",
        local2: "<strong>Historique de chat</strong> — stocké uniquement localement sur votre appareil.",
        local3: "<strong>Clés API</strong> — stockées dans le localStorage de votre navigateur ou les paramètres VS Code. Jamais transmises à Ledebe.",
        local4: "<strong>Préférences de thème/paramètres</strong> — stockées localement.",
        aiTitle: "Quand vous utilisez le mode Chat IA",
        aiBody: "Si vous utilisez la fonction Demander à l'IA de Ledebe, votre texte masqué (avec marqueurs comme [LDB_EMAIL1], jamais vos vraies données) est envoyé directement de votre appareil au fournisseur d'IA choisi (OpenAI, Anthropic ou Google) en utilisant votre propre clé API. Ledebe ne voit, n'intercepte ni ne stocke cette communication."
      },
      s4: {
        title: "4. Services tiers",
        aws: "<strong>AWS S3</strong> — héberge le site web Ledebe et les téléchargements de l'app de bureau. La politique de confidentialité d'AWS s'applique à l'infrastructure d'hébergement.",
        cf: "<strong>Cloudflare</strong> — fournit DNS, CDN et protection DDoS pour ledebe.com. Cloudflare peut enregistrer des données de trafic anonymisées.",
        ai: "<strong>OpenAI / Anthropic / Google</strong> — si vous utilisez le mode Chat IA avec votre propre clé API, vos prompts masqués sont envoyés à ces fournisseurs. Leurs politiques de confidentialité respectives s'appliquent.",
        vsm: "<strong>VS Code Marketplace</strong> — l'extension VS Code est distribuée via le marketplace de Microsoft. La politique de confidentialité de Microsoft s'applique au processus de téléchargement et d'installation.",
        trail: "Ledebe ne vend, ne loue ni ne partage vos données avec un tiers à des fins de marketing."
      },
      s5: {
        title: "5. Cookies",
        p1: "Le site web Ledebe utilise des cookies minimaux :",
        func: "<strong>Cookies fonctionnels</strong> — retiennent votre préférence de langue et de thème.",
        noAds: "Nous n'utilisons pas de cookies publicitaires ou de cookies de suivi inter-sites."
      },
      s6: {
        title: "6. Vos droits (RGPD)",
        p1: "Si vous êtes dans l'Espace Économique Européen (EEE) ou au Royaume-Uni, vous avez les droits suivants :",
        access: "<strong>Droit d'accès</strong> — demander une copie de toutes les données personnelles que nous détenons sur vous.",
        erasure: "<strong>Droit à l'effacement</strong> — demander la suppression de vos données personnelles.",
        portability: "<strong>Droit à la portabilité</strong> — recevoir vos données dans un format lisible par machine.",
        object: "<strong>Droit d'opposition</strong> — vous opposer au traitement de vos données personnelles.",
        rectify: "<strong>Droit de rectification</strong> — demander la correction de données inexactes.",
        trail: "Comme Ledebe ne stocke presque aucune donnée personnelle, la plupart de ces droits sont satisfaits automatiquement. Pour exercer un droit, contactez : <strong>hello@ledebe.com</strong>"
      },
      s7: {
        title: "7. Sécurité des données",
        p1: "Nous prenons la sécurité au sérieux :",
        https: "Le site web est servi via HTTPS.",
        noServer: "Aucun contenu utilisateur sensible n'atteint nos serveurs.",
        keys: "Les clés API sont stockées localement et ne sont jamais transmises à Ledebe.",
        review: "Nous examinons régulièrement notre infrastructure pour les vulnérabilités de sécurité."
      },
      s8: {
        title: "8. Confidentialité des enfants",
        p1: "Ledebe n'est pas destiné aux enfants de moins de 13 ans. Nous ne collectons pas sciemment d'informations personnelles d'enfants. Si vous pensez qu'un enfant nous a fourni des informations personnelles, contactez-nous à hello@ledebe.com et nous les supprimerons."
      },
      s9: {
        title: "9. Modifications de cette politique",
        p1: 'Nous pouvons mettre à jour cette Politique de Confidentialité de temps à autre. Nous notifierons les utilisateurs des changements significatifs en mettant à jour la date de "Dernière mise à jour" en haut de cette page. L\'utilisation continue de Ledebe après les changements constitue l\'acceptation de la politique mise à jour.'
      },
      s10: {
        title: "10. Contact",
        p1: "Pour toute question ou demande liée à la confidentialité :",
        email: "Email : <strong>hello@ledebe.com</strong>",
        site: "Site web : <strong>ledebe.com</strong>"
      }
    },
    terms: {
      hero: { label: "Légal", title: "Conditions d'Utilisation", desc: "Les règles et directives pour utiliser Ledebe." },
      lastUpdated: "Dernière mise à jour : avril 2026",
      highlight: "En utilisant Ledebe, vous acceptez ces conditions. Veuillez les lire — elles sont écrites en langage clair et conçues pour être équitables pour vous et pour nous.",
      s1: {
        title: "1. Acceptation des conditions",
        p1: "En accédant à ou en utilisant Ledebe (l'app web, l'app de bureau ou l'extension VS Code), vous acceptez d'être lié par ces Conditions d'Utilisation. Si vous n'êtes pas d'accord, veuillez ne pas utiliser le produit.",
        p2: "Ces conditions s'appliquent à tous les utilisateurs — particuliers, équipes et organisations."
      },
      s2: {
        title: "2. Ce que fait Ledebe",
        p1: "Ledebe est un outil de confidentialité qui détecte et masque les informations personnelles identifiables (PII) dans le texte et les documents avant que vous ne les partagiez avec des outils IA ou d'autres parties. Le processus de masquage se déroule localement sur votre appareil.",
        p2: "Ledebe est un outil d'aide à la confidentialité — ce n'est pas une garantie de protection totale des données. Vous restez responsable de la révision de votre contenu avant de le partager."
      },
      s3: {
        title: "3. Votre compte et responsabilité",
        i1: "Vous êtes responsable du maintien de la sécurité de vos clés API stockées dans Ledebe.",
        i2: "Vous êtes responsable du contenu que vous traitez via Ledebe.",
        i3: "Vous ne devez pas utiliser Ledebe à des fins illégales.",
        i4: "Vous ne devez pas tenter de faire de l'ingénierie inverse, modifier ou distribuer le logiciel Ledebe sans autorisation."
      },
      s4: {
        title: "4. Utilisation acceptable",
        p1: "Vous acceptez de ne pas utiliser Ledebe pour :",
        i1: "Traiter du contenu qui viole une loi ou un règlement applicable",
        i2: "Tenter de contourner, esquiver ou désactiver des fonctions de sécurité",
        i3: "Scraper, copier ou redistribuer le logiciel ou l'interface Ledebe",
        i4: "Utiliser Ledebe d'une manière pouvant nuire à d'autres utilisateurs ou à des tiers",
        i5: "Usurper l'identité d'une personne ou d'une organisation"
      },
      s5: {
        title: "5. Niveaux gratuit et payant",
        p1: "Ledebe propose un niveau gratuit et des plans d'abonnement payants. Les fonctionnalités disponibles à chaque niveau sont décrites sur notre page de tarifs.",
        i1: "Les fonctionnalités du niveau gratuit peuvent changer avec un préavis raisonnable.",
        i2: "Les abonnements payants sont facturés d'avance sur une base mensuelle ou annuelle.",
        i3: "Nous offrons une garantie de remboursement de 14 jours sur tous les plans payants. Contactez hello@ledebe.com dans les 14 jours suivant le paiement et nous émettrons un remboursement intégral, sans question.",
        i4: "Nous nous réservons le droit de modifier les tarifs avec un préavis de 30 jours aux abonnés existants."
      },
      s6: {
        title: "6. Propriété intellectuelle",
        p1: "Ledebe et tous ses composants — y compris le logiciel, le design, le logo et la documentation — sont la propriété de Ledebe Technologies. Vous ne pouvez pas copier, reproduire ou distribuer une partie de Ledebe sans autorisation écrite.",
        p2: "Votre contenu reste le vôtre. En utilisant Ledebe, vous ne nous accordez aucun droit sur votre contenu."
      },
      s7: {
        title: "7. Services tiers",
        p1: "Ledebe s'intègre avec des fournisseurs d'IA tiers (OpenAI, Anthropic, Google) via vos propres clés API. Votre utilisation de ces services est régie par leurs conditions d'utilisation respectives. Ledebe n'est pas responsable du comportement, de la disponibilité ou des politiques de ces services tiers."
      },
      s8: {
        title: "8. Exclusion de garanties",
        p1: 'Ledebe est fourni "tel quel" sans garanties d\'aucune sorte, expresses ou implicites. Nous ne garantissons pas que :',
        i1: "Ledebe détectera tous les PII dans chaque contenu",
        i2: "Le service sera ininterrompu ou sans erreur",
        i3: "Les résultats répondront à vos exigences spécifiques",
        p2: "Vous êtes responsable de vérifier que Ledebe a correctement masqué toutes les données sensibles avant de partager tout contenu."
      },
      s9: {
        title: "9. Limitation de responsabilité",
        p1: "Dans la mesure maximale permise par la loi, Ledebe Technologies ne saurait être tenu responsable de dommages indirects, accessoires, spéciaux, consécutifs ou punitifs découlant de votre utilisation de Ledebe — y compris, mais sans s'y limiter, les violations de données résultant du contenu que vous avez partagé après traitement par Ledebe.",
        p2: "Notre responsabilité totale envers vous pour toute réclamation ne dépassera pas le montant que vous nous avez payé dans les 12 mois précédant la réclamation."
      },
      s10: {
        title: "10. Résiliation",
        p1: "Nous nous réservons le droit de suspendre ou de résilier l'accès à Ledebe pour les utilisateurs qui violent ces conditions, avec ou sans préavis.",
        p2: "Vous pouvez cesser d'utiliser Ledebe à tout moment. Si vous avez un abonnement payant, vous pouvez l'annuler à tout moment — l'accès continue jusqu'à la fin de la période de facturation."
      },
      s11: {
        title: "11. Modifications de ces conditions",
        p1: 'Nous pouvons mettre à jour ces Conditions d\'Utilisation de temps à autre. Nous notifierons les utilisateurs des changements significatifs en mettant à jour la date de "Dernière mise à jour" et, le cas échéant, par email. L\'utilisation continue de Ledebe après les changements constitue l\'acceptation des conditions mises à jour.'
      },
      s12: {
        title: "12. Loi applicable",
        p1: "Ces conditions sont régies par les lois d'Angleterre et du Pays de Galles. Tout litige sera soumis à la juridiction exclusive des tribunaux d'Angleterre et du Pays de Galles."
      },
      s13: {
        title: "13. Contact",
        p1: "Pour toute question concernant ces conditions :",
        email: "Email : <strong>hello@ledebe.com</strong>",
        site: "Site web : <strong>ledebe.com</strong>"
      }
    }
  },

  ar: {
    nav: { home: "الرئيسية", pricing: "الأسعار", docs: "المستندات", bookDemo: "احجز عرضاً" },
    hero: {
      badge: "حماية الذكاء الاصطناعي مع الخصوصية أولاً",
      title: 'احمِ بياناتك <span>قبل الذكاء الاصطناعي</span>',
      subtitle: "Ledebe يخفي الإيميلات وأرقام الهواتف ومفاتيح API والبيانات الشخصية قبل مغادرة جهازك — لاستخدام ChatGPT وClaude وCopilot بأمان.",
      bookDemoBtn: "احجز عرضاً مجانياً ←",
      webAppBtn: "جرّب تطبيق الويب ←"
    },
    mockup: { yourInput: "نصك", protectedOutput: "الناتج المحمي", badge: "🛡️ تمت حماية 3 عناصر" },
    proof: {
      works: "يعمل مع ChatGPT وClaude وGemini",
      local: "100% محلي — لا يُرسل أي بيانات للخوادم",
      instant: "إخفاء فوري وقابل للعكس تماماً",
      vscode: "امتداد VS Code متاح"
    },
    hiw: {
      label: "كيف يعمل", title: "ثلاث خطوات لاستخدام الذكاء الاصطناعي بأمان",
      sub: "بدون إعداد أو تهيئة. الصق، احمِ، وشارك — في ثوانٍ.",
      step1: { title: "الصق نصك", desc: "الصق أي نص أو مستند أو كود يحتوي على معلومات حساسة في Ledebe." },
      step2: { title: "Ledebe يخفيه", desc: "يتم استبدال كل بيانات PII بعلامات مثل [LDB_EMAIL1] محلياً على جهازك — لا شيء يغادر." },
      step3: { title: "شارك بأمان", desc: "انسخ النص المحمي إلى أي أداة ذكاء اصطناعي. استعد الأصل في أي وقت بنقرة واحدة." }
    },
    feat: {
      label: "المميزات", title: "كل ما تحتاجه لاستخدام الذكاء الاصطناعي بأمان",
      sub: "مصمم للأفراد والمطورين والفرق.",
      auto:       { title: "الكشف التلقائي عن PII",    desc: "يكشف ويخفي فوراً الإيميلات وأرقام الهواتف وأرقام الهوية وبطاقات الائتمان ومفاتيح API والمزيد." },
      custom:     { title: "مصطلحات مخصصة",             desc: "أضف كلماتك الحساسة — أسماء الشركات وأكواد المشاريع وأسماء العملاء — وتُخفى تلقائياً في كل مرة." },
      reversible: { title: "قابل للعكس تماماً",          desc: "تشير العلامات إلى بياناتك الأصلية. استعد النص الكامل في أي وقت — لا شيء يُفقد أبداً." },
      doc:        { title: "رفع المستندات",               desc: "ارفع ملفات PDF ومستندات Word والصور وملفات CSV. يُخفى PII عبر المستند كاملاً مع معاينة جانبية." },
      ai:         { title: "وضع سؤال الذكاء الاصطناعي", desc: "أرسل نصك المخفي مباشرةً إلى ChatGPT أو Claude أو Gemini باستخدام مفتاح API الخاص بك." },
      highlight:  { title: "تحديد للحماية",               desc: "حدد أي كلمة في رسالة مرسلة لحمايتها أو إلغاء حمايتها فوراً. التغييرات تُطبَّق في الحال." },
      sync:       { title: "مزامنة الشركة",               desc: "شارك قائمة المصطلحات المحمية مع فريقك بالكامل. تحديث واحد من المسؤول يحمي الجميع فوراً." },
      ocr:        { title: "التعرف الضوئي على الصور",     desc: "استخرج النص من الصور وامنحه الحماية تلقائياً. مثالي للمستندات الممسوحة ضوئياً والصور." },
      keyboard:   { title: "التنقل بلوحة المفاتيح",       desc: "تنقل كامل بلوحة المفاتيح مع بحث ⌘K ومحادثة جديدة ⌘⇧N وإرسال ⌘↵." }
    },
    trust: {
      title: "بياناتك لا تغادر جهازك أبداً",
      desc: "كل عمليات الكشف والإخفاء تحدث محلياً — في متصفحك أو تطبيق سطح المكتب. لا يوجد خادم لـ Ledebe يرى محتواك.",
      li1: "المعالجة المحلية — يحدث الإخفاء على جهازك وليس على خوادمنا",
      li2: "مفاتيح API تُخزّن محلياً فقط — لا تُرفع إلى Ledebe أبداً",
      li3: "سجل المحادثات محفوظ في التخزين المحلي لمتصفحك فقط",
      li4: "متوافق مع GDPR — لا تعالج Ledebe أي بيانات شخصية",
      li5: "قابل للعكس تماماً — بياناتك الأصلية لا تُمحى أبداً",
      card1: "لا معالجة على الخادم",
      card2: "الكشف الذكي محلياً على جهازك",
      card3: "إخفاء قابل للعكس تماماً",
      card4: "مصمم للامتثال لـ GDPR"
    },
    vscode: {
      title: "🧩 متاح أيضاً كامتداد VS Code",
      desc: "احمِ الكود والإعدادات والسجلات مباشرةً في محررك. انقر بالزر الأيمن ← حماية على أي ملف.",
      btn: "تثبيت الامتداد ←"
    },
    pp: {
      label: "الأسعار", title: "ابدأ مجاناً، توسّع عند الاستعداد",
      sub: "بدون رسوم خفية. ألغِ في أي وقت. حماية PII الأساسية مجانية دائماً.",
      popular: "الأكثر شعبية",
      personal: { name: "شخصي", price: "مجاناً", per: "للأبد", f1: "حماية نص غير محدودة", f2: "حتى 20 مصطلحاً مخصصاً", f3: "3 رفعات ملفات/يوم", f4: "امتداد VS Code", btn: "ابدأ الآن ←" },
      pro:      { name: "احترافي", per: "شهرياً", f1: "مصطلحات مخصصة غير محدودة", f2: "رفع ملفات غير محدود", f3: "دردشة ذكاء اصطناعي (مفتاح API الخاص)", f4: "دعم ذو أولوية", btn: "احصل على Pro ←" },
      team:     { name: "الأعمال", per: "لكل مستخدم / شهرياً", f1: "مزامنة المصطلحات على مستوى الشركة", f2: "لوحة تحكم المسؤول", f3: "سجل التدقيق", f4: "فوترة بالفاتورة", btn: "احصل على الفريق ←" },
      ent:      { name: "المؤسسات", price: "مخصص", per: "عقد سنوي", f1: "نشر محلي", f2: "تقارير GDPR / HIPAA", f3: "اتفاقية مستوى خدمة 99.9%", f4: "تأهيل مخصص", btn: "تحدث معنا ←" },
      seeAll: "عرض مقارنة الأسعار والميزات الكاملة ←"
    },
    cta: {
      title: "ابدأ حماية بياناتك اليوم",
      sub: "مجاناً. لا حساب مطلوب. يعمل على Mac وWindows وLinux.",
      bookDemoBtn: "احجز عرضاً مجانياً ←"
    },
    footer: {
      tagline: "حماية مع الخصوصية أولاً لكل من يستخدم الذكاء الاصطناعي. بياناتك تبقى على جهازك دائماً.",
      product: "المنتج", company: "الشركة", legal: "قانوني",
      downloads: "التنزيلات", pricing: "الأسعار", documentation: "التوثيق",
      vscodeExt: "امتداد VS Code", webApp: "تطبيق الويب",
      about: "عن الشركة", contact: "تواصل معنا", bookDemo: "احجز عرضاً",
      privacy: "سياسة الخصوصية", terms: "شروط الخدمة",
      copyright: "© 2026 Ledebe Technologies. جميع الحقوق محفوظة."
    },
    pricing: {
      hero: {
        label: "الأسعار",
        title: "أسعار بسيطة وصادقة",
        intro: 'ابدأ مجاناً — بدون بطاقة. حدِّث عندما تحتاج المزيد. ألغِ في أي وقت. كل الخطط المدفوعة تتضمن <strong>ضمان استرداد لمدة 14 يوماً</strong>.'
      },
      billing: {
        monthly: "شهرياً", annual: "سنوياً", save: "وفّر 20%",
        perMonth: "شهرياً", perYear: "سنوياً",
        perUserMonth: "لكل مستخدم / شهرياً", perUserYear: "لكل مستخدم / سنوياً",
        forever: "للأبد", annualContract: "عقد سنوي",
        minUsers: "الحد الأدنى 3 مستخدمين"
      },
      featured: "الأكثر شعبية",
      whatsIncluded: "ما المتضمن",
      everythingInFree: "كل ما في الخطة المجانية، بالإضافة إلى",
      everythingInPro: "كل ما في الاحترافي، بالإضافة إلى",
      everythingInTeam: "كل ما في الفريق، بالإضافة إلى",
      personal: {
        name: "شخصي", title: "مجاناً",
        desc: "للأفراد الذين يجربونه أو للاستخدام اليومي الخفيف.",
        cta: "ابدأ مجاناً",
        f1: "حماية نص غير محدودة", f2: "حتى 20 مصطلحاً مخصصاً",
        f3: "3 ملفات يومياً", f4: "آخر 30 محادثة",
        f5: "امتداد VS Code", f6: "وضع داكن / فاتح",
        f7: "دردشة ذكاء اصطناعي (بمفتاحك الخاص)", f8: "رفع ملفات غير محدود",
        f9: "مزامنة الشركة", f10: "دعم ذو أولوية"
      },
      pro: {
        name: "احترافي", title: "Pro",
        desc: "للمستخدمين المتقدمين والمستقلين والمحترفين الذين يريدون المزيد.",
        cta: "ابدأ ←",
        annualNote: "وفّر £21 مقارنة بالشهري",
        f1: "مصطلحات مخصصة غير محدودة",
        f2: "رفع ملفات غير محدود (50 ميجابايت/ملف)",
        f3: "دردشة ذكاء اصطناعي بمفتاح API الخاص بك",
        f4: "سجل محادثات كامل (غير محدود)",
        f5: "تصدير المستندات المحمية",
        f6: "دعم بريد إلكتروني ذو أولوية",
        f7: "وصول مبكر للمزايا الجديدة",
        f8: "مزامنة الشركة", f9: "لوحة تحكم المسؤول"
      },
      team: {
        name: "الأعمال", title: "الفريق",
        desc: "للشركات الصغيرة والمتوسطة والأقسام التي تحتاج تحكم ورؤية مشتركة.",
        cta: "ابدأ ←",
        annualNote: "وفّر £56 لكل مستخدم مقارنة بالشهري",
        f1: "مزامنة الشركة — مصطلحات مشتركة",
        f2: "لوحة تحكم المسؤول وإدارة الفريق",
        f3: "مصطلحات محمية مُدارة مركزياً",
        f4: "سجل التدقيق",
        f5: "مدير حساب مخصص (10+ مستخدمين)",
        f6: "فوترة بالفاتورة متاحة",
        f7: "SSO — قريباً"
      },
      ent: {
        name: "المؤسسات", title: "مخصص",
        desc: "للمنظمات الكبيرة والقطاعات المنظمة.",
        priceLabel: "مخصص", cta: "تحدث معنا ←",
        f1: "خيار نشر داخلي", f2: "تكاملات مخصصة",
        f3: "اتفاقية مستوى خدمة للجاهزية (بنود في العقد)",
        f4: "وثائق الامتثال عند الطلب",
        f5: "مكتبة مصطلحات مخصصة",
        f6: "تأهيل مخصص", f7: "خصومات الحجم"
      },
      trust: {
        t1Title: "بدون بطاقة",              t1Sub: "ابدأ مجاناً، حدّث لاحقاً",
        t2Title: "ألغِ في أي وقت",          t2Sub: "بدون التزامات أو غرامات",
        t3Title: "بدّل الخطط بحرية",        t3Sub: "ترقية أو تخفيض فوري",
        t4Title: "الفواتير متضمنة",         t4Sub: "إيصالات تلقائية لكل دفعة",
        t5Title: "الدفع عبر Paddle",        t5Sub: "دفع آمن متوافق مع PCI"
      },
      faq: {
        title: "أسئلة متكررة",
        q1: "هل الخطة المجانية مجانية فعلاً للأبد؟",
        a1: "نعم. الخطة الشخصية مجانية إلى أجل غير مسمى — بدون فترة تجريبية، وبدون بطاقة ائتمان. حماية PII الأساسية ستظل مجانية دائماً.",
        q2: 'ماذا يُحتسب "رفع ملف"؟',
        a2: "أي ملف PDF أو مستند Word أو صورة (JPEG/PNG) أو CSV ترفعه لفحص PII. المستخدمون المجانيون لديهم 3 رفعات يومياً. خطط Pro وما فوق لديها رفع غير محدود حتى 50 ميجابايت لكل ملف.",
        q3: "هل أحتاج تقديم مفتاح API الخاص بي للذكاء الاصطناعي؟",
        a3: 'نعم — لدردشة الذكاء الاصطناعي (وضع "اسأل الذكاء الاصطناعي")، تقدّم مفتاح API الخاص بك من OpenAI أو Anthropic أو Gemini. هذا يبقي بياناتك المحمية بعيداً تماماً عن أنظمتنا. مفتاحك يُحفظ محلياً ولا يُرفع إلى Ledebe أبداً.',
        q4: "كيف تعمل فوترة خطة الفريق؟",
        a4: "خطط الفريق تُفوتر لكل مستخدم نشط شهرياً (الحد الأدنى 3 مستخدمين). يمكنك إضافة أو إزالة المقاعد في أي وقت — تتعدل الفوترة تلقائياً في الدورة التالية. الفوترة بالفاتورة متاحة عند الطلب.",
        q5: "هل يمكنني تغيير الخطط في أي وقت؟",
        a5: "نعم. الترقيات تُطبَّق فوراً. التخفيضات تسري في نهاية دورة الفوترة الحالية، وتحتفظ بالوصول للمزايا المدفوعة حتى ذلك الحين.",
        q6: "ما طرق الدفع المقبولة؟",
        a6: "نقبل جميع بطاقات الائتمان والخصم الرئيسية (Visa وMastercard وAmex) عبر Paddle، مزود الدفع لدينا. عملاء المؤسسات يمكنهم الدفع بالتحويل البنكي أو الفاتورة.",
        q7: "هل توجد سياسة استرداد؟",
        a7: "نقدم استرداداً لمدة 14 يوماً على جميع الخطط المدفوعة إن لم تكن راضياً. تواصل مع hello@ledebe.com وسنعالج الأمر دون أسئلة."
      }
    },
    downloads: {
      hero: {
        label: "احصل على التطبيق",
        title: "تحميل Ledebe",
        desc: "مجاناً. لا حساب مطلوب. متاح لـ Mac وWindows وLinux — أو استخدمه مباشرةً في متصفحك."
      },
      vscode: {
        title: "امتداد VS Code",
        desc: 'احمِ الكود والإعدادات والسجلات مباشرةً في محررك. ابحث عن "Ledebe Protector" في لوحة الامتدادات.',
        btn: "تثبيت الامتداد ←"
      },
      mac: {
        heading: "macOS",
        siliconTitle: "Apple Silicon (M1, M2, M3)",
        siliconReq: "يتطلب macOS 11 Big Sur أو أحدث",
        intelTitle: "Mac بمعالج Intel",
        intelReq: "يتطلب macOS 10.15 Catalina أو أحدث",
        btnDmg: "تحميل .dmg",
        btnZip: "تحميل .zip",
        notice: "🍎 <strong>إعداد لمرة واحدة على macOS:</strong> بينما نُكمل توثيق Apple، سيُظهر macOS تنبيه أمان عند التشغيل الأول. ببساطة انقر بالزر الأيمن على أيقونة التطبيق ← <strong>افتح</strong> ← <strong>افتح</strong>. هذا يحدث مرة واحدة فقط — إنها خطوة قياسية للتطبيقات الجديدة الموزعة خارج App Store."
      },
      win: {
        heading: "Windows",
        storeTitle: "Microsoft Store",
        storeBadge: "موصى به",
        storeReq: "موقّع من Microsoft، تحديثات تلقائية، بدون تحذيرات أمان",
        storeBtn: "احصل عليه من Microsoft Store ←",
        directTitle: "المثبّت المباشر",
        directReq: "متوافق مع Windows 10 وWindows 11",
        directBtn: "تحميل Setup .exe",
        notice: '⚠️ تحذير <strong>SmartScreen</strong> ينطبق فقط على المثبّت المباشر. إذا رأيت "Windows protected your PC"، انقر على <strong>More info</strong> ← <strong>Run anyway</strong>. نسخة Microsoft Store موقّعة من Microsoft وتتجاوز هذا التحذير تماماً.'
      },
      linux: {
        heading: "Linux",
        appimageTitle: "AppImage (عام)",
        appimageReq: "يعمل على Ubuntu 18.04+ وFedora وDebian ومعظم التوزيعات",
        appimageBtn: "تحميل .AppImage",
        snapTitle: "حزمة Snap",
        snapReq: "لـ Ubuntu والتوزيعات الداعمة لـ Snap",
        snapBtn: "تحميل .snap",
        noticeIntro: "إعداد AppImage:",
        noticeStep1: "بعد التحميل، اجعل الملف قابلاً للتنفيذ قبل تشغيله:",
        noticeStep2: "إذا فشل في الإقلاع، ثبّت libfuse2:"
      }
    },
    demo: {
      hero: {
        label: "شاهده وهو يعمل",
        title: "احجز عرضاً مجانياً",
        desc: "30 دقيقة. دون التزام. شاهد كيف يحمي Ledebe بياناتك الحساسة بدقة قبل أن تصل إلى الذكاء الاصطناعي."
      },
      cover: "ما سنغطيه",
      points: {
        p1Title: "عرض إخفاء حي",
        p1Desc: "شاهد الكشف عن PII وإخفاءه في الزمن الحقيقي مع نوع المحتوى الخاص بك.",
        p2Title: "جولة في تدفق العمل مع الذكاء الاصطناعي",
        p2Desc: "كيف تستخدم Ledebe بأمان مع ChatGPT أو Claude أو Gemini.",
        p3Title: "حماية المستندات",
        p3Desc: "ارفع وافحص ملفات PDF ومستندات Word وجداول البيانات بحثاً عن PII.",
        p4Title: "خيارات الفريق والمؤسسات",
        p4Desc: "كيف تعمل مكتبات المصطلحات المشتركة ولوحات تحكم المسؤولين للفرق.",
        p5Title: "أجوبة على أسئلتك",
        p5Desc: "أحضر حالة الاستخدام الخاصة بك — سنُريك كيف يتعامل Ledebe معها."
      },
      meta: {
        durationLabel: "المدة:",      durationVal: "30 دقيقة",
        formatLabel: "الصيغة:",      formatVal: "مكالمة فيديو (يُرسَل الرابط عند التأكيد)",
        costLabel: "التكلفة:",       costVal: "مجاناً، بدون التزام",
        whoLabel: "لمن:",            whoVal: "المؤسسون، قادة IT، مسؤولو الامتثال، المطورون"
      }
    },
    contact: {
      hero: {
        label: "تواصل معنا",
        title: "اتصل بنا",
        desc: "نحن فريق صغير ونقرأ كل رسالة. عادةً ما نرد خلال 24 ساعة."
      },
      responseNotice: "راسلنا على <strong>hello@ledebe.com</strong> — نرد عادةً خلال 24 ساعة في أيام العمل.",
      cards: {
        generalTitle: "استفسارات عامة",       generalDesc: "أسئلة عن Ledebe أو المنتج أو كيف يعمل.",
        supportTitle: "الدعم",                supportDesc: "لديك مشكلة مع التطبيق أو تحتاج مساعدة بشأن حسابك.",
        entTitle: "المؤسسات",                 entDesc: "مهتم بخطط الفريق أو المؤسسات لمؤسستك.",
        privTitle: "الخصوصية",                privDesc: "طلبات خصوصية البيانات أو حقوق GDPR أو مخاوف أمنية."
      },
      faqPrompt: {
        title: "تبحث عن إجابات سريعة؟",
        desc: "راجع توثيقنا — تتم الإجابة عن معظم الأسئلة الشائعة هناك.",
        btn: "تصفّح التوثيق ←"
      }
    },
    about: {
      hero: {
        label: "قصتنا",
        title: "حول Ledebe",
        desc: "بنينا الأداة التي تمنينا وجودها — طريقة بسيطة للعمل مع الذكاء الاصطناعي دون كشف البيانات الحساسة."
      },
      why: {
        title: "لماذا وُجد Ledebe",
        p1: "أدوات الذكاء الاصطناعي مثل ChatGPT وClaude وGemini تُحوّل طريقة عمل الناس. لكن هناك مشكلة لا يتحدث عنها أحد بما يكفي — لاستخدام هذه الأدوات بفعالية، يلصق الناس إيميلات حقيقية وأسماء حقيقية وأرقام هواتف حقيقية ومستندات حقيقية. بيانات حساسة تغادر الأجهزة وتدخل أنظمة الذكاء الاصطناعي يومياً، غالباً دون أن يدرك المستخدمون المخاطر.",
        p2: "بُني Ledebe لحل هذا. يتيح لك العمل مع الذكاء الاصطناعي بحرية — دون كشف البيانات التي ليست لك لمشاركتها.",
        highlight: "الفكرة الأساسية بسيطة: أخفِ الأجزاء الحساسة قبل أن تغادر جهازك. استخدم الذكاء الاصطناعي بحرية مع النسخة المُخفاة. استعد الأصل متى احتجت."
      },
      what: {
        title: "ما الذي نبنيه",
        intro: "Ledebe هو مجموعة أدوات خصوصية للأفراد والفرق والمؤسسات التي تعمل مع الذكاء الاصطناعي يومياً.",
        p1: "<strong>تطبيق سطح المكتب</strong> — متاح على Mac وWindows وLinux. يعمل بلا اتصال، بدون حساب مطلوب.",
        p2: "<strong>امتداد VS Code</strong> — احمِ الكود والإعدادات والسجلات مباشرةً داخل محررك.",
        p3: "<strong>حماية الملفات</strong> — ارفع ملفات PDF ومستندات Word والصور لفحص وإخفاء PII قبل المشاركة."
      },
      principles: {
        title: "مبادئنا",
        v1Title: "المحلي أولاً",        v1Desc: "كل الكشف والإخفاء يحدث على جهازك. بياناتك لا تلامس خوادمنا أبداً.",
        v2Title: "قابل للعكس تماماً",   v2Desc: "البيانات المخفاة يمكن استعادتها دائماً. لن تُحجب أبداً عن محتواك الخاص.",
        v3Title: "بدون تتبع",          v3Desc: "لا نجمع ما تحميه. لا تحليلات على محتواك، أبداً.",
        v4Title: "للجميع",             v4Desc: "من المطورين المستقلين إلى فرق الامتثال في المؤسسات — Ledebe يعمل للجميع."
      },
      who: {
        title: "من نحن",
        p1: "Ledebe من بناء Ledebe Technologies — شركة برمجيات تركز على أدوات الخصوصية ومنتجات حماية البيانات. نحن فريق صغير ومركز يؤمن بأن الخصوصية يجب أن تكون الإعداد الافتراضي، وليست شيئاً يُضاف لاحقاً.",
        p2: 'لديك سؤال أو ترغب بالعمل معنا؟ تواصل عبر <strong><a href="mailto:hello@ledebe.com" style="color:var(--primary-blue);">hello@ledebe.com</a></strong>'
      },
      ctaBox: {
        title: "جاهز لحماية بياناتك؟",
        desc: "مجاناً. لا حساب مطلوب. يعمل على Mac وWindows وLinux.",
        bookBtn: "احجز عرضاً مجانياً ←"
      }
    },
    docs: {
      hero: { title: "التوثيق", subtitle: "كل ما تحتاجه لتثبيت واستخدام Ledebe Protector" },
      pageTitle: "توثيق Ledebe Protector",
      pageLead: "Ledebe Protector يكشف ويُخفي معلومات التعريف الشخصية (PII) قبل أن تشارك النص مع أدوات الذكاء الاصطناعي أو الزملاء أو الخدمات الخارجية. بياناتك الأصلية لا تغادر جهازك أبداً.",
      sidebar: {
        started: "البدء",
        overview: "نظرة عامة", howToUse: "كيف تستخدمه", requirements: "متطلبات النظام",
        install: "التثبيت",
        macSilicon: "macOS (Apple Silicon)", macIntel: "macOS (Intel)", windows: "Windows", linux: "Linux",
        using: "استخدام Ledebe",
        protectText: "حماية النص", highlightProtect: "التحديد للحماية/إلغاء الحماية", customTerms: "مصطلحات مخصصة",
        fileUpload: "رفع الملفات", aiChat: "دردشة الذكاء الاصطناعي", history: "السجل والبحث", keyboard: "اختصارات لوحة المفاتيح",
        extensions: "الامتدادات",
        vscode: "امتداد VS Code",
        help: "المساعدة",
        faq: "أسئلة متكررة", troubleshooting: "حل المشكلات"
      },
      overview: {
        title: "نظرة عامة",
        p1: "يعمل Ledebe Protector باستبدال المعلومات الحساسة في نصك بعلامات آمنة، ما يتيح لك مشاركة النص أو معالجته بحرية. يمكنك استعادة المحتوى الأصلي في أي وقت.",
        typesIntro: "أنواع PII المدعومة:"
      },
      howToUse: {
        title: "كيف تستخدم Ledebe",
        subtitle: "جديد على Ledebe؟ اتبع هذه الخطوات لحماية ومشاركة النص بأمان في أقل من دقيقة.",
        s1Title: "الخطوة 1 — اكتب أو الصق نصك",
        s1Body: "افتح التطبيق واكتب (أو الصق) أي نص يحتوي على معلومات حساسة في منطقة الإدخال الرئيسية. قد يكون بريداً إلكترونياً أو تذكرة دعم أو مقتطفاً من عقد — أي شيء.",
        s1Example: 'مثال: <em>"مرحباً، اسمي Sarah Jones، بريدي sarah@company.com وهاتفي 07911 123456."</em>',
        s2Title: "الخطوة 2 — انقر إرسال / حماية",
        s2Body: "انقر زر <strong>إرسال</strong> (أو اضغط <strong>Ctrl + Enter</strong> / <strong>⌘ Cmd + Enter</strong> على Mac). يفحص Ledebe نصك تلقائياً ويستبدل كل PII مكتشف بعلامة آمنة.",
        s2Example: 'ستبدو النتيجة هكذا: <em>"مرحباً، اسمي [LDB_CUSTOM1]، بريدي [LDB_EMAIL1] وهاتفي [LDB_PHONE1]."</em> — آمن للمشاركة في أي مكان.',
        s3Title: "الخطوة 3 — التبديل بين العروض",
        s3Body: "كل رسالة لها لسانان أسفلها: <strong>نص عادي</strong> — نصك الأصلي غير المُخفى (مرئي لك فقط). <strong>نص محمي</strong> — النسخة المُخفاة بالعلامات، آمنة للنسخ والمشاركة.",
        s4Title: "الخطوة 4 — انسخ النص المحمي",
        s4Body: "انقر زر <strong>📋 نسخ</strong> في الرسالة، أو اضغط <strong>Ctrl/⌘ Cmd + Shift + X</strong>، لنسخ النسخة المحمية إلى الحافظة. الصقها في ChatGPT أو بريد إلكتروني أو نظام دعم — أينما تحتاج.",
        s5Title: "الخطوة 5 — استعد الأصل (اختياري)",
        s5Body: "إذا تلقيت رداً يحتوي على علامات (مثلاً من أداة ذكاء اصطناعي)، الصقها في Ledebe. ستبدّل العلامات تلقائياً إلى القيم الحقيقية، فتقرأ الرد ببياناتك الفعلية.",
        s6Title: "الخطوة 6 — أضف مصطلحات مخصصة (اختياري)",
        s6Body: "هل لديك كلمات محددة تريد دائماً إخفاءها — مثل اسم شركتك أو كود مشروع أو اسم عميل؟ أضفها إلى <strong>المصطلحات المخصصة</strong> في الشريط الجانبي. ستُخفى تلقائياً في كل مرة.",
        s6Tip: '<strong>نصيحة سريعة:</strong> أثناء الكتابة، يقترح Ledebe كلمات لإضافتها كمصطلحات مخصصة. إذا كانت الكلمة محمية بالفعل، تظهر شارة خضراء <em>"محمي بالفعل"</em> لئلا تضيف نفس المصطلح مرتين.',
        modeTitle: "التبديل بين الحماية وسؤال الذكاء الاصطناعي",
        modeIntro: "في أسفل الشاشة، فوق صندوق النص مباشرةً، سترى مُحوّل وضع:",
        modeProtect: "<strong>🛡️ حماية (افتراضي)</strong> — يُخفي نصك ويعرض لك النسخة الآمنة للنسخ. لا يُرسل شيء لأي ذكاء اصطناعي. استخدمه عندما تريد فقط تنقية النص قبل لصقه في مكان آخر.",
        modeAsk: "<strong>🤖 اسأل الذكاء الاصطناعي</strong> — يرسل رسالتك مباشرةً إلى ذكاء اصطناعي (OpenAI أو Anthropic أو Google) مع إخفاء PII مسبقاً. يرد الذكاء الاصطناعي، وترى رده ونسخة \"آمنة للمشاركة\" مُخفاة من جديد. استخدمه لتجربة دردشة ذكاء اصطناعي خاصة بالكامل.",
        modeTip: "يمكنك تبديل الأوضاع في أي وقت — حتى أثناء المحادثة. يتذكر المُحوّل آخر اختيار."
      },
      reqs: {
        title: "متطلبات النظام"
      },
      macSilicon: {
        title: "macOS",
        intro: "لأجهزة Mac من نوع M1 وM2 وM3. حمّل ملف <strong>arm64.dmg</strong>.",
        stepsTitle: "خطوات التثبيت",
        gateWarning: "<strong>تحذير Gatekeeper:</strong> عند التشغيل الأول، قد يظهر macOS \"لا يمكن فتح Ledebe Protector لأنه من مطور غير محدد.\" للتجاوز: انقر بالزر الأيمن على الأيقونة ← <strong>فتح</strong> ← <strong>فتح</strong> في مربع الحوار. تحتاج لفعل هذا مرة واحدة فقط.",
        altTip: "بدلاً من ذلك، اذهب إلى <strong>إعدادات النظام ← الخصوصية والأمان</strong> وانقر <strong>افتح على أي حال</strong> بجانب إدخال Ledebe Protector."
      },
      macIntel: {
        title: "macOS",
        intro: "لأجهزة Mac المعتمدة على Intel. حمّل ملف <strong>x64.dmg</strong>.",
        stepsTitle: "خطوات التثبيت",
        gateWarning: "نفس سلوك Gatekeeper مع Apple Silicon — انقر بالزر الأيمن ← <strong>فتح</strong> عند التشغيل الأول إذا حجبه macOS."
      },
      windows: {
        title: "Windows",
        intro: "حمّل مثبت NSIS <strong>Ledebe Protector Setup 1.0.0.exe</strong>. يُنشئ اختصارات في قائمة ابدأ وأيقونة سطح المكتب ومُلغي تثبيت.",
        stepsTitle: "خطوات التثبيت",
        smartScreen: "تحذير <strong>SmartScreen</strong> طبيعي للتطبيقات المنشورة حديثاً بدون شهادة EV لتوقيع الكود. التطبيق آمن — انقر <strong>المزيد من المعلومات ← تشغيل على أي حال</strong> للمتابعة.",
        uninstall: "للإلغاء: اذهب إلى <strong>الإعدادات ← التطبيقات</strong>، اعثر على Ledebe Protector وانقر <strong>إلغاء التثبيت</strong>."
      },
      linux: {
        title: "Linux",
        intro: "يُشحن Ledebe Protector كملف <strong>AppImage</strong> عام — بدون تثبيت مطلوب. يعمل على Ubuntu وDebian وFedora وArch ومعظم التوزيعات الأخرى.",
        stepsTitle: "خطوات التثبيت",
        gui: "يمكنك أيضاً النقر بالزر الأيمن على AppImage في مدير الملفات ← <strong>الخصائص ← الأذونات</strong> ← اختر <strong>\"السماح بتشغيل الملف كبرنامج\"</strong>، ثم انقر نقراً مزدوجاً للتشغيل.",
        fuseHelp: "تتطلب بعض التوزيعات <code>libfuse2</code> لتطبيقات AppImage. إذا فشل تشغيل التطبيق، ثبّته:"
      },
      protectText: {
        title: "حماية النص",
        tip: "العلامات ثابتة خلال الجلسة — نفس البريد الإلكتروني يُعيَّن دائماً لنفس العلامة، فيُحفظ هيكل نصك."
      },
      highlightProtect: {
        title: "التحديد للحماية/إلغاء الحماية",
        intro: "يمكنك حماية أو إلغاء حماية كلمات فردية مباشرةً من أي رسالة مُرسلة — دون إعادة كتابة شيء.",
        protectTitle: "حماية كلمة",
        unprotectTitle: "إلغاء حماية كلمة",
        info: "يعمل هذا داخل رسائل الدردشة وداخل معاينة المستند. التغييرات تُطبَّق فوراً — لا حاجة لإعادة إرسال الرسالة."
      },
      customTerms: {
        title: "مصطلحات مخصصة",
        intro: "أضف كلماتك أو عباراتك الخاصة لحمايتها دائماً — أسماء، أسماء شركات، أكواد مشاريع، أي شيء حساس.",
        addTitle: "إضافة مصطلح",
        searchTitle: "البحث في مصطلحاتك",
        searchIntro: "إذا كان لديك مصطلحات محفوظة كثيرة، استخدم البحث المدمج للعثور عليها بسرعة.",
        searchTip: 'يعرض نافذة البحث عدداً، مثلاً <em>"4 من 47 مصطلحاً"</em>، فتعرف دائماً عدد المصطلحات المطابقة لاستعلامك.'
      },
      fileUpload: {
        title: "رفع الملفات",
        intro: "يمكن لـ Ledebe معالجة مستندات كاملة — وليس النص المكتوب فقط. ارفع ملفاً وسيستخرج المحتوى ويحميه ويعرضه لك.",
        uploadTitle: "كيف ترفع",
        supportedTitle: "أنواع الملفات المدعومة",
        previewTitle: "معاينة المستند",
        previewIntro: "بعد الرفع، انقر بطاقة المستند لفتح نافذة المعاينة. تعرض عرضين جنباً إلى جنب:",
        previewDownload: "من المعاينة يمكنك <strong>📥 تنزيل</strong> النسخة المحمية كملف.",
        previewHighlight: "يمكنك أيضاً تحديد النص داخل معاينة المستند لتشغيل زر <strong>🛡️ حماية</strong> / <strong>🔓 إلغاء الحماية</strong> العائم، تماماً كما في رسائل الدردشة."
      },
      aiChat: {
        title: "دردشة الذكاء الاصطناعي",
        intro: "بدّل إلى وضع <strong>اسأل الذكاء الاصطناعي</strong> لإرسال أسئلة مباشرةً إلى ذكاء اصطناعي. يُخفي Ledebe PII قبل إرسال الرسالة، فلا يرى الذكاء الاصطناعي بياناتك الحقيقية أبداً.",
        setupTitle: "الإعداد",
        keyInfo: "مفاتيح API تُخزَّن محلياً فقط — لا تُرسل أبداً إلى خوادم Ledebe."
      },
      history: {
        title: "السجل والبحث",
        intro: "كل محادثة تُحفظ تلقائياً في سجلك المحلي. يعرض الشريط الجانبي الأيسر جميع الدردشات السابقة.",
        usingTitle: "استخدام السجل",
        searchTitle: "البحث في السجل بـ ⌘K",
        searchIntro: "اضغط <strong>⌘K</strong> (Mac) أو <strong>Ctrl+K</strong> (Windows) لفتح لوحة الأوامر — بحث سريع عبر جميع دردشاتك السابقة.",
        searchTip: "يمكنك أيضاً النقر على زر <strong>بحث السجل</strong> في أعلى الشريط الجانبي لفتح نفس اللوحة."
      },
      keyboard: {
        title: "اختصارات لوحة المفاتيح",
        intro: "Ledebe قابل للتنقل بالكامل بلوحة المفاتيح. استخدم هذه الاختصارات للعمل بسرعة:",
        colAction: "الإجراء", colMac: "Mac", colWin: "Windows / Linux",
        rSearch: "بحث السجل (لوحة الأوامر)",
        rNew: "دردشة جديدة",
        rSend: "إرسال الرسالة",
        rToggle: "تبديل الشريط الجانبي",
        rAll: "عرض جميع الاختصارات"
      },
      vscode: {
        title: "امتداد VS Code",
        intro: "Ledebe متاح أيضاً كـ <strong>امتداد VS Code</strong> — مبني للمطورين الذين يريدون حماية البيانات الحساسة قبل مشاركة الكود أو السجلات أو ملفات الإعداد مع أدوات ذكاء اصطناعي مثل GitHub Copilot أو ChatGPT.",
        installTitle: "التثبيت",
        featuresTitle: "المميزات",
        shortcutTitle: "اختصار لوحة المفاتيح",
        colAction: "الإجراء", colShortcut: "الاختصار",
        rProtect: "حماية النص المحدد",
        tip: "المصطلحات المخصصة المضافة في امتداد VS Code تُحفظ لكل ملف VS Code تعريفي — منفصلة عن قائمة مصطلحات تطبيق سطح المكتب."
      },
      faq: {
        title: "أسئلة متكررة",
        q1: "كيف ألغي حماية كلمة سبق أن حميتها؟",
        a1: "حدّد الكلمة داخل أي رسالة مُرسلة. إذا كانت في مصطلحاتك المحمية، سيُظهر الزر العائم <strong>🔓 إلغاء الحماية</strong> (باللون الأحمر). انقره وتُزال الكلمة من مصطلحاتك وتُحدَّث الرسالة فوراً.",
        q2: "كيف أبحث في سجل الدردشة؟",
        a2: "اضغط <strong>⌘K</strong> (Mac) أو <strong>Ctrl+K</strong> (Windows) لفتح لوحة الأوامر. ابدأ الكتابة لتصفية الدردشات السابقة، استخدم مفاتيح الأسهم للتنقل، واضغط Enter لفتح إحداها. اضغط Esc للإغلاق.",
        q3: "هل يرسل Ledebe بياناتي إلى أي مكان؟",
        a3: "لا. كل الكشف والإخفاء يحدث محلياً على جهازك. الحركة الصادرة الوحيدة هي عند استخدام ميزة دردشة الذكاء الاصطناعي — في هذه الحالة، يُرسل فقط النص <em>المُخفى</em> (بالعلامات، لا بياناتك الحقيقية) إلى واجهة برمجة تطبيقات مزود الذكاء الاصطناعي.",
        q4: "هل يمكنني استعادة النص الأصلي بعد مشاركة النسخة المحمية؟",
        a4: "نعم — طالما أنك في نفس الجلسة أو تم حفظ خريطة العلامات. الصق النص المحمي في Ledebe وانقر <strong>استعادة</strong>.",
        q5: "أين تُخزَّن مفاتيح API الخاصة بي؟",
        a5: "مفاتيح API تُخزَّن في التخزين المحلي لجهازك فقط. لا تُرفع أبداً إلى خوادم Ledebe ولا تُضمَّن في أي تقارير أعطال.",
        q6: "التطبيق يقول إنه من مطور غير محدد على Mac — هل هو آمن؟",
        a6: "نعم، آمن. يظهر هذا التحذير لأن التطبيق لم يُسجّل بعد في برنامج توثيق Apple. انقر بالزر الأيمن على التطبيق ← <strong>فتح</strong> ← <strong>فتح</strong> لتجاوزه. تحتاج لفعل هذا مرة واحدة فقط.",
        q7: "حجب Windows SmartScreen المثبت — ماذا أفعل؟",
        a7: "انقر <strong>المزيد من المعلومات</strong> في مربع SmartScreen، ثم انقر <strong>تشغيل على أي حال</strong>. يظهر هذا التحذير للتطبيقات المنشورة حديثاً. المثبت آمن.",
        q8: "AppImage على Linux لا يُقلع — ماذا أفعل؟",
        a8: 'تأكد أن الملف لديه إذن التنفيذ: <code>chmod +x "Ledebe Protector-1.0.0.AppImage"</code>. إذا فشل، ثبّت <code>libfuse2</code>: على Ubuntu/Debian شغّل <code>sudo apt install libfuse2</code>.'
      },
      trouble: {
        title: "حل المشكلات",
        crashTitle: "التطبيق ينهار عند الإقلاع",
        crashBody: "تُحفظ تقارير الأعطال في <code>~/.ledebe-crashes/</code>. إذا احتجت دعماً، ضمّن أحدث سجل أعطال عند التواصل معنا.",
        piiTitle: "لا يتم اكتشاف PII",
        piiBody: "تأكد أن صيغة النص تطابق نمطاً مدعوماً. للصيغ غير المعتادة (مثل صيغ هاتف غير قياسية)، أضف القيمة كـ <strong>مصطلح مخصص</strong>.",
        aiTitle: "دردشة الذكاء الاصطناعي لا تستجيب",
        darkTitle: "الوضع الداكن لا يُحفظ",
        darkBody: "تفضيل الوضع الداكن يُخزَّن في التخزين المحلي. مسح ذاكرة المتصفح المؤقتة (في Electron: <strong>الإعدادات ← مسح البيانات</strong>) سيُعيد تعيينه.",
        helpInfo: 'تحتاج مساعدة أكثر؟ راسلنا على <a href="mailto:hello@ledebe.com" style="color: var(--primary-blue);">hello@ledebe.com</a> أو زر <a href="/contact/" style="color: var(--primary-blue);">صفحة الاتصال</a>.'
      }
    },
    privacy: {
      hero: {
        label: "قانوني",
        title: "سياسة الخصوصية",
        desc: "كيف يتعامل Ledebe مع بياناتك — ولماذا معظمها لا يغادر جهازك أبداً."
      },
      lastUpdated: "آخر تحديث: أبريل 2026",
      highlight: "🛡️ النسخة المختصرة: يُخفي Ledebe بياناتك الحساسة محلياً على جهازك. نحن لا نجمع أو نخزّن أو ننقل بياناتك الشخصية أو المحتوى الذي تحميه. بياناتك تبقى ملكك.",
      s1: {
        title: "1. من نحن",
        p1: "Ledebe أداة خصوصية بنتها Ledebe Technologies. منتجنا يساعد الأفراد والمؤسسات على حماية معلومات التعريف الشخصية (PII) قبل مشاركة المحتوى مع أدوات الذكاء الاصطناعي أو الزملاء أو الأطراف الثالثة.",
        p2: "إذا كانت لديك أسئلة عن هذه السياسة، تواصل معنا على: <strong>hello@ledebe.com</strong>"
      },
      s2: {
        title: "2. ما البيانات التي نجمعها",
        notTitle: "بيانات لا نجمعها",
        not1: "النص الذي تلصقه في Ledebe",
        not2: "PII المكتشف في محتواك (أسماء، إيميلات، أرقام هواتف، إلخ)",
        not3: "قائمة مصطلحاتك المخصصة",
        not4: "سجل دردشتك",
        not5: "مفاتيح API الخاصة بـ OpenAI أو Anthropic أو Google أو أي مزود آخر",
        not6: "مستنداتك أو ملفاتك المرفوعة",
        mayTitle: "بيانات قد نجمعها (مجهولة الهوية)",
        may1: "إحصائيات استخدام أساسية — زيارات الصفحات، أي ميزات تُستخدم (بدون بيانات شخصية مرفقة)",
        may2: "تقارير أخطاء — في حال تعطل التطبيق، قد يُولَّد تقرير مجهول لمساعدتنا في إصلاح العيوب",
        may3: "عدّاد التنزيلات — عدد مرات تنزيل تطبيق سطح المكتب"
      },
      s3: {
        title: "3. أين تعيش بياناتك",
        p1: "كل اكتشاف وإخفاء PII يحدث <strong>محلياً على جهازك</strong> — في متصفحك أو تطبيق سطح المكتب. لا يُرسل أي محتوى إلى خوادم Ledebe خلال هذه العملية.",
        localTitle: "التخزين المحلي",
        local1: "<strong>المصطلحات المخصصة</strong> — تُخزَّن في localStorage الخاص بمتصفحك أو التخزين المحلي لتطبيق سطح المكتب. لا تُرفع أبداً.",
        local2: "<strong>سجل الدردشة</strong> — يُخزَّن محلياً على جهازك فقط.",
        local3: "<strong>مفاتيح API</strong> — تُخزَّن في localStorage الخاص بمتصفحك أو إعدادات VS Code. لا تُنقل أبداً إلى Ledebe.",
        local4: "<strong>تفضيلات الثيم/الإعدادات</strong> — تُخزَّن محلياً.",
        aiTitle: "عند استخدام وضع دردشة الذكاء الاصطناعي",
        aiBody: "إذا استخدمت ميزة اسأل الذكاء الاصطناعي في Ledebe، فإن نصك المخفي (بعلامات مثل [LDB_EMAIL1]، لا بياناتك الحقيقية أبداً) يُرسل مباشرةً من جهازك إلى مزود الذكاء الاصطناعي الذي اخترته (OpenAI أو Anthropic أو Google) باستخدام مفتاح API الخاص بك. Ledebe لا يرى أو يعترض أو يخزن هذا الاتصال."
      },
      s4: {
        title: "4. خدمات الأطراف الثالثة",
        aws: "<strong>AWS S3</strong> — يستضيف موقع Ledebe وتنزيلات تطبيق سطح المكتب. سياسة خصوصية AWS تنطبق على بنية الاستضافة.",
        cf: "<strong>Cloudflare</strong> — يوفر DNS وCDN وحماية DDoS لـ ledebe.com. قد يسجّل Cloudflare بيانات حركة مرور مجهولة الهوية.",
        ai: "<strong>OpenAI / Anthropic / Google</strong> — إذا استخدمت وضع دردشة الذكاء الاصطناعي بمفتاح API الخاص بك، تُرسل طلباتك المُخفاة إلى هؤلاء المزودين. تنطبق سياسات الخصوصية الخاصة بهم.",
        vsm: "<strong>VS Code Marketplace</strong> — يُوزَّع امتداد VS Code عبر متجر Microsoft. سياسة خصوصية Microsoft تنطبق على عملية التنزيل والتثبيت.",
        trail: "Ledebe لا يبيع أو يؤجر أو يشارك بياناتك مع أي طرف ثالث لأغراض التسويق."
      },
      s5: {
        title: "5. ملفات تعريف الارتباط",
        p1: "موقع Ledebe يستخدم الحد الأدنى من ملفات تعريف الارتباط:",
        func: "<strong>ملفات تعريف الارتباط الوظيفية</strong> — تتذكر تفضيل اللغة والثيم.",
        noAds: "لا نستخدم ملفات تعريف ارتباط إعلانية أو ملفات تتبع بين المواقع."
      },
      s6: {
        title: "6. حقوقك (GDPR)",
        p1: "إذا كنت في المنطقة الاقتصادية الأوروبية (EEA) أو المملكة المتحدة، فلك الحقوق التالية:",
        access: "<strong>حق الوصول</strong> — طلب نسخة من أي بيانات شخصية نحتفظ بها عنك.",
        erasure: "<strong>حق المحو</strong> — طلب حذف بياناتك الشخصية.",
        portability: "<strong>حق النقل</strong> — استلام بياناتك بصيغة قابلة للقراءة آلياً.",
        object: "<strong>حق الاعتراض</strong> — الاعتراض على معالجة بياناتك الشخصية.",
        rectify: "<strong>حق التصحيح</strong> — طلب تصحيح البيانات غير الدقيقة.",
        trail: "بما أن Ledebe يخزن بيانات شخصية شبه معدومة، فمعظم هذه الحقوق تتحقق تلقائياً. لممارسة أي حق، تواصل: <strong>hello@ledebe.com</strong>"
      },
      s7: {
        title: "7. أمن البيانات",
        p1: "نأخذ الأمن بجدية:",
        https: "يُقدَّم الموقع عبر HTTPS.",
        noServer: "لا يصل أي محتوى مستخدم حساس إلى خوادمنا.",
        keys: "مفاتيح API تُخزَّن محلياً ولا تُنقل أبداً إلى Ledebe.",
        review: "نراجع بنيتنا التحتية بانتظام بحثاً عن ثغرات أمنية."
      },
      s8: {
        title: "8. خصوصية الأطفال",
        p1: "Ledebe ليس موجهاً للأطفال دون سن 13. لا نجمع عن قصد معلومات شخصية من الأطفال. إذا كنت تعتقد أن طفلاً قد قدم لنا معلومات شخصية، تواصل معنا على hello@ledebe.com وسنحذفها."
      },
      s9: {
        title: "9. تغييرات على هذه السياسة",
        p1: 'قد نُحدّث سياسة الخصوصية هذه من وقت لآخر. سنُخطر المستخدمين بالتغييرات الجوهرية بتحديث تاريخ "آخر تحديث" في أعلى هذه الصفحة. الاستمرار في استخدام Ledebe بعد التغييرات يُعد قبولاً للسياسة المُحدّثة.'
      },
      s10: {
        title: "10. التواصل",
        p1: "لأي أسئلة أو طلبات متعلقة بالخصوصية:",
        email: "البريد الإلكتروني: <strong>hello@ledebe.com</strong>",
        site: "الموقع: <strong>ledebe.com</strong>"
      }
    },
    terms: {
      hero: { label: "قانوني", title: "شروط الخدمة", desc: "القواعد والإرشادات لاستخدام Ledebe." },
      lastUpdated: "آخر تحديث: أبريل 2026",
      highlight: "باستخدام Ledebe، فإنك توافق على هذه الشروط. يرجى قراءتها — كُتبت بلغة بسيطة ومصممة لتكون عادلة لك ولنا.",
      s1: {
        title: "1. قبول الشروط",
        p1: "بالوصول إلى Ledebe أو استخدامه (تطبيق الويب أو تطبيق سطح المكتب أو امتداد VS Code)، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا لم توافق، فيُرجى عدم استخدام المنتج.",
        p2: "تنطبق هذه الشروط على جميع المستخدمين — الأفراد والفرق والمؤسسات."
      },
      s2: {
        title: "2. ماذا يفعل Ledebe",
        p1: "Ledebe أداة خصوصية تكتشف وتُخفي معلومات التعريف الشخصية (PII) في النصوص والمستندات قبل مشاركتها مع أدوات الذكاء الاصطناعي أو أطراف أخرى. تتم عملية الإخفاء محلياً على جهازك.",
        p2: "Ledebe أداة للمساعدة في الخصوصية — وليس ضماناً لحماية البيانات الكاملة. تبقى مسؤولاً عن مراجعة محتواك قبل المشاركة."
      },
      s3: {
        title: "3. حسابك ومسؤوليتك",
        i1: "أنت مسؤول عن الحفاظ على أمان مفاتيح API المخزنة في Ledebe.",
        i2: "أنت مسؤول عن المحتوى الذي تعالجه عبر Ledebe.",
        i3: "يجب ألا تستخدم Ledebe لأي غرض غير قانوني.",
        i4: "يجب ألا تحاول إجراء هندسة عكسية أو تعديل أو توزيع برنامج Ledebe دون إذن."
      },
      s4: {
        title: "4. الاستخدام المقبول",
        p1: "توافق على عدم استخدام Ledebe من أجل:",
        i1: "معالجة محتوى ينتهك أي قانون أو لائحة معمول بها",
        i2: "محاولة تجاوز أو تجنب أو تعطيل أي ميزات أمان",
        i3: "كشط أو نسخ أو إعادة توزيع برنامج Ledebe أو واجهته",
        i4: "استخدام Ledebe بأي طريقة قد تضر بمستخدمين آخرين أو أطراف ثالثة",
        i5: "انتحال شخصية أي شخص أو منظمة"
      },
      s5: {
        title: "5. المستويات المجانية والمدفوعة",
        p1: "يقدم Ledebe مستوى مجانياً وخطط اشتراك مدفوعة. الميزات المتاحة في كل مستوى موصوفة في صفحة الأسعار.",
        i1: "قد تتغير ميزات المستوى المجاني بمرور الوقت مع إشعار معقول.",
        i2: "تُفوتر الاشتراكات المدفوعة مقدماً على أساس شهري أو سنوي.",
        i3: "نقدم ضمان استرداد لمدة 14 يوماً على جميع الخطط المدفوعة. تواصل مع hello@ledebe.com خلال 14 يوماً من الدفع وسنُصدر استرداداً كاملاً دون أسئلة.",
        i4: "نحتفظ بالحق في تغيير الأسعار بإشعار 30 يوماً للمشتركين الحاليين."
      },
      s6: {
        title: "6. الملكية الفكرية",
        p1: "Ledebe وجميع مكوناته — بما في ذلك البرنامج والتصميم والشعار والتوثيق — مملوكة لـ Ledebe Technologies. لا يجوز لك نسخ أي جزء من Ledebe أو إعادة إنتاجه أو توزيعه دون إذن كتابي.",
        p2: "يبقى محتواك ملكك. باستخدام Ledebe، فإنك لا تمنحنا أي حقوق على محتواك."
      },
      s7: {
        title: "7. خدمات الأطراف الثالثة",
        p1: "يتكامل Ledebe مع مزودي الذكاء الاصطناعي من أطراف ثالثة (OpenAI وAnthropic وGoogle) عبر مفاتيح API الخاصة بك. يخضع استخدامك لهذه الخدمات لشروط الخدمة الخاصة بها. Ledebe ليس مسؤولاً عن سلوك أو توفر أو سياسات هذه الخدمات."
      },
      s8: {
        title: "8. إخلاء المسؤولية عن الضمانات",
        p1: 'يُقدَّم Ledebe "كما هو" دون ضمانات من أي نوع، صريحة أو ضمنية. نحن لا نضمن أن:',
        i1: "Ledebe سيكتشف كل PII في كل قطعة من المحتوى",
        i2: "ستكون الخدمة متواصلة أو خالية من الأخطاء",
        i3: "النتائج ستلبي متطلباتك المحددة",
        p2: "أنت مسؤول عن التحقق من أن Ledebe أخفى جميع البيانات الحساسة بشكل صحيح قبل مشاركة أي محتوى."
      },
      s9: {
        title: "9. تحديد المسؤولية",
        p1: "إلى أقصى حد يسمح به القانون، لا تتحمل Ledebe Technologies المسؤولية عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية ناشئة عن استخدامك لـ Ledebe — بما في ذلك على سبيل المثال لا الحصر، اختراقات البيانات الناتجة عن المحتوى الذي شاركته بعد معالجته عبر Ledebe.",
        p2: "إجمالي مسؤوليتنا تجاهك عن أي مطالبة لن يتجاوز المبلغ الذي دفعته لنا في الأشهر الـ 12 السابقة للمطالبة."
      },
      s10: {
        title: "10. الإنهاء",
        p1: "نحتفظ بالحق في تعليق أو إنهاء الوصول إلى Ledebe للمستخدمين الذين ينتهكون هذه الشروط، مع أو بدون إشعار.",
        p2: "يمكنك التوقف عن استخدام Ledebe في أي وقت. إذا كان لديك اشتراك مدفوع، يمكنك إلغاؤه في أي وقت — يستمر الوصول حتى نهاية فترة الفوترة."
      },
      s11: {
        title: "11. التغييرات على هذه الشروط",
        p1: 'قد نُحدّث شروط الخدمة هذه من وقت لآخر. سنُخطر المستخدمين بالتغييرات الجوهرية بتحديث تاريخ "آخر تحديث" وحسب الاقتضاء عبر البريد الإلكتروني. الاستمرار في استخدام Ledebe بعد التغييرات يُعد قبولاً للشروط المُحدّثة.'
      },
      s12: {
        title: "12. القانون الحاكم",
        p1: "تخضع هذه الشروط لقوانين إنجلترا وويلز. تخضع أي نزاعات للاختصاص الحصري لمحاكم إنجلترا وويلز."
      },
      s13: {
        title: "13. التواصل",
        p1: "للأسئلة حول هذه الشروط:",
        email: "البريد الإلكتروني: <strong>hello@ledebe.com</strong>",
        site: "الموقع: <strong>ledebe.com</strong>"
      }
    }
  },

  zh: {
    nav: { home: "首页", pricing: "价格", docs: "文档", bookDemo: "预约演示" },
    hero: {
      badge: "以隐私为先的AI保护",
      title: '保护您的数据 <span>远离AI风险</span>',
      subtitle: "Ledebe 在数据离开您的设备之前屏蔽电子邮件、电话号码、API密钥和个人数据 — 安全使用 ChatGPT、Claude 和 Copilot。",
      bookDemoBtn: "预约免费演示 →",
      webAppBtn: "试用网页版 →"
    },
    mockup: { yourInput: "您的输入", protectedOutput: "受保护的输出", badge: "🛡️ 已保护3个项目" },
    proof: {
      works: "支持 ChatGPT、Claude 和 Gemini",
      local: "100% 本地处理 — 不向服务器发送数据",
      instant: "即时屏蔽，完全可逆",
      vscode: "VS Code 扩展可用"
    },
    hiw: {
      label: "工作原理", title: "三步实现安全AI使用",
      sub: "无需配置。粘贴、保护、分享 — 几秒钟完成。",
      step1: { title: "粘贴您的文本", desc: "将任何包含敏感信息的文本、文档或代码粘贴到 Ledebe 中。" },
      step2: { title: "Ledebe 进行屏蔽", desc: "所有PII在您的设备上本地替换为 [LDB_EMAIL1] 等占位符 — 什么都不会离开您的设备。" },
      step3: { title: "安全分享", desc: "将受保护的文本复制到任何AI工具。随时一键恢复原始内容。" }
    },
    feat: {
      label: "功能", title: "安全使用AI所需的一切",
      sub: "为个人、开发者和团队打造。",
      auto:       { title: "自动PII检测",     desc: "即时检测并屏蔽电子邮件、电话号码、身份证号、信用卡、API密钥等 — 无需手动选择。" },
      custom:     { title: "自定义词语",       desc: "添加您自己的敏感词 — 公司名称、项目代码、客户名称 — 每次自动屏蔽。" },
      reversible: { title: "完全可逆",         desc: "占位符映射回原始数据。随时恢复完整文本 — 永不丢失。" },
      doc:        { title: "文档上传",         desc: "上传PDF、Word文档、图片和CSV文件。整个文档的PII均被屏蔽，并提供并排预览。" },
      ai:         { title: "AI问答模式",       desc: "使用您自己的API密钥直接将屏蔽后的文本发送给ChatGPT、Claude或Gemini。" },
      highlight:  { title: "高亮保护",         desc: "高亮已发送消息中的任意单词，即时保护或取消保护。更改立即生效。" },
      sync:       { title: "企业同步",         desc: "在整个团队中共享受保护的词语列表。管理员一次更新，立即保护所有人。" },
      ocr:        { title: "图片文字识别",     desc: "自动从图片中提取并保护文字。非常适合扫描文档、截图和照片。" },
      keyboard:   { title: "键盘优先",         desc: "完整键盘导航，⌘K 搜索，⌘⇧N 新建对话，⌘↵ 发送。专为速度设计。" }
    },
    trust: {
      title: "您的数据永远不会离开您的设备",
      desc: "所有PII检测和屏蔽都在本地进行 — 在您的浏览器或桌面应用中。Ledebe没有任何服务器会看到您的内容。",
      li1: "本地处理 — 屏蔽在您的设备上进行，不在我们的服务器上",
      li2: "API密钥仅在本地存储 — 永不上传至Ledebe",
      li3: "聊天历史仅保存在您浏览器的本地存储中",
      li4: "符合GDPR — Ledebe不处理任何个人数据",
      li5: "完全可逆 — 您的原始数据永不被销毁",
      card1: "无服务器端处理",
      card2: "设备上的本地AI检测",
      card3: "完全可逆的屏蔽",
      card4: "符合GDPR设计"
    },
    vscode: {
      title: "🧩 也可作为 VS Code 扩展使用",
      desc: "直接在编辑器中保护代码、配置和日志。右键单击 → 对任何文件进行保护。自动检测 .env、.json 和 .log 文件中的PII。",
      btn: "安装扩展 →"
    },
    pp: {
      label: "价格", title: "免费开始，按需扩展",
      sub: "无隐藏费用。随时取消。核心PII保护永远免费。",
      popular: "最受欢迎",
      personal: { name: "个人版", price: "免费", per: "永久", f1: "无限文本保护", f2: "最多20个自定义词语", f3: "每天3个文件上传", f4: "VS Code 扩展", btn: "立即开始 →" },
      pro:      { name: "专业版", per: "每月", f1: "无限自定义词语", f2: "无限文件上传", f3: "AI对话（自带API密钥）", f4: "优先支持", btn: "获取专业版 →" },
      team:     { name: "商业版", per: "每用户/每月", f1: "全公司词语同步", f2: "管理员控制台", f3: "审计日志", f4: "发票计费", btn: "获取团队版 →" },
      ent:      { name: "企业版", price: "定制", per: "年度合同", f1: "本地部署", f2: "GDPR / HIPAA报告", f3: "99.9%正常运行时间SLA", f4: "专属入职培训", btn: "联系我们 →" },
      seeAll: "查看完整价格和功能对比 →"
    },
    cta: {
      title: "今天开始保护您的数据",
      sub: "免费使用。无需账户。支持 Mac、Windows 和 Linux。",
      bookDemoBtn: "预约免费演示 →"
    },
    footer: {
      tagline: "为所有使用AI的人提供以隐私为先的保护。您的数据始终保留在您的设备上。",
      product: "产品", company: "公司", legal: "法律",
      downloads: "下载", pricing: "价格", documentation: "文档",
      vscodeExt: "VS Code 扩展", webApp: "网页应用",
      about: "关于我们", contact: "联系我们", bookDemo: "预约演示",
      privacy: "隐私政策", terms: "服务条款",
      copyright: "© 2026 Ledebe Technologies. 保留所有权利。"
    },
    pricing: {
      hero: {
        label: "价格",
        title: "简单诚实的定价",
        intro: '免费开始 — 无需信用卡。按需升级。随时取消。所有付费计划均提供 <strong>14天退款保证</strong>。'
      },
      billing: {
        monthly: "月付", annual: "年付", save: "节省20%",
        perMonth: "每月", perYear: "每年",
        perUserMonth: "每用户/每月", perUserYear: "每用户/每年",
        forever: "永久", annualContract: "年度合同",
        minUsers: "最少3个用户"
      },
      featured: "最受欢迎",
      whatsIncluded: "包含的功能",
      everythingInFree: "免费版的所有功能,加上",
      everythingInPro: "专业版的所有功能,加上",
      everythingInTeam: "团队版的所有功能,加上",
      personal: {
        name: "个人版", title: "免费",
        desc: "适合试用或轻度日常使用的个人用户。",
        cta: "免费开始",
        f1: "无限文本保护", f2: "最多20个自定义词语",
        f3: "每天3个文件上传", f4: "最近30个对话",
        f5: "VS Code 扩展", f6: "深色/浅色模式",
        f7: "AI对话（自带密钥）", f8: "无限文件上传",
        f9: "公司同步", f10: "优先支持"
      },
      pro: {
        name: "专业版", title: "Pro",
        desc: "适合需要更多功能的高级用户、自由职业者和专业人士。",
        cta: "立即开始 →",
        annualNote: "比月付节省 £21",
        f1: "无限自定义词语",
        f2: "无限文件上传（每文件50MB）",
        f3: "使用您自己的API密钥进行AI对话",
        f4: "完整对话历史（无限）",
        f5: "导出受保护的文档",
        f6: "优先邮件支持",
        f7: "新功能抢先体验",
        f8: "公司同步", f9: "管理员控制台"
      },
      team: {
        name: "商业版", title: "团队",
        desc: "适合需要共享控制和可见性的中小企业和部门。",
        cta: "立即开始 →",
        annualNote: "每用户比月付节省 £56",
        f1: "公司同步 — 共享词语",
        f2: "管理员控制台和团队管理",
        f3: "集中管理的受保护词语",
        f4: "审计日志",
        f5: "专属客户经理（10+用户）",
        f6: "发票计费可选",
        f7: "SSO — 即将推出"
      },
      ent: {
        name: "企业版", title: "定制",
        desc: "适合大型组织和受监管行业。",
        priceLabel: "定制", cta: "联系我们 →",
        f1: "本地部署选项", f2: "定制集成",
        f3: "正常运行时间SLA（合同条款）",
        f4: "按需提供合规文档",
        f5: "自定义词库",
        f6: "专属入职培训", f7: "批量折扣"
      },
      trust: {
        t1Title: "无需信用卡",          t1Sub: "免费开始,按需升级",
        t2Title: "随时取消",            t2Sub: "无锁定或罚金",
        t3Title: "自由切换计划",        t3Sub: "立即升级或降级",
        t4Title: "包含发票",            t4Sub: "每次付款自动收据",
        t5Title: "通过 Paddle 支付",    t5Sub: "PCI 合规,安全结算"
      },
      faq: {
        title: "常见问题",
        q1: "免费计划真的永久免费吗？",
        a1: "是的。个人计划永久免费 — 无试用期,无需信用卡。核心PII屏蔽将始终免费。",
        q2: '什么算作"文件上传"？',
        a2: "您上传用于PII扫描的任何PDF、Word文档、图片（JPEG/PNG）或CSV。免费用户每天3次上传。专业版及以上有无限上传,每个文件最大50MB。",
        q3: "我需要提供自己的AI API密钥吗？",
        a3: '是的 — 对于AI对话（"问AI"模式）,您提供自己的OpenAI、Anthropic或Gemini API密钥。这使您的受保护数据完全不进入我们的系统。您的密钥本地存储,永不上传至Ledebe。',
        q4: "团队计划如何计费？",
        a4: "团队计划按每月活跃用户计费（最少3个用户）。您可以随时添加或删除席位 — 计费在下个周期自动调整。可按需提供发票计费。",
        q5: "我可以随时更改计划吗？",
        a5: "是的。升级立即生效。降级在当前计费周期结束时生效,您在此期间仍可使用付费功能。",
        q6: "你们接受哪些付款方式？",
        a6: "我们通过付款服务商Paddle接受所有主要信用卡和借记卡（Visa、Mastercard、Amex）。企业客户可通过银行转账或发票付款。",
        q7: "有退款政策吗？",
        a7: "如果您不满意,我们对所有付费计划提供14天退款。联系 hello@ledebe.com,我们将无条件处理。"
      }
    },
    downloads: {
      hero: {
        label: "获取应用",
        title: "下载 Ledebe",
        desc: "免费使用。无需账户。支持 Mac、Windows、Linux — 或直接在浏览器中使用。"
      },
      vscode: {
        title: "VS Code 扩展",
        desc: '在编辑器中直接保护代码、配置和日志。在扩展面板搜索"Ledebe Protector"。',
        btn: "安装扩展 →"
      },
      mac: {
        heading: "macOS",
        siliconTitle: "Apple Silicon (M1、M2、M3)",
        siliconReq: "需要 macOS 11 Big Sur 或更高版本",
        intelTitle: "Intel Mac",
        intelReq: "需要 macOS 10.15 Catalina 或更高版本",
        btnDmg: "下载 .dmg",
        btnZip: "下载 .zip",
        notice: "🍎 <strong>macOS 一次性设置:</strong> 在我们完成 Apple 公证期间,macOS 在首次启动时会显示安全提示。只需右键单击应用图标 → <strong>打开</strong> → <strong>打开</strong>。这只会发生一次 — 这是 App Store 以外分发的新应用的标准步骤。"
      },
      win: {
        heading: "Windows",
        storeTitle: "Microsoft Store",
        storeBadge: "推荐",
        storeReq: "由 Microsoft 签名,自动更新,无安全警告",
        storeBtn: "从 Microsoft Store 获取 →",
        directTitle: "直接安装程序",
        directReq: "兼容 Windows 10 和 Windows 11",
        directBtn: "下载 Setup .exe",
        notice: '⚠️ <strong>SmartScreen 警告</strong>仅适用于直接安装程序。如果您看到"Windows 已保护你的电脑",请单击<strong>更多信息</strong> → <strong>仍要运行</strong>。Microsoft Store 版本由 Microsoft 签名,完全跳过此警告。'
      },
      linux: {
        heading: "Linux",
        appimageTitle: "AppImage (通用)",
        appimageReq: "适用于 Ubuntu 18.04+、Fedora、Debian 和大多数发行版",
        appimageBtn: "下载 .AppImage",
        snapTitle: "Snap 包",
        snapReq: "适用于 Ubuntu 和支持 Snap 的发行版",
        snapBtn: "下载 .snap",
        noticeIntro: "AppImage 设置:",
        noticeStep1: "下载后,在运行前使文件可执行:",
        noticeStep2: "如果无法启动,请安装 libfuse2:"
      }
    },
    demo: {
      hero: {
        label: "现场演示",
        title: "预约免费演示",
        desc: "30 分钟。无义务。准确了解 Ledebe 如何在您的敏感数据到达 AI 之前保护它们。"
      },
      cover: "我们将涵盖的内容",
      points: {
        p1Title: "实时屏蔽演示",
        p1Desc: "在您的内容类型上实时查看 PII 检测和屏蔽。",
        p2Title: "AI 工作流程演练",
        p2Desc: "如何安全地将 Ledebe 与 ChatGPT、Claude 或 Gemini 一起使用。",
        p3Title: "文档保护",
        p3Desc: "上传并扫描 PDF、Word 文档和电子表格中的 PII。",
        p4Title: "团队和企业选项",
        p4Desc: "共享词语库和管理员控制台如何为团队工作。",
        p5Title: "解答您的问题",
        p5Desc: "带上您的具体使用场景 — 我们将向您展示 Ledebe 如何处理它。"
      },
      meta: {
        durationLabel: "时长:", durationVal: "30 分钟",
        formatLabel: "形式:",   formatVal: "视频通话（确认时发送链接）",
        costLabel: "费用:",     costVal: "免费,无义务",
        whoLabel: "适合:",      whoVal: "创始人、IT 负责人、合规官、开发者"
      }
    },
    contact: {
      hero: {
        label: "联系我们",
        title: "联系我们",
        desc: "我们是一个小团队,会阅读每一条消息。通常在 24 小时内回复。"
      },
      responseNotice: "发邮件至 <strong>hello@ledebe.com</strong> — 工作日通常在 24 小时内回复。",
      cards: {
        generalTitle: "一般咨询",   generalDesc: "关于 Ledebe、产品或其工作原理的问题。",
        supportTitle: "支持",       supportDesc: "应用使用问题或需要账户帮助。",
        entTitle: "企业",           entDesc: "对组织的团队或企业计划感兴趣。",
        privTitle: "隐私",          privDesc: "数据隐私请求、GDPR 权利或安全问题。"
      },
      faqPrompt: {
        title: "寻找快速答案？",
        desc: "查看我们的文档 — 大多数常见问题都在那里得到解答。",
        btn: "浏览文档 →"
      }
    },
    about: {
      hero: {
        label: "我们的故事",
        title: "关于 Ledebe",
        desc: "我们构建了我们希望存在的工具 — 一种简单的方法,可以在不暴露敏感数据的情况下使用 AI。"
      },
      why: {
        title: "为什么有 Ledebe",
        p1: "像 ChatGPT、Claude 和 Gemini 这样的 AI 工具正在改变人们的工作方式。但有一个没人充分讨论的问题 — 为了有效地使用这些工具,人们粘贴真实的电子邮件、真实的姓名、真实的电话号码、真实的文档。敏感数据每天离开设备并进入 AI 系统,通常用户没有意识到风险。",
        p2: "Ledebe 的诞生就是为了解决这个问题。它让你自由地使用 AI — 而不会暴露你无权分享的数据。",
        highlight: "核心理念很简单:在敏感部分离开您的设备之前对其进行屏蔽。使用屏蔽版本自由地使用 AI。需要时随时恢复原始内容。"
      },
      what: {
        title: "我们构建什么",
        intro: "Ledebe 是为每天使用 AI 的个人、团队和组织提供的隐私工具套件。",
        p1: "<strong>桌面应用</strong> — 支持 Mac、Windows 和 Linux。离线工作,无需账户。",
        p2: "<strong>VS Code 扩展</strong> — 在编辑器中直接保护代码、配置和日志。",
        p3: "<strong>文件保护</strong> — 上传 PDF、Word 文档和图片,在分享前扫描和屏蔽 PII。"
      },
      principles: {
        title: "我们的原则",
        v1Title: "本地优先",      v1Desc: "所有检测和屏蔽都在您的设备上进行。您的数据永远不会接触我们的服务器。",
        v2Title: "完全可逆",      v2Desc: "屏蔽的数据始终可以恢复。您永远不会被锁定在自己的内容之外。",
        v3Title: "无跟踪",        v3Desc: "我们不收集您保护的内容。永远不会对您的内容进行分析。",
        v4Title: "为所有人构建",  v4Desc: "从独立开发者到企业合规团队 — Ledebe 适合所有人。"
      },
      who: {
        title: "我们是谁",
        p1: "Ledebe 由 Ledebe Technologies 构建 — 一家专注于隐私工具和数据保护产品的软件公司。我们是一个小型、专注的团队,相信隐私应该是默认选项,而不是事后补充。",
        p2: '有问题或想与我们合作？请联系 <strong><a href="mailto:hello@ledebe.com" style="color:var(--primary-blue);">hello@ledebe.com</a></strong>'
      },
      ctaBox: {
        title: "准备好保护您的数据了吗？",
        desc: "免费使用。无需账户。支持 Mac、Windows 和 Linux。",
        bookBtn: "预约免费演示 →"
      }
    },
    docs: {
      hero: { title: "文档", subtitle: "安装和使用 Ledebe Protector 所需的一切" },
      pageTitle: "Ledebe Protector 文档",
      pageLead: "Ledebe Protector 在您与 AI 工具、同事或外部服务共享文本之前,检测并屏蔽个人身份信息 (PII)。您的原始数据永远不会离开您的设备。",
      sidebar: {
        started: "入门",
        overview: "概述", howToUse: "如何使用", requirements: "系统要求",
        install: "安装",
        macSilicon: "macOS (Apple Silicon)", macIntel: "macOS (Intel)", windows: "Windows", linux: "Linux",
        using: "使用 Ledebe",
        protectText: "保护文本", highlightProtect: "高亮保护/取消保护", customTerms: "自定义词语",
        fileUpload: "文件上传", aiChat: "AI 对话", history: "历史和搜索", keyboard: "键盘快捷键",
        extensions: "扩展",
        vscode: "VS Code 扩展",
        help: "帮助",
        faq: "常见问题", troubleshooting: "故障排除"
      },
      overview: {
        title: "概述",
        p1: "Ledebe Protector 通过用安全的占位符替换文本中的敏感信息来工作,让您可以自由地共享或处理文本。您可以随时恢复原始内容。",
        typesIntro: "支持的 PII 类型:"
      },
      howToUse: {
        title: "如何使用 Ledebe",
        subtitle: "Ledebe 新手？按照这些步骤,在一分钟内安全地保护和分享文本。",
        s1Title: "第 1 步 — 输入或粘贴文本",
        s1Body: "打开应用,在主输入区域输入(或粘贴)任何包含敏感信息的文本。它可以是邮件、支持工单、合同摘录 — 任何内容。",
        s1Example: '示例:<em>"您好,我叫 Sarah Jones,邮箱 sarah@company.com,电话是 07911 123456。"</em>',
        s2Title: "第 2 步 — 点击发送/保护",
        s2Body: "点击 <strong>发送</strong> 按钮(或在 Mac 上按 <strong>Ctrl + Enter</strong> / <strong>⌘ Cmd + Enter</strong>)。Ledebe 自动扫描您的文本并用安全占位符替换每个检测到的 PII。",
        s2Example: '结果如下所示:<em>"您好,我叫 [LDB_CUSTOM1],邮箱 [LDB_EMAIL1],电话是 [LDB_PHONE1]。"</em> — 可安全分享到任何地方。",',
        s3Title: "第 3 步 — 切换视图",
        s3Body: "每条消息下方有两个选项卡:<strong>纯文本</strong> — 您的原始未屏蔽文本(仅您可见)。<strong>受保护的文本</strong> — 带占位符的屏蔽版本,可安全复制和分享。",
        s4Title: "第 4 步 — 复制受保护的文本",
        s4Body: "点击消息上的 <strong>📋 复制</strong> 按钮,或按 <strong>Ctrl/⌘ Cmd + Shift + X</strong>,将受保护版本复制到剪贴板。粘贴到 ChatGPT、邮件、支持系统 — 您需要的任何地方。",
        s5Title: "第 5 步 — 恢复原文(可选)",
        s5Body: "如果您收到包含占位符的回复(例如来自 AI 工具),请粘贴回 Ledebe。它会自动将占位符换回真实值,这样您就可以用实际数据阅读回复。",
        s6Title: "第 6 步 — 添加自定义词语(可选)",
        s6Body: "您有想要始终隐藏的特定词语吗 — 例如公司名称、项目代码或客户名称？将它们添加到侧边栏的 <strong>自定义词语</strong> 中。每次都会自动屏蔽。",
        s6Tip: '<strong>快速提示:</strong>输入时,Ledebe 会建议添加自定义词语。如果某词已受保护,会显示绿色 <em>"已受保护"</em> 标签,这样您就不会重复添加同一词语。',
        modeTitle: "在保护和问 AI 之间切换",
        modeIntro: "在屏幕底部,文本框上方,您会看到一个模式切换:",
        modeProtect: "<strong>🛡️ 保护(默认)</strong> — 屏蔽您的文本并向您显示可安全复制的版本。不发送任何内容到任何 AI。当您只想在粘贴到其他地方之前清理文本时使用。",
        modeAsk: "<strong>🤖 问 AI</strong> — 在 PII 已经屏蔽的情况下,将您的消息直接发送到 AI (OpenAI、Anthropic 或 Google)。AI 回复,您会看到 AI 的回复和重新屏蔽的\"可安全分享\"版本。用于完整的私人 AI 对话体验。",
        modeTip: "您可以随时切换模式 — 即使在对话中。模式切换会记住您的最后选择。"
      },
      reqs: {
        title: "系统要求"
      },
      macSilicon: {
        title: "macOS",
        intro: "适用于 M1、M2 和 M3 Mac。下载 <strong>arm64.dmg</strong> 文件。",
        stepsTitle: "安装步骤",
        gateWarning: "<strong>Gatekeeper 警告:</strong> 首次启动时,macOS 可能显示\"无法打开 Ledebe Protector,因为它来自未识别的开发者。\"绕过方法:右键单击应用图标 → 单击 <strong>打开</strong> → 在对话框中单击 <strong>打开</strong>。您只需执行一次。",
        altTip: "或者,前往 <strong>系统设置 → 隐私与安全</strong>,并在 Ledebe Protector 条目旁单击 <strong>仍要打开</strong>。"
      },
      macIntel: {
        title: "macOS",
        intro: "适用于基于 Intel 的 Mac。下载 <strong>x64.dmg</strong> 文件。",
        stepsTitle: "安装步骤",
        gateWarning: "与 Apple Silicon 相同的 Gatekeeper 行为 — 如果 macOS 阻止首次启动,请右键单击 → <strong>打开</strong>。"
      },
      windows: {
        title: "Windows",
        intro: "下载 <strong>Ledebe Protector Setup 1.0.0.exe</strong> NSIS 安装程序。它会创建开始菜单快捷方式、桌面图标和卸载程序。",
        stepsTitle: "安装步骤",
        smartScreen: "<strong>SmartScreen 警告</strong> 对于没有 EV 代码签名证书的新发布应用是正常的。该应用是安全的 — 单击 <strong>更多信息 → 仍要运行</strong> 以继续。",
        uninstall: "卸载:前往 <strong>设置 → 应用</strong>,找到 Ledebe Protector,然后单击 <strong>卸载</strong>。"
      },
      linux: {
        title: "Linux",
        intro: "Ledebe Protector 以通用 <strong>AppImage</strong> 形式提供 — 无需安装。它可以在 Ubuntu、Debian、Fedora、Arch 和大多数其他发行版上运行。",
        stepsTitle: "安装步骤",
        gui: "您也可以在文件管理器中右键单击 AppImage → <strong>属性 → 权限</strong> → 勾选 <strong>\"允许作为程序执行文件\"</strong>,然后双击运行。",
        fuseHelp: "某些发行版需要 <code>libfuse2</code> 来运行 AppImage。如果应用无法启动,请安装它:"
      },
      protectText: {
        title: "保护文本",
        tip: "占位符在会话中是一致的 — 相同的电子邮件始终映射到相同的占位符,因此您的文本结构得以保留。"
      },
      highlightProtect: {
        title: "高亮保护/取消保护",
        intro: "您可以直接从任何已发送的消息中保护或取消保护单个词语 — 无需重新输入任何内容。",
        protectTitle: "保护词语",
        unprotectTitle: "取消保护词语",
        info: "这在聊天消息和文档预览中都有效。更改立即生效 — 无需重新发送消息。"
      },
      customTerms: {
        title: "自定义词语",
        intro: "添加您自己的词语或短语以始终保护 — 姓名、公司名称、项目代码、任何敏感内容。",
        addTitle: "添加词语",
        searchTitle: "搜索您的词语",
        searchIntro: "如果您保存了很多词语,请使用内置搜索快速找到它们。",
        searchTip: '搜索弹窗显示计数,例如 <em>"47 个词语中的 4 个"</em>,这样您始终知道有多少词语与您的查询匹配。'
      },
      fileUpload: {
        title: "文件上传",
        intro: "Ledebe 可以处理整个文档 — 不仅仅是输入的文本。上传文件,它会为您提取、保护并预览内容。",
        uploadTitle: "如何上传",
        supportedTitle: "支持的文件类型",
        previewTitle: "文档预览",
        previewIntro: "上传后,单击文档卡以打开预览模态框。它显示并排的两个视图:",
        previewDownload: "在预览中,您可以 <strong>📥 下载</strong> 受保护版本作为文件。",
        previewHighlight: "您也可以在文档预览中高亮文本以触发 <strong>🛡️ 保护</strong> / <strong>🔓 取消保护</strong> 悬浮按钮,就像在聊天消息中一样。"
      },
      aiChat: {
        title: "AI 对话",
        intro: "切换到 <strong>问 AI</strong> 模式,将问题直接发送给 AI。Ledebe 在发送消息之前屏蔽您的 PII,因此 AI 永远不会看到您的真实数据。",
        setupTitle: "设置",
        keyInfo: "API 密钥仅在本地存储 — 永远不会发送到 Ledebe 服务器。"
      },
      history: {
        title: "历史和搜索",
        intro: "每个对话都会自动保存到您的本地历史记录中。左侧的侧边栏列出所有过去的对话。",
        usingTitle: "使用历史记录",
        searchTitle: "用 ⌘K 搜索历史记录",
        searchIntro: "按 <strong>⌘K</strong>(Mac)或 <strong>Ctrl+K</strong>(Windows)打开命令面板 — 对所有过去对话的快速搜索。",
        searchTip: "您也可以单击侧边栏顶部的 <strong>搜索历史</strong> 按钮以打开相同的面板。"
      },
      keyboard: {
        title: "键盘快捷键",
        intro: "Ledebe 完全可以通过键盘导航。使用这些快捷键更快地工作:",
        colAction: "操作", colMac: "Mac", colWin: "Windows / Linux",
        rSearch: "搜索历史(命令面板)",
        rNew: "新对话",
        rSend: "发送消息",
        rToggle: "切换侧边栏",
        rAll: "显示所有快捷键"
      },
      vscode: {
        title: "VS Code 扩展",
        intro: "Ledebe 还可以作为 <strong>VS Code 扩展</strong>使用 — 专为希望在与 GitHub Copilot 或 ChatGPT 等 AI 工具共享代码、日志或配置文件之前保护敏感数据的开发者构建。",
        installTitle: "安装",
        featuresTitle: "功能",
        shortcutTitle: "键盘快捷键",
        colAction: "操作", colShortcut: "快捷键",
        rProtect: "保护选中的文本",
        tip: "在 VS Code 扩展中添加的自定义词语按 VS Code 配置文件保存 — 与桌面应用的词语列表分开。"
      },
      faq: {
        title: "常见问题",
        q1: "如何取消保护我已经保护的词语？",
        a1: "在任何已发送的消息中高亮该词语。如果它已在您的受保护词语中,悬浮按钮将显示 <strong>🔓 取消保护</strong>(红色)。单击它,该词语将从您的词语中删除,消息会立即更新。",
        q2: "如何搜索我的对话历史？",
        a2: "按 <strong>⌘K</strong>(Mac)或 <strong>Ctrl+K</strong>(Windows)打开命令面板。开始输入以过滤过去的对话,使用箭头键导航,按 Enter 打开一个。按 Esc 关闭。",
        q3: "Ledebe 会将我的数据发送到任何地方吗？",
        a3: "不会。所有 PII 检测和屏蔽都在您的设备上本地进行。唯一的出站流量是当您使用 AI 对话功能时 — 在这种情况下,仅将<em>屏蔽的</em>文本(带占位符,不是您的真实数据)发送到 AI 提供商的 API。",
        q4: "在分享受保护版本后我可以恢复原始文本吗？",
        a4: "可以 — 只要您在同一会话中或占位符映射已保存。将受保护的文本粘贴回 Ledebe 并单击 <strong>恢复</strong>。",
        q5: "我的 API 密钥存储在哪里？",
        a5: "API 密钥仅存储在您设备的本地存储中。它们永远不会上传到 Ledebe 服务器,也不会包含在任何崩溃报告中。",
        q6: "在 Mac 上应用说它来自未识别的开发者 — 安全吗？",
        a6: "是的,它是安全的。出现此警告是因为该应用尚未在 Apple 的公证程序中注册。右键单击应用 → <strong>打开</strong> → <strong>打开</strong> 以绕过它。您只需执行一次。",
        q7: "Windows SmartScreen 阻止了安装程序 — 我该怎么办？",
        a7: "在 SmartScreen 对话框中单击 <strong>更多信息</strong>,然后单击 <strong>仍要运行</strong>。此警告出现在新发布的应用中。安装程序是安全的。",
        q8: "Linux AppImage 无法启动 — 我该怎么办？",
        a8: '确保文件具有执行权限:<code>chmod +x "Ledebe Protector-1.0.0.AppImage"</code>。如果仍然失败,请安装 <code>libfuse2</code>:在 Ubuntu/Debian 上运行 <code>sudo apt install libfuse2</code>。'
      },
      trouble: {
        title: "故障排除",
        crashTitle: "应用启动时崩溃",
        crashBody: "崩溃报告存储在 <code>~/.ledebe-crashes/</code>。如果您需要支持,请在联系我们时附上最新的崩溃日志。",
        piiTitle: "PII 未被检测",
        piiBody: "确保文本格式与受支持的模式匹配。对于不寻常的格式(例如非标准电话格式),将该值添加为 <strong>自定义词语</strong>。",
        aiTitle: "AI 对话无响应",
        darkTitle: "暗模式不保存",
        darkBody: "暗模式偏好存储在本地存储中。清除浏览器缓存(在 Electron 中:<strong>设置 → 清除数据</strong>)将重置它。",
        helpInfo: '需要更多帮助？发邮件至 <a href="mailto:hello@ledebe.com" style="color: var(--primary-blue);">hello@ledebe.com</a> 或访问 <a href="/contact/" style="color: var(--primary-blue);">联系页面</a>。'
      }
    },
    privacy: {
      hero: {
        label: "法律",
        title: "隐私政策",
        desc: "Ledebe 如何处理您的数据 — 以及为什么大部分数据永远不会离开您的设备。"
      },
      lastUpdated: "最后更新:2026 年 4 月",
      highlight: "🛡️ 简短版本:Ledebe 在您的设备上本地屏蔽敏感数据。我们不收集、存储或传输您的个人数据或您保护的内容。您的数据归您所有。",
      s1: {
        title: "1. 我们是谁",
        p1: "Ledebe 是由 Ledebe Technologies 构建的隐私工具。我们的产品帮助个人和组织在与 AI 工具、同事或第三方共享内容之前保护个人身份信息 (PII)。",
        p2: "如果您对本政策有疑问,请通过以下方式联系我们:<strong>hello@ledebe.com</strong>"
      },
      s2: {
        title: "2. 我们收集哪些数据",
        notTitle: "我们不收集的数据",
        not1: "您粘贴到 Ledebe 中的文本",
        not2: "在您的内容中检测到的 PII(姓名、电子邮件、电话号码等)",
        not3: "您的自定义词语列表",
        not4: "您的对话历史",
        not5: "您用于 OpenAI、Anthropic、Google 或任何其他提供商的 API 密钥",
        not6: "您的文档或上传的文件",
        mayTitle: "我们可能收集的数据(匿名)",
        may1: "基本使用分析 — 页面访问、使用了哪些功能(不附带个人数据)",
        may2: "错误报告 — 如果应用崩溃,可能会生成匿名报告以帮助我们修复错误",
        may3: "下载计数 — 桌面应用被下载的次数"
      },
      s3: {
        title: "3. 您的数据存储在哪里",
        p1: "所有 PII 检测和屏蔽都在<strong>您的设备本地</strong>进行 — 在您的浏览器或桌面应用中。在此过程中,没有内容会发送到 Ledebe 服务器。",
        localTitle: "本地存储",
        local1: "<strong>自定义词语</strong> — 存储在您浏览器的 localStorage 或桌面应用的本地存储中。永远不会上传。",
        local2: "<strong>对话历史</strong> — 仅本地存储在您的设备上。",
        local3: "<strong>API 密钥</strong> — 存储在您浏览器的 localStorage 或 VS Code 设置中。永远不会传输到 Ledebe。",
        local4: "<strong>主题/设置偏好</strong> — 本地存储。",
        aiTitle: "当您使用 AI 对话模式时",
        aiBody: "如果您使用 Ledebe 的问 AI 功能,您的屏蔽文本(带有像 [LDB_EMAIL1] 这样的占位符,绝不是您的真实数据)会使用您自己的 API 密钥直接从您的设备发送到您选择的 AI 提供商(OpenAI、Anthropic 或 Google)。Ledebe 不会看到、拦截或存储此通信。"
      },
      s4: {
        title: "4. 第三方服务",
        aws: "<strong>AWS S3</strong> — 托管 Ledebe 网站和桌面应用下载。AWS 的隐私政策适用于托管基础设施。",
        cf: "<strong>Cloudflare</strong> — 为 ledebe.com 提供 DNS、CDN 和 DDoS 保护。Cloudflare 可能记录匿名流量数据。",
        ai: "<strong>OpenAI / Anthropic / Google</strong> — 如果您使用自己的 API 密钥使用 AI 对话模式,您的屏蔽提示会发送给这些提供商。他们各自的隐私政策适用。",
        vsm: "<strong>VS Code Marketplace</strong> — VS Code 扩展通过 Microsoft 的市场分发。Microsoft 的隐私政策适用于下载和安装过程。",
        trail: "Ledebe 不会出于营销目的出售、出租或与任何第三方共享您的数据。"
      },
      s5: {
        title: "5. Cookie",
        p1: "Ledebe 网站使用最少的 cookie:",
        func: "<strong>功能性 cookie</strong> — 记住您的语言偏好和主题设置。",
        noAds: "我们不使用广告 cookie 或跨站点跟踪 cookie。"
      },
      s6: {
        title: "6. 您的权利 (GDPR)",
        p1: "如果您在欧洲经济区 (EEA) 或英国,您拥有以下权利:",
        access: "<strong>访问权</strong> — 请求我们持有的关于您的任何个人数据的副本。",
        erasure: "<strong>删除权</strong> — 请求删除您的个人数据。",
        portability: "<strong>可移植性权</strong> — 以机器可读的格式接收您的数据。",
        object: "<strong>反对权</strong> — 反对处理您的个人数据。",
        rectify: "<strong>更正权</strong> — 请求更正不准确的数据。",
        trail: "由于 Ledebe 几乎不存储任何个人数据,大多数这些权利都会自动得到满足。要行使任何权利,请联系:<strong>hello@ledebe.com</strong>"
      },
      s7: {
        title: "7. 数据安全",
        p1: "我们认真对待安全:",
        https: "网站通过 HTTPS 提供服务。",
        noServer: "没有敏感用户内容会到达我们的服务器。",
        keys: "API 密钥本地存储,永不传输到 Ledebe。",
        review: "我们定期检查我们的基础设施是否存在安全漏洞。"
      },
      s8: {
        title: "8. 儿童隐私",
        p1: "Ledebe 不针对 13 岁以下的儿童。我们不会故意收集儿童的个人信息。如果您认为儿童向我们提供了个人信息,请联系 hello@ledebe.com,我们将删除它。"
      },
      s9: {
        title: "9. 本政策的变更",
        p1: "我们可能会不时更新本隐私政策。我们将通过更新本页面顶部的\"最后更新\"日期来通知用户重大变更。变更后继续使用 Ledebe 即表示接受更新后的政策。"
      },
      s10: {
        title: "10. 联系",
        p1: "如有任何与隐私相关的问题或请求:",
        email: "电子邮件:<strong>hello@ledebe.com</strong>",
        site: "网站:<strong>ledebe.com</strong>"
      }
    },
    terms: {
      hero: { label: "法律", title: "服务条款", desc: "使用 Ledebe 的规则和指南。" },
      lastUpdated: "最后更新:2026 年 4 月",
      highlight: "通过使用 Ledebe,您同意这些条款。请阅读它们 — 它们用通俗易懂的语言书写,旨在对您和我们都公平。",
      s1: {
        title: "1. 条款接受",
        p1: "通过访问或使用 Ledebe(网页应用、桌面应用或 VS Code 扩展),您同意受这些服务条款约束。如果您不同意,请不要使用该产品。",
        p2: "这些条款适用于所有用户 — 个人、团队和组织。"
      },
      s2: {
        title: "2. Ledebe 的功能",
        p1: "Ledebe 是一款隐私工具,在您与 AI 工具或其他方共享之前,检测并屏蔽文本和文档中的个人身份信息 (PII)。屏蔽过程在您的设备本地进行。",
        p2: "Ledebe 是协助保护隐私的工具 — 并非完整数据保护的保证。您仍需负责在分享前审阅您的内容。"
      },
      s3: {
        title: "3. 您的账户和责任",
        i1: "您负责维护存储在 Ledebe 中的 API 密钥的安全。",
        i2: "您负责通过 Ledebe 处理的内容。",
        i3: "您不得将 Ledebe 用于任何非法目的。",
        i4: "您不得尝试对 Ledebe 软件进行逆向工程、修改或分发,除非获得许可。"
      },
      s4: {
        title: "4. 可接受的使用",
        p1: "您同意不将 Ledebe 用于:",
        i1: "处理违反任何适用法律或法规的内容",
        i2: "尝试绕过、规避或禁用任何安全功能",
        i3: "抓取、复制或重新分发 Ledebe 的软件或界面",
        i4: "以任何可能损害其他用户或第三方的方式使用 Ledebe",
        i5: "冒充任何个人或组织"
      },
      s5: {
        title: "5. 免费和付费层级",
        p1: "Ledebe 提供免费层级和付费订阅计划。每个层级可用的功能在我们的定价页面上有描述。",
        i1: "免费层级的功能可能会随着时间的推移在合理通知下发生变化。",
        i2: "付费订阅按月或按年预付。",
        i3: "我们对所有付费计划提供 14 天退款保证。在付款后 14 天内联系 hello@ledebe.com,我们将无条件全额退款。",
        i4: "我们保留向现有订阅者提前 30 天通知后更改定价的权利。"
      },
      s6: {
        title: "6. 知识产权",
        p1: "Ledebe 及其所有组件 — 包括软件、设计、徽标和文档 — 均归 Ledebe Technologies 所有。未经书面许可,您不得复制、再生产或分发 Ledebe 的任何部分。",
        p2: "您的内容仍归您所有。使用 Ledebe 不会授予我们对您内容的任何权利。"
      },
      s7: {
        title: "7. 第三方服务",
        p1: "Ledebe 通过您自己的 API 密钥与第三方 AI 提供商(OpenAI、Anthropic、Google)集成。您对这些服务的使用受其各自服务条款的约束。Ledebe 不对这些第三方服务的行为、可用性或政策负责。"
      },
      s8: {
        title: "8. 免责声明",
        p1: 'Ledebe 按"现状"提供,不提供任何形式的明示或暗示保证。我们不保证:',
        i1: "Ledebe 将检测每段内容中的所有 PII",
        i2: "服务将不间断或没有错误",
        i3: "结果将满足您的具体要求",
        p2: "您有责任在分享任何内容之前验证 Ledebe 已正确屏蔽所有敏感数据。"
      },
      s9: {
        title: "9. 责任限制",
        p1: "在法律允许的最大范围内,Ledebe Technologies 不承担因您使用 Ledebe 而产生的任何间接、附带、特殊、后果性或惩罚性损害的责任 — 包括但不限于通过 Ledebe 处理后您分享的内容导致的数据泄露。",
        p2: "我们对您任何索赔的总责任不超过您在索赔之前 12 个月内支付给我们的金额。"
      },
      s10: {
        title: "10. 终止",
        p1: "我们保留在有或无通知的情况下,暂停或终止违反这些条款的用户访问 Ledebe 的权利。",
        p2: "您可以随时停止使用 Ledebe。如果您有付费订阅,可以随时取消 — 访问将持续到计费周期结束。"
      },
      s11: {
        title: "11. 条款变更",
        p1: '我们可能会不时更新这些服务条款。我们将通过更新"最后更新"日期并在适当时通过电子邮件通知用户重大变更。变更后继续使用 Ledebe 即表示接受更新后的条款。'
      },
      s12: {
        title: "12. 适用法律",
        p1: "这些条款受英格兰和威尔士法律管辖。任何争议应受英格兰和威尔士法院的专属管辖。"
      },
      s13: {
        title: "13. 联系",
        p1: "对于这些条款的问题:",
        email: "电子邮件:<strong>hello@ledebe.com</strong>",
        site: "网站:<strong>ledebe.com</strong>"
      }
    }
  }
};

function detectUserLanguage() {
  const saved = localStorage.getItem('language');
  if (saved) return saved;
  const browserLang = (navigator.language || navigator.languages?.[0] || 'en').split('-')[0].toLowerCase();
  return ['en', 'es', 'fr', 'ar', 'zh'].includes(browserLang) ? browserLang : 'en';
}

let currentLang = detectUserLanguage();

function t(key) {
  const keys = key.split('.');
  let value = translations[currentLang];
  for (const k of keys) value = value?.[k];
  return value !== undefined ? value : key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  updateContent();
  updateActiveButton();
}

function updateActiveButton() {
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`lang-${currentLang}`)?.classList.add('active');
}

function updateContent() {
  // Nav links: Home, Pricing, Docs, Book a Demo
  const navLinks = document.querySelectorAll('.nav-links a');
  if (navLinks[0]) navLinks[0].textContent = t('nav.home');
  if (navLinks[1]) navLinks[1].textContent = t('nav.pricing');
  if (navLinks[2]) navLinks[2].textContent = t('nav.docs');
  if (navLinks[3]) navLinks[3].textContent = t('nav.bookDemo');

  // All data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.dataset.i18n);
    if (val !== el.dataset.i18n) el.textContent = val;
  });

  // All data-i18n-html elements (allow HTML like <span> in headings)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const val = t(el.dataset.i18nHtml);
    if (val !== el.dataset.i18nHtml) el.innerHTML = val;
  });

  // Notify page-specific scripts (e.g. pricing billing toggle) to re-render
  document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: currentLang } }));
}

document.addEventListener('DOMContentLoaded', () => {
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  updateContent();
  updateActiveButton();

  // Nav toggle — aria-aware, replaces inline onclick
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-controls', 'navMenu');
    navMenu.setAttribute('aria-label', 'Site navigation');
    navToggle.addEventListener('click', () => {
      const open = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.textContent = open ? '✕' : '☰';
    });
    // Remove the old inline onclick
    navToggle.removeAttribute('onclick');
  }
});
