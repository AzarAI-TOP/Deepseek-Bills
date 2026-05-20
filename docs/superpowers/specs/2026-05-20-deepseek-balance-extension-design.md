# DeepSeek Balance VS Code Extension — Design Spec

## Overview

A VS Code extension that displays DeepSeek API balance in the status bar with a modern hover tooltip. Uses the official DeepSeek icon as the status bar indicator.

## Architecture

### Module 1: Token Manager (`src/token.ts`)
- Reads/writes DeepSeek API token via `vscode.SecretStorage`
- Exposes `getToken()`, `setToken(token)`, `onTokenChange` event
- Prompts user for token via `vscode.window.showInputBox` on first run

### Module 2: Balance Service (`src/balance.ts`)
- Fetches balance from `GET https://api.deepseek.com/user/balance` with Bearer auth
- Returns typed balance data: `{ total, used, remaining }`
- No retry logic; errors surfaced directly to UI

### Module 3: Status Bar UI (`src/extension.ts`)
- Status bar item on the right side (priority 100)
- States: loading (`...`), no-token (`Set Token`), error (`!`), normal (`¥42.50`)
- Hover tooltip: `MarkdownString` with balance breakdown and action links
- Click action: manual refresh

### Commands
| Command | Behavior |
|---|---|
| `deepseek-bills.refresh` | Manually refresh balance |
| `deepseek-bills.setToken` | Open input box to set/change API token |

## Data Flow

```
Token (SecretStorage) → Balance Service → StatusBarItem text + tooltip
                                        → Error states handled per table below
```

## Error Handling

| Scenario | Status Bar Text | Hover Tooltip |
|---|---|---|
| No token stored | `Set Token` | "Click to set your DeepSeek API Token" |
| Network error | `!` | Shows error message + "Click to retry" |
| 401 Unauthorized | `!` | "Invalid token — click to update" |
| Other API errors | `!` | Shows status code and message |

## UI States

- **Loading**: spinner text `...`
- **Success**: `¥12.34` with DeepSeek icon
- **No token**: `Set Token` in status bar, click prompts input
- **Error**: `!` icon, hover shows details

## Token Storage

- Uses `SecretStorage` (OS-level encryption, not in settings.json)
- Never logged or displayed

## Files

```
src/
  extension.ts   — activate/deactivate, status bar, commands
  token.ts       — SecretStorage wrapper
  balance.ts     — API fetch + types
assets/
  deepseek-icon.svg — Official DeepSeek icon in brand color #3C5DFF
```
