function SummaryCard({ title, value, subtitle, icon, accent = 'text-emerald-400' }) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-400">{title}</p>
            <p className="mt-3 text-3xl font-black text-slate-100">{value}</p>
  
            {subtitle ? (
              <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
            ) : null}
          </div>
  
          {icon ? <div className={`${accent}`}>{icon}</div> : null}
        </div>
      </div>
    );
  }
  
  export default SummaryCard;