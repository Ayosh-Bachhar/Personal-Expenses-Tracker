import { Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useGoogleAuth } from './GoogleAuthProvider.jsx';

function GoogleLoginPage() {
  const { isAuthenticated, login, loginError } = useGoogleAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-400">
          <ShieldCheck size={34} />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
          Secure Access
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight">
          Google Login Required
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-400">
          No one can enter the app without Google login. Your spreadsheet data
          stays inside your own Google account.
        </p>

        <button
          type="button"
          onClick={() => login()}
          className="mt-8 w-full rounded-2xl bg-emerald-500 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-400 active:scale-[0.99]"
        >
          Sign in with Google
        </button>

        {loginError ? (
          <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {loginError}
          </p>
        ) : null}

        <p className="mt-5 text-xs leading-5 text-slate-500">
          Requested permission: Google Sheets access only.
        </p>
      </section>
    </main>
  );
}

export default GoogleLoginPage;