# Ghar Kharcha — Windows laptop se first deployment

**What runs where:** GitHub holds public source code only. The real app opens at a private Google Apps Script `/exec` URL. Data is in your private Google Sheet. No GitHub Pages setup needed.

## 0. Prerequisites

- A personal Google account signed in on desktop and phone (2-Step Verification recommended).
- GitHub account, Git for Windows (`git --version`) and Node.js 20+ (`node --version`).
- ZIP contents extracted with `.github` and `.gitignore` intact.
- Never put your PIN, `.clasprc.json`, `.clasp.json`, backups or CSV in the public repository or send them in chat. Choose a **new** PIN if you ever shared the previous one.

## 1. GitHub — public code only

1. Visit https://github.com/new. Repo name `ghar-kharcha`, visibility Public, leave README unchecked; create the repo.
2. In Windows Terminal/VS Code terminal, from extracted folder (the folder that has `apps-script`, `.github`, `scripts`):

```powershell
cd "C:\path\to\Ghar-Kharcha-GitHub-PIN"
git init
git branch -M main
git add .
git commit -m "Initial Ghar Kharcha secure tracker"
git remote add origin https://github.com/YOUR_USERNAME/ghar-kharcha.git
git push -u origin main
```

You might be asked to set Git name and email with `git config --global user.name ...` / `git config --global user.email ...` and sign in to GitHub. Verify `.github/workflows/deploy-private.yml` exists in your online repo. Do **not** enable GitHub Pages.

## 2. Google Sheet and Apps Script

1. Visit https://sheets.google.com > Blank spreadsheet > rename to `Ghar Kharcha - Private Expense Data`. Share settings should say Restricted.
2. Select Extensions > Apps Script. Name the project `Ghar Kharcha`.
3. Replace default `Code.gs` content with `apps-script/Code.gs`.
4. Click `+` (next to Files) > HTML **three times** and create **Index**, **Styles**, **Client** (no `.html` typed in the dialog). Paste the corresponding code from the extracted `.html` files. Click Save.
5. From function dropdown select `setupDatabase`, click Run. Allow requested spreadsheet permissions in Google authorization (check you are authorizing **your own script**).
6. Check Sheet has tabs `Transactions`, `Categories`, `Plans`. Keep it private.
7. Apps Script > Deploy > New deployment > gear/Select type > **Web app**. Execute as: **Me**; Who has access: **Only myself**. If the latter isn't available, **do not** make an `Anyone` deployment. Deploy.
8. Save the `/exec` **Web app URL**, its **Deployment ID** (Apps Script > Deploy > Manage deployments), and **Script ID** (Apps Script > Project Settings > IDs).
9. At this point the PIN page might appear but unlock will not work until GitHub Actions sets up the private PIN verifier.

## 3. Set up clasp on Windows (only once)

1. Install Node.js LTS https://nodejs.org and reopen Windows Terminal. Verify with:

```powershell
node --version
npm --version
```

2. In your own Google account open https://script.google.com/home/usersettings and turn **Google Apps Script API** On.
3. Run in Windows Terminal:

```powershell
npx --yes @google/clasp login
```

4. Complete Google sign-in for the **same account owning the Sheet/Apps Script**. The login writes credentials at `C:\Users\YOUR_WINDOWS_USER\.clasprc.json` (equivalent to `$env:USERPROFILE\.clasprc.json`). Never paste the credentials into chat, GitHub code, or screenshots.
5. To open the credentials file locally:

```powershell
notepad "$env:USERPROFILE\.clasprc.json"
```

Copy the **entire JSON** directly into the GitHub secret `CLASPRC_JSON`, and then close the editor. Protect the Google account and GitHub repository: this token grants powerful script access.

## 4. Add four GitHub Actions secrets

GitHub repo > Settings > Secrets and variables > Actions > New repository secret:

| Secret | Value | Where to get it |
| --- | --- | --- |
| `APP_PIN` | A newly chosen 6–12 digit PIN | Choose privately, DO NOT commit to code |
| `SCRIPT_ID` | Script ID | Apps Script > Project Settings |
| `DEPLOYMENT_ID` | Deployment ID | Apps Script > Deploy > Manage deployments |
| `CLASPRC_JSON` | Full `.clasprc.json` content | Windows PC, after `npx @google/clasp login` |

These are **Actions secrets**, not Actions variables or a file in the repository. GitHub doesn't reveal a saved secret later; to replace it, update the secret.

## 5. Deploy app and PIN

1. GitHub repo > Actions > **Deploy private expense app and PIN** > **Run workflow** > select `main` > Run workflow.
2. Open the workflow run. Confirm the steps `Generate private PIN verifier`, `Deploy code to private Apps Script project`, and `Update existing owner-only web deployment` are green.
3. In Apps Script > Deploy > Manage deployments verify web app stays **Me / Only myself**. Existing `/exec` URL remains the same.
4. If workflow fails, use its error message; no new PIN is guaranteed active until workflow completes successfully.

## 6. Phone (Android)

1. Sign into Chrome with the **same Google account**.
2. Open the saved Apps Script **`/exec` URL** (not GitHub repo URL or `/dev` test URL).
3. Enter your PIN. Select current month/year; in next month it defaults to the new current month automatically. You may switch to older month to view/edit transactions.
4. Chrome ⋮ menu > **Add to Home screen** (or **Install app**, depending on browser). This adds an app-style shortcut; Apps Script may open as a website rather than a fully installed PWA.
5. Test: Add `₹10`, category Milk, note test; confirm row in private `Transactions` Sheet. Edit, then delete test entry. Set month budget in Settings. This requires internet.

## 7. PIN change via GitHub only

1. Repo > Settings > Secrets and variables > Actions > edit/update `APP_PIN` with a new PIN.
2. Repo > Actions > Deploy private expense app and PIN > Run workflow.
3. Open private `/exec` URL anew and verify the **new** PIN works. Previous PIN should fail.

## Troubleshooting

- **PIN protection is not deployed**: Run GitHub workflow successfully; don't create `PrivatePin.gs` manually.
- **Can't find GitHub Actions workflow**: `.github/workflows/deploy-private.yml` wasn't uploaded to the `main` branch.
- **401 / authentication error**: Run clasp login on Windows again; update `CLASPRC_JSON`; rerun.
- **Apps Script API disabled**: Enable https://script.google.com/home/usersettings.
- **Wrong Script ID vs deployment ID**: Recheck each value's page and GitHub secret name.
- **Shows old UI after deploying**: Confirm Actions run successful, reload `/exec` (not `/dev`).
- **Access denied on phone**: Sign into correct Google account; confirm access is owner-only and ownership matches.
- **No transactions appearing**: Try a small test transaction and verify in Google Sheet; don't assume a failed save was recorded.
- **Can't install native APK**: This is a shortcut to a private web app, not a packaged Android APK. Online access is necessary.

Official docs: Google Apps Script Web Apps https://developers.google.com/apps-script/guides/web ; Google clasp https://github.com/google/clasp ; GitHub Actions secrets https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
