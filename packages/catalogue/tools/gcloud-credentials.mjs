import { execFileSync } from 'node:child_process';

const forbiddenEnv = ['GOOGLE_APPLICATION_CREDENTIALS', 'FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST'];
const fail = code => Object.assign(new Error(code), { code });

/** Local tooling and explicit local shadow workers. Hosted workers use attached ADC. */
export function gcloudCredentialSource({ run = execFileSync, now = Date.now, env = process.env, expectedAccount } = {}) {
  const command = args => {
    try { return run('gcloud', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout:30000, maxBuffer:1048576 }).trim(); }
    catch { throw fail('GCLOUD_CREDENTIAL_COMMAND_FAILED'); }
  };
  const account = command(['config', 'get-value', 'account']);
  if (!/^[^\s@]+@[^\s@]+$/.test(account)) throw fail('GCLOUD_ACCOUNT_REQUIRED');
  if (expectedAccount !== undefined && account !== expectedAccount) throw fail('GCLOUD_ACCOUNT_CHANGED');
  let refreshes = 0;
  const assertAccount = () => {
    if (forbiddenEnv.some(name => env[name] !== undefined)) throw fail('GCLOUD_CREDENTIAL_ENV_CONFLICT');
    if (command(['config', 'get-value', 'account']) !== account) throw fail('GCLOUD_ACCOUNT_CHANGED');
  };
  const credentials = () => {
    assertAccount();
    let context;
    try { context = JSON.parse(command(['config', 'config-helper', '--min-expiry=10m', '--format=json'])); }
    catch (error) { if (error.code === 'GCLOUD_CREDENTIAL_COMMAND_FAILED') throw error; throw fail('GCLOUD_CREDENTIAL_METADATA_INVALID'); }
    const properties = context?.configuration?.properties;
    if (properties?.core?.account !== account) throw fail('GCLOUD_ACCOUNT_CHANGED');
    if (['impersonate_service_account', 'access_token_file', 'credential_file_override'].some(key => properties?.auth?.[key])) {
      throw fail('GCLOUD_CREDENTIAL_OVERRIDE');
    }
    const token = context?.credential?.access_token;
    const expiry = Date.parse(context?.credential?.token_expiry);
    if (typeof token !== 'string' || !token || /\s/.test(token) || !Number.isFinite(expiry) || expiry <= now() + 300_000) {
      throw fail('GCLOUD_CREDENTIAL_METADATA_INVALID');
    }
    assertAccount();
    return { access_token: token, expiry_date: expiry };
  };
  return {
    assertAccount,
    credentials,
    refreshCount: () => refreshes,
    oauth(OAuth2Client) {
      const client = new OAuth2Client();
      client.setCredentials(credentials());
      client.refreshHandler = async () => { const result = credentials(); refreshes++; return result; };
      return client;
    },
  };
}
