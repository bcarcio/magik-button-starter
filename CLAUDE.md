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

Top level:
- `key` — lowercase slug (letters, digits, hyphens/underscores), unique. e.g. `weekly-digest`.
- `name` — human title. `version` — a number (start at `1`). `emoji` — optional.
- `blurb` — one line shown on the gallery card. `premise` — one line grounding the intake.
- `questions` — array (may be empty). `steps` — array, **at least one**, run in order.

### Questions — what to ask the person running the button
Each: `{ key, kind, required, prompt, hint?, placeholder?, choices? }`
- `short_text` / `long_text` — free text.
- `choice` — a pick list; MUST include `choices: ["A","B",...]`.
- `rich_paste` — paste a whole document (Google Docs, etc.).
- `audience` — pick one of the workspace's contact lists (its answer is a list id; a send step
  fans out to it with per-recipient merge). Use only if the button sends to a list.

### Steps — what happens (in order). Each step has `id`, `label`, and usually `inputs`.
- **generate** — the AI writes something. Fields: `prompt` (required), `output: { contentType:
  "markdown" | "text" | "html" }`, and `fallback` (used verbatim if the model errors). Produces
  one artifact addressed `s.<id>`.
- **task** — a human approval gate. Fields: `reviews: [stepIds]`, `approver: { role: "owner" |
  "admin" | "member" }` (or `{ match: "name-or-email" }`), `disposition: "complete" | "send" |
  "publish"`. The run PAUSES here until approved. **Nothing after a task runs before approval.**
- **connector_action** — send/publish via a connector. Fields: `connector` (e.g. `"gmail"`),
  `action`, `params` (may contain refs). **Must be preceded by a `task` gate** (the validator
  enforces it) — that's how "drafts stay drafts until a human approves" is guaranteed.

### Reference grammar (inside `prompt`, `fallback`, and `params` strings)
- `{{q.<questionKey>}}` — a question's answer.
- `{{s.<stepId>.body}}` — a previous step's output (`.body` is the text; also `.url`, `.meta`).
- Anything else, e.g. `{{firstName}}`, is left literal (used for per-recipient merge on sends).

Every `inputs` entry and every `{{q.*}}`/`{{s.*}}` ref must resolve to a declared question or an
**earlier** step — no forward or self references, and the step graph must be acyclic. The
validator checks all of this; read its errors and fix the refs.

## Example (this starter's `button.json`)
A two-step button: a `generate` step drafts from `{{q.topic}}`, then a `task` gate for review.
Copy its shape. To add a Gmail send, put a `task` gate before a `connector_action` step.

## Tips
- One clear job per button. More steps ≠ better.
- Give every `generate` step a sensible `fallback` (used if the model errors).
- If `validate` complains about a ref, check the `id`/`key` spelling and that the target is an
  earlier step.
- Config/keys: `MAGIK_API_KEY` + `MAGIK_URL` come from `.env` (see `.env.example`).
