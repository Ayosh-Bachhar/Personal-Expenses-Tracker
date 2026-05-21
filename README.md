# Personal Expenses Tracker

A secure, online-only personal finance tracker built with React, Vite, Tailwind CSS, Google OAuth, and Google Sheets API.

This app uses Google Sheets as the database. There is no backend server, no Firebase, no traditional database, and no offline financial storage.

## Features

* Google login required
* Google Sheets as database
* Monthly spreadsheet pages
* Balance entry
* Expense entry
* Custom expense tag creation
* Debt log
* Debt Given balance protection
* Financial summary dashboard
* Monthly, yearly, and all-time summaries
* Expense charts
* Rule-based financial advice
* PWA install support
* Dark mobile-first UI
* No financial data saved in browser localStorage

## Security Model

This project is designed so the code can be public, but the data remains private.

Security rules:

* Users must log in with Google before entering the app.
* The app requests only Google Sheets access.
* The app does not request full Google Drive access.
* The app does not store Google passwords.
* The app does not use a Google Client Secret in frontend code.
* The app stores only setup configuration locally.
* Balance, expense, debt, and summary data stay inside the user's Google Spreadsheet.
* Spreadsheet structure is verified before use.
* Text input is sanitized to reduce Google Sheets formula injection risk.
* Debt Given is blocked if the calculated available wallet is not enough.

## Tech Stack

* React
* Vite
* Tailwind CSS
* React Router
* Lucide React
* Recharts
* Google OAuth
* Google Sheets REST API

## Required Google Spreadsheet Structure

Create a Google Spreadsheet with monthly sheets and permanent sheets.

Example monthly sheets:

```text
May_2026
June_2026
July_2026
```

Permanent sheets:

```text
Tags
Settings
```

## Monthly Sheet Structure

Each month must have its own sheet.

Example:

```text
May_2026
```

The monthly sheet must use this exact header:

```text
ID | Date | Entry_Type | Amount | Source | Tag | Description | Medium | Flag | Debt_Name | Debt_Status | Reason | IsSettled
```

### Column Meaning

```text
ID          = Unique record ID
Date        = Date in MM/DD/YYYY format
Entry_Type  = Balance, Expense, or Debt
Amount      = Money amount
Source      = Balance source
Tag         = Expense category/tag
Description = Optional note
Medium      = Payment method
Flag        = Expense priority
Debt_Name   = Debt person name
Debt_Status = Given or Taken
Reason      = Debt reason
IsSettled   = true or false
```

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

Users can add a new tag from the Expense Entry page. The new tag will automatically be added under the existing tags in the `Tags` sheet.

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

## Money Logic

### Balance Entry

Balance entry means money entered your wallet.

Examples:

```text
Pocket money
Scholarship
Salary
Gift
Freelance payment
```

### Expense Entry

Expense entry means money went out.

Each expense has:

```text
Tag
Payment Medium
Priority Flag
```

Priority flags:

```text
Forcefully = unavoidable or forced expense
Required   = necessary expense
Optional   = wanted but not necessary
```

### Debt Log

Debt status:

```text
Given = someone owes you money
Taken = you owe someone money
```

Debt Given is dependent on your available wallet.

If your calculated available wallet is not enough, the app blocks the Debt Given entry.

## Summary Formula

The app calculates:

```text
Total Input = sum of Balance entries

Total Expenses = sum of Expense entries

Debt Given = active debt where Debt_Status is Given and IsSettled is false

Debt Taken = active debt where Debt_Status is Taken and IsSettled is false

Available Wallet = Total Input - Total Expenses - Debt Given + Debt Taken

Net Debt Position = Debt Given - Debt Taken

Financial Position = Available Wallet + Net Debt Position
```

## Google Cloud Setup

### 1. Create Google Cloud Project

Go to Google Cloud Console and create a new project.

Example project name:

```text
Personal Expenses Tracker
```

### 2. Enable Google Sheets API

Go to:

```text
APIs & Services → Library → Google Sheets API → Enable
```

### 3. Configure Google Auth Platform

Set up OAuth consent screen.

Use:

```text
App name: Personal Expenses Tracker
Audience: External
User support email: your Gmail
Developer contact email: your Gmail
```

Add yourself as a test user while the app is in testing mode.

### 4. Add Scope

Add this scope:

```text
https://www.googleapis.com/auth/spreadsheets
```

Do not add full Google Drive scope.

### 5. Create OAuth Client

Create OAuth client:

```text
Application type: Web application
```

For local development, add this Authorized JavaScript origin:

```text
http://localhost:5173
```

If Vite uses another local port, add that too.

Example:

```text
http://localhost:5174
```

For Vercel deployment, later add:

```text
https://your-project-name.vercel.app
```

Copy the OAuth Client ID.

## Local Installation

Install dependencies:

```bash
npm install
```

Create `.env` in the project root:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
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

## Build

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

## First-Time App Setup

After login:

1. Go to the Setup page.
2. Paste your Google Spreadsheet ID.
3. Set currency, for example `BDT`.
4. Click **Verify and Save Setup**.

The Spreadsheet ID is the part between `/d/` and `/edit` in your Google Sheet URL.

Example:

```text
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

## How Monthly Sheets Work

The app writes Balance, Expense, and Debt records into the current monthly sheet.

Example:

```text
May_2026
```

When a new month starts, the app can automatically create the new monthly sheet when writing a new entry.

Example:

```text
June_2026
```

The new monthly sheet will use the required monthly header:

```text
ID | Date | Entry_Type | Amount | Source | Tag | Description | Medium | Flag | Debt_Name | Debt_Status | Reason | IsSettled
```

## Deployment on Vercel

1. Push project to GitHub.
2. Import repository in Vercel.
3. Add environment variable:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
```

4. Deploy.
5. Copy your Vercel URL.
6. Add the Vercel URL to Google OAuth Authorized JavaScript origins.

Example:

```text
https://your-project-name.vercel.app
```

## PWA Installation

After deployment:

### Android

Open the website in Chrome:

```text
Menu → Add to Home screen
```

### iPhone

Open the website in Safari:

```text
Share → Add to Home Screen
```

## Important Notes

* Do not commit `.env`.
* Do not use a Client Secret in this frontend project.
* Do not make your personal spreadsheet public.
* Do not store financial data in localStorage.
* Every user should create their own Google Cloud OAuth Client and their own Google Spreadsheet.
* Keep the `Tags` and `Settings` sheets permanently.
* Monthly sheets should follow the `Month_Year` format, for example `May_2026`.
* Do not manually change the monthly sheet headers after setup.

## Project Structure

```text
personal-expenses-tracker/
├── index.html
├── package.json
├── vite.config.js
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
    ├── setup/
    ├── googleSheets/
    ├── pages/
    ├── components/
    └── utilities/
```

## License

This project is for learning and personal use.
