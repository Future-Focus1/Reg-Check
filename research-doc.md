# Car Registration & History Check App — Research Document

**Prepared:** 28 April 2026  
**Status:** Initial research — ready for review

---

## 1. Executive Summary

Building a UK vehicle registration / history check app is technically viable and the market has clear gaps. The core data is available through a combination of free government APIs (DVLA, DVSA) and commercial data aggregators. The competitive landscape is crowded but dominated by legacy players with dated UX — opening a real window for a modern, mobile-first product.

**TL;DR:** The APIs exist, the market is large (~7M+ used car transactions/year), the incumbents have weak UX, and you can launch an MVP at relatively low cost using aggregated data APIs rather than going direct to every source.

---

## 2. Data Sources & APIs

### 2.1 Free Government APIs

#### DVLA Vehicle Enquiry Service (VES) API
- **Type:** RESTful, JSON responses
- **Auth:** API key in `x-api-key` header (one key per company)
- **Endpoint:** `POST https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles`
- **Input:** VRM (registration number) in POST body
- **Data returned:** Make, model, colour, engine capacity, fuel type, CO2 emissions, year of manufacture, month of first registration, tax status, tax due date, MOT status, wheelplan, type approval, Euro status, real driving emissions, date of last V5C issued, marked for export, revenue weight
- **Rate limits:** Per-second throttling; returns HTTP 429 when exceeded
- **Test environment:** Available with predefined VRNs
- **Cost:** Free
- **Register at:** https://register-for-ves.driver-vehicle-licensing.api.gov.uk

#### DVSA MOT History API
- **Type:** RESTful, JSON responses
- **Coverage:** Cars/motorcycles/vans (GB: since 2005, NI: since 2017), HGVs/buses (GB: since 2018, NI: since 2017)
- **Data:** MOT test results, pass/fail, advisory notes, mileage at test, test dates, test location
- **Cost:** Free
- **Register at:** https://documentation.history.mot.api.gov.uk/

**Important GDPR note:** Vehicle registration numbers are classified as personal data by the ICO. DVLA requires VRMs to be sent in POST body (not URL params) to prevent logging in web server logs.

### 2.2 Commercial Data Aggregators

#### UK Vehicle Data (UKVD) / Vehicle Data Global
- **Status:** Top-level licensed DVLA data company (on the official gov.uk approved list)
- **Pricing (PAYGO, per-lookup, ex VAT):**

| Data Package | 500 credits | 5,000 | 25,000 | 100,000 | 500,000 |
|---|---|---|---|---|---|
| DVLA Vehicle Data | £0.15 | £0.12 | £0.08 | £0.06 | £0.04 |
| MOT History | £0.07 | £0.05 | £0.04 | £0.02 | £0.02 |
| Vehicle Images | £0.02 | £0.02 | £0.02 | £0.01 | £0.01 |
| Tyre Data | £0.10 | £0.08 | £0.07 | £0.06 | £0.05 |
| Valuations (5-band) | £0.20 | £0.19 | £0.18 | £0.17 | £0.16 |
| **VDI Check® (Finance/Write-off/Stolen)** | **£3.00** | **£2.91** | **£2.76** | **£2.51** | **£2.34** |
| Spec & Options | £0.20 | £0.18 | £0.16 | £0.14 | £0.10 |

- **Subscription pricing** drops VDI Check to £1.49-£2.54 per lookup
- Monthly rolling contracts available (no long-term lock-in)
- 12-month credit validity on PAYGO
- All prices +VAT

