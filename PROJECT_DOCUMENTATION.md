# Ghar Kharcha — Complete Project Documentation

**Release:** V3.3 · Combined Phase 1 + Phase 2  
**Target:** Personal, single-owner mobile expense tracker (Google Apps Script web app + private Google Sheet)  
**Status:** Implemented and locally tested, **not deployed to the user's live Google account**  
**Maintainer:** Repository owner  
**Timezone / currency:** Asia/Kolkata / INR (₹)  
**Earliest user-selectable year:** 2026; years extend automatically into 2027 onward.

> This document is the canonical project reference. It covers architecture, user features, financial calculations, Sheet data structures, security, code layout, deployment, testing, backup/restore, limits and known considerations. It contains **no real PIN, Google credentials, Script ID, Deployment ID or private expense data**.

## 1. Purpose and product scope

Ghar Kharcha replaces manual monthly Excel updates with a simple mobile-friendly interface. It helps a family track each transaction, category budgets, investments, credit-card purchases and repayments, monthly income, estimated money remaining and analytics. The owner uses the private web-app URL in Chrome and can create an Android Home Screen shortcut. It is **not a native APK, bank integration or true bank statement**.

The five bottom navigation tabs are Home, Add, Insights, History and Settings. **Category Budgets** is accessible from Home/Settings as a separate management view. The app supports only a single user's Google account; family-sharing and multi-user sync are not implemented.

## 2. System architecture and data flow

```text
Public GitHub repository (SOURCE CODE ONLY)
  apps-script/{Index,Styles,Client,Code,appsscript.json}
  scripts/{make-private-pin,setup-clasp}
  .github/workflows/deploy-private.yml
            |
            | Manual GitHub Actions dispatch; private CI secrets
            v
Private Google Apps Script Web App (execute as owner / access MYSELF)
  HTML/CSS/JS interface
  Server-side PIN verification + cached one-hour session
  Authenticated Google Sheet read/write methods
            |
            v
Private Google spreadsheet in the owner's Google Drive
  Transactions, Categories, Plans,
  CategoryBudgets, CategoryBudgetOverrides, CreditCardSettings
```

- `Index.html` defines screens and form markup.
- `Styles.html` defines the responsive light theme, icons, cards, progress bars and charts.
- `Client.html` contains browser interactions, business calculations, SVG chart renderers and server RPC calls.
- `Code.gs` verifies sessions, validates inputs and reads/writes spreadsheet rows.
- `appsscript.json` requests V8, Asia/Kolkata timezone and `MYSELF` web-app access.
- Financial data is **not persisted to browser localStorage/sessionStorage**. It resides in Google Sheets, with current data held transiently in browser memory while the app is open. Chrome/device caches still exist as with any web page.
- Internet and an authenticated Google session are required for data operations. The interface is not offline-capable.

## 3. Features: by screen

### 3.1 Login / PIN

- PIN gate for 6–12 digit numeric PIN; default login is always locked when opening the page anew.
- PIN verification is performed on the Apps Script server, never compared against a client-side PIN hash.
- Five invalid attempts in a 15-minute window produce a 15-minute lock.
- Successfully unlocked sessions are cached server-side for up to one hour.
- An outdated backend snapshot is rejected **before showing financial data**. This prevents previous client/backend deployment mismatches that silently lost credit-card flags.
- PIN rotation: update the `APP_PIN` GitHub Actions secret and rerun the existing workflow. The plaintext PIN and verifier are not committed to public source control.

### 3.2 Home

