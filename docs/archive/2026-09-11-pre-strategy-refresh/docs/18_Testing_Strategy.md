# Skilved — Testing Strategy
### Unit + Integration + Agent + E2E | Version 1.0 | June 2026

---

## Testing Philosophy

Three rules:

1. **Test agent behaviour, not implementation.** Agents are the core of the product. Tests should verify they make correct decisions — not that they call specific functions in a specific order.

2. **The graph is sacred — test it ruthlessly.** Every outcome write to BigQuery must be tested. Corrupt graph data is worse than no data.

3. **Speed over coverage in MVP.** 70% coverage shipping on Day 7 beats 95% coverage shipping on Day 14. Focus tests on: agent decision logic, data writes, and the feed ranking.

---

## Test Stack

| Layer | Tool | Purpose |
|---|---|---|
| Unit | Vitest | Component logic, utility functions, agent decision logic |
| Integration | Vitest + Firebase Emulator | API routes, Firestore operations |
| Agent | Vitest + mocked Gemini | Agent end-to-end decision flows |
| E2E | Playwright | Critical user journeys (feed, apply, signup) |
| Performance | k6 | Feed API load testing |

---

## Unit Tests

### What to unit test

```
packages/utils/         → All utility functions (100% coverage target)
packages/types/         → Type guards and validators
apps/web/src/lib/       → matching.ts, share.ts, seo.ts
apps/web/src/utils/     → All utility functions
apps/agents/*/src/      → Decision logic classes
```

### Example: Quality agent rule engine

```typescript
// apps/agents/quality/src/rules/RulesEngine.test.ts
import { describe, it, expect } from 'vitest';
import { RulesEngine } from './RulesEngine';

describe('RulesEngine', () => {
  const engine = new RulesEngine();

  describe('auto-reject conditions', () => {
    it('rejects opportunities with null application URL', () => {
      const opp = mockOpportunity({ applicationUrl: null });
      const result = engine.evaluate(opp);
      expect(result.decision).toBe('reject');
      expect(result.reason).toContain('application_url');
    });

    it('rejects expired opportunities', () => {
      const opp = mockOpportunity({
        deadline: new Date('2020-01-01')  // past date
      });
      const result = engine.evaluate(opp);
      expect(result.decision).toBe('reject');
    });

    it('rejects obvious scam patterns', () => {
      const scamPatterns = [
        'earn R5000 daily',
        'click here to apply',
        'no experience needed, earn R50000'
      ];
      scamPatterns.forEach(title => {
        const opp = mockOpportunity({ title });
        const result = engine.evaluate(opp);
        expect(result.decision).toBe('reject');
      });
    });

    it('publishes high-quality SETA opportunity', () => {
      const opp = mockOpportunity({
        organisation: 'MERSETA',
        title: 'Electrical Apprenticeship 2026',
        applicationUrl: 'https://merseta.org.za/apply/12345',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        province: 'gauteng',
        tradeCategory: 'electrical'
      });
      const result = engine.evaluate(opp);
      expect(result.decision).toBe('publish');
    });
  });

  describe('quality scoring', () => {
    it('scores SETA sources higher than anonymous job boards', () => {
      const setaOpp = mockOpportunity({ sourceName: 'MERSETA' });
      const jobBoardOpp = mockOpportunity({ sourceName: 'unknown_board' });
      
      const setaScore = engine.score(setaOpp);
      const jobBoardScore = engine.score(jobBoardOpp);
      
      expect(setaScore).toBeGreaterThan(jobBoardScore);
    });
  });
});
```

### Example: Matching score tests

```typescript
// apps/agents/matching/src/scoring/CompositeScorer.test.ts
import { describe, it, expect } from 'vitest';
import { CompositeScorer } from './CompositeScorer';

describe('CompositeScorer', () => {
  const scorer = new CompositeScorer();

  it('scores perfect trade + province match highest', () => {
    const user = mockUser({
      primaryTrade: 'electrical',
      province: 'gauteng',
      nqfLevel: 3
    });
    const opp = mockOpportunity({
      tradeCategory: 'electrical',
      province: 'gauteng',
      nqfLevelRequired: 3
    });
    
    const score = scorer.score(user, opp);
    expect(score).toBeGreaterThan(0.85);
  });

  it('scores trade mismatch low', () => {
    const user = mockUser({ primaryTrade: 'electrical' });
    const opp = mockOpportunity({ tradeCategory: 'plumbing' });
    
    const score = scorer.score(user, opp);
    expect(score).toBeLessThan(0.3);
  });

  it('penalises overqualified applicants', () => {
    const user = mockUser({ nqfLevel: 8 });          // degree holder
    const opp = mockOpportunity({ nqfLevelRequired: 3 }); // N3 required
    
    const tradeMatchScore = scorer.score(
      mockUser({ primaryTrade: 'electrical', nqfLevel: 8 }),
      mockOpportunity({ tradeCategory: 'electrical', nqfLevelRequired: 3 })
    );
    
    const perfectMatchScore = scorer.score(
      mockUser({ primaryTrade: 'electrical', nqfLevel: 3 }),
      mockOpportunity({ tradeCategory: 'electrical', nqfLevelRequired: 3 })
    );
    
    // Overqualified should score lower than perfect match
    expect(tradeMatchScore).toBeLessThan(perfectMatchScore);
  });
});
```

