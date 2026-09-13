# Skilved — Legal, Compliance & Regulatory
### Version 1.0 | June 2026

---

## Overview

Skilved operates at the intersection of employment, education, personal data, and government digital infrastructure. Each of these domains carries its own regulatory requirements. This document maps every relevant regulation and defines Skilved's compliance obligations, risk exposure, and mitigation strategy.

Non-compliance in any of these areas is an existential risk. Legal is not optional overhead — it is infrastructure.

---

## 1. POPIA — Protection of Personal Information Act

### Why This Matters Most
POPIA is SA's primary data protection legislation, effective since July 2021. Skilved collects, processes, and stores personal information of both workers (job seekers) and employers. Non-compliance carries fines up to R10 million and/or criminal prosecution.

### What Skilved Collects

| Data Type | Subject | Basis for Processing |
|---|---|---|
| Name, contact details | Workers | Consent (account creation) |
| Trade, qualifications, experience | Workers | Consent (profile completion) |
| WhatsApp number | Workers | Consent (notification opt-in) |
| Application history | Workers | Legitimate interest (service delivery) |
| Career outcomes | Workers | Consent (outcome reporting) |
| Employer name, contact | Employers | Contract (service agreement) |
| Anonymous browsing data | All users | Legitimate interest (service improvement) |

### POPIA Compliance Requirements

**1. Information Officer**
Skilved must register an Information Officer with the Information Regulator within 30 days of commencing business. The founder serves as Information Officer initially.

**Action:** Register at inforegulator.org.za — Week 1.

**2. Privacy Notice**
A clear, plain-language privacy notice must be displayed at every point of data collection.

Required contents:
- Who we are and contact details
- What data we collect and why
- Who we share data with
- How long we keep data
- User rights (access, correction, deletion)
- How to complain

**Action:** Privacy notice drafted and live before any user data collected — Week 1.

**3. Consent**
All data collection beyond what is strictly necessary for the service requires explicit, informed consent. Consent cannot be bundled with terms of service.

**Skilved's consent architecture:**
- Account creation: consent to profile data processing
- WhatsApp number: separate consent for notifications
- Outcome tracking: separate consent when prompted
- Analytics: cookie consent on first visit
- No pre-ticked boxes, no consent bundled in T&Cs

**4. Data Minimisation**
Skilved collects only what is necessary. MVP collects: name, trade, province, qualification level, WhatsApp (optional). No ID numbers, no financial data, no biometrics in MVP.

**5. Security Measures**
- All data encrypted at rest (GCP default encryption)
- All API communication encrypted (HTTPS/TLS 1.3)
- No PII in logs
- Access controls on all databases (least-privilege principle)
- Incident response plan documented

**6. Breach Notification**
If a data breach occurs, Skilved must notify the Information Regulator within 72 hours and affected users as soon as reasonably possible.

**Action:** Incident response plan documented and tested — Month 1.

**7. Data Retention**
- Active user data: retained while account is active + 12 months
- Inactive user data: deleted after 24 months of inactivity
- Anonymous session data: deleted after 90 days
- Outcome/graph data: anonymised and retained permanently (public interest)

**8. Right to Deletion**
Users can request deletion of their account and personal data. Honoured within 72 hours. Note: anonymised outcome data (without PII) is retained for the graph — this is disclosed in the privacy notice.

---

## 2. Labour Law

### Employment Intermediary Considerations
Skilved connects workers with employers. It is NOT an employment agency (no contract of employment, no payment of workers, no management of workers). However, Skilved must be careful not to inadvertently constitute a labour broker under the Labour Relations Act.

**Key distinctions:**
- Skilved is a **platform** not an intermediary employer
- Workers are never employed by Skilved
- Skilved does not manage, supervise, or control workers
- Employers contract directly with workers, not through Skilved

**Risk:** If Skilved manages the entire application process and the employer treats Skilved as the hiring intermediary, it could trigger Section 198 of the LRA (labour broking provisions).

**Mitigation:**
- Terms of service clearly state Skilved is a technology platform, not an employment agency
- Employer contracts explicitly state the employment relationship is between employer and worker
- Skilved does not issue letters of engagement or employment contracts
- Skilved does not process payroll or disbursements (except SETA stipends — see below)

### SETA Learnership Legal Structure
When Skilved manages learnership applications for SETAs, the legal structure is:
- SETA = skills development facilitator
- Employer = host employer  
- Learner = learnership beneficiary
- Skilved = technology platform for matching and administration

Skilved is NOT party to the learnership agreement (three-party agreement between SETA, employer, and learner under the Skills Development Act).

**Action:** Legal opinion obtained on Skilved's role in SETA learnership administration — Month 1.

---

## 3. Consumer Protection Act (CPA)

Skilved's services to workers (free) and employers (paid) must comply with the CPA.

**For workers (free users):**
- Privacy notice is a consumer disclosure requirement
- No misleading claims about opportunity quality or job guarantees
- No hidden terms in the free service

