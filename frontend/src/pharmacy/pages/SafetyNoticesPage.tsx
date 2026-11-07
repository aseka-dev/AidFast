import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type Status = 'matched' | 'open' | 'nomatch' | 'resolved';
type Action = 'BLOCKED' | 'QUARANTINED';

interface Notice {
    id: string; reference: string; date: string; medicine: string; brand: string;
    manufacturer: string; batch: string; status: Status; inventory: string; action?: Action;
}

const STATUS: Record<Status, { label: string; cls: string }> = {
    matched: { label: 'Safety Alert · Matched', cls: 'bg-[#e1f0f6] text-[#2b6a86]' },
    open: { label: 'Safety Alert · Open', cls: 'bg-[#e1f0f6] text-[#2b6a86]' },
    nomatch: { label: 'Safety Alert · No Match', cls: 'bg-[#fdecc8] text-[#b4730b]' },
    resolved: { label: 'Safety Alert · Resolved', cls: 'bg-[#e1f3e8] text-[#1b7a4b]' },
};

/* ---------- mock data: replace with GET /api/v1/safety-notices and .../safety-matches ---------- */
const NOTICES: Notice[] = [
    { id: 'n1', reference: 'NMRA/SN/2026/041', date: '29 Sep 2026', medicine: 'Losartan tablet 50 mg', brand: 'Cozaar', manufacturer: 'Ceylon Remedies', batch: 'LOS-24K18', status: 'matched', inventory: '46 tablets' },
    { id: 'n2', reference: 'WHO/MED/2026/118', date: '28 Sep 2026', medicine: 'Metformin tablet 500 mg', brand: 'Glucophage', manufacturer: 'NovaMed Labs', batch: 'MET-2606-A', status: 'open', inventory: 'Not checked' },
    { id: 'n3', reference: 'NMRA/SN/2026/038', date: '20 Sep 2026', medicine: 'Cefuroxime tablet 500 mg', brand: 'Zinnat', manufacturer: 'Lanka Pharma', batch: 'CFX-88A2', status: 'nomatch', inventory: '0 units' },
    { id: 'n4', reference: 'MAH/FSN/2026/09', date: '16 Sep 2026', medicine: 'Insulin glargine solution for injection 100 units/mL', brand: 'Lantus', manufacturer: 'Biocare Therapeutics', batch: 'INS-2510-K', status: 'matched', inventory: '22 pens' },
    { id: 'n5', reference: 'NMRA/SN/2026/031', date: '04 Sep 2026', medicine: 'Cetirizine tablet 10 mg', brand: 'Zyrtec', manufacturer: 'Helix Healthcare', batch: 'CET-2507-E', status: 'resolved', inventory: '0 units' },
    { id: 'n6', reference: 'NMRA/SN/2026/027', date: '22 Aug 2026', medicine: 'Amoxicillin capsule 500 mg', brand: 'Amoxil', manufacturer: 'MedSupply Labs', batch: 'AMX-2601-F', status: 'matched', inventory: '148 capsules' },
    { id: 'n7', reference: 'WHO/MED/2026/102', date: '14 Aug 2026', medicine: 'Omeprazole gastro-resistant capsule 20 mg', brand: 'Losec', manufacturer: 'Helix Healthcare', batch: 'OME-2603-B', status: 'nomatch', inventory: '0 units' },
];

const PAGE_SIZE = 5;
const th = 'px-3 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wide text-[#6b7a70]';
const td = 'border-t border-[#e2e8e3] px-3 py-5 align-middle text-xs text-[#4b5a50]';

function downloadCsv(name: string, header: string[], rows: string[][]) {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
}

