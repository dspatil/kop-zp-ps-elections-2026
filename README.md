# Kolhapur ZP & PS Elections 2026

🗳️ **Official Reservation Information Portal** for Zilla Parishad and Panchayat Samiti Elections in Kolhapur District, Maharashtra.

## 🌐 Live Demo
[View Live App](https://kop-elections-2026.dspatil.in)

## ✨ Features

- 📅 **Election Schedule** - View all important dates
- 📋 **Seat Reservations** - Browse 204 seats (68 ZP + 136 PS)
- 🎯 **Eligibility Checker** - Find seats you can contest
- 🔍 **Smart Filters** - Filter by Taluka, Category, Election Type
- 🖨️ **Print Friendly** - Print reservation lists for any taluka
- 🇮🇳 **Bilingual** - English + Marathi (मराठी)
- 📱 **Mobile Optimized** - Fast loading, responsive design
- 📊 **Analytics** - Visitor tracking via Vercel Analytics

## 🚀 Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: CSS Modules
- **Hosting**: Vercel
- **Analytics**: Vercel Analytics

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/dspatil/kop-zp-ps-elections-2026.git
cd kop-zp-ps-elections-2026

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
├── app/
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Root layout with analytics
│   ├── page.module.css   # Styles
│   └── globals.css       # Global styles
├── data/
│   ├── reservations.json # All reservation data
│   └── sample-data.ts    # Data loader
├── scripts/
│   └── convert-json-data.js  # Data conversion script
├── types/
│   └── reservation.ts    # TypeScript types
└── package.json
```

## 📊 Data Sources

Data is sourced from official government notifications:
- **Authority**: State Election Commission, Maharashtra
- **District**: Kolhapur
- **Notification Date**: October 2025

## 🔄 Updating Data

If reservation data needs to be updated:

1. Update the source JSON files:
   - `kolhapur_election_reservation_details_zp.json`
   - `kolhapur_election_reservation_details_ps_chunk1.json`
   - `kolhapur_election_reservation_details_ps_chunk2.json`

2. Run the conversion script:
   ```bash
   npm run convert-data
   ```

3. The app will automatically use the updated `data/reservations.json`

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### Manual
```bash
npm run build
npm run start
```

## ⚠️ Disclaimer

This application displays official reservation information only for reference purposes. Please verify with official government documents before taking any action. No predictions, opinions, or political analysis.

## 📝 License

© 2026 dspatil. All rights reserved.

---

Made with ❤️ for Kolhapur District 🇮🇳
