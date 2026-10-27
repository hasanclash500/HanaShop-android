// HanaShop phases 2–4 regression tests (synthetic fixtures only).
const fs=require('fs'),{boot}=require('./harness');
const A=boot('app.js'),R=s=>A.run(s);
R(fs.readFileSync('business.js','utf8'));
R(fs.readFileSync('management234.js','utf8'));
R('ensureDefaults();render=function(){};modal=function(){}');
let passed=0,failed=0;
function check(label,value){console.log((value?'PASS ':'FAIL ')+label);value?passed++:failed++}
function rejects(code){try{R(code);return false}catch(e){return true}}
(async()=>{
 check('schema unchanged',R('db.version===1&&Array.isArray(db.management234.counts)'));
 const p=R("mkProduct({name:'عطر آزمایشی',qty:100,cost:1000,price:3000,unit:'گرم',min:10})");
 const p2=R("mkProduct({name:'عطر دیگر',qty:5,cost:500,price:1500,unit:'میلی‌لیتر',min:10})");
 R("db.customers.push({id:'c1',name:'مشتری آزمایشی',phone:'09121111111',promo:false})");
 check('stock list',R('HanaManagement234.stockHealth().length')===2);
 check('low stock',R('HanaManagement234.stockHealth().filter(x=>x.low).length')===1);
 check('inventory book value',R('HanaManagement234.kpis().stockValue')===102500);
 check('Persian decimals',R("HanaManagement234.qty('۱۲٫۵')")===12.5);
 check('reject overprecision',rejects("HanaManagement234.qty('1.1234')"));
 check('reject negative',rejects("HanaManagement234.qty('-5')"));
 R("mkSale([{pid:'"+p+"',n:10,price:3000}],'c1',0,20000,'1101')");
 check('invoice recorded',R('HanaManagement234.kpis().count')===1);
 check('cash ledger follows payment',R("HanaManagement234.accountRows('1101').closing")===20000);
 check('customer debt',R('HanaManagement234.customerRows()[0].debt')===10000);
 check('marketing opt-in remains false',R('HanaManagement234.customerRows()[0].promo')===false);
 check('post-sale inventory',R("HanaManagement234.stockHealth().find(x=>x.id==='"+p+"').qty")===90);
 const e=R('db.expCats[0].id');
 R("mkExpense({cat:'"+e+"',desc:'آزمایشی',amt:3000,method:'1101'})");
 check('expense categories',R('HanaManagement234.expenseGroups().reduce((a,x)=>a+x.amount,0)')===3000);
 let count=R('db.journal.length');
 R("HanaManagement234.countStock('"+p+"',85,'تست')"); 
 check('stocktake changes product quantity',R("prod('"+p+"').qty")===85);
 check('stocktake posts journal',R('db.journal.length')>count);
 check('stocktake audit recorded',R('db.management234.counts.length')===1);
 count=R('db.journal.length');
 R("HanaManagement234.countStock('"+p+"',85,'مطابق')");
 check('matching count has no new journal',R('db.journal.length')===count);
 check('balanced books',R('db.journal.every(j=>j.lines.reduce((a,l)=>a+(l.d||0)-(l.c||0),0)===0)'));
 check('legacy customer intact',R("db.customers[0].phone")==='09121111111');
 console.log('MANAGEMENT TESTS '+passed+' passed, '+failed+' failed');
 if(failed)process.exitCode=1;
})();