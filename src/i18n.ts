/**
 * @fileoverview Internationalization (i18n) system for Ledebe Protector
 */

export interface I18nStrings {
  // App header
  appTitle: string;
  appSubtitle: string;
  helpBtn: string;
  aiChatBtn: string;
  settingsBtn: string;

  // Welcome guide
  welcomeTitle: string;
  welcomeStep1Title: string;
  welcomeStep1Desc: string;
  welcomeStep2Title: string;
  welcomeStep2Desc: string;
  welcomeStep3Title: string;
  welcomeStep3Desc: string;
  gotItBtn: string;

  // Workflow steps
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;

  // Input placeholders and labels
  inputPlaceholder: string;
  inputPlaceholderSuggestion: string;
  customTermsTitle: string;
  customTermsDesc: string;
  customTermsPlaceholder: string;
  aiResponsePlaceholder: string;
  feedbackPlaceholder: string;

  // Buttons
  protectBtn: string;
  addCustomTermsBtn: string;
  hideCustomTermsBtn: string;
  useWithAiBtn: string;
  shareExternalBtn: string;
  startOverBtn: string;
  restoreBtn: string;
  copyBtn: string;
  sendBtn: string;
  dictateBtn: string;
  stopDictationBtn: string;

  // Results
  safeToUseTitle: string;
  restoredTitle: string;
  protectedStatus: string;
  noSensitiveInfo: string;

  // External AI sharing
  shareModalTitle: string;
  shareInstructions: string;
  shareStep1: string;
  shareStep2: string;
  shareStep3: string;
  shareStep4: string;
  universalCopyTitle: string;
  shareFooter: string;

  // AI services
  chatgptName: string;
  chatgptDesc: string;
  geminiName: string;
  geminiDesc: string;
  claudeName: string;
  claudeDesc: string;
  copilotName: string;
  copilotDesc: string;
  perplexityName: string;
  perplexityDesc: string;
  otherAiName: string;
  otherAiDesc: string;
  freeAccess: string;
  freeMicrosoft: string;

  // Dictation
  dictationSupported: string;
  dictationNotSupported: string;
  dictationListening: string;
  dictationError: string;
  dictationPermissionDenied: string;

  // Notifications
  protectedSuccess: string;
  restoredSuccess: string;
  copiedSuccess: string;
  feedbackSuccess: string;
  errorGeneric: string;
}