export default function SafetyNoticesPage({ canAct = true }: { canAct?: boolean }) {
    const [rows, setRows] = useState<Notice[]>(NOTICES);
    const [draft, setDraft] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [pending, setPending] = useState<{ notice: Notice; action: Action } | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter((n) => !q || [n.reference, n.medicine, n.brand, n.batch, n.manufacturer].some((v) => v.toLowerCase().includes(q)));
    }, [rows, query]);

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const current = Math.min(page, pages);
    const from = total === 0 ? 0 : (current - 1) * PAGE_SIZE + 1;
    const to = Math.min(current * PAGE_SIZE, total);
    const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    const runSearch = (value: string) => { setQuery(value); setPage(1); };

    const confirmAction = () => {
        if (!pending) return;
        // TODO Day 11: POST /api/v1/pharmacies/:pharmacyId/safety-matches/:matchId/action (needs safety:action)
        setRows((r) => r.map((n) => (n.id === pending.notice.id ? { ...n, action: pending.action } : n)));
        setPending(null);
    };

    const exportList = () => downloadCsv('safety-notices.csv',
        ['Notice Reference', 'Notice Date', 'Medicine', 'Brand / Trade Name', 'Manufacturer', 'Batch Number', 'Status', 'Inventory Match', 'Action Taken'],
        filtered.map((n) => [n.reference, n.date, n.medicine, n.brand, n.manufacturer, n.batch, STATUS[n.status].label, n.inventory, n.action ?? '']));

    return (
        <div className="flex flex-col gap-5 p-6 text-[#14291d]">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Medicine Safety Notices &amp; Recall Management</h1>
                    <p className="mt-1 text-sm text-[#6b7a70]">Verify, record, and act on medicine safety notices and affected batches.</p>
                </div>
                <Link to="/dashboard/safety-notices/new" className="rounded-xl bg-[#17794a] px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-[#0f5c35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17794a]">
                    Add Verified Safety Notice
                </Link>
            </div>

            <div role="note" className="rounded-xl border border-[#2f6f9a] bg-[#f5faff] px-4 py-3 text-xs text-[#2b6a86]">
                Verification is required before entry. Confirm every notice against the issuing authority or an authorized source.
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-[#e2e8e3] bg-white px-5 py-4 shadow-sm focus-within:border-[#17794a]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7a70" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m21 21-4.3-4.3" /><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14" /></svg>
                <input type="search" value={draft} placeholder="Medicine, batch number, or notice reference" aria-label="Search safety notices"
                    onChange={(e) => { setDraft(e.target.value); if (e.target.value === '') runSearch(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') runSearch(draft); }}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#9aa7a0]" />
                <span className="hidden text-[11px] text-[#9aa7a0] sm:inline">Press Enter to search</span>
            </label>

            <section className="overflow-hidden rounded-2xl border border-[#e2e8e3] bg-white shadow-sm">
                <div className="flex items-start justify-between gap-3 p-6">
                    <div>
                        <h2 className="text-lg font-bold">Verified safety notice records</h2>
                        <p className="mt-2 text-xs text-[#6b7a70]">Showing {from}–{to} of {total} notices</p>
                    </div>
                    <button type="button" onClick={exportList} disabled={total === 0}
                        className="px-2 py-1.5 text-xs font-semibold text-[#17794a] hover:underline disabled:cursor-not-allowed disabled:opacity-50">Export list</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] border-collapse">
                        <thead className="bg-[#f4f7f5]">
                            <tr>{['Notice Reference', 'Notice Date', 'Medicine', 'Brand / Trade Name', 'Manufacturer', 'Batch Number', 'Status', 'Inventory Match', 'Actions'].map((h) => <th key={h} className={th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {total === 0 && <tr><td colSpan={9} className="px-3 py-10 text-center text-sm text-[#6b7a70]">No notices match “{query}”. Try a medicine name, batch number or notice reference.</td></tr>}
                            {visible.map((n) => (
                                <tr key={n.id}>
                                    <td className={`${td} font-bold text-[#17794a]`}>{n.reference}</td>
                                    <td className={td}>{n.date}</td>
                                    <td className={`${td} max-w-[190px]`}>{n.medicine}</td>
                                    <td className={td}>{n.brand}</td>
                                    <td className={td}>{n.manufacturer}</td>
                                    <td className={td}>{n.batch}</td>
                                    <td className={td}><span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold ${STATUS[n.status].cls}`}>{STATUS[n.status].label}</span></td>
                                    <td className={td}>{n.inventory}</td>
                                    <td className={td}>
                                        {n.action ? (
                                            <span className={`text-[11px] font-bold ${n.action === 'BLOCKED' ? 'text-[#7a2d38]' : 'text-[#b3263a]'}`}>{n.action === 'BLOCKED' ? 'Blocked' : 'Quarantined'}</span>
                                        ) : n.status === 'matched' && canAct ? (
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => setPending({ notice: n, action: 'BLOCKED' })} className="rounded-full bg-[#d9bcc0] px-3.5 py-1.5 text-[11px] font-semibold text-[#7a2d38] hover:bg-[#cfa9ae]">Block</button>
                                                <button type="button" onClick={() => setPending({ notice: n, action: 'QUARANTINED' })} className="rounded-full bg-[#fbe3e7] px-3.5 py-1.5 text-[11px] font-semibold text-[#b3263a] hover:bg-[#f6d0d6]">Quarantine</button>
                                            </div>
                                        ) : <span className="text-[#9aa7a0]">—</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <footer className="flex items-center justify-between gap-3 border-t border-[#e2e8e3] px-6 py-5">
                    <span className="text-xs text-[#6b7a70]">{total} total safety notices</span>
                    <nav className="flex items-center gap-2" aria-label="Pagination">
                        <button type="button" aria-label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)} className="h-9 min-w-9 rounded-lg font-semibold disabled:opacity-40">‹</button>
                        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                            <button key={p} type="button" aria-current={p === current ? 'page' : undefined} onClick={() => setPage(p)}
                                className={`h-9 min-w-9 rounded-lg text-sm font-semibold ${p === current ? 'bg-[#17794a] text-white' : 'hover:bg-[#f4f7f5]'}`}>{p}</button>
                        ))}
                        <button type="button" aria-label="Next page" disabled={current === pages} onClick={() => setPage(current + 1)} className="h-9 min-w-9 rounded-lg font-semibold disabled:opacity-40">›</button>
                    </nav>
                </footer>
            </section>

            {pending && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPending(null)}>
                    <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h3 id="confirm-title" className="text-lg font-bold">{pending.action === 'BLOCKED' ? 'Block' : 'Quarantine'} batch {pending.notice.batch}?</h3>
                        <p className="mt-2 text-sm text-[#4b5a50]">
                            {pending.notice.medicine} ({pending.notice.inventory}) will be removed from saleable stock. Notice {pending.notice.reference}.
                        </p>
                        <div className="mt-5 flex justify-end gap-3">
                            <button type="button" autoFocus onClick={() => setPending(null)} className="rounded-lg border border-[#cfd8d2] px-4 py-2.5 text-sm font-semibold hover:bg-[#f4f7f5]">Cancel</button>
                            <button type="button" onClick={confirmAction} className="rounded-lg bg-[#b3263a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#962032]">
                                {pending.action === 'BLOCKED' ? 'Block batch' : 'Quarantine batch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}