- Current month/year displayed by default. Previous/next arrows, month/year selectors and `Today` let you browse old or new months. App tracks the new calendar month automatically when in follow-current mode; manual browsing is respected.
- **Compact, clickable Monthly Money Snapshot**: Master Recorded Total, month transaction count, overall budget progress, budget coverage, projected savings (when plan complete), and a `View month history` cue. Mouse/touch and Enter/Space navigate to History without losing the selected month.
- Three **Actual / Budget** summary lines: Expenses (including card purchases), Investments, and Credit Card Bill Paid. If any category budget in a group is missing, that group's budget is shown as **Not set** instead of a misleading partial sum.
- Four compact KPIs: Monthly Income, Estimated Remaining, Investments and Card Bill Paid.
- Credit Card Outstanding card and current-month card purchases. Outstanding is informational only and is not re-added to Master Recorded Total.
- Card reconciliation note when older debt/payment history is incomplete.
- Estimated Cash/Bank Outflow and Estimated Cash/Bank Remaining separate from the owner's Master Recorded Total.
- Category budgets with green amount within the category limit, red amount exceeding the limit **on a single continuous bar**. Remaining unused space stays neutral grey. No percentages displayed.
- Recent transactions, searchable History shortcut, and Category Budgets management shortcut.

### 3.3 Add / Edit transaction

- Required Amount, Category, Date; optional Note (up to 160 characters).
- Categories can be Expense, Investment or Transfer.
- Small `Paid using Credit Card` checkbox, **unchecked by default**, offered only on Expense entries. This flags a *new purchase*, not a bill payment.
- Saving a card purchase affects the Expense total and Card Outstanding; it **must not** increase Card Bill Paid.
- Entry editing preserves and can change the credit-card checkbox. Backend checks the persisted `IsCreditCard` column before acknowledging Save.
- Quick Repeat offers recent prior entries; the form resets appropriately for the next entry.
- Server-side data validation and duplicate transaction ID protection.

### 3.4 Insights / Analytics

- Donut chart: selected month's Master categories, with category labels and percentage breakdown.
- Budget vs Actual: two horizontal bars per configured category, with colored line legend: **blue = budget**, **green = actual**, **red = over budget**.
- Monthly Total Trend (existing line chart): up to 12 points for selected year, Master Recorded Total and complete monthly budget; missing recorded months are gaps (not falsely reported as zero spending).
- **New stacked monthly column chart** beneath the line chart: Jan–Dec selected year; teal Expenses, violet Investments, amber Card Bill Paid. Only months with transactions have bars. Same year selector controls both charts. Each SVG segment includes an accessible title with the group and amount.
- Built-in inline SVG rendering, with no external chart CDN. Empty chart states are explicitly shown.

### 3.5 History

- Month filter, category filter and note/category search; month-aware count and amount.
- Edit and Delete with confirmation.
- A credit-card expense displays `Card purchase`; dedicated card-bill payment displays `Credit card bill repayment`; ordinary transfers display `Transfer`.

### 3.6 Category Budgets

- Budget rules allowed on **all** category types: Expense, Investment and Transfer.
- **Default rule:** applies each month unless overridden.
- **Selected-month override:** applies only to that calendar month; other months retain the default.
- Zero is an intentional zero budget; blank Save removes a budget rule.
- Explicit amount spent/limit and remaining/exceeded. Two-color segmented progress bars used in budget list and Home.
- Category-level budget is independent from Master spending: an internal self-transfer can have its own budget, but is not an expense in the Master calculation.
- A separately configured overall monthly fallback budget is used when category coverage is incomplete.

### 3.7 Settings & data tools

- Set salary/income and optional fallback overall monthly budget for a specific month.
- Configure optional credit-card opening debt *immediately before* first tracked month (used for historical reconciliation, not an expense).
- Add, rename and change category type (with backend safety validation for existing entries).
- CSV export and import, JSON full backup and restore.
- Delete all records behind two confirmation prompts. Restore/replacement is destructive: keep external backup and a duplicate Sheet first.

## 4. Financial calculations — authoritative business rules

### 4.1 Monthly totals

Given transactions in a selected month:

