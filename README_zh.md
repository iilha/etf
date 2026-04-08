[English](README.md) | 繁體中文

# Taiwan ETFs

台灣證券交易所 ETF 即時追蹤工具，提供台灣股票型基金的即時數據。

## 功能特色

- **42 支熱門台灣 ETF** - 全面涵蓋台灣最活躍交易的 ETF
- **6 種分類篩選** - 全部 / 高股息 / 大盤 / 產業 / 債券 / 槓桿
- **搜尋功能** - 依代碼或名稱搜尋 ETF（中英文皆可）
- **可展開的詳細資訊卡** - 持股內容、報酬率、風險指標、產業配置
- **即時價格更新** - 來自 TWSE API 的即時價格資料
- **雙語介面** - 完整支援中英文切換
- **PWA 應用程式** - 漸進式網頁應用，支援離線瀏覽與安裝

## 技術架構

- **HTML5/CSS3/JavaScript** - 所有程式碼內嵌，無需建置系統
- **PWA** - Service Worker 快取、Web App Manifest
- **TWSE API** - 透過 Cloudflare Worker proxy 取得即時 ETF 資料
- **響應式設計** - 行動優先，適用於所有裝置

## 快速開始

```bash
# 啟動本地伺服器
python3 -m http.server 8009

# 開啟瀏覽器
open http://localhost:8009
```

無相依套件、無建置流程、無需 npm install。

## 檔案結構

```
etf/
├── index.html          # 主應用程式（所有 HTML/CSS/JS 皆內嵌）
├── manifest.webapp     # PWA manifest
├── sw.js               # Service worker
├── favicon.ico         # Favicon
├── img/                # 應用程式圖示（32px 到 512px）
├── android/            # Android 原生建置
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── java/tw/pwa/etf/MainActivity.java
│   ├── build.gradle
│   ├── settings.gradle
│   └── sync-web.sh     # 同步網頁資源到 Android
└── ios/                # iOS 原生建置
    ├── Etf/
    │   ├── Etf/
    │   │   ├── EtfApp.swift
    │   │   └── Assets.xcassets/
    │   └── Etf.xcodeproj/
    └── sync-web.sh     # 同步網頁資源到 iOS
```

## 原生應用程式建置

### Android

Package ID: `tw.pwa.etf`

```bash
cd android
./gradlew assembleRelease
# 輸出：app/build/outputs/apk/release/etf-1.0.0-1.apk
```

需求：
- Android SDK 24+ (Android 7.0)
- Target SDK 35
- Java 17

### iOS

Bundle ID: `tw.pwa.etf`

```bash
cd ios/Etf
open Etf.xcodeproj
# 在 Xcode 中建置
```

需求：
- iOS 14.0+
- Xcode 14+
- Swift 5.7+

## 測試

```bash
# Web（任何本地伺服器皆可）
python3 -m http.server 8009
npx serve . -p 8009
php -S localhost:8009

# Android
cd android && ./gradlew installDebug

# iOS
cd ios/Etf && xcodebuild -scheme Etf -destination 'platform=iOS Simulator,name=iPhone 15'
```

## API

**TWSE OpenAPI**（透過 Cloudflare Worker proxy）

端點：`https://twse-proxy.owen-ouyang.workers.dev/etf-list`

原始來源：`https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL`

Cloudflare Worker proxy 會將 TWSE 即時價格資料與靜態 ETF 元資料（持股、管理費用率、追蹤指數）合併，並快取回應以提升效能。

**資料更新**
- 即時價格：來自 TWSE 的即時資料（交易時段）
- 靜態元資料：內嵌於 index.html
- 快取：Service Worker 搭配 stale-while-revalidate 策略

## 授權

MIT
