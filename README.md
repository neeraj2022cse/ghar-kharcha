# Ghar Kharcha — GitHub (public code) + private PIN + Google Sheets

**First time on Windows? See [START-HERE-WINDOWS.md](START-HERE-WINDOWS.md) for the simplest step-by-step setup.**

Personal expense tracker with a mobile-friendly dashboard and a **server-validated PIN**. App data lives in **your private Google Sheet**, never in GitHub or `localStorage`.

## Key facts

- **Public GitHub repository** = source code and deployment workflow **only**.
- **Private Apps Script web app** = actual app running on your phone. This is important: GitHub Pages alone cannot safely call a private `google.script.run` / Google Sheets backend. You can save the private Apps Script URL to your Android Home Screen.
- **Private Google Sheet** = all expense entries, categories, and monthly plans.
- **Google login + PIN** = 2 separate checks. PIN verification happens in Apps Script before any read/change of expense data.
- **PIN is NOT committed to GitHub**. It lives in a GitHub Actions encrypted secret, `APP_PIN`. On deployment, a fresh random secret key and an HMAC digest are generated in a **private server-only Apps Script file**. This is *one-way verification*, not reversible encryption. That generated file is gitignored and must never be uploaded to the public repository.
- **PIN change via GitHub only**: update the `APP_PIN` repository secret and manually run the **Deploy private expense app and PIN** GitHub Action. PIN edits require a deployment; changing the secret alone does not update the running app.
- **Session in memory only**; browser refresh, new tab or closing/reopening the app prompts for the PIN. The script cache expires within an hour; a new deployment invalidates previous PIN sessions. No browser LocalStorage, IndexedDB, sessionStorage or cookies created by the app to hold transactions or PIN. Google may use sign-in cookies.
- **Rate limited:** Five wrong PIN attempts cause a 15-minute lockout. Keep Google account 2-step verification enabled and avoid a guessable PIN.

## Features

- New expense: **amount, category, note, date**; edit, delete, quick repeat
- Dashboard: salary, budget, spending, savings/remaining, investments, transfers and category breakdown
- Month and year selectors on the dashboard (Jan–Dec; beginning in 2026)
- Default month/year is **the current month/year** in your phone's local time
- **December 2026 → January 2027** works automatically; subsequent years are generated dynamically
- If left open at a month boundary, app automatically moves to the new month **unless you intentionally selected another month**. Tap **This month** to resume automatic following.
- Review or edit an older month's expenses via selected month and History
- A new entry defaults to today's date in the current month, or the 1st of the explicitly selected older month. You can always modify the date before saving.
- CSV export, JSON backup/restore, Google Sheets data storage, custom categories, salary/budget per month
- Starts without importing past monthly summaries as fake individual transactions

## Required accounts / cost

Google account + GitHub Free account + desktop Node.js (for the one-time GitHub Actions credentials setup). No paid server or database. Subject to Google/GitHub free-tier quotas.

## Installation: 1) Private Google Sheet and script

