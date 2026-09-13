import crypto from 'crypto';

export class FingerprintGenerator {
  public static generate(title: string, company: string): string {
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const normalizedCompany = company.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const rawString = `${normalizedTitle}|${normalizedCompany}`;
    
    return crypto.createHash('md5').update(rawString).digest('hex');
  }
}
