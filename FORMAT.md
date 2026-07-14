<!-- CANONICAL button.json field reference. This one file is the single source of truth:
     the Local Magik app renders it on its "Build it yourself" page, and Claude Code reads it
     from this folder. Edit it here; `npm run sync:starter` publishes it to the starter repo. -->

# The `button.json` format

A Magik Button is **config, not code**: one `button.json` with **questions** to ask and ordered
**steps** to run (AI drafts → a human approval gate → optional send/publish). The engine executes
any valid definition, so you never touch app code.

## Top level

- `key` — lowercase slug (letters, digits, hyphens/underscores), unique. e.g. `weekly-digest`.
- `name` — human title. `version` — a number (start at `1`). `emoji` — optional.
- `blurb` — one line shown on the gallery card. `premise` — one line grounding the intake.
- `frequency` — optional cadence: `"daily"`, `"weekly"`, or `"as_needed"` (default). Powers the
  browse-by-cadence pages.
- `builder` — **do not set this.** It's assigned automatically on publish from the account that
  owns your API key (any value you put here is ignored); it's what groups your buttons on your
  builder page.
- `questions` — array (may be empty). `steps` — array, **at least one**, run in order.

## Questions — what to ask the person running the button

Each: `{ key, kind, required, prompt, hint?, placeholder?, choices? }`

- `short_text` / `long_text` — free text.
- `choice` — a pick list; MUST include `choices: ["A","B",...]`.
- `rich_paste` — paste a whole document (Google Docs, etc.).
- `audience` — pick one of the workspace's contact lists (its answer is a list id; a send step
  fans out to it with per-recipient merge). Use only if the button sends to a list.

## Steps — what happens (in order). Each step has `id`, `label`, and usually `inputs`.

- **generate** — the AI writes something. Fields: `prompt` (required), `output: { contentType:
  "markdown" | "text" | "html" }`, and `fallback` (used verbatim if the model errors). Produces
  one artifact addressed `s.<id>`.
- **task** — a human approval gate. Fields: `reviews: [stepIds]`, `approver: { role: "owner" |
  "admin" | "member" }` (or `{ match: "name-or-email" }`), `disposition: "complete" | "send" |
  "publish"`. The run PAUSES here until approved. **Nothing after a task runs before approval.**
- **connector_action** — send/publish via a connector. Fields: `connector` (e.g. `"gmail"`),
  `action`, `params` (may contain refs). **Must be preceded by a `task` gate** (the validator
  enforces it) — that's how "drafts stay drafts until a human approves" is guaranteed.

## Reference grammar (inside `prompt`, `fallback`, and `params` strings)

- `{{q.<questionKey>}}` — a question's answer.
- `{{s.<stepId>.body}}` — a previous step's output (`.body` is the text; also `.url`, `.meta`).
- Anything else, e.g. `{{firstName}}`, is left literal (used for per-recipient merge on sends).

Every `inputs` entry and every `{{q.*}}`/`{{s.*}}` ref must resolve to a declared question or an
**earlier** step — no forward or self references, and the step graph must be acyclic. The
validator checks all of this; read its errors and fix the refs.
