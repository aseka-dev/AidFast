import type { CatalogItem } from './catalogLogic';

export const SAMPLE_CATALOG: CatalogItem[] = [
  {id:'sample-1',medicineCode:'MED-0001',medicineName:'Amoxicillin Capsule 500 mg',genericName:'Amoxicillin',productName:'',brandTradeName:'Amoxil',dosageForm:'Capsule',strength:'500 mg',packSize:'20 capsules',category:'Pharmaceutical Medicines',manufacturer:'GSK',status:'ACTIVE',hasLinkedHistory:true},
  {id:'sample-2',medicineCode:'MED-0002',medicineName:'Paracetamol Tablet 500 mg',genericName:'Paracetamol',productName:'',brandTradeName:'Panadol',dosageForm:'Tablet',strength:'500 mg',packSize:'24 tablets',category:'Pharmaceutical Medicines',manufacturer:'Haleon',status:'ACTIVE',hasLinkedHistory:true},
  {id:'sample-3',medicineCode:'MED-0003',medicineName:'Metformin Tablet 500 mg',genericName:'Metformin',productName:'',brandTradeName:'Glucophage',dosageForm:'Tablet',strength:'500 mg',packSize:'30 tablets',category:'Pharmaceutical Medicines',manufacturer:'Merck',status:'ACTIVE',hasLinkedHistory:true},
  {id:'sample-4',medicineCode:'MED-0004',medicineName:'Salbutamol Inhaler 100 mcg/dose',genericName:'Salbutamol',productName:'',brandTradeName:'Ventolin',dosageForm:'Inhaler',strength:'100 mcg/dose',packSize:'200 doses',category:'Pharmaceutical Medicines',manufacturer:'GSK',status:'ACTIVE',hasLinkedHistory:true},
  {id:'sample-5',medicineCode:'MED-0005',medicineName:'Sterile Gauze',genericName:'',productName:'Sterile Gauze',brandTradeName:'MediSoft',dosageForm:'',strength:'',packSize:'10 pieces',category:'Medical & Surgical Supplies',manufacturer:'CareTex',status:'ACTIVE',hasLinkedHistory:false},
  {id:'sample-6',medicineCode:'MED-0006',medicineName:'First Aid Box',genericName:'',productName:'First Aid Box',brandTradeName:'SafeCare',dosageForm:'',strength:'',packSize:'Standard 42-piece kit',category:'Medical & Surgical Supplies',manufacturer:'CareBridge',status:'ACTIVE',hasLinkedHistory:false},
  {id:'sample-7',medicineCode:'MED-0007',medicineName:'Siddhalepa Balm',genericName:'',productName:'Siddhalepa Balm',brandTradeName:'Siddhalepa',dosageForm:'',strength:'',packSize:'1 jar',category:'Ayurvedic & Traditional Products',manufacturer:'Hettigoda Industries',status:'ACTIVE',hasLinkedHistory:false},
  {id:'sample-8',medicineCode:'MED-0008',medicineName:'Asamodagam',genericName:'',productName:'Asamodagam',brandTradeName:'Link Natural',dosageForm:'',strength:'',packSize:'1 bottle',category:'Ayurvedic & Traditional Products',manufacturer:'Link Natural Products',status:'ACTIVE',hasLinkedHistory:false},
  {id:'sample-9',medicineCode:'MED-0009',medicineName:'Veterinary Wound Spray',genericName:'',productName:'Veterinary Wound Spray',brandTradeName:'VetCare',dosageForm:'',strength:'',packSize:'1 bottle',category:'Veterinary Medicines & Animal Care',manufacturer:'Animal Health Labs',status:'ACTIVE',hasLinkedHistory:false},
  // Additional *fictional* rows allow the Next/Previous pagination controls to be tested.
  {id:'sample-10',medicineCode:'MED-0010',medicineName:'Cetirizine Tablet 10 mg',genericName:'Cetirizine',productName:'',brandTradeName:'Zyrtec',dosageForm:'Tablet',strength:'10 mg',packSize:'10 tablets',category:'Pharmaceutical Medicines',manufacturer:'Example Pharma',status:'ACTIVE',hasLinkedHistory:true},
  {id:'sample-11',medicineCode:'MED-0011',medicineName:'Omeprazole Capsule 20 mg',genericName:'Omeprazole',productName:'',brandTradeName:'Losec',dosageForm:'Capsule',strength:'20 mg',packSize:'14 capsules',category:'Pharmaceutical Medicines',manufacturer:'Example Pharma',status:'ACTIVE',hasLinkedHistory:true},
  {id:'sample-12',medicineCode:'MED-0012',medicineName:'Amlodipine Tablet 5 mg',genericName:'Amlodipine',productName:'',brandTradeName:'Norvasc',dosageForm:'Tablet',strength:'5 mg',packSize:'30 tablets',category:'Pharmaceutical Medicines',manufacturer:'Example Labs',status:'ACTIVE',hasLinkedHistory:true},
  {id:'sample-13',medicineCode:'MED-0013',medicineName:'Digital Thermometer',genericName:'',productName:'Digital Thermometer',brandTradeName:'DemoCare',dosageForm:'',strength:'',packSize:'1 device',category:'Medical Devices & Diagnostics',manufacturer:'Example Devices',status:'ACTIVE',hasLinkedHistory:false},
  {id:'sample-14',medicineCode:'MED-0014',medicineName:'Baby Lotion',genericName:'',productName:'Baby Lotion',brandTradeName:'DemoBaby',dosageForm:'',strength:'',packSize:'200 mL bottle',category:'Mother & Baby Care',manufacturer:'Example Consumer Products',status:'ACTIVE',hasLinkedHistory:false},
];


export const SAMPLE_BATCHES: Record<string,{batch:string;expiry:string;available:number;distributor:string;grn:string}[]> = {
 'sample-1':[
  {batch:'AMX-2609-A',expiry:'31 Aug 2028',available:420,distributor:'MedSupply Cooperative',grn:'GRN-2026-010482'},
  {batch:'AMX-2608-B',expiry:'30 Jun 2028',available:64,distributor:'Greenline Pharma',grn:'GRN-2026-010477'},
 ],
 'sample-2':[{batch:'PAR-2609-B',expiry:'30 Sep 2028',available:240,distributor:'MedSupply Cooperative',grn:'GRN-DEMO-001'}],
};