#### HPI Vehicle Data API
- **Position:** Premium/enterprise — the market leader since 1938
- **Data available:**
  - Vehicle technical data (make/model/engine/spec/colour/weight)
  - Factory-fitted options (UK's only factory-fit database + list prices)
  - Used car valuations (private sale, trade-in, forecourt, at-new, past/future values)
  - Outstanding finance data (company, agreement type, date, contact details)
  - Insurance write-off data (category ABCDSN + write-off date)
  - Service, maintenance & repair estimates
  - MOT history
  - DVLA data
  - Mileage discrepancies (National Mileage Register)
  - Manufacturer safety recalls (VRM-specific)
  - Plate change history
  - Police stolen records (PNC)
  - Total cost of ownership
  - Euro emissions standard
  - Import/export/scrapped flags
- **Pricing:** Not publicly listed — contact sales. Likely premium per-lookup costs.
- **Pros:** Most comprehensive data; trusted brand; 80+ years of data
- **Cons:** Likely expensive; may require commercial agreement

#### MarketCheck UK
- **Position:** Used car market analytics
- **Data:** 1 billion+ data points across 10,000 dealers, 14,000 locations
- **APIs:** Inventory search, VRM decoding, market activity, dealer profiles, valuation comparables
- **Features:** Listing history (2 years), price changes, days-on-market, market performance analytics
- **Delivery:** REST APIs, bulk SFTP dumps, custom reports
- **Use case:** Valuation intelligence, market pricing, competitive analysis

#### Other Notable API Providers
- **Brego** (£0.16-£0.20/lookup valuations via UKVD) — sub-50ms valuation API
- **One Auto API (Auto Trader)** — retail pricing, predicted days-to-sell from UK's largest marketplace
- **CarAnalytics** — 80+ data point vehicle checks, API available
- **Vehicle Smart** — DVLA + DVSA data API
- **CarDatabases.com** — AI-powered valuations, registration decoding
- **RapidAPI** — Hosts UK vehicle data API (freemium tier available)

---

## 3. Competitive Landscape

### 3.1 UK Consumer Vehicle Check Market (Feb 2026 Pricing)

| Provider | Full Check Price | Multi-Check | Key Differentiator |
|---|---|---|---|
| **Carpeep** | £15.00 | — | Best UX, clean modern reports, £30k guarantee |
| **HPI Check** | £19.99 | £9.99/check | 80-year brand, most trusted, £30k guarantee |
| **AA / RAC** | £14.99 | — | Brand trust, member benefits |
| **CarVertical** | £33.99 | £7.99/check | European data, damage photos, imports |
| **Total Car Check** | £9.99 | Strong bundles | Budget leader, good reviews |
| **CarAnalytics** | £10.99 | £4.99/check | 80+ data points, good value |
| **Full Car Checks** | £9.99 | — | Experian-backed £30k guarantee |
| **CarCheck** | £14.99 | £9.99/check | Established mid-market |
| **Auto Experts** | £10.99 | £5.99/check | Valuation focus |

### 3.2 Competitive Weaknesses (Opportunities)

Across competitor review sites and user feedback, recurring complaints:

1. **Dated, text-heavy reports** — HPI especially criticised for this. Reports dump data rather than surfacing what matters.
2. **Confusing tier structures** — Multiple providers hide finance/write-off data behind higher tiers, misleading on headline price.
3. **Poor mobile experience** — Most are web-only; those with apps are clunky.
4. **Slow report generation** — Some take 30+ seconds.
5. **No smart interpretation** — They tell you what data exists but not what it *means* for the buyer.
6. **Weak valuation integration** — Most separate "check" from "what's it worth?"

### 3.3 Notable New Entrants
- **Carhealth** — AI-powered vehicle history, positioning as modern alternative
- **CarsCheck.uk** — New budget entrant
- **Carpeep** — Gaining traction with clean UX focus

---

## 4. Business Model Options

### 4.1 Consumer Revenue (B2C)
| Model | Typical Price | Notes |
|---|---|---|
| Single full check | £9.99-£19.99 | Standard entry point |
| Multi-check bundles | £4.99-£9.99/check | Higher LTV, lower per-unit margin |
| Premium/deep check | £19.99-£33.99 | Full history + valuation + photos |
| Free basic check | £0 | DVLA-only data, upsell to full check |
| Subscription | £4.99-£9.99/month | Unlimited or X checks/month |

**Unit economics (est. using UKVD pricing):**
- Basic DVLA lookup: **£0.04-£0.15** cost
- Full check (DVLA + MOT + VDI history + valuation): **£3.50-£4.00** cost
- Margin at £9.99 retail: ~60% (excluding platform costs)
- Margin at £14.99 retail: ~73%

### 4.2 B2B API Revenue
- License your aggregated/enriched data to dealers, insurers, finance companies
- Monthly subscription + per-lookup pricing
- White-label solutions for dealerships

### 4.3 Freemium Funnel
Free DVLA + MOT lookup → capture email → upsell full check. This is how Total Car Check and CarCheck built their user bases.

---

## 5. Legal & Regulatory Considerations

### 5.1 GDPR & Data Protection
- VRMs (registration numbers) are **personal data** under UK GDPR (ICO guidance)
- Must have lawful basis for processing (legitimate interest is typical for vehicle checks)
- Need privacy policy covering: what data is collected, why, retention period, third-party sharing
- ICO registration likely required (fee ~£40-£60/year for small orgs)
- DVLA requires POST body transmission of VRMs (not URL params)
- Right of access/deletion requests must be handled

### 5.2 DVLA Licensing
- DVLA VES API: One key per company, free, rate-limited
- DVLA bulk data: Listed companies only (UKVD, HPI, etc. are on the approved list)
- If you want to resell raw DVLA data, you may need to be an approved data company
- Most new entrants avoid this by reselling enriched/aggregated data via commercial APIs

### 5.3 Consumer Protection
- Data guarantees are industry standard (£30k is the benchmark set by HPI)
- Must have terms & conditions limiting liability
- Consider FCA implications if offering finance-related advice

---

## 6. Technical Architecture (Suggested MVP)

### 6.1 Data Flow
```
User enters VRM
    ↓
[Your API Backend]
    ↓
├── DVLA VES API (free) → basic vehicle details
├── DVSA MOT API (free) → MOT history + mileage
├── UKVD/Commercial API → finance, write-off, stolen, valuation
└── Vehicle images (UKVD or similar)
    ↓
Aggregate + format → JSON response
    ↓
[Frontend: Web App / Mobile App]
```

### 6.2 Tech Stack Options
| Layer | Options |
|---|---|
| Frontend | React/Next.js (web), React Native (mobile), or Flutter |
| Backend | Node.js/Express, Python/FastAPI, or Go |
| Database | PostgreSQL (relational data), Redis (caching) |
| Hosting | AWS, Railway, Render, or Hetzner |
| Cache | Cache VRM lookups aggressively — DVLA data doesn't change daily |

### 6.3 Key Architecture Decisions
- **Cache aggressively:** DVLA data changes rarely. Cache VRM responses for 24h+ to reduce API costs.
- **Async for slow data:** Commercial history checks can be slow. Use async processing + push notifications.
- **Cost tracking per lookup:** Essential — track exactly what each check costs across all API calls.
- **Rate limit handling:** DVLA returns 429s. Implement exponential backoff + queue.

---

## 7. Differentiation Opportunities

Based on competitive analysis, here's where a new entrant could win:

### 7.1 UX & Speed
- **Instant results:** Pre-cache common vehicles, parallel API calls
- **Risk-first UI:** Show the critical stuff immediately (finance flag, write-off, stolen) — not buried in a 10-page report
- **Mobile-native:** Not a responsive website pretending to be an app

### 7.2 Smart Features Competitors Lack
- **"Should I buy this?" score** — weighted risk score combining all data points
- **Price vs. market comparison** — is this car over/under-priced based on spec + history?
- **Future value prediction** — depreciation curve based on make/model/mileage/history
- **Insurance group + estimated premium**
- **Running cost calculator** (fuel, tax, insurance, maintenance)

### 7.3 Personal Garage
- Save vehicles you're considering
- Side-by-side comparisons
- Price drop alerts
- MOT renewal reminders

### 7.4 Business Model Innovation
- **Pay-what-you-need tiers** that don't hide critical data behind confusing tiers
- **API-first approach** for B2B from day one
- **"Check before you view"** — scan reg as you arrive at a dealership

---

## 8. Estimated MVP Costs

| Item | Monthly Cost (Est.) |
|---|---|
| DVLA VES API | Free |
| DVSA MOT API | Free |
| UKVD PAYGO credits (500 lookups) | ~£100-200 |
| Backend hosting | £20-50 |
| Domain + DNS | £10 |
| **Total MVP run-rate** | **~£150-300/month** |

Per-check cost at MVP scale: ~£4.00 (all APIs combined)  
Retail price: £9.99-£14.99  
Margin: 60-73% before platform overhead

---

## 9. Risks & Challenges

1. **API dependency risk:** DVLA could change terms, rate limits, or start charging. Build abstraction layer.
2. **HPI dominance:** HPI is "the" brand. Dealers, finance companies, and consumers default to it.
3. **Commoditisation:** Data is the same regardless of provider. Differentiation must come from UX, speed, and added-value features.
4. **GDPR compliance overhead:** Need proper legal review before launch. Don't skip this.
5. **Customer acquisition cost:** SEO is competitive for "car check" keywords. Paid acquisition may be expensive.
6. **Fraud/chargeback risk:** Vehicle checks are one-time purchases. Fraud risk is low, but exists.
7. **Data freshness:** Commercial data updates vary. Finance data can lag. Need to manage expectations.

---

## 10. Next Steps / Open Questions

1. **Which APIs to start with?** DVLA + DVSA (free) + UKVD VDI Check (paid) is the likely starting combo.
2. **Mobile app or web-first?** Mobile app would differentiate, but web MVP is faster to ship.
3. **Name/brand?** Short, memorable, trust-evoking. Something modern vs. the legacy brands.
4. **Legal review:** GDPR compliance, terms & conditions, data guarantee wording.
5. **Market validation:** Talk to 10-20 used car buyers about what they'd pay for and what frustrates them about existing checks.

---

*Sources: DVLA developer portal, DVSA MOT API docs, UKVD/Vehicle Data Global pricing, HPI website, CarAnalytics comparison guide, Carpeep comparison, MarketCheck UK, gov.uk bulk data listings. All pricing as of April 2026.*
