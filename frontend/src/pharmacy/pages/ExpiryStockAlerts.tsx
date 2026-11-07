import { useMemo, useState } from 'react';

type Level = 'alert' | 'warning' | 'critical' | 'expired';
type Tab = 'expiry' | 'low' | 'out';

interface Batch {
    id: string; medicine: string; brand: string; batch: string; expiry: string;
    remaining: string; months: number; quantity: string; distributor: string; grn: string; level: Level;
}
interface StockRow { id: string; medicine: string; brand: string; quantity: string; min: number; distributor: string; }
interface Filters { level: '' | Level; medicine: string; period: '' | 'expired' | '0-6' | '6-9' | '9-12'; }

const LEVEL_LABEL: Record<Level, string> = {
    alert: 'Expiry Alert', warning: 'Expiry Warning', critical: 'Critical Expiry', expired: 'Expired',
};
const PAGE_SIZE = 7;
const EMPTY: Filters = { level: '', medicine: '', period: '' };

/* ---------- mock data: replace with GET /api/v1/pharmacies/:pharmacyId/alerts ---------- */
const STATS = [
    { label: 'Expiry Alert', value: 46, tone: 'alert', tab: 'expiry' as Tab, level: 'alert' as Level },
    { label: 'Expiry Warning', value: 28, tone: 'warning', tab: 'expiry' as Tab, level: 'warning' as Level },
    { label: 'Critical Expiry', value: 11, tone: 'critical', tab: 'expiry' as Tab, level: 'critical' as Level },
    { label: 'Expired', value: 4, tone: 'expired', tab: 'expiry' as Tab, level: 'expired' as Level },
    { label: 'Low Stock', value: 38, tone: 'low', tab: 'low' as Tab },
    { label: 'Out of Stock', value: 12, tone: 'out', tab: 'out' as Tab },
];

const BATCHES: Batch[] = [
    { id: 'b1', medicine: 'Insulin glargine solution for injection 100 units/mL', brand: 'Lantus', batch: 'INS-2510-K', expiry: '18 Oct 2026', remaining: '0.6 months remaining', months: 0.6, quantity: '22 pens', distributor: 'Northstar Medical', grn: 'GRN-2026-010471', level: 'critical' },
    { id: 'b2', medicine: 'Azithromycin tablet 250 mg', brand: 'Zithromax', batch: 'AZI-2511-C', expiry: '22 Nov 2026', remaining: '1.7 months remaining', months: 1.7, quantity: '36 tablets', distributor: 'CareBridge Wholesale', grn: 'GRN-2026-010441', level: 'critical' },
    { id: 'b3', medicine: 'Amoxicillin capsule 500 mg', brand: 'Amoxil', batch: 'AMX-2601-F', expiry: '31 Jan 2027', remaining: '4.0 months remaining', months: 4, quantity: '148 capsules', distributor: 'MedSupply Cooperative', grn: 'GRN-2026-010482', level: 'critical' },
    { id: 'b4', medicine: 'Omeprazole gastro-resistant capsule 20 mg', brand: 'Losec', batch: 'OME-2603-B', expiry: '31 Mar 2027', remaining: '5.9 months remaining', months: 5.9, quantity: '180 capsules', distributor: 'MedSupply Cooperative', grn: 'GRN-2026-010482', level: 'critical' },
    { id: 'b5', medicine: 'Cetirizine tablet 10 mg', brand: 'Zyrtec', batch: 'CET-2507-E', expiry: '30 Sept 2026', remaining: 'Expired · excluded from saleable stock', months: -1, quantity: '0 saleable', distributor: 'Northstar Medical', grn: 'GRN-2026-010318', level: 'expired' },
    { id: 'b6', medicine: 'Amlodipine tablet 5 mg', brand: 'Norvasc', batch: 'AML-2608-D', expiry: '31 Aug 2027', remaining: '11.0 months remaining', months: 11, quantity: '620 tablets', distributor: 'Greenline Pharma', grn: 'GRN-2026-010477', level: 'alert' },
    { id: 'b7', medicine: 'Losartan tablet 50 mg', brand: 'Cozaar', batch: 'LOS-2606-A', expiry: '30 Jun 2027', remaining: '7.8 months remaining', months: 7.8, quantity: '300 tablets', distributor: 'Greenline Pharma', grn: 'GRN-2026-010460', level: 'warning' },
    { id: 'b8', medicine: 'Metformin tablet 500 mg', brand: 'Glucophage', batch: 'MET-2607-H', expiry: '31 Jul 2027', remaining: '8.8 months remaining', months: 8.8, quantity: '410 tablets', distributor: 'CareBridge Wholesale', grn: 'GRN-2026-010455', level: 'warning' },
    { id: 'b9', medicine: 'Atorvastatin tablet 20 mg', brand: 'Lipitor', batch: 'ATO-2609-M', expiry: '30 Sep 2027', remaining: '10.8 months remaining', months: 10.8, quantity: '275 tablets', distributor: 'Northstar Medical', grn: 'GRN-2026-010490', level: 'alert' },
    { id: 'b10', medicine: 'Paracetamol tablet 500 mg', brand: 'Panadol', batch: 'PAR-2605-J', expiry: '31 May 2027', remaining: '6.8 months remaining', months: 6.8, quantity: '900 tablets', distributor: 'MedSupply Cooperative', grn: 'GRN-2026-010452', level: 'warning' },
];

