import { IdSchema } from "@skilved/types/opportunities"

export type ApplicationRecoveryReason = "changed" | "closed" | "unavailable" | "missing" | "review" | "moved" | "method" | "invalid"
const copy = {
  invalid:{title:"This application link needs a fresh check.",body:"Open the current details and choose the application route from the listing."},
  changed:{title:"The application details have changed.",body:"Review the current notice before choosing its application route again."},
  closed:{title:"This intake is closed.",body:"The application route is no longer offered. Your saved reference can remain in your workspace."},
  unavailable:{title:"We couldn’t check the application details.",body:"The current listing could not be loaded. This does not establish that the intake has closed or been removed."},
  missing:{title:"This listing is no longer available.",body:"A current application route could not be found. Browse the feed for other notices."},
  review:{title:"This opportunity needs a fresh check.",body:"The application route needs review before it can be offered."},
  moved:{title:"This reference leads to another listing.",body:"Review the current listing before choosing an application route."},
  method:{title:"Check the application instructions.",body:"This notice does not offer a portal or email route here. Review its current application method and destination."},
}
const escape = (value:string) => value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")
export function applicationRecoveryHtml(id:string,reason:ApplicationRecoveryReason) {
  const safeId=IdSchema.safeParse(id).success ? id : null
  const details=safeId ? `/opportunities/${safeId}#application-heading` : "/"
  const content=copy[reason]
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Application details · Skilved</title><style>
:root{color-scheme:light dark;--bg:#f4f7f4;--card:#fff;--ink:#263d32;--muted:#66766c;--line:#d8e1da;--accent:#315d48}
@media(prefers-color-scheme:dark){:root{--bg:#15231b;--card:#1d2e23;--ink:#edf3ee;--muted:#b1c3b6;--line:#3c5042;--accent:#a6d5b5}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,sans-serif;line-height:1.8}header{border-bottom:1px solid var(--line);padding:22px 6vw}header a{font-size:26px;letter-spacing:-1px;font-weight:700;text-decoration:none}main{max-width:720px;margin:8vh auto;padding:0 24px}article{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:36px}small{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)}h1{font-size:clamp(28px,5vw,42px);line-height:1.2;letter-spacing:-1px;font-weight:550;margin:20px 0}p{font-size:15px;color:var(--muted);overflow-wrap:anywhere}nav{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}a{color:var(--accent);text-underline-offset:4px}nav a{display:inline-flex;align-items:center;min-height:48px;padding:10px 16px;border:1px solid var(--line);border-radius:8px;font-size:14px}nav a:first-child{background:var(--accent);color:var(--bg);border-color:var(--accent)}footer{font-size:13px;color:var(--muted);margin:20px 4px}footer a{display:inline-flex;align-items:center;min-height:44px}a:focus-visible{outline:3px solid var(--accent);outline-offset:4px}@media(max-width:500px){main{margin:30px auto;padding:0 16px}article{padding:24px}nav{display:grid}nav a{justify-content:center}}
</style></head><body><header><a href="/">skilved.</a></header><main><article><small>Before your next step</small><h1>${escape(content.title)}</h1><p>${escape(content.body)}</p><p>No application was submitted by this check.</p><nav aria-label="Your next step"><a href="${escape(details)}">Review current details ↗</a><a href="/">Explore the feed</a></nav></article><footer><a href="/saved">Return to your saved opportunities</a></footer></main></body></html>`
}
