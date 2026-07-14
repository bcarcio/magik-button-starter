# Building a Local Magik button (guide for Claude Code)

You are helping someone build a **Magik Button** in this folder. A button is **config, not
code**: a single `button.json` describing questions to ask and ordered steps to run. The Local
Magik engine executes any valid definition, so you never write app code — you author JSON, then
validate → dry-run → publish with the included `magik.mjs` CLI.

## Your workflow

1. Ask the user what the button should do (or infer it). Write/adjust `button.json`.
2. `npm run validate` — fix any errors it reports, then repeat until valid.
3. `npm run dry-run` — sanity-check the flow and the drafted output (uses `answers.json`).
4. When it looks right, `npm run publish` — it goes live in their workspace.

Keep the loop tight: after any edit to `button.json`, re-run `validate`. The dry-run uses a
**stub AI** (deterministic placeholder text), so judge the *shape/flow*, not the wording — real
Claude output happens when the button is actually run in the app.

## `button.json` format

**Read [`FORMAT.md`](./FORMAT.md) in this folder** — it is the full, authoritative field
reference (top-level fields, the question kinds, the step kinds, and the `{{q.*}}`/`{{s.*}}`
reference grammar). It's the same reference the Local Magik app shows on its build page.

The essentials: top level is `key`, `name`, `version`, `emoji?`, `blurb`, `premise`,
`frequency?`, `questions[]`, `steps[]` (don't set `builder` — it's assigned on publish). Steps
run in order; a **generate** step drafts, a **task** step is a human approval gate, and any
**connector_action** (send/publish) must come *after* a task gate. Every `inputs`/`{{...}}` ref
must point at a declared question or an **earlier** step. When in doubt, read `FORMAT.md`.

## Example (this starter's `button.json`)
A two-step button: a `generate` step drafts from `{{q.topic}}`, then a `task` gate for review.
Copy its shape. To add a Gmail send, put a `task` gate before a `connector_action` step.

## Tips
- One clear job per button. More steps ≠ better.
- Give every `generate` step a sensible `fallback` (used if the model errors).
- If `validate` complains about a ref, check the `id`/`key` spelling and that the target is an
  earlier step.
- Config/keys: `MAGIK_API_KEY` + `MAGIK_URL` come from `.env` (see `.env.example`).