const LOW: StockRow[] = [
    { id: 'l1', medicine: 'Azithromycin tablet 250 mg', brand: 'Zithromax', quantity: '8 tablets', min: 30, distributor: 'CareBridge Wholesale' },
    { id: 'l2', medicine: 'Salbutamol inhaler 100 mcg/dose', brand: 'Ventolin', quantity: '5 inhalers', min: 15, distributor: 'Northstar Medical' },
    { id: 'l3', medicine: 'Losartan tablet 50 mg', brand: 'Cozaar', quantity: '24 tablets', min: 60, distributor: 'Greenline Pharma' },
];
const OUT: StockRow[] = [
    { id: 'o1', medicine: 'Oral rehydration salts 20.5 g/sachet', brand: 'Jeevani', quantity: '0 sachets', min: 50, distributor: 'MedSupply Cooperative' },
    { id: 'o2', medicine: 'Cetirizine tablet 10 mg', brand: 'Zyrtec', quantity: '0 tablets', min: 40, distributor: 'Northstar Medical' },
];

const MEDICINES = Array.from(new Set([...BATCHES, ...LOW, ...OUT].map((r) => r.medicine))).sort();

const inPeriod = (m: number, p: Filters['period']) =>
    p === '' || (p === 'expired' ? m < 0 : p === '0-6' ? m >= 0 && m <= 6 : p === '6-9' ? m > 6 && m <= 9 : m > 9 && m <= 12);

function downloadCsv(name: string, header: string[], rows: string[][]) {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
}

/* ---------- Tailwind class sets ---------- */
const btn = 'rounded-lg border border-[#17794a] bg-white px-4 py-2.5 text-sm font-semibold text-[#17794a] hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17794a]';
const btnPrimary = 'rounded-lg border border-[#17794a] bg-[#17794a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f5c35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17794a]';
const linkBtn = 'px-2 py-1.5 text-sm font-semibold text-[#17794a] hover:underline disabled:cursor-not-allowed disabled:opacity-50';
const card = 'flex flex-col gap-3.5 rounded-2xl border border-[#dfe6e1] bg-white p-5';
const th = 'bg-[#f4f7f5] px-2.5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wide text-[#4b5a50]';
const td = 'border-b border-[#dfe6e1] px-2.5 py-4 align-middle';
const selectCls = 'h-10 rounded-lg border border-[#cfd8d2] bg-white px-3 text-sm font-normal text-[#14291d] disabled:cursor-not-allowed disabled:opacity-50';
const muted = 'text-xs text-[#6b7a70]';
const LEVEL_TEXT: Record<Level, string> = { alert: 'text-[#a88b0c]', warning: 'text-[#c2570c]', critical: 'text-[#c0283a]', expired: 'text-[#55627a]' };
const STAT_TEXT: Record<string, string> = { ...LEVEL_TEXT, low: 'text-[#c17a0c]', out: 'text-[#cf3b3b]' };