```text
Expense total            = Sum of all Expense entries (including card purchases)
Investment total         = Sum of all Investment entries
Card Bill Paid           = Sum of qualifying Credit Card Bill / repayment Transfer entries
Other Transfers          = Sum of all other Transfer entries
Master Recorded Total    = Expense + Investment + Card Bill Paid
Estimated Remaining      = Month Salary − Master Recorded Total
Current Cash/Bank Outflow= Expense − New Card Purchases + Investment + Card Bill Paid
Est. Cash/Bank Remaining = Month Salary − Current Cash/Bank Outflow
Planned Savings          = Month Salary − Complete Overall Budget (only if complete or fallback exists)
```

**Important accounting distinction:** This Master Total is a user-chosen *monthly recorded activity measure*. A card purchase is recorded as Expense in its purchase month and its bill payment is also included in the Master Total in its repayment month. Summing Master Totals over multiple months can therefore **double-count** those purchases. Do not label Master Total as a bank-account balance or accrual-correct spending. Use the separate Cash/Bank estimate for payment timing, and rely on bank statements for actual balance.

### 4.2 Credit-card outstanding

- The purchase checkbox **only** marks an Expense paid using the card. It adds to card purchases/outstanding and Expense total.
- `Credit Card Bill` is the special repayment Transfer category; it adds to **Bill Paid** (and user-selected Master Recorded Total), and settles previously tracked unpaid debt.
- Estimated opening balance is **unpaid debt immediately before `OpeningMonth`**.
- Process months sequentially: apply a month's repayment to older debt first; then add that month's new card purchases. This deliberately avoids consuming new-month purchases with an older statement repayment.
- If repayments exceed tracked prior debt, show unmatched repayment warning, rather than silently making Outstanding negative.
- Outstanding is never separately added again to Master Recorded Total.
- Credit card bills, credits/refunds, multiple cards, future-dated payment cycles, fees and interest are not modeled as separate bank-grade statements.

Example:

| Month | Action | Expense | Bill Paid | Card Outstanding |
|---|---|---:|---:|---:|
| Oct | Card purchase ₹600 | +₹600 | — | +₹600 |
| Nov | Pay Oct card bill ₹600 | — | +₹600 | −₹600 old debt |
| Nov | New card purchase ₹900 | +₹900 | — | +₹900 current debt |

### 4.3 Budget interpretation

```text
Category effective budget = selected-month override if present,
                            else category default if present,
                            else Not set

Group budget (Expense / Investment / Card Bill)
   = sum of category budgets in that group ONLY if ALL group categories are configured
   = Not set otherwise

Master Overall Budget
   = sum of eligible category budgets if EVERY Master category is configured
   = explicitly entered month overall budget if category coverage incomplete and fallback exists
   = Incomplete otherwise
```

Master category eligibility: Expense, Investment and dedicated Credit Card Bill categories. Self/bank transfers have category budgets but do **not** enter Master Total or Master Budget. A configured zero is real and differs from Not set.

### 4.4 Progress-bar meanings

- **Within limit:** Filled green part = actual/limit; grey remains unused.
- **Over limit:** A fully filled continuous bar splits between *green limit/actual* and *red excess/actual*; e.g. a ₹5,000 limit and ₹8,086 actual renders about 61.8% green and 38.2% red. UI does **not** display percentages, only amount/remaining/exceeded.
- **Zero budget with positive spending:** Entire bar red.
- **Not set:** Neutral empty bar.

## 5. Google Sheet schema

The spreadsheet is **private and the single source of truth**. The script creates/upgrades sheets without intentionally deleting old entries during normal deployment.

| Sheet tab | Column headers | Purpose |
|---|---|---|
| `Transactions` | `ID, Date, CategoryID, Amount, Note, Type, CreatedAt, UpdatedAt, IsCreditCard` | Individual transactions, `TRUE/FALSE` card flag in column I |
| `Categories` | `ID, Name, Type` | Category directory, stable IDs |
| `Plans` | `Month, Income, Budget` | Month-specific salary/income and optional fallback overall budget |
| `CategoryBudgets` | `CategoryID, Budget` | Default per-category budgets |
| `CategoryBudgetOverrides` | `Month, CategoryID, Budget` | Month-specific overrides |
| `CreditCardSettings` | `Key, Value` | OpeningMonth, OpeningAmount for debt reconciliation |

