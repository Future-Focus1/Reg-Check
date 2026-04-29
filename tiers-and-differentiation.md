# RegCheck — Subscription Tiers & Differentiation Strategy

**Date:** 28 April 2026  
**Status:** Proposal

---

## 1. Tier Structure

The killer mistake every competitor makes: hiding finance/write-off behind higher tiers while advertising a low price. We flip this — **all tiers include the critical safety checks**. Higher tiers add intelligence, not gatekeep safety.

### Tier 1: Free
**"Basic Check" — No account needed, instant**

| Feature | Source | Cost |
|---|---|---|
| Vehicle identity (make, model, year, colour, engine, fuel) | DVLA VES API | Free |
| Tax status + VED band | DVLA VES API | Free |
| Current MOT status | DVLA VES API | Free |
| CO2 emissions | DVLA VES API | Free |
| ULEZ / CAZ compliance status | TfL / gov.uk checker | Free |
| Euro emissions standard | DVLA VES API | Free |

**Monetization:** Full-check upsell CTA after results load. "See if this car has hidden finance or is a write-off →"

**Competitive advantage:** Nobody offers ULEZ compliance in a vehicle check. In London (your market), this is a daily concern. Unique free-feature hook.

---

### Tier 2: Standard — £4.99 single / £2.99/check (3-pack)
**"Safety Check" — The honest full check**

| Feature | Source | Cost/check |
|---|---|---|
| Everything in Free tier | — | — |
| **Outstanding finance check** | UKVD VDI / HPI | £1.49-£2.54 |
| **Write-off check (Cat A/B/S/N)** | UKVD VDI / HPI | (included in VDI) |
| **Stolen vehicle check (PNC)** | UKVD VDI / HPI | (included in VDI) |
| **Mileage verification** | DVSA MOT API | Free |
| Full MOT history timeline | DVSA MOT API | Free |
| Previous keeper count | UKVD | £0.04-0.15 |
| **5-year depreciation projection** | Self-calculated from valuation + MarketCheck trends | Free (computed) |
| Vehicle image | UKVD | £0.01-0.02 |
| Data guarantee | Self-backed | £0 |

**All-in cost per check: ~£2.00-£3.00**  
**Margin at £4.99: 40-60%**

**Competitive advantage:** Depreciation projection is unique. Nobody tells you what the car will be worth in 3-5 years. Also, no confusing tiers — this IS the full check. The higher tier adds intelligence, not missing data.

---

### Tier 3: Premium — £9.99 single / £6.99/check (3-pack) / £4.99/month subscription
**"Smart Buy" — Intelligence layer**

Everything in Standard, plus:

| Feature | Source | Cost/check |
|---|---|---|
| **BuyScore™ risk rating** | Proprietary algorithm | Free (computed) |
| **Market valuation (3-band)** | UKVD / Brego | £0.16-0.20 |
| **Price comparison vs. market** | MarketCheck UK | ~£0.10-0.20 |
| **Days-on-market analysis** | MarketCheck UK | (bundled) |
| **Total cost of ownership (5yr)** | UKVD / self-calculated | £0.10-0.15 |
| **Insurance group + est. premium** | UKVD ABI code | £0.04-0.08 |
| **Service, maintenance & repair est.** | HPI SMR data | ~£0.15-0.25 |
| **Future value forecast** | Brego + MarketCheck | £0.16-0.20 |
| **"Is this a good deal?" verdict** | Proprietary algorithm | Free (computed) |
| **Save to Garage** (track up to 10 cars) | Self-hosted | £0 |
| **Price-drop alerts** | MarketCheck | ~£0.05 |

**All-in cost per check: ~£3.00-£4.50**  
**Margin at £9.99: 55-70%**

---

### Tier 4: Pro — £19.99/month subscription
**"Dealer Lite" — For serious buyers & small dealers**

Everything in Premium, plus:

| Feature |
|---|---|
| Unlimited full checks (fair use: 50/month) |
| Bulk VIN/VRM lookup |
| Dealer reputation scores |
| Multi-vehicle comparison tool |
| Export reports as PDF |
| API access (100 calls/month included) |
| White-label reports |
| Priority support |

**This tier targets B2B lite — small dealers who can't afford HPI's enterprise pricing.**

---

## 2. Pricing vs. Competitors (Per Single Check)

| Service | Their Price | Our Price | Our Advantage |
|---|---|---|---|
| HPI Check | £19.99 | £9.99 Premium | 50% cheaper, better UX, depreciation forecast |
| Carpeep | £15.00 | £9.99 Premium | 33% cheaper + ULEZ + depreciation |
| Total Car Check | £9.99 (Gold) | £4.99 Standard | 50% cheaper for same data |
| CarVertical | £33.99 | £9.99 Premium | 70% cheaper for UK cars |
| AA/RAC | £14.99 | £9.99 Premium | 33% cheaper |

