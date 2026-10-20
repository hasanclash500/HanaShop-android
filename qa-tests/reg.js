// Regression suite — usage: node reg.js <app file>
process.on('unhandledRejection',()=>{});
const SRC=process.argv[2]||'app.js';
const form={'#sd':'0','#spd':'','#sc':'','#sm':'1101'};
const base=(function(){const f=function(){};const p=new Proxy(f,{get:(t,k)=>{if(k===Symbol.toPrimitive)return()=>'';if(k==='then')return undefined;if(k==='dataset')return{};if(k==='classList')return{add(){},remove(){},toggle(){}};return p},set:()=>true,apply:()=>p});return p})();
global.__DOC=new Proxy({querySelector:s=>({value:form[s]??'',textContent:''}),documentElement:{dataset:{},style:{setProperty(){},removeProperty(){}}},body:base},{get:(t,k)=>k in t?t[k]:base});
const {boot}=require('./harness');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let pass=0,fail=0;const ck=(id,name,ok,info='')=>{(ok?pass++:fail++);console.log((ok?'PASS ':'FAIL ')+id+' '+name+(ok?'':'  → '+info))};
(async()=>{const A=boot(SRC);await sleep(50);const R=c=>A.run(c);
 R("ensureDefaults();render=function(){};showInv=function(){};modal=function(){}");
 R(`globalThis.inv=()=>{const tb=db.journal.reduce((a,j)=>{j.lines.forEach(l=>{a.d+=l.d||0;a.c+=l.c||0});return a},{d:0,c:0});
  return{tbD:tb.d,tbC:tb.c,j1104:bal('1104'),stock:db.products.reduce((s,p)=>s+p.qty*p.cost,0),j1103:bal('1103'),ar:db.customers.reduce((s,c)=>s+cDebt(c.id),0),j2101:-bal('2101'),ap:db.suppliers.reduce((s,x)=>s+supBal(x.id),0)}}`);
 const chk=(id,l)=>{const v=R('inv()');ck(id,l+': TB balanced + 1104=Σ(qty×cost) + AR + AP',v.tbD===v.tbC&&v.j1104===v.stock&&v.j1103===v.ar&&v.j2101===v.ap,JSON.stringify(v))};
 const T=(c)=>R(`(()=>{try{${c};return 'ACCEPTED'}catch(e){return 'rejected: '+e.message}})()`);
 const p1=R(`mkProduct({name:'عطر الف',price:1000000,cost:600000,qty:10,min:2})`),p2=R(`mkProduct({name:'عطر ب',price:500000,cost:300000,qty:5,min:1})`);
 R(`db.customers.push({id:'c1',name:'مشتری'});db.suppliers.push({id:'s1',name:'تأمین'})`);
 chk('S0','opening');
 R(`mkSale([{pid:'${p1}',n:2,price:1000000}],'',100000,1900000,'1101')`);chk('S1','cash sale+discount');
 R(`mkSale([{pid:'${p2}',n:3,price:500000}],'c1',0,500000,'1101')`);chk('S2','credit sale');
 R(`mkCheque({type:'in',party:'c1',no:'1',bank:'x',amt:400000,due:toJ()})`);R(`setCheque(db.cheques[0].id,'bad','1102')`);chk('S3','cheque in + bounce');
 ck('S3b','debt restored after bounce',R(`cDebt('c1')`)===1000000,R(`cDebt('c1')`));
 R(`mkBuy('${p1}',4,700000,'2101','s1')`);chk('S5','credit purchase (avg cost rounding)');
 R(`mkBuy('${p1}',7,333333,'1101','')`);chk('S5b','second purchase, awkward price');
 R(`mkReturn(db.sales[0].id,0,1,'1101','ok')`);chk('S4','return after cost changed');
 R(`mkAdjust('${p2}',9,'شمارش')`);chk('S5c','stock adjust up');
 R(`post(toJ(),'p',[{a:'2101',d:1000000,p:'s1'},{a:'1101',c:1000000}],'x1')`);chk('S6','supplier payment');
 const e=R(`mkExpense({cat:db.expCats[0].id,desc:'اجاره',amt:2000000,method:'2103'})`);R(`payExpense('${e}',500000,'1101')`);chk('S7','credit expense');
 const pl0=JSON.stringify(R(`plNums('')`));
 R(`(()=>{const e=toJ();const L=[];let net=0;db.accounts.filter(a=>'456'.includes(a[0][0])).forEach(a=>{const b=db.journal.reduce((s,j)=>s+(j.date<=e?j.lines.filter(l=>l.a===a[0]).reduce((x,l)=>x+(l.d||0)-(l.c||0),0):0),0);if(!b)return;L.push(b>0?{a:a[0],c:b}:{a:a[0],d:-b});net+=b});if(net>0)L.push({a:'3102',d:net});else if(net<0)L.push({a:'3102',c:-net});post(e,'close',L,'close')})()`);
 chk('S9','after closing entry');ck('S9b','P&L unchanged by closing entry',pl0===JSON.stringify(R(`plNums('')`)),pl0+' vs '+JSON.stringify(R(`plNums('')`)));
 const bs=R(`(()=>{const A=sumP('1','',''),Li=-sumP('2','',''),E=-sumP('3','',''),P=-(sumP('4','','')+sumP('5','','')+sumP('6','',''));return A===Li+E+P})()`);ck('S9c','balance sheet equation holds after close',bs===true);
 R(`db.journal=db.journal.filter(j=>j.ref!=='close')`);
 // negative stock buy
 const p3=R(`mkProduct({name:'عطر ج',price:900000,cost:500000,qty:2,min:0})`);R(`db.allowNegStock=true`);
 R(`mkSale([{pid:'${p3}',n:5,price:900000}],'',0,4500000,'1101')`);chk('N1','negative stock sale');
 ck('N2','buy that brings qty back to 0 keeps cost finite',T(`mkBuy('${p3}',3,550000,'1101','')`)==='ACCEPTED'&&Number.isFinite(R(`prod('${p3}').cost`)),R(`prod('${p3}').cost`));chk('N3','after buy to zero');
 R(`db.allowNegStock=false`);
 // blend
 R(`mkBlend({name:'ترکیب',price:2000000,out:3,ing:[{pid:'${p1}',qty:2},{pid:'${p2}',qty:1}],extra:1000,extraMethod:'1101'})`);chk('B1','blend');
 // double click
 const p4=R(`mkProduct({name:'عطر د',price:1000000,cost:600000,qty:10,min:1})`);R(`cart=[{pid:'${p4}',n:1,price:1000000}]`);
 const b=R('db.sales.length');const a1=R('finishSale()'),a2=R('finishSale()');await a1;await a2;await sleep(30);
 ck('D1','double click creates one invoice',R('db.sales.length')-b===1,'created '+(R('db.sales.length')-b));ck('D1b','stock reduced once',R(`prod('${p4}').qty`)===9,R(`prod('${p4}').qty`));
 // validation
 const rej=(id,l,c)=>{const r=T(c);ck(id,l,r.startsWith('rejected'),r)};
 rej('V1','mixed negative/positive lines',`mkSale([{pid:'${p4}',n:-1,price:1000000},{pid:'${p4}',n:3,price:1000000}],'',0,2000000,'1101')`);
 rej('V2','unknown payment account 9999',`mkSale([{pid:'${p4}',n:1,price:1000000}],'',0,1000000,'9999')`);
 rej('V3','payment account 1103',`mkSale([{pid:'${p4}',n:1,price:1000000}],'',0,1000000,'1103')`);
 rej('V4','fractional sale qty',`mkSale([{pid:'${p4}',n:1.5,price:1000000}],'',0,1500000,'1101')`);
 rej('V5','fractional buy qty',`mkBuy('${p4}',2.5,100000,'1101','')`);
 rej('V6','expense to 1103',`mkExpense({cat:db.expCats[0].id,desc:'x',amt:100,method:'1103'})`);
 rej('V7','post negative amounts',`post(toJ(),'x',[{a:'1101',d:-5},{a:'4101',c:-5}],'t')`);
 rej('V8','post NaN amount',`post(toJ(),'x',[{a:'1101',d:NaN},{a:'4101',c:NaN}],'t')`);
 const um=T(`mkSale([{pid:'nope',n:1,price:5}],'',0,5,'1101')`);ck('V9','unknown product gives a clear Persian message',um.startsWith('rejected')&&!/undefined/.test(um),um);
 ck('V10','zero-price (gift) line still allowed',T(`mkSale([{pid:'${p4}',n:1,price:0}],'',0,0,'1101')`)==='ACCEPTED');
 chk('FIN','after validation tests (no leaked state)');
 ck('F1','close-today blocked in UI handler',/if\(e>=toJ\(\)\)return \$\('#e'\)/.test(require('fs').readFileSync(SRC,'utf8')));
 console.log(`\nRESULT (${SRC}) pass=${pass} fail=${fail}`);process.exit(fail?1:0)})();
