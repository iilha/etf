# Taiwan ETFs

ETF tracker with real-time TWSE data for Taiwan stock exchange-traded funds.

## Features

- **42 Popular Taiwan ETFs** - Comprehensive coverage of Taiwan's most traded ETFs
- **6 Category Filters** - All / Dividend / Broad Market / Sector / Bond / Leveraged
- **Search** - Find ETFs by ticker code or name (English/Chinese)
- **Expandable Detail Cards** - Holdings, returns, risk metrics, sector allocation
- **Live Price Updates** - Real-time price data from TWSE API
- **Bilingual** - Full English and Chinese language support
- **PWA** - Progressive Web App with offline support and installable

## Tech Stack

- **HTML5/CSS3/JavaScript** - All inline, no build system required
- **PWA** - Service Worker caching, Web App Manifest
- **TWSE API** - Real-time ETF data via Cloudflare Worker proxy
- **Responsive Design** - Mobile-first, works on all devices

## Quick Start

```bash
# Start local server
python3 -m http.server 8009

# Open browser
open http://localhost:8009
```

No dependencies, no build process, no npm install.

## File Structure

```
etf/
├── index.html          # Main app (all HTML/CSS/JS inline)
├── manifest.webapp     # PWA manifest
├── sw.js               # Service worker
├── favicon.ico         # Favicon
├── img/                # App icons (32px to 512px)
├── android/            # Android native build
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── java/tw/pwa/etf/MainActivity.java
│   ├── build.gradle
│   ├── settings.gradle
│   └── sync-web.sh     # Sync web assets to Android
└── ios/                # iOS native build
    ├── Etf/
    │   ├── Etf/
    │   │   ├── EtfApp.swift
    │   │   └── Assets.xcassets/
    │   └── Etf.xcodeproj/
    └── sync-web.sh     # Sync web assets to iOS
```

## Native Builds

### Android

Package ID: `tw.pwa.etf`

```bash
cd android
./gradlew assembleRelease
# Output: app/build/outputs/apk/release/etf-1.0.0-1.apk
```

Requirements:
- Android SDK 24+ (Android 7.0)
- Target SDK 35
- Java 17

### iOS

Bundle ID: `tw.pwa.etf`

```bash
cd ios/Etf
open Etf.xcodeproj
# Build in Xcode
```

Requirements:
- iOS 14.0+
- Xcode 14+
- Swift 5.7+

## Testing

```bash
# Web (any local server)
python3 -m http.server 8009
npx serve . -p 8009
php -S localhost:8009

# Android
cd android && ./gradlew installDebug

# iOS
cd ios/Etf && xcodebuild -scheme Etf -destination 'platform=iOS Simulator,name=iPhone 15'
```

## API

**TWSE OpenAPI** (via Cloudflare Worker proxy)

Endpoint: `https://twse-proxy.owen-ouyang.workers.dev/etf-list`

Original: `https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL`

The Cloudflare Worker proxy merges TWSE live price data with static ETF metadata (holdings, expense ratios, benchmarks) and caches responses for performance.

**Data Refresh**
- Live prices: Real-time from TWSE (trading hours)
- Static metadata: Embedded in index.html
- Cache: Service Worker with stale-while-revalidate

## License

MIT
