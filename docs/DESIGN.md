# Taiwan ETF Design Document

## Architecture Overview

Taiwan ETF is a Progressive Web App (PWA) that tracks 42 popular Taiwan-listed Exchange-Traded Funds with real-time price data from the Taiwan Stock Exchange (TWSE). Built with vanilla JavaScript and HTML5 (no map component), the app displays ETF cards with current prices, daily changes, volume, and asset information.

The app combines embedded static ETF metadata (names, types, issuers) with live price data fetched from TWSE's OpenAPI via a Cloudflare Worker proxy. It features category filtering, search, expandable detail views, and smart caching for offline access.

## Data Flow

### Data Sources
- **Embedded Static Data**: 42 ETFs hardcoded in JavaScript
  - ETF code (e.g., 0050, 0056), name (Chinese/English)
  - Type: Equity, Bond, Commodity, Leveraged, Inverse
  - Issuer: Yuanta, Cathay, Fubon, etc.
  - Index tracked (e.g., Taiwan 50, MSCI Taiwan)
- **TWSE OpenAPI** (via Cloudflare Worker): `https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL`
  - Real-time prices: closing price, change, change %, volume, open, high, low
  - Worker at `workers/etf-proxy.js` handles CORS and rate limiting
  - Fallback: Demo prices embedded if API unavailable

### Fetch-Render Cycle
1. Page load: Parse embedded `ETF_LIST` array with metadata
2. Fetch live prices from TWSE API via Cloudflare Worker
3. Merge static metadata with live price data by ETF code
4. Render ETF cards with category filters applied
5. Auto-refresh: Fetch new prices every 60 seconds during market hours (9:00-13:30 Taiwan time)
6. After-hours: Refresh paused, show last closing prices

### Price Calculation
- Change: `currentPrice - previousClose`
- Change %: `(change / previousClose) * 100`
- Color coding: Green (positive), Red (negative), Gray (unchanged)

## UI Components

### Navigation Header
- Language toggle button (EN/中文)
- Links to other apps (YouBike, Weather, Stock)
- Active state highlighting

### Filter Bar
- **Category Buttons**: All / Equity / Bond / Commodity / Leveraged / Inverse
- Active category highlighted with blue background
- ETF count badge per category (e.g., "Equity (25)")

### ETF Card Grid
- Responsive grid: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
- Each card shows:
  - ETF code + name (Chinese/English)
  - Current price (NT$)
  - Daily change + change % (color-coded)
  - Volume (formatted: 1.2M, 3.5K)
  - Last update timestamp (relative: "Updated 2 minutes ago")
- Click to expand: shows additional details (open, high, low, issuer, index)

### Search Box
- Text input with fuzzy matching on ETF code/name
- Filters cards in real-time as user types
- Search icon with clear button (X)

### Expandable Details
- Click card to expand inline
- Additional fields: Open, High, Low, Issuer, Index tracked
- Collapse button (↑)

### Market Status Indicator
- Banner at top shows market status: "Market Open" (green) / "Market Closed" (gray)
- During closed hours: "Showing last closing prices"
- Auto-refresh paused when market closed

### Mobile Layout
- Single-column card layout
- Larger touch targets (48px min height)
- Swipe-to-collapse gesture for expanded cards

## Caching Strategy

### Service Worker (`sw.js`)
| Resource Type | Strategy | TTL |
|---------------|----------|-----|
| Static assets (HTML, CSS, JS) | Cache-first | 24 hours |
| TWSE API price data | Stale-while-revalidate | 60 seconds |
| ETF metadata | N/A (embedded) | Permanent |

### Stale-While-Revalidate Logic
1. Check cache first, return cached prices immediately if available
2. Fetch fresh data in background, update cache
3. If cache miss, wait for network response
4. On network failure, serve stale cache (up to 5 minutes old)
5. Show "Offline" indicator when serving stale data

### Demo Data Fallback
- Embedded static prices: last known TWSE prices (updated manually)
- Activated when Cloudflare Worker unavailable or rate-limited
- User sees "Demo Mode" banner: "Prices may not be current"

