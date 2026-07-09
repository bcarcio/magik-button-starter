# Magik Button starter

Build and publish a **[Local Magik](https://localmagik.vercel.app) button** from your terminal —
no app clone, no database. A button is just a JSON file (`button.json`): a few **questions** to
ask, and ordered **steps** (AI drafts → a human approval gate → optional send/publish). Pairs
beautifully with **Claude Code** — see `CLAUDE.md`.

## Get it

```sh
npx degit bcarcio/magik-button-starter my-button
cd my-button
```

## Setup (once)

1. In your Local Magik, go to **Settings → API keys** and mint a key.
2. `cp .env.example .env` and paste the key into `MAGIK_API_KEY`.
   Set `MAGIK_URL` to your Local Magik URL (e.g. `https://localmagik.vercel.app`).
3. Requires **Node 18+**. No `npm install` needed.

## Build a button

Edit `button.json` (or open this folder in **Claude Code** and say *"build me a button that
does X"* — it knows the format from `CLAUDE.md`). Then:

```sh
npm run validate     # schema + graph checks ("does it build?")
npm run dry-run      # preview offline with a stub AI, using answers.json (no sends)
npm run publish      # ship it live → it appears in My Magik Buttons
```

(Or call the CLI directly: `node magik.mjs <validate|dry-run|publish> [file.json]`.)

That's the whole loop: **edit → validate → dry-run → publish.**

---

MIT licensed. Not affiliated with any particular workspace — point `MAGIK_URL` at your own
Local Magik instance.
