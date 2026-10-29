export const dayInSA = now => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg',
  year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
