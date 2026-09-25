# Local browser observations — B02 candidate

25 September 2026. Desktop Codex in-app browser, explicit 375 × 667 and 1280 × 800 viewport overrides, localhost loopback. Browser emulation, not a physical Android or participant test. Screenshots were captured from the rendered pages; none was resized to pretend it represented a different device.

## Canonical inspection

- Ten fictional cases render from the actual parser/projector: six categories, an additional graduate internship, unknown deadline/pay, withheld status and a reviewed explanation. Legacy conversion is displayed as manual review.
- At viewport width 375, document scroll width was 360; at 1280, scroll width was 1265 (scrollbar space). No horizontal overflow observed in those checks, including an expanded JSON panel on narrow view.
- Navigation links measured about 47.6 pixels high; inspection summaries about 45.6 pixels high. Tab from Bursary moved to Learnership. Enter opened the public-JSON details panel.
- No script elements exist in the generated inspection HTML; no warning/error console entries were reported during the inspection. Links are in-page fixture navigation, not external application actions.
- [Narrow inspection screenshot](contracts-mobile.png); [wide inspection screenshot](contracts-wide.png).

## B01 task harness after local corrections

- At 375 × 667, filters measured 160 × 44, detail controls 298 × 44 and close control 44 × 44. Document scroll width was 360.
- Opening details moved focus to Close modal. Shift+Tab wrapped to the handoff control. The background carried the inert attribute.
- Opening advisory moved focus to Simulate handoff and made the underlying detail dialog inert. Escape returned to handoff; a second Escape closed details and restored focus to the triggering card. The background inert attribute was removed.
- Fictional labels appeared in detail and advisory. Handoff text now explicitly states that no external website opens; the fee warning asks for source verification without the earlier blanket guarantee.
- [Narrow task-harness screenshot](prototype-mobile.png). This image shows the fixture feed, while dialog behavior is recorded above.

## Measurement scope

[Raw local HTTP measurements](local-http-measurements.json) record two requests to each harness endpoint. The inspection body was 91,052 bytes with no scripts; the task prototype body was 21,526 bytes with one inline script. Both use no-store, with no external page assets referenced. Calculated gzip sizes are estimates, **not the content encoding served by this local harness**. First/repeat request timings were loopback observations, not browser cold/repeat-cache, production TTFB or South African mobile network results.

No throttled 3G trace, LCP/INP/CLS trace, physical-device RAM/CPU measurement, screen-reader run or human task observation was collected. Those remain explicit measurements/observations before their applicable gates. Provisional performance budgets are not declared passed by these desktop viewport checks.
