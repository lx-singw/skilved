# Scout Agent — Portal Sources Specification

## Overview

The Scout/Discovery Agent ingests opportunities from three South African aggregator portals via Scrapy spiders. All three share a common `OpportunityItem` schema and run on a configurable schedule (default: every 4 hours).

**Source location:** `proofile_2.0/scraping-engine/spiders/portals/`

---

## Portal Sources

### 1. PuffAndPass.co.za

| Property | Value |
|---|---|
| Spider name | `puffandpass` |
| Domain | `puffandpass.co.za` |
| Platform | WordPress blog |
| Categories | Learnerships, Internships, Bursaries, Graduate Programs, Grade 12 |
| Max pages | 50 (configurable) |
| Download delay | 2s (randomized) |

**Start URLs:**
- `/` (homepage)
- `/category/learnerships/`
- `/category/internships/`
- `/category/bursaries/`
- `/category/graduate-programs/`
- `/category/grade-12/`

**Strengths:** Clean WordPress structure, consistent closing-date patterns, structured eligibility criteria.
**Weaknesses:** No published dates in URLs; occasional PDF-only applications.

---

### 2. RecentJobs.co.za

| Property | Value |
|---|---|
| Spider name | `recentjobs` |
| Domain | `recentjobs.co.za` |
| Platform | WordPress blog |
| Categories | Vacancies, Jobs, Learnerships, Internships, Apprenticeships, Bursaries, Government Jobs |
| Max pages | 50 (configurable) |
| Download delay | 2s (randomized) |

**Start URLs:**
- `/` (homepage)
- `/category/vacancies/`
- `/category/jobs/`
- `/category/learnerships/`
- `/category/internships/`
- `/category/apprenticeships/`
- `/category/bursaries/`
- `/category/government-jobs/`

**Strengths:** Published dates extractable from URL (`/YYYY/MM/DD/`); broad category coverage including government jobs; link validator integration with fallback chain.
**Weaknesses:** Mixed opportunity types on homepage; requires careful type detection.

---

### 3. StudentRoom.co.za

| Property | Value |
|---|---|
| Spider name | `studentroom` |
| Domain | `studentroom.co.za` |
| Platform | WordPress blog |
| Categories | Bursaries, Internships, Learnerships |
| Max pages | 50 (configurable) |
| Download delay | 2s (randomized) |

**Start URLs:**
- `/` (homepage)
- `/category/bursaries/`
- `/category/internships/`
- `/category/learnership/`

**Strengths:** Largest aggregator (2437+ pages); deep structured requirements extraction (Minimum vs Ideal qualifications, experience, skills, knowledge, conditions of employment); supports direct detail URL injection; smart routing for list vs detail pages.
**Weaknesses:** Heavy pagination — must cap `max_pages` per run; occasional duplicate postings across categories.

---

## Shared Extraction Capabilities

All three spiders extract the same structured fields into `OpportunityItem`:

| Field | Method | Notes |
|---|---|---|
| `title` | CSS selectors (`h1`, `.entry-title`) | Cleaned, validated (10–500 chars) |
| `company` | Title prefix split + regex content fallback | "Eskom: Learnership 2026" → "Eskom" |
| `location` | SA province/city keyword matching | Falls back to "South Africa" |
| `type` | Keyword detection from title+URL | bursary, learnership, apprenticeship, internship, graduate_program, job, opportunity |
| `description_full` | `.entry-content` text extraction | Capped at 10,000 chars |
| `description_short` | First 300 chars of full description | |
| `closing_date` | 6 regex patterns (named months + numeric) | Returns `{raw, parsed: YYYY-MM-DD}` |
| `application_url` | Link validator + apply-link heuristics | Prioritises company portals over aggregator |
| `canonical_link` | Best external link (company career page) | Via `utils.link_validator` |
| `source_url` | Where we found it (aggregator page) | For provenance tracking |
| `link_quality` | `direct_apply`, `description_link`, `aggregator_fallback` | Confidence signal |
| `eligibility` | Age range, citizenship, employment status, disability | Dict structure |
| `required_documents` | CV, ID, matric, qualification, transcript, proof of residence | Keyword-based list |
| `salary` | Rand amount patterns (`R5000 pm`, stipend) | Regex extraction |
| `contacts` | Emails + SA phone numbers | Regex extraction |
| `sector` | Keyword match against 9 sectors | engineering, mining, IT, finance, govt, retail, logistics, healthcare, education |
| `reference_number` | REF/Job ID patterns | e.g. `BAB251211-3` |
| `positions_count` | "8 positions", "X5" patterns | Sanity-checked 1–500 |
| `education_level` | Grade 10 → PhD hierarchy | Checks highest first |
| `experience_years` | `{min, max}` or `{min, max: null}` | Range + minimum patterns |
| `application_method` | `email`, `online`, `in_person`, `post` | Prioritises online > email |
| `expiry_signals` | `closed_badge`, `keyword:expired`, `old_post:120_days` | For AI pipeline status detection |
| `dedup_fingerprint` | MD5 of normalised title+company | Cross-source deduplication |
| `quality_signals` | Boolean flags for data completeness | AI confidence scoring input |

