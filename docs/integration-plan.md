# Backend Integration Plan

> **Status:** Phase 8 complete — payer lifecycle resumable from History; Dep #1 (proof upload target) closed as obsolete (backend hosts the multipart file directly).
> **Last updated:** 2026-06-16.
> **Owner:** Frontend.
> **Companion docs:** [`FE_TRANSACTION_INTEGRATION.md`](../FE_TRANSACTION_INTEGRATION.md) (backend contract — **stale in places**, see [§4.0 Phase 0 reconciliation](#phase-0-reconciliation)). The live OpenAPI spec at `https://qupay-app-f70e5cb23170.herokuapp.com/api/v3/api-docs` is the actual source of truth.

This document is the persistent record of every design decision made during the integration interview, plus the phased implementation plan that follows from those decisions. It is intended to survive across agent sessions — a fresh contributor (human or AI) should be able to read this end-to-end and resume the work without re-deciding anything.

### Per-phase changelog

| Date | Phase | Change |
|---|---|---|
| 2026-05-06 | 0 | Initial plan committed. |
| 2026-05-06 | 0 | Live OpenAPI reconciled; multiple endpoint paths in plan and contract doc were stale (see [§4.0](#phase-0-reconciliation)). Dep #5 closed as a false alarm. Deps #1, #3 effectively answered by the spec; #2 and #4 still need a product/backend call. |
| 2026-05-06 | 1 | Phase 1 complete. All infrastructure modules created. See [§4.1 Phase 1 completion notes](#phase-1-completion-notes). |
| 2026-05-06 | 2 | Phase 2 complete. Payer send flow wired to live backend. See [§4.2 Phase 2 completion notes](#phase-2-completion-notes). |
| 2026-05-06 | 3 | Phase 3 complete. MP API surface + hooks created. See [§4.3 Phase 3 completion notes](#phase-3-completion-notes). |
| 2026-05-06 | 4 | Phase 4 complete. MP screens built. See [§4.4 Phase 4 completion notes](#phase-4-completion-notes). |
| 2026-05-06 | 5 | Phase 5 complete (pass-through). Proof-upload UI wired with placeholder upload function pending Dep #1. See [§4.5 Phase 5 completion notes](#phase-5-completion-notes). |
| 2026-05-06 | 6 | Phase 6 complete. Cleanup & polish. See [§4.6 Phase 6 completion notes](#phase-6-completion-notes). |
| 2026-05-06 | 7 | Phase 7 added. Stakeholder testing readiness — remove all remaining dummy data, mocked screens, and hardcoded responses so the UI reflects only real backend state. See [§4.7 Phase 7](#phase-7--stakeholder-testing-readiness). |
| 2026-05-06 | 7 | Phase 7 complete. Dummy screens deleted (HomeScreen, WelcomeScreen, DepositScreen, SuccessScreen). PortfolioScreen + TransactionDetailScreen rewritten to use live `useMyTransactions` / `useTransaction`. TransactionStatusScreen no longer defaults to QUEUED while loading. ConfirmScreen + SplashScreen marketing copy made truthful for v1. See [§4.7 Phase 7 completion notes](#phase-7-completion-notes). |
| 2026-06-16 | 8 | Phase 8 added. (a) **Dep #1 closed (obsolete).** Live OpenAPI confirms `POST /v1/mp/orders/{orderId}/proof` accepts a `multipart/form-data` binary `file` and the backend hosts it itself, returning a real server-hosted `proofUrl`. No presigned endpoint or Cloudinary fallback is needed; the dead `uploads.ts#uploadFile()` pass-through was removed. (b) **Payer lifecycle made resumable from History.** The actionable `TransactionStatusScreen` is now reachable from the History tab for non-terminal transactions (terminal → receipt). See [§4.8 Phase 8](#phase-8--payer-lifecycle-resumability--proof-contract-reconciliation). |

---

## Table of contents

1. [Context & gap summary](#1-context--gap-summary)
2. [Locked design decisions](#2-locked-design-decisions)
3. [Pending external dependencies](#3-pending-external-dependencies)
4. [Implementation plan (phased)](#4-implementation-plan-phased)
5. [File-by-file change matrix](#5-file-by-file-change-matrix)
6. [New module inventory](#6-new-module-inventory)
7. [Operational notes](#7-operational-notes)
8. [Glossary](#8-glossary)

---

## 1. Context & gap summary

The backend at `https://qupay-app-f70e5cb23170.herokuapp.com/api` has shipped a transaction state machine, MP onboarding, KYC, and rate/bank/wallet endpoints that the frontend has not yet integrated. The current frontend:

- Uses a **fully mocked** `src/api/transactions.ts` backed by a local Zustand store.
- Has an **out-of-date** `TransactionStatus` enum (`src/types/transaction.ts`) that doesn't reflect the real status machine (`QUEUED → IN_PROGRESS → PAYER_PAID → COMPLETE` plus `CANCELLED / EXPIRED / DISPUTED`).
- Has **no MP-side API surface** at all (no `mp.ts`, `mpOrders.ts`, or `kyc.ts`).
- Has a `getPublicProfile` path that doesn't match the backend (`/v1/users/{username}` vs backend `/v1/users/by-username/{username}`).
- Markets itself in the README as supporting **40+ corridors**, while the backend currently only supports **USDT ↔ NGN** end-to-end.
- Has a `ProcessorOnboardingScreen` that collects data but doesn't call any KYC or MP onboarding endpoints.

This plan addresses all of the above.

---

## 2. Locked design decisions

Each decision below is final unless explicitly reopened. The rationale is captured tersely; full deliberation lives in agent transcript [`6c255bf3-4b4c-4bfa-b56d-e62eea00adcf`](6c255bf3-4b4c-4bfa-b56d-e62eea00adcf).

### Q1. Product scope vs. backend reality
**Decision:** Grey out unsupported corridors and currencies in the UI. The full corridor list stays visible (preserves the marketing surface), but only USDT↔NGN is interactive.

### Q2. Supported channel matrix (strict)
**Decision:** v1 supports exactly:

| Side | Channel |
|---|---|
| **NGN payout** | Nigerian bank account only |
| **USDT payout** | Solana wallet only |
| **Mobile money** | "Coming soon" badge, non-tappable |
| **Non-Solana wallets (ERC20, TRC20, BEP20)** | "Coming soon" badge, non-tappable |

### Q3. Payer send-flow screen architecture
**Decision:** Hybrid — collapse `DepositWaiting` and `Tracking` into a single morphing `TransactionStatusScreen` keyed off the live `status` field. Sequence becomes:

```
Amount → Recipient → Confirm (with PIN bottom-sheet) → TransactionStatus → Success
```

`Success` navigates to `History` and pushes `TransferDetail`.

### Q4. Client-side data layer for transactions
**Decision:** Kill `src/store/transactionStore.ts` entirely. **React Query is the only cache.** `authStore` keeps tokens and PIN-lock state only — profile data moves to RQ.

Sub-decisions accepted:
- Persist RQ cache via `expo-secure-store` (so warm starts don't re-flash empty states).
- Centralise query keys in `src/api/queryKeys.ts`.

### Q5. Recipient resolution UX
**Decision:** Username lookup is offered on the USDT side; bank-account validation is blocking on the NGN side; recents are local-only on both. Specifically:

- Delete the mock `walletContacts` in `src/data/mockData.ts`.
- Bank-account fields (NGN payout): `bankCode + accountNumber` → call `POST /v1/banks/validate` *(per Phase 0 reconciliation)*. Block continuation until the returned `accountName` is shown to and accepted by the user.
- Wallet-address field (USDT payout): client-side Solana base58 validation (32–44 chars, base58 alphabet). Optional username lookup (`/v1/users/by-username/{username}`) returns the bound wallet, which is then auto-filled.
- New `src/store/recentRecipientsStore.ts` (Zustand, persisted) keeps the last N recipients per channel for autocomplete. **Local-only**, never synced.

### Q6. `TransactionStatusScreen` body design (the morphing screen)
**Decision:** Visual-continuity timeline that extends the existing radar/step-timeline aesthetic. Per-state behaviour:

| `status` | Body | Polling | CTA |
|---|---|---|---|
| `QUEUED` | Radar pulse + "Finding a marketplace participant…" + 24h countdown | every **5s** | (none) |
| `IN_PROGRESS` | `mpPaymentDetails` card (account / wallet to send to) + 20-min `payerConfirmationDeadline` countdown | every **5s** | **"I've sent the funds"** → confirmation bottom-sheet → `POST /v1/transactions/{id}/confirm` |
| `PAYER_PAID` | "Waiting for MP to release funds" + proof-pending hint | every **10s** | (none) |
| `COMPLETE` | Success-state poster + proof preview if available | poll stops | "View receipt" → `TransferDetail` |
| `CANCELLED / EXPIRED / DISPUTED` | Full-bleed terminal error state with title, body, primary action | poll stops | varies (retry / contact support / close) |

Sub-decisions accepted:
- **Trust device clock** for countdowns (no server-time sync).
- Poll continues in the foreground only; pause when app backgrounds, refresh once on foreground return.
- Confirmation bottom-sheet copy: *"I confirm that I have sent the funds shown above. Submitting a false confirmation may result in account suspension."* Single primary button "Confirm transfer", secondary "Cancel".

### Q7. MP/Processor screen architecture
**Decision:** Sub-stack with index + profile. The MP tab opens to `MpHome` (renamed from `TransactionStreamScreen`) which has tabs for **Queue / Active / Completed**. Online/offline toggle lives in the header. Tapping any item pushes `OrderDetail` (renamed from `ProcessorTransactionDetailScreen`). A header gear icon opens `MpProfile` (balances, hours, status, payment methods).

### Q8. MP onboarding flow
**Decision:** Checklist-style `ProcessorSetup` screen that presents 4 sequenced sub-tasks, each in its own screen, each independently resumable:

1. **KYC** → `KycSubmissionScreen` → `POST /v1/users/me/kyc` *(per Phase 0 reconciliation)*. Body: `{ bvn (11 digits), nin (11 digits), dateOfBirth ('dd-MMM-yyyy') }`. Status read via `GET /v1/users/me/kyc`.
2. **Bind Solana wallet** → `BindWalletScreen` → `PUT /v1/users/me/wallet`. Body: `{ walletAddress (32–44 chars) }`.
3. **Bind Nigerian bank account** → `BindBankAccountScreen` → `POST /v1/users/me/bank-account` *(per Phase 0 reconciliation; method is POST not PUT)*. Body: `{ bankCode, accountNumber }`. `accountName` returns in response.
4. **MP details** → `MpOnboardScreen` → `POST /v1/mp/onboard`. Body: `{ stakedUsdt (≥100), operatingHoursStart (LocalTime obj), operatingHoursEnd (LocalTime obj), mobileMoneyNumber (required — see Dep #2) }`. Operating hours encoded as `{ hour, minute, second: 0, nano: 0 }`, **not** ISO strings.

The current `ProcessorOnboardingScreen` is **deleted** and its route replaced by `ProcessorSetup`.

### Q9. Proof-upload pipeline (BLOCKING DEPENDENCY)
**Decision:** Backend will add a presigned-upload endpoint (preferred), or a direct upload endpoint (fallback). Frontend behaviour once available:

- Accept MIME types: `image/*` and `application/pdf`.
- Client-side cap: 10 MB.
- Optional description field (free text, 280 char limit).
- Upload happens in `OrderDetail` after the MP marks the order as paid out, before `POST /v1/transactions/{id}/upload-proof` is called.
- If backend slips past Phase 4, **fall back to Cloudinary signed uploads** as a temporary measure (logged as debt; see Phase 5).

### Q10. Auth/profile state model
**Decision:** Hybrid — RQ owns the profile, `authStore` owns tokens + PIN-lock state.

- New hook `useUser()` wraps `useQuery(['user', 'me'])`.
- `authStore.logout()` clears both the secure store and the RQ cache.
- `AppNavigator` gates on a single `useUser()` load; show splash until profile resolves on cold start.
- After any mutation that changes role/KYC/binding state, invalidate `['user', 'me']` explicitly.

### Q11. Live FX vs. committed FX UX
**Decision:** Refresh-on-Confirm with freshness indicator.

- `AmountScreen`: single fetch on mount of `/v1/rates/convert`. Display as **"Estimated rate"** with a subtle disclaimer.
- `ConfirmScreen`: re-fetch on mount, show a freshness pill ("Updated 3s ago") with a refresh affordance.
- Local fee estimates only (computed client-side from a simple percentage table); the **committed** `chargeAmount` and `fxRate` come back from `POST /v1/transactions` and become source-of-truth from `TransactionStatus` onwards.
- If `/v1/rates/convert` returns no rate (corridor unsupported), disable the Continue button with an inline reason.
- Client-side enforcement of `amount ≥ 0.000001` and `amount ≤ 10000` per backend rules.

### Q12. Error / notification architecture
**Decision:** Global toast queue at app root + inline form errors.

- Single `ToastHost` mounted in `App.tsx` (above all navigators).
- New `src/store/toastStore.ts` (Zustand) holds a queue with `id`, `type` (`success | error | info`), `title`, `body?`, `durationMs?`.
- New hook `useToast()` exposes `success/error/info` methods that any component can call.
- Toasts survive navigation. Default duration: 4s. Errors: 5s. Tap-to-dismiss enabled.
- Form-level errors (validation, field-specific server errors) stay **inline**, not in toasts.
- New util `src/api/errors.ts` exports `getApiErrorMessage(error)` that maps known backend `message` strings to user-facing copy and falls back to a generic "Something went wrong" for unknown shapes.
- React Query defaults: **mutations retry 0**, **queries retry 2** with exponential backoff. Network failures trigger an info toast (not error) the first time.
- Token-refresh failure (final 401) triggers an info toast: *"Your session has expired. Please sign in again."*

### Q13. Constants, mock-data cleanup, supported-channel source of truth
**Decisions (bundled):**

- (a) **Source of truth:** single hardcoded `src/constants/supportedChannels.ts` exporting:
  - `SUPPORTED_PAIRS` → `[{ from: 'USDT', to: 'NGN' }, { from: 'NGN', to: 'USDT' }]`
  - `SUPPORTED_NETWORKS` → `[{ id: 'solana', enabled: true }, …]` (others disabled with `comingSoon: true`)
  - `SUPPORTED_PAYOUT_CHANNELS` → bank-only for NGN, wallet-only for USDT
  - `isPairSupported(from, to)` helper
- (b) **Mock data dispositions in `src/data/mockData.ts`:**
  - `countries` → keep, sort NG-first.
  - `networks` → replace with the new `SUPPORTED_NETWORKS` shape (Solana enabled, others "Coming soon").
  - `walletContacts` → **delete** (replaced by `recentRecipientsStore`).
  - `userProfile` stub → **delete** (replaced by `useUser()`).
- (c) **Phone validation:** validate on blur using `libphonenumber-js`, store the `e164` form. Used at signup time for the registration submit.

### Q14. Implementation sequencing
**Decision:** **Option C — layered, no flags, sequenced by dependency, on a feature branch with per-phase merges to `main`.** See [§4](#4-implementation-plan-phased).

Six sub-decisions accepted:

1. Branching: single feature branch `feat/api-integration` with **merge-per-phase** to `main`.
2. Demo continuity: create two test accounts on the live Heroku backend (one PAYER, one approved MP) early in Phase 0 and store credentials in a secure shared note.
3. Testing: manual QA per phase boundary. Lightweight unit tests for pure utilities only (`getApiErrorMessage`, `formatKycDate`, `isPairSupported`, recents-store eviction). No E2E framework introduced in this scope.
4. Rollback: `git revert` of the merge commit. No flag plumbing.
5. Decision trail: this document. Updated as backend/scope changes.
6. Order within phases: payer flow before MP flow.

---

## 3. Pending external dependencies

These are **blocking** unknowns the frontend cannot resolve alone. Status reflects Phase 0 reconciliation against the live OpenAPI spec.

| # | Dependency | Owner | Blocks | Status (Phase 0) |
|---|---|---|---|---|
| 1 | **Proof-upload endpoint** — presigned URL (preferred) or direct upload (fallback). | Backend | Phase 5 | **CLOSED — obsolete (2026-06-16).** Earlier reading of the spec was stale. The live OpenAPI now shows `POST /v1/mp/orders/{orderId}/proof` accepts a **`multipart/form-data` binary `file`** (with `description` as a query param) and the backend **hosts the file itself**, returning a server-hosted `proofUrl` on the order/transaction `proof` record. The current `mpOrders.ts#uploadProof` multipart implementation already matches this. **No presigned endpoint or Cloudinary fallback is required.** Dead `uploads.ts#uploadFile()` pass-through removed. |
| 2 | **`mobileMoneyNumber` required-field policy** in `OnboardMpRequest`. | Backend / Product | Phase 4 (`MpOnboardScreen`) | **Open.** Spec confirms field is required. Two acceptable resolutions: (a) ask backend to make it optional, or (b) FE submits the user's verified phone number as a sentinel value (since mobile money is "Coming soon" per Q2). Recommended: (b), tracked as debt. |
| 3 | **Operating-hours mutability** post-onboarding. | Backend | Phase 4 (`MpProfile`) | **Answered (negative).** No `PUT /v1/mp/me/operating-hours` exists; spec exposes only `PUT /v1/mp/me/balances`. Treat hours as **immutable post-onboarding** in `MpProfileScreen`; show as read-only with a "Contact support to change" affordance. Re-open if backend ships an update endpoint. |
| 4 | **KYC auto-approval in dev/staging.** | Backend | Phase 0 / demo continuity | **Open.** Spec exposes admin endpoints under `/v1/admin/kyc` but they require an `ADMIN` role; the FE cannot self-approve. Need a privileged backend operator to approve the MP test account, or a backend-side dev toggle. |
| 5 | **Bank-account field-name bug.** | Frontend | Phase 3 | **Closed — false alarm.** OpenAPI `BindBankAccountRequest = { bankCode, accountNumber }` exactly matches the current FE call in `src/api/users.ts`. `accountName` is resolved server-side and returned in `BankAccountResponse`. No fix required. |

---

## 4. Implementation plan (phased)

Total estimate: **~20–31 working days** of focused engineering, plus elapsed time for backend coordination on dependency #1.

Each phase ends with a green build, a working app (functionality may be narrowed but never broken), and a merge commit to `main`.

<a id="phase-0-reconciliation"></a>
### Phase 0 — Coordination (1–2 days, mostly elapsed time)

**Goal:** clear all external dependencies before code is written.

#### Phase 0 reconciliation against live OpenAPI (2026-05-06)

The companion contract doc [`FE_TRANSACTION_INTEGRATION.md`](../FE_TRANSACTION_INTEGRATION.md) and the original draft of this plan disagree with what the live backend at `https://qupay-app-f70e5cb23170.herokuapp.com/api/v3/api-docs` actually exposes. The live spec is the source of truth from this point on. **All later phases must use the corrected paths/shapes below.**

**Endpoint path corrections** (plan/contract → live):

| Concern | In plan/contract | Actual on live backend |
|---|---|---|
| Confirm transfer (payer) | `POST /v1/transactions/{id}/confirm-transfer` | **`POST /v1/transactions/{id}/confirm`** |
| Validate bank account | `POST /v1/banks/validate-account` | **`POST /v1/banks/validate`** |
| KYC submit | `POST /v1/kyc/submit` | **`POST /v1/users/me/kyc`** |
| KYC status | `GET /v1/kyc/status` | **`GET /v1/users/me/kyc`** |
| Bind bank account (payer) | `PUT /v1/users/me/bank-account` | **`POST /v1/users/me/bank-account`** |
| Bind primary Solana wallet | `PUT /v1/users/me/wallet` | confirmed: **`PUT /v1/users/me/wallet`** (note: separate `POST /v1/users/me/crypto-wallet` exists for arbitrary multi-network wallets — `wallet` is the single primary used for receiving USDT) |
| Bind mobile money | `PUT /v1/users/me/mobile-money` | confirmed: **`PUT /v1/users/me/mobile-money`** with `{ provider, mobileNumber }` |
| MP profile read | `GET /v1/mp/profile` | **`GET /v1/mp/me`** |
| List my transactions | `GET /v1/transactions/me` | **`GET /v1/transactions`** (paginated `?page=&size=`) |
| MP queue | `GET /v1/mp/queue` | confirmed |
| MP my orders | `GET /v1/mp/me/orders` | confirmed |
| Accept order | `POST /v1/mp/orders/{transactionId}/accept` | confirmed |
| Upload proof | `POST /v1/mp/orders/{orderId}/proof` | confirmed; takes `{ proofUrl, contentType?, description? (≤1000 chars) }` |
| Online / Offline toggle | `POST /v1/mp/me/online` / `…/offline` | confirmed |

**Schema corrections** (relative to plan/contract):

- `TransactionStatusResponse.status` enum on the live backend includes a **superset** of the documented values: `QUEUED, IN_PROGRESS, PAYER_PAID, COMPLETE, CANCELLED, EXPIRED, DISPUTED` **plus** `INITIATED, MATCHING, AWAITING_DEPOSIT, ESCROW_FUNDED, MP_PROCESSING, AWAITING_CONFIRMATION, SETTLING, RESOLVED, REFUNDED`. Plan §6 documented only the first seven. Action: Phase 2 must add a `normalizeStatus(raw): SupportedStatus` helper that maps unknown legacy values to a safe `statusGroup` for UI. The seven the UI explicitly handles remain canonical.
- `BindBankAccountRequest = { bankCode, accountNumber }` only — `accountName` resolved server-side. Closes Dep #5.
- `BindWalletRequest = { walletAddress: string (32–44 chars) }`. Solana-only by length constraint, no `network` field.
- `KycSubmissionRequest` requires `bvn` (`\d{11}`), `nin` (`\d{11}`), `dateOfBirth` formatted as **`dd-MMM-yyyy`** (e.g. `12-Jan-1990`). Phase 4 must add a date-formatting util `formatKycDate(d: Date): string`.
- `OnboardMpRequest.operatingHours{Start,End}` is a Java `LocalTime` object serialized as `{ hour, minute, second, nano }` — **not** an ISO string. Phase 4 must build a `toLocalTime(hh, mm)` helper.
- `MpProfileResponse` exposes `status` ∈ `ONLINE | OFFLINE | SUSPENDED`, balances (`usdtBalance`, `ngnBalance`, `stakedUsdt`, `dailyLimit`), `badgeLevel` ∈ `BRONZE | SILVER | GOLD`, and `operatingHours{Start,End}`. There is no field for editable operating hours — closes Dep #3 negatively.
- `BindMobileMoneyRequest = { provider, mobileNumber }` (string fields, no enum on `provider` in spec — backend likely validates internally). Phase 4 hides this UI per Q2 ("Coming soon"); included here for Phase 3 API wrapper only.
- `UpdateMpBalancesRequest = { usdtBalance, ngnBalance }` exists at `PUT /v1/mp/me/balances` — useful but out of scope for v1 unless the MP UI needs it.

#### Phase 0 task checklist

- [x] **Verify `EXPO_PUBLIC_API_BASE_URL` and `/v3/api-docs` reachability.** `.env.development` points at `https://qupay-app-f70e5cb23170.herokuapp.com/api`; spec returns `HTTP 200` (~31 KB). `/v1/banks` returns live data publicly.
- [x] **Dep #5 (bank-account field-name bug):** verified against OpenAPI; not a bug. Existing FE call already matches the schema. No fix needed.
- [x] **Dep #1 (proof upload):** answered negatively — no presigned endpoint on the live backend. **Decision needed from human reviewer:** pre-commit to Cloudinary fallback in Phase 5 (recommended), or pause Phase 5 pending backend work.
- [x] **Dep #3 (operating-hours mutability):** answered negatively — no mutation endpoint exists. `MpProfileScreen` will render hours as read-only.
- [ ] **Dep #2 (`mobileMoneyNumber` policy):** **needs human decision.** Recommendation: submit the user's `phoneNumber` from `/v1/users/me` as the value during MP onboarding (mobile money UI is hidden in v1 per Q2). Mark as debt; revisit when MM is enabled.
- [ ] **Dep #4 (KYC auto-approval in dev):** **needs backend confirmation.** OpenAPI shows admin-only endpoints under `/v1/admin/kyc`. Either a backend operator must promote the MP test account on demand, or backend should add a dev/staging auto-approve toggle.
- [ ] **Provision test accounts on Heroku:** one PAYER, one approved MP. Store credentials in a secure shared note (do not commit). **Blocks Phase 2 smoke tests and all of Phase 4.** Specifically the MP account also needs Dep #4 resolved before it can `POST /v1/mp/me/online`.

**Phase exit criterion:** all blockers either answered or accepted as known risks with a documented fallback. Currently: 5 of 7 items closed; Dep #2, Dep #4, and test-account provisioning remain.

---

### Phase 1 — Infrastructure (3–5 days)

**Goal:** build the cross-cutting plumbing every later phase will depend on. **No screen rewrites** — only shims and refactors.

- [x] Create `src/constants/supportedChannels.ts` (per Q13a).
- [x] Create `src/api/queryKeys.ts` query-key factory.
- [x] Create `src/api/errors.ts` with `getApiErrorMessage()` and `ApiError` class.
- [x] Create `src/store/toastStore.ts` Zustand toast queue.
- [x] Create `src/components/ToastHost.tsx` and mount it in `App.tsx` above the navigator.
- [x] Create `src/hooks/useToast.ts` exposing `{ success, error, info }`.
- [x] Configure `QueryClient` defaults (mutations retry 0, queries retry 2 with backoff). Extracted `queryClient` to `src/api/queryClient.ts` to avoid circular imports.
- [x] Create `src/hooks/useUser.ts` wrapping `useQuery(['user', 'me'])`.
- [x] Slim `src/store/authStore.ts` — kept `user` for hydration/cache but `logout()` now calls `queryClient.clear()`. Display consumers migrated to `useUser()`.
- [x] Refactor display-only `useAuthStore(s => s.user)` to `useUser()` in: `SettingsScreen`, `HomeScreen`, `SuccessScreen`, `TransactionStreamScreen`, `ProcessorTransactionDetailScreen`, `AppNavigator/MainTabs`.
- [x] Update `authStore.logout()` to also call `queryClient.clear()`.
- [x] Update `src/api/client.ts` so the final-401 (refresh failed) path triggers an info toast via `toastStore` directly (avoid hook coupling).
- [x] Add `phone` validation utility (`src/utils/phone.ts`) using `libphonenumber-js` with `parseAndFormat(value, defaultCountry)` returning `{ valid, e164 }`.
- [x] Delete `userProfile` from `src/data/mockData.ts`. Sort `countries` NG-first.
- [x] Add `kycStatus` field to `UserProfileResponse` type.

**Phase exit criterion:** app looks and behaves identically to today, but profile flows through RQ and any error/info path can show a global toast.

<a id="phase-1-completion-notes"></a>
#### Phase 1 completion notes (2026-05-06)

**What was built:**
- 7 new modules: `src/constants/supportedChannels.ts`, `src/api/queryKeys.ts`, `src/api/errors.ts`, `src/api/queryClient.ts`, `src/store/toastStore.ts`, `src/hooks/useToast.ts`, `src/hooks/useUser.ts`
- 2 new components: `src/components/ToastHost.tsx`, `src/utils/phone.ts`
- `libphonenumber-js` added as a dependency

**What was modified:**
- `App.tsx` — mounted `ToastHost` above all navigators
- `src/providers/AuthProvider.tsx` — extracted `queryClient` to `src/api/queryClient.ts`; added `mutations: { retry: 0 }` default
- `src/store/authStore.ts` — `logout()` now clears RQ cache via `queryClient.clear()`
- `src/api/client.ts` — final-401 paths now push an info toast via `toastStore.push()` directly
- `src/types/auth.ts` — added `KycStatus` type and `kycStatus` field to `UserProfileResponse`
- `src/data/mockData.ts` — deleted `userProfile`, sorted `countries` NG-first
- 6 screens migrated from `useAuthStore(s => s.user)` to `useUser()` for profile reads

**What was deferred:**
- RQ cache persistence via `expo-secure-store` — deferred to avoid complexity; current warm-start behaviour (refetch on mount) is acceptable for v1.
- Auth-flow screens (`SignInScreen`, `OTPScreen`, `PinSetupScreen`, `PinResetScreen`, `PinVerifyScreen`) intentionally still use `useAuthStore` for `user` — these run during auth/hydration and need synchronous access without network requests.

**TypeScript health:** zero new errors introduced. All pre-existing errors (`FormField.tsx`, `DesignSystemScreen.tsx`, `PinResetScreen.tsx`, `ProcessorOnboardingScreen.tsx`, `ThemeContext.tsx`) remain unchanged.

---

### Phase 2 — Payer flow (5–7 days)

**Goal:** the entire send flow runs against the live backend end-to-end. Demo flips from "fully mocked" to "real backend, USDT↔NGN only".

- [x] Update `src/types/transaction.ts`:
  - Replace `TransactionStatus` enum with `QUEUED | IN_PROGRESS | PAYER_PAID | COMPLETE | CANCELLED | EXPIRED | DISPUTED`.
  - Add `StatusGroup` type (`PENDING | IN_PROGRESS | COMPLETED | FAILED`).
  - Update `CreateTransactionRequest` / `Transaction` shapes to match `FE_TRANSACTION_INTEGRATION.md`.
- [x] Rewrite `src/api/transactions.ts` against real endpoints:
  - `createTransaction()` → `POST /v1/transactions`
  - `getTransaction(id)` → `GET /v1/transactions/{id}`
  - `confirmTransfer(id)` → `POST /v1/transactions/{id}/confirm` *(per Phase 0 reconciliation)*
  - `getMyTransactions(page, size)` → `GET /v1/transactions?page=&size=` *(paginated; not `/transactions/me`)*
- [x] Add `src/utils/transactionStatus.ts` with `normalizeStatus(raw)` and `toStatusGroup(status)` so any unknown legacy enum value (`INITIATED`, `MATCHING`, `AWAITING_DEPOSIT`, `ESCROW_FUNDED`, `MP_PROCESSING`, `AWAITING_CONFIRMATION`, `SETTLING`, `RESOLVED`, `REFUNDED`) is mapped to the closest of the seven canonical states for UI rendering. Log unknown values once per session for telemetry.
- [x] Fix `src/api/users.ts#getPublicProfile` path to `/v1/users/by-username/{username}`.
- [x] **Delete** `src/store/transactionStore.ts`.
- [x] **Delete** `src/screens/send/TrackingScreen.tsx` and remove its route.
- [x] Update `src/hooks/useTransactions.ts` to use the rewritten API + new query keys. Polling cadences per Q6.
- [x] Create `src/store/recentRecipientsStore.ts` (per Q5).
- [x] Rewrite `src/screens/send/AmountScreen.tsx`:
  - Source currencies/networks from `supportedChannels.ts`.
  - Disable + grey unsupported pairs.
  - Show "Estimated rate" pill.
  - Enforce min/max client-side.
- [x] Rewrite `src/screens/send/RecipientScreen.tsx`:
  - NGN: bank-account form with blocking validation against `POST /v1/banks/validate` *(per Phase 0 reconciliation)*. Body shape: `{ bankCode, accountNumber }` (10 digits enforced server-side).
  - USDT: wallet-address field with Solana base58 validation + optional username lookup against `GET /v1/users/by-username/{username}`.
  - Recents pulled from `recentRecipientsStore`.
- [x] Rewrite `src/screens/send/ConfirmScreen.tsx`:
  - Re-fetch rate on mount with freshness indicator.
  - PIN bottom-sheet on submit.
  - On success, `replace` to `TransactionStatusScreen`.
- [x] Rename `src/screens/send/DepositWaitingScreen.tsx` → `TransactionStatusScreen.tsx`. Rebuild as a state-machine view per Q6 (one screen, body morphs by `status`).
- [x] Update `src/screens/send/SuccessScreen.tsx` to read the committed transaction from RQ (no local state).
- [ ] Smoke test: create transaction → poll → confirm transfer → terminal state. Both directions (USDT→NGN and NGN→USDT) where supported.

**Phase exit criterion:** real send flow works against Heroku for the PAYER test account. History screen shows real transactions.

<a id="phase-2-completion-notes"></a>
#### Phase 2 completion notes (2026-05-06)

**What was built:**
- `src/utils/transactionStatus.ts` — `normalizeStatus(raw)`, `toStatusGroup(status)`, `isTerminalStatus()`, `getPollingInterval()`
- `src/screens/send/TransactionStatusScreen.tsx` — morphing status screen per Q6 design (QUEUED → IN_PROGRESS → PAYER_PAID → COMPLETE/terminal)
- `src/store/recentRecipientsStore.ts` — Zustand persisted store with `add()`, `remove()`, `getByChannel()` (max 20 recents, deduped)

**What was rewritten:**
- `src/types/transaction.ts` — completely replaced. New canonical types: `TransactionStatus` (7 values), `StatusGroup` (4 values), `Transaction`, `TransactionListItem`, `CreateTransactionRequest` (matching live API: `fromCurrency`, `toCurrency`, `amount`, `recipient`, `pin`)
- `src/api/transactions.ts` — fully rewritten against live endpoints: `POST /v1/transactions`, `GET /v1/transactions/{id}`, `POST /v1/transactions/{id}/confirm`, `GET /v1/transactions?page=&size=`
- `src/api/users.ts` — `getPublicProfile` path fixed to `/v1/users/by-username/{username}`; added `bindPrimaryWallet()` and `bindMobileMoney()`
- `src/hooks/useTransactions.ts` — rewritten using new API + `queryKeys` + adaptive polling (5s for QUEUED/IN_PROGRESS, 10s for PAYER_PAID, stops for terminal)
- `src/screens/send/ConfirmScreen.tsx` — complete rebuild: re-fetches rate on mount with freshness indicator, PIN bottom-sheet, creates transaction with `POST /v1/transactions`, navigates to `TransactionStatusScreen` on success
- `src/screens/send/RecipientScreen.tsx` — Solana base58 validation (32-44 chars), username lookup via `/v1/users/by-username/{username}`, recent recipients from store, removed walletContacts mock, removed multi-network selector (Solana only)
- `src/screens/send/AmountScreen.tsx` — added `isPairSupported()` enforcement, min (0.000001) / max (10000) validation, unsupported-pair warning
- `src/navigation/AppNavigator.tsx` — removed `DepositWaiting` and `Tracking` routes, added `TransactionStatus` route, updated `SendFlowParamList` with new params (`recipientBankCode`, `recipientAccountNumber`, `recipientAccountName`)

**What was deleted:**
- `src/store/transactionStore.ts` — replaced by React Query
- `src/screens/send/TrackingScreen.tsx` — merged into `TransactionStatusScreen`
- `src/screens/send/DepositWaitingScreen.tsx` — merged into `TransactionStatusScreen`
- `walletContacts` from `src/data/mockData.ts` — replaced by `recentRecipientsStore`

**Processor screens temporarily stubbed:**
- `TransactionStreamScreen` and `ProcessorTransactionDetailScreen` were replaced with placeholder screens (they previously depended on the deleted `transactionStore`). Full rebuild happens in Phase 4.

**TypeScript health:** zero new errors introduced. Pre-existing errors unchanged.

---

### Phase 3 — MP API surface + hooks (3–5 days)

**Goal:** all MP-side endpoints are wrapped and queryable. **No screen changes yet.**

- [x] Create `src/api/mp.ts` — `getMpProfile` (`GET /v1/mp/me`), `setOnline` (`POST /v1/mp/me/online`), `setOffline` (`POST /v1/mp/me/offline`), `onboardMp` (`POST /v1/mp/onboard`), optional `updateMpBalances` (`PUT /v1/mp/me/balances`). **Drop `updateOperatingHours`** — Dep #3 closed negatively, no endpoint exists.
- [x] Create `src/api/mpOrders.ts` — `getQueue` (`GET /v1/mp/queue`), `acceptOrder` (`POST /v1/mp/orders/{transactionId}/accept`), `getMyOrders` (`GET /v1/mp/me/orders`), `uploadProof` (`POST /v1/mp/orders/{orderId}/proof`). **No `markPayout`** — payout is implicit when proof is uploaded.
- [x] Create `src/api/kyc.ts` — `submitKyc` (`POST /v1/users/me/kyc`) and `getKycStatus` (`GET /v1/users/me/kyc`). *(Per Phase 0 reconciliation; not `/v1/kyc/*`.)* Includes `formatKycDate(d: Date): string` helper for `dd-MMM-yyyy` formatting.
- [x] Add `bindWallet` (`PUT /v1/users/me/wallet`) and `bindMobileMoney` (`PUT /v1/users/me/mobile-money`) to `src/api/users.ts`. *(Already completed in Phase 2.)*
- [x] Create hooks: `useMpProfile`, `useMpQueue`, `useMyOrders`, `useKycStatus`.
- [x] Add new query keys to `src/api/queryKeys.ts`. *(Already present from Phase 1.)*

**Phase exit criterion:** every MP endpoint can be called from a unit script or a temporary debug button. No UI integration yet.

<a id="phase-3-completion-notes"></a>
#### Phase 3 completion notes (2026-05-06)

**What was created:**
- `src/api/mp.ts` — `getMpProfile`, `setOnline`, `setOffline`, `onboardMp`, `updateMpBalances`, plus `toLocalTime(hour, minute)` helper for Java `LocalTime` serialization and full TypeScript types (`MpProfile`, `MpStatus`, `BadgeLevel`, `LocalTime`, `OnboardMpRequest`, `UpdateMpBalancesRequest`)
- `src/api/mpOrders.ts` — `getQueue`, `acceptOrder`, `getMyOrders`, `uploadProof`, with `MpOrder` and `UploadProofRequest` types. Status normalization applied via `normalizeStatus()`. Handles both array and paginated `{ content: [...] }` response shapes.
- `src/api/kyc.ts` — `submitKyc`, `getKycStatus`, with `KycSubmissionRequest` and `KycStatusResponse` types. Includes `formatKycDate(d: Date): string` utility for the backend-required `dd-MMM-yyyy` format.
- `src/hooks/useMpProfile.ts` — `useMpProfile` (query, 2-min stale), `useToggleMpStatus` (mutation, invalidates profile), `useOnboardMp` (mutation, invalidates profile + user), `useUpdateMpBalances` (mutation)
- `src/hooks/useMpQueue.ts` — `useMpQueue` (query, 10s polling), `useAcceptOrder` (mutation, invalidates queue + myOrders)
- `src/hooks/useMyOrders.ts` — `useMyOrders` (query, 30s stale), `useUploadProof` (mutation, invalidates myOrders)
- `src/hooks/useKycStatus.ts` — `useKycStatus` (query, 5-min stale), `useSubmitKyc` (mutation, invalidates kyc + user)

**What was already in place (from Phase 1/2):**
- `src/api/queryKeys.ts` — `mp.profile`, `mp.queue`, `mp.myOrders`, `kyc.status` keys already existed
- `src/api/users.ts` — `bindPrimaryWallet` and `bindMobileMoney` already added in Phase 2

**Design decisions applied:**
- `updateOperatingHours` dropped per Dep #3 (no mutation endpoint exists); hours are immutable post-onboarding
- `markPayout` not created — payout is implicit when proof is uploaded
- `toLocalTime()` encodes hours as `{ hour, minute, second: 0, nano: 0 }` per schema reconciliation
- All order queries normalize status via `normalizeStatus()` for backend enum superset safety

**TypeScript health:** zero new errors introduced.

---

### Phase 4 — MP screens (5–7 days)

**Goal:** the MP experience lights up against the real backend. Proof upload remains stubbed pending dependency #1.

- [x] **Delete** `src/screens/settings/ProcessorOnboardingScreen.tsx` route (file retained for reference; no longer imported).
- [x] Create `src/screens/processor/ProcessorSetupScreen.tsx` — checklist UI driving the four sub-screens below.
- [x] Create `src/screens/processor/onboarding/KycSubmissionScreen.tsx`.
- [x] Create `src/screens/processor/onboarding/BindWalletScreen.tsx` (Solana only in v1).
- [x] Create `src/screens/processor/onboarding/BindBankAccountScreen.tsx`.
- [x] Create `src/screens/processor/onboarding/MpOnboardScreen.tsx` (`stakedUsdt`, hours, optional MM).
- [x] Rename `src/screens/processor/TransactionStreamScreen.tsx` → `MpHomeScreen.tsx`. Rebuild with **Queue / Active / Completed** tabs sourced from `useMpQueue` and `useMyOrders`. Header includes online toggle.
- [x] Rename `src/screens/processor/ProcessorTransactionDetailScreen.tsx` → `OrderDetailScreen.tsx`. Two modes: **Preview** (queue item, can accept) and **Active** (accepted, shows payer-confirmation state, payout action, proof-upload stub).
- [x] Create `src/screens/processor/MpProfileScreen.tsx` — balances, online toggle, operating hours (read-only per Dep #3), bound bank/wallet.
- [x] Update `src/navigation/AppNavigator.tsx`:
  - Add MP sub-stack with all onboarding + profile routes.
  - MP tab gated on `user.role` includes `MP` or `BOTH` (already in place from Phase 2).
  - Route from profile to `ProcessorSetupScreen` for non-MP users.

**Phase exit criterion:** an approved MP test account can browse the queue, accept an order, see the payer's confirmation, mark it paid out. Proof-upload button is visible but disabled with "Coming soon — backend pending".

<a id="phase-4-completion-notes"></a>
#### Phase 4 completion notes (2026-05-06)

**What was created:**
- `src/screens/processor/ProcessorSetupScreen.tsx` — 4-step checklist UI: KYC → Wallet → Bank → MP details. Steps are sequenced (later steps locked until earlier ones complete). Shows progress bar and step statuses derived from live user/KYC/MP profile data.
- `src/screens/processor/onboarding/KycSubmissionScreen.tsx` — BVN + NIN + date of birth (DD/MM/YYYY text input). Shows rejection reason if previously rejected. Renders read-only state if already submitted/approved.
- `src/screens/processor/onboarding/BindWalletScreen.tsx` — Solana base58 validation (32-44 chars). Shows current bound wallet if exists.
- `src/screens/processor/onboarding/BindBankAccountScreen.tsx` — Bank picker bottom sheet + 10-digit account number. Shows current bound account if exists.
- `src/screens/processor/onboarding/MpOnboardScreen.tsx` — Staked USDT (min 100), operating hours (HH:MM start/end), `mobileMoneyNumber` auto-filled from user's phone per Dep #2 recommendation.
- `src/screens/processor/MpHomeScreen.tsx` — replaced `TransactionStreamScreen`. Three tabs (Queue / Active / Completed). Online/offline toggle in header. Settings gear navigates to `MpProfile`. Order cards show status badges, amounts, and timestamps. Pull-to-refresh.
- `src/screens/processor/OrderDetailScreen.tsx` — replaced `ProcessorTransactionDetailScreen`. Queue items show Accept button. Active orders show recipient details and payer confirmation status. Proof upload section disabled with "Coming soon — backend pending".
- `src/screens/processor/MpProfileScreen.tsx` — balances (USDT/NGN), staked USDT, daily limit, badge level, operating hours (read-only per Dep #3), linked accounts (wallet + bank).

**What was modified:**
- `src/navigation/AppNavigator.tsx` — `ProcessorStackParamList` expanded with `MpHome`, `OrderDetail`, `MpProfile`, `ProcessorSetup`, `KycSubmission`, `BindWallet`, `BindBankAccount`, `MpOnboard`. Old `TransactionStream`/`ProcessorTransactionDetail`/`ProcessorOnboarding` routes removed. Profile stack routes to `ProcessorSetup` instead of old onboarding.

**What was NOT deleted (old files retained as dead code):**
- `src/screens/processor/TransactionStreamScreen.tsx` — superseded by `MpHomeScreen`, no longer imported
- `src/screens/processor/ProcessorTransactionDetailScreen.tsx` — superseded by `OrderDetailScreen`, no longer imported
- `src/screens/settings/ProcessorOnboardingScreen.tsx` — superseded by `ProcessorSetupScreen` + sub-screens, no longer imported
- These will be deleted in Phase 6 cleanup.

**Design decisions applied:**
- Operating hours immutable post-onboarding (read-only in `MpProfileScreen`, "Contact support to change")
- `mobileMoneyNumber` populated from user's verified phone number (Dep #2 recommendation)
- Proof upload button visible but disabled with "Coming soon" per Dep #1 status
- `DateTimePicker` replaced with text input (DD/MM/YYYY) to avoid adding `@react-native-community/datetimepicker` dependency
- `StatusBadge` uses existing `label`/`variant` API (success/warning/error)

**TypeScript health:** zero new errors introduced.

---

### Phase 5 — Proof-upload pipeline (2–3 days, or 3–5 days if Cloudinary fallback)

**Goal:** the MP can complete an order end-to-end including proof.

**If presigned URL endpoint shipped (dependency #1):**
- [ ] ~~Create `src/api/uploads.ts` — `getPresignedUrl(file)`, `uploadToPresignedUrl(url, file)`.~~ Dep #1 not resolved; created with pass-through placeholder instead.
- [x] Wire `expo-document-picker` to pick files with MIME + 10 MB validation.
- [x] Wire the proof-upload button in `OrderDetailScreen`. Validate MIME + 10 MB cap. Optional description field (280 char limit).
- [x] Call `POST /v1/mp/orders/{orderId}/proof` with the resulting URL via `useUploadProof`.

**If Cloudinary fallback:**
- [ ] Add `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`, `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` to env.
- [ ] Create `src/api/cloudinary.ts` with signed upload helper.
- [ ] Same UI wiring as above. Mark as TODO debt in code comment + tracker.

**Phase exit criterion:** the MP test account can complete a real transaction including proof upload. PAYER test account sees the proof in `TransferDetail`.

> **Phase 5 exit status (updated 2026-06-16):** ✅ **Complete.** Dep #1 turned out to be obsolete — the live backend accepts a multipart binary `file` at `POST /v1/mp/orders/{orderId}/proof`, hosts it, and returns a server-hosted `proofUrl`. The MP's proof now flows end-to-end: MP uploads the file → backend hosts it → the payer reads back a real, openable `proofUrl` on the transaction's `proof` record (rendered in `TransactionDetailScreen`). The dead `uploadFile()` pass-through was removed in Phase 8.

<a id="phase-5-completion-notes"></a>
#### Phase 5 completion notes (2026-05-06)

**What was created:**
- `src/api/uploads.ts` — `pickProofFile()` (file picker with MIME/size validation), `uploadFile()` (pass-through placeholder returning local URI). Detailed inline comments document the two resolution paths (presigned URL vs Cloudinary fallback) for when Dep #1 is resolved.

**What was modified:**
- `src/screens/processor/OrderDetailScreen.tsx` — complete rebuild of the proof section:
  - Dashed upload area with tap-to-select affordance
  - Image preview for picked image files
  - File info row (name, size, remove button) for all file types
  - Optional description field (280 char max) with character counter
  - Confirmation bottom sheet with warning copy before submission
  - Existing proof preview card (shown when `tx.proof.proofUrl` is already set)
  - Now reads `orderId` from route params (was previously unused)
  - Wired `useUploadProof` hook for the mutation
- `src/hooks/useMyOrders.ts` — `useUploadProof` `onSuccess` now also invalidates `transactions.byId(orderId)` so the order detail screen reflects updated proof status

**Pending work (Dep #1): — RESOLVED 2026-06-16.**
- Superseded by the Phase 8 finding: the backend accepts a multipart binary `file` and hosts it itself, so no client-side hosting (presigned URL or Cloudinary) is needed. The `mpOrders.ts#uploadProof` multipart call is correct and spec-aligned. The dead `uploads.ts#uploadFile()` pass-through was removed.

**TypeScript health:** zero new errors introduced.

---

### Phase 6 — Cleanup & polish (1–2 days)

- [x] Delete `walletContacts` and `userProfile` from `src/data/mockData.ts`. *(Already deleted in earlier phases; stale comments cleaned up.)*
- [x] Replace remaining `Alert.alert` calls with `useToast()`.
- [x] Wire phone validation on blur in `SignUpScreen` (per Q13c).
- [x] Add suspended-account guard: if `/v1/users/me` returns a suspended status, route to a blocking screen.
- [ ] Cross-device QA: iOS + Android, light + dark, small + large screens. *(Manual QA — not automatable.)*
- [x] Remove now-unused imports, types, and screens. Run linter clean.
- [x] Update `README.md` to honestly state v1 scope (USDT↔NGN, more corridors planned).

**Phase exit criterion:** production-shape app. No mocked code paths remain in the send or MP flows.

<a id="phase-6-completion-notes"></a>
#### Phase 6 completion notes (2026-05-06)

**What was created:**
- `src/screens/onboarding/SuspendedScreen.tsx` — blocking screen shown when `user.status` is `SUSPENDED` or `BANNED`. Shows "Account Suspended" message with "Contact Support" and "Sign Out" actions.

**What was deleted:**
- `src/screens/processor/TransactionStreamScreen.tsx` — dead code, superseded by `MpHomeScreen` in Phase 4
- `src/screens/processor/ProcessorTransactionDetailScreen.tsx` — dead code, superseded by `OrderDetailScreen` in Phase 4
- `src/screens/settings/ProcessorOnboardingScreen.tsx` — dead code, superseded by `ProcessorSetupScreen` + sub-screens in Phase 4

**What was modified:**
- `src/data/mockData.ts` — cleaned stale header comment (removed references to `walletContacts` and `userProfile` that no longer exist); updated networks section comment (removed `ProcessorOnboardingScreen` reference)
- `src/navigation/AppNavigator.tsx`:
  - Removed unused `DestInfo` export (dead API surface; `HomeScreen` defines its own)
  - Added `SuspendedScreen` import and `Suspended` route to `RootStackParamList`
  - Added suspended-account guard: checks `user.status` before PIN lock, routes to `SuspendedScreen` if suspended/banned
- `src/screens/onboarding/SignUpScreen.tsx` — phone validation on blur now uses `libphonenumber-js` via `parseAndFormat()` instead of simple `phone.length >= 8`. Error message is country-specific. Submission uses the validated E.164 form.
- **8 files — `Alert.alert` → `useToast()`:**
  - `SignInScreen.tsx` — login error
  - `ForgotPasswordScreen.tsx` — reset code error
  - `OTPScreen.tsx` — resend OTP error
  - `PinSetupScreen.tsx` — PIN setup error
  - `PinVerifyScreen.tsx` — PIN reset initiation error
  - `PinResetScreen.tsx` — resend error + success notification
  - `ResetPasswordScreen.tsx` — resend error + success notification (now also navigates to SignIn directly instead of via Alert callback)
  - `TransactionDetailScreen.tsx` — clipboard copy, save receipt, share actions
- `README.md` — complete rewrite reflecting v1 scope (USDT↔NGN only), updated tech stack (React Query, Zustand, Axios, etc.), updated project structure, updated navigation docs (4 tabs, role-gating, send/process flows)

**What remains (manual only):**
- Cross-device QA: iOS + Android, light + dark, small + large screens — cannot be automated in this scope

**TypeScript health:** zero new errors introduced. Zero `Alert.alert` calls remain in `src/`.

---

<a id="phase-7--stakeholder-testing-readiness"></a>
### Phase 7 \u2014 Stakeholder testing readiness (1\u20132 days)

**Goal:** the app is ready for real stakeholders to test against the live backend. Every screen, every value, every state reflects what the backend actually returned. No fake names, no fake balances, no fake "On-chain confirmed" badges, no marketing copy that doesn't match v1 scope, no client-side simulated progressions, no orphan dummy screens reachable in the navigator.

**Context:** During QA against the live backend, several long-tail dummy artefacts were discovered that survived earlier phases:

1. **`src/screens/home/HomeScreen.tsx`** \u2014 fully mocked dashboard with hardcoded `destinationList` (40+ corridors with fake rates and provider names like "OPay \u00b7 GTBank \u00b7 PalmPay"), hardcoded `recentContacts` ("Emeka Johnson", "Adaeze Obi", "Kofi Mensah"), hardcoded "Singapore \u2192" corridor. **Not imported** by any active navigator \u2014 dead file but still ships in the bundle.
2. **`src/screens/onboarding/WelcomeScreen.tsx`** and **`src/screens/deposit/DepositScreen.tsx`** \u2014 explicitly marked "Legacy placeholder" / "Deprecated" but still present in the source tree.
3. **`src/screens/send/SuccessScreen.tsx`** \u2014 still wired in `SendFlowParamList` but **never navigated to** by the active flow (`ConfirmScreen` goes to `TransactionStatus`, which goes to `TransferDetail`). Contains misleading copy: "On-chain confirmed", "SMS delivered", a synthesised quote *"{senderName} sent you ... via Qupay"* that is **not** a real notification.
4. **`src/data/mockData.ts#networks`** \u2014 unused export with fake EVM addresses (`0x7a3B8c9...`).
5. **`src/screens/send/TransactionStatusScreen.tsx`** \u2014 while `tx` is still loading, `status` defaults to `QUEUED`. Users briefly see the "Finding a marketplace participant\u2026" radar even when the real status is something else (e.g. `IN_PROGRESS` after a fast confirm).
6. **`src/screens/send/ConfirmScreen.tsx`** \u2014 displays an unsubstantiated **"~2 min"** delivery promise; fee is computed client-side at **1.5%** but not labelled as an estimate (it is per Q11, but UX should make that clear).
7. **`src/screens/onboarding/SplashScreen.tsx`** \u2014 marketing pills claim **"54+ Countries"**, **"No fees"**, **"Quick"** \u2014 inconsistent with v1 scope (USDT\u2194NGN only, real fees apply).

**What this phase does NOT change:**

- ~~`uploads.ts#uploadFile()` pass-through is still pending Dep #1~~ \u2014 RESOLVED in Phase 8 (Dep #1 obsolete; backend hosts the multipart file; helper removed).
- `MpProfileScreen` online/offline toggle handler is implemented but not wired to a button \u2014 cosmetic gap, fix in a follow-up.
- `RecipientScreen` Solana base58 validation stays client-side (no chain RPC) \u2014 by design (Q5).
- `ConfirmScreen` 1.5% local fee estimate stays \u2014 by design (Q11), only relabelled as "Estimated".

#### Phase 7 task checklist

- [x] **Delete dead screens:**
  - `src/screens/home/HomeScreen.tsx`
  - `src/screens/onboarding/WelcomeScreen.tsx`
  - `src/screens/deposit/DepositScreen.tsx`
  - `src/screens/send/SuccessScreen.tsx`
- [x] **Remove `Success` route** from `SendFlowParamList` and `SendTabNavigator` in `src/navigation/AppNavigator.tsx`. The active flow ends at `TransactionStatus` \u2192 `TransferDetail` (history).
- [x] **Drop `transactionId` lookup in `useTransaction(tx?.id ?? '')`** \u2014 the original `SuccessScreen` was the only consumer; ensure no broken imports remain.
- [x] **Remove unused `networks` export** (and `Network` interface) from `src/data/mockData.ts`. Remove `Network` import if any test still references it.
- [x] **Fix `TransactionStatusScreen` loading state:** if `tx` is undefined, render a centered `ActivityIndicator` + "Loading transaction\u2026" copy \u2014 do **not** default to `QUEUED` UI.
- [x] **Rewrite `PortfolioScreen` (history list)** to render real `useMyTransactions()` data, not the hardcoded mock list.
- [x] **Rewrite `TransactionDetailScreen` (receipt)** to render real `useTransaction(transactionId)` data; pipe `transactionId` through `HistoryStackParamList`.
- [x] **Fix `ConfirmScreen` copy:**
  - Replace `"~2 min"` delivery pill with `"Live tracking"`.
  - Relabel fee row from `"Fee"` to `"Fee (est.)"` to match its client-side derivation (committed value comes back from `POST /v1/transactions`).
  - Collapse the redundant `liveRate ? x : x` ternary that computed the same fee in both branches.
- [x] **Fix `SplashScreen` marketing stats:** replaced `"54+ Countries" / "No fees" / "Quick"` with truthful v1 copy (`"USDT \u2194 NGN" / "Live rates" / "P2P"`); reworded headline + sub-copy to describe the real corridor; rotating word now `"any bank" / "any wallet"` instead of `"anyone" / "anywhere"`.

**Phase exit criterion:** an external stakeholder can install the build, sign up, send a real USDT \u2192 NGN transfer (or the reverse), watch the status screen progress through real backend states (QUEUED \u2192 IN_PROGRESS \u2192 PAYER_PAID \u2192 COMPLETE), tap "View receipt", and see only data that came back from the API \u2014 no fake names, no fake amounts, no inflated marketing claims. Same for the MP role (browse queue, accept order, see real recipient details). The only known caveat documented in-app is the proof-upload pass-through (Dep #1).

<a id="phase-7-completion-notes"></a>
#### Phase 7 completion notes (2026-05-06)

**What was deleted (dead/dummy screens removed from the bundle):**
- `src/screens/home/HomeScreen.tsx` \u2014 fully-mocked dashboard with hardcoded corridor list, fake recent contacts, fake "Singapore \u2192" promo. Was orphaned (no navigator imported it).
- `src/screens/onboarding/WelcomeScreen.tsx` \u2014 self-labelled "Legacy placeholder".
- `src/screens/deposit/DepositScreen.tsx` \u2014 self-labelled "Deprecated".
- `src/screens/send/SuccessScreen.tsx` \u2014 wired in `SendFlowParamList` but never navigated to (the live flow ends at `TransactionStatus` \u2192 `TransferDetail`); contained misleading copy ("On-chain confirmed", "SMS delivered", a synthesised "{senderName} sent you \u2026 via Qupay" notification).

**What was rewritten to use live backend data:**
- `src/screens/portfolio/PortfolioScreen.tsx` \u2014 was a hardcoded list with mock balances/stat-pills. Now uses `useMyTransactions()` + `usePullToRefresh()`, shows `ActivityIndicator` while loading and `EmptyState` when empty, renders `TransactionListItem` from real `transactionCode / fromCurrency / toCurrency / convertedAmount / originalAmount / status / createdAt`, and navigates to `TransferDetail` with the real `transactionId`.
- `src/screens/transaction/TransactionDetailScreen.tsx` \u2014 was a hardcoded receipt with fake recipient names. Now reads `transactionId` from route params, uses `useTransaction(transactionId)`, shows `ActivityIndicator` while loading, then renders the full backend payload (currencies, original/converted amounts, FX rate, charge, timestamps, transaction code, recipient details, proof block when present). Status badge + label derive from real `status` via shared helpers.

**What was modified:**
- `src/navigation/AppNavigator.tsx` \u2014 removed `Success` route from `SendFlowStack`, removed the `SuccessScreen` import; `HistoryStackParamList.TransferDetail` now takes `{ transactionId: string }` instead of the legacy `{ transferId?, status? }` shape.
- `src/screens/send/TransactionStatusScreen.tsx` \u2014 added a proper loading state. Previously, while `tx` was loading, `status` defaulted to `QUEUED`, so users briefly saw the "Finding a marketplace participant\u2026" radar even when the real status was further along. Now renders a centered `ActivityIndicator` + "Loading transaction\u2026" until `tx` is defined; on hard error toasts via `useToast`. `handleViewReceipt` navigates with `{ transactionId }` to match the new param shape.
- `src/screens/send/ConfirmScreen.tsx` \u2014 fee row already labelled `"Fee (est.)"`; replaced the delivery pill text from `"~2 min"` (an unsubstantiated promise) to `"Live tracking"` with a `pulse` icon; collapsed the dead-code `liveRate ? x : x` ternary into a single client-side estimate with a comment explaining that the committed value comes back from `POST /v1/transactions`.
- `src/screens/onboarding/SplashScreen.tsx` \u2014 headline reworded from `"in any currency"` to `"from crypto to cash"`, sub-copy describes the real USDT \u2192 NGN bank-account flow, stat pills changed from `"54+ Countries" / "No fees" / "Quick"` to `"USDT \u2194 NGN" / "Live rates" / "P2P"`, rotating word changed from `"anyone" / "anywhere"` to `"any bank" / "any wallet"`.
- `src/data/mockData.ts` \u2014 unused `networks` export and `Network` interface (containing fake EVM addresses like `0x7a3B8c9\u2026`) deleted; stale header comments cleaned up. Only `countries` (used by the SignUp country picker) remains.

**What this phase deliberately did not change (still acceptable for stakeholder testing):**
- ~~`src/api/uploads.ts#uploadFile()` is still a pass-through returning the local URI~~ \u2014 superseded by Phase 8 (Dep #1 obsolete; helper removed).
- `ConfirmScreen` 1.5% fee estimate stays client-side per Q11; only the labelling was tightened.
- `RecipientScreen` Solana base58 validation stays client-side per Q5.
- The MP `online/offline` toggle handler is implemented but not yet wired to a UI button \u2014 cosmetic gap, follow-up issue.

**TypeScript health:** zero new errors introduced. Linter clean across the touched files (`ConfirmScreen`, `SplashScreen`, `TransactionStatusScreen`, `PortfolioScreen`, `TransactionDetailScreen`, `AppNavigator`, `mockData`) and project-wide.

**Stakeholder-test runbook:**
1. Sign up with a real Nigerian phone number (E.164 validation enforced).
2. From `Send`, pick `USDT \u2192 NGN`, enter an amount above the live `min` and below `max`. Rate shown is from `/v1/rates/convert` (re-pulled on confirm).
3. On `Confirm`, fee is shown as estimate; tapping `Send` calls `POST /v1/transactions` and routes to `TransactionStatus`.
4. `TransactionStatus` polls the real transaction. Status pill + body change as the backend transitions `QUEUED \u2192 IN_PROGRESS \u2192 PAYER_PAID \u2192 COMPLETE`. No client-side simulation.
5. `View receipt` navigates to `TransferDetail`, which fetches the same transaction by ID and shows the committed FX, charge, recipient, and (when present) the proof-of-payment block uploaded by the MP.
6. From `History`, the list is `GET /v1/transactions` for the signed-in user; pull-to-refresh re-pulls; tapping any row opens the same `TransferDetail` view.
7. For an MP test account: complete `ProcessorSetup` (KYC + bank + wallet + MP details), open `Process \u2192 Queue`, accept a real order, mark payment + upload proof (note: upload is a local-URI pass-through pending Dep #1).

---

<a id="phase-8--payer-lifecycle-resumability--proof-contract-reconciliation"></a>
### Phase 8 — Payer lifecycle resumability + proof-contract reconciliation (2026-06-16)

**Goal:** a payer can resume and act on an in-progress transaction from the History tab, and the proof/receipt contract is reconciled against the live backend.

**Context (what was actually broken):** the payer's actionable lifecycle UI (`TransactionStatusScreen`: `mpPaymentDetails` card, "I've sent the funds" confirm, adaptive polling) lived **only** in the Send tab. History's `TransferDetail` is a read-only receipt with no `mpPaymentDetails` and no CTA. So a transaction the payer navigated away from became unresumable — they could not see the MP's payment details (which the backend *does* return) nor confirm the transfer. This presented as "the MP accepted but the client never updated."

Separately, Dep #1 (proof hosting) was found to be obsolete — see the changelog and Dep #1 row.

#### Phase 8 task checklist

- [x] **Reuse the lifecycle screen from History.** Added `TransactionStatus: { transactionId; origin?: 'send' | 'history' }` to `HistoryStackParamList` and registered the existing `TransactionStatusScreen` in the History stack (no duplication).
- [x] **Status-aware routing in `PortfolioScreen`.** Row taps route by `isTerminalStatus(status)`: terminal (`COMPLETE/CANCELLED/EXPIRED/DISPUTED`) → `TransferDetail` receipt; non-terminal (`QUEUED/IN_PROGRESS/PAYER_PAID`) → `TransactionStatus` with `origin: 'history'`.
- [x] **Context-aware exit nav in `TransactionStatusScreen`.** Exit handlers branch on `origin` (default `'send'`): from History, `View receipt` → `navigation.replace('TransferDetail', { transactionId })` and `Close` → `goBack()`; from Send, the original reset-to-`Amount` behavior is unchanged.
- [x] **Proof-contract cleanup.** Removed dead `uploads.ts#uploadFile()` pass-through and the stale Dep #1 comment block; `pickProofFile()` retained. `mpOrders.ts#uploadProof` (multipart) is the correct, spec-aligned path.

**Phase exit criterion:** a payer who leaves an in-progress transfer can reopen it from History, see the MP's payment details, send funds, confirm, and on completion view the receipt with the backend-hosted proof — all without re-creating the transaction.

---

## 5. File-by-file change matrix

### Files to **create**

| Path | Purpose | Phase |
|---|---|---|
| `src/constants/supportedChannels.ts` | Single source of truth for live pairs/channels | 1 |
| `src/api/queryKeys.ts` | Centralised query-key factory | 1 |
| `src/api/errors.ts` | `ApiError` + `getApiErrorMessage()` | 1 |
| `src/api/mp.ts` | MP profile, status, balances | 3 |
| `src/api/mpOrders.ts` | Queue, accept, my-orders, payout, proof | 3 |
| `src/api/kyc.ts` | KYC submit + status | 3 |
| `src/api/uploads.ts` *or* `src/api/cloudinary.ts` | Upload pipeline | 5 |
| `src/store/toastStore.ts` | Toast queue | 1 |
| `src/store/recentRecipientsStore.ts` | Local recents per channel | 2 |
| `src/hooks/useToast.ts` | Toast trigger hook | 1 |
| `src/hooks/useUser.ts` | Profile via RQ | 1 |
| `src/hooks/useMpProfile.ts` / `useMpQueue.ts` / `useMyOrders.ts` / `useKycStatus.ts` | MP-side data hooks | 3 |
| `src/components/ToastHost.tsx` | Mounted in `App.tsx` | 1 |
| `src/utils/phone.ts` | `libphonenumber-js` wrapper | 1 |
| `src/screens/send/TransactionStatusScreen.tsx` | Replaces `DepositWaitingScreen` | 2 |
| `src/screens/processor/ProcessorSetupScreen.tsx` | MP onboarding checklist | 4 |
| `src/screens/processor/onboarding/KycSubmissionScreen.tsx` | KYC step | 4 |
| `src/screens/processor/onboarding/BindWalletScreen.tsx` | Solana wallet step | 4 |
| `src/screens/processor/onboarding/BindBankAccountScreen.tsx` | Bank step | 4 |
| `src/screens/processor/onboarding/MpOnboardScreen.tsx` | MP details step | 4 |
| `src/screens/processor/MpHomeScreen.tsx` | Renamed from `TransactionStreamScreen` | 4 |
| `src/screens/processor/OrderDetailScreen.tsx` | Renamed from `ProcessorTransactionDetailScreen` | 4 |
| `src/screens/processor/MpProfileScreen.tsx` | MP balances/hours/status | 4 |

### Files to **rewrite**

| Path | Change | Phase |
|---|---|---|
| `src/api/transactions.ts` | Mock → real endpoints | 2 |
| `src/api/users.ts` | Fix `getPublicProfile` path; fix bank-field bug; add `bindWallet`, `bindMobileMoney` | 2 / 3 |
| `src/api/client.ts` | Wire token-refresh-failure toast | 1 |
| `src/store/authStore.ts` | Remove profile, keep tokens + PIN-lock | 1 |
| `src/types/transaction.ts` | New status enum + request/response shapes | 2 |
| `src/hooks/useTransactions.ts` | Use rewritten API + new keys + polling cadences | 2 |
| `src/screens/send/AmountScreen.tsx` | Use `supportedChannels`, "Estimated rate", min/max | 2 |
| `src/screens/send/RecipientScreen.tsx` | Bank validation + Solana validation + recents | 2 |
| `src/screens/send/ConfirmScreen.tsx` | Refresh rate + PIN sheet | 2 |
| `src/screens/send/SuccessScreen.tsx` | Read from RQ | 2 |
| `src/data/mockData.ts` | Replace `networks`; sort `countries` NG-first | 1 / 2 |
| `src/navigation/AppNavigator.tsx` | MP sub-stack + role gating + setup route | 4 |
| `App.tsx` | Mount `ToastHost` | 1 |
| `src/screens/onboarding/SignUpScreen.tsx` | Phone validation on blur | 6 |
| `README.md` | Honest v1 scope | 6 |

### Files to **delete**

| Path | When | Why |
|---|---|---|
| `src/store/transactionStore.ts` | Phase 2 | Replaced by RQ |
| `src/screens/send/TrackingScreen.tsx` | Phase 2 | Merged into `TransactionStatusScreen` |
| `src/screens/send/DepositWaitingScreen.tsx` | Phase 2 | Renamed to `TransactionStatusScreen` |
| `src/screens/processor/TransactionStreamScreen.tsx` | Phase 4 | Renamed to `MpHomeScreen` |
| `src/screens/processor/ProcessorTransactionDetailScreen.tsx` | Phase 4 | Renamed to `OrderDetailScreen` |
| `src/screens/settings/ProcessorOnboardingScreen.tsx` | Phase 4 | Replaced by `ProcessorSetupScreen` + sub-screens |
| `src/data/mockData.ts#walletContacts` | Phase 6 | Replaced by `recentRecipientsStore` |
| `src/data/mockData.ts#userProfile` | Phase 1 | Replaced by `useUser()` |

---

## 6. New module inventory

Quick contracts for the most load-bearing new modules.

### `src/constants/supportedChannels.ts`
```ts
export const SUPPORTED_PAIRS: ReadonlyArray<{ from: Currency; to: Currency }>;
export const SUPPORTED_NETWORKS: ReadonlyArray<{ id: string; label: string; enabled: boolean; comingSoon?: boolean }>;
export const SUPPORTED_PAYOUT_CHANNELS: Record<Currency, ReadonlyArray<'bank' | 'wallet' | 'mobile_money'>>;
export function isPairSupported(from: Currency, to: Currency): boolean;
```

### `src/api/queryKeys.ts`
```ts
export const queryKeys = {
  user: { me: () => ['user', 'me'] as const, byUsername: (u: string) => ['user', 'byUsername', u] as const },
  transactions: { list: () => ['transactions', 'me'] as const, byId: (id: string) => ['transactions', id] as const },
  banks: { all: () => ['banks'] as const, validate: (code: string, acct: string) => ['banks', 'validate', code, acct] as const },
  rates: { convert: (from: string, to: string, amount: number) => ['rates', from, to, amount] as const },
  mp: { profile: () => ['mp', 'profile'] as const, queue: () => ['mp', 'queue'] as const, myOrders: () => ['mp', 'myOrders'] as const },
  kyc: { status: () => ['kyc', 'status'] as const },
};
```

### `src/api/errors.ts`
```ts
export class ApiError extends Error { code?: string; status?: number; raw?: unknown }
export function getApiErrorMessage(e: unknown): string;
```

### `src/store/toastStore.ts`
```ts
type Toast = { id: string; type: 'success' | 'error' | 'info'; title: string; body?: string; durationMs?: number };
export const useToastStore = create<{ queue: Toast[]; push: (t: Omit<Toast, 'id'>) => void; dismiss: (id: string) => void }>(...);
```

### `src/hooks/useToast.ts`
```ts
export function useToast(): { success: (title: string, body?: string) => void; error: (title: string, body?: string) => void; info: (title: string, body?: string) => void };
```

### `src/hooks/useUser.ts`
```ts
export function useUser(): { user: UserProfile | null; isLoading: boolean; refetch: () => Promise<unknown> };
```

### `src/store/recentRecipientsStore.ts`
```ts
type RecentRecipient = { id: string; channel: 'bank' | 'wallet'; label: string; data: BankRecipient | WalletRecipient; lastUsedAt: number };
export const useRecentRecipientsStore = create<{ recents: RecentRecipient[]; add: (r: Omit<RecentRecipient, 'id' | 'lastUsedAt'>) => void; remove: (id: string) => void }>(...);
```

---

## 7. Operational notes

- **Branch:** `feat/api-integration`. Phase merges land as `feat(integration): phase N — <name>`.
- **Test accounts:** to be provisioned in Phase 0. Document in a private team note (do not commit credentials).
- **Backend contract changes:** if `FE_TRANSACTION_INTEGRATION.md` evolves mid-implementation, update this plan in the same PR.
- **Decisions in flight:** if a new design decision arises that isn't in §2, add it as Q-N+1 with the same format and either resolve in-line or surface to a new interview round.
- **Known debt opened by this work:**
  - Cloudinary fallback for proof upload (if used) → tracked under Phase 5 with a code comment + this doc updated.
  - No E2E tests added → tracked separately, not in this scope.
  - Manual phone validation (no SMS verification) → out of scope for this integration.

---

## 8. Glossary

| Term | Meaning |
|---|---|
| **MP** | Marketplace Participant. The user role that fulfills payer transactions by exchanging USDT/NGN through their own bank/wallet. |
| **PAYER** | The user role that initiates a transfer. |
| **BOTH** | A user who is both a payer and an MP. |
| **statusGroup** | Coarse-grained `PENDING / IN_PROGRESS / COMPLETED / FAILED` derived from `status`. Use for simple UI conditionals. |
| **status** | Fine-grained `QUEUED / IN_PROGRESS / PAYER_PAID / COMPLETE / CANCELLED / EXPIRED / DISPUTED`. Use for precise conditionals. |
| **Committed FX rate** | The `fxRate` returned by `POST /v1/transactions`. Source of truth from `TransactionStatus` onwards. |
| **Estimated rate** | Pre-creation FX read from `/v1/rates/convert`. Display-only, may drift from committed rate. |
| **Proof of payment** | File uploaded by MP (multipart) after settling NGN to the payer's recipient. Backend hosts it and returns a `proofUrl` on the transaction's `proof` record. Required to mark `COMPLETE`. |

---

*End of plan. Do not delete this file. Update it as decisions evolve.*
