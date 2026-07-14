#!/usr/bin/env node
// magik — the thin Local Magik SDK CLI. No dependencies (Node 18+ global fetch). It talks to
// your Local Magik instance over HTTPS with a workspace API key, so you can build and ship a
// Magik Button without cloning the app.
//
//   node magik.mjs validate  [button.json]   check schema + graph rules
//   node magik.mjs dry-run   [button.json]   preview offline (stub AI, no sends) using answers.json
//   node magik.mjs publish   [button.json]   publish it live to your workspace
//
// Config (from the environment or a local .env):
//   MAGIK_API_KEY   mint one at <your app>/settings/api-keys   (required)
//   MAGIK_URL       your Local Magik URL (default http://localhost:3000)

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadDotEnv() {
  const p = resolve(process.cwd(), '.env')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
loadDotEnv()

const [cmd, fileArg] = process.argv.slice(2)
const KEY = process.env.MAGIK_API_KEY
const BASE = (process.env.MAGIK_URL || 'http://localhost:3000').replace(/\/$/, '')
const file = fileArg || 'button.json'

const die = (m) => { console.error(`✖ ${m}`); process.exit(1) }
const ok = (m) => console.log(`✓ ${m}`)

function loadDef() {
  const p = resolve(process.cwd(), file)
  if (!existsSync(p)) die(`${file} not found (run this from your button project folder)`)
  try { return JSON.parse(readFileSync(p, 'utf8')) } catch (e) { die(`Invalid JSON in ${file}: ${e.message}`) }
}

let announced = false
async function api(path, body) {
  if (!KEY) die('MAGIK_API_KEY is not set. Copy .env.example → .env and paste a key from <your app>/settings/api-keys.')
  if (!announced) { console.log(`→ ${BASE}`); announced = true } // show which instance we're hitting
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify(body),
    })
  } catch (e) {
    die(`Could not reach ${BASE} (${e.message}). Is that your Local Magik URL? Set MAGIK_URL in .env.`)
  }
  const data = await res.json().catch(() => ({}))
  // A recognized-key failure is almost always a wrong MAGIK_URL, not a bad key — say so.
  if (res.status === 401) {
    die(
      `${BASE} didn't recognize your API key.\n` +
      `  • If the key is correct, MAGIK_URL is likely wrong — it must point at the app where you minted the key.\n` +
      `  • You're pointing at: ${BASE}\n` +
      `  • Hosted on Vercel? Use that URL — not http://localhost:3000.`
    )
  }
  return { status: res.status, data }
}

switch (cmd) {
  case 'validate': {
    const def = loadDef()
    const { status, data } = await api('/api/buttons/validate', def)
    if (status !== 200) die(data.error || `validate failed (${status})`)
    if (!data.ok) die(`${file} is invalid:\n  - ${(data.errors || []).join('\n  - ')}`)
    ok(`Valid — ${def.questions?.length ?? 0} questions, ${def.steps?.length ?? 0} steps`)
    break
  }
  case 'dry-run': {
    const def = loadDef()
    let answers = {}
    const ap = resolve(process.cwd(), 'answers.json')
    if (existsSync(ap)) { try { answers = JSON.parse(readFileSync(ap, 'utf8')) } catch { /* ignore */ } }
    const { status, data } = await api('/api/buttons/dry-run', { definition: def, answers })
    if (status !== 200) die(data.error || `dry-run failed (${status})`)
    if (!data.ok) die(`${file} is invalid:\n  - ${(data.errors || []).join('\n  - ')}`)
    console.log(`\n▶ Dry run: ${def.name} (${def.key})\n`)
    for (const r of data.results || []) {
      const icon = r.kind === 'generate' ? '✎' : r.kind === 'task' ? '⏸' : '➤'
      console.log(`  ${icon} ${r.stepId} · ${r.label} — ${r.note}`)
      if (r.body) console.log('      ' + String(r.body).slice(0, 280).replace(/\n/g, '\n      '))
      if (r.params) console.log('      ' + JSON.stringify(r.params))
    }
    console.log('')
    ok('Dry run complete (no external effects).')
    break
  }
  case 'publish': {
    const def = loadDef()
    const { status, data } = await api('/api/buttons', def)
    if (status !== 201) {
      const detail = data.details?.length ? `\n  - ${data.details.join('\n  - ')}` : ''
      die(`${data.error || 'publish failed'}${detail}`)
    }
    ok(`Published "${data.key}" v${data.version} → ${BASE}  (reload My Magik Buttons)`)
    break
  }
  default:
    console.log('Usage: node magik.mjs <validate|dry-run|publish> [button.json]')
}
