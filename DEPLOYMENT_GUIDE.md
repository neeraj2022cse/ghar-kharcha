# Ghar Kharcha V3.3 — Safe GitHub & Google Apps Script Upgrade

**For your already-running V3.2.1 private app.** This is an **in-place update**, not a new installation. Phase 1 and Phase 2 are combined. Do NOT deploy old Phase 1 ZIP separately.

## What to update

| File | GitHub path | Why |
|---|---|---|
| `Code.gs` | `apps-script/Code.gs` | Phase 1 credit-card persistence, all budgets, opening debt, version safeguard |
| `Client.html` | `apps-script/Client.html` | Phase 1 calculations + Phase 2 navigation, bars, charts |
| `Index.html` | `apps-script/Index.html` | Home, budgets, charts and compact content |
| `Styles.html` | `apps-script/Styles.html` | Light theme refinements and responsive components |

**Do not change** `.github/workflows/deploy-private.yml`, `appsscript.json`, `scripts/`, GitHub Secrets, Script ID, Deployment ID or Google Sheet ID. Keep your existing private web app URL and PIN.

## A. Safety prep — before changing GitHub

1. Open the existing Ghar Kharcha app → **Settings → Full backup as JSON**. Download and safely store the file; it includes transactions, budgets and card-opening settings if the live version supports them.
2. Open the private Google Sheet → **File → Make a copy** and keep that copy private. Verify `Transactions` records are present before updating.
3. Save your existing GitHub main branch state as a Git tag or note the last successful commit hash. No personal/secret data in the tag or commit message.
4. Download the **Final V3.3 Update Only ZIP**. Extract it to a local folder. It contains the four replacement files, docs and tests; do not upload local backups or credentials.
5. Ensure `.github/workflows/deploy-private.yml` is present in the existing GitHub repository's **Actions** tab from the previous deployment.

## B. Update GitHub — browser method (no terminal required)

1. Open **https://github.com/neeraj2022cse/ghar-kharcha** and select branch **main**.
2. Open **`apps-script/Code.gs`** → pencil **Edit** → select all code → paste the V3.3 `apps-script/Code.gs` content → **Commit changes** to main.
3. Repeat for **`apps-script/Client.html`**, **`apps-script/Index.html`**, and **`apps-script/Styles.html`** using the corresponding exact file from ZIP. Upload/replace, do not create a duplicate filename with a suffix.
4. Optional but recommended: add **`PROJECT_DOCUMENTATION.md`**, **`DEPLOYMENT_GUIDE.md`**, **`RELEASE_NOTES.md`**, and the updated `tests/` folder to GitHub. These contain no passwords or private financial records.
5. Check **Code → `apps-script/`**. Confirm it has `Code.gs`, `Client.html`, `Index.html`, `Styles.html`, `appsscript.json`. Confirm **none** of `PrivatePin.gs`, `.clasp.json`, `.clasprc.json` or personal expense backups were uploaded.
6. To minimize a partially edited state, a developer can instead use a temporary local branch, commit all four files together, then merge to main. The existing workflow is manually dispatched, so merely committing to main does not deploy.

### Optional: Windows Git CLI (run from extracted full-project folder)

```powershell
# Only when you already have a local clone of your actual repository:
cd "C:\path\to\your\ghar-kharcha"
git status
# Copy the FOUR app files from the new ZIP to apps-script/ (keeping the original names)
git add apps-script/Code.gs apps-script/Client.html apps-script/Index.html apps-script/Styles.html
git commit -m "Ghar Kharcha V3.3 finance reliability and analytics"
git push origin main
```

Use GitHub file editing above if you do not have a local clone. Do not commit sensitive `.clasprc.json` or PIN files.

## C. Deploy current code using the EXISTING GitHub Action

1. Open **https://github.com/neeraj2022cse/ghar-kharcha/actions**.
2. Select **Deploy private expense app and PIN**.
3. Click **Run workflow** → select **main** → **Run workflow**.
4. Open the new workflow run and check all steps: **Generate private PIN verifier and clasp credentials**, **Deploy code to private Apps Script project**, **Update existing owner-only web deployment**. They should finish green.
5. If GitHub says `No credentials found`, re-check the existing `CLASPRC_JSON` secret (Google clasp `.clasprc.json` content), without exposing it. If it says `Script API not enabled`, confirm Apps Script API at https://script.google.com/home/usersettings .
6. If it fails, inspect the first **red step log**, not only `exit code 1`. Never paste PIN, OAuth tokens or a full credentials JSON into chat or issue trackers.

**Important:** CI updates an **existing** Apps Script deployment. Do not create another Google Sheet, run `setupDatabase` for the update, generate a new Web App or change the deployment access to `Anyone`.

