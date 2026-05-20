# DeepSeek Bills

![TypeScript](https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![VS Code](https://img.shields.io/badge/VS_Code-1.120%2B-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)
![Version](https://img.shields.io/badge/version-0.0.1-green?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)

> DeepSeek API balance at a glance — right in your VS Code status bar.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Status Bar Indicator**: Shows your remaining DeepSeek API balance (CNY) in the status bar
- **One-Click Refresh**: Click the balance indicator or run the `DeepSeek: Refresh Balance` command
- **Secure Token Storage**: API token stored in the system keychain via VS Code's `SecretStorage`
- **Auto-Refresh**: Balance updates every 5 minutes automatically
- **Multi-Currency Support**: Aggregates balances across all currencies (CNY, USD, etc.)
- **Error Handling**: Clear visual feedback for invalid tokens, network errors, and missing configuration

## Quick Start

```bash
# Clone the repository
git clone https://github.com/user/deepseek-bills.git
cd deepseek-bills

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Press F5 in VS Code to launch the Extension Development Host
```

## Installation

### Prerequisites

- Node.js 18+
- VS Code 1.120.0+

### From Source

```bash
npm install
npm run compile
```

Then press `F5` in VS Code to start debugging the extension.

### From VSIX

```bash
npx vsce package
code --install-extension deepseek-bills-0.0.1.vsix
```

## Usage

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run **`DeepSeek: Set API Token`** and paste your DeepSeek API key (`sk-...`)
3. Your balance appears in the status bar as `🐋 ¥X.XX`
4. Click the status bar item to see a detailed breakdown (total, used, remaining)
5. Use **`DeepSeek: Refresh Balance`** to manually update at any time

The token is stored securely in your system keychain and never written to settings files.

## Testing

```bash
npm test
```

This compiles, lints, and runs the extension test suite using `@vscode/test-cli`.

## Project Structure

```
deepseek-bills/
├── assets/                  # Extension icon (PNG, SVG)
├── docs/                    # Design specs and plans
├── src/
│   ├── extension.ts         # Entry point, status bar lifecycle
│   ├── balance.ts           # DeepSeek API client
│   ├── token.ts             # SecretStorage token manager
│   └── test/
│       └── extension.test.ts
├── .vscode/                 # VS Code debug/launch config
├── .vscode-test.mjs         # Test runner config
├── .vscodeignore            # Extension packaging excludes
├── package.json             # Extension manifest
├── tsconfig.json            # TypeScript config
├── eslint.config.mjs        # ESLint config
└── README.md
```

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with the [VS Code Extension API](https://code.visualstudio.com/api)
- Balance data from the [DeepSeek API](https://api.deepseek.com/user/balance)
