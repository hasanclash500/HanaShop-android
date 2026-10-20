process.on('unhandledRejection',e=>console.log('UNHANDLED',e&&e.message));
const base=(function(){const f=function(){};const p=new Proxy(f,{get:(t,k)=>{if(k===Symbol.toPrimitive)return()=>'';if(k==='then')return undefined;if(k==='dataset')return{};return p},set:()=>true,apply:()=>p});return p})();
const log=[];const V={innerHTML:'',querySelectorAll:()=>[],querySelector:s=>(/#(qpb|qsb)/.test(s)&&!log.some(h=>h.includes(s.slice(1))))?null:({insertAdjacentHTML:(w,h)=>log.push(h),set onclick(v){}}),insertAdjacentHTML:(w,h)=>log.push(h),set onclick(v){}};
global.__DOC=new Proxy({querySelector:s=>s==='#view'?V:{value:'',textContent:'',dataset:{}},documentElement:{dataset:{},style:{setProperty(){}}},body:base},{get:(t,k)=>k in t?t[k]:base});
const {boot}=require('./harness');const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ok=0,bad=0;const ck=(n,c,i='')=>{c?ok++:bad++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' → '+i))};
(async()=>{const A=boot(process.argv[2]);await sleep(60);const R=c=>A.run(c);R("ensureDefaults()");
 R(`mkProduct({name:'عطر نمونه',price:1000000,cost:600000,qty:1,min:2})`);R(`db.customers.push({id:'c1',name:'علی',phone:'0912'})`);
 for(const p of['dash','cust','stock','sale','more']){log.length=0;let e='';try{R(`R.${p}()`)}catch(x){e=x.message}ck('page '+p+' renders',!e&&V.innerHTML.length>50,e)}
 const src=require('fs').readFileSync(process.argv[2]||'app.js','utf8');ck('stock quick-entry hook exists',/stock\(\)\{if\(V\.querySelector\('#addP'\).*id=\\?"qpb/.test(src)||/id=\"qpb\"/.test(src));ck('sale quick-sale hook exists',/id=\"qsb\"/.test(src));
 console.log(`PAGES RESULT pass=${ok} fail=${bad}`)})();
