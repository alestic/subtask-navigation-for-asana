# Privacy Policy

<!-- [Created with AI: Claude Code with Opus 4.6] -->

## Subtask Navigation for Asana

**Effective date:** 2026-02-27

### Data Collection

Subtask Navigation for Asana does not collect, store, transmit, or share any data
with external servers or third parties. It does not include analytics, telemetry,
or tracking of any kind.

### How the Extension Works

The extension runs as a content script on `https://app.asana.com/*` pages. When
you press a navigation hotkey, it:

1. Reads the current task ID from the page URL
2. Calls Asana's own REST API (`/api/1.0/...`) using your existing browser session
   to look up parent tasks and sibling subtasks
3. Navigates to the target task using Asana's internal client-side router

All API calls go directly to `app.asana.com` using your existing Asana session — the
extension does not proxy, intercept, or forward these requests anywhere else.

### Local Storage

The extension caches navigation data (task IDs, sibling lists, and last-visited
positions) in the browser tab's `sessionStorage`. This data:

- Is scoped to the individual browser tab
- Is automatically cleared when the tab is closed
- Is never transmitted outside the browser
- Contains only Asana task IDs and names (no personal data)

### Permissions

This extension requests no special browser permissions. The `content_scripts` entry
in the manifest limits the script to `https://app.asana.com/*` only. The content
script runs in the `MAIN` world to access keyboard events and Asana's client-side
navigation.

### Third-Party Services

This extension does not communicate with any servers other than `app.asana.com`
(via Asana's own API, using your existing session).

### Changes to This Policy

If this policy changes, the updated policy will be posted in this repository with a
new effective date.

### Contact

For questions about this privacy policy, open an issue in this repository.

### License

This extension is open source under the Apache 2.0 license.
