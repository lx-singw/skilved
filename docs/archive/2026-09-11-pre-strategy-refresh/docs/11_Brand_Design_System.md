# Skilved — Brand & Design System
### Version 1.0 | June 2026

---

## Brand Foundation

### The Name
**Skilved** = Skilled + Verified

The name does two things simultaneously: it describes the product (your skills, verified) and it creates a new category (being Skilved is a status, not just a feature). The past-tense construction implies completion, proof, readiness.

### The Tagline
**Primary:** "Not just skilled. Skilved."  
**Secondary:** "Your skills. Verified. Your next opportunity. Found."  
**Short form:** "Get Skilved."

### The Brand Voice

Skilved speaks like a trusted, sharp friend who works in the trades. Not corporate. Not startup-cute. Not condescending. Honest about what it knows. Direct about what it's offering.

**Voice attributes:**
- **Direct:** "Here's an apprenticeship that matches your N3. Apply now."
- **Honest:** "This opportunity closes in 2 days. Don't wait."
- **Respectful:** Addresses users as capable adults who know their trade
- **Specific:** Never vague. Always trade, always location, always deadline.
- **Grounded:** SA-rooted. Knows the SETA system. Knows the TVET pipeline.

**What Skilved never sounds like:**
- Corporate HR speak ("We are delighted to announce...")
- Startup hype ("Revolutionising the future of work...")
- Condescending ("Even if you don't have a degree, you can...")
- Vague ("Opportunities await...")

### Brand Personality

If Skilved were a person, they would be:
- A trade-tested electrician who also has a sharp business mind
- Someone who has navigated the SETA system and knows exactly how it works
- The person in the WhatsApp group who always has the right link at the right time
- Reliable, precise, slightly proud of knowing exactly what they're talking about

---

## Visual Identity

### Logo Concept

**Primary wordmark:** SKILVD (all caps, no vowel — stylistic, distinctive)  
**Full name:** Skilved (sentence case, for body text and secondary usage)

**The wordmark rationale:** SKILVD reads as a designed mark — it looks intentional, not accidentally missing letters. Like BLDG or MKTG — abbreviations that become logos. In brand contexts (t-shirts, app icons, favicons), SKILVD is distinctive. In UI, "Skilved" reads naturally.

**Icon:** A single mark that combines a skills badge (hexagon, evoking trade certification) with an upward arrow or check mark. Versatile for app icon, favicon, and WhatsApp profile.

---

### Colour Palette

**Primary — Skilved Blue**  
Used for: CTAs, primary actions, brand moments  
Hex: `#1A56DB`  
SA context: Confidence, trust, digital precision

**Secondary — Trade Amber**  
Used for: Closing soon alerts, opportunity highlights, energy  
Hex: `#D97706`  
SA context: Craft, hands-on work, urgency

**Accent — Verified Green**  
Used for: Verification badges, success states, new opportunity badges  
Hex: `#059669`  
SA context: Growth, opportunity, confirmation

**Neutral — Zinc**  
Used for: Body text, secondary information, backgrounds  
Dark: `#18181B`  
Mid: `#71717A`  
Light: `#F4F4F5`  
White: `#FFFFFF`

**Semantic colours:**  
Success: `#059669`  
Warning: `#D97706`  
Error: `#DC2626`  
Info: `#1A56DB`

---

### Typography

**Display / Headings:** Inter (Bold, 700)  
**Body:** Inter (Regular, 400 / Medium, 500)  
**Monospace (for codes, IDs):** JetBrains Mono

**Type scale (mobile-first):**
```
Display:  32px / 40px line height / Bold
H1:       28px / 36px line height / Bold
H2:       22px / 30px line height / Bold
H3:       18px / 26px line height / Semibold
H4:       16px / 24px line height / Semibold
Body:     14px / 22px line height / Regular
Small:    12px / 18px line height / Regular
Caption:  11px / 16px line height / Medium
```

---

### Spacing & Grid

**Base unit:** 4px  
**Mobile:** 16px horizontal padding  
**Tablet:** 24px horizontal padding  
**Desktop:** Max content width 1200px, 32px horizontal padding  

**Border radius:**  
Small: 4px (tags, pills)  
Medium: 8px (inputs, small cards)  
Large: 12px (cards, panels)  
XL: 16px (modals, sheets)  
Full: 999px (badges, buttons)

---

## Component Design Principles

### Opportunity Cards

The card is the most important component in the product. It must:

1. **Communicate trade and location instantly** — the two most important filters
2. **Show salary prominently** — the primary decision variable
3. **Display freshness** — differentiates Skilved from every other board
4. **Enable one-tap share** — always visible, never hidden in a menu
5. **Load fast** — text-only, no images in MVP

**Card hierarchy:**
```
Trade badge + Province tag     ← immediate visual scan
Title                          ← what is this?
Organisation + Location        ← who and where?
Salary / Stipend               ← is this worth my time?
Type (Apprenticeship etc)      ← what kind of opportunity?
Closing date + "Found Xh ago"  ← should I act now?
Actions: View | Apply | Share  ← always visible
```

### Trade Category Badges

Each trade has a distinctive colour badge — creates visual scanning speed.