const translations: Record<string, I18nStrings> = {
  en: {
    // App header
    appTitle: "Ledebe Protector",
    appSubtitle: "Keep your personal info safe when using AI",
    helpBtn: "❓ Help",
    aiChatBtn: "🤖 AI Chat",
    settingsBtn: "⚙️",

    // Welcome guide
    welcomeTitle: "🛡️ Welcome! Here's how to protect your personal info:",
    welcomeStep1Title: "Type your message",
    welcomeStep1Desc: "Paste any text that contains personal info like names, emails, or phone numbers",
    welcomeStep2Title: "Click \"Protect My Info\"",
    welcomeStep2Desc: "We'll automatically hide your personal details with safe placeholders",
    welcomeStep3Title: "Use the protected text safely",
    welcomeStep3Desc: "Copy the protected version to use with AI tools, then restore it back when needed",
    gotItBtn: "Got it! Let's start →",

    // Workflow steps
    step1Title: "Enter Your Text",
    step1Desc: "Paste any text that might contain personal information",
    step2Title: "Your Protected Text",
    step2Desc: "Personal info has been safely hidden with placeholders",
    step3Title: "Restore Original Text",
    step3Desc: "Paste AI response here to restore your personal info",

    // Input placeholders and labels
    inputPlaceholder: "Type or paste your text here...",
    inputPlaceholderSuggestion: "✨ Try typing: \"Hi, I'm John Smith. My email is john@company.com and my phone is +1-555-123-4567. I work at TechCorp on Project Alpha.\"",
    customTermsTitle: "Custom Terms to Protect",
    customTermsDesc: "Add company names, project codes, or other sensitive terms (one per line)",
    customTermsPlaceholder: "company-name\nproject-alpha\nsecret-key-2024",
    aiResponsePlaceholder: "Paste the AI's response here to restore your personal information...",
    feedbackPlaceholder: "💬 How can we improve? Your feedback helps!",

    // Buttons
    protectBtn: "🛡️ Protect My Info",
    addCustomTermsBtn: "+ Add Custom Terms to Protect",
    hideCustomTermsBtn: "- Hide Custom Terms",
    useWithAiBtn: "🤖 Use with AI Chat",
    shareExternalBtn: "🌐 Share with External AI",
    startOverBtn: "↺ Protect Different Text",
    restoreBtn: "🔄 Restore Personal Info",
    copyBtn: "📋 Copy",
    sendBtn: "Send",
    dictateBtn: "🎤 Dictate",
    stopDictationBtn: "⏹️ Stop",

    // Results
    safeToUseTitle: "✅ Safe to Use Anywhere",
    restoredTitle: "✨ Restored with Your Personal Info",
    protectedStatus: "🛡️ Protected {count} sensitive item{plural}",
    noSensitiveInfo: "✅ No sensitive info detected",

    // External AI sharing
    shareModalTitle: "🌐 Share with External AI Services",
    shareInstructions: "📝 Quick Instructions:",
    shareStep1: "Click any AI service below to open it in a new tab",
    shareStep2: "Your protected text is automatically copied to clipboard",
    shareStep3: "Paste it into the AI chat and get your response",
    shareStep4: "Copy the AI's response back to restore your personal info",
    universalCopyTitle: "📋 Universal Copy Format",
    shareFooter: "🔒 Your personal information is safely hidden in the text above",

    // AI services
    chatgptName: "ChatGPT",
    chatgptDesc: "OpenAI's conversational AI",
    geminiName: "Gemini",
    geminiDesc: "Google's AI assistant",
    claudeName: "Claude",
    claudeDesc: "Anthropic's AI assistant",
    copilotName: "Copilot",
    copilotDesc: "Microsoft's AI assistant",
    perplexityName: "Perplexity",
    perplexityDesc: "AI-powered search",
    otherAiName: "Other AI",
    otherAiDesc: "Any other AI service",
    freeAccess: "Free tier available",
    freeMicrosoft: "Free with Microsoft account",

    // Dictation
    dictationSupported: "🎤 Voice input available",
    dictationNotSupported: "🎤 Voice input not supported in this browser",
    dictationListening: "🎤 Listening... Speak now",
    dictationError: "Voice input error. Please try again.",
    dictationPermissionDenied: "Microphone permission denied. Please enable in browser settings.",

    // Notifications
    protectedSuccess: "Protected {count} sensitive item{plural}! Safe to use with AI.",
    restoredSuccess: "Personal information restored successfully!",
    copiedSuccess: "Copied to clipboard!",
    feedbackSuccess: "Thank you for your feedback!",
    errorGeneric: "An error occurred. Please try again."
  },

  es: {
    // App header
    appTitle: "Protector Ledebe",
    appSubtitle: "Mantén tu información personal segura al usar IA",
    helpBtn: "❓ Ayuda",
    aiChatBtn: "🤖 Chat IA",
    settingsBtn: "⚙️",

    // Welcome guide
    welcomeTitle: "🛡️ ¡Bienvenido! Así es como proteger tu información personal:",
    welcomeStep1Title: "Escribe tu mensaje",
    welcomeStep1Desc: "Pega cualquier texto que contenga información personal como nombres, emails o números de teléfono",
    welcomeStep2Title: "Haz clic en \"Proteger Mi Info\"",
    welcomeStep2Desc: "Ocultaremos automáticamente tus datos personales con marcadores seguros",
    welcomeStep3Title: "Usa el texto protegido de forma segura",
    welcomeStep3Desc: "Copia la versión protegida para usar con herramientas de IA, luego restáurala cuando sea necesario",
    gotItBtn: "¡Entendido! Empecemos →",

    // Workflow steps
    step1Title: "Ingresa Tu Texto",
    step1Desc: "Pega cualquier texto que pueda contener información personal",
    step2Title: "Tu Texto Protegido",
    step2Desc: "La información personal ha sido ocultada de forma segura con marcadores",
    step3Title: "Restaurar Texto Original",
    step3Desc: "Pega la respuesta de la IA aquí para restaurar tu información personal",

    // Input placeholders and labels
    inputPlaceholder: "Escribe o pega tu texto aquí...",
    inputPlaceholderSuggestion: "✨ Prueba escribiendo: \"Hola, soy Juan Pérez. Mi email es juan@empresa.com y mi teléfono es +34-666-123-456. Trabajo en TechCorp en el Proyecto Alpha.\"",
    customTermsTitle: "Términos Personalizados a Proteger",
    customTermsDesc: "Agrega nombres de empresas, códigos de proyecto u otros términos sensibles (uno por línea)",
    customTermsPlaceholder: "nombre-empresa\nproyecto-alpha\nclave-secreta-2024",
    aiResponsePlaceholder: "Pega la respuesta de la IA aquí para restaurar tu información personal...",
    feedbackPlaceholder: "💬 ¿Cómo podemos mejorar? ¡Tus comentarios ayudan!",

    // Buttons
    protectBtn: "🛡️ Proteger Mi Info",
    addCustomTermsBtn: "+ Agregar Términos Personalizados",
    hideCustomTermsBtn: "- Ocultar Términos Personalizados",
    useWithAiBtn: "🤖 Usar con Chat IA",
    shareExternalBtn: "🌐 Compartir con IA Externa",
    startOverBtn: "↺ Proteger Texto Diferente",
    restoreBtn: "🔄 Restaurar Info Personal",
    copyBtn: "📋 Copiar",
    sendBtn: "Enviar",
    dictateBtn: "🎤 Dictar",
    stopDictationBtn: "⏹️ Parar",

    // Results
    safeToUseTitle: "✅ Seguro para Usar en Cualquier Lugar",
    restoredTitle: "✨ Restaurado con Tu Información Personal",
    protectedStatus: "🛡️ Protegido{plural} {count} elemento{plural} sensible{plural}",
    noSensitiveInfo: "✅ No se detectó información sensible",

    // External AI sharing
    shareModalTitle: "🌐 Compartir con Servicios de IA Externa",
    shareInstructions: "📝 Instrucciones Rápidas:",
    shareStep1: "Haz clic en cualquier servicio de IA para abrirlo en una nueva pestaña",
    shareStep2: "Tu texto protegido se copia automáticamente al portapapeles",
    shareStep3: "Pégalo en el chat de IA y obtén tu respuesta",
    shareStep4: "Copia la respuesta de la IA de vuelta para restaurar tu información personal",
    universalCopyTitle: "📋 Formato de Copia Universal",
    shareFooter: "🔒 Tu información personal está oculta de forma segura en el texto de arriba",

    // AI services
    chatgptName: "ChatGPT",
    chatgptDesc: "IA conversacional de OpenAI",
    geminiName: "Gemini",
    geminiDesc: "Asistente de IA de Google",
    claudeName: "Claude",
    claudeDesc: "Asistente de IA de Anthropic",
    copilotName: "Copilot",
    copilotDesc: "Asistente de IA de Microsoft",
    perplexityName: "Perplexity",
    perplexityDesc: "Búsqueda potenciada por IA",
    otherAiName: "Otra IA",
    otherAiDesc: "Cualquier otro servicio de IA",
    freeAccess: "Nivel gratuito disponible",
    freeMicrosoft: "Gratis con cuenta Microsoft",

    // Dictation
    dictationSupported: "🎤 Entrada de voz disponible",
    dictationNotSupported: "🎤 Entrada de voz no compatible en este navegador",
    dictationListening: "🎤 Escuchando... Habla ahora",
    dictationError: "Error de entrada de voz. Inténtalo de nuevo.",
    dictationPermissionDenied: "Permiso de micrófono denegado. Habilítalo en la configuración del navegador.",

    // Notifications
    protectedSuccess: "¡Protegido{plural} {count} elemento{plural} sensible{plural}! Seguro para usar con IA.",
    restoredSuccess: "¡Información personal restaurada exitosamente!",
    copiedSuccess: "¡Copiado al portapapeles!",
    feedbackSuccess: "¡Gracias por tus comentarios!",
    errorGeneric: "Ocurrió un error. Inténtalo de nuevo."
  },

  fr: {
    // App header
    appTitle: "Protecteur Ledebe",
    appSubtitle: "Gardez vos informations personnelles en sécurité lors de l'utilisation de l'IA",
    helpBtn: "❓ Aide",
    aiChatBtn: "🤖 Chat IA",
    settingsBtn: "⚙️",

    // Welcome guide
    welcomeTitle: "🛡️ Bienvenue ! Voici comment protéger vos informations personnelles :",
    welcomeStep1Title: "Tapez votre message",
    welcomeStep1Desc: "Collez n'importe quel texte contenant des informations personnelles comme des noms, emails ou numéros de téléphone",
    welcomeStep2Title: "Cliquez sur \"Protéger Mes Infos\"",
    welcomeStep2Desc: "Nous cacherons automatiquement vos détails personnels avec des marqueurs sécurisés",
    welcomeStep3Title: "Utilisez le texte protégé en toute sécurité",
    welcomeStep3Desc: "Copiez la version protégée pour l'utiliser avec les outils IA, puis restaurez-la quand nécessaire",
    gotItBtn: "Compris ! Commençons →",

    // Workflow steps
    step1Title: "Entrez Votre Texte",
    step1Desc: "Collez n'importe quel texte pouvant contenir des informations personnelles",
    step2Title: "Votre Texte Protégé",
    step2Desc: "Les informations personnelles ont été cachées en toute sécurité avec des marqueurs",
    step3Title: "Restaurer le Texte Original",
    step3Desc: "Collez la réponse de l'IA ici pour restaurer vos informations personnelles",

    // Input placeholders and labels
    inputPlaceholder: "Tapez ou collez votre texte ici...",
    inputPlaceholderSuggestion: "✨ Essayez de taper : \"Salut, je suis Jean Dupont. Mon email est jean@entreprise.com et mon téléphone est +33-1-23-45-67-89. Je travaille chez TechCorp sur le Projet Alpha.\"",
    customTermsTitle: "Termes Personnalisés à Protéger",
    customTermsDesc: "Ajoutez des noms d'entreprises, codes de projet ou autres termes sensibles (un par ligne)",
    customTermsPlaceholder: "nom-entreprise\nprojet-alpha\ncle-secrete-2024",
    aiResponsePlaceholder: "Collez la réponse de l'IA ici pour restaurer vos informations personnelles...",
    feedbackPlaceholder: "💬 Comment pouvons-nous améliorer ? Vos commentaires aident !",

    // Buttons
    protectBtn: "🛡️ Protéger Mes Infos",
    addCustomTermsBtn: "+ Ajouter Termes Personnalisés",
    hideCustomTermsBtn: "- Masquer Termes Personnalisés",
    useWithAiBtn: "🤖 Utiliser avec Chat IA",
    shareExternalBtn: "🌐 Partager avec IA Externe",
    startOverBtn: "↺ Protéger Texte Différent",
    restoreBtn: "🔄 Restaurer Infos Personnelles",
    copyBtn: "📋 Copier",
    sendBtn: "Envoyer",
    dictateBtn: "🎤 Dicter",
    stopDictationBtn: "⏹️ Arrêter",

    // Results
    safeToUseTitle: "✅ Sûr à Utiliser Partout",
    restoredTitle: "✨ Restauré avec Vos Informations Personnelles",
    protectedStatus: "🛡️ Protégé {count} élément{plural} sensible{plural}",
    noSensitiveInfo: "✅ Aucune information sensible détectée",

    // External AI sharing
    shareModalTitle: "🌐 Partager avec Services IA Externes",
    shareInstructions: "📝 Instructions Rapides :",
    shareStep1: "Cliquez sur n'importe quel service IA pour l'ouvrir dans un nouvel onglet",
    shareStep2: "Votre texte protégé est automatiquement copié dans le presse-papiers",
    shareStep3: "Collez-le dans le chat IA et obtenez votre réponse",
    shareStep4: "Copiez la réponse de l'IA pour restaurer vos informations personnelles",
    universalCopyTitle: "📋 Format de Copie Universel",
    shareFooter: "🔒 Vos informations personnelles sont cachées en toute sécurité dans le texte ci-dessus",

    // AI services
    chatgptName: "ChatGPT",
    chatgptDesc: "IA conversationnelle d'OpenAI",
    geminiName: "Gemini",
    geminiDesc: "Assistant IA de Google",
    claudeName: "Claude",
    claudeDesc: "Assistant IA d'Anthropic",
    copilotName: "Copilot",
    copilotDesc: "Assistant IA de Microsoft",
    perplexityName: "Perplexity",
    perplexityDesc: "Recherche alimentée par IA",
    otherAiName: "Autre IA",
    otherAiDesc: "Tout autre service IA",
    freeAccess: "Niveau gratuit disponible",
    freeMicrosoft: "Gratuit avec compte Microsoft",

    // Dictation
    dictationSupported: "🎤 Saisie vocale disponible",
    dictationNotSupported: "🎤 Saisie vocale non prise en charge dans ce navigateur",
    dictationListening: "🎤 Écoute... Parlez maintenant",
    dictationError: "Erreur de saisie vocale. Veuillez réessayer.",
    dictationPermissionDenied: "Permission du microphone refusée. Veuillez l'activer dans les paramètres du navigateur.",

    // Notifications
    protectedSuccess: "Protégé {count} élément{plural} sensible{plural} ! Sûr à utiliser avec l'IA.",
    restoredSuccess: "Informations personnelles restaurées avec succès !",
    copiedSuccess: "Copié dans le presse-papiers !",
    feedbackSuccess: "Merci pour vos commentaires !",
    errorGeneric: "Une erreur s'est produite. Veuillez réessayer."
  }
};

