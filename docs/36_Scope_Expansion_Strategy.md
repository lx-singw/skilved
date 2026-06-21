# Skilved — Scope Expansion Strategy
### Trades Is the Entry, Not the Ceiling | Version 1.0 | June 2026

---

## Table of Contents

- [The Reframe](#the-reframe)
- [Why Trades First](#why-trades-first)
- [The Full Scope Vision](#the-full-scope-vision)
- [Expansion Sequence](#expansion-sequence)
- [TVET Colleges as a Distinct Segment](#tvet-colleges-as-a-distinct-segment)
- [Opportunity Source Expansion](#opportunity-source-expansion)
- [Architecture Is Already Scope-Agnostic](#architecture-is-already-scope-agnostic)
- [What Changes Per Phase](#what-changes-per-phase)
- [Updated Brand Narrative](#updated-brand-narrative)
- [Impact on All Documents](#impact-on-all-documents)
- [Change Log](#change-log)

---

## The Reframe

**Every document in the Skilved suite currently says "12 trade categories" and "SA trades workers."**

This needs to change. Trades is the entry point, not the ceiling. The architecture — AI agents that discover opportunities, match by verified profile, and submit applications autonomously — is qualification-agnostic. It works for an N3 Electrical student and a Computer Science graduate equally.

**The correct single-sentence description of Skilved:**
> "Skilved is South Africa's AI advancement layer for every worker at every qualification level — starting with trades, expanding to every credential from matric to PhD."

---

## Why Trades First

The decision to start with trades is strategic, not architectural. Trades is the correct entry point for five reasons:

**1. Highest pain, most underserved.** The digital job-search infrastructure for trades workers is almost non-existent. PNet and CareerJunction are for white-collar. Trade workers rely on WhatsApp groups and word of mouth.

**2. SETA infrastructure is the opportunity moat.** 21 SETAs fund billions of rands in learnerships that expire unfilled every year. This supply of verifiable opportunities — with a known coordinator (the SETA) — makes the Scout Agent's job dramatically easier than in white-collar.

**3. Verification is clearest here.** Trade test certification (NAMB), NQF qualifications (SAQA), and artisan registration all have clear verification pathways. The "Skilved Verified" badge means something concrete in trades.

**4. The outcome graph compounds fastest.** Trades placements are binary and verifiable — you either started the apprenticeship or you didn't. White-collar placements are murkier (probation periods, contract roles, etc.). The graph quality is highest for trades.

**5. XPRIZE story.** The most acute, most measurable, most equity-aligned use case for the judges.

---

## The Full Scope Vision

Skilved is the advancement layer for South Africa's entire working-age population — across every qualification level.

```
Matric (Grade 12)
  ↓
Post-school learnerships (Grade 12 + learnership)
  ↓
TVET (N1 through N6, occupational certificates)    ← Skilved MVP
  ↓
Trade test (artisan certification)                  ← Skilved MVP
  ↓
National diplomas (TVET + university)
  ↓
University degrees (BTech, B degrees, honours)
  ↓
Professional licences (engineering, law, medicine)
  ↓
Postgraduate (honours, masters, PhD)
  ↓
Continuing professional development (CPD)
```

Every level has: opportunities (learnerships, jobs, bursaries, graduate programmes), verification pathways (SAQA, professional bodies, NAMB, HPCSA, etc.), and career paths (what do you do next?).

The same Skilved infrastructure serves all of them. The agents don't care what NQF level they're matching — they care about matching profile to opportunity.

---

## Expansion Sequence

| Phase | Scope Addition | Why This Phase | Key Changes |
|---|---|---|---|
| MVP | Trade qualifications N1–N6 + trade test | Clearest pain, SETA supply, NAMB verification | 12 trade categories, SETA portals |
| Phase 2a | All TVET outputs — diplomas, occupational certs | Same SETA infrastructure, same student population | Add diploma/certificate opportunity types |
| Phase 2b | Grade 12 learnerships — matric + learnership | Largest volume segment (youth NEETs) | Add Grade 12 as entry qualification level |
| Phase 2c | University-linked learnerships + bursaries | Corporate CSI budgets, university partnerships | Add university as opportunity source |
| Phase 3a | Graduate programmes + entry-level professional | Higher employer SaaS willingness to pay | New employer segment: corporates with grad programmes |
| Phase 3b | ICT professionals, healthcare workers, educators | White-collar employer market | New trade categories: ICT, healthcare, education |
| Phase 3c | Professional licences (engineering, accounting) | Professional body verification pathways (ECSA, SAICA) | New verification sources: ECSA, SAICA, HPCSA |
| Phase 4 | Full SA labour market | All qualification levels, all sectors | Pan-sector, pan-level |

---

## TVET Colleges as a Distinct Segment

### Why TVET Colleges Need Special Treatment

TVET colleges are not just a source of workers — they are:
1. An **opportunity source** (post colleges often partner with employers to post learnerships before SETA portals)
2. A **user acquisition channel** (students, graduates seeking placement)
3. A **partnership revenue source** (Skills Pulse college performance data)
4. A **verification partner** (SAQA verification is college-anchored)

**Action Sprint 2+:** Add 50 major TVET colleges to Scout Agent source list. (ON HOLD — Sprint 1 uses 3 portal aggregators: PuffAndPass, RecentJobs, StudentRoom.)

### TVET College Opportunity Types

```typescript
// Add to OpportunityType enum
type TVETOpportunityType =
  | 'tvet_short_course'           // college-run short courses
  | 'tvet_bridging_programme'     // matric equivalency
  | 'tvet_industry_partnership'   // employer-funded college programmes
  | 'tvet_placement_agreement'    // employer placement agreements with colleges
  | 'tvet_bursary'               // funded study at TVET
  | 'college_learnership';        // learnerships admin'd through college
```

### TVET College Sources for Scout Agent

> **ON HOLD — Sprint 1 uses PuffAndPass, RecentJobs, StudentRoom only. TVET colleges deferred to Sprint 2+.**

Priority 50 TVET colleges to add to Scout Agent in Sprint 2+:

**Gauteng (highest volume):**
- Ekurhuleni East TVET College
- Ekurhuleni West TVET College
- South West Gauteng TVET College
- Tshwane South TVET College
- Tshwane North TVET College
- Central Johannesburg TVET College
- Westcol TVET College

**Western Cape:**
- Northlink TVET College
- False Bay TVET College
- College of Cape Town
- Boland TVET College

**KwaZulu-Natal:**
- Umfolozi TVET College
- Elangeni TVET College
- eThekwini TVET College
- Majuba TVET College

**Eastern Cape:**
- Buffalo City TVET College
- King Hintsa TVET College
- Port Elizabeth TVET College

**Plus all provincial capital colleges** (all 9 provinces)

### The TVET College Partnership Pitch (Updated)

> "Skilved indexes your opportunities and finds qualified candidates. Your college appears in the TVET Performance table on our Skills Pulse Dashboard — visible to employers, SETAs, and DHET. Good placement rates attract more learners and better employer partnerships. And your graduates carry Skilved-verified credentials that prove their qualifications from your college."

---

## Opportunity Source Expansion

### Current (MVP) Sources — Sprint 1

- PuffAndPass.co.za (learnerships, internships, bursaries, graduate programs)
- RecentJobs.co.za (jobs, vacancies, learnerships, internships, apprenticeships, bursaries, government jobs)
- StudentRoom.co.za (bursaries, internships, learnerships — largest SA aggregator, 2437+ pages)

*See `scout_portal_sources.md` for full source specifications, extraction fields, and Scrapy spider details.*

### ON HOLD — Sprint 2+

- 21 SETA portals
- 6 major job boards (filtered to trades)
- Government Gazette
- NAMB
- 50 employer career pages

### Phase 2 Additions (Non-Trades)

| Source | What It Adds | Priority |
|---|---|---|
| 50 TVET college websites | Trade + general vocational opportunities | Phase 2 (on hold) |
| Universities South Africa (USAf) | Bursaries, graduate programmes | Phase 2 |
| NSFAS portal | Funded study opportunities (all levels) | Phase 2 |
| NYDA (National Youth Development Agency) | Youth-specific learnerships and grants | Phase 2 |
| Corporate CSI portals (top 100 companies) | Bursaries, learnerships (any qualification) | Phase 2 |
| Professional body portals (ECSA, SAICA, HPCSA) | Professional qualification pathways | Phase 3 |
| University job portals (careers.uct.ac.za, etc.) | Graduate and internship positions | Phase 3 |
| Government Vacancy Circular (DPSA) | All levels of government positions | Phase 2 |

---

## Architecture Is Already Scope-Agnostic

The beautiful thing about Skilved's architecture: nothing needs to change to support non-trade qualifications. Every agent already handles any qualification type:

**Scout Agent:** The extraction prompt already captures `trade_category: "other"` and `qualification_type: "any"`. Adding university opportunities is adding sources, not changing extraction.

**Skills Profile Agent:** The NQF framework covers all qualifications from NQF 1 (Grade 9) to NQF 10 (doctoral degree). The passport already has `highestNqfLevel: number` — this works for any qualification.

**Matching Agent:** Matches on NQF level, qualification type, province — these work for any sector.

**Application Agent:** ATS adapters (SuccessFactors, Taleo, etc.) are used by employers across all sectors. A corporate grad programme uses the same SuccessFactors system as an Eskom apprenticeship.

**Skills Pulse Dashboard:** Already tracks all NQF levels. Expanding to show university graduate demand vs. supply is a BigQuery query change, not an architecture change.

**Career Simulation Engine:** Works for any career path. "What if I do honours?" is the same query structure as "What if I get my trade test?"

---

## What Changes Per Phase

### What Changes When Expanding to New Qualification Levels

| Component | What Changes |
|---|---|
| Scout Agent sources | Add new portals (university, NSFAS, corporate CSI) |
| Opportunity types | Add new types (graduate programme, bursary, internship) |
| Trade categories | Rename to "career categories" — add ICT, Healthcare, Education, Finance |
| Qualification taxonomy | Already NQF-based — add degree/honours/masters types |
| SAQA verification | Already covers all NQF — no change |
| Employer sources | Add new employer segments (universities, professional services) |
| Skills Pulse Dashboard | Add new sectors to gap analysis |
| Marketing | Update copy from "trades workers" to "all SA workers" |

### What Does NOT Change

- Agent architecture (all 18 agents work as-is)
- Skills Passport structure (NQF-based already)
- Application Agent ATS adapters (cross-sector employers use same platforms)
- MyMzansi integration (covers all citizens)
- Document Vault (covers all qualification documents)
- Permission model (Level 1–4 works for any user)
- Revenue model (employer referrals, Premium, SETA contracts — all scale)

---

## Updated Brand Narrative

### MVP Tagline
"Not just skilled. Skilved." ← Keep

### Updated Supporting Copy

**Current (replace everywhere):**
> "The AI advancement layer for South Africa's 11 million skilled trades workers."

**Updated:**
> "The AI advancement layer for every South African worker — from matric to PhD, from first apprenticeship to senior artisan. Starting with trades."

**One-liner:**
> "Skilved helps opportunities find people — at every qualification level, across every sector."

**For XPRIZE:**
> "We start where the pain is highest: South Africa's 11 million trades workers. But the architecture serves every worker at every qualification level. Trades is the entry. The whole SA labour market is the destination."

---

## Impact on All Documents

The phrase "12 trade categories" should be replaced with "starting with 12 trade categories, expanding to all qualification levels" in:
- `00_INDEX.md`
- `01_MVP_Scope.md`
- `02_PRD.md`
- `04_XPRIZE_Strategy.md`
- `05_Pitch_Deck.md`
- `23_README.md`
- `24_AI_Employees_Architecture.md`

The phrase "SA trades workers" should be replaced with "SA workers (starting with trades)" in strategic context, or kept as "trades workers" in MVP-specific technical context.

The "12 trade categories" constant in code (`packages/types/src/opportunity.ts`) should be extended to include `'ict' | 'healthcare' | 'education' | 'finance' | 'other_professional'` in Phase 2, with trades categories remaining valid.

---

## Change Log

### v1.0 — June 2026
- Initial specification
- NEW — created from "trades is the entry, not the ceiling" strategic conversation
- Covers: reframe, expansion sequence, TVET college segment, opportunity source expansion, architecture scope-agnosticism, updated brand narrative

*Document version 1.0 — June 2026*
*Owner: Founder + Product*
*Update all documents to reflect expanded scope narrative*
