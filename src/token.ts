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
        if (!value.trim()) { return 'Token cannot be empty'; }
        return undefined;
      },
    });
    if (token) {
      await this.set(token.trim());
    }
    return token ?? undefined;
  }
}
