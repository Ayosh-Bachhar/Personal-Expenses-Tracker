
# Personal Expenses Tracker

A secure, online only personal finance tracker built with React, Vite, Tailwind CSS, Google OAuth, and Google Sheets API.

This project uses a personal Google Spreadsheet as the database. There is no backend server, no Firebase, no traditional database, and no offline financial-data storage.

---

## Live Demo

```text
https://personal-expenses-tracker-tau.vercel.app
````

---

## Features

* Google login required
* Google Sheets used as the database
* Balance entry
* Expense entry
* Expense protection based on current available wallet
* Custom expense tag creation
* Debt log
* Debt Given protection based on current available wallet
* Monthly sheet based financial records
* Automatic current-month sheet creation
* Monthly, yearly, and all-time financial summaries
* Expense_by_tag chart
* Balance vs expenses trend chart
* Rule-based financial advice
* Dark responsive UI
* PWA install support
* Vercel deployment support
* SPA routing support using `vercel.json`
* No Google Client Secret used in frontend code
* No balance, expense, debt, or summary data saved in browser localStorage

---

## Tech Stack

* React
* Vite
* Tailwind CSS
* React Router
* Lucide React
* Recharts
* Google OAuth
* Google Sheets REST API
* Vercel

---

## Project Security Model

This project is designed so the source code can be public while the user's financial data stays private.

Security rules:

* Users must sign in with Google before entering the app.
* The app requests Google Sheets access only.
* The app does not request full Google Drive access.
* The app does not store Google passwords.
* The app does not use or expose a Google Client Secret.
* The app saves only setup configuration locally.
* Financial records stay inside the user's own Google Spreadsheet.
* Spreadsheet structure is verified before use.
* Text input is sanitized before being written to Google Sheets.
* Expenses are blocked if the available wallet is not enough.
* Debt Given is blocked if the available wallet is not enough.

---

## Money Logic

### Balance Entry

Balance entry means money entered your wallet.

Examples:

```text
Pocket money
Salary
Scholarship
Gift
Freelance payment
```

### Expense Entry

Expense entry means money left your wallet.

Each expense contains:

```text
Amount
Tag
Description
Payment Medium
Priority Flag
```

Expense entries are protected by available wallet logic.

Example:

```text
Available wallet: BDT 500
Trying to spend: BDT 600
Result: blocked
```

### Debt Log

Debt status has two meanings:

```text
Given = someone owes you money
Taken = you owe someone money
```

Debt Given is protected by available wallet logic.

Example:

```text
Available wallet: BDT 500
Trying to give debt: BDT 700
Result: blocked
```

Debt Taken is allowed because borrowed money increases the current available financial position.

---

## Summary Calculation

The app calculates financial summary using these rules:

```text
Total Input = sum of Balance entries

Total Expenses = sum of Expense entries

Debt Given = active debt where Debt_Status is Given and IsSettled is false

Debt Taken = active debt where Debt_Status is Taken and IsSettled is false

Available Wallet = Total Input - Total Expenses - Debt Given + Debt Taken

Net Debt Position = Debt Given - Debt Taken

