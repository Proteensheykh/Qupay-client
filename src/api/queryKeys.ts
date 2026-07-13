export const queryKeys = {
  user: {
    me: () => ['user', 'me'] as const,
    byUsername: (username: string) => ['user', 'byUsername', username] as const,
  },
  transactions: {
    list: (page?: number, size?: number) => ['transactions', 'me', page, size] as const,
    byId: (id: string) => ['transactions', id] as const,
    limits: (currency?: string) => ['transactions', 'limits', currency ?? 'all'] as const,
  },
  quotes: {
    calculate: (amount: number, from: string, to: string, amountType: string) =>
      ['quotes', amount, from, to, amountType] as const,
  },
  banks: {
    all: () => ['banks'] as const,
    validate: (bankCode: string, accountNumber: string) =>
      ['banks', 'validate', bankCode, accountNumber] as const,
  },
  rates: {
    convert: (from: string, to: string) => ['rates', from, to] as const,
    currencies: () => ['rates', 'currencies'] as const,
  },
  mp: {
    profile: () => ['mp', 'profile'] as const,
    queue: () => ['mp', 'queue'] as const,
    myOrders: () => ['mp', 'myOrders'] as const,
  },
  wallets: {
    validate: (address: string, network: string) =>
      ['wallets', 'validate', address, network] as const,
  },
  kyc: {
    status: () => ['kyc', 'status'] as const,
  },
} as const;