### StudentRoom-Only: Structured Requirements

StudentRoom additionally extracts a `structured_requirements` object:

```python
{
    'qualifications': {
        'minimum': {'degree_level': 'Matric', 'field_of_study': '...'},
        'ideal':     {'degree_level': 'Bachelors', 'field_of_study': '...', 'certifications': [...]}
    },
    'experience': {
        'minimum': {'years_min': 0, 'years_max': 2, 'description': '...'},
        'ideal':     {'years_min': 3, 'description': '...'}
    },
    'skills': [{'name': 'Communication Skills', 'level': 'required'}],
    'knowledge': {
        'minimum': ['Labour Relations Act', '...'],
        'ideal': ['Project Management', '...']
    },
    'conditions_of_employment': ['Clear criminal record', 'Clear credit record']
}
```

---

## Shared Infrastructure

### Crawl Settings (all spiders)

```python
{
    'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...',
    'DOWNLOAD_DELAY': 2,
    'RANDOMIZE_DOWNLOAD_DELAY': True,
    'CONCURRENT_REQUESTS_PER_DOMAIN': 1,
    'COOKIES_ENABLED': False,
    'ROBOTSTXT_OBEY': False,
    'RETRY_TIMES': 3,
    'RETRY_HTTP_CODES': [500, 502, 503, 504, 408, 429],
    'CLOSESPIDER_PAGECOUNT': 100,
}
```

### Item Schema (`OpportunityItem`)

Defined in `scraping-engine/items.py`. Key fields beyond the extracted data:

| Field | Purpose |
|---|---|
| `canonical_link` | Best link to company career page (not aggregator) |
| `source_url` | Aggregator page where opportunity was found |
| `is_direct_company_link` | `True` if canonical_link goes to company site |
| `link_quality` | Quality tier of the extracted link |
| `needs_deep_scrape` | `True` if canonical_link should be followed for better data |
| `confidence_score` | 0–100 based on link quality + data completeness |
| `quality_tier` | `high` (80+), `medium` (50–79), `low` (<50) |

### Link Validator (`utils/link_validator`)

Shared utility used by all three spiders:
- `extract_best_link(response, context)` — context-aware link extraction (looks near "How to Apply" text)
- `is_canonical_link(url)` — validates URL is a direct company link, not an aggregator
- `is_aggregator_domain(url)` — identifies known aggregator domains to skip
- `process_opportunity_link(url)` — full link processing pipeline

---

## Running the Spiders

```bash
# From proofile_2.0/scraping-engine/
scrapy crawl puffandpass
scrapy crawl recentjobs
scrapy crawl studentroom

# With custom max pages
scrapy crawl studentroom -a max_pages=10

# StudentRoom supports direct detail URLs
scrapy crawl studentroom -a start_urls="https://www.studentroom.co.za/some-opportunity/"
```

---

## Integration with Scout Agent

The Scout Agent should:
1. **Schedule** all three spiders on a 4-hour cycle (staggered to avoid overlap)
2. **Deduplicate** using `dedup_fingerprint` across all sources
3. **Score** opportunities using `quality_signals` and `confidence_score`
4. **Route** high-quality items (`quality_tier: high`) to the Analyst Agent for ATS platform detection
5. **Flag** items with `expiry_signals` for priority processing or archival
6. **Enrich** StudentRoom items using `structured_requirements` for better matching downstream

---

*Document v1.0 — June 2026*
*Owner: Engineering*
*Sources: proofile_2.0/scraping-engine/spiders/portals/*
