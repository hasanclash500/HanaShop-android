// New fractional inventory regression tests, using only synthetic data.
const fs=require('fs'),{boot}=require('./harness');
const A=boot('app.js'),R=s=>A.run(s);
R(fs.readFileSync('business.js','utf8'));
R(fs.readFileSync('phase1.js','utf8'));
R(fs.readFileSync('management234.js','utf8'));
R('ensureDefaults();render=function(){};modal=function(){};showInv=function(){}');
let pass=0,fail=0;
function check(n,x){x?pass++:fail++;console.log((x?'PASS ':'FAIL ')+n)}
function rejects(t){try{R(t);return false}catch(e){return true}}
const audit=()=>R("db.journal.every(j=>j.lines.reduce((a,l)=>a+(l.d||0)-(l.c||0),0)===0)&&bal('1104')===db.products.reduce((a,p)=>a+HanaPhase1.stockValue(p),0)");
(async()=>{
 check('no database schema replacement',R('db.version===1'));
 check('Persian decimal parsed',R("HanaPhase1.qtyInput('۵۰٫۳۷۵')")===50.375);
 check('overprecision rejected',rejects("HanaPhase1.q(0.0015)"));
 const id=R("mkProduct({name:'کرید تست',unit:'گرم',qty:70,cost:42000,price:126000,min:5})");
 check('opening balance',audit());
 R("mkBuy('"+id+"',50.375,50000,'1101','')");
 check('fractional stock addition',R("prod('"+id+"').qty")===120.375);
 check('exact stock valuation',R("prod('"+id+"').stockValue")===5458750);
 check('accounting balanced after purchase',audit());
 R("mkProdEdit('"+id+"',{name:'کرید تست',unit:'گرم',price:140000,min:5})");
 check('new selling price saved',R("prod('"+id+"').price")===140000);
 const invoice=R("mkSale([{pid:'"+id+"',n:0.375,price:126000}], '',0,47250,'1101')");
 check('decimal sale records revenue',R("db.sales.at(-1).total")===47250);
 check('decimal sale retains COGS',R('Number.isSafeInteger(db.sales.at(-1).lines[0].cogs)'));
 check('stock after sale',R("prod('"+id+"').qty")===120);
 check('ledger and inventory match after sale',audit());
 R("mkReturn('"+invoice+"',0,0.125,'1101','ok')");
 check('decimal return restores stock',R("prod('"+id+"').qty")===120.125);
 check('ledger matches after return',audit());
 R("mkAdjust('"+id+"',120.1,'شمارش')");
 check('decimal stocktake',R("prod('"+id+"').qty")===120.1);
 check('stocktake balanced',audit());
 check('overselling blocked',rejects("mkSale([{pid:'"+id+"',n:999.9,price:1000}],'',0,999900,'1101')"));
 check('stocktake on management layer works',R("HanaManagement234.countStock('"+id+"',120.125,'تست').actual")===120.125);
 check('management fractional stocktake ledger balance',audit());
 check('reports use correct stockValue',R('HanaManagement234.kpis().stockValue')===R("prod('"+id+"').stockValue"));
 console.log('PHASE 1 TESTS '+pass+' passed, '+fail+' failed');
 if(fail)process.exitCode=1;
})();