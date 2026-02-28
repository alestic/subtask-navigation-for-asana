<!-- [Created with AI: Claude Code with Opus 4.6] -->

# Subtask Navigation for Asana

[![Tests](https://github.com/alestic/subtask-navigation-for-asana/actions/workflows/test.yml/badge.svg)](https://github.com/alestic/subtask-navigation-for-asana/actions/workflows/test.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

A Chrome extension that adds **Shift+Alt+Arrow** hotkeys to navigate the
task tree on app.asana.com — move between sibling subtasks, jump to the
parent, or return to the last-visited child subtask.

## Why?

Asana has no built-in keyboard shortcuts for navigating between subtasks.
If you work with deeply nested task hierarchies, you're stuck clicking
breadcrumbs and subtask links to move around the tree. This extension
adds six hotkeys that let you navigate the full hierarchy without leaving
the keyboard.

## How It Works

When you press Shift+Alt+Arrow while viewing a task:

1. Extracts the current task ID from the URL
2. Calls Asana's REST API (using your existing session cookies) to find
   the parent task and its subtasks
3. Navigates using Asana's internal React router for seamless SPA
   transitions — no page reload
4. Caches sibling lists (60-second TTL) and remembers your position at
   each level so Left then Right is always a round-trip

## Hotkeys

| Key                 | Action                                |
| ------------------- | ------------------------------------- |
| **Shift+Alt+Up**    | Previous sibling subtask              |
| **Shift+Alt+Down**  | Next sibling subtask                  |
| **Shift+Alt+Left**  | Parent task                           |
| **Shift+Alt+Right** | Last-visited child subtask (or first) |
| **Shift+Alt+Home**  | First sibling                         |
| **Shift+Alt+End**   | Last sibling                          |

A toast notification shows your position ("3 / 5") or boundary ("First
task · 1 / 5") after each navigation.

## Install

1. Clone or download this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked**
5. Select the repository directory

The extension activates automatically on Asana pages.

## Limitations

- SPA navigation relies on Asana's internal React component structure
  (may break if Asana changes internals)
- Maximum 100 siblings per parent task (Asana API limit)
- Hotkeys are disabled when focus is in a text input or editable field

## Privacy

This extension calls Asana's own API using your existing browser session
to look up task relationships. It does not communicate with any external
servers or collect any data. See [PRIVACY.md](PRIVACY.md) for details.

## Development

Requires [Node.js](https://nodejs.org/) (for Prettier and manifest
validation) and [uv](https://docs.astral.sh/uv/) (for pre-commit hooks).

```
make help           # show all targets
make lint           # check formatting (Markdown, CSS, JavaScript)
make format         # auto-format all files
make validate       # validate manifest.json
make package        # create .zip for Chrome Web Store upload
make install-hooks  # install pre-commit git hooks (requires uv)
```

## Attribution

Created with AI: Claude Code with Opus 4.6

Directed by: [Eric Hammond](https://esh.dev/)

## License

Apache 2.0 — see [LICENSE](LICENSE).
