import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  EMPTY_CATALOG_FORM, PRODUCT_CATEGORIES, displayName, isMedicine,
  searchCatalog, validateCatalogForm,
  type CatalogForm, type CatalogErrors, type CatalogItem, type ProductCategory,
} from './medicines/catalogLogic';
import { SAMPLE_BATCHES, SAMPLE_CATALOG } from './medicines/catalogDemoData';
import './medicines/MedicineCatalog.css';

type View = 'catalog' | 'add' | 'edit' | 'view';
const PER_PAGE = 9; 
const DOSAGE_FORMS = ['Tablet','Capsule','Inhaler','Syrup','Suspension','Injection','Cream','Ointment','Drops','Powder','Solution','Spray','Other'];

function csvCell(value: string): string {
  const escaped = /^[=+@\-\t\r]/.test(value) ? `'${value}` : value;
  return `"${escaped.replace(/"/g,'""')}"`;
}

export default function MedicinesPage() {
  const [items, setItems] = useState<CatalogItem[]>(SAMPLE_CATALOG);
  const [view, setView] = useState<View>('catalog');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<CatalogForm>({ ...EMPTY_CATALOG_FORM });
  const [errors, setErrors] = useState<CatalogErrors>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({top:0,left:0});
  const floatingMenu = useRef<HTMLDivElement>(null);

  const selected = items.find(item => item.id === selectedId);
  const deleting = items.find(item => item.id === deleteId);
  const filtered = useMemo(() => searchCatalog(items,query,category,manufacturer),[items,query,category,manufacturer]);
  const totalPages = Math.max(1,Math.ceil(filtered.length/PER_PAGE));
  const currentPage = Math.min(page,totalPages);
  const visible = filtered.slice((currentPage-1)*PER_PAGE,currentPage*PER_PAGE);

  useEffect(() => {
    if (!menuId) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (!floatingMenu.current?.contains(target) && !target.closest('[data-afd4-menu-trigger]')) setMenuId(null);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuId(null); };
    const close = () => setMenuId(null);
    document.addEventListener('pointerdown',outside);
    document.addEventListener('keydown',escape);
    window.addEventListener('scroll',close,true);
    window.addEventListener('resize',close);
    return () => {
      document.removeEventListener('pointerdown',outside);
      document.removeEventListener('keydown',escape);
      window.removeEventListener('scroll',close,true);
      window.removeEventListener('resize',close);
    };
  },[menuId]);

  const openForm = (type:'add'|'edit', item?:CatalogItem) => {
    setMenuId(null);setErrors({});setMessage('');
    setForm(item ? {
      genericName:item.genericName,productName:item.productName,brandTradeName:item.brandTradeName,
      dosageForm:item.dosageForm,strength:item.strength,packSize:item.packSize,
      manufacturer:item.manufacturer,category:item.category,
    } : { ...EMPTY_CATALOG_FORM });
    setSelectedId(item?.id??null);setView(type);
  };
  const openView = (id:string) => { setSelectedId(id);setMenuId(null);setView('view'); };
  const back = () => { setView('catalog');setSelectedId(null);setErrors({}); };
  const updateForm = (key:keyof CatalogForm,value:string) => {
    setForm(prev=>({ ...prev,[key]:value }));
    setErrors(prev=>({...prev,[key]:undefined,duplicate:undefined}));
  };
  const submit = (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateCatalogForm(form,items,view==='edit'?selectedId??undefined:undefined);
    setErrors(found);
    if (Object.keys(found).length) return;
    const medicineName = displayName(form);
    const cleaned = {
      ...form, medicineName,
      genericName:isMedicine(form.category)?form.genericName.trim():'',
      productName:isMedicine(form.category)?'':form.productName.trim(),
      dosageForm:isMedicine(form.category)?form.dosageForm:'',
      strength:isMedicine(form.category)?form.strength.trim():'',
      brandTradeName:form.brandTradeName.trim(),manufacturer:form.manufacturer.trim(),packSize:form.packSize.trim(),
    };
    if (view==='edit' && selectedId) {
      setItems(prev=>prev.map(item=>item.id===selectedId?{...item,...cleaned}:item));
      setMessage(`${medicineName} updated in the local UI preview. Not saved to MongoDB.`);
    } else {
      const nextNumber = Math.max(0,...items.map(item=>Number(item.medicineCode.replace(/\D/g,''))||0))+1;
      const newItem:CatalogItem = {
        ...cleaned,id:`demo-${nextNumber}`,medicineCode:`MED-${String(nextNumber).padStart(4,'0')}`,
        status:'ACTIVE',hasLinkedHistory:false,
      };
      setItems(prev=>[newItem,...prev]);
      setMessage(`${medicineName} added to the local UI preview. Not saved to MongoDB.`);
    }
    setPage(1);setView('catalog');setSelectedId(null);
  };
  const confirmDelete = () => {
    if (!deleting) return;
    if (deleting.hasLinkedHistory) {
      setItems(prev=>prev.map(item=>item.id===deleting.id?{...item,status:'INACTIVE'}:item));
      setMessage(`${deleting.medicineName} archived in the preview. Linked records were preserved.`);
    } else {
      setItems(prev=>prev.filter(item=>item.id!==deleting.id));
      setMessage(`${deleting.medicineName} deleted from the local preview only.`);
    }
    setDeleteId(null);setPage(1);
  };
  const exportCsv = () => {
    const header=['Medicine Name','Brand / Trade Name','Pack Size','Manufacturer','Category'];
    const rows=filtered.map(item=>[item.medicineName,item.brandTradeName,item.packSize,item.manufacturer,item.category]);
    const csv=[header,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([String.fromCharCode(0xFEFF),csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download='aidfast-medicine-catalog-demo.csv';
    document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
  };
  const menu = (event:MouseEvent<HTMLButtonElement>, id:string) => {
    if (menuId===id) {setMenuId(null);return;}
    const box=event.currentTarget.getBoundingClientRect();
    setMenuPosition({top:Math.max(8,Math.min(box.bottom+6,window.innerHeight-140)),left:Math.max(8,Math.min(box.right-144,window.innerWidth-152))});
    setMenuId(id);
  };
  const formField = (title:string,key:keyof CatalogForm,required:boolean=false) => (
    <label className="afd4-field" key={key}>
      <span>{title}{required?' *':''}</span>
      <input value={form[key]} onChange={e=>updateForm(key,e.target.value)} aria-invalid={Boolean(errors[key])} />
      {errors[key] && <small role="alert" className="afd4-error">{errors[key]}</small>}
    </label>
  );

  return <section className="afd4-page">
    {view==='catalog' && <>
      <header className="afd4-heading">
        <div><h1>Medicine &amp; Product Catalog</h1><p>Manage medicines and pharmacy products without duplicating batch or GRN records.</p></div>
        <button type="button" className="afd4-button afd4-primary" onClick={()=>openForm('add')}>Add Medicine / Product</button>
      </header>
      {message && <div className="afd4-success" role="status">{message}</div>}
      <section className="afd4-card afd4-search-card">
        <label className="afd4-search-label" htmlFor="afd4-search">Search catalog</label>
        <div className="afd4-search-row">
          <input id="afd4-search" value={query} placeholder="Search generic or brand/trade name" onChange={e=>{setQuery(e.target.value);setPage(1);}} />
          <button type="button" className="afd4-button afd4-outline" aria-expanded={showFilters} onClick={()=>setShowFilters(p=>!p)}>Add Filter</button>
          <button type="button" className="afd4-text-button" onClick={()=>{setQuery('');setCategory('');setManufacturer('');setShowFilters(false);setPage(1);}}>Clear Filters</button>
        </div>
        {showFilters && <div className="afd4-filters">
          <label className="afd4-field"><span>Category</span><select value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}>
            <option value="">All categories</option>
            {PRODUCT_CATEGORIES.map(name=><option key={name} value={name}>{name}</option>)}
          </select></label>
          <label className="afd4-field"><span>Manufacturer</span><input value={manufacturer} placeholder="Search manufacturer" onChange={e=>{setManufacturer(e.target.value);setPage(1);}} /></label>
        </div>}
      </section>
      <section className="afd4-card afd4-list-card">
        <header className="afd4-list-header"><div><h2>Medicine and pharmacy-product catalog</h2><p>{visible.length} displayed · {filtered.length} matching · {items.filter(item=>item.status==='ACTIVE').length} demo records</p></div><button type="button" className="afd4-text-button" onClick={exportCsv}>Export List</button></header>
        <div className="afd4-scroll-table"><table className="afd4-table"><thead><tr>
          <th>Medicine Name</th><th>Brand / Trade Name</th><th>Pack Size</th><th>Manufacturer</th><th>Actions</th>
        </tr></thead><tbody>
          {visible.length?visible.map(item=><tr key={item.id}>
            <td><button className="afd4-link" type="button" onClick={()=>openView(item.id)}>{item.medicineName}</button></td>
            <td>{item.brandTradeName||'—'}</td><td>{item.packSize}</td><td>{item.manufacturer}</td>
            <td><button className="afd4-more" type="button" data-afd4-menu-trigger="true" aria-haspopup="menu" aria-expanded={menuId===item.id} aria-label={`Actions for ${item.medicineName}`} onClick={e=>menu(e,item.id)}>•••</button></td>
          </tr>):<tr><td colSpan={5}><div className="afd4-empty">No matching products. Try clearing the search or filters.</div></td></tr>}
        </tbody></table></div>
        <footer className="afd4-list-footer"><span>Showing {filtered.length?(currentPage-1)*PER_PAGE+1:0}–{Math.min(currentPage*PER_PAGE,filtered.length)} of {filtered.length} demo records</span>
          <nav className="afd4-pages" aria-label="Catalog pages">
            <button type="button" aria-label="Previous page" disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>‹</button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(n=>totalPages<=7||n===1||n===totalPages||Math.abs(n-currentPage)<=1).map(n=><button type="button" key={n} aria-current={n===currentPage?'page':undefined} onClick={()=>setPage(n)}>{n}</button>)}
            <button type="button" aria-label="Next page" disabled={currentPage===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>›</button>
          </nav>
        </footer>
      </section>
    </>}

    {(view==='add'||view==='edit') && <>
      <button type="button" className="afd4-back" onClick={back}>← Medicine &amp; Product Catalog</button>
      <header className="afd4-heading afd4-form-heading"><div><h1>{view==='add'?'Add Medicine / Product':'Edit Medicine / Product'}</h1><p>Maintain reusable catalog information only; batch quantities and wholesale prices remain in GRN and inventory records.</p></div></header>
      <form noValidate onSubmit={submit}>
        <div className="afd4-card afd4-form-card">
          <div className="afd4-form-grid">
            {isMedicine(form.category)?formField('Generic Name','genericName',true):formField('Product Name','productName',true)}
            {formField('Brand / Trade Name','brandTradeName')}
            <label className="afd4-field"><span>Product Category *</span><select value={form.category} onChange={e=>{
              const next=e.target.value as ProductCategory;
              setForm(prev=>({...prev,category:next}));setErrors({});
            }}>
              {PRODUCT_CATEGORIES.map(name=><option key={name} value={name}>{name}</option>)}
            </select>{errors.category&&<small role="alert" className="afd4-error">{errors.category}</small>}</label>
            {formField('Manufacturer','manufacturer',true)}
            {isMedicine(form.category)?<>
              <label className="afd4-field"><span>Dosage Form *</span><select value={form.dosageForm} onChange={e=>updateForm('dosageForm',e.target.value)}>
                <option value="">Select dosage form</option>{DOSAGE_FORMS.map(name=><option key={name} value={name}>{name}</option>)}
              </select>{errors.dosageForm&&<small role="alert" className="afd4-error">{errors.dosageForm}</small>}</label>
              {formField('Strength','strength',true)}
            </>:null}
            {formField('Pack Size','packSize',true)}
          </div>
          {errors.duplicate&&<p role="alert" className="afd4-error afd4-duplicate">{errors.duplicate}</p>}
        </div>
        <div className="afd4-form-footer"><button className="afd4-button afd4-outline" type="button" onClick={back}>Cancel</button><button className="afd4-button afd4-primary" type="submit">{view==='add'?'Save Medicine / Product':'Save Changes'}</button></div>
      </form>
    </>}

    {view==='view'&&selected&&<>
      <button className="afd4-back" type="button" onClick={back}>← Medicine &amp; Product Catalog</button>
      <header className="afd4-heading"><div><h1>{selected.medicineName}</h1><p>{selected.brandTradeName||'No brand / trade name'} · {selected.medicineCode}</p></div><button className="afd4-button afd4-outline" type="button" onClick={()=>openForm('edit',selected)}>Edit Medicine / Product</button></header>
      <section className="afd4-card afd4-detail-card"><h2>Medicine / Product Details</h2><div className="afd4-detail-grid">
        <div><small>Medicine Name</small><strong>{selected.medicineName}</strong></div>
        <div><small>Brand / Trade Name</small><strong>{selected.brandTradeName||'—'}</strong></div>
        <div><small>Pack Size</small><strong>{selected.packSize}</strong></div>
        <div><small>Manufacturer</small><strong>{selected.manufacturer}</strong></div>
        <div><small>Product Category</small><strong>{selected.category}</strong></div>
      </div></section>
      <section className="afd4-card afd4-list-card afd4-batch-card"><header className="afd4-list-header"><div><h2>Linked Batches</h2><p>Demonstration data only. Real batches are managed through confirmed GRNs and Inventory.</p></div></header>
        <div className="afd4-scroll-table"><table className="afd4-table"><thead><tr><th>Batch Number</th><th>Available Quantity</th><th>Expiry Date</th><th>Distributor</th><th>Source GRN</th></tr></thead><tbody>
          {(SAMPLE_BATCHES[selected.id]||[]).length?(SAMPLE_BATCHES[selected.id]||[]).map(row=><tr key={row.batch}><td>{row.batch}</td><td>{row.available} units</td><td>{row.expiry}</td><td>{row.distributor}</td><td>{row.grn}</td></tr>):<tr><td colSpan={5}><div className="afd4-empty">No demonstration batch records are available for this product.</div></td></tr>}
        </tbody></table></div>
      </section>
    </>
    }
    {menuId&&createPortal(<div ref={floatingMenu} className="afd4-menu" role="menu" style={menuPosition}>
      <button role="menuitem" type="button" onClick={()=>openView(menuId)}>View</button>
      <button role="menuitem" type="button" onClick={()=>{const item=items.find(v=>v.id===menuId);if(item)openForm('edit',item);}}>Edit</button>
      <button role="menuitem" type="button" className="afd4-danger-text" onClick={()=>{setDeleteId(menuId);setMenuId(null);}}>Delete</button>
    </div>,document.body)}
    {deleting&&createPortal(<div className="afd4-dialog-layer" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setDeleteId(null);}}>
      <div role="dialog" aria-modal="true" aria-labelledby="afd4-dialog-title" className="afd4-dialog">
        <h2 id="afd4-dialog-title">{deleting.hasLinkedHistory?'Archive this product?':'Delete this product?'}</h2>
        <p>{deleting.hasLinkedHistory?'This medicine has linked batch or GRN demonstration records, so its catalog entry will be archived rather than deleted.':'This will remove the product from the local demonstration catalog only.'}</p>
        <div className="afd4-dialog-actions"><button type="button" className="afd4-button afd4-outline" onClick={()=>setDeleteId(null)}>Cancel</button><button type="button" className="afd4-button afd4-primary" onClick={confirmDelete}>{deleting.hasLinkedHistory?'Archive Product':'Delete Product'}</button></div>
      </div>
    </div>,document.body)}
  </section>;
}
