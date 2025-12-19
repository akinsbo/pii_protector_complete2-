# Internationalization Setup Guide

## Overview
Simple i18n system with English (EN) and Spanish (ES) support.

## Files Added
- `i18n.js` - Translation system and content updater
- Language selector buttons in header

## Features
- ✅ Auto-detects browser language
- ✅ Saves language preference in localStorage
- ✅ Instant language switching
- ✅ Complete website translation

## Usage

### Switch Languages
Click EN/ES buttons in header to change language.

### Add New Language
1. Add translations to `i18n.js`:
```javascript
fr: {
  nav: { home: "Accueil", ... },
  // ... other sections
}
```

2. Add language button:
```html
<button onclick="setLanguage('fr')" class="lang-btn">FR</button>
```

### Add New Text
1. Add to translation objects:
```javascript
en: { newSection: { title: "New Title" } }
es: { newSection: { title: "Nuevo Título" } }
```

2. Update in `updateContent()`:
```javascript
document.querySelector('.new-element').textContent = t('newSection.title');
```

## Current Languages
- **EN** - English (default)
- **ES** - Spanish

## Translation Keys Structure
```
nav.* - Navigation menu
hero.* - Hero section
features.* - Features section  
security.* - Security section
download.* - Download section
footer.* - Footer section
```

Ready to use!