import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GoogleAuthProvider } from './authentication/GoogleAuthProvider.jsx';
import LoginRequiredRoute from './authentication/LoginRequiredRoute.jsx';
import SetupRequiredRoute from './authentication/SetupRequiredRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import GoogleLoginPage from './authentication/GoogleLoginPage.jsx';
import SpreadsheetSetupPage from './setup/SpreadsheetSetupPage.jsx';
import HomeMenuPage from './pages/HomeMenuPage.jsx';
import BalanceEntryPage from './pages/BalanceEntryPage.jsx';
import ExpenseEntryPage from './pages/ExpenseEntryPage.jsx';
import DebtLogPage from './pages/DebtLogPage.jsx';
import FinancialSummaryPage from './pages/FinancialSummaryPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function App() {
  return (
    <GoogleAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<GoogleLoginPage />} />

          <Route element={<LoginRequiredRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/setup" element={<SpreadsheetSetupPage />} />

              <Route element={<SetupRequiredRoute />}>
                <Route path="/" element={<HomeMenuPage />} />
                <Route path="/balance" element={<BalanceEntryPage />} />
                <Route path="/expenses" element={<ExpenseEntryPage />} />
                <Route path="/debts" element={<DebtLogPage />} />
                <Route path="/summary" element={<FinancialSummaryPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </GoogleAuthProvider>
  );
}

export default App;