---

## 3. Differentiation — APIs & Features Competitors Don't Have

### 3.1 ULEZ / Clean Air Zone Compliance
**What it is:** Tells buyers instantly if the vehicle will incur daily charges in London ULEZ (£12.50/day), Birmingham CAZ (£8/day), and 10+ other UK clean air zones.

**Data source:** TfL vehicle checker API + gov.uk CAZ checker. Can be computed from DVLA Euro status + fuel type + age. No additional API cost.

**Why it matters:** London buyer sees a 2015 diesel — £12.50/day in ULEZ = £4,562/year. That changes the buying decision instantly. Nobody integrates this into a vehicle check.

**Competitor gap:** No major vehicle history service shows this. Buyers have to check separately on TfL's website.

### 3.2 Depreciation Projection
**What it is:** "This £9,000 car will be worth ~£5,400 in 3 years." Year-by-year value curve based on make/model/age/mileage trends.

**Data source:** Self-computed from MarketCheck historical pricing data + UKVD future valuation API + make/model depreciation curves.

**Why it matters:** Depreciation is the single biggest cost of car ownership. Most buyers never think about it. Showing it changes purchase decisions and builds trust.

**Competitor gap:** HPI offers a basic TCO tool (separate product, not integrated). No vehicle check service includes depreciation in the main report.

### 3.3 "Is This a Good Deal?" Verdict
**What it is:** Algorithm compares asking price against:
- Market average for make/model/year/mileage
- Days on market (stale = overpriced)
- MOT history health (failing cars should be cheaper)
- Write-off history discounting
- Regional price variations

Outputs: "This is priced £1,200 above market average. Similar cars sell for £7,800. Consider offering £7,500-8,000."

**Why it matters:** Turns data into action. Competitors dump data; we tell people what to DO.

### 3.4 Personal Garage
**What it is:** Save vehicles you're considering, track price changes, set alerts, compare side-by-side.

**Why it matters:** Creates stickiness. Turns one-off checks into an ongoing relationship. Nobody else does this well.

### 3.5 Future Value Forecasting (EV-specific)
**What it is:** For EVs, predict battery degradation impact on resale value. Show charging cost vs. petrol equivalent.

**Data source:** UKVD battery data API + EV data API + public charging cost data.

**Why it matters:** EV adoption accelerating. Buyers want to know "will this EV still have good range in 5 years and what will it be worth?"

### 3.6 Insurance Group + Estimated Premium
**What it is:** Show the ABI insurance group and an estimated premium range before they buy.

**Data source:** UKVD ABI code lookup (£0.04-0.08). Can cross-reference with average premiums by group/postcode.

**Why it matters:** Insurance is a major running cost. Knowing group 42 vs group 9 before buying changes decisions.

---

## 4. Revenue Projection (Illustrative)

Assumptions:
- 1,000 free checks/day → 5% conversion to Standard → 50 paid checks/day
- 50 Standard checks/day × £4.99 = £249.50/day
- 15 Premium upgrades/day × £5.00 incremental = £75/day
- 10 Pro subscribers × £19.99/month = £199.90/month
- **Monthly revenue (early stage): ~£10,000**
- **Monthly API costs: ~£3,500-4,500**
- **Gross margin: 55-65%**

Scale levers:
- SEO for "free car check" + "ULEZ checker" (high-volume keywords)
- Partner with dealerships for bulk Pro accounts
- White-label for small dealer networks

---

## 5. Unique Selling Points Summary

| What | Why It Wins |
|---|---|
| **ULEZ/CAZ built-in** | Nobody does it. 10M+ Londoners care. |
| **Depreciation forecast** | Shows the hidden cost of ownership |
| **"Should I buy this?" verdict** | Action, not just data |
| **Transparent tiers** | All safety checks in £4.99 tier — no bait-and-switch |
| **Personal Garage** | Sticky feature for repeat visits |
| **Modern mobile UX** | Every competitor is dated |
| **BuyScore™** | Proprietary risk rating — builds brand |

---

## 6. Next Steps

1. ✅ API research complete
2. ✅ Tier structure designed
3. ✅ Differentiation strategy documented
4. ⏳ Register for DVLA + DVSA APIs (free foundation)
5. ⏳ Sign up for UKVD trial (core commercial data)
6. ⏳ Build premium tier features into concept frontend
7. ⏳ Implement Stripe/payment integration
8. ⏳ ULEZ compliance calculator (computed from DVLA data, zero API cost)