/* ---------- page ---------- */
export default function ExpiryStockAlerts({ onInitiateReturn }: { onInitiateReturn?: (b: Batch) => void }) {
    const [reviewed, setReviewed] = useState<string[]>([]);
    const [tab, setTab] = useState<Tab>('expiry');
    const [draft, setDraft] = useState<Filters>(EMPTY);
    const [applied, setApplied] = useState<Filters>(EMPTY);
    const [page, setPage] = useState(1);

    const critical = BATCHES.filter((b) => b.level === 'critical' && !reviewed.includes(b.id));
    const isExpiry = tab === 'expiry';

    const expiryRows = useMemo(() => BATCHES.filter((b) =>
        (!applied.level || b.level === applied.level) &&
        (!applied.medicine || b.medicine === applied.medicine) &&
        inPeriod(b.months, applied.period)), [applied]);
    const stockRows = useMemo(() => (tab === 'low' ? LOW : OUT)
        .filter((r) => !applied.medicine || r.medicine === applied.medicine), [tab, applied]);

    const total = isExpiry ? expiryRows.length : stockRows.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const current = Math.min(page, pages);
    const from = total === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
    const to = Math.min(current * PAGE_SIZE, total);
    const slice = <T,>(rows: T[]) => rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    const activeCount = isExpiry
        ? Object.values(applied).filter(Boolean).length
        : applied.medicine ? 1 : 0;

    const apply = (f: Filters) => { setDraft(f); setApplied(f); setPage(1); };
    const switchTab = (t: Tab) => { setTab(t); setPage(1); };
    const pickStat = (s: (typeof STATS)[number]) => {
        switchTab(s.tab);
        apply({ ...EMPTY, level: s.level ?? '' });
    };
    const exportList = () => isExpiry
        ? downloadCsv('expiring-batches.csv',
            ['Medicine', 'Brand / Trade Name', 'Batch Number', 'Expiry Date', 'Time Remaining', 'Quantity', 'Distributor', 'Linked GRN', 'Alert Level'],
            expiryRows.map((b) => [b.medicine, b.brand, b.batch, b.expiry, b.remaining, b.quantity, b.distributor, b.grn, LEVEL_LABEL[b.level]]))
        : downloadCsv(`${tab}-stock.csv`,
            ['Medicine', 'Brand / Trade Name', 'Saleable Quantity', 'Minimum Level', 'Distributor'],
            stockRows.map((r) => [r.medicine, r.brand, r.quantity, String(r.min), r.distributor]));

    return (
        <div className="flex flex-col gap-5 p-6 text-[#14291d]">
            <div>
                <h1 className="text-3xl font-bold">Expiry &amp; Stock Alerts</h1>
                <p className="mt-1 text-[15px] text-[#6b7a70]">Prioritize expiring batches and stock risks across the pharmacy.</p>
            </div>

            {/* Critical notifications */}
            <section className="overflow-hidden rounded-2xl border border-[#f0d4d6] bg-white" aria-label="Immediate critical expiry notifications">
                <header className="flex justify-between gap-3 border-b border-[#f0d4d6] bg-[#fdf4f4] px-5 py-5">
                    <div>
                        <h2 className="text-lg font-bold text-[#b9202f]">Immediate Critical Expiry Notifications</h2>
                        <p className={`mt-1.5 ${muted}`}>High-priority batches remain visible until a reviewed action is recorded.</p>
                    </div>
                    <span className="whitespace-nowrap text-[11px] font-bold text-[#b9202f]">Critical Expiry</span>
                </header>
                {critical.length === 0 ? (
                    <p className="p-5 text-sm text-[#6b7a70]">
                        No critical batches are waiting for review.
                        {reviewed.length > 0 && <button type="button" className={`ml-2 ${linkBtn}`} onClick={() => setReviewed([])}>Restore {reviewed.length} reviewed</button>}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-px bg-[#dfe6e1] lg:grid-cols-2">
                        {critical.map((b) => (
                            <article key={b.id} className="flex flex-col gap-3.5 bg-white p-5">
                                <div className="flex justify-between gap-3">
                                    <div>
                                        <h3 className="mb-1.5 text-[15px] font-bold">{b.medicine}</h3>
                                        <small className="text-[#6b7a70]">Batch {b.batch}</small>
                                    </div>
                                    <span className="whitespace-nowrap text-[11px] font-bold text-[#4b5a50]">Requires Review</span>
                                </div>
                                <dl className="grid grid-cols-2 gap-x-3 gap-y-3.5 sm:grid-cols-3">
                                    {([['Expiry date', b.expiry], ['Time remaining', b.remaining], ['Quantity', b.quantity], ['Distributor', b.distributor], ['Linked GRN', b.grn]] as [string, string][]).map(([k, v]) => (
                                        <div key={k}>
                                            <dt className="text-[10px] uppercase tracking-wide text-[#6b7a70]">{k}</dt>
                                            <dd className="mt-1 text-xs font-semibold">{v}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <div className="flex flex-wrap justify-end gap-3">
                                    <button type="button" className={btn} onClick={() => setReviewed((r) => [...r, b.id])}>Mark as Reviewed</button>
                                    <button type="button" className={btnPrimary} onClick={() => onInitiateReturn?.(b)}>Initiate Distributor Return</button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Summary cards */}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {STATS.map((s) => (
                    <button key={s.label} type="button" onClick={() => pickStat(s)}
                        className="flex flex-col gap-2 rounded-xl border border-[#dfe6e1] bg-white px-5 py-4 text-left hover:border-[#17794a] focus-visible:outline-2 focus-visible:outline-[#17794a]">
                        <span className="text-[13px] text-[#6b7a70]">{s.label}</span>
                        <b className={`text-[26px] ${STAT_TEXT[s.tone]}`}>{s.value}</b>
                    </button>
                ))}
            </section>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto bg-white px-2 sm:px-5" role="tablist">
                {([['expiry', 'Expiry Alerts'], ['low', 'Low Stock'], ['out', 'Out of Stock']] as [Tab, string][]).map(([k, label]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k}
                        className={`whitespace-nowrap border-b-[3px] px-5 py-4 text-sm font-semibold sm:px-6 ${tab === k ? 'border-[#17794a] text-[#17794a]' : 'border-transparent text-[#4b5a50]'}`}
                        onClick={() => { switchTab(k); apply(EMPTY); }}>{label}</button>
                ))}
            </div>

            {/* Filters */}
            <section className={card}>
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[17px] font-bold">Filter records</h2>
                    <span className={muted}>{activeCount === 0 ? 'No filters applied' : `${activeCount} filter${activeCount > 1 ? 's' : ''} applied`}</span>
                </div>
                <div className="grid grid-cols-1 items-end gap-3.5 lg:grid-cols-[1fr_1fr_1fr_auto]">
                    <label className="flex flex-col gap-2 text-xs font-semibold">Alert level
                        <select className={selectCls} disabled={!isExpiry} value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value as Filters['level'] })}>
                            <option value="">All alert level</option>
                            {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold">Medicine
                        <select className={selectCls} value={draft.medicine} onChange={(e) => setDraft({ ...draft, medicine: e.target.value })}>
                            <option value="">All medicine</option>
                            {MEDICINES.map((m) => <option key={m}>{m}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold">Expiry period
                        <select className={selectCls} disabled={!isExpiry} value={draft.period} onChange={(e) => setDraft({ ...draft, period: e.target.value as Filters['period'] })}>
                            <option value="">All expiry period</option>
                            <option value="expired">Already expired</option>
                            <option value="0-6">Within 6 months</option>
                            <option value="6-9">6 to 9 months</option>
                            <option value="9-12">9 to 12 months</option>
                        </select>
                    </label>
                    <div className="flex items-center justify-end gap-2.5">
                        <button type="button" className={linkBtn} onClick={() => apply(EMPTY)}>Clear</button>
                        <button type="button" className={`${btnPrimary} h-10 py-0`} onClick={() => apply(draft)}>Apply</button>
                    </div>
                </div>
            </section>

            {/* Records table */}
            <section className={card}>
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[17px] font-bold">{isExpiry ? 'Expiring batch records' : tab === 'low' ? 'Low stock medicines' : 'Out of stock medicines'}</h2>
                    <button type="button" className={linkBtn} onClick={exportList} disabled={total === 0}>Export list</button>
                </div>
                <p className={muted}>Showing {from}–{to} of {total} {isExpiry ? 'batches' : 'medicines'}</p>
                <div className="overflow-x-auto">
                    {isExpiry ? (
                        <table className="w-full min-w-[900px] border-collapse text-xs">
                            <thead><tr>
                                {['Medicine', 'Brand / Trade Name', 'Batch Number', 'Expiry Date', 'Time Remaining', 'Quantity', 'Distributor', 'Linked GRN', 'Alert Level'].map((h) => <th key={h} className={th}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {total === 0 && <tr><td colSpan={9} className="px-2.5 py-8 text-center text-[#6b7a70]">No batches match these filters. Press Clear to see all records.</td></tr>}
                                {slice(expiryRows).map((b) => (
                                    <tr key={b.id}>
                                        <td className={`${td} max-w-[220px] font-bold text-[#17794a]`}>{b.medicine}</td>
                                        <td className={td}>{b.brand}</td><td className={td}>{b.batch}</td><td className={td}>{b.expiry}</td>
                                        <td className={`${td} ${b.level === 'expired' ? 'font-bold' : ''}`}>{b.remaining}</td>
                                        <td className={td}>{b.quantity}</td><td className={td}>{b.distributor}</td><td className={td}>{b.grn}</td>
                                        <td className={td}><span className={`whitespace-nowrap text-[11px] font-bold ${LEVEL_TEXT[b.level]}`}>{LEVEL_LABEL[b.level]}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full min-w-[720px] border-collapse text-xs">
                            <thead><tr>
                                {['Medicine', 'Brand / Trade Name', 'Saleable Quantity', 'Minimum Level', 'Distributor', 'Status'].map((h) => <th key={h} className={th}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {total === 0 && <tr><td colSpan={6} className="px-2.5 py-8 text-center text-[#6b7a70]">No medicines match this filter.</td></tr>}
                                {slice(stockRows).map((r) => (
                                    <tr key={r.id}>
                                        <td className={`${td} max-w-[220px] font-bold text-[#17794a]`}>{r.medicine}</td>
                                        <td className={td}>{r.brand}</td><td className={td}>{r.quantity}</td><td className={td}>{r.min}</td><td className={td}>{r.distributor}</td>
                                        <td className={td}><span className={`text-[11px] font-bold ${tab === 'low' ? STAT_TEXT.low : STAT_TEXT.out}`}>{tab === 'low' ? 'Low Stock' : 'Out of Stock'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <footer className="flex items-center justify-between gap-3 pt-1.5">
                    <span className={muted}>{total} total {isExpiry ? 'expiring batches' : 'medicines'}</span>
                    <nav className="flex items-center gap-2" aria-label="Pagination">
                        <button type="button" aria-label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)} className="h-[34px] min-w-[34px] rounded-lg font-semibold disabled:opacity-40">‹</button>
                        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                            <button key={p} type="button" aria-current={p === current ? 'page' : undefined} onClick={() => setPage(p)}
                                className={`h-[34px] min-w-[34px] rounded-lg font-semibold ${p === current ? 'bg-[#17794a] text-white' : 'hover:bg-[#f4f7f5]'}`}>{p}</button>
                        ))}
                        <button type="button" aria-label="Next page" disabled={current === pages} onClick={() => setPage(current + 1)} className="h-[34px] min-w-[34px] rounded-lg font-semibold disabled:opacity-40">›</button>
                    </nav>
                </footer>
            </section>
        </div>
    );
}