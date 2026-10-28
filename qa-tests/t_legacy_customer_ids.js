// Regression for mixed legacy numeric/string customer IDs. Synthetic records only.
// The real store's JSON backup is never committed or included in test assets.
const fs=require('fs'),{boot}=require('./harness');
const A=boot('app.js'),R=s=>A.run(s);
R(fs.readFileSync('business.js','utf8'));
R(fs.readFileSync('phase1.js','utf8'));
R(fs.readFileSync('management234.js','utf8'));
R(fs.readFileSync('customer-actions.js','utf8'));
R('ensureDefaults()');
let ok=0,fail=0;
function check(name,result){console.log((result?'PASS ':'FAIL ')+name);result?ok++:fail++}
const mixed=JSON.stringify({
 customers:[{id:265,name:'مشتری نمونه قدیمی',phone:'09120000000',promo:true},{id:'new-1',name:'مشتری جدید',phone:'09120000001',promo:false}],
 sales:[{id:'inv1',cid:'265',total:2000,paid:500,status:'part',date:'1405/08/06',lines:[]},{id:'inv2',cid:'new-1',total:1000,paid:1000,status:'paid',date:'1405/08/06',lines:[]}],
 payments:[{id:'pay1',cid:265,amt:300}],points:[{id:'pt1',cid:265,n:20}],
 reminders:[{id:'r1',cid:265,title:'پیگیری',done:false}],
 comms:[{id:'m1',cid:265,title:'تبریک'}],
 cheques:[{id:'ch1',party:265,status:'open',type:'in'},{id:'ch2',party:'supplier1',status:'open',type:'out'}],
 campaigns:[{id:'campaign1',recips:[{cid:265,status:'pending'}]}],
 journal:[{id:'j1',lines:[{a:'1101',d:2500},{a:'4101',c:2500}]}],
 products:[{id:'p1',name:'عطر تست',qty:3,cost:1000,price:2000}]
});
R('globalThis.syntheticLegacy='+mixed);
const original=R('JSON.stringify(syntheticLegacy)');
let changed=R('canonicalCustomerIds(syntheticLegacy)');
check('migration needed for old numeric IDs',changed.changed===true);
const migrated=changed.data;
check('all customers preserved',migrated.customers.length===2);
check('numeric customer ID converted to string',migrated.customers[0].id==='265');
check('all relevant relations migrated',migrated.sales[0].cid==='265'&&migrated.payments[0].cid==='265'&&migrated.points[0].cid==='265'&&migrated.reminders[0].cid==='265'&&migrated.comms[0].cid==='265');
check('campaign and customer cheque relations migrated',migrated.campaigns[0].recips[0].cid==='265'&&migrated.cheques[0].party==='265');
check('unrelated supplier cheque unchanged',migrated.cheques[1].party==='supplier1');
check('invoice money/journal/stock untouched',JSON.stringify(migrated.journal)===JSON.stringify(JSON.parse(original).journal)&&JSON.stringify(migrated.products)===JSON.stringify(JSON.parse(original).products)&&migrated.sales[0].total===2000);
check('input backup unmodified',R('JSON.stringify(syntheticLegacy)')===original);
check('idempotent when run twice',R('canonicalCustomerIds(canonicalCustomerIds(syntheticLegacy).data).changed')===false);
R('db.customers=canonicalCustomerIds(syntheticLegacy).data.customers;db.sales=canonicalCustomerIds(syntheticLegacy).data.sales;db.points=canonicalCustomerIds(syntheticLegacy).data.points');
check('customer lookup from DOM string',R("cust('265').name")==='مشتری نمونه قدیمی');
check('customer debts preserved',R("cDebt('265')")===1500);
check('customer points preserved',R("cPoints('265')")===20);
check('customer action resolves imported numeric-id contact',R("HanaCustomerActions.waPhone(cust('265'))")==='989120000000');
R("db.customers=[{id:265,name:'test numeric'}]");
check('numeric customer still found before next migration',R("cust('265').name")==='test numeric');
let collision=R("(()=>{try{canonicalCustomerIds({customers:[{id:12},{id:'12'}]});return false}catch(e){return true}})()");
check('ambiguous legacy ID collision safely refused',collision);
R('db=blank()'); // Restore the harness state before asynchronous startup rendering.
console.log('LEGACY CUSTOMER ID TESTS '+ok+' passed, '+fail+' failed');
if(fail)process.exitCode=1;
