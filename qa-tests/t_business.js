// Business regression tests: synthetic data only, no customer data leaves this process.
process.on('unhandledRejection',e=>console.error('UNHANDLED',e));
const fs=require('fs'),{boot}=require('./harness');
const A=boot('app.js'),R=s=>A.run(s);
R(fs.readFileSync('business.js','utf8'));
R("ensureDefaults();render=function(){};showInv=function(){};modal=function(){}");
let pass=0,fail=0;
function check(label,cond,extra=''){(cond?pass++:fail++);console.log((cond?'PASS ':'FAIL ')+label+(cond?'':' '+extra))}
function rejects(expr){return R("(()=>{try{"+expr+";return false}catch(e){return true}})()")}
(async()=>{
  await new Promise(r=>setTimeout(r,70));
  R("ensureDefaults()");
  check('new cashCounts initialized without schema replacement',R('Array.isArray(db.cashCounts)&&db.version===1'));
  const id=R("HanaBusiness.makeMeasuredProduct({name:'عطر آزمایشی',unit:'میلی‌لیتر',price:1000,cost:600,qty:100,min:10})");
  check('millilitre product created with unit',R("prod('"+id+"').unit==='میلی‌لیتر'&&prod('"+id+"').qty===100"));
  check('fractional quantity rejected instead of silent truncation',rejects("HanaBusiness.makeMeasuredProduct({name:'بد',unit:'گرم',price:100,cost:50,qty:1.5,min:0})"));
  check('negative quantity rejected',rejects("HanaBusiness.makeMeasuredProduct({name:'بد',unit:'گرم',price:100,cost:50,qty:-2,min:0})"));
  check('mass-volume conversion not silently applied',rejects("mkProdEdit('"+id+"',{name:'عطر آزمایشی',unit:'گرم',price:1000,min:10})"));
  const cid='client1';R("db.customers.push({id:'"+cid+"',name:'مشتری نمونه',phone:'09121111111',promo:false})");
  const sale=R("mkSale([{pid:'"+id+"',n:10,price:1000}],'"+cid+"',1000,9000,'1101')");
  check('sale decreases ml stock',R("prod('"+id+"').qty===90"));
  check('ledger audit all four checks pass',R('HanaBusiness.ledgerHealth().every(x=>x.ok)'),JSON.stringify(R('HanaBusiness.ledgerHealth()')));
  const pm=R('HanaBusiness.itemProfit()');
  check('product margin uses historical cost and invoice discount',pm.rows.find(x=>x.pid===id)?.profit===3000,JSON.stringify(pm));
  R("mkReturn('"+sale+"',0,2,'1101','ok')");
  check('returns included in product profit',R("HanaBusiness.itemProfit().rows.find(x=>x.pid==='"+id+"').qty===8"));
  check('audit still passes after return',R('HanaBusiness.ledgerHealth().every(x=>x.ok)'),JSON.stringify(R('HanaBusiness.ledgerHealth()')));
  const cash0=R("bal('1101')"),journal0=R('db.journal.length');
  const count=R("HanaBusiness.countCash(7000,'پایان شیفت')");
  check('cash count stores actual and variance',count.actual===7000&&count.difference===7000-cash0);
  check('cash count never posts accounting entry',R('db.journal.length')===journal0&&R("bal('1101')")===cash0);
  check('invalid count rejected',rejects("HanaBusiness.countCash(-1,'x')"));
  check('cash count survives JSON round-trip',R("JSON.parse(JSON.stringify(db)).cashCounts.length")===1);
  check('customer opt-out preserved',R("HanaBusiness.retentionData().top.find(x=>x.id==='client1').promo")===false);
  check('new and never-bought customers separated',R('HanaBusiness.retentionData().never.length')===0);
  const imp=R("mkImportPartial({section:'products',data:[{id:'new-import',name:'عطر وارداتی',qty:12,cost:500,price:1000,unit:'گرم'}]})");
  check('partial product import creates opening inventory journal',imp.add===1&&R("HanaBusiness.ledgerHealth().every(x=>x.ok)"));
  check('invalid imported stock rejected',rejects("mkImportPartial({section:'products',data:[{id:'bad-import',name:'خراب',qty:-3,cost:100}]})"));
  check('clear waits for safety backup',fs.readFileSync('app.js','utf8').includes("try{await dl('auto-before-clear_"));
  R("db.journal[0].lines[0].d+=1");
  check('tampered journal detected by audit',R('HanaBusiness.ledgerHealth().some(x=>!x.ok)'));
  console.log('BUSINESS TESTS '+pass+' passed, '+fail+' failed');
  if(fail)process.exitCode=1;
})();
