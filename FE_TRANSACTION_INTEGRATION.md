# Transaction Flow — Frontend Integration Guide

**Base URL:** `https://api.qupay.com/api`  
**Auth:** All endpoints require `Authorization: Bearer <accessToken>` unless marked public.  
**Content-Type:** `application/json`

All responses are wrapped:
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "Human-readable error" }
```

---

## Table of Contents
1. [Transaction Status Reference](#1-transaction-status-reference)
2. [Payer Flow](#2-payer-flow)
3. [MP Flow](#3-mp-flow)
4. [Shared Endpoints](#4-shared-endpoints)
5. [Error Reference](#5-error-reference)
6. [UI State Machine](#6-ui-state-machine)

---

## 1. Transaction Status Reference

| `status` | `statusGroup` | Meaning | Who acts next |
|---|---|---|---|
| `QUEUED` | `PENDING` | Waiting for an MP to accept | System (MP picks up) |
| `IN_PROGRESS` | `IN_PROGRESS` | MP accepted — payer must send funds | **Payer** |
| `PAYER_PAID` | `IN_PROGRESS` | Payer confirmed transfer sent | **MP** |
| `COMPLETE` | `COMPLETED` | MP sent funds to recipient, proof uploaded | Nobody |
| `CANCELLED` | `FAILED` | Payer did not confirm within 20 minutes | Nobody |
| `EXPIRED` | `FAILED` | No MP accepted within 24 hours | Nobody |
| `DISPUTED` | `FAILED` | Payment disputed | Admin |

**Use `statusGroup` for simple UI states.** Use `status` for precise conditionals.

---

## 2. Payer Flow

### 2.1 Create a Transaction

**`POST /v1/transactions`** · Role: `PAYER` or `BOTH`

**Request**
```json
{
  "fromCurrency": "USDT",
  "toCurrency": "NGN",
  "amount": 50,
  "recipient": {
    "bankCode": "058",
    "accountNumber": "0033978830",
    "accountName": "JOHN DOE"
  },
  "pin": "1234"
}
```

| Field | Type | Rules |
|---|---|---|
| `fromCurrency` | string | `"USDT"` or `"NGN"` |
| `toCurrency` | string | Must differ from `fromCurrency` |
| `amount` | number | Min `0.000001`, max `10000` |
| `recipient.walletAddress` | string | Required when `toCurrency = "USDT"` |
| `recipient.bankCode` | string | Required when `toCurrency = "NGN"` |
| `recipient.accountNumber` | string | Required when `toCurrency = "NGN"` |
| `recipient.accountName` | string | Required when `toCurrency = "NGN"` |
| `recipient.phone` | string | Alternative to bank fields for mobile money |
| `pin` | string | Exactly 4 digits |

**Response `201`**
```json
{
  "success": true,
  "data": {
    "id": "00d8bc26-fec9-4dbc-b686-2c5b0b9534f5",
    "transactionCode": "TX-8E2536AB19",
    "fromCurrency": "USDT",
    "toCurrency": "NGN",
    "originalAmount": 50.0,
    "chargeAmount": 0.075,
    "convertedAmount": 68647.87,
    "fxRate": 1375.02,
    "status": "QUEUED",
    "statusGroup": "PENDING",
    "recipient": {
      "bankCode": "058",
      "accountNumber": "0033978830",
      "accountName": "JOHN DOE",
      "walletAddress": null,
      "phone": null
    },
    "mpPaymentDetails": null,
    "expiresAt": "2026-04-29T21:21:25Z",
    "createdAt": "2026-04-28T21:21:25Z",
    "payerConfirmationDeadline": null,
    "proof": null
  }
}
```

> `mpPaymentDetails` is `null` while QUEUED — populate the "where to send" section only when `status = IN_PROGRESS`.

---

### 2.2 Poll Transaction Status

**`GET /v1/transactions/{id}`** · Role: `PAYER` or `BOTH`

Poll this after creating a transaction. When `status` changes to `IN_PROGRESS`, show `mpPaymentDetails` to the payer.

**Response when MP has accepted (`IN_PROGRESS`)**
```json
{
  "data": {
    "status": "IN_PROGRESS",
    "statusGroup": "IN_PROGRESS",
    "payerConfirmationDeadline": "2026-04-28T21:41:25Z",
    "mpPaymentDetails": {
      "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "bankCode": null,
      "accountNumber": null,
      "accountName": null
    }
  }
}
```

**What to render based on `fromCurrency`:**

| `fromCurrency` | Show from `mpPaymentDetails` | Instruction to payer |
|---|---|---|
| `USDT` | `walletAddress` | "Send {originalAmount} USDT to this wallet" |
| `NGN` | `bankCode` + `accountNumber` + `accountName` | "Send {originalAmount} NGN to this bank account" |

**Confirmation countdown:**  
Show a timer counting down to `payerConfirmationDeadline`. If it expires without confirmation, the transaction becomes `CANCELLED`.

---

### 2.3 Confirm Transfer Sent

**`POST /v1/transactions/{id}/confirm`** · Role: `PAYER` or `BOTH`

Call this after the payer has physically sent the funds.  
Only valid when `status = IN_PROGRESS`.

**No request body.**

**Response `200`**
```json
{
  "data": {
    "status": "PAYER_PAID",
    "statusGroup": "IN_PROGRESS"
  }
}
```

**Errors:**

| HTTP | Message | Cause |
|---|---|---|
| `409` | Transaction must be IN_PROGRESS before confirming transfer | Already confirmed or cancelled |
| `403` | This transaction does not belong to you | Wrong payer |

---

### 2.4 List My Transactions

**`GET /v1/transactions?page=0&size=20`** · Role: `PAYER` or `BOTH`

Returns all transactions for the authenticated payer, newest first.

**Query params:** `page` (default `0`), `size` (default `20`)

**Response `200`**
```json
{
  "data": [
    {
      "id": "...",
      "transactionCode": "TX-8E2536AB19",
      "status": "COMPLETE",
      "statusGroup": "COMPLETED",
      "fromCurrency": "USDT",
      "toCurrency": "NGN",
      "originalAmount": 50.0,
      "convertedAmount": 68647.87,
      "createdAt": "2026-04-28T21:21:25Z",
      "proof": {
        "proofUrl": "https://cdn.qupay.com/proof/tx-001.jpg",
        "uploadedAt": "2026-04-28T22:10:00Z"
      }
    }
  ]
}
```

---

## 3. MP Flow

### 3.1 Go Online

**`POST /v1/mp/me/online`** · Role: `MP` or `BOTH`  
**No request body.**

**Pre-conditions (validated server-side):**
- KYC must be `APPROVED`
- Account must not be `SUSPENDED`
- At least one payment method must be configured:
  - Solana wallet (`POST /v1/users/me/wallet`) for USDT transactions
  - Receiving bank account (from `POST /v1/users/me/bank-account`) for NGN transactions

**Response `204` No Content** on success.

**Errors:**

| HTTP | Message |
|---|---|
| `403` | KYC verification required before going online |
| `403` | Your account is suspended and cannot go online |
| `400` | Configure at least one payment method before going online |
| `404` | MP profile not found. Complete onboarding first: POST /v1/mp/onboard |

---

### 3.2 Go Offline

**`POST /v1/mp/me/offline`** · Role: `MP` or `BOTH`  
**No request body.** Response `204`.

---

### 3.3 View Transaction Queue

**`GET /v1/mp/queue`** · Role: `MP` or `BOTH`

Returns only transactions the MP **can fulfill** based on their configured payment methods:
- MPs with a Solana wallet see `USDT→NGN` transactions
- MPs with a bank account see `NGN→USDT` transactions

MP must be `ONLINE` to call this endpoint.

**Response `200`**
```json
{
  "data": [
    {
      "transactionId": "00d8bc26-fec9-4dbc-b686-2c5b0b9534f5",
      "transactionCode": "TX-8E2536AB19",
      "fromCurrency": "USDT",
      "toCurrency": "NGN",
      "originalAmount": 50.0,
      "convertedAmount": 68647.87,
      "expiresAt": "2026-04-29T21:21:25Z",
      "createdAt": "2026-04-28T21:21:25Z"
    }
  ]
}
```

| Field | What to show |
|---|---|
| `originalAmount` | What MP will **receive** from payer |
| `convertedAmount` | What MP must **send** to recipient |

---

### 3.4 Accept a Transaction

**`POST /v1/mp/orders/{transactionId}/accept`** · Role: `MP` or `BOTH`

First MP to call wins. Starts the payer's 20-minute confirmation window.

**Response `201`**
```json
{
  "data": {
    "orderId": "a1b2c3d4-...",
    "transactionId": "00d8bc26-...",
    "transactionCode": "TX-8E2536AB19",
    "fromCurrency": "USDT",
    "toCurrency": "NGN",
    "originalAmount": 50.0,
    "convertedAmount": 68647.87,
    "recipient": {
      "bankCode": "058",
      "accountNumber": "0033978830",
      "accountName": "JOHN DOE",
      "walletAddress": null,
      "phone": null
    },
    "status": "ACCEPTED",
    "transactionStatus": "IN_PROGRESS",
    "assignedAt": "2026-04-28T21:25:00Z",
    "expiresAt": "2026-04-29T21:25:00Z",
    "proof": null
  }
}
```

**What to show the MP:**

| `fromCurrency` | MP receives | MP must send to `recipient` |
|---|---|---|
| `USDT` | `originalAmount` USDT to their Solana wallet | `convertedAmount` NGN to `recipient.bankCode/accountNumber` |
| `NGN` | `originalAmount` NGN to their bank account | `convertedAmount` USDT to `recipient.walletAddress` |

**Errors:**

| HTTP | Message |
|---|---|
| `409` | Transaction has already been claimed by another MP |
| `400` | You need a Solana wallet configured to accept USDT transactions |
| `400` | You need bank account details configured to accept fiat transactions |

---

### 3.5 View My Orders

**`GET /v1/mp/me/orders`** · Role: `MP` or `BOTH`

Poll this to detect when `transactionStatus` changes to `PAYER_PAID` — the signal that the payer has sent funds.

**Response `200`**
```json
{
  "data": [
    {
      "orderId": "a1b2c3d4-...",
      "transactionStatus": "PAYER_PAID",
      "originalAmount": 50.0,
      "convertedAmount": 68647.87,
      "recipient": {
        "bankCode": "058",
        "accountNumber": "0033978830",
        "accountName": "JOHN DOE"
      },
      "status": "ACCEPTED"
    }
  ]
}
```

**`transactionStatus` values to watch:**

| Value | Action for MP |
|---|---|
| `IN_PROGRESS` | Waiting — payer has not yet confirmed sending |
| `PAYER_PAID` | **Check your account** — payer confirmed they sent funds |

> The MP also receives an **email** when `transactionStatus` changes to `PAYER_PAID`.

---

### 3.6 Upload Proof of Payment

**`POST /v1/mp/orders/{orderId}/proof`** · Role: `MP` or `BOTH`

Call after MP has sent funds to the recipient. Marks the transaction `COMPLETE`.  
Idempotent — re-uploading the same order returns the existing proof without error.

**Request**
```json
{
  "proofUrl": "https://cdn.qupay.com/receipts/tx-001.jpg",
  "contentType": "image/jpeg",
  "description": "NGN sent to recipient via GTBank transfer"
}
```

| Field | Required |
|---|---|
| `proofUrl` | Yes — publicly accessible URL |
| `contentType` | No |
| `description` | No — max 1000 chars |

**Response `200`**
```json
{
  "data": {
    "proofId": "...",
    "orderId": "a1b2c3d4-...",
    "transactionId": "00d8bc26-...",
    "proofUrl": "https://cdn.qupay.com/receipts/tx-001.jpg",
    "uploadedAt": "2026-04-28T22:10:00Z"
  }
}
```

---

## 4. Shared Endpoints

### 4.1 Get MP Profile

**`GET /v1/mp/me`** · Role: `MP` or `BOTH`

Returns the MP's current profile including status and balances.

---

### 4.2 Get Transaction by ID

**`GET /v1/transactions/{id}`**

Both payer and MP can use this to get the latest state at any point.

---

## 5. Error Reference

| HTTP | Scenario | Message pattern |
|---|---|---|
| `400` | Bean validation failure | Field-level messages in `message` |
| `401` | Missing / expired token | — |
| `403` | Wrong role or KYC not approved | Descriptive message |
| `404` | Resource not found | `"X not found"` |
| `409` | Duplicate / wrong state | Descriptive message |
| `500` | Unexpected server error | `"Unexpected error"` |

---

## 6. UI State Machine

### Payer UI

```
[Create Transaction]
        │
        ▼
  statusGroup = PENDING
  "Looking for an available MP..."
  Show: transactionCode, amounts, recipient summary
        │
        ▼ (poll GET /v1/transactions/{id})
  statusGroup = IN_PROGRESS
  status = IN_PROGRESS
  "An MP has accepted your transaction"
  Show: mpPaymentDetails (wallet or bank)
  Show: countdown timer to payerConfirmationDeadline
  Show: [I've sent the funds] button → POST /confirm
        │
        ▼ (after confirm)
  status = PAYER_PAID
  "Transfer confirmed — waiting for MP to complete"
        │
        ▼ (poll)
  statusGroup = COMPLETED
  "Exchange complete ✓"
  Show: proof.proofUrl

  ── Failure paths ──────────────────────
  status = CANCELLED  → "Transaction cancelled — you did not confirm within 20 minutes"
  status = EXPIRED    → "Transaction expired — no MP was available"
```

### MP UI

```
[Toggle Online]
        │
        ▼
  GET /v1/mp/queue  (poll every 10–15s)
  Show list of available transactions with originalAmount + convertedAmount
        │
        ▼ (tap Accept)
  POST /v1/mp/orders/{txId}/accept
  Show: recipient details + convertedAmount to send
        │
        ▼
  GET /v1/mp/me/orders  (poll every 10–15s)
  Watch transactionStatus:
    IN_PROGRESS  → "Waiting for payer to confirm..."
    PAYER_PAID   → "Payer has sent funds — check your account" (+ email sent)
        │
        ▼ (after sending to recipient)
  POST /v1/mp/orders/{orderId}/proof
  Upload proof URL
        │
        ▼
  Order FULFILLED, Transaction COMPLETE
```

---

## 7. Suggested Polling Strategy

| Endpoint | When to poll | Interval |
|---|---|---|
| `GET /v1/transactions/{id}` | Payer waiting for `IN_PROGRESS` | Every 5s |
| `GET /v1/transactions/{id}` | Payer waiting for `COMPLETE` after confirming | Every 10s |
| `GET /v1/mp/queue` | MP is ONLINE and browsing queue | Every 10–15s |
| `GET /v1/mp/me/orders` | MP watching for `PAYER_PAID` signal | Every 10s |

> Stop polling once `statusGroup` reaches `COMPLETED` or `FAILED`.