---

## Integration Tests

### API route tests

```typescript
// apps/web/src/app/api/feed/route.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { testClient } from '@/test/helpers';
import { seedOpportunities } from '@/test/seeds';

describe('GET /api/feed', () => {
  beforeEach(async () => {
    await seedOpportunities([
      mockOpportunity({ tradeCategory: 'electrical', province: 'gauteng', status: 'active' }),
      mockOpportunity({ tradeCategory: 'plumbing', province: 'western_cape', status: 'active' }),
      mockOpportunity({ tradeCategory: 'electrical', province: 'gauteng', status: 'expired' }),
    ]);
  });

  it('returns active opportunities only', async () => {
    const res = await testClient.get('/api/feed');
    const body = await res.json();
    
    expect(res.status).toBe(200);
    expect(body.opportunities).toHaveLength(2);  // not the expired one
  });

  it('filters by trade correctly', async () => {
    const res = await testClient.get('/api/feed?trade=electrical');
    const body = await res.json();
    
    expect(body.opportunities.every(o => o.tradeCategory === 'electrical')).toBe(true);
  });

  it('returns personalised results for authenticated users', async () => {
    const user = await createTestUser({ primaryTrade: 'electrical', province: 'gauteng' });
    
    const anonRes = await testClient.get('/api/feed');
    const authRes = await testClient
      .get('/api/feed')
      .auth(user.idToken);
    
    expect(authRes.body.meta.personalised).toBe(true);
    expect(anonRes.body.meta.personalised).toBe(false);
  });

  it('respects rate limits', async () => {
    const requests = Array(65).fill(null).map(() => testClient.get('/api/feed'));
    const responses = await Promise.all(requests);
    
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### Firestore integration tests

Run against Firebase Emulator:

```typescript
// packages/database/src/firestore/opportunities.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/test/emulator';
import { createOpportunity, getOpportunityBySlug } from './opportunities';

describe('Opportunity operations', () => {
  it('creates and retrieves an opportunity', async () => {
    const data = mockOpportunityData();
    const id = await createOpportunity(data);
    
    const retrieved = await getOpportunityBySlug(data.slug);
    expect(retrieved?.id).toBe(id);
    expect(retrieved?.title).toBe(data.title);
  });

  it('auto-removes expired opportunities', async () => {
    // Create opportunity that expired yesterday
    await createOpportunity(mockOpportunityData({
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }));
    
    // Trigger expiry check
    await runExpiryCheck();
    
    // Should not appear in active feed
    const active = await getActiveOpportunities({ limit: 100 });
    expect(active.every(o => o.status === 'active')).toBe(true);
  });
});
```

---

## Agent Tests

### Discovery agent — extraction accuracy

```typescript
// apps/agents/discovery/src/extractor/GeminiExtractor.test.ts
import { describe, it, expect } from 'vitest';
import { GeminiExtractor } from './GeminiExtractor';

// Use real Gemini in integration mode, mocked in unit mode
const extractor = new GeminiExtractor({ mock: process.env.CI === 'true' });

