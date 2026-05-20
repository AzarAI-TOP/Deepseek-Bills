# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run compile          # TypeScript compilation
npm run watch            # TypeScript watch mode
npm run lint             # ESLint
npm test                 # Run extension tests (vscode-test)
npm run pretest          # compile + lint (runs automatically before test)
```

## Architecture

A VS Code extension that displays the user's DeepSeek API balance in the status bar. Activates on `onStartupFinished`.

**`src/extension.ts`** — Entry point. Creates a right-aligned status bar item, registers two commands (`deepseek-bills.refresh`, `deepseek-bills.setToken`), and sets up a 5-minute auto-refresh interval. The `updateBalance()` function is the core loop: get token → fetch balance → update status bar text/tooltip. Status bar shows one of four states: `no-token`, `loading`, `ok` (shows remaining balance in CNY), `error`.

**`src/token.ts`** — `TokenManager` class wrapping `vscode.SecretStorage`. Stores/retrieves the DeepSeek API key under key `deepseek-bills.apiToken`. Fires `onDidChangeToken` event on changes. `promptForToken()` shows an input box (password mode, validates non-empty).

**`src/balance.ts`** — Calls `GET https://api.deepseek.com/user/balance` with Bearer auth. Aggregates all currency entries (CNY, USD, etc.) and returns `BalanceInfo` with `total`, `used`, and `remaining` fields. Throws on 401 (invalid token) or unavailable balance data.

Token is stored via VS Code's `SecretStorage` (system keychain), not in settings.
