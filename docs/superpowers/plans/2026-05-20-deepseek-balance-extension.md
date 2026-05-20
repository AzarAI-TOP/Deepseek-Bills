# DeepSeek Balance Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VS Code extension that displays DeepSeek API balance in the status bar with a hover tooltip.

**Architecture:** Three modules — TokenManager wraps SecretStorage for API key persistence, balance service fetches from DeepSeek API, extension.ts wires status bar UI and commands. Status bar shows DeepSeek icon + balance, hover tooltip displays detailed breakdown with Markdown.

**Tech Stack:** TypeScript, VS Code Extension API v1.120+, `vscode.SecretStorage`, Node.js `fetch`

---

### Task 1: Token Manager

**Files:**
- Create: `src/token.ts`
- Test: `src/test/token.test.ts`

- [ ] **Step 1: Write token.ts — SecretStorage wrapper**

```typescript
import * as vscode from 'vscode';

const SECRET_KEY = 'deepseek-bills.apiToken';

export class TokenManager {
  private _onDidChangeToken = new vscode.EventEmitter<string | undefined>();
  readonly onDidChangeToken = this._onDidChangeToken.event;

  constructor(private secrets: vscode.SecretStorage) {}

  async get(): Promise<string | undefined> {
    return this.secrets.get(SECRET_KEY);
  }

  async set(token: string): Promise<void> {
    await this.secrets.store(SECRET_KEY, token);
    this._onDidChangeToken.fire(token);
  }

  async delete(): Promise<void> {
    await this.secrets.delete(SECRET_KEY);
    this._onDidChangeToken.fire(undefined);
  }

  async promptForToken(): Promise<string | undefined> {
    const token = await vscode.window.showInputBox({
      title: 'DeepSeek API Token',
      prompt: 'Enter your DeepSeek API Token',
      placeHolder: 'sk-...',
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => {
        if (!value.trim()) return 'Token cannot be empty';
        return undefined;
      },
    });
    if (token) {
      await this.set(token.trim());
    }
    return token ?? undefined;
  }
}
```

- [ ] **Step 2: Write token.test.ts**

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import { TokenManager } from '../token';