describe('GeminiExtractor', () => {
  it('extracts electrical apprenticeship correctly', async () => {
    const html = loadFixture('merseta-electrical-apprenticeship.html');
    const result = await extractor.extract(html);
    
    expect(result.tradeCategory).toBe('electrical');
    expect(result.opportunityType).toBe('apprenticeship');
    expect(result.province).toBeTruthy();
    expect(result.applicationUrl).toMatch(/^https?:\/\//);
    expect(result.deadline).toBeInstanceOf(Date);
  });

  it('returns null for non-opportunity content', async () => {
    const html = loadFixture('seta-about-page.html');
    const result = await extractor.extract(html);
    
    // Should recognise this isn't an opportunity listing
    expect(result).toBeNull();
  });

  it('handles missing salary gracefully', async () => {
    const html = loadFixture('opportunity-no-salary.html');
    const result = await extractor.extract(html);
    
    expect(result).not.toBeNull();
    expect(result?.salaryAmount).toBeNull();
    expect(result?.salaryType).toBeNull();
  });
});
```

### Notification agent — digest selection

```typescript
// apps/agents/notification/src/digest/DigestBuilder.test.ts
describe('DigestBuilder', () => {
  it('selects only new opportunities since last digest', async () => {
    const user = mockUser({ lastDigestSentAt: new Date(Date.now() - 24 * 60 * 60 * 1000) });
    const oldOpps = [mockOpportunity({ discoveredAt: new Date(Date.now() - 48 * 60 * 60 * 1000) })];
    const newOpps = [mockOpportunity({ discoveredAt: new Date() })];
    
    const selected = await builder.select(user, [...oldOpps, ...newOpps]);
    
    expect(selected).not.toContain(oldOpps[0]);
    expect(selected).toContain(newOpps[0]);
  });

  it('respects minimum opportunity threshold', async () => {
    const user = mockUser({});
    const oneOpp = [mockOpportunity({})];
    
    // Only 1 opportunity — below minimum of 3
    const selected = await builder.select(user, oneOpp);
    expect(selected).toHaveLength(0);  // returns empty → no digest sent
  });

  it('limits to 5 opportunities per digest', async () => {
    const user = mockUser({});
    const manyOpps = Array(20).fill(null).map(() => mockOpportunity({}));
    
    const selected = await builder.select(user, manyOpps);
    expect(selected.length).toBeLessThanOrEqual(5);
  });
});
```

---

## E2E Tests (Playwright)

### Critical user journeys

```typescript
// e2e/feed.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feed — anonymous user', () => {
  test('loads feed without login', async ({ page }) => {
    await page.goto('/');
    
    // Should show opportunities without any login prompt
    await expect(page.locator('[data-testid="opportunity-card"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="login-wall"]')).not.toBeVisible();
  });

  test('filters by trade', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="filter-electrical"]');
    
    const cards = page.locator('[data-testid="opportunity-card"]');
    await expect(cards.first()).toBeVisible();
    
    // All visible cards should be electrical
    const tradeBadges = page.locator('[data-testid="trade-badge"]');
    const count = await tradeBadges.count();
    for (let i = 0; i < count; i++) {
      await expect(tradeBadges.nth(i)).toHaveText('Electrical');
    }
  });

  test('views full detail without login', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="opportunity-card"]');
    
    await expect(page.locator('[data-testid="opportunity-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="apply-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-wall"]')).not.toBeVisible();
  });

  test('shows soft signup prompt after 3 views', async ({ page }) => {
    await page.goto('/');
    
    // View 3 opportunities
    for (let i = 0; i < 3; i++) {
      await page.locator('[data-testid="opportunity-card"]').nth(i).click();
      await page.goBack();
    }
    
    await expect(page.locator('[data-testid="personalisation-prompt"]')).toBeVisible();
  });

  test('WhatsApp share generates correct message', async ({ page }) => {
    await page.goto('/opportunity/test-apprenticeship-gauteng');
    
    // Mock clipboard
    await page.evaluate(() => {
      navigator.clipboard.writeText = async (text) => {
        window._clipboardContent = text;
      };
    });
    
    await page.click('[data-testid="share-button"]');
    
    const clipboard = await page.evaluate(() => window._clipboardContent);
    expect(clipboard).toContain('skilved.com/opportunity/');
    expect(clipboard).toContain('Skilved');
  });
});

test.describe('Signup flow', () => {
  test('completes signup in under 60 seconds', async ({ page }) => {
    const start = Date.now();
    
    await page.goto('/');
    await page.click('[data-testid="get-skilved-cta"]');
    
    // Fill trade
    await page.click('[data-testid="trade-electrical"]');
    
    // Fill province
    await page.click('[data-testid="province-gauteng"]');
    
    // Submit (skip WhatsApp for test)
    await page.click('[data-testid="skip-whatsapp"]');
    
    await expect(page.locator('[data-testid="personalised-feed"]')).toBeVisible();
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(60000);
  });
});
```

---

## Performance Tests (k6)

```javascript
// k6/feed-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // ramp up to 50 users
    { duration: '1m', target: 50 },    // steady 50 users
    { duration: '30s', target: 200 },  // spike to 200 users
    { duration: '30s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p95<1500'],   // 95% of requests under 1.5s
    http_req_failed: ['rate<0.01'],    // < 1% error rate
  },
};

export default function () {
  const res = http.get('https://staging.skilved.com/api/feed', {
    headers: { 'X-Session-ID': `test-session-${__VU}` },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has opportunities': (r) => JSON.parse(r.body).opportunities.length > 0,
    'response time < 1.5s': (r) => r.timings.duration < 1500,
  });

  sleep(1);
}
```

Run before every production release:
```bash
k6 run k6/feed-load-test.js
```

---

## Test Data & Fixtures

```
apps/agents/discovery/src/__fixtures__/
  merseta-electrical-apprenticeship.html
  ewseta-solar-learnership.html
  seta-about-page.html                 ← non-opportunity page
  opportunity-no-salary.html
  expired-opportunity.html
  scam-opportunity.html

apps/web/src/__fixtures__/
  opportunities/
    electrical-gauteng.json
    plumbing-western-cape.json
  users/
    unregistered-session.json
    registered-electrical-gauteng.json
    trade-tested-plumber.json
```

---

## Coverage Targets

| Area | Target | Priority |
|---|---|---|
| Agent decision logic | 90% | Critical |
| BigQuery writes | 100% | Critical (graph integrity) |
| API route handlers | 80% | High |
| Firestore operations | 85% | High |
| UI components | 60% | Medium |
| Utility functions | 95% | High |
| E2E critical paths | 5 journeys | Critical |

---

*Document version 1.0 — June 2026*  
*Owner: Engineering*
