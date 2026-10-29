import { DateSchema, InstantSchema } from '@skilved/types/opportunities';
import { dayInSA } from './south-african-time.mjs';

export const ORIGINAL_DEADLINE_VERSION = 'original_deadline_v1';
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/** Decode explicit source values only. Never guess a timezone, normalize a bad
 * calendar date, or move a midnight cutoff to the preceding calendar day.
 */
export function parseOriginalDeadline(raw) {
  if (typeof raw !== 'string' || raw.length > 100) return null;
  const evidence = (format, writtenDate, instant) => {
    const localDate = instant === null ? writtenDate : dayInSA(instant);
    if (!DateSchema.safeParse(localDate).success) return null;
    return { version: ORIGINAL_DEADLINE_VERSION, raw, format, writtenDate, instant,
      timeZone: 'Africa/Johannesburg', localDate, dayShift: writtenDate !== localDate };
  };
  if (DateSchema.safeParse(raw).success) return evidence('calendar_date', raw, null);
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/);
  if (iso) {
    const [,date,hour,minute,second,,offset] = iso;
    // Unknown local offsets, leap seconds, 24:00 and invalid clock components
    // remain unsupported even if a platform's Date parser would normalize them.
    if (!DateSchema.safeParse(date).success || +hour > 23 || +minute > 59 || +second > 59 || offset === '-00:00' ||
        offset !== 'Z' && (+offset.slice(1,3) > 23 || +offset.slice(4,6) > 59)) return null;
    const stamp = Date.parse(raw); if (!Number.isFinite(stamp)) return null;
    const instant = new Date(stamp).toISOString();
    if (!InstantSchema.safeParse(instant).success) return null;
    return evidence('iso_zoned', date, instant);
  }
  // Narrow Java-style serialization: explicit UTC/GMT only. Other timezone
  // abbreviations, localized months, prose, offsets and omitted weekdays are held.
  const legacy = raw.match(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{2}) (\d{2}):(\d{2}):(\d{2}) (UTC|GMT) (\d{4})$/);
  if (!legacy) return null;
  const [,weekday,month,day,hour,minute,second,,year] = legacy;
  const date = `${year}-${String(months.indexOf(month)+1).padStart(2,'0')}-${day}`;
  if (!DateSchema.safeParse(date).success || +hour > 23 || +minute > 59 || +second > 59) return null;
  const instant = `${date}T${hour}:${minute}:${second}.000Z`;
  if (!InstantSchema.safeParse(instant).success || weekdays[new Date(instant).getUTCDay()] !== weekday) return null;
  return evidence('legacy_utc', date, instant);
}