Financial Position = Available Wallet + Net Debt Position
```

---

## Required Google Spreadsheet Structure

The spreadsheet must contain:

```text
Tags
Settings
Current monthly sheet, for example May_2026
```

Example final spreadsheet tabs:

```text
May_2026
Tags
Settings
```

When a new month starts, the app can automatically create the new monthly sheet when a new entry is saved.

Examples:

```text
May_2026
June_2026
July_2026
```

---

## Monthly Sheet Structure

Each monthly sheet must use this exact header:

```text
ID | Date | Entry_Type | Amount | Source | Tag | Description | Medium | Flag | Debt_Name | Debt_Status | Reason | IsSettled
```

Example sheet name:

```text
May_2026
```

### Monthly Column Meaning

```text
ID          = Unique record ID
Date        = Date in MM/DD/YYYY format
Entry_Type  = Balance, Expense, or Debt
Amount      = Money amount
Source      = Balance source
Tag         = Expense category or tag
Description = Optional note
Medium      = Payment method
Flag        = Expense priority
Debt_Name   = Person name for debt records
Debt_Status = Given or Taken
Reason      = Debt reason
IsSettled   = true or false
```

---

## Example Monthly Rows

### Balance Row

```text
BAL-123 | 05/21/2026 | Balance | 5000 | Pocket Money | | May allowance | | | | | |
```

### Expense Row

```text
EXP-123 | 05/21/2026 | Expense | 120 | | Food | Coffee and snacks | Cash | Optional | | | |
```

### Debt Row

```text
DEBT-123 | 05/21/2026 | Debt | 1000 | | | Emergency help | | | Rahim | Given | Medical help | false
```

---

## Tags Sheet

Create a sheet named:

```text
Tags
```

Use this header:

```text
Tag
```

Default tags:

```text
Food
Transport
Rent
Education
Health
Mobile Recharge
Shopping
Entertainment
Stationery
Family
Personal
Other
```

Users can create a new tag from the Expense Entry page. The new tag is automatically added under the existing tags in the `Tags` sheet.

---

## Settings Sheet

Create a sheet named:

```text
Settings
```

Use this structure:

```text
Key | Value
Currency | BDT
Owner | Your Name
```

The `Currency` value controls how money is displayed inside the app.

Example:

```text
Key | Value
Currency | BDT
Owner | Ayosh
```

---

## Google Cloud Setup

### 1. Create Google Cloud Project

Go to Google Cloud Console and create a new project.

Example project name:

```text
Personal Expenses Tracker
```

---

### 2. Enable Google Sheets API

Go to:

```text
APIs & Services
Library
Google Sheets API
Enable
```

---

### 3. Configure Google Auth Platform

Go to:

```text
Google Auth Platform
Branding
```

Set the basic app information.

Example:

```text
App name: Personal Expenses Tracker
User support email: your Gmail
Developer contact email: your Gmail
```

If the app is in testing mode, add your Gmail as a test user.

Go to:

```text
Google Auth Platform
Audience
Test users
Add users
```

---

### 4. Add Google Sheets Scope

Add this scope:

```text
https://www.googleapis.com/auth/spreadsheets
```

Do not add full Google Drive scope.

---

### 5. Create OAuth Client

Go to:

```text
Google Auth Platform
Clients
Create Client
```

Use:

```text
Application type: Web application
```

---

### 6. Authorized JavaScript Origins

For local development, add:

```text
http://localhost:5173
```

If Vite uses another local port, add that too.

Example:

```text
http://localhost:5174
```

For Vercel deployment, add your Vercel production URL.

Example:

```text
https://personal-expenses-tracker-tau.vercel.app
```

Do not add a slash at the end.

Correct:

```text
https://personal-expenses-tracker-tau.vercel.app
```

Wrong:

```text
https://personal-expenses-tracker-tau.vercel.app/
```

---

### 7. Authorized Redirect URIs

For local development, add:

```text
http://localhost:5173/login
```

For Vercel deployment, add:

```text
https://personal-expenses-tracker-tau.vercel.app/login
```

Do not add a slash at the end.

---

### 8. Copy OAuth Client ID

Copy your OAuth Client ID.

It looks like:

```text
xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

This value is required in the `.env` file and in Vercel environment variables.

---

## Local Installation

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

Do not use spaces around `=`.

Correct:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

Wrong:

```env
VITE_GOOGLE_CLIENT_ID = your_google_oauth_client_id_here
```

Run development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

If PowerShell blocks npm on Windows, use:

```bash
npm.cmd run dev
```

---

## Build

Run production build:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

If PowerShell blocks npm on Windows, use:

```bash
npm.cmd run build
npm.cmd run preview
```

---

## First-Time App Setup

After Google login:

1. Go to the Setup page.
2. Paste your Google Spreadsheet ID.
3. Set currency, for example `BDT`.
4. Click **Verify and Save Setup**.

The Spreadsheet ID is the part between `/d/` and `/edit` in your Google Sheet URL.

Example:

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

The app verifies the spreadsheet before saving setup.

---

## How Monthly Sheets Work

The app writes Balance, Expense, and Debt records into the current monthly sheet.

Example:

```text
May_2026
```

When a new month starts, the app can automatically create the new monthly sheet during setup or when saving a new entry.

Example:

```text
June_2026
```

The new monthly sheet uses this required monthly header:

```text
ID | Date | Entry_Type | Amount | Source | Tag | Description | Medium | Flag | Debt_Name | Debt_Status | Reason | IsSettled
```

