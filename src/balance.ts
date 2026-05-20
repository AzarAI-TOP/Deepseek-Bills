interface BalanceEntry {
  currency: string;
  total_balance: string;
  granted_balance: string;
  topped_up_balance: string;
}

interface BalanceData {
  is_available: boolean;
  balance_infos: BalanceEntry[];
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

  const data = await response.json() as BalanceData;

  if (!data.is_available || !data.balance_infos?.length) {
    throw new Error('Balance data is not available');
  }

  // Aggregate all currency balances (CNY, USD, etc.)
  let total = 0;
  let toppedUp = 0;
  let granted = 0;
  for (const entry of data.balance_infos) {
    total += parseFloat(entry.total_balance);
    toppedUp += parseFloat(entry.topped_up_balance);
    granted += parseFloat(entry.granted_balance);
  }
  const used = total - toppedUp - granted;
  const remaining = toppedUp + granted;

  return { total, used, remaining };
}
