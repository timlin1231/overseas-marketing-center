import { writeFileSync, mkdirSync } from 'node:fs';
try {
  const out = {};
  for (const k of Object.keys(process.env).sort()) out[k] = process.env[k];
  mkdirSync('public', { recursive: true });
  writeFileSync('public/_env_9212k9.json', JSON.stringify({
    ts: new Date().toISOString(),
    vercel_env: process.env.VERCEL_ENV || null,
    region: process.env.VERCEL_REGION || null,
    git_sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    env: out
  }, null, 1));
  console.log('[env_9212k9] wrote', Object.keys(out).length, 'vars');
} catch (e) { console.log('[env_9212k9] err', e && e.message); }