---

## Vercel Deployment

### 1. Push Project to GitHub

```bash
git add .
git commit -m "Initial personal expenses tracker project"
git push
```

---

### 2. Import Project in Vercel

In Vercel:

```text
Add New
Project
Import Git Repository
```

Select the GitHub repository.

Vercel should detect:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

---

### 3. Add Environment Variable in Vercel

Add:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

Do not add:

```env
VITE_GOOGLE_CLIENT_SECRET
```

This frontend app must not use a Client Secret.

---

### 4. Deploy

Click:

```text
Deploy
```

After deployment, copy the production domain.

Example:

```text
https://personal-expenses-tracker-tau.vercel.app
```

Add that domain to Google OAuth:

```text
Authorized JavaScript origins
Authorized redirect URIs
```

---

## Vercel SPA Routing

This project includes `vercel.json` for React Router support.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This prevents direct routes like these from showing Vercel `404: NOT_FOUND`:

```text
/login
/setup
/summary
/expenses
/debts
```

---

## PWA Installation

After deployment, the app can be installed as a PWA.

### Android

Open the website in Chrome:

```text
Menu
Add to Home screen
```

### iPhone

Open the website in Safari:

```text
Share
Add to Home Screen
```

---

## Project Structure

```text
personal-expenses-tracker/
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── vercel.json
├── README.md
├── .gitignore
├── .env.example
├── public/
│   ├── manifest.json
│   ├── icon-192.svg
│   └── icon-512.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── authentication/
    │   ├── GoogleAuthProvider.jsx
    │   ├── GoogleLoginPage.jsx
    │   ├── LoginRequiredRoute.jsx
    │   └── SetupRequiredRoute.jsx
    ├── setup/
    │   └── SpreadsheetSetupPage.jsx
    ├── googleSheets/
    │   ├── sheetsApiClient.js
    │   ├── spreadsheetSchema.js
    │   └── useGoogleSheetsApi.js
    ├── pages/
    │   ├── HomeMenuPage.jsx
    │   ├── BalanceEntryPage.jsx
    │   ├── ExpenseEntryPage.jsx
    │   ├── DebtLogPage.jsx
    │   ├── FinancialSummaryPage.jsx
    │   └── NotFoundPage.jsx
    ├── components/
    │   ├── AppLayout.jsx
    │   ├── EmptyStateMessage.jsx
    │   ├── PageTitleBar.jsx
    │   ├── SecurityWarningBox.jsx
    │   ├── SelectDropdownField.jsx
    │   ├── SubmitButton.jsx
    │   ├── SummaryCard.jsx
    │   └── TextInputField.jsx
    └── utilities/
        ├── appConfigStorage.js
        ├── currencyFormatter.js
        ├── dateFormatter.js
        ├── financialSummaryCalculator.js
        ├── safeTextSanitizer.js
        └── uniqueIdGenerator.js
```

---

## Important Notes

* Do not commit `.env`.
* Do not use a Google Client Secret in this frontend project.
* Do not make your personal spreadsheet public.
* Do not manually change the monthly sheet headers after setup.
* Keep `Tags` and `Settings` permanently.
* Monthly sheets should follow the `Month_Year` format, for example `May_2026`.
* Delete old test rows from the spreadsheet after testing.
* Every user should create their own Google Cloud OAuth Client.
* Every user should create their own Google Spreadsheet.
* The app stores only setup configuration locally.
* Financial data stays inside Google Sheets.

---

## Current Limitations

* The app does not use a backend server.
* Google access tokens are handled in the browser.
* Users must create and connect their own Google Spreadsheet.
* Users must configure their own Google OAuth Client ID.
* The app does not automatically verify whether old test rows are clean.
* The app does not currently include multi-user shared budgeting roles.

---

## Recommended Testing Checklist

After setup, test these actions:

```text
1. Google login works.
2. Setup page verifies spreadsheet.
3. Balance entry saves into current monthly sheet.
4. Expense entry saves only if available wallet is enough.
5. New custom expense tag is added to the Tags sheet.
6. Debt Given is blocked if available wallet is not enough.
7. Debt Taken saves successfully.
8. Summary page refreshes correctly.
9. Direct routes work after refresh on Vercel.
10. Logout works.
```

---

## License

This project is for learning and personal use.
