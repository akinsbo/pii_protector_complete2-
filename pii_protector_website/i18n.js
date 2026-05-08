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
      sub: "Free to use. No account required. Works on Mac, Windows, Linux, and in your browser.",
      bookDemoBtn: "Book a Free Demo →",
      webAppBtn: "Try Web App Free →"
    },
    footer: {
      tagline: "Privacy-first protection for anyone using AI. Your data stays on your device, always.",
      product: "Product", company: "Company", legal: "Legal",
      downloads: "Downloads", pricing: "Pricing", documentation: "Documentation",
      vscodeExt: "VS Code Extension", webApp: "Web App",
      about: "About", contact: "Contact", bookDemo: "Book a Demo",
      privacy: "Privacy Policy", terms: "Terms of Service",
      copyright: "© 2026 Ledebe Technologies. All rights reserved. Built with privacy in mind."
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
      sub: "Gratis. Sin cuenta requerida. Funciona en Mac, Windows, Linux y en tu navegador.",
      bookDemoBtn: "Reservar Demo Gratis →",
      webAppBtn: "Probar Web App Gratis →"
    },
    footer: {
      tagline: "Protección de privacidad para todos los que usan IA. Tus datos se quedan en tu dispositivo, siempre.",
      product: "Producto", company: "Empresa", legal: "Legal",
      downloads: "Descargas", pricing: "Precios", documentation: "Documentación",
      vscodeExt: "Extensión VS Code", webApp: "App Web",
      about: "Acerca de", contact: "Contacto", bookDemo: "Reservar Demo",
      privacy: "Política de Privacidad", terms: "Términos de Servicio",
      copyright: "© 2026 Ledebe Technologies. Todos los derechos reservados."
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
      sub: "Gratuit. Aucun compte requis. Fonctionne sur Mac, Windows, Linux et dans votre navigateur.",
      bookDemoBtn: "Réserver une Démo Gratuite →",
      webAppBtn: "Essayer l'App Web Gratuitement →"
    },
    footer: {
      tagline: "Protection axée sur la vie privée pour tous ceux qui utilisent l'IA. Vos données restent sur votre appareil, toujours.",
      product: "Produit", company: "Entreprise", legal: "Légal",
      downloads: "Téléchargements", pricing: "Tarifs", documentation: "Documentation",
      vscodeExt: "Extension VS Code", webApp: "App Web",
      about: "À propos", contact: "Contact", bookDemo: "Réserver une Démo",
      privacy: "Politique de Confidentialité", terms: "Conditions d'Utilisation",
      copyright: "© 2026 Ledebe Technologies. Tous droits réservés."
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
      sub: "مجاناً. لا حساب مطلوب. يعمل على Mac وWindows وLinux وفي متصفحك.",
      bookDemoBtn: "احجز عرضاً مجانياً ←",
      webAppBtn: "جرّب تطبيق الويب مجاناً ←"
    },
    footer: {
      tagline: "حماية مع الخصوصية أولاً لكل من يستخدم الذكاء الاصطناعي. بياناتك تبقى على جهازك دائماً.",
      product: "المنتج", company: "الشركة", legal: "قانوني",
      downloads: "التنزيلات", pricing: "الأسعار", documentation: "التوثيق",
      vscodeExt: "امتداد VS Code", webApp: "تطبيق الويب",
      about: "عن الشركة", contact: "تواصل معنا", bookDemo: "احجز عرضاً",
      privacy: "سياسة الخصوصية", terms: "شروط الخدمة",
      copyright: "© 2026 Ledebe Technologies. جميع الحقوق محفوظة."
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
      sub: "免费使用。无需账户。支持 Mac、Windows、Linux 及浏览器。",
      bookDemoBtn: "预约免费演示 →",
      webAppBtn: "免费试用网页版 →"
    },
    footer: {
      tagline: "为所有使用AI的人提供以隐私为先的保护。您的数据始终保留在您的设备上。",
      product: "产品", company: "公司", legal: "法律",
      downloads: "下载", pricing: "价格", documentation: "文档",
      vscodeExt: "VS Code 扩展", webApp: "网页应用",
      about: "关于我们", contact: "联系我们", bookDemo: "预约演示",
      privacy: "隐私政策", terms: "服务条款",
      copyright: "© 2026 Ledebe Technologies. 保留所有权利。"
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
