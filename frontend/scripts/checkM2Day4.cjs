const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('typescript');
const src = path.resolve(__dirname, '../src/pharmacy/pages/medicines/catalogLogic.ts');
const code = fs.readFileSync(src, 'utf8');
const compiled = ts.transpileModule(code, {
  fileName: src, reportDiagnostics: true,
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
});
assert.equal(compiled.diagnostics?.length ?? 0, 0, 'Catalog TypeScript must parse');
const moduleInstance = new Module(src, module);
moduleInstance.filename = src;
moduleInstance.paths = Module._nodeModulePaths(path.dirname(src));
moduleInstance._compile(compiled.outputText, src);
const { EMPTY_CATALOG_FORM, displayName, validateCatalogForm, searchCatalog } = moduleInstance.exports;
let passed = 0;
function test(label, fn) { fn(); passed++; console.log('PASS', label); }
const blank = { ...EMPTY_CATALOG_FORM };
const valid = { ...blank, genericName:'Paracetamol', strength:'500 mg', dosageForm:'Tablet', packSize:'24 tablets', manufacturer:'Haleon' };
const sample = { id:'one', medicineName:'Paracetamol Tablet 500 mg', genericName:'Paracetamol', productName:'',brandTradeName:'Panadol',packSize:'24 tablets',manufacturer:'Haleon',category:'Pharmaceutical Medicines',status:'ACTIVE' };
test('generic name required', () => assert.ok(validateCatalogForm(blank,[]).genericName));
test('manufacturer required', () => assert.ok(validateCatalogForm(blank,[]).manufacturer));
test('pack size required', () => assert.ok(validateCatalogForm(blank,[]).packSize));
test('strength required', () => assert.ok(validateCatalogForm(blank,[]).strength));
test('valid pharmaceutical product accepted', () => assert.deepEqual(validateCatalogForm(valid,[]),{}));
test('medicine name combines generic, form and strength', () => assert.equal(displayName(valid),'Paracetamol Tablet 500 mg'));
test('non-medicinal product requires product name', () => assert.ok(validateCatalogForm({...blank,category:'Medical & Surgical Supplies',dosageForm:''},[]).productName));
test('duplicate product rejected', () => assert.ok(validateCatalogForm({...valid,brandTradeName:'Panadol'},[sample]).duplicate));
test('brand name search matches', () => assert.equal(searchCatalog([sample],'panadol','','').length,1));
test('category filter narrows results', () => assert.equal(searchCatalog([sample],'','Ayurvedic & Traditional Products','').length,0));
test('manufacturer filter narrows results', () => assert.equal(searchCatalog([sample],'','','GSK').length,0));
console.log(`\n${passed} checks passed; no MongoDB connection needed.`);
