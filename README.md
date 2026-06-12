# QuotePro 🏗️
**Construction Quotation & Estimate Management — PWA**

Win more jobs. Quote in minutes. Works offline.

---

## Features (V1)
- ✅ Client management (add, edit, delete, search)
- ✅ Quotation builder with line items, auto-calculated totals
- ✅ VAT (14%) toggle
- ✅ Quote status workflow: Draft → Sent → Accepted / Rejected
- ✅ Print-ready PDF layout (via browser print)
- ✅ Company details on every quotation
- ✅ English + Sesotho bilingual UI
- ✅ 100% offline — data stored on device (IndexedDB)
- ✅ Installable PWA (works on Android & iOS)
- ✅ Common items autocomplete (cement, bricks, labour, etc.)

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| UI | React 18, Tailwind CSS |
| Storage | IndexedDB via `idb` |
| Offline | Service Worker (cache-first) |
| Install | PWA manifest |
| Print/PDF | Browser `window.print()` |
| Hosting | Vercel or Netlify (free) |

---

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm start

# Open http://localhost:3000
```

### Build for production
```bash
npm run build
# Output in /build folder
```

---

## Deployment (Free)

### Option A: Vercel (Recommended)
1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign up free
3. Click **"New Project"** → Import your GitHub repo
4. Framework: **Create React App** (auto-detected)
5. Click **Deploy**
6. Your app is live at `https://your-project.vercel.app`

**Custom domain:** In Vercel dashboard → Settings → Domains → add `quotepro.co.ls` (or any domain you own)

### Option B: Netlify
1. Run `npm run build`
2. Go to [netlify.com](https://netlify.com) → Sign up free
3. Drag and drop the `/build` folder onto the Netlify dashboard
4. Live instantly at `https://random-name.netlify.app`

### Option C: GitHub Pages
```bash
npm install --save-dev gh-pages
```
Add to package.json:
```json
"homepage": "https://yourusername.github.io/quotepro",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```
Then run:
```bash
npm run deploy
```

---

## Installing the PWA on a Phone

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap the **"Install app"** banner at the bottom, OR
3. Tap the 3-dot menu → **"Add to Home screen"**

### iOS (Safari)
1. Open the app URL in Safari
2. Tap the **Share** button (square with arrow)
3. Tap **"Add to Home Screen"**
4. Tap **"Add"**

The app icon will appear on the home screen like a native app.

---

## Generating PDF Quotations
1. Open a quotation → tap **"Preview & Print"**
2. The browser print dialog opens
3. On Android: tap **"Save as PDF"**
4. On iOS: tap **"Save to Files"** or share to WhatsApp directly
5. On desktop: choose PDF as the printer

---

## App Icons
The app references `icon-192.png` and `icon-512.png` in the `/public` folder.
Generate free icons at: https://favicon.io/favicon-generator/
- Use a hard hat 🏗️ or building icon
- Background: #1a3a2a (dark green)
- Text/icon: white
- Download and place in `/public/`

---

## Project Structure
```
quotepro/
├── public/
│   ├── index.html       # PWA meta tags
│   ├── manifest.json    # PWA install config
│   ├── sw.js            # Service worker (offline)
│   ├── icon-192.png     # App icon (YOU MUST ADD)
│   └── icon-512.png     # App icon (YOU MUST ADD)
├── src/
│   ├── db/index.js      # IndexedDB (clients, quotes, settings)
│   ├── i18n/
│   │   ├── translations.js   # English + Sesotho strings
│   │   └── LangContext.js    # Language hook
│   ├── components/
│   │   ├── UI.jsx       # Button, Input, Card, Modal, etc.
│   │   └── BottomNav.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Clients.jsx
│   │   ├── Quotes.jsx
│   │   ├── QuoteBuilder.jsx  # ← Core feature
│   │   ├── QuoteView.jsx
│   │   ├── QuotePrint.jsx    # Print/PDF layout
│   │   └── Settings.jsx
│   ├── utils/format.js  # Currency, date, calc helpers
│   ├── App.js           # Router
│   └── index.js
├── vercel.json
├── netlify.toml
└── package.json
```

---

## Roadmap (V2 ideas)
- [ ] Convert Quotation → Invoice (one tap)
- [ ] Material price database (save common prices)
- [ ] Labour cost calculator
- [ ] Expense tracking vs quoted amount
- [ ] WhatsApp share button
- [ ] Firebase sync (optional cloud backup)
- [ ] EcoCash / M-Pesa payment tracking

---

## License
MIT — free to use, modify, and deploy commercially.
