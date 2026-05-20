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

  // Auto-refresh every 5 minutes
  const interval = setInterval(updateBalance, 5 * 60 * 1000);
  context.subscriptions.push({ dispose: () => clearInterval(interval) });

  updateBalance();
}

async function updateBalance() {
  const token = await tokenManager.get();

  if (!token) {
    setStatus('no-token');
    statusBarItem.tooltip = new vscode.MarkdownString(
      '**🐋 DeepSeek Balance**\n\n---\n\nNo API token configured.\n\n[Set API Token](command:deepseek-bills.setToken)',
      true
    );
    statusBarItem.tooltip.isTrusted = true;
    return;
  }

  setStatus('loading');

  try {
    currentBalance = await fetchBalance(token);
    setStatus('ok');
    statusBarItem.tooltip = buildTooltip(currentBalance);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setStatus('error');
    statusBarItem.tooltip = new vscode.MarkdownString(
      `**🐋 DeepSeek Balance**\n\n---\n\n:x: ${message}\n\n[Retry](command:deepseek-bills.refresh) | [Set API Token](command:deepseek-bills.setToken)`,
      true
    );
    statusBarItem.tooltip.isTrusted = true;
  }
}

function setStatus(state: 'no-token' | 'loading' | 'ok' | 'error') {
  statusBarItem.show();
  switch (state) {
    case 'no-token':
      statusBarItem.text = '🐋 Set Token';
      statusBarItem.backgroundColor = undefined;
      break;
    case 'loading':
      statusBarItem.text = '🐋 ...';
      statusBarItem.backgroundColor = undefined;
      break;
    case 'error':
      statusBarItem.text = '🐋 !';
      statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.errorBackground'
      );
      break;
    case 'ok':
      if (currentBalance) {
        statusBarItem.text = `🐋 ¥${currentBalance.remaining.toFixed(2)}`;
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
      `**🐋 DeepSeek Balance**\n`,
      `---\n`,
      `| | |`,
      `|---|---|`,
      `| **Total Balance** | ¥${total} |`,
      `| **Used** | ¥${used} |`,
      `| **Remaining** | **¥${remaining}** |`,
      `\n---\n`,
      `_Last updated: ${now}_\n`,
      `[Refresh](command:deepseek-bills.refresh) | [Change Token](command:deepseek-bills.setToken)`,
    ].join('\n'),
    true
  );
  md.isTrusted = true;
  md.supportHtml = true;
  return md;
}

export function deactivate() {}
