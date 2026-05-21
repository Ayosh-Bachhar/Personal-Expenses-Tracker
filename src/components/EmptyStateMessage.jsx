import { Inbox } from 'lucide-react';

function EmptyStateMessage({
  title = 'No data found',
  message = 'There is nothing to show yet.',
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-slate-400">
        <Inbox size={28} />
      </div>

      <h3 className="mt-4 text-xl font-black text-slate-100">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>
    </div>
  );
}

export default EmptyStateMessage;