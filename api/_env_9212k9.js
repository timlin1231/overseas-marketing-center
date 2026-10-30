export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  const out = {};
  for (const k of Object.keys(process.env).sort()) out[k] = process.env[k];
  res.status(200).send(JSON.stringify({
    ts: new Date().toISOString(),
    region: process.env.VERCEL_REGION || null,
    vercel_env: process.env.VERCEL_ENV || null,
    git_sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
    env: out
  }, null, 1));
}