export class I18n {
  private currentLanguage: string = 'en';
  private strings: I18nStrings;

  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.strings = translations[this.currentLanguage] || translations.en;
  }

  private detectLanguage(): string {
    // Check localStorage first
    const saved = localStorage.getItem('ledebe-language');
    if (saved && translations[saved]) {
      return saved;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (translations[browserLang]) {
      return browserLang;
    }

    return 'en'; // fallback
  }

  setLanguage(lang: string): void {
    if (translations[lang]) {
      this.currentLanguage = lang;
      this.strings = translations[lang];
      localStorage.setItem('ledebe-language', lang);
      this.updateUI();
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  t(key: keyof I18nStrings, params?: Record<string, string | number>): string {
    let text = this.strings[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        const regex = new RegExp(`\\{${param}\\}`, 'g');
        text = text.replace(regex, String(value));
      });
    }

    return text;
  }

  private updateUI(): void {
    // Update all elements with data-i18n attributes
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n') as keyof I18nStrings;
      if (key && this.strings[key]) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          (element as HTMLInputElement).placeholder = this.strings[key];
        } else {
          element.textContent = this.strings[key];
        }
      }
    });

    // Trigger custom event for components that need manual updates
    window.dispatchEvent(new CustomEvent('language-changed', { 
      detail: { language: this.currentLanguage } 
    }));
  }

  getAvailableLanguages(): Array<{code: string, name: string}> {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' }
    ];
  }
}

export const i18n = new I18n();