| Trade | Colour | Badge |
|---|---|---|
| Electrical | Amber `#D97706` | ⚡ Electrical |
| Plumbing | Blue `#0284C7` | 💧 Plumbing |
| Welding | Orange `#EA580C` | 🔥 Welding |
| Automotive | Grey `#475569` | 🔧 Automotive |
| Construction | Stone `#78716C` | 🏗 Construction |
| HVAC | Cyan `#0891B2` | 🌀 HVAC |
| Mechanical | Slate `#64748B` | ⚙️ Mechanical |
| Mining | Yellow `#CA8A04` | ⛏ Mining |
| ICT | Violet `#7C3AED` | 💻 ICT |
| Agriculture | Green `#16A34A` | 🌱 Agriculture |
| Logistics | Indigo `#4338CA` | 🚛 Logistics |
| Clothing | Pink `#DB2777` | ✂️ Clothing |

---

### Status Indicators

**Opportunity status pills:**

| Status | Style | Usage |
|---|---|---|
| New | Green fill, white text | < 24 hours old |
| Closing Soon | Amber fill, white text | < 3 days to deadline |
| Verified | Blue outline, blue text | MyMzansi-verified org |
| Funded | Green outline, green text | Stipend/bursary confirmed |
| Expired | Grey, reduced opacity | Past deadline |

**Profile completion:**

| Level | Colour | Label |
|---|---|---|
| 0–20% | Red | Start your profile |
| 21–40% | Amber | Keep going |
| 41–60% | Yellow | Getting there |
| 61–80% | Light green | Almost Skilved |
| 81–100% | Green | Skilved ✓ |

---

## Mobile Design Principles

97% of Skilved's target users are mobile-first. Every design decision is mobile-first.

**Rules:**
- Touch targets minimum 44×44px (accessibility + fat-finger usability)
- Primary CTAs full-width on mobile
- Bottom navigation (not hamburger menu) — thumb-reachable
- WhatsApp share: one tap, never buried in a share sheet
- Apply button always visible (sticky if necessary)
- Filter bar scrollable horizontally (not dropdown on mobile)
- Infinite scroll (not pagination)
- Skeleton screens (not spinners) for loading states
- Offline state handled gracefully (cached last feed)

---

## Tone of Voice — Examples

### Opportunity card freshness text
✅ "Found 2 hours ago by Skilved"  
✅ "Skilved found this this morning"  
❌ "Posted today"  
❌ "Recently added"  

### Soft signup prompt
✅ "You've looked at 8 electrical opportunities. Want Skilved to find more like these automatically?"  
✅ "Skilved found 47 more welding opportunities in Gauteng this week."  
❌ "Sign up to see more!"  
❌ "Create a free account to unlock personalised results"  

### WhatsApp digest opening
✅ "Morning Sipho 👋 Skilved found 4 new plumbing opportunities in KZN overnight."  
✅ "Good morning. 3 new electrical apprenticeships in Gauteng — here's what Skilved found:"  
❌ "Hi! We have some exciting opportunities for you today!"  
❌ "Dear valued user, please find enclosed your daily opportunity digest."  

### Match explanation
✅ "Matches your N3 electrical, Gauteng location."  
✅ "Strong match: trade-tested plumber, entry level, your province."  
❌ "This opportunity may be relevant to your profile."  
❌ "We think you might like this!"  

### Error states
✅ "No electrical opportunities in Limpopo right now. The agent's still looking — check back tomorrow."  
✅ "Couldn't load the feed. Check your connection and try again."  
❌ "No results found."  
❌ "Error 404: content not available."  

### Empty state (new user, no profile yet)
✅ "Skilved is indexing 2,847 trades opportunities across SA right now. Tell us your trade and province to see what matches you."  
❌ "Welcome! Complete your profile to get started."  

---

## Brand Assets Checklist

### Launch Day Assets Required
- [ ] Logo (SVG, PNG — light and dark variants)
- [ ] SKILVD wordmark (SVG)
- [ ] Favicon (32×32px, 16×16px)
- [ ] App icon (512×512px for PWA)
- [ ] Open Graph image (1200×630px) — for WhatsApp/social link previews
- [ ] Per-trade OG images (12 variants, one per trade category)
- [ ] WhatsApp Business profile image

### Phase 2 Assets
- [ ] iOS App Store screenshots (6 variants)
- [ ] Android Play Store screenshots
- [ ] Animated demo GIF (feed in action)
- [ ] Pitch deck template
- [ ] Email signature template

---

## Competitive Visual Differentiation

| | Skilved | PNet | Indeed | LinkedIn |
|---|---|---|---|---|
| Trade-first visual language | ✅ | ❌ | ❌ | ❌ |
| Freshness as primary signal | ✅ | ❌ | ❌ | ❌ |
| Mobile-optimised cards | ✅ | Partial | Partial | ✅ |
| WhatsApp-native sharing | ✅ | ❌ | ❌ | ❌ |
| SA-rooted brand voice | ✅ | ❌ | ❌ | ❌ |

---

*Document version 1.0 — June 2026*  
*Owner: Design Lead*  
*All brand decisions final after founder review*
