# Ledebe — Revenue & Costs

## Current Monthly Costs (Estimated)

| Item | Cost/month |
|---|---|
| AWS S3 storage (~1.7GB) | ~£0.04 |
| AWS S3 data transfer (website) | ~£0.50 |
| AWS S3 downloads (per 100 downloads) | ~£0.77 |
| name.com domain (ledebe.com) | ~£1.00 (£12/yr) |
| **Total (no downloads)** | **~£1.54/mo** |
| **Total (100 downloads/mo)** | **~£2.31/mo** |

Once Cloudflare is set up — download costs drop to £0.

---

## Cost as You Scale

| Monthly downloads | AWS cost | Cloudflare cost |
|---|---|---|
| 100 | £0.77 | £0 |
| 1,000 | £7.65 | £0 |
| 10,000 | £76.50 | £0 |

**Cloudflare is essential once you have real users downloading.**

---

## Revenue Model

### Payment processor: Stripe
- 1.5% + 20p per transaction (European cards)
- Simple integration, trusted by users
- Handles subscriptions automatically

### Free → Paid conversion rate (industry average)
- SaaS tools typically convert 2-5% of free users to paid
- Privacy tools tend to be higher — people who care about privacy will pay

### Break-even point
At £8/month Pro plan:
- Need ~2 paying users to cover current AWS costs
- Need ~13 paying users to cover Stripe fees + AWS at scale

---

## 12-Month Revenue Scenarios

### Conservative (slow growth)
| Month | Free Users | Pro Users | Team Users | Revenue |
|---|---|---|---|---|
| 1-2 | 50 | 0 | 0 | £0 |
| 3-4 | 200 | 5 | 0 | £40 |
| 6 | 500 | 20 | 1 team (5) | £250 |
| 12 | 1,000 | 50 | 3 teams (15) | £670 |

### Realistic (consistent effort)
| Month | Free Users | Pro Users | Team Users | Revenue |
|---|---|---|---|---|
| 3 | 300 | 10 | 0 | £80 |
| 6 | 800 | 40 | 2 teams (10) | £500 |
| 12 | 2,500 | 120 | 8 teams (40) | £2,160 |

### Optimistic (viral moment / enterprise deal)
| Month | Revenue |
|---|---|
| 6 | £3,000 |
| 12 | £15,000+ |

One enterprise client (50 users at £35/user) = £1,750/month alone.

---

## Funding Options (If Needed)

### Bootstrap (current approach)
- Keep costs near zero, grow organically
- Sustainable but slow

### Grants
- Innovate UK — funds UK tech startups, especially those with a security/privacy angle
- SBRI (Small Business Research Initiative) — government contracts for security tools
- These don't require giving up equity

### Angel investment
- Once you have 100+ paying users and clear growth
- Privacy/security is a hot space for investors right now

---

## Key Financial Milestones
- £100/month — proof the model works
- £1,000/month — ramen profitable, worth investing more time
- £5,000/month — full-time viable
- £15,000/month — hire first employee
