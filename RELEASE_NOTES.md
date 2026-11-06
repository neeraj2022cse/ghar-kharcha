# Ghar Kharcha V3.3 — Final Combined Release Notes

**Status:** Both phases complete and locally tested; production deployment not yet performed.

## Phase 1 — Finance correctness and data safety (5 items)

- CC-001: card purchase flag persisted and verified, mixed old backend rejected, Outstanding distinct from Bill Paid.
- BG-002: all category types support default and month-specific budgets.
- R-01: complete-budget coverage logic and safe fallback to overall monthly plan.
- R-02: card opening balance and unmatched repayment reconciliation.
- R-03: planned savings, user Master Recorded Total and estimated cash/bank remaining distinguished.

## Phase 2 — Mobile UI and reporting (7 items)

- UI-003: Monthly Money Snapshot compact, tap/keyboard opens selected-month History.
- UI-004: four KPI cards compact with preserved data.
- UI-005: green + red segmented over-budget category progress bars (Home + Budgets).
- UI-006: Expense/Investment/Card Bill Paid Actual / Budget with **Not set** on incomplete group budgets.
- UI-007: Snapshot → History navigation (selected month retained).
- CH-008: budget comparison blue/green/red legend swatches.
- CH-009: year-controlled Jan–Dec stacked columns for Expenses, Investments, Card Bill Paid below existing yearly line graph.

*The feature identifiers deliberately count UI-003 and UI-007 separately: compact hero and new navigation behavior.*

## Compatibility

- Update the **four files** `Code.gs`, `Client.html`, `Index.html`, `Styles.html` **together** from this release. Do not reuse the older V3.2.1 `Code.gs`.
- GitHub deploy workflow, PIN verification secret names, Apps Script manifest and private URL remain unchanged.
- Only additive Google Sheet changes; old records are not erased. Six private tabs after migration.
- Tests are simulated/local; verify on the actual owner Google account after deployment.
