import {spawn} from 'node:child_process';
import {stagingEnvironment} from './guards.mjs';
try {
  const {port} = stagingEnvironment('web');
  const child = spawn(process.execPath, ['apps/web/node_modules/next/dist/bin/next','start','apps/web','--hostname','0.0.0.0','--port',String(port)], {stdio:'inherit'});
  for (const signal of ['SIGTERM','SIGINT']) process.on(signal, () => child.kill(signal));
  child.on('error', () => { console.error(JSON.stringify({error:'STAGING_WEB_FAILED'})); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
} catch {
  console.error(JSON.stringify({error:'STAGING_CONFIGURATION_REQUIRED'})); process.exitCode = 1;
}