## D. Verify private Apps Script settings

1. In **https://script.google.com/home/projects**, open the existing Ghar Kharcha project.
2. **Deploy → Manage deployments** → verify the current **Web app** is owned by your account, **Execute as Me**, **Who has access: Only myself**.
3. Copy or open the **existing `/exec`** Web App URL. Use `/exec`, not developer `/dev` URL.
4. Test on a laptop and Android Chrome signed into the **same Google account**. Reopen/refresh and enter your existing PIN.
5. If the app reports **Outdated Apps Script backend detected**, do not add entries; verify all four files were replaced and the successful GitHub run targeted the correct Script ID/Deployment ID.

## E. Database upgrades and first live validation

On first authenticated load the backend safely ensures/upgrades the schema. Look for these **six** private Sheet tabs:

```text
Transactions | Categories | Plans | CategoryBudgets | CategoryBudgetOverrides | CreditCardSettings
```

- `Transactions` must have **Column I = IsCreditCard**. Pre-existing rows may read as `FALSE` until you correctly mark them via History → Edit.
- `CreditCardSettings` holds optional opening month and unpaid balance. If earlier transactions exist outside the tracking period, first reconcile against your last real card statement; don't blindly add debt again.
- Never delete/re-create historical Sheets. Normal code deployment does not replace them.

### Live smoke test (use small test transactions and delete only after validating)

1. In Settings, set a simple SIP default budget (e.g. ₹2,000) and a month override (e.g. ₹4,000). Confirm both save and appear as correct Actual / Budget.
2. Add a new ₹10 **Mobile Recharge** Expense with **Paid using Credit Card checked**. Verify the private Sheet row has `IsCreditCard = TRUE`.
3. Verify Home **Expense +₹10**, **Card Outstanding +₹10**, **Card Bill Paid unchanged**.
4. Edit an existing ordinary Expense, check `Paid using Credit Card`, save; Outstanding increases. Uncheck it and save; Outstanding decreases.
5. If desired, record a small qualifying `Credit Card Bill` Transfer test *only if its historical debt is properly tracked*. Verify Bill Paid increments; new purchase count does not.
6. Go to Home: compact Snapshot, breakdown `Expenses / Investments / Card Bill Paid` with Actual/Budget. Tap Snapshot → History; selected month remains selected.
7. In Home/Budgets choose an over-budget category: continuous green + red line must appear with numeric `over` amount.
8. Insights: colored Budget/Actual/Over legend; monthly line and stacked columns must both update when changing Year. Only months with records get bars.
9. Check the income and estimated remaining figures against your intended accounting rules in `PROJECT_DOCUMENTATION.md`.
10. Delete test entries; recheck real totals and confirm data in the private Google Sheet. Keep the backup taken before deployment.
11. For access security, use a signed-out Incognito session: owner-only `/exec` should not expose the PIN/app to a non-owner.

## F. On Android phone

1. Open the existing `/exec` URL in Chrome while signed into the same Google account.
2. Refresh/reopen; the new version should appear at **the same URL**. If stale, close the existing app tab/shortcut, then reopen; if necessary use Chrome site settings to clear cached page data (not the Google Sheet).
3. PIN unlock should still use the existing PIN (unless you changed `APP_PIN` Secret yourself).
4. To add a Home Screen shortcut: Chrome menu **⋮ → Add to Home screen**. If you already have one, keep using it; update does not require another shortcut.

## G. Rollback if live checks fail

1. **Stop adding transactions** while results are suspect. Do not run Restore or Delete All as a first response.
2. Find the prior known-good Git commit or Git tag. Revert the four app files to that commit on `main` and manually run the same GitHub Action.
3. Verify the existing private Web App URL is back on the previous version. **Do not downgrade blindly if new Sheet schema was already extended**—the prior frontend may not understand Phase 1 new features. Prefer fixing the current code if so.
4. Restore a Sheet copy or JSON backup only after verifying that data was truly damaged and understanding restore replacement behavior. Do not overwrite fresh entries with an older backup.

## H. Ongoing maintenance

- For UI-only updates, normally change `Index.html`, `Styles.html`, `Client.html` and the relevant tests.
- For financial/backend updates, change `Code.gs` and its client counterpart together. Keep source snapshot version and capabilities compatible.
- Every update: backup → commit → manual GitHub Action → live smoke test.
- Keep access `Only myself`, Sheet `Restricted`, and both Google and GitHub 2FA enabled.
- Public GitHub is source code only, never financial data or secrets.

For all features, formulas and security limitations, refer to **`PROJECT_DOCUMENTATION.md`**.
