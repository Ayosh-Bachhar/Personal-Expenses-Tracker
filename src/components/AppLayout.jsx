import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ChartPie,
  HandCoins,
  Home,
  LogOut,
  ReceiptText,
  Settings,
  Wallet,
} from 'lucide-react';
import { useGoogleAuth } from '../authentication/GoogleAuthProvider.jsx';

function AppLayout() {
  const { logout } = useGoogleAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <NavLink to="/" className="min-w-0 text-lg font-black tracking-tight">
            <span className="hidden sm:inline">Personal Expenses Tracker</span>
            <span className="sm:hidden">Expense Tracker</span>
          </NavLink>

          <div className="hidden items-center gap-2 md:flex">
            <DesktopNavLink to="/" icon={<Home size={18} />} label="Home" />
            <DesktopNavLink to="/balance" icon={<Wallet size={18} />} label="Balance" />
            <DesktopNavLink to="/expenses" icon={<ReceiptText size={18} />} label="Expenses" />
            <DesktopNavLink to="/debts" icon={<HandCoins size={18} />} label="Debts" />
            <DesktopNavLink to="/summary" icon={<ChartPie size={18} />} label="Summary" />
            <DesktopNavLink to="/setup" icon={<Settings size={18} />} label="Setup" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-rose-500/30 px-3 py-2 text-sm text-rose-300 transition hover:border-rose-400 hover:bg-rose-500/10"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-6 gap-1">
          <MobileNavLink to="/" icon={<Home size={19} />} label="Home" />
          <MobileNavLink to="/balance" icon={<Wallet size={19} />} label="Balance" />
          <MobileNavLink to="/expenses" icon={<ReceiptText size={19} />} label="Expense" />
          <MobileNavLink to="/debts" icon={<HandCoins size={19} />} label="Debt" />
          <MobileNavLink to="/summary" icon={<ChartPie size={19} />} label="Summary" />
          <MobileNavLink to="/setup" icon={<Settings size={19} />} label="Setup" />
        </div>
      </nav>
    </div>
  );
}

function DesktopNavLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
          isActive
            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
            : 'border-slate-800 text-slate-300 hover:border-emerald-500 hover:text-emerald-400'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function MobileNavLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] transition ${
          isActive
            ? 'bg-emerald-500/10 text-emerald-300'
            : 'text-slate-300 hover:bg-slate-900 hover:text-emerald-400'
        }`
      }
    >
      {icon}
      <span className="mt-1">{label}</span>
    </NavLink>
  );
}

export default AppLayout;