**For employers (paid users):**
- Clear, written service agreements
- Refund policy documented (if referral doesn't meet qualification criteria)
- No automatic subscription renewals without explicit consent
- Cooling-off period: 5 business days for electronic contracts

**Action:** Standard employer service agreement drafted by Month 1.

---

## 4. Electronic Communications and Transactions Act (ECTA)

Skilved operates as an electronic platform. ECTA requirements:

- Website must display: full legal name, registration number, physical address, contact details
- Electronic contracts (employer agreements) are legally valid
- Unsolicited commercial communications: WhatsApp digests require opt-in (already planned)
- Data messages: terms and conditions must be displayed before acceptance

---

## 5. Skills Development Act & SETA Regulations

Skilved operates in the skills development space. Key provisions:

**Not required (MVP):** Skilved does not need to be a registered skills development provider in MVP. It is a technology platform surfacing opportunities from registered providers.

**Phase 2 consideration:** If Skilved begins administering SETA learnership portals, it may need to register as a Skills Development Provider with DHET. Legal opinion required before Phase 2 SETA portal launch.

**SETA procurement:** SETAs are public entities. Procurement from Skilved must comply with the SETA's own SCM policy. Most SETAs have a threshold (often R500,000) below which they can procure without a full tender process. Target contracts below this threshold initially.

---

## 6. Companies Act

**Entity structure:** Register Skilved as a private company (Pty) Ltd.

**Requirements:**
- Minimum 1 director
- Memorandum of Incorporation
- Register at CIPC (cipc.co.za)
- Registered office address required
- Annual returns filed

**Action:** Register Skilved (Pty) Ltd — Week 1, same week as domain registration.

**B-BBEE:**
As a startup, Skilved will be a Qualifying Small Enterprise (QSE) if turnover is R10M–R50M, or Exempt Micro Enterprise (EME) if under R10M. No BEE certificate required for EMEs.

**For government contracts (SETAs):** Even as an EME, obtain a sworn affidavit confirming EME status from a commissioner of oaths. Required for any government procurement.

---

## 7. Tax

**VAT registration:** Required when taxable turnover exceeds R1 million in any 12-month period. Voluntarily register earlier if issuing tax invoices to VAT-registered employers (most employers are VAT-registered — they want tax invoices).

**Action:** VAT registration — Month 2 (when revenue begins scaling).

**Income tax:** Standard corporate tax (27% from 2023).

**PAYE:** Required from first employee hire. Register with SARS as an employer — Week 1 if paying any salaries.

**Skills Development Levy:** 1% of payroll, payable monthly once payroll exceeds threshold. Paid to SARS.

---

## 8. Intellectual Property

### Ownership
- Skilved platform code: owned by Skilved (Pty) Ltd
- All agent models and training: owned by Skilved (Pty) Ltd
- The skills graph data: owned by Skilved (Pty) Ltd
- Opportunity data (scraped/indexed): complex — see below

### Scraped Opportunity Data
Skilved's discovery agent scrapes publicly available opportunity listings. Legal position:

- Public websites with no robots.txt restriction: generally permissible
- Websites with explicit "no scraping" in terms: respect and exclude
- SETA websites (government): public information, permissible
- Job boards (Indeed, PNet): check terms of service — may require partnership rather than scraping

**Action:** Legal review of scraping terms for major job boards — Week 1. Partnership agreements with job boards where required.

### Trademark
- Register "Skilved" as a trademark in class 35 (employment agency services), class 42 (technology services), and class 45 (personal and social services)
- Register in SA first (CIPC trademarks), international registration later
- Domain registrations: skilved.com, skilved.co.za, skilved.app, skilved.ai — all registered immediately

**Action:** Trademark application filed — Month 1.

---

## 9. MyMzansi API Integration (Phase 2)

### Legal Considerations
When integrating MyMzansi APIs, Skilved will be subject to:
- MyMzansi developer terms of service
- POPIA obligations as a third-party data processor
- Potential liability for incorrect credential verification

**Data processor agreement:** Required between Skilved and DPSA (as MyMzansi data controller) before any credential data flows through Skilved.

**User consent:** Workers must explicitly consent to MyMzansi credential sharing with Skilved. This consent must be:
- Informed (what data is shared, why, with whom)
- Specific (for each credential type)
- Withdrawable at any time

**Action:** Legal review of MyMzansi API terms before Phase 2 integration begins.

---

## 10. Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| POPIA complaint from user | Medium | High | Full compliance architecture from day one |
| Labour broker classification | Low | Very High | Clear T&Cs, legal opinion obtained |
| Job board blocks scraping | High | Medium | Partnership agreements, multiple sources |
| Fake/scam opportunity listed | Medium | High | Quality agent + user reporting |
| SETA procurement challenge | Medium | Medium | Stay below threshold, get legal advice |
| Trademark challenge | Low | Medium | File trademark immediately |
| Data breach | Low | Very High | GCP security + incident response plan |
| SARS audit | Low | Medium | Clean books from day one, VAT registered |

---

## Compliance Calendar

| Action | Deadline | Owner |
|---|---|---|
| Register Skilved (Pty) Ltd at CIPC | Week 1 | Founder |
| Register POPIA Information Officer | Week 1 | Founder |
| Privacy notice live on website | Before launch | Engineering |
| PAYE registration with SARS | Week 1 | Founder |
| Legal opinion on SETA role | Month 1 | Legal advisor |
| Legal review of scraping terms | Week 1 | Legal advisor |
| Trademark application (CIPC) | Month 1 | IP attorney |
| Employer service agreement template | Month 1 | Legal advisor |
| VAT registration | Month 2 | Accountant |
| POPIA compliance audit | Month 3 | Legal advisor |
| Data processor agreement (MyMzansi) | Phase 2 | Legal advisor |

---

## Recommended Legal Team

**Corporate/commercial lawyer:** For company registration, employer contracts, SETA agreements  
**Data protection specialist:** For POPIA compliance architecture  
**IP attorney:** For trademark registration  
**Labour law advisor:** For labour broker risk assessment  

**Budget:** R30,000–R50,000 for legal setup in Month 1. R10,000–R20,000/month ongoing from Month 3.

---

*Document version 1.0 — June 2026*  
*Owner: Founder / Legal Advisor*  
*This document is not legal advice — obtain qualified legal counsel before acting*
