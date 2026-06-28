import { Link } from 'react-router-dom';
import { Wallet, ReceiptText, HandCoins, ChartPie } from 'lucide-react';
import PageTitleBar from '../components/PageTitleBar.jsx';

function HomeMenuPage() {
  return (
    <section className="pb-24">
      <PageTitleBar
        title="Main Menu"
        subtitle="Your financial data will be stored in your own Google Spreadsheet."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <MenuCard
          to="/balance"
          icon={<Wallet size={32} />}
          title="Balance Entry"
          description="Record money you received from pocket money, salary, scholarship, gift, or other sources."
          accent="text-emerald-400"
        />

        <MenuCard
          to="/expenses"
          icon={<ReceiptText size={32} />}
          title="Expenses Entry"
          description="Log your daily expenses with tag, payment medium, and priority flag."
          accent="text-cyan-400"
        />

        <MenuCard
          to="/debts"
          icon={<HandCoins size={32} />}
          title="Debt Log"
          description="Track the money you gave to others and the money you took from someone."
          accent="text-amber-400"
        />

        <MenuCard
          to="/summary"
          icon={<ChartPie size={32} />}
          title="Summary"
          description="View your (monthly/yearly) financial overview, charts, and rule-based advice."
          accent="text-violet-400"
        />
      </div>
    </section>
  );
}

function MenuCard({ to, icon, title, description, accent }) {
  return (
    <Link
      to={to}
      className="group rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl transition hover:-translate-y-1 hover:border-emerald-500/60 hover:bg-slate-900"
    >
      <div className={`${accent} mb-5`}>{icon}</div>

      <h2 className="text-2xl font-black text-slate-100">{title}</h2>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {description}
      </p>

      <p className="mt-5 text-sm font-bold text-emerald-400">
        Open page →
      </p>
    </Link>
  );
}

export default HomeMenuPage;