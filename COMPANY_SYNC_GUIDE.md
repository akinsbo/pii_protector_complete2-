# Company Terms Sync - Setup Guide

## 🎯 How It Works

**Admin Portal** → Adds protected terms → **Saved to S3** → **Desktop App** syncs every 5 minutes

---

## 📋 Setup Steps

### 1. Admin Creates Company Terms

1. Go to: `http://ledebe.s3-website.us-east-2.amazonaws.com/acme/admin`
2. Add protected terms (e.g., "Project Phoenix", "CEO John Smith")
3. Terms are automatically saved to S3

### 2. Employee Links Desktop App

**Option A: Manual Setup**
```javascript
// In browser console on desktop app:
localStorage.setItem('ledebe-company-id', 'acme');
location.reload();
```

**Option B: Onboarding Page**
1. Open `join-company.html` in browser
2. Enter company code: `acme`
3. Enter work email
4. Click "Join Company"

### 3. Auto-Sync Starts

- Desktop app syncs every 5 minutes
- Also syncs when app window gets focus
- Company terms shown in green box 🔒
- Personal terms still work alongside company terms

---

## 🚀 Deploy for Multiple Companies

### Create New Company Portal

```bash
# 1. Create folder
mkdir -p admin-portal/microsoft/admin

# 2. Copy template
cp admin-portal/acme/admin/index.html admin-portal/microsoft/admin/index.html

# 3. Edit the HTML (change "ACME" to "Microsoft")
sed -i '' 's/ACME Corporation/Microsoft/g' admin-portal/microsoft/admin/index.html

# 4. Deploy to S3
aws s3 cp admin-portal/microsoft/admin/index.html \
  s3://ledebe/microsoft/admin/index.html \
  --region us-east-2 \
  --content-type "text/html"
```

### Access URLs
- ACME: `http://ledebe.s3-website.us-east-2.amazonaws.com/acme/admin`
- Microsoft: `http://ledebe.s3-website.us-east-2.amazonaws.com/microsoft/admin`
- Google: `http://ledebe.s3-website.us-east-2.amazonaws.com/google/admin`

---

## 🔧 Technical Details

### Data Storage Structure
```
s3://ledebe/
├── acme/
│   ├── admin/index.html (admin portal)
│   └── data.json (company terms + employees)
├── microsoft/
│   ├── admin/index.html
│   └── data.json
└── google/
    ├── admin/index.html
    └── data.json
```

### data.json Format
```json
{
  "terms": [
    {
      "id": 1234567890,
      "text": "Project Phoenix",
      "category": "project",
      "createdAt": "2024-02-09T10:00:00Z"
    }
  ],
  "employees": [
    {
      "id": 1234567891,
      "email": "john@acme.com",
      "status": "active",
      "invitedAt": "2024-02-09T10:00:00Z"
    }
  ]
}
```

### Desktop App Sync Flow
```javascript
// 1. App checks company ID
const companyId = localStorage.getItem('ledebe-company-id'); // 'acme'

// 2. Fetches company data
const url = 'https://ledebe.s3.us-east-2.amazonaws.com/acme/data.json';
const data = await fetch(url).then(r => r.json());

// 3. Merges with personal terms
const companyTerms = data.terms.map(t => t.text); // ['Project Phoenix', ...]
const personalTerms = ['My Custom Term', ...];
const allTerms = [...companyTerms, ...personalTerms];

// 4. Uses merged terms for protection
protectText(message, allTerms);
```

---

## 🎨 UI Updates

### Before (Personal Terms Only)
```
┌─────────────────────────┐
│ Custom Terms            │
│ ─────────────────────── │
│ Sandra                  │
│ John                    │
│ TechCorp                │
└─────────────────────────┘
```

### After (Company + Personal)
```
┌─────────────────────────┐
│ 🔒 Company Terms        │
│ (Last sync: 2 min ago)  │
│ ─────────────────────── │
│ Project Phoenix         │
│ CEO John Smith          │
│ Q4 Revenue              │
├─────────────────────────┤
│ My Personal Terms       │
│ ─────────────────────── │
│ Sandra                  │
│ John                    │
└─────────────────────────┘
```

---

## 🔐 Security Notes

- Company terms stored in public S3 (read-only)
- No authentication required for sync (terms are not sensitive)
- Admin portal uses localStorage (upgrade to auth later)
- Employee email stored locally only

---

## 📊 Next Steps

1. **Add Authentication**: Use AWS Cognito or Auth0
2. **Real-time Sync**: Use WebSockets or Server-Sent Events
3. **Audit Logging**: Track who protected what and when
4. **Analytics**: Show usage stats in admin portal
5. **Mobile App**: Sync to iOS/Android apps

---

## 🆘 Troubleshooting

**Terms not syncing?**
- Check company ID: `localStorage.getItem('ledebe-company-id')`
- Check S3 URL: `https://ledebe.s3.us-east-2.amazonaws.com/acme/data.json`
- Check browser console for errors

**Admin portal not saving?**
- Check S3 bucket permissions
- Verify CORS settings on S3 bucket
- Use browser console to debug

**Need to reset?**
```javascript
localStorage.removeItem('ledebe-company-id');
localStorage.removeItem('ledebe-company-terms');
location.reload();
```