**Migration:** Old eight-column `Transactions` is extended to column I (`IsCreditCard`), with older entries defaulting to non-card unless explicitly corrected. `CreditCardSettings` is created automatically if absent. Existing transactions, categories and plans are not cleared during this additive schema migration. If a source file older than Phase 1 is accidentally deployed alongside new UI, the snapshot capability check must reject it.

`setupDatabase` is for **first-time initialization** only. Do not rerun as an upgrade step; normal app data access ensures new sheets as necessary.

## 6. Security & privacy

- Keep **Web App → Execute as Me / Who has access: Only myself**. `appsscript.json` declares `MYSELF` and owner execution. Verify in **Deploy → Manage deployments** after updating.
- Keep Google Sheet **Restricted** and unshared; use Google Account 2-step verification.
- Source may be public on GitHub, but **never commit credentials or financial data**. `.gitignore` covers `PrivatePin.gs`, `.clasp.json`, `.clasprc.json`, CSV/XLSX and backup JSON.
- GitHub Actions `APP_PIN`, `SCRIPT_ID`, `DEPLOYMENT_ID`, `CLASPRC_JSON` must remain in **repository secrets**. These secrets are sensitive; do not screenshot or paste their values into chat or logs.
- The workflow generates a private PIN HMAC verifier (`PrivatePin.gs`) during CI, not in public git.
- Security is defense-in-depth but not a bank-grade audited product. PIN does **not** encrypt the Google Sheet and does not protect against someone who already controls your Google account. Google Sheet owners/editors can read data directly.
- Server read/write methods require a short-lived session and validate inputs. App rejects an incompatible old backend snapshot.
- PIN login session is server-cached for one hour; browser refresh/reopen requires PIN again. There is no biometric authentication, automatic logout button, device-to-device encrypted sync or end-to-end encryption.
- For controlled security validation, open the `/exec` URL while signed out or in Incognito; a non-owner should not reach the app/PIN UI if deployment access is correct.

## 7. Source structure

```text
ghar-kharcha/
├── .github/workflows/deploy-private.yml
├── .gitignore
├── apps-script/
│   ├── Code.gs
│   ├── Client.html
│   ├── Index.html
│   ├── Styles.html
│   └── appsscript.json
├── scripts/
│   ├── make-private-pin.mjs
│   └── setup-clasp.mjs
├── tests/
│   ├── test-server.cjs
│   ├── test-calendar.cjs
│   ├── test-phase1-finance.cjs
│   ├── test-phase2-ui.cjs
│   ├── test-phase2-browser.py
│   └── other regression tests ...
├── README.md
├── PROJECT_DOCUMENTATION.md
├── DEPLOYMENT_GUIDE.md
└── RELEASE_NOTES.md
```

The generated `PrivatePin.gs` exists **only in the CI workspace and deployed Apps Script source**, never in the public ZIP or repository. The `.clasp.json` and OAuth `.clasprc.json` are also generated/created locally or in CI, not committed.

## 8. How to run and develop

### Update UI only

- Update `apps-script/Index.html` for markup, `Styles.html` for CSS, and `Client.html` for client interactions/charts.
- Update `apps-script/Code.gs` for server/database/calculation compatibility changes only. Deploy all four modified files together.
- Keep the current workflow, PIN and Apps Script project/deployment IDs unchanged.
- Make a fresh full JSON backup and Google Sheet copy before each meaningful deployment.
- Test mock browser and finance suites (commands below). There is **no connected live Google test account** in this project.

### Regression tests (developer laptop with Node.js, Python, Playwright + Chromium)

```powershell
node tests/test-server.cjs
node tests/test-calendar.cjs
node tests/test-v31-client.cjs
node tests/test-v321-card-classification.cjs
node tests/test-phase1-finance.cjs
node tests/test-phase2-ui.cjs
python tests/test-v321-browser.py
python tests/test-phase1-browser.py
python tests/test-v32-ui.py
python tests/test-phase2-browser.py
```

