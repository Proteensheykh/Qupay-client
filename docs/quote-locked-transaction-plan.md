# Implementation Plan — Quote-Locked Transaction Flow + Tier Limits

**Status:** Implemented
**Owner:** —
**Source specs:**
- `~/Downloads/quote-transaction-flow.md` (FE guide, quote-locked flow)
- Live OpenAPI: `https://qupay-app-f70e5cb23170.herokuapp.com/api/v3/api-docs`
- Swagger UI: `https://qupay-app-f70e5cb23170.herokuapp.com/api/swagger-ui/index.html`

> This doc is self-contained so it can be executed in a fresh agent session. It captures the current (misaligned) state, the target contract, and a phased, PR-sized plan.

---

## 1. Background / Why

Creating a transaction is now a **two-step, quote-locked flow**. The client no longer sends
currencies/amount/fee/rate at create time — it requests a **quote** first, then creates the
transaction by `quoteId`. The backend reads all money numbers from the locked quote so values
cannot drift between the confirm screen and submit. Quotes expire after **120 seconds**.

Separately, transfer **min/max limits are tier-based** and now exposed to payers via
`GET /v1/transactions/limits`. The send screen currently hardcodes limits (and mislabels the
10,000 NGN **minimum** as a maximum).

---

## 2. Current state (as of this plan)

- **No quote step exists.** No `POST /v1/quotes/calculate` call, type, or hook.
- `CreateTransactionRequest` is the **old shape** `{ fromCurrency, toCurrency, amount, recipient, pin }`
  (`src/types/transaction.ts`). Backend now requires `{ quoteId, amount, recipient, pin }`.
- `ConfirmScreen` computes rate via `getRate()` and fee client-side at `amount * 0.015`, then
  submits the base `amount` (should submit `totalToSend`).
- `Recipient` type has **no `network`** field; `ConfirmScreen` sends `{ walletAddress }` only for crypto.
- `AmountScreen` hardcodes `MIN_AMOUNT = 0.000001` / `MAX_AMOUNT = 10000` and renders
  "Maximum amount is 10,000 NGN" (the 10,000 is actually the **minimum**).
- `src/api/kyc.ts` `KycStatusResponse` is **stale**: declares `{ status, submittedAt, reviewedAt, rejectionReason }`
  but backend returns `{ kycStatus, tier, submittedAt }`. We need `tier` to select the limit row.
- `Transaction` type omits `totalToSend` and `transactionTier` (both present on backend
  `TransactionStatusResponse`).

---

## 3. Target API contract (from live spec)

### `POST /v1/quotes/calculate` (auth; PAYER/MP)
Request:
```json
{ "amount": 100, "sendCurrency": "USDT", "receiveCurrency": "NGN", "amountType": "SEND" }
```
- `amountType`: `"SEND" | "RECEIVE"` (default `SEND`). `SEND` = amount is base to send (fee added on top);
  `RECEIVE` = amount is target payout, base back-computed.

Response `data` (`QuoteResponse`):
```json
{
  "quoteId": "uuid",
  "enteredAmount": 100,
  "fee": 2.25,
  "totalToSend": 102.25,
  "rate": 1600.0,
  "receiveAmount": 160000.0,
  "sendCurrency": "USDT",
  "receiveCurrency": "NGN",
  "tier": "TIER_1",
  "spreadRate": 0.0225,
  "rateTimestamp": "2026-07-08T10:00:00Z",
  "expiresAt": "2026-07-08T10:02:00Z"
}
```
Fee model: `totalToSend = enteredAmount + fee` (what user pays); `receiveAmount = enteredAmount × rate`
(fee NOT deducted from payout).

### `POST /v1/transactions` (auth; PAYER/MP)
Request (`CreateTransactionRequest`):
```json
{ "quoteId": "uuid", "amount": 102.25, "recipient": { ... }, "pin": "1234" }
```
- `amount` must **exactly equal** the quote's `totalToSend` (send verbatim).
- `recipient` — populate ONE mode:
  - Crypto (USDT out): `walletAddress` + `network` (`SOLANA|ERC20|TRC20|BEP20`)
  - Mobile money: `phone`
  - Bank: `bankCode` + `accountNumber` + `accountName`
