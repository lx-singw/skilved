# Skilved — ATS Adapter Strategy
### Application Agent Platform Coverage | Version 1.0 | June 2026

---

## Table of Contents

- [The Core Insight](#the-core-insight)
- [SA Employer Application Platform Distribution](#sa-employer-application-platform-distribution)
- [Build Order by Sprint](#build-order-by-sprint)
- [Adapter Specifications](#adapter-specifications)
- [CAPTCHA Solving Integration](#captcha-solving-integration)
- [Account Management Strategy](#account-management-strategy)
- [Analyst Agent ATS Detection](#analyst-agent-ats-detection)
- [Submission Router](#submission-router)
- [BigQuery Logging](#bigquery-logging)
- [Failure Handling](#failure-handling)

---

## The Core Insight

The Application Agent documentation previously described "generic Playwright web form automation." This was the wrong framing.

SA employers don't each have unique custom application systems. They use a small set of enterprise HR platforms. **You are not facing 50 unique application systems. You are facing 8 underlying platforms that cover 80%+ of all SA trades and learnership opportunities.**

One SuccessFactors adapter covers Eskom, Sasol, Barloworld, and a dozen other large SA employers. One Oracle Taleo adapter covers Transnet, Anglo American, BHP, and the major mining houses. Build the adapter once; it works for every employer on that platform forever.

This reframe makes Application Agent dramatically more achievable and more impressive to XPRIZE judges — because you can name exactly which employers each adapter covers.

---

## SA Employer Application Platform Distribution

| Platform | SA Employers Using It | Opportunity % | Sprint |
|---|---|---|---|
| Email (SMTP/Gmail) | Smaller employers, NGOs, govt depts, DPSA | ~20% | Sprint 1 |
| SAP SuccessFactors | Eskom, Sasol, Barloworld, Imperial, Vodacom, MTN | ~25% | Sprint 2 |
| Oracle Taleo / HCM | Transnet, Anglo American, BHP, Harmony, Impala | ~20% | Sprint 3 |
| PageUp | Murray & Roberts, WBHO, Group Five, Aveng | ~10% | Sprint 3 |
| MERSETA Portal | All MERSETA learnerships | ~8% | Sprint 3 |
| EWSETA Portal | All EWSETA learnerships | ~5% | Sprint 3 |
| CETA Portal | All CETA learnerships | ~5% | Sprint 4 |
| Generic Playwright | Unknown/other portals | ~7% | Sprint 4 |

**By Sprint 3 end:** Application Agent covers ~88% of SA trades opportunities.
**By Sprint 4 end:** Application Agent covers ~95% of SA trades opportunities.

---

## Build Order by Sprint

### Sprint 1: Email Submitter
Covers DPSA, Government Gazette, smaller employers, NGOs, many learnership coordinators. Higher volume than expected — many SETA learnership coordinators still use email. Simple, reliable, fast to build.

**Employers covered:** All government departments (DPSA), provincial skills offices, NGOs (Harambee, YouthBuild), corporate CSI bursaries, hundreds of smaller trade employers.

### Sprint 2: SuccessFactors Adapter + CAPTCHA Solver
Single adapter unlocks the largest SA employer group. SuccessFactors uses consistent URL patterns (`*.successfactors.com`, `*.sap.com/careers`) and consistent HTML structure. reCAPTCHA v2 present on most — integrate CAPTCHA solver immediately.

**Employers covered:** Eskom, Sasol, Barloworld Equipment, Imperial Holdings, Vodacom, MTN, Telkom, WesBank, ABSA (technical roles), City Power.

### Sprint 3: Oracle Taleo + PageUp + MERSETA + EWSETA
Three adapters covering mining, construction, and the two highest-volume SETA portals.

**Oracle Taleo employers:** Transnet, Anglo American, BHP Billiton, Harmony Gold, Impala Platinum, Sibanye-Stillwater.

**PageUp employers:** Murray & Roberts, WBHO, Group Five, Aveng, Stefanutti Stocks.

**SETA portals:** MERSETA (5,000+ learnerships/year) and EWSETA (2,000+ learnerships/year) are the two highest-volume SETA sources.

### Sprint 4: CETA Portal + Generic Playwright Fallback
CETA covers construction learnerships. Generic Playwright with intelligent form mapping for anything else.

---

## Adapter Specifications

### Base Adapter Interface

```typescript
interface SubmissionAdapter {
  platformName: string;
  platformVersion: string;

  canHandle(opportunity: Opportunity): boolean;
  submit(
    user: SkillsPassport,
    opportunity: Opportunity,
    documents: GeneratedDocuments
  ): Promise<SubmissionResult>;
  extractReference(page: Page): Promise<string | null>;
  detectCaptcha(page: Page): Promise<boolean>;
}

interface SubmissionResult {
  success: boolean;
  reference?: string;
  confirmationUrl?: string;
  screenshotPath?: string;
  failureReason?: FailureReason;
  method: ATSPlatform;
  durationMs: number;
}

type FailureReason =
  | 'captcha_unsolved'
  | 'form_structure_changed'
  | 'login_required'
  | 'opportunity_expired'
  | 'duplicate_application'
  | 'missing_required_field'
  | 'file_upload_failed'
  | 'network_error'
  | 'unknown';
```

---

### SuccessFactorsAdapter

```typescript
class SuccessFactorsAdapter implements SubmissionAdapter {
  platformName = 'SAP SuccessFactors';

  canHandle(opportunity: Opportunity): boolean {
    return opportunity.intelligence.applicationPlatform === 'successfactors';
  }

  async submit(
    user: SkillsPassport,
    opportunity: Opportunity,
    docs: GeneratedDocuments
  ): Promise<SubmissionResult> {
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    const start = Date.now();

    try {
      await page.goto(opportunity.applicationUrl, { waitUntil: 'networkidle' });

      // SuccessFactors standard field selectors
      // These are consistent across ALL SuccessFactors deployments
      await page.fill('[data-automation="firstName"]',
        user.displayName?.split(' ')[0] ?? '');
      await page.fill('[data-automation="lastName"]',
        user.displayName?.split(' ').slice(1).join(' ') ?? '');
      await page.fill('[data-automation="email"]', user.email ?? '');
      await page.fill('[data-automation="phone"]',
        user.whatsappNumber ?? '');

      // Address fields (if present)
      const addressField = page.locator('[data-automation="address1"]');
      if (await addressField.isVisible()) {
        await addressField.fill(user.city ?? user.province ?? '');
      }

      // CV upload — SuccessFactors uses standard file input
      if (await page.locator('[data-automation="resumeUpload"]').isVisible()) {
        await page.setInputFiles(
          '[data-automation="resumeUpload"]',
          docs.cvPath
        );
      }

      // Cover letter (if field exists)
      const coverLetterField = page.locator('textarea[name*="coverLetter"], textarea[name*="cover_letter"]');
      if (await coverLetterField.isVisible()) {
        await coverLetterField.fill(docs.coverLetterText);
      }

      // Custom questions (varies by employer — handle common patterns)
      await this.handleCustomQuestions(page, user, opportunity);

      // CAPTCHA handling
      if (await this.detectCaptcha(page)) {
        await this.captchaSolver.solve(page);
      }

      // Submit
      await page.click('[data-automation="submitApplication"], button[type="submit"]');
      await page.waitForLoadState('networkidle');

      const reference = await this.extractReference(page);
      const screenshot = await this.captureConfirmation(page);

      return {
        success: true,
        reference,
        screenshotPath: screenshot,
        method: 'successfactors',
        durationMs: Date.now() - start,
      };

    } catch (error) {
      return {
        success: false,
        failureReason: this.classifyError(error),
        method: 'successfactors',
        durationMs: Date.now() - start,
      };
    } finally {
      await browser.close();
    }
  }

  async extractReference(page: Page): Promise<string | null> {
    // SuccessFactors reference number patterns
    const patterns = [
      '[data-automation="applicationId"]',
      '.application-reference',
      'text=/Application.*ID.*:/i',
      'text=/Reference.*Number.*:/i',
    ];
    for (const pattern of patterns) {
      const el = page.locator(pattern).first();
      if (await el.isVisible()) return el.textContent();
    }
    return null;
  }

  private async handleCustomQuestions(
    page: Page,
    user: SkillsPassport,
    opportunity: Opportunity
  ): Promise<void> {
    // Common SA employer custom questions
    const questionHandlers = [
      {
        selector: '[name*="idNumber"], [name*="id_number"]',
        value: '', // Never submit ID number — flag for user
        skip: true,
      },
      {
        selector: '[name*="bbbee"], [name*="race"]',
        value: '', // Skip sensitive fields
        skip: true,
      },
      {
        selector: '[name*="disability"]',
        value: 'No',
      },
      {
        selector: '[name*="province"], [name*="location"]',
        value: opportunity.province,
      },
      {
        selector: '[name*="trade"], [name*="specialisation"]',
        value: user.primaryTrade,
      },
    ];

    for (const handler of questionHandlers) {
      if (handler.skip) continue;
      const field = page.locator(handler.selector).first();
      if (await field.isVisible()) {
        await field.fill(handler.value);
      }
    }
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    return (
      (await page.locator('.g-recaptcha').isVisible()) ||
      (await page.locator('iframe[src*="recaptcha"]').isVisible()) ||
      (await page.locator('[data-sitekey]').isVisible())
    );
  }
}
```

---

### OracleTaleoAdapter

```typescript
class OracleTaleoAdapter implements SubmissionAdapter {
  platformName = 'Oracle Taleo / HCM';

  canHandle(opportunity: Opportunity): boolean {
    return opportunity.intelligence.applicationPlatform === 'oracle_taleo';
  }

  async submit(
    user: SkillsPassport,
    opportunity: Opportunity,
    docs: GeneratedDocuments
  ): Promise<SubmissionResult> {
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await (await browser.newContext()).newPage();

    try {
      await page.goto(opportunity.applicationUrl, { waitUntil: 'domcontentloaded' });

      // Taleo uses a multi-step application wizard
      // Step 1: Basic information
      await page.fill('#firstName', user.displayName?.split(' ')[0] ?? '');
      await page.fill('#lastName', user.displayName?.split(' ').slice(1).join(' ') ?? '');
      await page.fill('#email', user.email ?? '');
      await page.fill('#phone', user.whatsappNumber ?? '');

      await page.click('button:has-text("Next"), input[value="Next"]');
      await page.waitForLoadState('networkidle');

      // Step 2: Resume upload
      const uploadField = page.locator('input[type="file"]').first();
      if (await uploadField.isVisible()) {
        await uploadField.setInputFiles(docs.cvPath);
      }

      await page.click('button:has-text("Next"), input[value="Next"]');
      await page.waitForLoadState('networkidle');

      // Step 3: Additional questions
      await this.handleTaleoQuestions(page, user, opportunity);

      // Handle CAPTCHA
      if (await this.detectCaptcha(page)) {
        await this.captchaSolver.solve(page);
      }

      // Final submission
      await page.click('button:has-text("Submit"), input[value="Submit"]');
      await page.waitForLoadState('networkidle');

      const reference = await this.extractReference(page);

      return {
        success: true,
        reference,
        screenshotPath: await this.captureConfirmation(page),
        method: 'oracle_taleo',
        durationMs: 0,
      };
    } finally {
      await browser.close();
    }
  }

  async extractReference(page: Page): Promise<string | null> {
    const el = page.locator('.requisition-id, .application-id, [class*="confirmation"]').first();
    if (await el.isVisible()) return el.textContent();
    return null;
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    return (await page.locator('.g-recaptcha, [data-sitekey]').isVisible());
  }
}
```

---

### PageUpAdapter

```typescript
class PageUpAdapter implements SubmissionAdapter {
  platformName = 'PageUp';

  canHandle(opportunity: Opportunity): boolean {
    return opportunity.intelligence.applicationPlatform === 'pageup';
  }

  async submit(
    user: SkillsPassport,
    opportunity: Opportunity,
    docs: GeneratedDocuments
  ): Promise<SubmissionResult> {
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await (await browser.newContext()).newPage();

    try {
      await page.goto(opportunity.applicationUrl, { waitUntil: 'networkidle' });

      // PageUp standard selectors
      await page.fill('[name="first_name"], #first_name', user.displayName?.split(' ')[0] ?? '');
      await page.fill('[name="last_name"], #last_name', user.displayName?.split(' ').slice(1).join(' ') ?? '');
      await page.fill('[name="email"], #email', user.email ?? '');
      await page.fill('[name="mobile"], #mobile', user.whatsappNumber ?? '');

      // PageUp CV upload
      const fileInput = page.locator('input[type="file"][accept*="pdf"]').first();
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles(docs.cvPath);
      }

      // Cover letter text field
      const coverField = page.locator('textarea[name*="cover"]').first();
      if (await coverField.isVisible()) {
        await coverField.fill(docs.coverLetterText);
      }

      if (await this.detectCaptcha(page)) {
        await this.captchaSolver.solve(page);
      }

      await page.click('button[type="submit"], input[type="submit"]');
      await page.waitForLoadState('networkidle');

      return {
        success: true,
        reference: await this.extractReference(page),
        screenshotPath: await this.captureConfirmation(page),
        method: 'pageup',
        durationMs: 0,
      };
    } finally {
      await browser.close();
    }
  }

  async extractReference(page: Page): Promise<string | null> {
    const el = page.locator('.application-reference, [class*="reference-number"]').first();
    if (await el.isVisible()) return el.textContent();
    return null;
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    return (await page.locator('.g-recaptcha').isVisible());
  }
}
```

---

### MersetaPortalAdapter

```typescript
class MersetaPortalAdapter implements SubmissionAdapter {
  platformName = 'MERSETA Portal';
  // Fixed structure — updated when MERSETA changes their portal
  // Currently: merseta.org.za/learnerships/apply

  canHandle(opportunity: Opportunity): boolean {
    return opportunity.intelligence.applicationPlatform === 'merseta_portal';
  }

  async submit(
    user: SkillsPassport,
    opportunity: Opportunity,
    docs: GeneratedDocuments
  ): Promise<SubmissionResult> {
    // MERSETA portal has a pre-authenticated session approach
    // We maintain a Skilved service account on MERSETA portal
    // and submit applications under the user's name/details
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.newContext({
      storageState: await this.getMersetaSession(), // pre-authenticated
    });
    const page = await context.newPage();

    try {
      await page.goto(`https://merseta.org.za/apply/${opportunity.externalId}`);

      // MERSETA-specific field mapping
      await page.fill('#applicant_name', user.displayName ?? '');
      await page.fill('#applicant_email', user.email ?? '');
      await page.fill('#applicant_phone', user.whatsappNumber ?? '');
      await page.fill('#nqf_level', String(user.highestNqfLevel));
      await page.fill('#trade_category', user.primaryTrade);
      await page.fill('#province', user.province);
      await page.fill('#years_experience', String(user.yearsExperience));

      // Upload CV
      await page.setInputFiles('#cv_upload', docs.cvPath);

      // MERSETA motivation letter (shorter than cover letter)
      await page.fill('#motivation', docs.coverLetterText.substring(0, 500));

      await page.click('#submit_application');
      await page.waitForSelector('.application-success');

      const reference = await page.locator('.application-reference').textContent();

      return {
        success: true,
        reference,
        screenshotPath: await this.captureConfirmation(page),
        method: 'merseta_portal',
        durationMs: 0,
      };
    } finally {
      await browser.close();
    }
  }

  async extractReference(page: Page): Promise<string | null> {
    return page.locator('.application-reference').textContent();
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    return false; // MERSETA portal does not currently use CAPTCHA
  }
}
```

---

### EmailSubmitter

```typescript
class EmailSubmitter implements SubmissionAdapter {
  platformName = 'Email (Gmail API / SMTP)';

  canHandle(opportunity: Opportunity): boolean {
    return !!(
      opportunity.applicationEmail ||
      opportunity.intelligence.applicationPlatform === 'email_only'
    );
  }

  async submit(
    user: SkillsPassport,
    opportunity: Opportunity,
    docs: GeneratedDocuments
  ): Promise<SubmissionResult> {
    // FR-12.27: Validate email before attempting send
    if (!opportunity.applicationEmail || !this.isValidEmail(opportunity.applicationEmail)) {
      await this.logInvalidEmail(opportunity);
      return {
        success: false,
        failureReason: 'invalid_application_email',
        fallbackAction: 'route_to_generic_playwright_or_manual',
        reference: null,
        method: 'email_only',
        durationMs: 0,
      };
    }

    // FR-12.25: Hybrid email + portal — portal registration must happen first
    if (opportunity.requiresAccountCreation) {
      const portalRegistered = await this.ensurePortalRegistration(user, opportunity);
      if (!portalRegistered) {
        // FR-12.26: Portal registration failed — do NOT send email, HOLD
        return {
          success: false,
          failureReason: 'portal_registration_failed_in_hybrid_flow',
          fallbackAction: 'hold_and_notify_user',
          reference: null,
          method: 'email_only',
          durationMs: 0,
        };
      }
    }

    const emailContent = await this.composeEmail(user, opportunity, docs);

    // Try Gmail API first, fall back to SMTP
    try {
      await this.gmailSender.send(emailContent);
    } catch {
      await this.smtpSender.send(emailContent);
    }

    return {
      success: true,
      reference: `EMAIL-${Date.now()}`,
      method: opportunity.requiresAccountCreation ? 'email_only+portal_registration' : 'email_only',
      durationMs: 0,
    };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async logInvalidEmail(opportunity: Opportunity): Promise<void> {
    await bigquery.insert('application_submissions', {
      opportunity_id: opportunity.id,
      failure_reason: 'invalid_application_email',
      email_value: opportunity.applicationEmail ?? 'null',
      logged_at: new Date(),
    });
  }

  private async ensurePortalRegistration(
    user: SkillsPassport,
    opportunity: Opportunity
  ): Promise<boolean> {
    const accountManager = new ATSAccountManager();
    try {
      await accountManager.ensureUserRegisteredOnPlatform(
        opportunity.intelligence.applicationPlatform,
        user
      );
      return true;
    } catch (err) {
      console.error(`Portal registration failed for ${opportunity.organisation}:`, err);
      return false;
    }
  }

  private async composeEmail(
    user: SkillsPassport,
    opportunity: Opportunity,
    docs: GeneratedDocuments
  ): Promise<EmailContent> {
    return {
      to: opportunity.applicationEmail,
      from: `${user.displayName} via Skilved <applications@skilved.com>`,
      replyTo: user.email,
      subject: `Application: ${opportunity.title} — ${user.displayName}`,
      body: docs.coverLetterText,
      attachments: [
        { path: docs.cvPath, name: `CV_${user.displayName.replace(' ', '_')}.pdf` },
      ],
    };
  }

  async extractReference(page: Page): Promise<string | null> { return null; }
  async detectCaptcha(page: Page): Promise<boolean> { return false; }
}
```

---

## CAPTCHA Solving Integration

### The Problem
SuccessFactors, Oracle Taleo, and some SETA portals use reCAPTCHA v2/v3 on their submission forms. Without solving these, the Application Agent would fail on 45%+ of opportunities.

### The Solution: 2captcha / CapSolver API

Cost: ~R0.18 per solve (R0.01 USD). For 34 applications/day, this is under R6/day — negligible.

```typescript
class CaptchaSolver {
  private apiKey: string;
  private provider: '2captcha' | 'capsolver';
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CAPTCHA_SOLVER_API_KEY;
    this.provider = (process.env.CAPTCHA_SOLVER_PROVIDER as any) || '2captcha';
    this.baseUrl = this.provider === '2captcha'
      ? 'https://2captcha.com/in.php'
      : 'https://api.capsolver.com/createTask';
  }

  async solve(page: Page): Promise<void> {
    const captchaType = await this.detectType(page);

    switch (captchaType) {
      case 'recaptcha_v2':
        await this.solveRecaptchaV2(page);
        break;
      case 'recaptcha_v3':
        await this.solveRecaptchaV3(page);
        break;
      case 'hcaptcha':
        await this.solveHCaptcha(page);
        break;
      default:
        throw new Error(`Unknown CAPTCHA type: ${captchaType}`);
    }
  }

  private async solveRecaptchaV2(page: Page): Promise<void> {
    const sitekey = await page.getAttribute('.g-recaptcha', 'data-sitekey')
      ?? await page.getAttribute('[data-sitekey]', 'data-sitekey');
    const pageUrl = page.url();

    if (!sitekey) throw new Error('Could not extract reCAPTCHA sitekey');

    // Submit to 2captcha
    const submitResponse = await fetch(
      `https://2captcha.com/in.php?key=${this.apiKey}&method=userrecaptcha&googlekey=${sitekey}&pageurl=${pageUrl}`
    );
    const taskId = (await submitResponse.text()).split('|')[1];

    // Poll for solution (typically 15–45 seconds)
    let token: string | null = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise(r => setTimeout(r, 5000));
      const pollResponse = await fetch(
        `https://2captcha.com/res.php?key=${this.apiKey}&action=get&id=${taskId}`
      );
      const result = await pollResponse.text();
      if (result.startsWith('OK|')) {
        token = result.split('|')[1];
        break;
      }
    }

    if (!token) throw new Error('CAPTCHA solving timed out');

    // Inject solution into page
    await page.evaluate((t) => {
      const textarea = document.getElementById('g-recaptcha-response') as HTMLTextAreaElement;
      if (textarea) textarea.value = t;
      // Trigger callback if exists
      if ((window as any).grecaptcha?.callback) {
        (window as any).grecaptcha.callback(t);
      }
    }, token);

    // Brief wait for form to process the CAPTCHA
    await page.waitForTimeout(1000);
  }

  private async detectType(page: Page): Promise<string> {
    if (await page.locator('.g-recaptcha, iframe[src*="recaptcha"]').isVisible()) {
      return 'recaptcha_v2';
    }
    if (await page.locator('script[src*="recaptcha/api.js?render"]').isVisible()) {
      return 'recaptcha_v3';
    }
    if (await page.locator('.h-captcha, iframe[src*="hcaptcha"]').isVisible()) {
      return 'hcaptcha';
    }
    return 'unknown';
  }
}
```

### Environment Variables Required
```bash
CAPTCHA_SOLVER_API_KEY=your_2captcha_or_capsolver_key
CAPTCHA_SOLVER_PROVIDER=2captcha  # or capsolver
CAPTCHA_MAX_WAIT_SECONDS=120
```

---

## Account Management Strategy

Many ATS portals require a candidate account before applying. Two approaches:

### Approach A: Service Account (Preferred for MVP)
Skilved maintains one pre-created service account per ATS platform. All applications submitted through this account with user's details filled in form fields. Simpler, faster to build.

**Limitation:** Some portals associate all applications with one account, which could cause duplicate detection issues at high volume.

### Approach B: Per-User Account Creation (Phase 2)
Application Agent creates a new account for each user on each ATS platform it submits to. More correct, more complex.

**For MVP:** Use Approach A with monitoring. Move to Approach B if duplicate issues arise.

```typescript
class ATSAccountManager {
  private serviceAccounts: Map<ATSPlatform, ServiceAccount>;

  async getAuthenticatedSession(platform: ATSPlatform): Promise<StorageState> {
    const account = this.serviceAccounts.get(platform);
    if (!account || await this.isSessionExpired(account)) {
      await this.refreshSession(platform, account);
    }
    return account.storageState;
  }

  /**
   * FR-38.14 / FR-38.17: Check whether a service account is configured and active
   * for the given ATS platform. Used by SubmissionRouter before routing.
   */
  async hasActiveServiceAccount(platform: ATSPlatform): Promise<boolean> {
    const account = this.serviceAccounts.get(platform);
    if (!account) return false;
    // Verify session is still valid (not expired, not rate-limited)
    return !(await this.isSessionExpired(account));
  }

  /**
   * FR-12.25: Register or verify user presence on a portal platform.
   * Approach A (MVP): verify service account session is valid and ready.
   * Approach B (Phase 2): create a per-user account on the platform.
   */
  async ensureUserRegisteredOnPlatform(
    platform: ATSPlatform,
    user: SkillsPassport
  ): Promise<void> {
    const mode = process.env.ACCOUNT_CREATION_MODE ?? 'service_account'; // 'service_account' | 'per_user'

    if (mode === 'per_user') {
      // Approach B: Create per-user account on the ATS platform
      await this.createPerUserAccount(platform, user);
    } else {
      // Approach A: Just verify service account session is fresh
      await this.getAuthenticatedSession(platform);
    }
  }

  private async createPerUserAccount(platform: ATSPlatform, user: SkillsPassport): Promise<void> {
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await (await browser.newContext()).newPage();
    const registrationUrl = this.getRegistrationUrl(platform);

    await page.goto(registrationUrl);
    await page.fill('input[type="email"]', user.email);
    await page.fill('input[name="firstName"]', user.firstName);
    await page.fill('input[name="lastName"]', user.lastName);
    // Platform-specific fields filled via Playwright selectors
    await this.fillPlatformSpecificFields(page, platform, user);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Store credentials for future submissions
    await this.storeUserPlatformCredentials(platform, user, page);
    await browser.close();
  }

  private async refreshSession(platform: ATSPlatform, account: ServiceAccount): Promise<void> {
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await (await browser.newContext()).newPage();

    await page.goto(account.loginUrl);
    await page.fill('#email, input[type="email"]', account.email);
    await page.fill('#password, input[type="password"]', account.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    account.storageState = await browser.contexts()[0].storageState();
    account.lastRefreshed = new Date();
    await browser.close();
  }
}
```

---

## Analyst Agent ATS Detection

The Analyst Agent detects the ATS platform during opportunity extraction so Application Agent never has to discover it at runtime.

```typescript
class ATSDetector {
  detect(url: string, pageTitle?: string, htmlSnippet?: string): ATSDetectionResult {

    // High confidence URL-based detection
    const urlPatterns: [RegExp, ATSPlatform][] = [
      [/successfactors\.com|sap\.com\/careers/i, 'successfactors'],
      [/taleo\.net|oraclecloud\.com\/hcm/i, 'oracle_taleo'],
      [/pageuppeople\.com|pageup\.com/i, 'pageup'],
      [/merseta\.org\.za\/apply/i, 'merseta_portal'],
      [/ewseta\.org\.za\/apply/i, 'ewseta_portal'],
      [/ceta\.org\.za\/apply/i, 'ceta_portal'],
      [/pnet\.co\.za|careerjunction\.co\.za/i, 'job_board_hosted'],
    ];

    for (const [pattern, platform] of urlPatterns) {
      if (pattern.test(url)) {
        return { platform, confidence: 'high' };
      }
    }

    // Medium confidence HTML content detection
    if (htmlSnippet) {
      if (htmlSnippet.includes('SuccessFactors') || htmlSnippet.includes('sf-ui')) {
        return { platform: 'successfactors', confidence: 'medium' };
      }
      if (htmlSnippet.includes('Taleo') || htmlSnippet.includes('taleo')) {
        return { platform: 'oracle_taleo', confidence: 'medium' };
      }
    }

    // Email application detection
    if (url.startsWith('mailto:')) {
      return { platform: 'email_only', confidence: 'high' };
    }

    return { platform: 'unknown', confidence: 'low' };
  }
}

interface ATSDetectionResult {
  platform: ATSPlatform;
  confidence: 'high' | 'medium' | 'low';
}
```

**This field is stored on every opportunity and used by the SubmissionRouter.**

---

## Submission Router

```typescript
class SubmissionRouter {
  private adapters: Map<ATSPlatform, SubmissionAdapter>;
  private accountManager: ATSAccountManager;

  constructor() {
    this.adapters = new Map([
      ['successfactors', new SuccessFactorsAdapter()],
      ['oracle_taleo', new OracleTaleoAdapter()],
      ['pageup', new PageUpAdapter()],
      ['merseta_portal', new MersetaPortalAdapter()],
      ['ewseta_portal', new EwsetaPortalAdapter()],
      ['ceta_portal', new CetaPortalAdapter()],
      ['email_only', new EmailSubmitter()],
    ]);
    this.accountManager = new ATSAccountManager();
  }

  async route(opportunity: Opportunity): Promise<SubmissionAdapter> {
    const platform = opportunity.intelligence?.applicationPlatform ?? 'unknown';

    // Check account readiness BEFORE routing (FR-38.14, FR-38.17)
    if (opportunity.requiresAccountCreation) {
      const accountReady = await this.accountManager.hasActiveServiceAccount(platform);
      if (!accountReady) {
        throw new AccountNotReadyError(
          `Platform "${platform}" requires account creation but no service account is configured. ` +
          `HOLD application — notify user.`
        );
      }
    }

    // Check CAPTCHA solver readiness (FR-38.15)
    if (opportunity.captchaLikely) {
      const captchaAvailable = await this.captchaSolver.isAvailable();
      if (!captchaAvailable) {
        throw new CaptchaSolverUnavailableError(
          `Platform "${platform}" likely has CAPTCHA but solver is unavailable. ` +
          `HOLD application — retry when solver quota refreshes.`
        );
      }
    }

    // Use pre-detected platform from Analyst Agent
    if (this.adapters.has(platform)) {
      return this.adapters.get(platform)!;
    }

    // Fallback hierarchy
    if (opportunity.applicationEmail) {
      return this.adapters.get('email_only')!;
    }

    // Generic Playwright for unknown portals
    return new GenericPlaywrightSubmitter({
      captchaSolver: new CaptchaSolver(),
      fallbackToEmail: !!opportunity.applicationEmail,
      maxRetries: 3,
    });
  }
}
```

---

## BigQuery Logging

Every application attempt logged with adapter details for XPRIZE audit trail.

```sql
-- application_submissions table addition
ALTER TABLE skilved_prod.applications
ADD COLUMN ats_platform STRING,
ADD COLUMN ats_adapter_version STRING,
ADD COLUMN captcha_encountered BOOL,
ADD COLUMN captcha_solved BOOL,
ADD COLUMN submission_attempts INT64,
ADD COLUMN submission_duration_ms INT64;
```

**XPRIZE query — show adapter breakdown:**
```sql
SELECT
  ats_platform,
  COUNT(*) as applications,
  COUNTIF(submission_success) as successes,
  AVG(submission_duration_ms) as avg_duration_ms,
  COUNTIF(captcha_encountered) as captcha_encounters,
  COUNTIF(captcha_solved) as captchas_solved,
  SUM(human_approvals_required) as human_approvals  -- always 0
FROM skilved_prod.applications
WHERE initiated_by = 'application_agent'
GROUP BY ats_platform
ORDER BY applications DESC
```

---

## Failure Handling

```typescript
class ApplicationFailureHandler {
  async handle(
    failure: SubmissionResult,
    user: SkillsPassport,
    opportunity: Opportunity
  ): Promise<void> {

    // Log to BigQuery
    await this.logFailure(failure, user, opportunity);

    // User notification
    const message = this.buildFailureMessage(failure, opportunity);
    await this.whatsapp.send(user.whatsappNumber, message);

    // Add to manual fallback queue if form changed
    if (failure.failureReason === 'form_structure_changed') {
      await this.addToFallbackQueue(opportunity);
      await this.notifyEngineeringTeam(failure, opportunity);
    }

    // Try email fallback if available
    if (
      failure.failureReason !== 'duplicate_application' &&
      opportunity.applicationEmail
    ) {
      const emailAdapter = new EmailSubmitter();
      await emailAdapter.submit(user, opportunity,
        await this.regenerateDocs(user, opportunity));
    }
  }

  buildFailureMessage(failure: SubmissionResult, opp: Opportunity): string {
    return [
      `I couldn't complete your application to ${opp.organisation} automatically.`,
      `Reason: ${this.humanizeFailureReason(failure.failureReason)}`,
      `Here's the direct link to apply manually:`,
      opp.applicationUrl,
      `Sorry for the inconvenience — I've flagged this for our team.`,
    ].join('\n');
  }
}
```

**Manual Fallback List** — maintained in environment variable. Opportunities with consistently failing forms are added here and always use email method:
```bash
PLAYWRIGHT_MANUAL_FALLBACK_LIST=eskom.co.za/apply/v2,transnet.net/legacy
```

---

*Document version 1.0 — June 2026*
*Owner: Engineering*
*NEW in v5.0 — ATS Adapter Strategy with full implementation specs*