### Market Hours Detection
- Check Taiwan time (UTC+8): market open 9:00-13:30 weekdays
- Auto-refresh enabled only during market hours
- After-hours: pause refresh, cache lasts until next market open

## Localization

### Language Toggle
- Default: `navigator.language` (zh-TW/zh-CN → Chinese, else English)
- Persistence: `localStorage.setItem('etf-lang', lang)`
- Text elements: `data-en` and `data-zh` attributes
- ETF names: Dual fields in JSON (e.g., `name: '元大台灣50'`, `nameEn: 'Yuanta Taiwan 50'`)
- Currency: Always NT$ (Taiwan standard)

### Bilingual Rendering
```javascript
function renderETFName(etf, lang) {
  return lang === 'zh' ? etf.name : etf.nameEn;
}
```

## Native Wrappers

### Android WebView
- Loads `file:///android_asset/index.html` from APK assets
- WebView settings: JavaScript enabled, DOM storage, hardware acceleration
- JavaScript bridge: `Android.shareETF(code, price)` for native share sheet
- Background sync: Fetch price updates during market hours (WorkManager, every 5 minutes)
- Widget: Home screen widget shows user's watchlist ETFs

### iOS WKWebView
- Loads local HTML via `WKWebView.loadFileURL()` from app bundle
- Configuration: `allowsInlineMediaPlayback`, `allowsBackForwardNavigationGestures`
- Swift bridge: `window.webkit.messageHandlers.shareETF.postMessage(data)`
- Background fetch: BGTaskScheduler for price updates (every 5 minutes during market hours)
- Today Widget: Shows user's watchlist with current prices

### Asset Sync
- CI/CD: GitHub Actions copies web build to native repos on merge
- Git submodule: `ios/ETF/Resources/` and `android/app/src/main/assets/`
- Build script validates TWSE API response parsing and ETF metadata

## State Management

### localStorage Keys
| Key | Purpose | Values |
|-----|---------|--------|
| `etf-lang` | Language preference | `'en'` \| `'zh'` |
| `etf-category` | Selected category filter | `'All'` \| `'Equity'` \| `'Bond'` \| etc. |
| `etf-watchlist` | User's favorite ETFs | JSON array: `['0050', '0056', ...]` |
| `etf-last-prices` | Cached price data | JSON: `{prices, timestamp}` |

### In-Memory State
- `ETF_LIST`: Immutable array of 42 ETFs with metadata (loaded once)
- `priceData`: Current prices from TWSE API
- `filteredETFs`: Subset after category/search filters applied
- `expandedCards`: Set of currently expanded ETF codes
- `refreshTimer`: `setInterval()` ID for 60-second refresh cycle
- `marketOpen`: Boolean indicating if Taiwan market currently open

### State Persistence
- Language, category filter: persisted to localStorage on change
- Watchlist: persisted to localStorage, synced across devices (future: cloud sync)
- Price data: cached by service worker (60-second TTL during market hours)
- Expanded cards: not persisted (ephemeral UI state)

### Cache Invalidation
- Time-based: 60-second TTL during market hours, 24-hour TTL after-hours
- Manual refresh: Pull-to-refresh gesture clears cache, forces fetch
- Market status change: Cache cleared at market open/close transitions
- Version-based: Service worker cache versioned by CACHE_VERSION constant

## Future Plan

### Short-term
- Add ETF comparison tool (side-by-side)
- Implement watchlist with price alerts
- Add dividend calendar (ex-dividend dates)
- Show NAV vs market price premium/discount

### Medium-term
- Portfolio tracker (input holdings, track total value)
- Dividend income simulator
- Sector allocation visualization (pie chart)
- Historical performance charts

### Long-term
- Robo-advisor style ETF recommendations
- Tax optimization suggestions
- Integration with brokerage APIs
- Social features: share portfolio, follow strategies

## TODO

- [ ] Add ETF comparison feature
- [ ] Implement price alert notifications
- [ ] Add dividend calendar view
- [ ] Show intraday price chart
- [ ] Add portfolio tracking
- [ ] Implement historical return charts
- [ ] Add dark mode
