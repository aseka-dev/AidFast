import { useState } from 'react';
import { Link } from 'react-router-dom';

type Tone = 'low' | 'expiry' | 'safety' | 'demand';

const TONES: Record<Tone, { box: string; num: string; cta: string; tag: string }> = {
    low: { box: 'border-[#f3dfa0] bg-[#fff4d6]', num: 'text-[#d98e0b]', cta: 'text-[#c98507]', tag: 'text-[#d98e0b]' },
    expiry: { box: 'border-[#f0b9c0] bg-[#fbe8ea]', num: 'text-[#c42b3a]', cta: 'text-[#c42b3a]', tag: 'text-[#c42b3a]' },
    safety: { box: 'border-[#d3dee3] bg-[#e8eef1]', num: 'text-[#4f6b7a]', cta: 'text-[#5b7686]', tag: 'text-[#4f6b7a]' },
    demand: { box: 'border-[#d9c6f0] bg-[#f1e8fb]', num: 'text-[#7a3fc4]', cta: 'text-[#7a3fc4]', tag: 'text-[#7a3fc4]' },
};

const MOVE_TEXT: Record<string, string> = {
    received: 'text-[#1b7a4b]', sale: 'text-[#2563eb]', adjust: 'text-[#0f8a6b]', return: 'text-[#b45309]',
};

/* ---------- mock data: replace with API calls from Day 6 onward ---------- */
const STATS: { tone: Tone; label: string; value: number; note: string; cta: string; to: string }[] = [
    { tone: 'low', label: 'Low Stock', value: 38, note: '6 newly flagged', cta: 'Requires attention', to: '/dashboard/alerts' },
    { tone: 'expiry', label: 'Critical Expiry', value: 11, note: '11 batches', cta: 'Requires attention', to: '/dashboard/alerts' },
    { tone: 'safety', label: 'Safety Alerts', value: 4, note: '2 require review', cta: 'Review notices', to: '/dashboard/safety-notices' },
    { tone: 'demand', label: 'Community Demand', value: 23, note: '7 added this week', cta: 'Unavailable medicines', to: '/dashboard/community-demand' },
];

const SLICES = [
    { label: 'In Stock', pct: 91.1, color: '#2e8b57' },
    { label: 'Low Stock', pct: 5, color: '#e39b1b' },
    { label: 'Out of Stock', pct: 3, color: '#d63b3b' },
    { label: 'Blocked / Quarantined', pct: 0.9, color: '#9b2335' },
];

const ALERTS: { tone: Tone; tag: string; time: string; title: string; body: string }[] = [
    { tone: 'expiry', tag: 'Critical Expiry', time: '12 min ago', title: 'Critical expiry window', body: 'Insulin glargine solution for injection 100 units/mL · 2 batches · 18 days' },
    { tone: 'safety', tag: 'Safety Alert', time: '1 hr ago', title: 'Safety notice matched', body: 'Losartan tablet 50 mg · batch review required' },
    { tone: 'low', tag: 'Low Stock', time: '3 hrs ago', title: 'Reorder threshold reached', body: 'Azithromycin tablet 250 mg · 8 units remain' },
    { tone: 'demand', tag: 'Community Demand', time: 'Yesterday', title: 'Community demand rising', body: 'Salbutamol inhaler · 6 requests today' },
];

const MOVES = [
    { medicine: 'Amoxicillin capsule 500 mg', brand: 'Amoxil', type: 'Goods Received', kind: 'received', qty: '+120', batch: 'AMX-2408B', by: 'Nimal Perera', date: '01 Oct, 09:42' },
    { medicine: 'Salbutamol inhaler 100 mcg/dose', brand: 'Ventolin', type: 'Sale', kind: 'sale', qty: '−6', batch: 'SAL-7312', by: 'Samira Ahmed', date: '01 Oct, 08:18' },
    { medicine: 'Metformin tablet 500 mg', brand: 'Glucophage', type: 'Stock Adjustment', kind: 'adjust', qty: '−3', batch: 'MET-0914', by: 'Samira Ahmed', date: '30 Sep, 16:05' },
    { medicine: 'Cetirizine tablet 10 mg', brand: 'Zyrtec', type: 'Distributor Return', kind: 'return', qty: '−18', batch: 'CET-2461', by: 'Nimal Perera', date: '30 Sep, 14:26' },
    { medicine: 'Oral rehydration salts powder for oral solution 20.5 g/sachet', brand: 'Jeevani', type: 'Goods Received', kind: 'received', qty: '+240', batch: 'ORS-8830', by: 'Samira Ahmed', date: '30 Sep, 11:52' },
];