suite('TokenManager', () => {
  let tokenManager: TokenManager;

  setup(() => {
    tokenManager = new TokenManager(vscode.EnvTest.secretStorage);
  });

  test('set and get token', async () => {
    await tokenManager.set('sk-test-token');
    const token = await tokenManager.get();
    assert.strictEqual(token, 'sk-test-token');
  });

  test('delete token', async () => {
    await tokenManager.set('sk-test-token');
    await tokenManager.delete();
    const token = await tokenManager.get();
    assert.strictEqual(token, undefined);
  });

  test('get returns undefined when no token stored', async () => {
    await tokenManager.delete();
    const token = await tokenManager.get();
    assert.strictEqual(token, undefined);
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add src/token.ts src/test/token.test.ts
git commit -m "feat: add TokenManager for secure API token storage"
```

---

### Task 2: Balance Service

**Files:**
- Create: `src/balance.ts`

- [ ] **Step 1: Write balance.ts — API fetch with types**

```typescript
export interface BalanceData {
  is_available: boolean;
  balance: {
    total_balance: string;
    topped_up_balance: string;
    granted_balance: string;
  };
}

export interface BalanceInfo {
  total: number;
  used: number;
  remaining: number;
}

const API_URL = 'https://api.deepseek.com/user/balance';

export async function fetchBalance(token: string): Promise<BalanceInfo> {
  const response = await fetch(API_URL, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API token. Please update your token.');
    }
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data: BalanceData = await response.json();

  if (!data.is_available || !data.balance) {
    throw new Error('Balance data is not available');
  }

  const total = parseFloat(data.balance.total_balance);
  const toppedUp = parseFloat(data.balance.topped_up_balance);
  const granted = parseFloat(data.balance.granted_balance);
  const used = total - toppedUp - granted;
  const remaining = toppedUp + granted;

  return { total, used, remaining };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/balance.ts
git commit -m "feat: add balance service for DeepSeek API"
```

---

### Task 3: Extension Entry Point (Status Bar + Commands)

**Files:**
- Modify: `src/extension.ts`
- Modify: `package.json`

- [ ] **Step 1: Update package.json — contribute commands and icon**

Replace the contents of `package.json`:

```json
{
  "name": "deepseek-bills",
  "displayName": "DeepSeek Bills",
  "description": "DeepSeek API balance indicator in your status bar",
  "version": "0.0.1",
  "icon": "assets/deepseek-icon.png",
  "engines": {
    "vscode": "^1.120.0"
  },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "deepseek-bills.refresh",
        "title": "DeepSeek: Refresh Balance"
      },
      {
        "command": "deepseek-bills.setToken",
        "title": "DeepSeek: Set API Token"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile && npm run lint",
    "lint": "eslint src",
    "test": "vscode-test"
  },
  "devDependencies": {
    "@types/vscode": "^1.120.0",
    "@types/mocha": "^10.0.10",
    "@types/node": "22.x",
    "typescript-eslint": "^8.56.1",
    "eslint": "^9.39.3",
    "typescript": "^5.9.3",
    "@vscode/test-cli": "^0.0.12",
    "@vscode/test-electron": "^2.5.2"
  }
}
```

- [ ] **Step 2: Write extension.ts**

```typescript
import * as vscode from 'vscode';
import { TokenManager } from './token';
import { fetchBalance, BalanceInfo } from './balance';

let statusBarItem: vscode.StatusBarItem;
let tokenManager: TokenManager;
let currentBalance: BalanceInfo | null = null;

export function activate(context: vscode.ExtensionContext) {
  tokenManager = new TokenManager(context.secrets);

  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = 'deepseek-bills.refresh';
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(
    vscode.commands.registerCommand('deepseek-bills.refresh', updateBalance)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('deepseek-bills.setToken', async () => {
      await tokenManager.promptForToken();
      await updateBalance();
    })
  );
  context.subscriptions.push(
    tokenManager.onDidChangeToken(() => updateBalance())
  );

  updateBalance();
}

async function updateBalance() {
  const token = await tokenManager.get();

  if (!token) {
    setStatus('no-token');
    statusBarItem.tooltip = new vscode.MarkdownString(
      '**DeepSeek Balance**\n\n---\n\nNo API token configured.\n\n[Set API Token](command:deepseek-bills.setToken)',
      true
    );
    statusBarItem.tooltip.isTrusted = true;
    return;
  }

  setStatus('loading');

  try {
    currentBalance = await fetchBalance(token);
    setStatus('ok');
    statusBarItem.text = `$(deepseek-icon) ¥${currentBalance.remaining.toFixed(2)}`;
    statusBarItem.backgroundColor = undefined;
    statusBarItem.tooltip = buildTooltip(currentBalance);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setStatus('error');
    statusBarItem.tooltip = new vscode.MarkdownString(
      `**DeepSeek Balance**\n\n---\n\n:warning: ${message}\n\n[Retry](command:deepseek-bills.refresh) | [Set API Token](command:deepseek-bills.setToken)`,
      true
    );
    statusBarItem.tooltip.isTrusted = true;
  }
}

function setStatus(state: 'no-token' | 'loading' | 'ok' | 'error') {
  statusBarItem.show();
  switch (state) {
    case 'no-token':
      statusBarItem.text = '$(deepseek-icon) Set Token';
      statusBarItem.backgroundColor = undefined;
      break;
    case 'loading':
      statusBarItem.text = '$(deepseek-icon) ...';
      statusBarItem.backgroundColor = undefined;
      break;
    case 'error':
      statusBarItem.text = '$(deepseek-icon) !';
      statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.errorBackground'
      );
      break;
    case 'ok':
      if (currentBalance) {
        statusBarItem.text = `$(deepseek-icon) ¥${currentBalance.remaining.toFixed(2)}`;
      }
      statusBarItem.backgroundColor = undefined;
      break;
  }
}

function buildTooltip(balance: BalanceInfo): vscode.MarkdownString {
  const total = balance.total.toFixed(2);
  const used = balance.used.toFixed(2);
  const remaining = balance.remaining.toFixed(2);
  const now = new Date().toLocaleString();

  const md = new vscode.MarkdownString(
    [
      `**DeepSeek Balance**  \n`,
      `---\n`,
      `| | |`,
      `|---|---|`,
      `| **Total Balance** | ¥${total} |`,
      `| **Used** | ¥${used} |`,
      `| **Remaining** | **¥${remaining}** |`,
      `\n---\n`,
      `_Last updated: ${now}_  \n`,
      `[Refresh](command:deepseek-bills.refresh) | [Change Token](command:deepseek-bills.setToken)`,
    ].join('\n'),
    true
  );
  md.isTrusted = true;
  md.supportHtml = true;
  return md;
}

export function deactivate() {}
```

- [ ] **Step 3: Register the DeepSeek icon as a product icon**

Since VS Code status bar items don't support custom SVG directly, we use the extension's icon contribution. Add to `package.json` under `contributes`:

```json
"icons": {
  "deepseek-icon": {
    "description": "DeepSeek whale icon",
    "default": {
      "fontPath": "",
      "fontCharacter": ""
    }
  }
}
```

Wait — VS Code doesn't support custom product icons in status bar items. Status bar items only support codicons (`$(name)`) or plain text. Since we can't use a custom SVG in the status bar, we'll use the unicode whale `🐋` as the indicator and save the SVG for the extension marketplace icon.

**Updated approach:** Use `🐋` unicode character in status bar text, use `assets/deepseek-icon.png` as extension icon for marketplace.

- [ ] **Step 3 (revised): Commit**

```bash
git add src/extension.ts package.json
git commit -m "feat: add status bar balance display with hover tooltip"
```

---

### Task 4: Build, Lint, and Verify

- [ ] **Step 1: Install dependencies**

```bash
npm install
```

- [ ] **Step 2: Compile TypeScript**

```bash
npm run compile
```
Expected: No errors.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```
Expected: No lint errors.

- [ ] **Step 4: Verify the extension activates**

Launch Extension Development Host (F5 in VS Code). Verify:
- Status bar shows `🐋 Set Token` on first run
- Click opens input box for token
- After token set, status bar shows balance
- Hover shows tooltip with balance breakdown
- `Set API Token` command works from command palette

- [ ] **Step 5: Final commit for any build/lint fixes**

```bash
git add -A
git commit -m "chore: build and lint fixes"
```
