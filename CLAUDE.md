# CLAUDE.md

<!-- [Created with AI: Claude Code with Opus 4.6] -->

Chrome extension that adds Shift+Alt+Arrow hotkeys on app.asana.com to
navigate the task tree (siblings, parent, subtasks).

## Prerequisites

Requires Node.js (for Prettier formatting and manifest validation via `npx`/`node`).

## How It Works

When you press Shift+Alt+Arrow while viewing an Asana task, the extension
extracts the task ID from the URL, calls Asana's REST API (using your
existing session cookies) to find the parent and sibling subtasks, then
navigates using Asana's internal React router for seamless SPA transitions.

The content script runs in the MAIN world (required for keyboard events on
app.asana.com) and is wrapped in an IIFE to avoid leaking into Asana's
global scope.

## Project Structure

```
manifest.json    Chrome extension manifest (MV3)
content.js       Keyboard listener, API calls, cache, SPA navigation
content.css      Toast notification styling
```

## Development

All commands go through the Makefile:

```
make help           Show all targets
make lint           Run prettier --check on Markdown, CSS, and JavaScript
make format         Run prettier --write on Markdown, CSS, and JavaScript
make validate       Validate manifest.json structure
make bump-version   Bump version to current timestamp
make package        Create .zip for Chrome Web Store upload
make clean          Remove build artifacts
```

### Pre-commit Hooks

Pre-commit hooks auto-format Markdown, CSS, and JavaScript (Prettier) and
auto-bump the version. Install once:

```
make install-hooks
```

**Before committing**, always run:

```
make bump-version && git add manifest.json
```

then stage your changes and commit. If you skip this, the pre-commit hook
will bump the version and fail, requiring you to re-stage `manifest.json`
and commit again.

### Formatting

Prettier formats Markdown, CSS, and JavaScript files (`.prettierrc` at
project root). JavaScript uses single quotes.

## Key Conventions

- **MAIN world** — content script must run in `"world": "MAIN"` for keyboard
  events to work; the IIFE wrapper is load-bearing
- **Date-based versioning** (`YYYY.M.D.HMM` America/Los_Angeles) in
  `manifest.json` — Chrome extension versions must be 1-4 dot-separated
  integers (0-65535, no leading zeros on non-zero values); auto-bumped
  on commit via pre-commit hook
- **Manifest V3** — current Chrome extension standard
- **AI attribution** — include `[Created with AI: ...]` in generated files
- **Fragile internals** — SPA navigation relies on Asana's internal React
  fiber structure (`a.HiddenNavigationLink`, `__reactFiber$`,
  `services.navigation.requestChangeRoute`)