const DEMAND = [
    { medicine: 'Amoxicillin capsule 500 mg', last: '01 Oct 2026', count: 18 },
    { medicine: 'Salbutamol inhaler 100 mcg/dose', last: '01 Oct 2026', count: 14 },
    { medicine: 'Metformin tablet 500 mg', last: '30 Sep 2026', count: 11 },
    { medicine: 'Oral rehydration salts powder for oral solution 20.5 g/sachet', last: '29 Sep 2026', count: 9 },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/* ---------- shared class sets ---------- */
const card = 'rounded-2xl border border-[#e2e8e3] bg-white p-5 shadow-sm';
const headLink = 'text-xs font-semibold text-[#17794a] hover:underline focus-visible:outline-2 focus-visible:outline-[#17794a]';
const muted = 'text-xs text-[#6b7a70]';
const selectCls = 'h-9 w-full min-w-[110px] rounded-lg border border-[#cfd8d2] bg-white px-2.5 text-xs text-[#14291d]';
const th = 'px-2 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-[#6b7a70]';
const td = 'border-t border-[#e2e8e3] px-2 py-3.5 align-middle';

function Donut({ total }: { total: number }) {
    const r = 70;
    const c = 2 * Math.PI * r;
    let offset = 0;
    return (
        <svg viewBox="0 0 180 180" className="h-44 w-44 shrink-0" role="img" aria-label="Stock status distribution">
            <g transform="rotate(-90 90 90)">
                {SLICES.map((s) => {
                    const len = (s.pct / 100) * c;
                    const el = <circle key={s.label} cx="90" cy="90" r={r} fill="none" stroke={s.color} strokeWidth="22" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
                    offset += len;
                    return el;
                })}
            </g>
            <text x="90" y="92" textAnchor="middle" fontSize="24" fontWeight="700" fill="#14291d">{total.toLocaleString()}</text>
            <text x="90" y="110" textAnchor="middle" fontSize="9" fill="#6b7a70">Total medicines</text>
        </svg>
    );
}

export default function M5DashboardOverview({ userName = 'Samir' }: { userName?: string }) {
    const [period, setPeriod] = useState('Monthly');
    const [month, setMonth] = useState('October');
    const [year, setYear] = useState('2026');

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="flex flex-col gap-5 p-6 text-[#14291d]">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{greeting}, {userName}</h1>
                    <p className="mt-1 text-sm text-[#6b7a70]">Here is your pharmacy overview for today.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link to="/dashboard/medicines" className="rounded-lg border border-[#cfd8d2] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#f4f7f5]">+ Add Medicine</Link>
                    <Link to="/dashboard/purchasing/new-grn" className="rounded-lg bg-[#17794a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f5c35]">+ Receive Stock (GRN)</Link>
                </div>
            </div>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {STATS.map((s) => (
                    <Link key={s.label} to={s.to} className={`flex flex-col rounded-2xl border p-5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#17794a] ${TONES[s.tone].box}`}>
                        <span className="text-sm text-[#4b5a50]">{s.label}</span>
                        <b className={`mt-2 text-3xl ${TONES[s.tone].num}`}>{s.value}</b>
                        <small className="mt-1 text-xs text-[#6b7a70]">{s.note}</small>
                        <em className={`mt-3 border-t border-black/10 pt-3 text-xs font-semibold not-italic ${TONES[s.tone].cta}`}>{s.cta}</em>
                    </Link>
                ))}
            </section>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
                <section className={card}>
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold">Stock Status Overview</h2>
                        <Link to="/dashboard/inventory" className={headLink}>View Inventory</Link>
                    </div>
                    <p className={`mt-1 ${muted}`}>Distribution for {month} {year}.</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                        {([['Period', period, setPeriod, ['Weekly', 'Monthly', 'Yearly']], ['Month', month, setMonth, MONTHS], ['Year', year, setYear, ['2025', '2026']]] as [string, string, (v: string) => void, string[]][]).map(([label, value, set, options]) => (
                            <label key={label} className="flex flex-col gap-1 text-[11px] text-[#6b7a70]">{label}
                                <select className={selectCls} value={value} onChange={(e) => set(e.target.value)}>
                                    {options.map((o) => <option key={o}>{o}</option>)}
                                </select>
                            </label>
                        ))}
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-8">
                        <Donut total={1248} />
                        <ul className="min-w-[220px] flex-1 space-y-4 text-sm">
                            {SLICES.map((s) => (
                                <li key={s.label} className="flex items-center gap-3">
                                    <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                                    <span className="flex-1 text-[#4b5a50]">{s.label}</span>
                                    <b>{s.pct}%</b>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className={card}>
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold">Recent Alerts</h2>
                        <Link to="/dashboard/alerts" className={headLink}>View Alerts</Link>
                    </div>
                    <p className={`mt-1 ${muted}`}>Safety, stock, expiry, and demand updates.</p>
                    <ul className="mt-3">
                        {ALERTS.map((a) => (
                            <li key={a.title} className="border-t border-[#e2e8e3] py-3 first:border-t-0">
                                <div className="flex items-center justify-between">
                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${TONES[a.tone].tag}`}>{a.tag}</span>
                                    <time className="text-[11px] text-[#6b7a70]">{a.time}</time>
                                </div>
                                <strong className="mt-1.5 block text-sm">{a.title}</strong>
                                <p className="mt-1 text-xs text-[#6b7a70]">{a.body}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
                <section className={card}>
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold">Recent Stock Movement</h2>
                        <Link to="/dashboard/transactions" className={headLink}>View Movements</Link>
                    </div>
                    <p className={`mt-1 ${muted}`}>Latest inventory changes across the pharmacy.</p>
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full min-w-[720px] border-collapse text-xs">
                            <thead className="bg-[#f4f7f5]">
                                <tr>{['Medicine', 'Brand / Trade Name', 'Movement Type', 'Quantity', 'Batch No.', 'Performed By', 'Date'].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {MOVES.map((m) => (
                                    <tr key={m.batch}>
                                        <td className={`${td} max-w-[190px] font-bold`}>{m.medicine}</td>
                                        <td className={td}>{m.brand}</td>
                                        <td className={`${td} font-semibold ${MOVE_TEXT[m.kind]}`}>{m.type}</td>
                                        <td className={`${td} font-semibold ${m.qty.startsWith('+') ? 'text-[#1b7a4b]' : ''}`}>{m.qty}</td>
                                        <td className={td}>{m.batch}</td>
                                        <td className={td}>{m.by}</td>
                                        <td className={td}>{m.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className={card}>
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold">Community Demand</h2>
                        <Link to="/dashboard/community-demand" className={headLink}>View Requests</Link>
                    </div>
                    <p className={`mt-1 ${muted}`}>Most requested unavailable medicines.</p>
                    <ul className="mt-3">
                        {DEMAND.map((d) => (
                            <li key={d.medicine} className="flex items-center justify-between gap-3 border-t border-[#e2e8e3] py-3 first:border-t-0">
                                <div>
                                    <strong className="block text-sm">{d.medicine}</strong>
                                    <small className="text-[11px] text-[#6b7a70]">Last requested {d.last}</small>
                                </div>
                                <span className="flex items-center gap-1.5 rounded-full bg-[#ece1fa] px-3 py-1.5 text-sm font-semibold text-[#6d35b8]">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" /><path d="M22 21v-2a4 4 0 0 0-3-3.9" /><path d="M16 3.1a4 4 0 0 1 0 7.8" />
                                    </svg>
                                    {d.count}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-2 rounded-lg bg-[#f5f2f9] px-3 py-3 text-xs text-[#6d35b8]">23 active requests from the community this week</p>
                </section>
            </div>
        </div>
    );
}