1. Visit [Google Sheets](https://sheets.google.com), create a blank sheet named `Ghar Kharcha - Private Expense Data`, and keep it **Restricted / private**.
2. From the Sheet choose **Extensions → Apps Script**, name the bound Apps Script project `Ghar Kharcha`.
3. In Apps Script, paste `apps-script/Code.gs` into the default **Code.gs** file. Use **+ → HTML** to create files `Index`, `Styles`, and `Client`, and paste matching `.html` contents.
4. **Do not paste the generated PrivatePin.gs anywhere**. It will be created by GitHub Actions once the secrets are configured. Until then, PIN unlock will fail closed, as intended.
5. Run `setupDatabase` in the Apps Script editor, authorize it, and check that **Transactions**, **Categories**, **Plans** tabs appear in the sheet. This initializes a blank expense database and 19 example category names.
6. From Apps Script **Deploy → New deployment → Web app**. Set **Execute as = Me** and **Who has access = Only myself**. Deploy. Keep this web app private. Initially it will show the PIN screen but cannot unlock until the GitHub deployment completes.
7. From **Deploy → Manage deployments**, open the active deployment and copy the **Deployment ID** (not the URL). From **Project Settings**, copy the **Script ID**.

**Never deploy with `Anyone` or `Anyone with Google account` when executing as Me.** PIN protection is an additional lock, not a substitute for Google access controls. If `Only myself` is unavailable, stop.

## Installation: 2) Public GitHub repository

1. Create a new GitHub repo such as `ghar-kharcha` (public is allowed). Upload the contents of this ZIP **including** `.github/workflows/deploy-private.yml`, `.gitignore`, `apps-script/`, `scripts/` and `README.md`.
2. **Don't upload** your Google Sheet (XLSX/CSV/JSON exports), actual PIN, `.clasprc.json`, `.clasp.json`, OAuth tokens or `PrivatePin.gs`.
3. On your own computer install a recent Node.js version. In a terminal run:

```sh
npx @google/clasp login
```

   Log in with the **same Google account** owning the Sheet/Apps Script. This creates `~/.clasprc.json` on your computer; **treat it like a password**. In Apps Script settings, enable **Google Apps Script API** at https://script.google.com/home/usersettings if disabled.

4. In GitHub repo navigate to **Settings → Secrets and variables → Actions → New repository secret**. Create four secrets:

| Secret name | Value |
| --- | --- |
| `APP_PIN` | Your selected 6–12 digit PIN. Use the PIN you provided, or choose a new one; **never paste it into committed code**. |
| `SCRIPT_ID` | The Apps Script project's Script ID from Project Settings |
| `DEPLOYMENT_ID` | The existing **Web app deployment ID** from Manage deployments |
| `CLASPRC_JSON` | Full content of your local `~/.clasprc.json` file after `clasp login` |

   To read `~/.clasprc.json`, use a **local text editor** or terminal on your personal computer and paste it directly into the GitHub secret form. **Never upload or share it in the repo, a chat, or screenshots.**

5. Open **GitHub → Actions → Deploy private expense app and PIN → Run workflow** on the `main` branch. The workflow securely generates a private PIN verifier, pushes the source to the private Apps Script project, and updates the existing deployment.
6. Return to **Deploy → Manage deployments** in Apps Script and confirm that the existing web app still uses **Execute as Me / Who has access Only myself**. If anything differs, correct the deployment before using the app.
7. Open the private `/exec` Web App URL from your phone in Chrome (signed into your Google account). Enter your PIN. Open **Add to Home Screen** from the Chrome menu to save a shortcut.

### How to change PIN from GitHub later

1. GitHub repo → **Settings → Secrets and variables → Actions**.
2. Edit/update the secret **`APP_PIN`** with the new 6–12 digit PIN. (GitHub secrets cannot be read back after saving.)
3. GitHub repo → **Actions → Deploy private expense app and PIN → Run workflow**.
4. When the deployment succeeds, reopen the app. Your **new PIN** works, the previous PIN is rejected, and previously authorized sessions are invalidated.

If the workflow fails, **the old deployed app/PIN may still be active**. Do not assume the PIN was changed until a successful deployment and a manual unlock test. If you lose Google/GitHub account access, PIN recovery requires the account owner or reset and a new deployment.

### Month/year behavior examples

| When | What you see |
| --- | --- |
| Open on 24 October 2026 | October 2026 (current month) |
| Reopen on 1 November 2026 | November 2026 |
| Open on 1 January 2027 | January 2027, 2027 automatically selectable |
| Choose August 2026 | Shows only August entries and August plan; edit/delete supported |
| Tap **This month** | Goes back to the actual current month and enables auto-follow |
| Keep current-month app open over midnight on the 1st | Switches to the new month when active/visible or in the next periodic check |

## Common troubleshooting

- **Incorrect PIN:** Check which PIN is in the *current GitHub Actions secret*, deploy the workflow, then open `/exec` again. The UI intentionally does not reveal what PIN is configured.
- **Locked for 15 minutes:** Five wrong attempts. This lock applies to the script; wait the full interval.
- **App won't load:** Check you signed into the correct Google account, ran `setupDatabase`, and deployed as `Only myself`.
- **Action failed, Script API not enabled:** Visit https://script.google.com/home/usersettings and turn on the Apps Script API.
- **Action failed, authentication error:** Locally run `npx @google/clasp login` again, update `CLASPRC_JSON` secret, re-run.
- **Action failed, wrong deploy target:** Recheck `SCRIPT_ID` and `DEPLOYMENT_ID` secrets — these are different identifiers.
- **Data not loading:** The app requires internet. Test a ₹10 expense, then check your `Transactions` Sheet; if save fails, do not assume the expense was recorded.
- **Phone reboot/browser cleared:** The Google Sheet still contains your data. Just sign into your Google account and unlock again.
- **A current year is missing:** Reload the page on your phone. The dropdown generates current year and future years dynamically; there is no hard-coded end at 2026.

## Security limits

An application PIN is **not** a replacement for Google authentication. 6–12 digit numeric PINs are weaker than strong passwords; access to your Google account or GitHub deployment credentials could bypass/reset this guard. The PIN verifier resides in the **private Apps Script project** after deployment, which can be inspected by people with editor access to that project. Apps Script is not an HSM or a high-assurance password service. Don't grant editors access to the spreadsheet or script. Use Google 2-step verification. Public GitHub repos allow others to inspect source code; GitHub Actions Secrets are not included in that source, but someone with permission to modify your Actions workflow could misuse those secrets. Restrict repo write access and review changes.

Do not store cards, PAN/Aadhaar numbers, passwords, UPI PINs, or bank OTPs in expense notes. Google Sheets version history and copies/backups should be protected. No offline saves; ongoing use needs network. Your personal financial records are **not encrypted by this app before being written to Google Sheets**; they receive Google's account and storage protections. The PIN prevents access through this app, **not** direct viewing of the Sheet by someone who can sign into your Google account.

## Files

- `apps-script/Code.gs`: server-side Google Sheets CRUD, PIN verification, session and throttling.
- `apps-script/Index.html`, `Styles.html`, `Client.html`: responsive mobile UI, month/year selection, PIN screen.
- `apps-script/appsscript.json`: Asia/Kolkata timezone, private owner-only web app configuration.
- `scripts/make-private-pin.mjs`: Action-only key + digest creation from `APP_PIN` (secret never printed).
- `scripts/setup-clasp.mjs`: Action-only clasp credentials mapping, not committed.
- `.github/workflows/deploy-private.yml`: manual deploy/update PIN workflow.
- `.gitignore`: prevents accidental PIN or OAuth credential commits.
- `tests/test-server.cjs`: local mock tests (requires Node.js: `node tests/test-server.cjs`).

## Tests and limits

Code syntax and mocked Google Sheets/PIN/security flows were checked locally. **Not deployed to your real Google account**, so you must test end-to-end after you configure the four GitHub Secrets. Apps Script / Google Sheets service quotas apply. JSON backup/restore replaces records and may not be atomic; create a backup before mass changes.