Mock tests demonstrate code behavior in simulated Sheets and browser environments, **not live Google OAuth/Apps Script execution**. A visual release smoke test covers 320, 360, 390, 430 and 768px viewports.

### Current project release procedure

See **`DEPLOYMENT_GUIDE.md`** for the exact existing-repository upgrade process, backup, secret hygiene, deploying via `workflow_dispatch`, and the live verification checklist.

## 9. User acceptance checklist after deployment

- Owner-only private link denies signed-out users.
- PIN opens the app; wrong PIN is rejected; valid PIN retrieves `version:5` snapshot.
- Google Sheet includes `IsCreditCard` column I and all six tabs.
- Add ₹10 card purchase: Expense +₹10, Outstanding +₹10, Bill Paid unchanged; verify `TRUE` in column I.
- Edit a normal expense and check card flag: Outstanding increases; uncheck: decreases.
- A Credit Card Bill Transfer increases Bill Paid; does not increase current purchases.
- SIP and ordinary Transfer category default/monthly budgets save; only qualifying Master categories affect Master Budget.
- Category green/red segmented progress and group Actual/Budget correct.
- Snapshot tap opens History for selected month.
- Year selector updates both yearly line and stacked-column charts; missing months remain absent.
- Import/export/backup remains available; 2027 January rollover works.

## 10. Known limitations & operational guidance

1. **Card balance is estimated**. Without older statements, opening balance or credits/refunds, it may not match the bank. Reconcile old transactions manually; no automatic bank import.
2. **No offline data entry**. Saving needs an internet connection and Google Apps Script availability.
3. **Master Recorded Total can double-count card activity across months** by deliberate user preference. Distinguish it from Cash/Bank Outflow.
4. **Full JSON backup restore replaces records**. It is not atomic across all six Sheets. Make both an offsite JSON backup and duplicate Sheet first.
5. **No automated backup/scheduled job** included. Export regularly (e.g. monthly) or use Google Drive's own Sheet copy manually.
6. **Apps Script quotas apply**, and large transaction volumes can slow reads; server currently enforces up to 10,000 entries and CSV import batches of 1,000.
7. **GitHub Actions clasp OAuth credentials** are powerful and may expire or be revoked. Rotate/re-authorize promptly and avoid committing them to git.
8. **Single-owner architecture**. Do not turn `Who has access` to Anyone to share with family; that changes the security model.
9. **Light UI theme and SVG charts** are optimized for mobile Chrome; test the specific phone after every visual release.

## 11. Final agreed change register

| ID | Feature | Phase | State |
|---|---|---|---|
| CC-001 | Persisted card flag, outstanding reconciliation and backend version guard | 1 | Implemented/tested locally |
| BG-002 | Default and monthly budgets for Expense, Investment, Transfer | 1 | Implemented/tested locally |
| R-01 | Budget coverage and partial-budget fallback | 1 | Implemented/tested locally |
| R-02 | Opening credit-card balance and unmatched repayment reconciliation | 1 | Implemented/tested locally |
| R-03 | Planned, Master-recorded and cash/bank estimate clarity | 1 | Implemented/tested locally |
| UI-003 | Compact monthly snapshot | 2 | Implemented/tested locally |
| UI-004 | Compact KPI cards | 2 | Implemented/tested locally |
| UI-005 | Green+red continuous category progress bar | 2 | Implemented/tested locally |
| UI-006 | Three group Actual/Budget summaries | 2 | Implemented/tested locally |
| UI-007 | Snapshot → selected-month History | 2 | Implemented/tested locally |
| CH-008 | Colored line legends in Budget vs Actual | 2 | Implemented/tested locally |
| CH-009 | Selected-year monthly stacked column chart | 2 | Implemented/tested locally |

**Final status: 12/12 agreed items implemented and passed available local tests.** Production deployment and live account acceptance remain to be completed by the owner.
