// QA harness: loads app.js in a vm with stub DOM + in-memory IndexedDB. Uses synthetic data only.
const vm=require('vm'),fs=require('fs');
function stub(){const f=function(){};const p=new Proxy(f,{get:(t,k)=>{if(k===Symbol.toPrimitive)return()=>'';if(k==='value'||k==='textContent'||k==='innerHTML'||k==='className')return'';if(k==='length')return 0;if(k==='checked')return false;if(k==='dataset')return{};if(k==='classList')return{add(){},remove(){},toggle(){},contains(){return false}};if(k==='style')return{setProperty(){}};if(k==='then')return undefined;return p},set:()=>true,apply:()=>p,construct:()=>p});return p}
function fakeIDB(){const store={};return{open(){const r={};setTimeout(()=>{const db={createObjectStore(){},transaction(){const t={};t.objectStore=()=>({get(k){const q={};setTimeout(()=>{q.result=store[k];q.onsuccess&&q.onsuccess()});return q},put(v,k){store[k]=v;setTimeout(()=>t.oncomplete&&t.oncomplete())}});return t}};r.result=db;r.onupgradeneeded&&r.onupgradeneeded();r.onsuccess&&r.onsuccess()});return r},_store:store}}
function boot(src='app.orig.js'){const toasts=[];const doc=(global.__DOC||stub());
 const ctx={console,setTimeout,clearTimeout,Date,Math,JSON,Promise,Blob:function(){},URL:{createObjectURL(){return''},revokeObjectURL(){}},FileReader:function(){},indexedDB:fakeIDB(),document:doc,window:{},navigator:{},confirm:()=>true,alert(){},location:{},localStorage:{getItem(){return null},setItem(){}},requestAnimationFrame:f=>f(),addEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}})};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(src,'utf8'),ctx,{filename:src});
 ctx.__toasts=toasts;vm.runInContext("toast=function(m){__toasts.push(String(m))}",ctx);
 return{run:c=>vm.runInContext(c,ctx),ctx,toasts};}
module.exports={boot};