- Response `201` = `TransactionStatusResponse` (now includes `totalToSend`, `transactionTier`).

### `GET /v1/transactions/limits?currency=NGN` (auth; payer-facing)
Response `data` = `TierLimitResponse[]`:
```json
{ "currency": "NGN", "tier": "TIER_0", "minAmount": 0, "maxAmount": 0,
  "dailyLimit": 0, "weeklyLimit": 0, "monthlyLimit": 0 }
```
Returns rows per tier; select the row matching the user's KYC `tier`.
(Verify at runtime whether it returns all tiers or only the caller's.)

### Error handling (create flow)
| HTTP | When | FE action |
|---|---|---|
| 410 Gone | quote expired (>120s) or used | re-quote transparently, keep PIN, prompt reconfirm |
| 400 | `amount` ≠ `totalToSend`; bad currency/PIN; missing recipient | fix payload; on amount mismatch re-quote |
| 403 | quote belongs to another user; wallet flagged; AML block | surface message; non-recoverable for that quote/recipient |
| 404 | `quoteId`/user not found | re-request quote |
| 409 | duplicate submit (same amount+pair within 30s) | debounce; block double-submit |

Envelope: `{ success, message, data }` — surface `message`.

---

## 4. Key design decision

**Request the quote on entry to `ConfirmScreen`** (after recipient chosen), not on `AmountScreen`.
Rationale: 120s TTL would usually expire while the user fills in the recipient on `RecipientScreen`.
Drive the countdown on `ConfirmScreen`; re-quote on expiry/410. Keep `/v1/rates/convert` for the
live-rate display pill on `AmountScreen` only (display, not source of truth).

Flow unchanged in shape: `Amount → Recipient → Confirm → (PIN) → create → TransactionStatus`.
Thread `amountType` + entered amount through nav params so the quote reflects what the user typed
(faithful `SEND`/`RECEIVE`).

---

## 5. Phased plan (PR-sized)

### PR1 — Data layer + tier-limits fix (self-contained; fixes the min/max bug)

**Phase 1: API + types**
- New `src/api/quotes.ts`: `QuoteRequest`, `QuoteResponse`, `calculateQuote()` → `POST /v1/quotes/calculate`.
- New `src/api/limits.ts` (or add to `transactions.ts`): `TierLimitResponse`, `getTransactionLimits(currency?)`
  → `GET /v1/transactions/limits`.
- `src/types/transaction.ts`:
  - `CreateTransactionRequest` → `{ quoteId: string; amount: number; recipient: Recipient; pin: string }`.
  - Add `network?: CryptoNetwork` to `Recipient`.
  - Add `totalToSend?: number`, `transactionTier?: string` to `Transaction` / `TransactionListItem`.
- `src/api/kyc.ts`: fix `KycStatusResponse` to `{ kycStatus: KycStatus; tier: Tier; submittedAt?: string }`.
  Add a `Tier` type: `'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3'`.
- `src/api/queryKeys.ts`: add
  ```ts
  quotes: { calculate: (a, from, to, t) => ['quotes', a, from, to, t] as const },
  transactions: { ...existing, limits: (currency?) => ['transactions', 'limits', currency ?? 'all'] as const },
  ```

**Phase 2: hooks**
- New `src/hooks/useTransactionLimits.ts`: `useQuery(queryKeys.transactions.limits(currency), …)`, long `staleTime`.
- (Quote hook lands in PR2.)

**Phase 4 (limits UI): `src/screens/send/AmountScreen.tsx`**
- Replace hardcoded `MIN_AMOUNT`/`MAX_AMOUNT` (lines ~28–29, 328, 443–447) with values from
  `useTransactionLimits('NGN')` matched to the user's KYC `tier`.
- Validate the **NGN-leg** amount against `minAmount`/`maxAmount`.
- Fix messaging: "Minimum amount is ₦X" when below min; "Maximum amount is ₦Y" when above max.
- Pass `amountType` (from `activeField`) into navigation params.
- Keep `getRate` live-rate pill for display.

### PR2 — Quote-locked create flow

**Phase 2 (cont.): hooks**
- New `src/hooks/useQuote.ts`: `useCalculateQuote` **mutation** (invoked imperatively on Confirm mount
  + on re-quote). Mutation preferred over query given 120s TTL + manual re-quote.
- `src/hooks/useTransactions.ts`: `useCreateTransaction` mutationFn updated to new `CreateTransactionRequest`.

**Phase 3: navigation params (`src/navigation/AppNavigator.tsx`, `SendFlowParamList`)**
- Add `amountType: 'SEND' | 'RECEIVE'` to `Recipient` and `Confirm` params; keep entered `amount`.
- Ensure `recipientNetwork` carried as a `CryptoNetwork` enum value (`'SOLANA'`), not display `'Solana'`.

**Phase 5: `src/screens/send/ConfirmScreen.tsx` (core rewrite)**
- On mount, `calculateQuote({ amount, sendCurrency, receiveCurrency, amountType })`; store quote in state.
- Remove `getRate` block + `fee = amount * 0.015` estimate.
- Display: `totalToSend` → "You send/pay"; `receiveAmount` → "They receive"; `fee` + `rate` breakdown.
- Countdown from `quote.expiresAt` (replaces the rate-freshness timer). At 0 → disable PIN submit,
  show "Rate expired — refresh" + re-quote button.
- Submit: build `recipient` incl. `network` for crypto; call
  `createTransaction({ quoteId, amount: totalToSend, recipient, pin })`.
- Keep submit disabled while `isPending` (guards 409).

**Phase 6: error handling (`ConfirmScreen` + `src/api/errors.ts`)**
- Branch on `ApiError.status`: 410 → re-quote silently (keep PIN, toast); 409 → ignore while pending;
  403 → surface message (non-recoverable); 404/400(amount mismatch) → re-quote.
- Add friendlier copy to `KNOWN_MESSAGES` where useful.

**Phase 7: downstream verification**
- `TransactionStatusScreen` / `TransferDetail`: confirm amount fields (`originalAmount`, `chargeAmount`,
  `totalToSend`, `convertedAmount`) render correctly.
- Grep for other callers of `createTransaction` / `CreateTransactionRequest` and update to new shape.

---

## 6. Edge cases
- User idles on Confirm → quote expires before first submit (countdown gate covers it).
- `amountType: 'RECEIVE'` — display must still use `totalToSend` for the pay figure.
- Pair still gated by `isPairSupported` (USDT↔NGN) before quoting.
- Network offline during quote → retry state; don't leave a stale confirm.

---

## 7. Open questions
1. **`amountType` fidelity:** faithfully pass `SEND`/`RECEIVE` based on the field the user typed
   (recommended), vs. always quote by `SEND`. Plan assumes faithful.
2. **Limits denomination:** confirm tier limits are keyed on the **fiat (NGN)** leg for USDT↔NGN.
3. **`/v1/transactions/limits` scope:** returns all tiers vs. only caller's tier? Verify with a real token.

---

## 8. Files touched
**New:** `src/api/quotes.ts`, `src/api/limits.ts`, `src/hooks/useQuote.ts`, `src/hooks/useTransactionLimits.ts`
**Modified:** `src/types/transaction.ts`, `src/api/transactions.ts`, `src/api/kyc.ts`, `src/api/queryKeys.ts`,
`src/hooks/useTransactions.ts`, `src/navigation/AppNavigator.tsx`, `src/screens/send/AmountScreen.tsx`,
`src/screens/send/ConfirmScreen.tsx`, possibly `src/screens/send/TransactionStatusScreen.tsx`

---

## 9. Execution checklist
- [x] PR1 · Phase 1 — `quotes.ts`, `limits.ts`, type changes, `kyc.ts` fix, query keys
- [x] PR1 · Phase 2 — `useTransactionLimits`
- [x] PR1 · Phase 4 — `AmountScreen` tier-limit min/max + message fix + `amountType` param
- [x] PR2 · Phase 2 — `useQuote`, `useCreateTransaction` signature
- [x] PR2 · Phase 3 — `SendFlowParamList` params (`amountType`, network enum)
- [x] PR2 · Phase 5 — `ConfirmScreen` quote fetch, display, countdown, submit
- [x] PR2 · Phase 6 — error handling (410/409/403/404/400)
- [x] PR2 · Phase 7 — downstream verification + caller sweep + receipts show bank name and committed totals
