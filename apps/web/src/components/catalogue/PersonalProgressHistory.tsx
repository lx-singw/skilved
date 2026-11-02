import type { LocalProgressItem } from "@skilved/types/opportunities"

export function LocalTime({ value }: { value:string }) {
  return <time dateTime={value}>{new Date(value).toLocaleString("en-ZA",{dateStyle:"long",timeStyle:"short"})}</time>
}
export function PersonalProgressHistory({ item }: { item:LocalProgressItem }) {
  return <div className="personal-record-history">
    <p>These are your personal notes about progress, not an issuer’s records. You can change your stage.</p>
    <dl>
      <div><dt>Saved in this browser</dt><dd><LocalTime value={item.savedAt}/></dd></div>
      <div><dt>Last local update</dt><dd><LocalTime value={item.updatedAt}/></dd></div>
      {item.reportedAppliedAt && <div><dt>Applied — marked by you</dt><dd><LocalTime value={item.reportedAppliedAt}/></dd></div>}
      {item.lastRouteOpenedAt && <div><dt>Last route-opening action recorded</dt><dd><LocalTime value={item.lastRouteOpenedAt}/></dd></div>}
    </dl>
    {item.reportedAppliedAt && <p>Applied is your own report. Skilved has not confirmed submission. The earlier report time is retained if you change your stage.</p>}
    <p>{item.lastRouteOpenedAt ? "A route-opening record does not confirm that the issuer’s page loaded or that you submitted." : "No route-opening action is recorded in this browser."}</p>
    <p className="personal-record-zone">Times use this browser’s local timezone.</p>
  </div>
}
