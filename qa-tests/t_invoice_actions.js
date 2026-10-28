// Accounting audit for invoice edits/cancellation and non-posting quick print.
const fs=require('fs'),{boot}=require('./harness'),A=boot('app.js'),R=s=>A.run(s);
for(const file of ['business.js','phase1.js','management234.js','voice-assistant.js','customer-actions.js','assistant-v2.js','invoice-studio.js','invoice-premium.js','invoice-actions.js','voice-workflows.js'])R(fs.readFileSync(file,'utf8'));
R('ensureDefaults()');
let good=0,bad=0;const ck=(n,v)=>{console.log((v?'PASS ':'FAIL ')+n);v?good++:bad++};
const balanced=()=>R("db.journal.every(j=>j.lines.reduce((a,l)=>a+(l.d||0)-(l.c||0),0)===0)&&bal('1104')===db.products.reduce((a,p)=>a+HanaPhase1.stockValue(p),0)&&bal('1103')===db.customers.reduce((a,c)=>a+cDebt(c.id),0)");
const a=R("mkProduct({name:'عطر A',unit:'گرم',qty:10,cost:50,price:100,min:0})");
const b=R("mkProduct({name:'عطر B',unit:'میلی‌لیتر',qty:8,cost:100,price:200,min:0})");
R("db.customers.push({id:'c1',name:'مشتری تست',phone:'09120000000'})");
const id=R("mkSale([{pid:'"+a+"',n:2,price:100}],'c1',0,200,'1101')");
const before=R('JSON.stringify(db)'),stockA=R("prod('"+a+"').qty");
ck('sale before edit recorded',R("db.sales.some(s=>s.id==='"+id+"')")&&stockA===8);
const draft=R("HanaInvoiceActions.previewData({'"+a+"':1.5},'c1')");
ck('draft prints without an invoice number',draft.no===null&&draft.total===150&&draft.lines[0].n===1.5);
ck('print draft never posts or changes inventory',R('JSON.stringify(db)')===before);
const altered=R("HanaInvoiceActions.revise('"+id+"',{cid:'c1',lines:[{pid:'"+a+"',n:1.5,price:200},{pid:'"+b+"',n:1,price:200}],discount:10})");
ck('revision preserves identity',altered===id&&R("db.sales.find(s=>s.id==='"+id+"').no")===1001);
ck('invoice total and paid updated',R("db.sales.find(s=>s.id==='"+id+"').total")===490&&R("db.sales.find(s=>s.id==='"+id+"').paid")===200);
ck('quantity and unit edited',R("prod('"+a+"').qty")===8.5&&R("prod('"+b+"').qty")===7);
ck('revision maintains account and stock balance',balanced());
ck('balance owed by customer updated',R("cDebt('c1')")===290);
ck('old journal rows retained and revision history added',R('db.invoiceRevisions.length')===1&&R("db.journal.some(j=>j.desc.includes('برگشت سند'))"));
const journalCount=R('db.journal.length'),rev2=R("HanaInvoiceActions.revise('"+id+"',{cid:'c1',lines:[{pid:'"+a+"',n:2,price:190}],discount:0})");
ck('second edit succeeds',rev2===id&&R("db.sales.find(s=>s.id==='"+id+"').total")===380);
ck('no ledger mismatch after second edit',balanced()&&R('db.invoiceRevisions.length')===2&&R('db.journal.length')>journalCount);
const qtyBeforeFail=R("prod('"+a+"').qty"),state=R('JSON.stringify(db)');
let rejected=false;try{R("HanaInvoiceActions.revise('"+id+"',{cid:'',lines:[{pid:'"+a+"',n:2,price:50}],discount:0})")}catch(e){rejected=true}
ck('paid exceeds revised total blocks editing',rejected&&R('JSON.stringify(db)')===state);
rejected=false;try{R("HanaInvoiceActions.voidSale('"+id+"','test',false)")}catch(e){rejected=true}
ck('paid invoice cannot cancel without refund confirmation',rejected&&R('JSON.stringify(db)')===state);
R("HanaInvoiceActions.voidSale('"+id+"','صدور اشتباهی',true)");
ck('cancel is soft and stores reason',R("db.sales.find(s=>s.id==='"+id+"').status")==='cancel'&&R("db.sales.find(s=>s.id==='"+id+"').cancelInfo.reason")==='صدور اشتباهی');
ck('cancel restores original inventory and zeroes cash',R("prod('"+a+"').qty")===10&&R("prod('"+b+"').qty")===8&&R("bal('1101')")===0);
ck('canceled invoices excluded from debt',R("cDebt('c1')")===0);
ck('canceled invoices stay in JSON history',R("db.sales.length")===1&&R('db.invoiceRevisions.length')===3);
ck('balance after invoice cancellation',balanced());
rejected=false;try{R("HanaInvoiceActions.voidSale('"+id+"','again',true)")}catch(e){rejected=true}
ck('double cancel rejected',rejected);
const sid2=R("mkSale([{pid:'"+a+"',n:2,price:100}],'c1',0,0,'1101')");
R("db.sales.find(s=>s.id==='"+sid2+"').paid=100");
rejected=false;try{R("HanaInvoiceActions.revise('"+sid2+"',{cid:'c1',lines:[{pid:'"+a+"',n:2,price:100}],discount:0})")}catch(e){rejected=true}
ck('unlinked external payment blocks destructive correction',rejected);
const sid3=R("mkSale([{pid:'"+b+"',n:1,price:200}],'c1',0,200,'1101')");
R("mkReturn('"+sid3+"',0,0.5,'1101','ok')");
rejected=false;try{R("HanaInvoiceActions.voidSale('"+sid3+"','remove',true)")}catch(e){rejected=true}
ck('returned invoice blocks cancellation',rejected);
const sid4=R("mkSale([{pid:'"+a+"',n:1,price:100}],'c1',0,100,'1101')");
R("db.lockDate=toJ()");
rejected=false;try{R("HanaInvoiceActions.voidSale('"+sid4+"','closed',true)")}catch(e){rejected=true}
ck('closed accounting period blocks cancellation',rejected);
ck('independent quick sale actions labeled clearly',fs.readFileSync('app.js','utf8').includes('id="qprint"')&&fs.readFileSync('app.js','utf8').includes('فقط پرینت')&&fs.readFileSync('app.js','utf8').includes("else if(a==='print')"));
ck('responsive invoice management buttons available',R('typeof HanaInvoiceActions.editDialog')==='function'&&R('typeof HanaInvoiceActions.list')==='function');
console.log('INVOICE ACTION TESTS '+good+' passed, '+bad+' failed');
if(bad)process.exitCode=1;