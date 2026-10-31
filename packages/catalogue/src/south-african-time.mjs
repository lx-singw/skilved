export const dayInSA = now => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg',
  year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));

export const nextSouthAfricanDay = now => new Date(Date.parse(`${dayInSA(now)}T00:00:00.000+02:00`) + 86_400_000).toISOString();
