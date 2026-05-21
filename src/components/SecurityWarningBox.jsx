import { ShieldCheck } from 'lucide-react';

function SecurityWarningBox({ title = 'Security Notice', message }) {
  return (
    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-5">
      <div className="flex gap-3">
        <div className="mt-1 text-emerald-400">
          <ShieldCheck size={22} />
        </div>

        <div>
          <h3 className="font-black text-emerald-300">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default SecurityWarningBox;