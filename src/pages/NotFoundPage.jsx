import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

function NotFoundPage() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center pb-24">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-400">
          <AlertTriangle size={34} />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
          Page Not Found
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-100">
          This page does not exist
        </h1>

        <p className="mt-4 text-sm leading-6 text-slate-400">
          The route you opened is not part of the Personal Expenses Tracker.
        </p>

        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-400"
        >
          <Home size={20} />
          Back to Home
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;