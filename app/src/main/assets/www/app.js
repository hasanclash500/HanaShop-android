'use strict';
/* ===== ابزارها: ارقام، تومان، تاریخ جلالی (الگوریتم jalaali-js) ===== */
const FA='۰۱۲۳۴۵۶۷۸۹',AR='٠١٢٣٤٥٦٧٨٩';
const en=s=>String(s??'').replace(/[۰-۹]/g,c=>FA.indexOf(c)).replace(/[٠-٩]/g,c=>AR.indexOf(c));
const num=s=>{const n=parseInt(en(s).replace(/[,،٬\s]/g,''),10);return isNaN(n)?0:n};
const fa=s=>String(s).replace(/\d/g,d=>FA[d]);
const T=n=>fa((n<0?'-':'')+Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+$)/g,','))+' تومان';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const div=(a,b)=>~~(a/b),mod=(a,b)=>a-~~(a/b)*b;
const BR=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
function jalCal(jy){let bl=BR.length,gy=jy+621,leapJ=-14,jp=BR[0],jm,jump,leap,leapG,march,n;
 for(let i=1;i<bl;i++){jm=BR[i];jump=jm-jp;if(jy<jm)break;leapJ+=div(jump,33)*8+div(mod(jump,33),4);jp=jm}
 n=jy-jp;leapJ+=div(n,4)*1+0;leapJ=leapJ-0;leapJ+=0;
 leapJ=-14;jp=BR[0];for(let i=1;i<bl;i++){jm=BR[i];jump=jm-jp;if(jy<jm)break;leapJ+=div(jump,33)*8+div(mod(jump,33),4);jp=jm}
 n=jy-jp;leapJ+=div(n,33)*8+div(mod(n,33)+3,4);if(mod(jump,33)===4&&jump-n===4)leapJ+=1;
 leapG=div(gy,4)-div((div(gy,100)+1)*3,4)-150;march=20+leapJ-leapG;
 if(jump-n<6)n=n-jump+div(jump+4,33)*33;leap=mod(mod(n+1,33)-1,4);if(leap===-1)leap=4;return{leap,gy,march}}
const g2d=(gy,gm,gd)=>{let d=div((gy+div(gm-8,6)+100100)*1461,4)+div(153*mod(gm+9,12)+2,5)+gd-34840408;return d-div(div(gy+100100+div(gm-8,6),100)*3,4)+752};
const d2g=jdn=>{let j=4*jdn+139361631;j+=div(div(4*jdn+183187720,146097)*3,4)*4-3908;const i=div(mod(j,1461),4)*5+308;return{gd:div(mod(i,153),5)+1,gm:mod(div(i,153),12)+1,gy:div(j,1461)-100100+div(8-mod(div(i,153),12)-1+12,12)*0+div(8-(mod(div(i,153),12)+1),6)}};
const j2d=(jy,jm,jd)=>{const r=jalCal(jy);return g2d(r.gy,3,r.march)+(jm-1)*31-div(jm,7)*(jm-7)+jd-1};
const d2j=jdn=>{const gy=d2g(jdn).gy;let jy=gy-621,r=jalCal(jy),k;const j1=g2d(r.gy,3,r.march);k=jdn-j1;
 if(k>=0){if(k<=185)return{jy,jm:1+div(k,31),jd:mod(k,31)+1};k-=186}else{jy--;k+=179;if(r.leap===1)k++}
 return{jy,jm:7+div(k,30),jd:mod(k,30)+1}};
const toJ=(d=new Date())=>{const o=d2j(g2d(d.getFullYear(),d.getMonth()+1,d.getDate()));return o.jy+'/'+String(o.jm).padStart(2,'0')+'/'+String(o.jd).padStart(2,'0')};
const jLeap=y=>jalCal(y).leap===0;
function validJ(s){s=en(s);const m=/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(s);if(!m)return false;const[y,mo,d]=[+m[1],+m[2],+m[3]];
 return mo>=1&&mo<=12&&d>=1&&d<=(mo<=6?31:mo<=11?30:(jLeap(y)?30:29))}
const normJ=s=>{s=en(s).trim();const m=/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(s);return m?m[1]+'/'+m[2].padStart(2,'0')+'/'+m[3].padStart(2,'0'):s};
const addDays=(js,n)=>{const[y,m,d]=js.split('/').map(Number);const g=d2g(j2d(y,m,d)+n);return toJ(new Date(g.gy,g.gm-1,g.gd))};
const normPhone=p=>{p=en(p).replace(/[^\d]/g,'');if(/^9\d{9}$/.test(p))p='0'+p;if(/^989\d{9}$/.test(p))p='0'+p.slice(2);return /^09\d{9}$/.test(p)?p:''};
/* ===== پایگاه داده: IndexedDB (پایدار) + نسخهٔ حافظه، ذخیره با تراکنش ===== */
const VER=1;
const blank=()=>({version:VER,savedAt:0,shop:{name:'گالری عطر حنا',owner:'',phone:'09352161699',addr:'',footer:'از خرید شما سپاسگزاریم'},
 customers:[],products:[],sales:[],purchases:[],suppliers:[],expenses:[],payments:[],reminders:[],journal:[],points:[],
 accounts:[['1101','صندوق'],['1102','بانک'],['1103','حساب‌های دریافتنی'],['1104','موجودی کالا'],['2101','حساب‌های پرداختنی'],['3101','سرمایه'],['4101','فروش کالا'],['4102','تخفیف فروش'],['5101','بهای تمام‌شده کالای فروش‌رفته'],['6101','هزینه‌های عملیاتی'],['3102','سود و زیان انباشته']],lockDate:'',
 loyalty:{perThousand:1,levels:[['برنز',0],['نقره‌ای',500],['طلایی',1500],['پلاتینیوم',3000]]},
 tpl:{birthday:'{name} عزیز، تولدت مبارک! 🎊 هدیه‌ای از طرف {storeName} منتظر توست.',thanks:'{name} عزیز، ممنون از خرید شما از {storeName}.',repurchase:'{name} عزیز، اگر عطر خریداری‌شده در {purchaseDate} تمام شده، {storeName} آماده‌ی پذیرایی است.',bulk:'سلام {name} عزیز، پیام ویژه از {storeName}.'},
 theme:'light',allowNegStock:false,lastBackup:0});
let db=blank();
/* Legacy CRM records used numeric customer IDs, but DOM and select values are strings.
 * Convert identities AND known foreign keys together, never names/phones/ledger amounts.
 * Operates on a detached clone and refuses ambiguous numeric/string ID collisions. */
function canonicalCustomerIds(source){
 const data=JSON.parse(JSON.stringify(source)),seen=new Set();
 if(!Array.isArray(data.customers))return{data,changed:false};
 const key=v=>typeof v==='number'&&Number.isSafeInteger(v)?String(v):v;
 for(const c of data.customers){
  if(!c||!(typeof c.id==='string'||Number.isSafeInteger(c.id))||c.id==='')
   throw new Error('شناسه مشتری در پشتیبان نامعتبر است.');
  const k=key(c.id);
  if(seen.has(k))throw new Error('شناسه مشتری تکراری/مبهم است؛ مهاجرت خودکار متوقف شد.');
  seen.add(k);
 }
 let changed=false;
 const change=(row,field)=>{
  if(row&&typeof row[field]==='number'&&Number.isSafeInteger(row[field])){
   row[field]=String(row[field]);changed=true
  }
 };
 data.customers.forEach(c=>change(c,'id'));
 for(const field of ['sales','payments','points','reminders','comms']){
  if(Array.isArray(data[field]))data[field].forEach(r=>change(r,'cid'));
 }
 // Campaign recipients may also refer to customers from legacy imports.
 if(Array.isArray(data.campaigns))data.campaigns.forEach(c=>{
  if(Array.isArray(c.recips))c.recips.forEach(r=>change(r,'cid'))
 });
 if(Array.isArray(data.cheques))data.cheques.forEach(c=>{
  if(seen.has(key(c.party)))change(c,'party');
 });
 return{data,changed};
}
const customerIdEqual=(a,b)=>a!==null&&a!==undefined&&b!==null&&b!==undefined&&String(a)===String(b);
const IDB=()=>new Promise((res,rej)=>{const r=indexedDB.open('shopdb',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function load(){try{const d=await IDB();const v=await new Promise((res,rej)=>{const q=d.transaction('kv').objectStore('kv').get('db');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});if(v){
  const fix=canonicalCustomerIds(v);
  if(fix.changed){
   // Atomic safety snapshot + upgraded DB: if either write fails, neither applies.
   await new Promise((res,rej)=>{
    const t=d.transaction('kv','readwrite');
    const st=t.objectStore('kv');
    st.put(v,'pre-customer-id-migration-v1');
    st.put(fix.data,'db');
    t.oncomplete=res;t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)
   });
  }
  db=Object.assign(blank(),fix.data);
  if(!db.accounts.some(a=>a[0]==='3102'))db.accounts.push(['3102','سود و زیان انباشته'])
 }}catch(e){toast('خطا در مهاجرت یا خواندن پایگاه داده: '+e.message)}}
async function save(){db.savedAt=Date.now();try{const d=await IDB();await new Promise((res,rej)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(JSON.parse(JSON.stringify(db)),'db');t.oncomplete=res;t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)});return true}catch(e){toast('ذخیره ناموفق بود! '+e.message);return false}}
/* اجرای اتمی: روی نسخهٔ کپی کار می‌کند؛ در صورت خطا هیچ تغییری باقی نمی‌ماند */
let txBusy=false;
async function tx(fn){if(txBusy)return false;txBusy=true;const snap=JSON.stringify(db);try{fn();db.dirty=(db.dirty||0)+1;if(!await save())throw new Error('ذخیره نشد');try{syncPhoneAlerts()}catch(e){console.warn('Phone notifications sync:',e)}return true}catch(e){db=JSON.parse(snap);toast(e.message);return false}finally{txBusy=false}}
/* ===== هستهٔ حسابداری دوطرفه ===== */
function post(date,desc,lines,ref){if(db.lockDate&&date<=db.lockDate)throw new Error('دوره مالی تا '+db.lockDate+' بسته است.');if(!Array.isArray(lines)||!lines.length)throw new Error('سند حسابداری خالی است.');
 for(const l of lines){if(!l||typeof l.a!=='string'||!l.a)throw new Error('حساب سند نامعتبر است.');for(const k of ['d','c'])if(l[k]!==undefined&&(!Number.isSafeInteger(l[k])||l[k]<0))throw new Error('مبلغ سند باید عدد صحیح و غیرمنفی باشد.')}
 const d=lines.reduce((s,l)=>s+(l.d||0),0),c=lines.reduce((s,l)=>s+(l.c||0),0);
 if(d!==c)throw new Error('سند حسابداری متوازن نیست');db.journal.push({id:uid(),no:db.journal.length+1,date,desc,lines,ref,t:Date.now()})}
const balP=(code,from)=>db.journal.reduce((s,j)=>s+(from&&j.date<from?0:j.lines.filter(l=>l.a===code).reduce((x,l)=>x+(l.d||0)-(l.c||0),0)),0);
const bal=code=>db.journal.reduce((s,j)=>s+j.lines.filter(l=>l.a===code).reduce((x,l)=>x+(l.d||0)-(l.c||0),0),0);
const accName=c=>(db.accounts.find(a=>a[0]===c)||[c,c])[1];
/* ===== مشتری ===== */
const cust=id=>db.customers.find(c=>customerIdEqual(c.id,id)),prod=id=>db.products.find(p=>p.id===id);
const cSales=id=>db.sales.filter(s=>customerIdEqual(s.cid,id)&&s.status!=='cancel');
const cDebt=id=>cSales(id).reduce((s,x)=>s+x.total-x.paid,0);
const cPoints=id=>db.points.filter(p=>customerIdEqual(p.cid,id)).reduce((s,p)=>s+p.n,0);
const level=pt=>db.loyalty.levels.slice().reverse().find(l=>pt>=l[1])[0];
/* ===== رابط ===== */
const $=s=>document.querySelector(s),V=$('#view');let tab='dash',q='';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',3200)}
const close=()=>$('#dlg').close();
const TABS=[['dash','داشبورد'],['sale','فروش'],['cust','مشتریان'],['stock','کالاها'],['more','بیشتر']];
function nav(){$('#nav').innerHTML=TABS.map(t=>`<button class="${(tab===t[0]||(t[0]==='more'&&['sec','set','task','cal'].includes(tab)))?'on':''}" data-t="${t[0]}">${t[1]}</button>`).join('');
 $('#nav').onclick=e=>{if(e.target.dataset.t){tab=e.target.dataset.t;q='';render()}};$('#shopName').textContent=db.shop.name}
const R={};
R.dash=()=>{const today=toJ(),mon=today.slice(0,7),ok=db.sales.filter(s=>s.status!=='cancel');
 const sum=f=>ok.filter(f).reduce((s,x)=>s+x.total,0);
 const stockVal=db.products.reduce((s,p)=>s+(globalThis.HanaPhase1?HanaPhase1.stockValue(p):p.qty*p.cost),0),low=db.products.filter(p=>p.qty<=p.min);
 const bd=db.customers.filter(c=>c.birth&&normJ(c.birth).slice(5)===today.slice(5));
 const rem=db.reminders.filter(r=>!r.done&&r.date<=today);
 const f=db.lockDate?addDays(db.lockDate,1):'',rev=-balP('4101',f)-balP('4102',f),cogs=balP('5101',f),exp=sumP('6',f,'');
 V.innerHTML=`<div class="grid">
 <div class="card"><div class="k">فروش امروز</div><div class="v">${T(sum(s=>s.date===today))}</div></div>
 <div class="card"><div class="k">فروش این ماه</div><div class="v">${T(sum(s=>s.date.startsWith(mon)))}</div></div>
 <div class="card"><div class="k">صندوق</div><div class="v">${T(bal('1101'))}</div></div>
 <div class="card"><div class="k">مطالبات</div><div class="v">${T(bal('1103'))}</div></div>
 <div class="card"><div class="k">بدهی به تأمین‌کنندگان</div><div class="v">${T(-bal('2101'))}</div></div>
 <div class="card"><div class="k">ارزش موجودی</div><div class="v">${T(stockVal)}</div></div>
 <div class="card"><div class="k">سود ناخالص</div><div class="v ${rev-cogs<0?'neg':'pos'}">${T(rev-cogs)}</div></div>
 <div class="card"><div class="k">سود خالص</div><div class="v ${rev-cogs-exp<0?'neg':'pos'}">${T(rev-cogs-exp)}</div></div></div>
 <div class="card"><b>امروز ${today.replace(/\d/g,d=>FA[d])}</b>
 <div class="row"><span>تولدهای امروز</span><b>${fa(bd.length)}</b></div>
 <div class="row"><span>یادآوری‌های امروز و عقب‌افتاده</span><b>${fa(rem.length)}</b></div>
 <div class="row"><span>کالاهای کم‌موجود</span><b>${fa(low.length)}</b></div><div class="row"><span>چک‌های سررسیدشده یا تا ۷ روز آینده</span><b>${fa((db.cheques||[]).filter(c=>c.status==='open'&&c.due<=addDays(today,7)).length)}</b></div>
 <div class="row"><span>مشتریان</span><b>${fa(db.customers.length)}</b></div></div>
 ${Date.now()-db.lastBackup>7*864e5?'<div class="card err">بیش از ۷ روز از آخرین پشتیبان‌گیری گذشته است. از «بیشتر» پشتیبان بگیرید.</div>':''}`};
/* --- مشتریان --- */
R.cust=()=>{const list=db.customers.filter(c=>!q||(c.name+c.phone).includes(en(q)));
 V.innerHTML=`<input id="q" placeholder="جستجوی نام یا موبایل" value="${esc(q)}"><button class="b" id="addC">+ مشتری جدید</button><button class="b s" id="mg">ادغام تکراری‌ها</button>
 ${list.length?list.map(c=>`<div class="card" data-id="${c.id}"><b>${esc(c.name)}</b> <span class="k">${esc(c.phone)}</span>
 <div class="k">سطح: ${level(cPoints(c.id))} · امتیاز: ${fa(cPoints(c.id))} · بدهی: ${T(cDebt(c.id))}</div>
 <button class="b s" data-act="msg">پیام</button><button class="b s" data-act="edit">ویرایش</button><button class="b s" data-act="p360">پرونده</button></div>`).join(''):'<div class="card k">مشتری‌ای ثبت نشده است.</div>'}`;
 $('#q').oninput=e=>{q=e.target.value;const p=e.target.selectionStart;R.cust();const i=$('#q');i.focus();i.setSelectionRange(p,p)};
 $('#addC').onclick=()=>custForm();$('#mg').onclick=mergeDlg;
 V.onclick=e=>{const a=e.target.dataset.act,id=e.target.closest('[data-id]')?.dataset.id;if(a==='edit')custForm(id);if(a==='msg')msgDlg(id);if(a==='p360')p360(id)}};
function custForm(id){const c=cust(id)||{};const d=modal(`<h3>${id?'ویرایش':'مشتری جدید'}</h3>
 <label>نام</label><input id="fn" value="${esc(c.name)}"><label>موبایل</label><input id="fp" inputmode="numeric" value="${esc(c.phone)}">
 <label>تاریخ تولد شمسی (۱۳۷۰/۰۵/۱۲)</label><input id="fb" class="jd" readonly data-y="1370" placeholder="انتخاب تاریخ" value="${esc(c.birth)}"><label>یادداشت</label><textarea id="fnote">${esc(c.note)}</textarea>
 <label><input type="checkbox" id="fpr" style="width:auto;min-height:0" ${c.promo!==false?'checked':''}> اجازه دریافت پیام تبلیغاتی</label>
 <div class="err" id="fe"></div><button class="b" id="ok">ذخیره</button><button class="b s" id="no">لغو</button>`);
 $('#no').onclick=close;$('#ok').onclick=async()=>{const name=$('#fn').value.trim(),ph=normPhone($('#fp').value),b=$('#fb').value.trim(),E=$('#fe');
 if(!name)return E.textContent='نام الزامی است.';if(!ph)return E.textContent='شمارهٔ موبایل معتبر نیست.';
 if(b&&!validJ(b))return E.textContent='تاریخ تولد معتبر نیست.';
 const dup=db.customers.find(x=>x.phone===ph&&!customerIdEqual(x.id,id));if(dup&&!confirm('این شماره برای «'+dup.name+'» ثبت شده است. باز هم ذخیره شود؟'))return;
 if(await tx(()=>{const o=id?cust(id):{id:uid(),created:toJ()};Object.assign(o,{name,phone:ph,birth:b?normJ(b):'',note:$('#fnote').value,promo:$('#fpr').checked});if(!id)db.customers.push(o)})){close();toast('ذخیره شد');render()}}}
/* --- کالا --- */
R.stock=()=>{const list=db.products.filter(p=>!q||p.name.includes(q)||(p.barcode||'').includes(en(q)));
 V.innerHTML=`<input id="q" placeholder="جستجوی نام یا بارکد" value="${esc(q)}"><button class="b" id="addP">+ کالا</button><button class="b s" id="addS">ورود موجودی (خرید)</button>
 ${list.length?list.map(p=>`<div class="card"><b>${esc(p.name)}</b> <span class="k">${esc(p.brand||'')}</span><div class="k">موجودی: ${fa(p.qty)} ${esc(p.unit)} · خرید: ${T(p.cost)} · فروش: ${T(p.price)}</div>${p.qty<=p.min?'<div class="err">کم‌موجود</div>':''}</div>`).join(''):'<div class="card k">کالایی ثبت نشده است.</div>'}`;
 $('#q').oninput=e=>{q=e.target.value;const p=e.target.selectionStart;R.stock();const i=$('#q');i.focus();i.setSelectionRange(p,p)};
 $('#addP').onclick=prodForm;$('#addS').onclick=buyForm};
/* --- فروش --- */
let cart=[];
R.sale=()=>{const tot=cart.reduce((s,l)=>s+l.n*l.price,0);
 V.innerHTML=`<div class="card"><label>مشتری</label><select id="sc"><option value="">— مشتری گذری —</option>${db.customers.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
 <label>کالا</label><select id="sp">${db.products.map(p=>`<option value="${p.id}">${esc(p.name)} (${fa(p.qty)})</option>`).join('')}</select>
 <label>تعداد</label><input id="sn" value="1" inputmode="numeric"><button class="b" id="add">افزودن به سبد</button></div>
 <div class="card">${cart.length?cart.map((l,i)=>`<div class="row"><span>${esc(prod(l.pid).name)} × ${fa(l.n)}</span><span>${T(l.n*l.price)} <button class="b d" data-i="${i}" style="margin:0;min-height:36px">حذف</button></span></div>`).join(''):'<span class="k">سبد خالی است.</span>'}
 <label>تخفیف (تومان)</label><input id="sd" value="0" inputmode="numeric"><label>مبلغ پرداختی</label><input id="spd" inputmode="numeric" placeholder="خالی = تسویه کامل">
 <label>روش پرداخت</label><select id="sm"><option value="1101">نقد (صندوق)</option><option value="1102">کارت‌خوان/بانک</option></select>
 <div class="v">جمع: ${T(tot)}</div><div class="err" id="e"></div><button class="b" id="fin">ثبت فاکتور</button></div>`;
 $('#add').onclick=()=>{const p=prod($('#sp').value),n=num($('#sn').value);if(!p||n<=0)return;cart.push({pid:p.id,n,price:p.price});R.sale()};
 V.onclick=e=>{if(e.target.dataset.i!==undefined){cart.splice(+e.target.dataset.i,1);R.sale()}};
 $('#fin').onclick=finishSale};
/* --- بیشتر --- */
R.more=()=>{V.innerHTML=`<div class="card"><b>امکانات</b>
 <button class="b" data-g="exp">+ هزینه</button><button class="b" data-g="rec">دریافت از مشتری</button><button class="b" data-g="rem">+ یادآوری</button><button class="b s" data-g="inv">فاکتورها</button><button class="b s" data-g="rep">گزارش‌ها و دفاتر</button><button class="b s" data-g="sup">تأمین‌کنندگان</button><button class="b s" data-g="rem2">یادآوری‌ها</button><button class="b s" data-g="csv">CSV</button><button class="b s" data-g="close">بستن دوره مالی</button><button class="b s" data-g="cal">تقویم</button><button class="b s" data-g="tpl">قالب پیام‌ها</button><button class="b s" data-g="acc">حسابداری</button><button class="b s" data-g="expl">هزینه‌ها</button><button class="b s" data-g="camp">ارسال گروهی</button><button class="b s" data-g="json">ذخیره / JSON</button><button class="b d" data-g="clear">پاک کردن اطلاعات</button></div>
 <div class="card"><b>تنظیمات فروشگاه</b><label>نام فروشگاه</label><input id="sn1" value="${esc(db.shop.name)}"><label>تلفن</label><input id="sp1" value="${esc(db.shop.phone)}">
 <label>متن پایان فاکتور</label><input id="sf1" value="${esc(db.shop.footer)}"><label>تم</label><select id="st"><option value="light">روشن</option><option value="dark">تاریک</option></select>
 <label><input type="checkbox" id="neg" style="width:auto;min-height:0" ${db.allowNegStock?'checked':''}> اجازهٔ موجودی منفی</label><button class="b" id="ss">ذخیره تنظیمات</button></div>
 <div class="card"><b>پشتیبان‌گیری و ورود اطلاعات</b><button class="b" id="bk">پشتیبان JSON</button><button class="b s" id="rs">بازیابی از JSON</button><button class="b s" id="old">ورود از فایل CRM قدیمی</button>
 <input type="file" id="fl" accept=".json,application/json" hidden><div class="k">اطلاعات فقط روی همین دستگاه ذخیره می‌شود؛ بدون پشتیبان، با پاک شدن داده‌های مرورگر از بین می‌رود.</div></div>`;
 $('#st').value=db.theme;
 $('#ss').onclick=async()=>{if(await tx(()=>{db.shop.name=$('#sn1').value.trim()||db.shop.name;db.shop.phone=$('#sp1').value;db.shop.footer=$('#sf1').value;db.theme=$('#st').value;db.allowNegStock=$('#neg').checked})){toast('ذخیره شد');render()}};
 $('#bk').onclick=backup;let mode='';$('#rs').onclick=()=>{mode='restore';$('#fl').click()};$('#old').onclick=()=>{mode='old';$('#fl').click()};
 $('#fl').onchange=e=>readFile(e.target.files[0],mode);
 V.onclick=e=>{const g=e.target.dataset.g;if(g==='exp')expForm();if(g==='rec')recForm();if(g==='rem')remForm();if(g==='inv')invList();if(g==='rep')report();if(G[g])G[g]()}};
function dl(name,txt){return dlf(name,txt,'application/json')}
async function backup(){const n=(db.shop.name+'_'+toJ().replace(/\//g,'-')+'_'+new Date().toTimeString().slice(0,5).replace(':','-')+'.json');
 try{await bkWriter(n,JSON.stringify(db));if(!await tx(()=>{db.lastBackup=Date.now();db.dirty=-1}))return false;toast('فایل پشتیبان با موفقیت ذخیره شد');render();return true}
 catch(e){toast('خطا در ذخیرهٔ پشتیبان: '+e.message);return false}}
function verifyFullBackup(j){if(!j||typeof j!=='object'||!Number.isInteger(j.version)||j.version>VER)return 'نسخهٔ فایل ناشناخته یا جدیدتر از برنامه است.';
 const arrays=['customers','products','sales','purchases','suppliers','expenses','payments','reminders','journal','points'];
 for(const k of arrays)if(!Array.isArray(j[k]))return 'بخش '+k+' در فایل پشتیبان ناقص یا نامعتبر است.';
 for(const row of j.journal){if(!row||!Array.isArray(row.lines)||!row.lines.length)return 'سند حسابداری ناقص در فایل است.';
  let debit=0,credit=0;for(const l of row.lines){if(!l||typeof l.a!=='string'||!l.a||!Number.isSafeInteger(l.d||0)||!Number.isSafeInteger(l.c||0)||(l.d||0)<0||(l.c||0)<0)return 'مبلغ یا حساب سند نامعتبر در فایل است.';debit+=l.d||0;credit+=l.c||0}
  if(!Number.isSafeInteger(debit)||debit!==credit)return 'سند حسابداری نامتوازن در فایل پشتیبان است.'}
 return ''}
async function saveSafetyCopy(name){await bkWriter(name,JSON.stringify(db))}

/* ===== مهاجرت از CRM قدیمی (v5 / v5.1) — تابع خالص؛ فقط روی db می‌نویسد و گزارش برمی‌گرداند ===== */
function planOld(j){const c=j.customers||[],ph=x=>normPhone(x.phone||x.phoneRaw||'');
 const seen={};c.forEach(x=>{const p=ph(x);if(p)(seen[p]=seen[p]||[]).push(x)});
 const ids=new Set(db.customers.map(x=>x.id));
 const ps=c.flatMap(x=>(x.purchases||[]).map(p=>({...p,cid:x.id})));
 return{total:c.length,already:c.filter(x=>ids.has(x.id)).length,badPhone:c.filter(x=>!ph(x)).map(x=>x.name),
  dupGroups:Object.values(seen).filter(v=>v.length>1).length,purchases:ps.length,
  over:ps.filter(p=>(+p.balance||0)>(+p.amount||0)).length,debt:ps.reduce((s,p)=>s+Math.max(+p.balance||0,0),0),custDebt:c.reduce((s,x)=>s+(+x.balance||0),0),
  perfumes:(j.perfumes||[]).length,reminders:(j.reminders||[]).length,
  orphanRem:(j.reminders||[]).filter(r=>!c.some(x=>x.id===r.customerId)).length}}
function migrateOld(j){const rep=planOld(j);const have=new Set(db.customers.map(x=>x.id)),phs={};
 db.customers.forEach(x=>phs[x.phone]=(phs[x.phone]||0)+1);const skipped=[];let debt=0,stockVal=0;
 (j.customers||[]).forEach(o=>{const p=normPhone(o.phone||o.phoneRaw||'');
  if(!o.name||!p){skipped.push(o.name||'(بدون نام)');return}
  if(have.has(o.id))return;
  const dup=(phs[p]||0)>0;phs[p]=(phs[p]||0)+1;
  db.customers.push({id:o.id||uid(),name:o.name,phone:p,birth:o.birth?normJ(o.birth):'',note:o.notes||'',promo:true,created:toJ(),dupPhone:dup||undefined,legacy:true});
  (o.purchases||[]).forEach(u=>{const amt=+u.amount||0,bl=Math.max(+u.balance||0,0),tot=Math.max(amt,bl),paid=tot-bl;debt+=bl;
   db.sales.push({id:u.id||uid(),no:null,legacy:true,date:normJ(u.date||toJ()),time:'',cid:o.id,lines:[],desc:u.perfume||'',sub:tot,disc:+u.discount||0,total:tot,paid,anomaly:bl>amt||undefined,method:'',status:bl===0?'paid':paid>0?'part':'unpaid'})});
  const pt=+o.loyaltyPoints||0;if(pt>0)db.points.push({id:uid(),cid:o.id,n:pt,why:'مهاجرت از CRM قدیمی',ref:'legacy'})});
 (j.perfumes||[]).forEach(f=>{if(db.products.some(p=>p.id===f.id))return;const cost=+f.purchasePrice||0,q=+f.stock||0;stockVal+=q*cost;
  db.products.push({id:f.id||uid(),name:f.name,brand:f.brand||'',barcode:'',unit:f.unitType||'گرم',price:+f.basePrice||0,cost,qty:q,min:0,note:f.description||'',legacy:true})});
 const rids=new Set(db.reminders.map(r=>r.id));
 (j.reminders||[]).forEach(r=>{if(rids.has(r.id))return;const ok=(j.customers||[]).some(x=>x.id===r.customerId);
  db.reminders.push({id:r.id||uid(),cid:ok?r.customerId:'',cname:r.customerName||'',type:r.type==='refill'?'خرید مجدد':'خرید',title:r.description||'یادآوری',date:normJ(r.date||toJ()),prio:r.priority||1,done:!!(r.isCompleted||r.completed),legacy:true})});
 if(j.template)db.tpl.birthday=j.template;if(j.thankYouTemplate)db.tpl.thanks=j.thankYouTemplate;
 if(j.reminderTemplate)db.tpl.repurchase=j.reminderTemplate.replace(/\{date\}/g,'{purchaseDate}');if(j.bulkText)db.tpl.bulk=j.bulkText;
 /* مانده‌های افتتاحیه به‌صورت سند متوازن ثبت می‌شوند تا مطالبات و موجودی با حسابداری هماهنگ باشند */
 if(debt>0)post(toJ(),'مانده افتتاحیه مطالبات (مهاجرت)',[{a:'1103',d:debt},{a:'3101',c:debt}],'legacy');
 if(stockVal>0)post(toJ(),'موجودی افتتاحیه کالا (مهاجرت)',[{a:'1104',d:stockVal},{a:'3101',c:stockVal}],'legacy');
 const normalized=canonicalCustomerIds(db);if(normalized.changed)db=Object.assign(blank(),normalized.data);
 rep.skipped=skipped;return rep}
function readFile(f,mode){if(!f)return;const r=new FileReader();r.onerror=()=>toast('خواندن فایل ممکن نشد.');r.onload=async()=>{let j;try{j=JSON.parse(r.result)}catch{return toast('فایل JSON معتبر نیست.')}
 if(j&&j.kind==='partial')return importPartial(j);
 const isNew=!!j&&typeof j==='object'&&(Object.prototype.hasOwnProperty.call(j,'journal')||Object.prototype.hasOwnProperty.call(j,'shop')||Object.prototype.hasOwnProperty.call(j,'sales'));
 if(isNew){const err=verifyFullBackup(j);if(err)return toast('بازیابی متوقف شد: '+err);const bad=(j.sales||[]).filter(s=>s.cid&&!j.customers.some(c=>customerIdEqual(c.id,s.cid))).length;
  if(!confirm(`بازیابی کامل: ${j.customers.length} مشتری، ${(j.products||[]).length} کالا، ${(j.sales||[]).length} فاکتور، ${j.journal.length} سند.\n${bad?bad+' فاکتور به مشتری ناموجود اشاره دارد.\n':''}داده‌های فعلی جایگزین می‌شوند (نسخهٔ خودکار ذخیره می‌شود). ادامه؟`))return;
  try{await saveSafetyCopy('auto-before-restore.json')}catch(e){return toast('بازیابی لغو شد؛ نسخهٔ ایمنی ذخیره نشد: '+e.message)}
  return tx(()=>{db=Object.assign(blank(),canonicalCustomerIds(j).data)}).then(ok=>{if(ok){toast('بازیابی انجام شد');render()}else toast('بازیابی کامل نشد')})}
 if(!Array.isArray(j.customers))return toast('ساختار فایل شناخته نشد.');
 const p=planOld(j);
 const msg=`فایل CRM قدیمی (نسخه ${j.version||'؟'}):\n• ${p.total} مشتری (${p.already} قبلاً وارد شده)\n• ${p.purchases} خرید، ${p.perfumes} عطر، ${p.reminders} یادآوری\n• مانده بدهی خریدها: ${T(p.debt)}${p.over?`\n  ⚠ ${p.over} خرید دارای مانده بیشتر از مبلغ خرید است؛ مانده بدهی کامل ثبت می‌شود و خرید با علامت «ناهمخوان» نگه داشته می‌شود.`:''}${p.debt!==p.custDebt?`\n  ⚠ جمع مانده‌های ثبت‌شده روی مشتری‌ها ${T(p.custDebt)} است.`:''}\n• ${p.dupGroups} گروه مشتری با شمارهٔ تکراری (هیچ‌کدام حذف یا ادغام نمی‌شوند؛ فقط نشان‌گذاری می‌شوند)\n• ${p.orphanRem} یادآوری بدون مشتری مرتبط (با نام ذخیره‌شده وارد می‌شوند)\n• شمارهٔ نامعتبر: ${p.badPhone.length}\nادامه می‌دهید؟ (قبل از ورود یک نسخهٔ پشتیبان دانلود می‌شود)`;
 if(!confirm(msg))return;try{await saveSafetyCopy('auto-before-import.json')}catch(e){return toast('ورود لغو شد؛ نسخهٔ ایمنی ذخیره نشد: '+e.message)}
 let rep;tx(()=>{rep=migrateOld(j)}).then(ok=>{if(!ok)return;alert(`مهاجرت انجام شد.\nمشتری: ${db.customers.length}\nمطالبات افتتاحیه: ${T(bal('1103'))}\nرد شده (بدون شمارهٔ معتبر): ${rep.skipped.length}${rep.skipped.length?'\n'+rep.skipped.join('، '):''}`);render()})};r.readAsText(f)}
function recForm(){const ds=db.customers.filter(c=>cDebt(c.id)>0);if(!ds.length)return toast('مشتری بدهکاری وجود ندارد.');
 modal(`<h3>دریافت از مشتری</h3><label>مشتری</label><select id="c">${ds.map(c=>`<option value="${c.id}">${esc(c.name)} — ${T(cDebt(c.id))}</option>`).join('')}</select><label>مبلغ</label><input id="a" inputmode="numeric"><label>به</label><select id="m"><option value="1101">صندوق</option><option value="1102">بانک</option></select><div class="err" id="e"></div><button class="b" id="ok">ثبت</button><button class="b s" id="no">لغو</button>`);$('#no').onclick=close;
 $('#ok').onclick=async()=>{let a=num($('#a').value);const cid=$('#c').value;if(a<=0||a>cDebt(cid))return $('#e').textContent='مبلغ باید بین ۱ و مانده بدهی باشد.';
 if(await tx(()=>{const id=uid(),amt=a;cSales(cid).filter(s=>s.total>s.paid).forEach(s=>{const t=Math.min(a,s.total-s.paid);s.paid+=t;a-=t;s.status=s.paid>=s.total?'paid':'part'});
  db.payments.push({id,date:toJ(),cid,amt,to:$('#m').value});post(toJ(),'دریافت از '+cust(cid).name,[{a:$('#m').value,d:amt},{a:'1103',c:amt}],id)})){close();toast('دریافت ثبت شد');render()}}}
$('#bTheme').onclick=async()=>{await tx(()=>db.theme=db.theme==='dark'?'light':'dark');render()};
load().then(()=>{render();syncPhoneAlerts()});

/* ================= افزونه‌ها: فروش/خرید اتمی، مرجوعی، تأمین‌کننده، دفاتر، چاپ، CSV، بستن دوره ================= */
const G={};
const supBal=id=>db.journal.reduce((s,j)=>s+j.lines.filter(l=>l.a==='2101'&&l.p===id).reduce((x,l)=>x+(l.c||0)-(l.d||0),0),0);
const sup=id=>db.suppliers.find(x=>x.id===id);
const blobB64=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(String(f.result).split(',')[1]||'');f.readAsDataURL(b)});
const dlf=async(name,txt,type)=>{const b=new Blob([txt],{type});if(window.AndroidBridge){const ok=AndroidBridge.saveFile(name,await blobB64(b),type);if(ok!==true)throw new Error('اندروید ذخیرهٔ فایل را تأیید نکرد');return true}
 const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1e3);return true};
const csvOut=rows=>'\uFEFF'+rows.map(r=>r.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
const csvParse=t=>t.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean).map(l=>{const o=[];let c='',q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===','&&!q){o.push(c);c=''}else c+=ch}o.push(c);return o});
/* --- هستهٔ فروش (اتمی) --- */
function mkSale(cartL,cid,disc,paid,method){if(!Array.isArray(cartL)||!cartL.length)throw new Error('سبد خالی است.');
 for(const l of cartL){if(!Number.isSafeInteger(l.n)||l.n<=0)throw new Error('تعداد باید عدد صحیح و مثبت باشد.');if(!Number.isSafeInteger(l.price)||l.price<0)throw new Error('قیمت نامعتبر است.');if(!prod(l.pid))throw new Error('کالای سبد یافت نشد.')}
 if(!Number.isSafeInteger(disc)||!Number.isSafeInteger(paid))throw new Error('مبلغ تخفیف یا پرداخت نامعتبر است.');if(paid>0&&!['1101','1102'].includes(method))throw new Error('روش پرداخت نامعتبر است.');
 const sub=cartL.reduce((s,l)=>s+l.n*l.price,0),total=sub-disc,id=uid(),no=Math.max(1000,...db.sales.map(x=>+x.no||0))+1;let cogs=0;
 if(!cartL.length)throw new Error('سبد خالی است.');if(disc<0||disc>sub)throw new Error('تخفیف نامعتبر است.');if(paid<0||paid>total)throw new Error('مبلغ پرداخت نامعتبر است.');
 if(paid<total&&!cid)throw new Error('برای فروش نسیه باید مشتری انتخاب شود.');
 cartL.forEach(l=>{const p=prod(l.pid);if(!db.allowNegStock&&p.qty<l.n)throw new Error('موجودی «'+p.name+'» کافی نیست.');cogs+=l.n*p.cost;p.qty-=l.n});
 db.sales.push({id,no,date:toJ(),time:new Date().toTimeString().slice(0,5),cid,lines:cartL.map(l=>({...l,cost:prod(l.pid).cost,ret:0})),sub,disc,total,paid,method,status:paid>=total?'paid':paid>0?'part':'unpaid'});
 const L=[];if(paid>0)L.push({a:method,d:paid});if(total-paid>0)L.push({a:'1103',d:total-paid});if(disc>0)L.push({a:'4102',d:disc});L.push({a:'4101',c:sub});
 post(toJ(),'فروش فاکتور '+no,L,id);if(cogs>0)post(toJ(),'بهای تمام‌شده فاکتور '+no,[{a:'5101',d:cogs},{a:'1104',c:cogs}],id);
 if(cid){const n=Math.floor(total/1000)*db.loyalty.perThousand;if(n>0)db.points.push({id:uid(),cid,n,why:'فاکتور '+no,ref:id})}
 if(cid)db.reminders.forEach(r=>{if(r.cid===cid&&!r.done&&r.type==='خرید مجدد'){r.done=true;r.doneDate=toJ();r.result='خرید مجدد انجام شد (خودکار)'}});return id}
async function finishSale(){const E=$('#e');if(!cart.length)return E.textContent='سبد خالی است.';
 const sub=cart.reduce((s,l)=>s+l.n*l.price,0),disc=num($('#sd').value),total=sub-disc,pv=$('#spd').value.trim(),paid=pv===''?total:num(pv);let id;
 if(await tx(()=>{id=mkSale(cart,$('#sc').value,disc,paid,$('#sm').value)})){cart=[];saleCid='';saleSel='';saleD='';saleP='';toast('فاکتور ثبت شد');render();showInv(id)}}
/* --- مرجوعی فروش --- */
function mkReturn(sid,li,qty,method,cond){if(!['1101','1102','1103'].includes(method))throw new Error('روش بازپرداخت نامعتبر است.');if(!Number.isSafeInteger(qty))throw new Error('تعداد مرجوعی باید عدد صحیح باشد.');const s=db.sales.find(x=>x.id===sid),l=s&&s.lines[li];if(!l)throw new Error('ردیف فاکتور یافت نشد.');
 if(!(qty>0)||qty>l.n-(l.ret||0))throw new Error('تعداد مرجوعی بیش از تعداد قابل برگشت است.');
 const gross=qty*l.price,share=s.sub?Math.round(gross*s.disc/s.sub):0,net=gross-share;
 if(method==='1103'){if(s.total-s.paid<net)throw new Error('مانده بدهی فاکتور کمتر از مبلغ مرجوعی است.')}else if(s.paid<net)throw new Error('مبلغ پرداخت‌شده کمتر از مبلغ مرجوعی است.');
 const id=uid(),L=[{a:'4101',d:gross}];if(share>0)L.push({a:'4102',c:share});L.push({a:method,c:net});post(toJ(),'مرجوعی فاکتور '+s.no,L,id);
 const cost=qty*l.cost;if(cond==='ok'){const p=prod(l.pid);if(p){if(cost>0)post(toJ(),'بازگشت بهای کالا — فاکتور '+s.no,[{a:'1104',d:cost},{a:'5101',c:cost}],id);stockIn(p,qty,cost,id)}}
 l.ret=(l.ret||0)+qty;s.sub-=gross;s.disc-=share;s.total-=net;if(method!=='1103')s.paid-=net;s.status=s.paid>=s.total?'paid':s.paid>0?'part':'unpaid';
 (db.returns=db.returns||[]).push({id,date:toJ(),sid,li,qty,net,method,cond});
 if(s.cid){const n=Math.floor(net/1000)*db.loyalty.perThousand;if(n>0)db.points.push({id:uid(),cid:s.cid,n:-n,why:'مرجوعی فاکتور '+s.no,ref:id})}return id}
function retForm(sid){const s=db.sales.find(x=>x.id===sid);const opts=s.lines.map((l,i)=>[l,i]).filter(([l])=>l.n-(l.ret||0)>0);if(!opts.length)return toast('همه‌ی اقلام مرجوع شده‌اند.');
 modal(`<h3>مرجوعی فاکتور ${fa(s.no)}</h3><label>کالا</label><select id="li">${opts.map(([l,i])=>`<option value="${i}">${esc(prod(l.pid)?.name||'')} (قابل برگشت ${fa(l.n-(l.ret||0))})</option>`).join('')}</select>
 <label>تعداد</label><input id="rq" value="1" inputmode="numeric"><label>وضعیت کالا</label><select id="rc"><option value="ok">سالم و قابل فروش (به انبار برگردد)</option><option value="bad">خراب (ضایعات)</option></select>
 <label>بازپرداخت</label><select id="rm"><option value="1101">نقدی از صندوق</option><option value="1102">بانکی</option>${s.total>s.paid?'<option value="1103">کاهش بدهی مشتری</option>':''}</select>
 <div class="err" id="e"></div><button class="b" id="ok">ثبت مرجوعی</button><button class="b s" id="no">لغو</button>`);$('#no').onclick=close;
 $('#ok').onclick=async()=>{if(await tx(()=>mkReturn(sid,+$('#li').value,num($('#rq').value),$('#rm').value,$('#rc').value))){close();toast('مرجوعی ثبت شد');render()}else{}}}
/* --- خرید با تأمین‌کننده --- */
/* ورود n واحد به ارزش val به انبار؛ بهای میانگین صحیح می‌ماند و اختلاف گرد کردن در 6103 ثبت می‌شود تا موجودی کالا (1104) همیشه با جمع تعداد×بها برابر باشد */
function stockIn(p,n,val,ref){const old=p.qty*p.cost,nq=p.qty+n;if(nq>0)p.cost=p.qty>0?Math.round((old+val)/nq):Math.round(val/n);p.qty=nq;
 const diff=p.qty*p.cost-(old+val);if(diff!==0)post(toJ(),'گرد کردن بهای '+p.name,diff>0?[{a:'1104',d:diff},{a:'6103',c:diff}]:[{a:'1104',c:-diff},{a:'6103',d:-diff}],ref)}
function mkBuy(pid,n,c,method,supId){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(c)||n<=0||c<=0)throw new Error('تعداد و قیمت باید عدد صحیح و بزرگ‌تر از صفر باشند.');
 if(!['1101','1102','2101'].includes(method))throw new Error('روش پرداخت نامعتبر است.');
 if(method==='2101'){if(!supId)throw new Error('برای خرید نسیه تأمین‌کننده را انتخاب کنید.');if(!db.suppliers.some(x=>x.id===supId))throw new Error('تأمین‌کننده یافت نشد.')}
 const p=prod(pid);if(!p)throw new Error('کالا یافت نشد.');const amt=n*c,id=uid();
 post(toJ(),'خرید '+p.name,[{a:'1104',d:amt},{a:method,c:amt,p:method==='2101'?supId:undefined}],id);stockIn(p,n,amt,id);db.purchases.push({id,date:toJ(),pid,n,c,method,sup:supId||''})}
function buyForm(){if(!db.products.length)return toast('ابتدا کالا تعریف کنید.');
 modal(`<h3>خرید / ورود موجودی</h3><label>کالا</label><select id="p">${db.products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
 <label>تأمین‌کننده</label><select id="sp"><option value="">— بدون —</option>${db.suppliers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>
 <label>تعداد</label><input id="n" inputmode="numeric"><label>قیمت خرید واحد (تومان)</label><input id="c" inputmode="numeric">
 <label>پرداخت</label><select id="m"><option value="1101">نقدی (صندوق)</option><option value="1102">بانک</option><option value="2101">نسیه (بدهی به تأمین‌کننده)</option></select>
 <div class="err" id="e"></div><button class="b" id="ok">ثبت</button><button class="b s" id="no">لغو</button>`);$('#no').onclick=close;
 $('#ok').onclick=async()=>{if(await tx(()=>mkBuy($('#p').value,num($('#n').value),num($('#c').value),$('#m').value,$('#sp').value))){close();toast('خرید ثبت شد');render()}}}
G.sup=function(){modal(`<h3>تأمین‌کنندگان</h3>${db.suppliers.map(x=>`<div class="row"><span>${esc(x.name)} <span class="k">${esc(x.phone||'')}</span><br><span class="k">بدهی: ${T(supBal(x.id))}</span></span><button class="b s" data-pay="${x.id}" style="margin:0">پرداخت</button></div>`).join('')||'<div class="k">تأمین‌کننده‌ای نیست.</div>'}
 <label>نام تأمین‌کنندهٔ جدید</label><input id="sn"><label>تلفن</label><input id="sph"><button class="b" id="sa">افزودن</button><button class="b s" id="no">بستن</button>`);
 $('#no').onclick=close;$('#sa').onclick=async()=>{const n=$('#sn').value.trim();if(!n)return toast('نام را وارد کنید.');if(await tx(()=>db.suppliers.push({id:uid(),name:n,phone:en($('#sph').value)})))G.sup()};
 $('#dlg').onclick=e=>{const id=e.target.dataset.pay;if(id)payForm(id)}};
function payForm(id){modal(`<h3>پرداخت به ${esc(sup(id).name)}</h3><div class="k">بدهی: ${T(supBal(id))}</div><label>مبلغ</label><input id="a" inputmode="numeric"><label>از</label><select id="m"><option value="1101">صندوق</option><option value="1102">بانک</option></select><div class="err" id="e"></div><button class="b" id="ok">ثبت</button><button class="b s" id="no">لغو</button>`);$('#no').onclick=close;
 $('#ok').onclick=async()=>{const a=num($('#a').value);if(a<=0||a>supBal(id))return $('#e').textContent='مبلغ باید بین ۱ و مانده بدهی باشد.';
 if(await tx(()=>{const pid=uid();db.payments.push({id:pid,date:toJ(),sup:id,amt:a,from:$('#m').value});post(toJ(),'پرداخت به '+sup(id).name,[{a:'2101',d:a,p:id},{a:$('#m').value,c:a}],pid)})){close();toast('پرداخت ثبت شد')}}}
/* --- فاکتور، چاپ، PDF --- */
function invHTML(s){const c=cust(s.cid);return `<div class="inv"><h2>${esc(db.shop.name)}</h2><div>${esc(db.shop.phone)} ${esc(db.shop.addr||'')}</div><hr>
 <div>فاکتور فروش ${s.no?fa(s.no):'(قدیمی)'} — ${fa(s.date)} ${fa(s.time||'')}</div><div>مشتری: ${esc(c?c.name:'مشتری گذری')}</div>
 <table><tr><th>کالا</th><th>تعداد</th><th>فی</th><th>جمع</th></tr>${s.lines.length?s.lines.map(l=>`<tr><td>${esc(prod(l.pid)?.name||'')}</td><td>${fa(l.n-(l.ret||0))}</td><td>${fa(l.price)}</td><td>${fa((l.n-(l.ret||0))*l.price)}</td></tr>`).join(''):`<tr><td colspan=4>${esc(s.desc||'خرید قدیمی')}</td></tr>`}</table>
 <div>جمع: ${T(s.sub)}</div><div>تخفیف: ${T(s.disc)}</div><div><b>قابل پرداخت: ${T(s.total)}</b></div><div>پرداخت‌شده: ${T(s.paid)}</div><div>مانده: ${T(s.total-s.paid)}</div><hr><div>${esc(db.shop.footer)}</div></div>`}
function invList(){modal(`<h3>فاکتورها</h3><input id="iq" placeholder="شماره یا نام مشتری"><div class="tbl"><table id="it"></table></div><button class="b s" id="no">بستن</button>`);$('#no').onclick=close;
 const draw=()=>{const k=en($('#iq').value).trim();$('#it').innerHTML='<tr><th>شماره</th><th>تاریخ</th><th>مشتری</th><th>مبلغ</th><th>وضعیت</th></tr>'+db.sales.slice().reverse().filter(s=>!k||String(s.no).includes(k)||(cust(s.cid)?.name||'').includes(k)).slice(0,80).map(s=>`<tr data-s="${s.id}"><td>${s.no?fa(s.no):'قدیمی'}</td><td>${fa(s.date)}</td><td>${esc(cust(s.cid)?.name||'—')}</td><td>${T(s.total)}</td><td>${{paid:'تسویه',part:'جزئی',unpaid:'نسیه',cancel:'لغو'}[s.status]}</td></tr>`).join('')};
 $('#iq').oninput=draw;draw();$('#it').onclick=e=>{const r=e.target.closest('tr[data-s]');if(r){close();showInv(r.dataset.s)}}}
/* --- پروندهٔ مشتری و ادغام --- */
function p360(id){const c=cust(id),ss=cSales(id),pt=cPoints(id);modal(`<h3>${esc(c.name)}</h3><div class="k">${esc(c.phone)} · تولد: ${fa(c.birth||'—')}</div>
 <div class="row"><span>سطح / امتیاز</span><b>${level(pt)} / ${fa(pt)}</b></div><div class="row"><span>خریدها</span><b>${fa(ss.length)} — ${T(ss.reduce((s,x)=>s+x.total,0))}</b></div><div class="row"><span>بدهی</span><b>${T(cDebt(id))}</b></div>
 <div class="row"><span>آخرین خرید</span><b>${fa(ss.map(x=>x.date).sort().pop()||'—')}</b></div><div class="row"><span>یادآوری‌های باز</span><b>${fa(db.reminders.filter(r=>r.cid===id&&!r.done).length)}</b></div>
 <b>خریدها</b>${ss.slice().reverse().slice(0,15).map(x=>`<div class="row"><span>${fa(x.date)} ${esc(x.desc||'')}</span><span>${T(x.total)}</span></div>`).join('')||'<div class="k">—</div>'}
 <b>پیام‌های ارسال‌شده</b>${(db.comms||[]).filter(m=>m.cid===id).slice(-5).map(m=>`<div class="row"><span>${fa(m.date)} — ${esc(m.title)}</span><span class="k">${esc(m.ch)}</span></div>`).join('')||'<div class="k">—</div>'}<b>تاریخچه امتیاز</b>${db.points.filter(p=>p.cid===id).slice(-8).map(p=>`<div class="row"><span>${esc(p.why)}</span><span>${fa(p.n)}</span></div>`).join('')}
 <div class="k">یادداشت: ${esc(c.note||'')}</div><button class="b s" id="st">صورت‌حساب</button><button class="b s" id="mm">پیام</button><button class="b s" id="no">بستن</button>`);$('#no').onclick=close;$('#st').onclick=()=>stmtCust(id);$('#mm').onclick=()=>msgDlg(id)}
function mergeDlg(){const m={};db.customers.forEach(c=>(m[c.phone]=m[c.phone]||[]).push(c));const gs=Object.values(m).filter(v=>v.length>1);
 if(!gs.length)return toast('مشتری با شماره‌ی تکراری وجود ندارد.');
 modal(`<h3>مشتریان با شماره‌ی تکراری (${fa(gs.length)} گروه)</h3><div class="k">اگر افراد متفاوت‌اند (مثلاً اعضای یک خانواده) ادغام نکنید.</div>`+gs.map((g,i)=>`<div class="card"><label>نگه‌داشتن:</label><select data-k="${i}">${g.map(c=>`<option value="${c.id}">${esc(c.name)} (${fa(cSales(c.id).length)} خرید)</option>`).join('')}</select><button class="b" data-m="${i}">ادغام این گروه</button></div>`).join('')+'<button class="b s" id="no">بستن</button>');
 $('#no').onclick=close;$('#dlg').onclick=async e=>{const i=e.target.dataset.m;if(i===undefined)return;const keep=$(`select[data-k="${i}"]`).value,g=gs[+i];
  if(!confirm('ادغام انجام شود؟ فاکتورها، امتیازها و یادآوری‌ها به مشتری انتخاب‌شده منتقل و بقیه حذف می‌شوند.'))return;
  if(await tx(()=>{const k=cust(keep);g.filter(c=>c.id!==keep).forEach(o=>{db.sales.forEach(x=>{if(x.cid===o.id)x.cid=keep});db.points.forEach(x=>{if(x.cid===o.id)x.cid=keep});db.reminders.forEach(x=>{if(x.cid===o.id)x.cid=keep});db.payments.forEach(x=>{if(x.cid===o.id)x.cid=keep});
   if(!k.birth&&o.birth)k.birth=o.birth;if(o.note&&!(k.note||'').includes(o.note))k.note=((k.note||'')+' | '+o.note).replace(/^ \| /,'');db.customers=db.customers.filter(c=>c.id!==o.id)});delete k.dupPhone})){toast('ادغام شد');close();render()}}}
/* --- یادآوری‌ها --- */
G.rem2=function(){const t=toJ(),l=db.reminders.filter(r=>!r.done).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,60);
 modal(`<h3>یادآوری‌های باز (${fa(db.reminders.filter(r=>!r.done).length)})</h3>${l.map(r=>`<div class="row" data-r="${r.id}"><span>${r.date<t?'<b class="neg">عقب‌افتاده</b> ':''}${fa(r.date)}<br>${esc(r.title)} <span class="k">${esc(cust(r.cid)?.name||r.cname||'')}</span></span><span><button class="b s" data-a="d" style="margin:0">انجام</button><button class="b s" data-a="s" style="margin:0 4px">+۷ روز</button></span></div>`).join('')||'<div class="k">یادآوری باز نیست.</div>'}<button class="b s" id="no">بستن</button>`);
 $('#no').onclick=close;$('#dlg').onclick=async e=>{const a=e.target.dataset.a,id=e.target.closest('[data-r]')?.dataset.r;if(!a)return;
  if(await tx(()=>{const r=db.reminders.find(x=>x.id===id);if(a==='d'){r.done=true;r.doneDate=toJ()}else r.date=addDays(r.date<toJ()?toJ():r.date,7)}))G.rem2()}};
/* --- دفاتر و گزارش‌ها --- */
const sumPL=(pre,from,to)=>db.accounts.filter(a=>a[0].startsWith(pre)).reduce((s,a)=>s+db.journal.reduce((x,j)=>x+(j.ref==='close'||(from&&j.date<from)||(to&&j.date>to)?0:j.lines.filter(l=>l.a===a[0]).reduce((y,l)=>y+(l.d||0)-(l.c||0),0)),0),0);
const sumP=(pre,from,to)=>db.accounts.filter(a=>a[0].startsWith(pre)).reduce((s,a)=>s+db.journal.reduce((x,j)=>x+((from&&j.date<from)||(to&&j.date>to)?0:j.lines.filter(l=>l.a===a[0]).reduce((y,l)=>y+(l.d||0)-(l.c||0),0)),0),0);
function report(){const t=toJ();modal(`<h3>گزارش‌ها و دفاتر</h3><label>گزارش</label><select id="rt"><option value="tb">تراز آزمایشی</option><option value="jn">دفتر روزنامه</option><option value="gl">دفتر کل / معین (گردش حساب)</option><option value="pl">سود و زیان</option><option value="bs">ترازنامه</option><option value="cf">جریان وجوه نقد</option><option value="ar">مطالبات (بدهکاران)</option><option value="ap">بدهی به تأمین‌کنندگان</option><option value="ex">هزینه به تفکیک دسته</option></select>
 <label>حساب (برای دفتر کل)</label><select id="ac">${db.accounts.map(a=>`<option value="${a[0]}">${fa(a[0])} ${a[1]}</option>`).join('')}</select>
 <label>از تاریخ</label><input id="rf" class="jd" readonly placeholder="خالی = از ابتدا"><label>تا تاریخ</label><input id="rtt" class="jd" readonly value="${t}"><button class="b" id="go">نمایش</button><button class="b s" id="no">بستن</button><div id="ro" class="tbl"></div>`);
 $('#no').onclick=close;$('#go').onclick=()=>{const k=$('#rt').value,f=$('#rf').value.trim()?normJ($('#rf').value):'',to=normJ($('#rtt').value),O=$('#ro');
  if((f&&!validJ(f))||!validJ(to))return O.innerHTML='<div class="err">تاریخ معتبر نیست.</div>';
  const inR=j=>(!f||j.date>=f)&&j.date<=to,tr=(a,b)=>`<tr><td>${a}</td><td>${b}</td></tr>`;let h='';
  if(k==='tb'){let D=0,C=0;h='<table><tr><th>حساب</th><th>اول دوره</th><th>بدهکار</th><th>بستانکار</th><th>مانده</th></tr>'+db.accounts.map(a=>{const o=f?db.journal.filter(j=>j.date<f).reduce((s,j)=>s+j.lines.filter(l=>l.a===a[0]).reduce((x,l)=>x+(l.d||0)-(l.c||0),0),0):0;let d=0,c=0;db.journal.filter(inR).forEach(j=>j.lines.filter(l=>l.a===a[0]).forEach(l=>{d+=l.d||0;c+=l.c||0}));D+=d;C+=c;return `<tr><td>${fa(a[0])} ${a[1]}</td><td>${T(o)}</td><td>${T(d)}</td><td>${T(c)}</td><td>${T(o+d-c)}</td></tr>`}).join('')+`<tr><th>جمع گردش</th><th></th><th>${T(D)}</th><th>${T(C)}</th><th></th></tr></table><div class="${D===C?'pos':'err'}">${D===C?'تراز متوازن است.':'هشدار: اختلاف!'}</div>`}
  if(k==='jn')h='<table><tr><th>سند</th><th>تاریخ</th><th>شرح</th><th>حساب‌ها</th></tr>'+db.journal.filter(inR).slice(-150).map(j=>`<tr><td>${fa(j.no)}</td><td>${fa(j.date)}</td><td>${esc(j.desc)}</td><td>${j.lines.map(l=>`${l.d?'بد':'بس'} ${accName(l.a)} ${T(l.d||l.c)}`).join('<br>')}</td></tr>`).join('')+'</table>';
  if(k==='gl'){const a=$('#ac').value;let run=f?db.journal.filter(j=>j.date<f).reduce((s,j)=>s+j.lines.filter(l=>l.a===a).reduce((x,l)=>x+(l.d||0)-(l.c||0),0),0):0;
   h=`<b>${fa(a)} ${accName(a)}</b><table><tr><th>تاریخ</th><th>شرح</th><th>بد</th><th>بس</th><th>مانده</th></tr>${tr('','مانده ابتدا')}`.replace(tr('','مانده ابتدا'),`<tr><td></td><td>مانده ابتدا</td><td></td><td></td><td>${T(run)}</td></tr>`)+db.journal.filter(inR).flatMap(j=>j.lines.filter(l=>l.a===a).map(l=>{run+=(l.d||0)-(l.c||0);return `<tr><td>${fa(j.date)}</td><td>${esc(j.desc)}</td><td>${l.d?T(l.d):''}</td><td>${l.c?T(l.c):''}</td><td>${T(run)}</td></tr>`})).slice(-200).join('')+'</table>'}
  if(k==='pl'){const sal=-sumPL('4101',f,to),ds=sumPL('4102',f,to),cg=sumPL('5',f,to),ex=sumPL('6',f,to);
   const net=sal-ds,gp=net-cg,np=gp-ex;h=`<table>${tr('فروش (پس از مرجوعی)',T(sal))}${tr('تخفیف فروش',T(ds))}${tr('فروش خالص',T(net))}${tr('بهای تمام‌شده',T(cg))}${tr('<b>سود ناخالص</b>',`<b class="${gp<0?'neg':'pos'}">${T(gp)}</b>`)}${tr('هزینه‌ها',T(ex))}${tr('<b>سود خالص</b>',`<b class="${np<0?'neg':'pos'}">${T(np)}</b>`)}</table>`}
  if(k==='bs'){const A=sumP('1','',to),Li=-sumP('2','',to),E=-sumP('3','',to),P=-(sumP('4','',to)+sumP('5','',to)+sumP('6','',to));
   h=`<table>${tr('دارایی‌ها',T(A))}${tr('بدهی‌ها',T(Li))}${tr('حقوق مالکانه (سرمایه و انباشته)',T(E))}${tr('سود/زیان دورهٔ جاری (بسته‌نشده)',T(P))}${tr('<b>بدهی + حقوق مالکانه + سود</b>',`<b>${T(Li+E+P)}</b>`)}</table><div class="${A===Li+E+P?'pos':'err'}">${A===Li+E+P?'معادله‌ی حسابداری برقرار است.':'خطا: دارایی با بدهی + حقوق برابر نیست!'}</div>`}
  if(k==='cf'){const cashIn=j=>j.lines.filter(l=>l.a==='1101'||l.a==='1102').reduce((s,l)=>s+(l.d||0)-(l.c||0),0);const op=db.journal.filter(inR),open=f?db.journal.filter(j=>j.date<f).reduce((s,j)=>s+cashIn(j),0):0;
   let o=0,fi=0;op.forEach(j=>{const v=cashIn(j);if(!v)return;if(j.lines.some(l=>l.a[0]==='3'))fi+=v;else o+=v});h=`<table>${tr('مانده ابتدای دوره',T(open))}${tr('جریان نقدی عملیاتی',T(o))}${tr('جریان نقدی سرمایه‌گذاری',T(0))}${tr('جریان نقدی تأمین مالی',T(fi))}${tr('<b>مانده پایان دوره</b>',`<b>${T(open+o+fi)}</b>`)}</table>`}
  if(k==='ar')h='<table><tr><th>مشتری</th><th>بدهی</th><th>قدیمی‌ترین (روز)</th></tr>'+db.customers.filter(c=>cDebt(c.id)>0).sort((a,b)=>cDebt(b.id)-cDebt(a.id)).map(c=>{const o=cSales(c.id).filter(x=>x.total>x.paid).map(x=>x.date).sort()[0];return `<tr><td>${esc(c.name)}</td><td>${T(cDebt(c.id))}</td><td>${o?fa(Math.max(0,jdiff(toJ(),o))):''}</td></tr>`}).join('')+'</table>';
  if(k==='ap')h='<table><tr><th>تأمین‌کننده</th><th>بدهی</th></tr>'+db.suppliers.map(x=>`<tr><td>${esc(x.name)}</td><td>${T(supBal(x.id))}</td></tr>`).join('')+'</table>';
  if(k==='ex'){let tot=0;h='<table><tr><th>دسته</th><th>مبلغ</th></tr>'+db.expCats.map(c=>{const v=sumPL(c.acc,f,to);tot+=v;return v?`<tr><td>${esc(c.name)}</td><td>${T(v)}</td></tr>`:''}).join('')+`<tr><th>جمع</th><th>${T(tot)}</th></tr></table>`}
  O.innerHTML=h}}
/* --- CSV --- */
G.csv=function(){modal(`<h3>ورود و خروجی CSV</h3><button class="b" data-x="c">خروجی مشتریان</button><button class="b" data-x="p">خروجی کالاها</button><button class="b" data-x="s">خروجی فاکتورها</button><button class="b" data-x="e">خروجی هزینه‌ها</button>
 <hr><div class="k">ورود: ردیف اول باید سرستون باشد. کالاها: نام، برند، بارکد، واحد، قیمت فروش، قیمت خرید، موجودی — مشتریان: نام، موبایل، تولد</div><button class="b s" data-x="ip">ورود کالاها</button><button class="b s" data-x="ic">ورود مشتریان</button><button class="b s" id="no">بستن</button>`);
 $('#no').onclick=close;$('#dlg').onclick=e=>{const x=e.target.dataset.x;if(!x)return;const T0=toJ().replace(/\//g,'-');
  if(x==='c')dlf('customers_'+T0+'.csv',csvOut([['نام','موبایل','تولد','سطح','امتیاز','بدهی']].concat(db.customers.map(c=>[c.name,c.phone,c.birth,level(cPoints(c.id)),cPoints(c.id),cDebt(c.id)]))),'text/csv');
  if(x==='p')dlf('products_'+T0+'.csv',csvOut([['نام','برند','بارکد','واحد','قیمت فروش','قیمت خرید','موجودی']].concat(db.products.map(p=>[p.name,p.brand,p.barcode,p.unit,p.price,p.cost,p.qty]))),'text/csv');
  if(x==='s')dlf('sales_'+T0+'.csv',csvOut([['شماره','تاریخ','مشتری','جمع','تخفیف','قابل پرداخت','پرداخت‌شده','وضعیت']].concat(db.sales.map(s=>[s.no||'',s.date,cust(s.cid)?.name||'',s.sub,s.disc,s.total,s.paid,s.status]))),'text/csv');
  if(x==='e')dlf('expenses_'+T0+'.csv',csvOut([['تاریخ','شرح','مبلغ']].concat(db.expenses.map(r=>[r.date,r.desc,r.amt]))),'text/csv');
  if(x==='ip'||x==='ic'){const i=document.createElement('input');i.type='file';i.accept='.csv,text/csv';i.onchange=()=>{const r=new FileReader();r.onload=()=>importCsv(x,r.result);r.readAsText(i.files[0])};i.click()}}};
function importCsv(kind,txt){const rows=csvParse(txt);if(rows.length<2)return toast('فایل خالی است.');const h=rows[0].map(x=>x.trim()),col=ns=>h.findIndex(x=>ns.some(n=>x.includes(n))),data=rows.slice(1);let add=0;const bad=[];
 if(kind==='ip'){const ci={n:col(['نام']),b:col(['برند']),bc:col(['بارکد']),u:col(['واحد']),p:col(['فروش']),c:col(['خرید']),q:col(['موجودی'])};if(ci.n<0)return toast('ستون «نام» یافت نشد.');
  if(!confirm(data.length+' ردیف کالا وارد شود؟'))return;
  tx(()=>{let sv=0;data.forEach((r,i)=>{const n=(r[ci.n]||'').trim();if(!n){bad.push(i+2);return}if(db.products.some(p=>p.name===n)){bad.push(i+2);return}
   const q=ci.q>=0?num(r[ci.q]):0,c=ci.c>=0?num(r[ci.c]):0;sv+=q*c;db.products.push({id:uid(),name:n,brand:ci.b>=0?r[ci.b]:'',barcode:ci.bc>=0?en(r[ci.bc]):'',unit:(ci.u>=0&&r[ci.u])||'گرم',price:ci.p>=0?num(r[ci.p]):0,cost:c,qty:q,min:0});add++});
   if(sv>0)post(toJ(),'موجودی افتتاحیه (ورود CSV)',[{a:'1104',d:sv},{a:'3101',c:sv}],'csv')}).then(ok=>{if(ok){toast(`وارد شد: ${add} · رد شده (تکراری/خالی): ${bad.length}`);close();render()}})}
 else{const ci={n:col(['نام']),p:col(['موبایل','تلفن','شماره']),b:col(['تولد'])};if(ci.n<0||ci.p<0)return toast('ستون‌های «نام» و «موبایل» لازم است.');if(!confirm(data.length+' ردیف مشتری وارد شود؟'))return;
  tx(()=>{data.forEach((r,i)=>{const ph=normPhone(r[ci.p]||''),n=(r[ci.n]||'').trim(),b=ci.b>=0?(r[ci.b]||'').trim():'';if(!n||!ph||(b&&!validJ(b))){bad.push(i+2);return}
   const dup=db.customers.some(c=>c.phone===ph);db.customers.push({id:uid(),name:n,phone:ph,birth:b?normJ(b):'',note:'',promo:true,created:toJ(),dupPhone:dup||undefined});add++})}).then(ok=>{if(ok){toast(`وارد شد: ${add} · ردشده: ${bad.length} (ردیف‌ها: ${bad.slice(0,10).join('، ')})`);close();render()}})}}
/* --- بستن دوره مالی --- */
G.close=function(){modal(`<h3>بستن دوره مالی</h3><div class="k">درآمدها و هزینه‌ها تا تاریخ پایان به «سود و زیان انباشته» منتقل و ثبت اسناد تا آن تاریخ قفل می‌شود. اطلاعات حذف نمی‌شود.${db.lockDate?'<br>آخرین بستن: '+fa(db.lockDate):''}</div><label>تاریخ پایان دوره</label><input id="ed" class="jd" readonly placeholder="انتخاب تاریخ"><div class="err" id="e"></div><button class="b d" id="ok">بستن دوره</button><button class="b s" id="no">لغو</button>`);$('#no').onclick=close;
 $('#ok').onclick=async()=>{const e=normJ($('#ed').value);if(!validJ(e))return $('#e').textContent='تاریخ معتبر نیست.';if(e>=toJ())return $('#e').textContent='تاریخ پایان باید قبل از امروز باشد (تا ثبت فروش و خرید امروز قفل نشود).';if(db.lockDate&&e<=db.lockDate)return $('#e').textContent='این دوره قبلاً بسته شده است.';
  if(!confirm('دوره تا '+e+' بسته می‌شود و ثبت یا ویرایش اسناد تا این تاریخ ممکن نخواهد بود. ادامه؟'))return;
  if(await tx(()=>{const L=[];let net=0;db.accounts.filter(a=>'456'.includes(a[0][0])).forEach(a=>{const b=db.journal.reduce((s,j)=>s+(j.date<=e?j.lines.filter(l=>l.a===a[0]).reduce((x,l)=>x+(l.d||0)-(l.c||0),0):0),0);if(!b)return;L.push(b>0?{a:a[0],c:b}:{a:a[0],d:-b});net+=b});
   if(net>0)L.push({a:'3102',d:net});else if(net<0)L.push({a:'3102',c:-net});if(L.length)post(e,'سند بستن حساب‌های موقت تا '+e,L,'close');db.lockDate=e})){close();toast('دوره بسته شد');render()}}};

/* ===== صفحهٔ فروش با جستجوی مشتری و کالا ===== */
let saleCid='',saleSel='',saleD='',saleP='';
const nz=s=>en(s).replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\u200c\s]/g,'').toLowerCase();
const findCust=q=>{const k=nz(q);return k?db.customers.filter(c=>!c.archived&&(nz(c.name).includes(k)||c.phone.includes(k))).slice(0,6):[]};
const findProd=q=>{const k=nz(q);return k?db.products.filter(p=>p.active!==false&&(nz(p.name).includes(k)||nz(p.brand||'').includes(k)||(p.barcode||'')===k)).slice(0,8):[]};
R.sale=()=>{const tot=cart.reduce((s,l)=>s+l.n*l.price,0),c=cust(saleCid),p=prod(saleSel);
 V.innerHTML=`<div class="card"><label for="cq">مشتری</label><input type="hidden" id="sc" value="${esc(saleCid)}">
 ${c?`<div class="row"><span><b>${esc(c.name)}</b> <span class="k">${esc(c.phone)} · بدهی: ${T(cDebt(c.id))}</span></span><button class="b s" id="cx" style="margin:0">تغییر</button></div>`
  :`<input id="cq" placeholder="جستجوی نام یا موبایل (خالی = مشتری گذری)" autocomplete="off"><div id="cr"></div><button class="b s" id="cn">+ مشتری جدید</button>`}
 <label for="pq">کالا</label>
 ${p?`<div class="row"><span><b>${esc(p.name)}</b> <span class="k">موجودی ${fa(p.qty)} ${esc(p.unit)} · ${T(p.price)}</span></span><button class="b s" id="px" style="margin:0">تغییر</button></div>
  <label for="sn">تعداد</label><input id="sn" value="1" inputmode="numeric"><button class="b" id="add">افزودن به سبد</button>`
  :`<input id="pq" placeholder="جستجوی نام، برند یا بارکد" autocomplete="off"><div id="pr2"></div><button class="b s" id="np">+ محصول جدید / ترکیبی</button>`}</div>
 <div class="card">${cart.length?cart.map((l,i)=>`<div class="row"><span>${esc(prod(l.pid).name)} × ${fa(l.n)}</span><span>${T(l.n*l.price)} <button class="b d" data-i="${i}" style="margin:0;min-height:36px">حذف</button></span></div>`).join(''):'<span class="k">سبد خالی است.</span>'}
 <label for="sd">تخفیف (تومان)</label><input id="sd" value="${esc(saleD||'0')}" inputmode="numeric"><label for="spd">مبلغ پرداختی</label><input id="spd" value="${esc(saleP)}" inputmode="numeric" placeholder="خالی = تسویه کامل">
 <label for="sm">روش پرداخت</label><select id="sm"><option value="1101">نقد (صندوق)</option><option value="1102">کارت‌خوان/بانک</option></select>
 <div class="v">جمع: ${T(tot)}</div><div class="err" id="e"></div><button class="b" id="fin">ثبت فاکتور</button></div>`;
 const hit=(id,items,fmt,pick)=>{const box=$(id);box.innerHTML=items.map(x=>`<div class="row" role="button" tabindex="0" data-k="${x.id}" style="cursor:pointer;min-height:44px">${fmt(x)}</div>`).join('');
  box.onclick=e=>{const r=e.target.closest('[data-k]');if(r)pick(r.dataset.k)}};
 if($('#cq')){$('#cq').oninput=e=>hit('#cr',findCust(e.target.value),x=>`<span>${esc(x.name)}</span><span class="k">${esc(x.phone)}</span>`,id=>{saleCid=id;R.sale()});
  $('#cn').onclick=()=>custForm()}
 if($('#cx'))$('#cx').onclick=()=>{saleCid='';R.sale()};
 if($('#pq')){const draw=()=>hit('#pr2',findProd($('#pq').value),x=>`<span>${esc(x.name)} <span class="k">${esc(x.brand||'')}</span></span><span class="k">${fa(x.qty)} · ${T(x.price)}</span>`,id=>{saleSel=id;R.sale();const n=$('#sn');n&&n.select()});
  $('#pq').oninput=draw;$('#pq').onkeydown=e=>{if(e.key==='Enter'){const r=findProd($('#pq').value);if(r.length===1){saleSel=r[0].id;R.sale()}}}}
 if($('#px'))$('#px').onclick=()=>{saleSel='';R.sale()};if($('#np'))$('#np').onclick=()=>newProductDlg(id=>{saleSel=id;R.sale()});
 if($('#add'))$('#add').onclick=()=>{const n=num($('#sn').value);if(!p||n<=0)return $('#e').textContent='تعداد معتبر وارد کنید.';cart.push({pid:p.id,n,price:p.price});saleSel='';R.sale()};
 $('#sd').oninput=e=>saleD=e.target.value;$('#spd').oninput=e=>saleP=e.target.value;
 V.onclick=e=>{if(e.target.dataset.i!==undefined){cart.splice(+e.target.dataset.i,1);R.sale()}};
 $('#fin').onclick=finishSale};

/* ================= تقویم شمسی (مطابق طرح), قالب پیام, فاکتور و ارسال, حسابداری پیشرفته ================= */
const jdiff=(a,b)=>{const p=s=>s.split('/').map(Number);return j2d(...p(a))-j2d(...p(b))};
const FAM=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'],WD=['ش','ی','د','س','چ','پ','ج'],WDN=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
const jDim=(y,m)=>m<=6?31:m<=11?30:(jLeap(y)?30:29);
const pad2=n=>String(n).padStart(2,'0'),jstr=j=>j.jy+'/'+pad2(j.jm)+'/'+pad2(j.jd);
const FIXH={'01/01':'نوروز','01/02':'نوروز','01/03':'نوروز','01/04':'نوروز','01/12':'روز جمهوری اسلامی','01/13':'روز طبیعت','03/14':'رحلت امام خمینی','03/15':'قیام ۱۵ خرداد','11/22':'پیروزی انقلاب اسلامی','12/29':'ملی شدن صنعت نفت'};
const holRow=ds=>(db.holidays||[]).find(h=>h.date===ds||(h.rec&&h.date.slice(5)===ds.slice(5)));
const holName=ds=>FIXH[ds.slice(5)]||(holRow(ds)?.title)||'';
const isHol=ds=>!!FIXH[ds.slice(5)]||(holRow(ds)&&holRow(ds).off!==false);
const hj=g=>{try{const o={};new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'numeric',year:'numeric'}).formatToParts(new Date(Date.UTC(g.gy,g.gm-1,g.gd+(db.hijriOffset||0),12))).forEach(x=>o[x.type]=x.value);return{d:+o.day,m:+o.month,y:parseInt(o.year)}}catch(e){return null}};
function dayEv(ds){const ev=[],h=holName(ds);if(h)ev.push({k:'h',t:h});db.customers.forEach(c=>{if(c.birth&&normJ(c.birth).slice(5)===ds.slice(5))ev.push({k:'b',t:'تولد '+c.name})});
 db.reminders.forEach(r=>{if(!r.done&&r.date===ds)ev.push({k:'r',t:r.title+(r.cid&&cust(r.cid)?' — '+cust(r.cid).name:''),id:r.id})});return ev}
function calCells(y,m,sel){const f=j2d(y,m,1),off=(f+2)%7,rows=Math.ceil((off+jDim(y,m))/7),t=toJ();let h='';
 for(let i=0;i<rows*7;i++){const n=f-off+i,jj=d2j(n),ds=jstr(jj),g=d2g(n),hh=hj(g),hol=isHol(ds)||i%7===6;
  h+=`<button class="cd${jj.jm===m?'':' o'}${hol?' h':''}${ds===t?' t':''}${ds===sel?' s':''}" data-d="${ds}" aria-label="${fa(ds)}"><b>${fa(jj.jd)}</b><span><em style="font-style:normal">${g.gd}</em>${hh?`<em style="font-style:normal">${fa(pad2(hh.d))}</em>`:''}</span>${dayEv(ds).length?'<u></u>':''}</button>`}return h}
function mountCal(el,o){const st=o.st;
 const draw=()=>{const{y,m}=st,f=j2d(y,m,1),l=j2d(y,m,jDim(y,m)),g1=d2g(f),g2=d2g(l),gn=g=>new Intl.DateTimeFormat('en-US',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(g.gy,g.gm-1,g.gd,12)));let hn='';
  try{const hf=g=>new Intl.DateTimeFormat('fa-IR-u-ca-islamic-umalqura',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(g.gy,g.gm-1,g.gd+(db.hijriOffset||0),12)));const a=hf(g1),b=hf(g2);hn=(a===b?a:a+' - '+b)+' '+fa(hj(g2).y)}catch(e){}
  const a=gn(g1),b=gn(g2);
  el.innerHTML=`<div class="cal"><div class="ch"><button class="cn" data-n="-1">ماه قبل</button><span><select data-s="m" aria-label="ماه">${FAM.map((n,i)=>`<option value="${i+1}"${i+1===m?' selected':''}>${n}</option>`).join('')}</select> <select data-s="y" aria-label="سال">${Array.from({length:201},(_,i)=>1300+i).map(v=>`<option value="${v}"${v===y?' selected':''}>${fa(v)}</option>`).join('')}</select></span><button class="cn" data-n="1">ماه بعد</button></div>
  <div class="cm">${a===b?a:a+' - '+b} ${g2.gy}</div><div class="cm2">${hn}</div><div class="cwk">${WD.map(w=>`<span>${w}</span>`).join('')}</div><div class="cg">${calCells(y,m,o.sel)}</div><button class="ctd" data-today="1">برو به امروز</button></div>`};
 el.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.n){st.m+=+b.dataset.n;if(st.m>12){st.m=1;st.y++}if(st.m<1){st.m=12;st.y--}draw()}else if(b.dataset.today){const t=toJ().split('/').map(Number);st.y=t[0];st.m=t[1];draw()}else if(b.dataset.d)o.onPick(b.dataset.d)};
 el.onchange=e=>{const k=e.target.dataset.s;if(k){st[k]=+e.target.value;draw()}};draw()}
function pickDate(inp){const d=$('#dlg2'),v=normJ(inp.value),t=toJ().split('/').map(Number);let y,m,sel='';
 if(validJ(v)){[y,m]=v.split('/').map(Number);sel=v}else if(inp.dataset.y){y=+inp.dataset.y;m=1}else{y=t[0];m=t[1]}
 d.innerHTML='<div id="pc"></div><button class="b s" id="pcl">پاک کردن</button><button class="b s" id="pno">بستن</button>';if(!d.open)d.showModal();
 mountCal($('#pc'),{st:{y,m},sel,onPick:ds=>{inp.value=ds;d.close()}});$('#pno').onclick=()=>d.close();$('#pcl').onclick=()=>{inp.value='';d.close()}}
function modal(html){const d=$('#dlg');d.onclick=null;d.oninput=null;d.onchange=null;d.innerHTML=html;if(!d.open)d.showModal();d.querySelectorAll('input.jd').forEach(i=>{i.onclick=()=>pickDate(i)});return d}
let calSt=null;
R.cal=()=>{const t=toJ().split('/').map(Number);calSt=calSt||{y:t[0],m:t[1]};V.onclick=null;
 V.innerHTML=`<div id="cw"></div><div class="card k">تاریخ قمری تخمینی است و ممکن است یک روز با رؤیت هلال تفاوت داشته باشد. تعدیل: <select id="ho" style="width:auto;display:inline-block;min-height:36px"><option value="-1">۱- روز</option><option value="0">بدون تعدیل</option><option value="1">۱+ روز</option></select></div>`;
 $('#ho').value=String(db.hijriOffset||0);$('#ho').onchange=async e=>{await tx(()=>db.hijriOffset=+e.target.value);R.cal()};
 mountCal($('#cw'),{st:calSt,onPick:dayDlg})};
G.cal=()=>{tab='cal';render()};
function dayDlg(ds){const[y,m,d]=ds.split('/').map(Number),ev=dayEv(ds),g=d2g(j2d(y,m,d)),h=hj(g);
 modal(`<h3>${WDN[(j2d(y,m,d)+2)%7]} ${fa(d)} ${FAM[m-1]} ${fa(y)}</h3><div class="k">${g.gy}/${g.gm}/${g.gd}${h?' — '+fa(h.y+'/'+h.m+'/'+h.d)+' هـ.ق (تخمینی)':''}</div>
 ${ev.map(e=>`<div class="row"><span>${e.k==='h'?'🎌':e.k==='b'?'🎂':'🔔'} ${esc(e.t)}</span></div>`).join('')||'<div class="k">رویدادی ثبت نشده است.</div>'}
 <button class="b" id="nr">+ یادآوری</button><label>ثبت مناسبت یا تعطیلی</label><input id="ht" placeholder="عنوان مناسبت"><label><input type="checkbox" id="hf" style="width:auto;min-height:0"> تعطیل رسمی (قرمز)</label><label><input type="checkbox" id="hr" style="width:auto;min-height:0"> هر سال تکرار شود</label>
 <button class="b s" id="hs">ثبت مناسبت</button><button class="b s" id="no">بستن</button>`);$('#no').onclick=close;$('#nr').onclick=()=>{close();remForm(ds)};
 $('#hs').onclick=async()=>{const t=$('#ht').value.trim();if(!t)return toast('عنوان را وارد کنید.');if(await tx(()=>{db.holidays=db.holidays||[];db.holidays.push({date:ds,title:t,off:$('#hf').checked,rec:$('#hr').checked})})){close();render()}}}
/* --- قالب‌های پیام --- */
const DEFTPL={birthday:['تبریک تولد','{name} عزیز، تولدتان مبارک! 🎂 {storeName} به‌مناسبت تولد شما هدیه‌ای ویژه کنار گذاشته است. منتظر دیدارتان هستیم.'],
 thanks:['تشکر از خرید','{name} عزیز، از خرید شما از {storeName} سپاسگزاریم. امیدواریم از {productName} لذت ببرید. 🌸'],
 repurchase:['یادآوری خرید مجدد','{name} عزیز، سلام. مدتی از خرید شما در {purchaseDate} می‌گذرد؛ اگر عطرتان رو به پایان است، {storeName} آماده‌ی پذیرایی از شماست.'],
 bulk:['پیام عمومی','{name} عزیز، سلام. پیشنهاد ویژه‌ای از {storeName} برای شما داریم.'],
 welcome:['خوش‌آمدگویی عضویت','{name} عزیز، به خانواده‌ی {storeName} خوش آمدید! با هر خرید امتیاز باشگاه مشتریان می‌گیرید.'],
 firstPurchase:['اولین خرید','{name} عزیز، ممنون که برای اولین بار {storeName} را انتخاب کردید. امیدواریم تجربه‌ی خوبی داشته باشید. 🌷'],
 anniversary:['سالگرد عضویت','{name} عزیز، امروز سالگرد آشنایی ما با شماست. از همراهی‌تان در {storeName} سپاسگزاریم.'],
 comeback:['بازگشت مشتری غیرفعال','{name} عزیز، مدتی است از شما بی‌خبریم و دلمان برایتان تنگ شده. به {storeName} سر بزنید؛ برایتان پیشنهاد ویژه داریم.'],
 debt:['یادآوری بدهی','{name} عزیز، سلام. مانده‌ی حساب شما نزد {storeName} مبلغ {debt} است. لطفاً در اولین فرصت جهت تسویه اقدام فرمایید. با تشکر'],
 invoice:['ارسال فاکتور','{name} عزیز، فاکتور شماره {invoiceNo} به مبلغ {amount} از {storeName} صادر شد. با تشکر از خرید شما.'],
 levelup:['ارتقای سطح باشگاه','{name} عزیز، تبریک! سطح شما در باشگاه مشتریان {storeName} به {loyaltyLevel} رسید. امتیاز فعلی: {points}'],
 occasion:['تبریک مناسبت','{name} عزیز، {storeName} این مناسبت را به شما تبریک می‌گوید. 🌹'],
 discount:['کمپین تخفیف','{name} عزیز، تخفیف ویژه {discount} در {storeName} تا تاریخ {date}.']};
const PROMO=['bulk','discount','comeback'],VARS=['name','lastName','storeName','shopPhone','date','purchaseDate','nextPurchaseDate','discount','points','loyaltyLevel','productName','invoiceNo','amount','debt'];
function ensureDefaults(){db.tpl=db.tpl||{};Object.keys(DEFTPL).forEach(k=>{if(!db.tpl[k])db.tpl[k]=DEFTPL[k][1]});
 [['1105','اسناد دریافتنی (چک)'],['2102','اسناد پرداختنی (چک)'],['3102','سود و زیان انباشته'],['3103','برداشت مالک'],['6102','کارمزد بانکی']].forEach(a=>{if(!db.accounts.some(x=>x[0]===a[0]))db.accounts.push(a)});db.cheques=db.cheques||[];db.holidays=db.holidays||[];db.campaigns=db.campaigns||[];db.comms=db.comms||[];ensureCats()}
function render(){ensureDefaults();document.documentElement.dataset.t=db.theme==='dark'?'dark':'';nav();(R[tab]||R.dash)()}
function fill(t,c,ex={}){c=c||{};const m={name:c.name||'',lastName:'',storeName:db.shop.name,shopPhone:db.shop.phone,date:toJ(),purchaseDate:ex.pd||'',nextPurchaseDate:ex.np||'',discount:ex.disc||'',points:c.id?fa(cPoints(c.id)):'',loyaltyLevel:c.id?level(cPoints(c.id)):'',productName:ex.pn||'',invoiceNo:ex.no?fa(ex.no):'',amount:ex.amt||'',debt:c.id?T(cDebt(c.id)):''};
 return t.replace(/\{(\w+)\}/g,(x,k)=>m[k]??'').replace(/ {2,}/g,' ').replace(/\s+([،.!])/g,'$1')}
G.tpl=function(){const keys=Object.keys(DEFTPL);modal(`<h3>قالب‌های پیام</h3><label>قالب</label><select id="tk">${keys.map(k=>`<option value="${k}">${DEFTPL[k][0]}</option>`).join('')}</select><label>متن</label><textarea id="tx" rows="5"></textarea>
 <div>${VARS.map(v=>`<button class="b s" data-v="${v}" style="min-height:36px;margin:2px">{${v}}</button>`).join('')}</div><label>پیش‌نمایش</label><div class="card" id="tp" style="white-space:pre-wrap"></div>
 <button class="b" id="ts">ذخیره</button><button class="b s" id="tr">بازنشانی پیش‌فرض</button><button class="b s" id="no">بستن</button><div class="k">متغیری که مقدار ندارد از متن حذف می‌شود و هرگز به‌صورت خام ارسال نمی‌شود.</div>`);
 const smp=db.customers[0]||{name:'نمونه'},pv=()=>$('#tp').textContent=fill($('#tx').value,smp,{pd:toJ(),pn:'عطر نمونه',no:1001,amt:T(1500000),disc:'۲۰٪'}),ld=()=>{$('#tx').value=db.tpl[$('#tk').value];pv()};
 $('#tk').onchange=ld;$('#tx').oninput=pv;ld();$('#no').onclick=close;
 $('#dlg').onclick=e=>{const v=e.target.dataset.v;if(v){const t=$('#tx');t.setRangeText('{'+v+'}',t.selectionStart,t.selectionEnd,'end');t.focus();pv()}};
 $('#ts').onclick=async()=>{if(await tx(()=>db.tpl[$('#tk').value]=$('#tx').value))toast('ذخیره شد')};$('#tr').onclick=async()=>{const k=$('#tk').value;if(await tx(()=>db.tpl[k]=DEFTPL[k][1])){ld();toast('بازنشانی شد')}}};
function msgDlg(id,key){const c=cust(id),last=cSales(id).slice().sort((a,b)=>a.date.localeCompare(b.date)).pop();
 const ex={pd:last?last.date:'',pn:last?(last.desc||(last.lines[0]&&prod(last.lines[0].pid)?.name)||''):'',no:last&&last.no,amt:last?T(last.total):''};
 modal(`<h3>پیام برای ${esc(c.name)}</h3><label>قالب</label><select id="mt">${Object.keys(DEFTPL).map(k=>`<option value="${k}">${DEFTPL[k][0]}</option>`).join('')}</select><label>متن (قابل ویرایش)</label><textarea id="mx" rows="6"></textarea>
 <button class="b" id="sms">پیامک</button><button class="b" id="wa">واتساپ</button><button class="b" id="tg">تلگرام</button><button class="b s" id="cp">کپی</button><button class="b s" id="no">بستن</button><div class="k">برنامه‌ی مقصد باز می‌شود و ارسال نهایی با شماست؛ ارسال خودکار نیازمند سرویس پیامکی است.</div>`);
 const upd=()=>$('#mx').value=fill(db.tpl[$('#mt').value],c,ex);if(key)$('#mt').value=key;$('#mt').onchange=upd;upd();$('#no').onclick=close;
 const go=async ch=>{if(PROMO.includes($('#mt').value)&&c.promo===false)return toast('این مشتری پیام تبلیغاتی نمی‌خواهد.');const t=encodeURIComponent($('#mx').value),p='98'+c.phone.slice(1);await tx(()=>{db.comms.push({id:uid(),cid:c.id,date:toJ(),ch:CHN[ch],title:DEFTPL[$('#mt').value][0]+' (باز شد)'})});
  location.href=ch==='sms'?`sms:${c.phone}?body=${t}`:ch==='wa'?`https://wa.me/${p}?text=${t}`:`https://t.me/+${p}`};
 $('#sms').onclick=()=>go('sms');$('#wa').onclick=()=>go('wa');$('#tg').onclick=()=>go('tg');$('#cp').onclick=()=>navigator.clipboard?.writeText($('#mx').value).then(()=>toast('کپی شد'))}
/* --- فاکتور: تصویر، PDF واقعی، چاپ A4 / حرارتی ۸۰ و ۵۸، اشتراک‌گذاری --- */
const FW={a4:794,f80:302,f58:219};
function invText(s){const c=cust(s.cid);return `${db.shop.name}\nفاکتور ${s.no?fa(s.no):'(قدیمی)'} — ${fa(s.date)}\nمشتری: ${c?c.name:'مشتری گذری'}\n`+(s.lines.length?s.lines.map(l=>`• ${prod(l.pid)?.name||''} × ${fa(l.n-(l.ret||0))} = ${T((l.n-(l.ret||0))*l.price)}`).join('\n'):'• '+(s.desc||''))+`\nجمع: ${T(s.sub)}\nتخفیف: ${T(s.disc)}\nقابل پرداخت: ${T(s.total)}\nپرداخت‌شده: ${T(s.paid)}\nمانده: ${T(s.total-s.paid)}\n${db.shop.footer||''}`}
function invCanvas(s,fmt){const W=FW[fmt]||794,S=2,pd=fmt==='a4'?40:10,fs=fmt==='a4'?16:fmt==='f58'?11:12,F='Vazirmatn,Tahoma,"Segoe UI",sans-serif',cv=document.createElement('canvas');cv.width=W*S;cv.height=4000*S;
 const x=cv.getContext('2d');x.scale(S,S);x.fillStyle='#fff';x.fillRect(0,0,W,4000);x.fillStyle='#000';x.direction='rtl';let y=pd+fs;const Rr=W-pd,Ll=pd;
 const fit=(t,mw)=>{while(x.measureText(t).width>mw&&t.length>3)t=t.slice(0,-2);return t};
 const tx_=(t,px,al,b,sz)=>{x.font=`${b?'bold ':''}${sz||fs}px ${F}`;x.textAlign=al;x.fillText(t,px,y)};
 const row=(a,b,bold)=>{tx_(a,Rr,'right',bold);tx_(b,Ll,'left',bold);y+=fs*1.7},hr=()=>{x.fillRect(Ll,y-fs*.6,W-2*pd,1);y+=fs*.9};
 tx_(db.shop.name,W/2,'center',true,fs*1.4);y+=fs*1.6;if(db.shop.phone){tx_(fa(db.shop.phone),W/2,'center');y+=fs*1.5}hr();
 row('فاکتور فروش '+(s.no?fa(s.no):'(قدیمی)'),fa(s.date)+' '+fa(s.time||''));row('مشتری: '+(cust(s.cid)?.name||'مشتری گذری'),'');hr();
 if(s.lines.length)s.lines.forEach(l=>{const q=l.n-(l.ret||0);if(!q)return;x.font=`bold ${fs}px ${F}`;tx_(fit(prod(l.pid)?.name||'',W-2*pd),Rr,'right',true);y+=fs*1.5;row(fa(q)+' × '+fa(l.price),fa(q*l.price))});else{tx_(fit(s.desc||'خرید قدیمی',W-2*pd),Rr,'right');y+=fs*1.6}
 hr();row('جمع',T(s.sub));if(s.disc)row('تخفیف',T(s.disc));row('قابل پرداخت',T(s.total),true);row('پرداخت‌شده',T(s.paid));row('مانده',T(s.total-s.paid));hr();if(db.shop.footer){tx_(fit(db.shop.footer,W-2*pd),W/2,'center');y+=fs*1.6}
 const o=document.createElement('canvas');o.width=W*S;o.height=Math.ceil((y+pd)*S);o.getContext('2d').drawImage(cv,0,0);return o}
function pdfFromJpeg(jpeg,w,h,fmt){const pw=fmt==='a4'?595.28:fmt==='f80'?226.77:164.41,ph0=pw*h/w,ph=fmt==='a4'?Math.max(841.89,ph0):ph0,enc=new TextEncoder(),parts=[],offs=[];let len=0;
 const push=u=>{parts.push(u);len+=u.length},S=t=>push(enc.encode(t)),obj=(n,b)=>{offs[n]=len;S(n+' 0 obj\n'+b+'\nendobj\n')};
 S('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw.toFixed(2)} ${ph.toFixed(2)}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
 offs[4]=len;S(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);push(jpeg);S('\nendstream\nendobj\n');
 const c=`q ${pw.toFixed(2)} 0 0 ${ph0.toFixed(2)} 0 ${(ph-ph0).toFixed(2)} cm /Im0 Do Q`;obj(5,`<< /Length ${c.length} >>\nstream\n${c}\nendstream`);
 const x0=len;S('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)S(String(offs[i]).padStart(10,'0')+' 00000 n \n');S(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${x0}\n%%EOF`);
 const out=new Uint8Array(len);let p=0;parts.forEach(u=>{out.set(u,p);p+=u.length});return out}
const invPdf=(s,fmt)=>{const cv=invCanvas(s,fmt),b=atob(cv.toDataURL('image/jpeg',.92).split(',')[1]);return new Blob([pdfFromJpeg(Uint8Array.from(b,c=>c.charCodeAt(0)),cv.width,cv.height,fmt)],{type:'application/pdf'})};
const invPng=(s,fmt)=>new Promise(r=>invCanvas(s,fmt).toBlob(r,'image/png'));
async function shareFile(blob,name,text){if(window.AndroidBridge){AndroidBridge.shareFile(name,await blobB64(blob),blob.type,text||'');return}const f=new File([blob],name,{type:blob.type});try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text,title:name});return}}catch(e){if(e.name==='AbortError')return}
 dlf(name,blob,blob.type);toast('اشتراک‌گذاری مستقیم در این حالت ممکن نبود؛ فایل ذخیره شد و می‌توانید از هر برنامه‌ای ارسالش کنید.')}
function pageStyle(fmt){let st=document.getElementById('pgst');if(!st){st=document.createElement('style');st.id='pgst';document.head.appendChild(st)}st.textContent=`@page{size:${fmt==='a4'?'A4':fmt==='f80'?'80mm auto':'58mm auto'};margin:${fmt==='a4'?'10mm':'2mm'}}`}
function printHTML(html,fmt){const p=$('#pr');p.className=fmt;p.innerHTML=html;pageStyle(fmt);window.AndroidBridge?AndroidBridge.printPage():window.print()}
function showInv(id){const s=db.sales.find(x=>x.id===id);if(!s)return;const c=cust(s.cid),f0=db.pfmt||'a4';
 modal(`<div id="ip">${invHTML(s)}</div><label>قالب</label><select id="fm"><option value="a4">A4</option><option value="f80">پرینتر حرارتی ۸۰ میلی‌متر</option><option value="f58">پرینتر حرارتی ۵۸ میلی‌متر</option></select>
 <button class="b" id="bp">چاپ</button><button class="b" id="bd">ذخیره PDF</button><button class="b" id="bs">اشتراک PDF</button><button class="b s" id="bi">تصویر PNG</button>
 <div class="k" style="margin-top:8px">ارسال متن فاکتور:</div><button class="b s" id="bw">واتساپ</button><button class="b s" id="bt">تلگرام</button><button class="b s" id="bm">پیامک</button><button class="b s" id="be">ایمیل</button><button class="b s" id="bc">کپی</button>
 ${s.lines.length?'<button class="b s" id="rt">مرجوعی</button>':''}<button class="b s" id="no">بستن</button>`);$('#fm').value=f0;$('#no').onclick=close;
 const fm=()=>{db.pfmt=$('#fm').value;return db.pfmt},nm=()=>'invoice-'+(s.no||'old'),txt=()=>fill(db.tpl.invoice,c,{no:s.no,amt:T(s.total)})+'\n\n'+invText(s);
 $('#bp').onclick=()=>printHTML(invHTML(s),fm());$('#bd').onclick=()=>{dlf(nm()+'.pdf',invPdf(s,fm()),'application/pdf');toast('PDF ذخیره شد')};
 $('#bs').onclick=()=>shareFile(invPdf(s,fm()),nm()+'.pdf',txt());$('#bi').onclick=async()=>shareFile(await invPng(s,fm()),nm()+'.png',txt());
 const ph=c?'98'+c.phone.slice(1):'';$('#bw').onclick=()=>location.href=`https://wa.me/${ph}?text=${encodeURIComponent(txt())}`;$('#bt').onclick=()=>location.href=`https://t.me/share/url?url=%20&text=${encodeURIComponent(txt())}`;
 $('#bm').onclick=()=>location.href=`sms:${c?c.phone:''}?body=${encodeURIComponent(txt())}`;$('#be').onclick=()=>location.href=`mailto:?subject=${encodeURIComponent('فاکتور '+(s.no||'')+' '+db.shop.name)}&body=${encodeURIComponent(txt())}`;
 $('#bc').onclick=()=>navigator.clipboard?.writeText(txt()).then(()=>toast('کپی شد'));if(s.lines.length)$('#rt').onclick=()=>{close();retForm(id)}}
/* --- حسابداری پیشرفته: سند دستی، صندوق و بانک، چک، حساب‌ها، صورت‌حساب --- */
G.acc=function(){modal(`<h3>حسابداری</h3><button class="b" data-x="jv">سند دستی</button><button class="b" data-x="cash">صندوق و بانک</button><button class="b" data-x="chq">چک‌ها</button><button class="b s" data-x="accs">فهرست حساب‌ها</button><button class="b s" data-x="rep">گزارش‌ها و دفاتر</button><button class="b s" data-x="close">بستن دوره</button><button class="b s" id="no">بستن</button>`);
 $('#no').onclick=close;$('#dlg').onclick=e=>{const x=e.target.dataset.x;if(x==='rep')report();else if(x)G[x]()}};
G.jv=function(){const opt=db.accounts.filter(a=>!['1103','1104','1105','2101','2102'].includes(a[0])).map(a=>`<option value="${a[0]}">${fa(a[0])} ${a[1]}</option>`).join('');
 const row=i=>`<div class="row" style="flex-wrap:wrap"><select data-r="${i}a" style="flex:2 1 100%">${opt}</select><input data-r="${i}d" placeholder="بدهکار" inputmode="numeric" style="flex:1"><input data-r="${i}c" placeholder="بستانکار" inputmode="numeric" style="flex:1"></div>`;
 modal(`<h3>سند دستی</h3><div class="k">حساب‌های مطالبات، موجودی کالا، بدهی تأمین‌کنندگان و اسناد (چک) فقط از طریق عملیات مربوط قابل ثبت‌اند.</div><label>تاریخ</label><input id="jd1" class="jd" readonly value="${toJ()}"><label>شرح</label><input id="jx">${[0,1,2,3].map(row).join('')}<div class="err" id="e"></div><button class="b" id="ok">ثبت سند</button><button class="b s" id="no">لغو</button>`);
 $('#no').onclick=close;$('#ok').onclick=async()=>{const L=[],E=$('#e');let both=false;[0,1,2,3].forEach(i=>{const a=$(`[data-r="${i}a"]`).value,d=num($(`[data-r="${i}d"]`).value),c=num($(`[data-r="${i}c"]`).value);if(d&&c)both=true;else if(d||c)L.push(d?{a,d}:{a,c})});
  if(both)return E.textContent='هر ردیف فقط یک طرف (بدهکار یا بستانکار) داشته باشد.';if(L.length<2)return E.textContent='حداقل دو ردیف لازم است.';
  const D=L.reduce((s,l)=>s+(l.d||0),0),C=L.reduce((s,l)=>s+(l.c||0),0);if(D!==C)return E.textContent=`سند متوازن نیست: بدهکار ${T(D)} — بستانکار ${T(C)}`;if(!$('#jx').value.trim())return E.textContent='شرح سند را وارد کنید.';
  if(await tx(()=>post(normJ($('#jd1').value),'سند دستی: '+$('#jx').value.trim(),L,'manual'))){close();toast('سند ثبت شد')}}};
G.cash=function(){const A=[['1101','صندوق'],['1102','بانک']];modal(`<h3>صندوق و بانک</h3><div class="row"><span>صندوق</span><b>${T(bal('1101'))}</b></div><div class="row"><span>بانک</span><b>${T(bal('1102'))}</b></div>
 <label>عملیات</label><select id="ct"><option value="tr">انتقال بین صندوق و بانک</option><option value="cap">واریز سرمایه</option><option value="draw">برداشت مالک</option><option value="fee">کارمزد بانکی</option></select>
 <label>از / حساب</label><select id="ca">${A.map(a=>`<option value="${a[0]}">${a[1]}</option>`).join('')}</select><label>مبلغ</label><input id="am" inputmode="numeric"><div class="err" id="e"></div><button class="b" id="ok">ثبت</button><button class="b s" id="no">بستن</button>`);$('#no').onclick=close;
 $('#ok').onclick=async()=>{const t=$('#ct').value,a=$('#ca').value,m=num($('#am').value),o=a==='1101'?'1102':'1101';if(m<=0)return $('#e').textContent='مبلغ معتبر وارد کنید.';
  if(t!=='cap'&&bal(a)<m)return $('#e').textContent='موجودی حساب کافی نیست.';
  const doc={tr:['انتقال وجه',[{a:o,d:m},{a,c:m}]],cap:['واریز سرمایه',[{a,d:m},{a:'3101',c:m}]],draw:['برداشت مالک',[{a:'3103',d:m},{a,c:m}]],fee:['کارمزد بانکی',[{a:'6102',d:m},{a,c:m}]]}[t];
  if(await tx(()=>post(toJ(),doc[0],doc[1],'cash'))){close();toast('ثبت شد')}}};
G.accs=function(){modal(`<h3>فهرست حساب‌ها</h3>${db.accounts.slice().sort((a,b)=>a[0].localeCompare(b[0])).map(a=>`<div class="row"><span>${fa(a[0])} ${esc(a[1])}</span><b>${T(bal(a[0]))}</b></div>`).join('')}<label>کد حساب جدید (۴ رقم)</label><input id="ac" inputmode="numeric"><label>نام</label><input id="an"><div class="err" id="e"></div><button class="b" id="ok">افزودن حساب</button><button class="b s" id="no">بستن</button>`);$('#no').onclick=close;
 $('#ok').onclick=async()=>{const c=en($('#ac').value).trim(),n=$('#an').value.trim();if(!/^[1-6]\d{3}$/.test(c))return $('#e').textContent='کد باید ۴ رقم و با ۱ تا ۶ شروع شود.';if(!n)return $('#e').textContent='نام را وارد کنید.';if(db.accounts.some(a=>a[0]===c))return $('#e').textContent='این کد قبلاً وجود دارد.';if(await tx(()=>db.accounts.push([c,n])))G.accs()}};
function recvAlloc(cid,amt){const al=[];let a=amt;cSales(cid).filter(s=>s.total>s.paid).forEach(s=>{if(a<=0)return;const t=Math.min(a,s.total-s.paid);s.paid+=t;a-=t;s.status=s.paid>=s.total?'paid':'part';al.push({sid:s.id,amt:t})});if(a>0)throw new Error('مبلغ از بدهی مشتری بیشتر است.');return al}
function mkCheque(o){if(!(o.amt>0))throw new Error('مبلغ چک معتبر نیست.');if(!validJ(o.due))throw new Error('تاریخ سررسید معتبر نیست.');if(!o.no)throw new Error('شماره چک را وارد کنید.');if(!o.party)throw new Error('طرف حساب را انتخاب کنید.');
 const id=uid(),c={id,...o,due:normJ(o.due),status:'open',alloc:[],date:toJ()};db.cheques=db.cheques||[];
 if(o.type==='in'){c.alloc=recvAlloc(o.party,o.amt);post(toJ(),'دریافت چک '+o.no,[{a:'1105',d:o.amt},{a:'1103',c:o.amt}],id)}
 else{if(supBal(o.party)<o.amt)throw new Error('مبلغ از بدهی تأمین‌کننده بیشتر است.');post(toJ(),'صدور چک '+o.no,[{a:'2101',d:o.amt,p:o.party},{a:'2102',c:o.amt}],id)}
 db.cheques.push(c);db.reminders.push({id:uid(),cid:o.type==='in'?o.party:'',title:(o.type==='in'?'سررسید چک دریافتی ':'سررسید چک پرداختی ')+o.no+' — '+T(o.amt),date:c.due,done:false,ref:id,type:'چک'});return id}
function setCheque(id,act,acct){const c=db.cheques.find(x=>x.id===id);if(!c||c.status!=='open')throw new Error('وضعیت چک اجازه این کار را نمی‌دهد.');
 if(c.type==='in'){if(act==='ok')post(toJ(),'وصول چک '+c.no,[{a:acct,d:c.amt},{a:'1105',c:c.amt}],id);else{post(toJ(),'برگشت چک '+c.no,[{a:'1103',d:c.amt},{a:'1105',c:c.amt}],id);c.alloc.forEach(x=>{const s=db.sales.find(y=>y.id===x.sid);if(s){s.paid-=x.amt;s.status=s.paid>=s.total?'paid':s.paid>0?'part':'unpaid'}})}}
 else if(act==='ok')post(toJ(),'پاس شدن چک '+c.no,[{a:'2102',d:c.amt},{a:acct,c:c.amt}],id);else post(toJ(),'ابطال چک '+c.no,[{a:'2102',d:c.amt},{a:'2101',c:c.amt,p:c.party}],id);
 c.status=act==='ok'?'done':'bad';c.statusDate=toJ();db.reminders.forEach(r=>{if(r.ref===id)r.done=true})}
G.chq=function(){const nm=c=>c.type==='in'?cust(c.party)?.name:sup(c.party)?.name,ST={open:'باز',done:'انجام‌شده',bad:'برگشتی/باطل'};
 modal(`<h3>چک‌ها</h3><button class="b" id="ci">+ چک دریافتی</button><button class="b" id="co">+ چک پرداختی</button>${(db.cheques||[]).slice().reverse().slice(0,40).map(c=>`<div class="card" data-c="${c.id}"><b>${c.type==='in'?'دریافتی':'پرداختی'} ${esc(c.no)}</b> <span class="k">${esc(nm(c)||'')} · ${esc(c.bank||'')}</span><div>${T(c.amt)} — سررسید ${fa(c.due)} — ${ST[c.status]}</div>${c.status==='open'?`<button class="b s" data-a="ok">${c.type==='in'?'وصول':'پاس شد'}</button><button class="b s d" data-a="bad">${c.type==='in'?'برگشت':'ابطال'}</button>`:''}</div>`).join('')||'<div class="k">چکی ثبت نشده است.</div>'}<button class="b s" id="no">بستن</button>`);
 $('#no').onclick=close;$('#ci').onclick=()=>chqForm('in');$('#co').onclick=()=>chqForm('out');
 $('#dlg').onclick=async e=>{const a=e.target.dataset.a,id=e.target.closest('[data-c]')?.dataset.c;if(!a)return;if(await tx(()=>setCheque(id,a,'1102'))){toast('ثبت شد');G.chq()}}};
function chqForm(type){const ps=type==='in'?db.customers.filter(c=>cDebt(c.id)>0).map(c=>[c.id,c.name+' — '+T(cDebt(c.id))]):db.suppliers.filter(x=>supBal(x.id)>0).map(x=>[x.id,x.name+' — '+T(supBal(x.id))]);if(!ps.length)return toast(type==='in'?'مشتری بدهکاری وجود ندارد.':'تأمین‌کننده‌ای با بدهی وجود ندارد.');
 modal(`<h3>چک ${type==='in'?'دریافتی':'پرداختی'}</h3><label>${type==='in'?'مشتری':'تأمین‌کننده'}</label><select id="pt">${ps.map(p=>`<option value="${p[0]}">${esc(p[1])}</option>`).join('')}</select><label>شماره چک</label><input id="cn" inputmode="numeric"><label>بانک</label><input id="cb"><label>مبلغ</label><input id="ca" inputmode="numeric"><label>تاریخ سررسید</label><input id="cd" class="jd" readonly placeholder="انتخاب تاریخ"><div class="err" id="e"></div><button class="b" id="ok">ثبت</button><button class="b s" id="no">لغو</button>`);
 $('#no').onclick=()=>G.chq();$('#ok').onclick=async()=>{if(await tx(()=>mkCheque({type,party:$('#pt').value,no:en($('#cn').value).trim(),bank:$('#cb').value.trim(),amt:num($('#ca').value),due:$('#cd').value})))G.chq()}}
function stmtCust(id){const c=cust(id),ss=cSales(id).slice().sort((a,b)=>a.date.localeCompare(b.date));
 const h=`<div class="inv"><h2>${esc(db.shop.name)}</h2><div>صورت‌حساب مشتری: ${esc(c.name)} — ${fa(toJ())}</div><table><tr><th>تاریخ</th><th>فاکتور</th><th>مبلغ</th><th>پرداخت</th><th>مانده</th></tr>${ss.map(s=>`<tr><td>${fa(s.date)}</td><td>${s.no?fa(s.no):'قدیمی'}</td><td>${T(s.total)}</td><td>${T(s.paid)}</td><td>${T(s.total-s.paid)}</td></tr>`).join('')}</table><div><b>مانده کل: ${T(cDebt(id))}</b></div></div>`;
 modal(`<div class="tbl">${h}</div><button class="b" id="pp">چاپ</button><button class="b s" id="no">بستن</button>`);$('#no').onclick=close;$('#pp').onclick=()=>printHTML(h,'a4')}

/* ================= دسته‌بندی هزینه‌ها ================= */
const EXPCAT=['اجاره','حقوق','آب','برق','گاز','اینترنت','تلفن','حمل‌ونقل','بسته‌بندی','خرید ملزومات','تبلیغات','هزینه بازاریابی','تعمیرات','کارمزد بانکی','هزینه ارسال','مالیات','بیمه','هزینه‌های اداری','هزینه‌های متفرقه'];
function ensureCats(){db.expCats=db.expCats||[];if(!db.expCats.length)EXPCAT.forEach((n,i)=>db.expCats.push({id:'c'+i,name:n,acc:n==='کارمزد بانکی'?'6102':n==='هزینه‌های متفرقه'?'6101':'61'+(10+i)}));
 db.expCats.forEach(c=>{if(!db.accounts.some(a=>a[0]===c.acc))db.accounts.push([c.acc,'هزینه '+c.name])});if(!db.accounts.some(a=>a[0]==='2103'))db.accounts.push(['2103','هزینه‌های پرداخت‌نشده'])}
function addCat(name){name=name.trim();if(!name)throw new Error('نام دسته را وارد کنید.');if(db.expCats.some(c=>c.name===name))throw new Error('این دسته وجود دارد.');
 const mx=Math.max(6129,...db.expCats.map(c=>+c.acc)),c={id:uid(),name,acc:String(mx+1)};db.expCats.push(c);ensureCats();return c.id}
const addMonths=ds=>{let[y,m,d]=ds.split('/').map(Number);m++;if(m>12){m=1;y++}return y+'/'+pad2(m)+'/'+pad2(Math.min(d,jDim(y,m)))};
function mkExpense(o){const cat=db.expCats.find(c=>c.id===o.cat);if(!cat)throw new Error('دسته هزینه را انتخاب کنید.');if(!o.desc)throw new Error('شرح هزینه را وارد کنید.');if(!Number.isSafeInteger(o.amt)||o.amt<=0)throw new Error('مبلغ معتبر نیست.');if(!['1101','1102','2103'].includes(o.method))throw new Error('روش پرداخت هزینه نامعتبر است.');
 const date=normJ(o.date||toJ());if(!validJ(date))throw new Error('تاریخ معتبر نیست.');const id=uid();
 post(date,'هزینه '+cat.name+': '+o.desc,[{a:cat.acc,d:o.amt},{a:o.method,c:o.amt}],id);
 db.expenses.push({id,date,desc:o.desc,amt:o.amt,from:o.method,cat:cat.id,acc:cat.acc,paid:o.method==='2103'?0:o.amt});
 if(o.recur)db.reminders.push({id:uid(),title:'هزینه تکراری: '+cat.name+' — '+o.desc+' ('+T(o.amt)+')',date:addMonths(date),done:false,ref:id,type:'هزینه تکراری',tpl:{cat:o.cat,desc:o.desc,amt:o.amt,method:o.method}});return id}
function payExpense(id,amt,from){const e=db.expenses.find(x=>x.id===id);if(!e||e.from!=='2103')throw new Error('این هزینه نسیه نیست.');const owed=e.amt-(e.paid||0);if(!(amt>0)||amt>owed)throw new Error('مبلغ باید بین ۱ و مانده‌ی هزینه باشد.');
 post(toJ(),'تسویه هزینه: '+e.desc,[{a:'2103',d:amt},{a:from,c:amt}],id);e.paid=(e.paid||0)+amt}
G.expl=function(){const mon=toJ().slice(0,7),cn=id=>db.expCats.find(c=>c.id===id)?.name||'—',by={};db.expenses.filter(e=>e.date.startsWith(mon)).forEach(e=>by[cn(e.cat)]=(by[cn(e.cat)]||0)+e.amt);
 modal(`<h3>هزینه‌ها</h3><b>این ماه به تفکیک دسته</b>${Object.entries(by).map(([k,v])=>`<div class="row"><span>${esc(k)}</span><b>${T(v)}</b></div>`).join('')||'<div class="k">هزینه‌ای در این ماه ثبت نشده است.</div>'}<button class="b" id="ne">+ هزینه</button><hr>
 ${db.expenses.slice().reverse().slice(0,40).map(e=>{const owed=e.from==='2103'?e.amt-(e.paid||0):0;return `<div class="row" data-e="${e.id}"><span>${fa(e.date)} — ${esc(cn(e.cat))}<br><span class="k">${esc(e.desc)}</span></span><span>${T(e.amt)}${owed?`<br><button class="b s" style="margin:0;min-height:36px" data-p="1">تسویه ${T(owed)}</button>`:''}</span></div>`}).join('')}<button class="b s" id="no">بستن</button>`);
 $('#no').onclick=close;$('#ne').onclick=()=>{close();expForm()};
 $('#dlg').onclick=e=>{const id=e.target.closest('[data-e]')?.dataset.e;if(!e.target.dataset.p||!id)return;const x=db.expenses.find(y=>y.id===id);
  modal(`<h3>تسویه هزینه</h3><div class="k">${esc(x.desc)} — مانده ${T(x.amt-(x.paid||0))}</div><label>مبلغ</label><input id="a" value="${x.amt-(x.paid||0)}" inputmode="numeric"><label>از</label><select id="m"><option value="1101">صندوق</option><option value="1102">بانک</option></select><div class="err" id="e"></div><button class="b" id="ok">ثبت</button><button class="b s" id="no">لغو</button>`);
  $('#no').onclick=()=>G.expl();$('#ok').onclick=async()=>{if(await tx(()=>payExpense(id,num($('#a').value),$('#m').value)))G.expl()}}};
/* ================= ارسال گروهی و تاریخچه کمپین ================= */
const lastBuy=id=>cSales(id).map(s=>s.date).sort().pop()||'';
function audience(f){const t=toJ();let l=db.customers.slice();
 if(f.kind==='level')l=l.filter(c=>level(cPoints(c.id))===f.level);if(f.kind==='debtors')l=l.filter(c=>cDebt(c.id)>0);
 if(f.kind==='bdMonth')l=l.filter(c=>c.birth&&normJ(c.birth).slice(5,7)===t.slice(5,7));
 if(f.kind==='inactive')l=l.filter(c=>{const b=lastBuy(c.id);return b&&jdiff(t,b)>=(f.days||90)});
 if(f.kind==='never')l=l.filter(c=>!cSales(c.id).length);if(f.kind==='buyers')l=l.filter(c=>cSales(c.id).length>0);
 const seen=new Set(),list=[],ex={consent:0,dup:0,bad:0};
 l.forEach(c=>{if(!normPhone(c.phone)){ex.bad++;return}if(f.promo&&c.promo===false){ex.consent++;return}if(seen.has(c.phone)){ex.dup++;return}seen.add(c.phone);list.push(c)});return{list,ex}}
function mkCampaign(o){if(!o.title)throw new Error('عنوان کمپین را وارد کنید.');if(!o.text.trim())throw new Error('متن پیام خالی است.');if(!['sms','wa','tg'].includes(o.ch))throw new Error('کانال نامعتبر است.');
 const a=audience(o.f);if(!a.list.length)throw new Error('هیچ مخاطب مجازی پیدا نشد.');const id=uid();
 db.campaigns.push({id,date:toJ(),time:new Date().toTimeString().slice(0,5),title:o.title,ch:o.ch,tpl:o.tpl,text:o.text,promo:!!o.f.promo,rate:o.rate||5,filter:o.f,excluded:a.ex,status:'open',recips:a.list.map(c=>({cid:c.id,status:'pending'}))});return id}
function markRecip(cid_,idx,st){const c=db.campaigns.find(x=>x.id===cid_),r=c&&c.recips[idx];if(!r||r.status!=='pending')throw new Error('این مخاطب قبلاً ثبت شده است.');
 r.status=st;r.at=toJ();if(st==='sent')db.comms.push({id:uid(),cid:r.cid,date:toJ(),ch:{sms:'پیامک',wa:'واتساپ',tg:'تلگرام'}[c.ch],title:c.title,camp:c.id});if(!c.recips.some(x=>x.status==='pending'))c.status='done'}
const cnt=c=>{const n={sent:0,skipped:0,pending:0};c.recips.forEach(r=>n[r.status]++);return n};
const CHN={sms:'پیامک',wa:'واتساپ',tg:'تلگرام'};
function openExt(u){if(window.AndroidBridge||u.startsWith('sms:')||u.startsWith('mailto:'))location.href=u;else window.open(u,'_blank','noopener')}
const msgFor=(c,camp)=>{const last=cSales(c.id).slice().sort((a,b)=>a.date.localeCompare(b.date)).pop();return fill(camp.text,c,{pd:last?last.date:'',pn:last?(last.desc||(last.lines[0]&&prod(last.lines[0].pid)?.name)||''):''})};
G.camp=function(){modal(`<h3>ارسال گروهی</h3><button class="b" id="nw">+ کمپین جدید</button>${db.campaigns.slice().reverse().map(c=>{const n=cnt(c);return `<div class="card" data-k="${c.id}"><b>${esc(c.title)}</b> <span class="k">${fa(c.date)} · ${CHN[c.ch]}</span><div class="k">ارسال‌شده ${fa(n.sent)} · ردشده ${fa(n.skipped)} · باقی‌مانده ${fa(n.pending)}</div><button class="b s">${n.pending?'ادامه':'مشاهده'}</button></div>`}).join('')||'<div class="k">کمپینی ثبت نشده است.</div>'}<button class="b s" id="no">بستن</button>`);
 $('#no').onclick=close;$('#nw').onclick=campNew;$('#dlg').onclick=e=>{const k=e.target.closest('[data-k]')?.dataset.k;if(k&&e.target.tagName==='BUTTON')campRun(k)}};
function campNew(){const keys=Object.keys(DEFTPL);modal(`<h3>کمپین جدید</h3><label>عنوان</label><input id="ct"><label>مخاطبان</label><select id="ck"><option value="all">همه‌ی مشتریان</option><option value="buyers">مشتریان دارای خرید</option><option value="level">بر اساس سطح باشگاه</option><option value="debtors">مشتریان بدهکار</option><option value="bdMonth">متولدین این ماه</option><option value="inactive">بدون خرید در N روز اخیر</option><option value="never">بدون هیچ خرید</option></select>
 <label>سطح (برای «بر اساس سطح»)</label><select id="cl">${db.loyalty.levels.map(l=>`<option>${l[0]}</option>`).join('')}</select><label>N روز (برای «بدون خرید»)</label><input id="cdv" value="90" inputmode="numeric">
 <label>قالب</label><select id="tp">${keys.map(k=>`<option value="${k}">${DEFTPL[k][0]}</option>`).join('')}</select><label>کانال</label><select id="ch"><option value="wa">واتساپ</option><option value="sms">پیامک</option><option value="tg">تلگرام</option></select>
 <label>متن (قابل ویرایش)</label><textarea id="tx" rows="4"></textarea><label><input type="checkbox" id="pm" style="width:auto;min-height:0"> پیام تبلیغاتی (فقط برای مشتریان موافق)</label><label>حداقل فاصله بین دو ارسال (ثانیه)</label><input id="rt" value="5" inputmode="numeric">
 <div class="card" id="ca" style="margin-top:8px"></div><div class="err" id="e"></div><button class="b" id="ok">ایجاد کمپین</button><button class="b s" id="no">لغو</button>`);
 const f=()=>({kind:$('#ck').value,level:$('#cl').value,days:num($('#cdv').value)||90,promo:$('#pm').checked}),up=()=>{const a=audience(f());$('#ca').innerHTML=`<b>${fa(a.list.length)} مخاطب مجاز</b><div class="k">بدون رضایت تبلیغاتی: ${fa(a.ex.consent)} · شماره‌ی تکراری: ${fa(a.ex.dup)} · شماره‌ی نامعتبر: ${fa(a.ex.bad)}</div>`};
 const tpl=()=>{$('#tx').value=db.tpl[$('#tp').value];$('#pm').checked=PROMO.includes($('#tp').value);up()};$('#tp').onchange=tpl;['#ck','#cl','#cdv','#pm'].forEach(i=>$(i).onchange=up);tpl();$('#no').onclick=()=>G.camp();
 $('#ok').onclick=async()=>{let id;if(await tx(()=>{id=mkCampaign({title:$('#ct').value.trim(),f:f(),tpl:$('#tp').value,ch:$('#ch').value,text:$('#tx').value,rate:num($('#rt').value)||5})}))campRun(id)}}
let lastOpen=0;
function campRun(id){const c=db.campaigns.find(x=>x.id===id),n=cnt(c),i=c.recips.findIndex(r=>r.status==='pending'),tot=c.recips.length;
 if(i<0){modal(`<h3>${esc(c.title)}</h3><div class="pos">کمپین کامل شد.</div><div class="row"><span>ارسال‌شده</span><b>${fa(n.sent)}</b></div><div class="row"><span>ردشده</span><b>${fa(n.skipped)}</b></div>${c.recips.filter(r=>r.status==='sent').slice(0,60).map(r=>`<div class="row"><span>${esc(cust(r.cid)?.name||'؟')}</span><span class="k">${fa(r.at)}</span></div>`).join('')}<button class="b s" id="no">بستن</button>`);$('#no').onclick=()=>G.camp();return}
 const r=c.recips[i],cu=cust(r.cid);if(!cu){tx(()=>markRecip(id,i,'skipped')).then(()=>campRun(id));return}
 const text=msgFor(cu,c),p='98'+cu.phone.slice(1),url=c.ch==='sms'?`sms:${cu.phone}?body=${encodeURIComponent(text)}`:c.ch==='wa'?`https://wa.me/${p}?text=${encodeURIComponent(text)}`:`https://t.me/+${p}`;
 modal(`<h3>${esc(c.title)}</h3><div class="k">${fa(n.sent+n.skipped+1)} از ${fa(tot)} · ${CHN[c.ch]}</div><div class="card"><b>${esc(cu.name)}</b> <span class="k">${esc(cu.phone)}</span><div style="white-space:pre-wrap;margin-top:6px">${esc(text)}</div></div>
 <button class="b" id="op">۱) باز کردن ${CHN[c.ch]}</button><button class="b" id="sd">۲) ارسال شد ✓</button><button class="b s" id="sk">رد کردن</button><button class="b s" id="st">توقف (بعداً ادامه می‌دهم)</button>
 <div class="k">ارسال نهایی را شما در برنامه‌ی مقصد انجام می‌دهید؛ «ارسال شد» را فقط پس از ارسال بزنید. ارسال خودکار واقعی نیازمند سرویس پیامکی است و فعلاً متصل نیست.</div>`);
 $('#op').onclick=()=>{const w=c.rate*1000-(Date.now()-lastOpen);if(w>0)return toast('برای رعایت فاصله‌ی ارسال، '+fa(Math.ceil(w/1000))+' ثانیه صبر کنید.');lastOpen=Date.now();openExt(url)};
 $('#sd').onclick=async()=>{if(await tx(()=>markRecip(id,i,'sent')))campRun(id)};$('#sk').onclick=async()=>{if(await tx(()=>markRecip(id,i,'skipped')))campRun(id)};$('#st').onclick=()=>G.camp()}
window.__back=()=>{const ds=[...document.querySelectorAll('dialog[open]')];if(ds.length){ds[ds.length-1].close();return true}if(['sec','set','task','cal'].includes(tab)){tab='more';render();return true}if(tab!=='dash'){tab='dash';render();return true}return false};

/* ================= فیلتر مشتریان، ویرایش/حذف مشتری و کالا ================= */
let cf={q:'',kind:'all',level:'',days:90,sort:'name',min:0,page:0};const PG=40;
function filterCust(f){const t=toJ(),k=nz(f.q),M={};
 const met=c=>M[c.id]||(M[c.id]=(()=>{const ss=cSales(c.id);return{debt:cDebt(c.id),tot:ss.reduce((a,x)=>a+x.total,0),last:ss.map(x=>x.date).sort().pop()||'',n:ss.length,pt:cPoints(c.id)}})());
 let l=db.customers.filter(c=>f.kind==='archived'?c.archived:!c.archived);
 if(k)l=l.filter(c=>nz(c.name).includes(k)||c.phone.includes(k));
 if(f.kind==='debtors')l=l.filter(c=>met(c).debt>0);if(f.kind==='level')l=l.filter(c=>level(met(c).pt)===f.level);
 if(f.kind==='bdMonth')l=l.filter(c=>c.birth&&normJ(c.birth).slice(5,7)===t.slice(5,7));if(f.kind==='bdToday')l=l.filter(c=>c.birth&&normJ(c.birth).slice(5)===t.slice(5));
 if(f.kind==='inactive')l=l.filter(c=>met(c).last&&jdiff(t,met(c).last)>=f.days);if(f.kind==='never')l=l.filter(c=>!met(c).n);if(f.kind==='buyers')l=l.filter(c=>met(c).n>0);
 if(f.kind==='noPromo')l=l.filter(c=>c.promo===false);if(f.kind==='dup')l=l.filter(c=>db.customers.filter(x=>x.phone===c.phone).length>1);
 if(f.min>0)l=l.filter(c=>met(c).tot>=f.min);
 const S={name:(a,b)=>a.name.localeCompare(b.name,'fa'),debt:(a,b)=>met(b).debt-met(a).debt,total:(a,b)=>met(b).tot-met(a).tot,last:(a,b)=>met(b).last.localeCompare(met(a).last),points:(a,b)=>met(b).pt-met(a).pt,newest:(a,b)=>(b.created||'').localeCompare(a.created||'')};
 return{list:l.sort(S[f.sort]||S.name),met}}
R.cust=()=>{const{list,met}=filterCust(cf),pages=Math.max(1,Math.ceil(list.length/PG));if(cf.page>=pages)cf.page=pages-1;const sl=list.slice(cf.page*PG,(cf.page+1)*PG);
 const K=[['all','همه'],['debtors','بدهکاران'],['level','بر اساس سطح'],['buyers','دارای خرید'],['never','بدون خرید'],['inactive','بدون خرید در N روز'],['bdToday','تولد امروز'],['bdMonth','تولد این ماه'],['noPromo','بدون رضایت تبلیغاتی'],['dup','شماره‌ی تکراری'],['archived','بایگانی‌شده']];
 V.innerHTML=`<input id="q" placeholder="جستجوی نام یا موبایل" value="${esc(cf.q)}"><div class="grid" style="margin-top:6px"><div><label for="fk">فیلتر</label><select id="fk">${K.map(k=>`<option value="${k[0]}"${cf.kind===k[0]?' selected':''}>${k[1]}</option>`).join('')}</select></div>
 <div><label for="fs">مرتب‌سازی</label><select id="fs">${[['name','نام'],['debt','بدهی'],['total','مجموع خرید'],['last','آخرین خرید'],['points','امتیاز'],['newest','جدیدترین']].map(k=>`<option value="${k[0]}"${cf.sort===k[0]?' selected':''}>${k[1]}</option>`).join('')}</select></div></div>
 ${cf.kind==='level'?`<label>سطح</label><select id="fl">${db.loyalty.levels.map(l=>`<option${(cf.level||db.loyalty.levels[0][0])===l[0]?' selected':''}>${l[0]}</option>`).join('')}</select>`:''}
 ${cf.kind==='inactive'?`<label>تعداد روز</label><input id="fd" value="${cf.days}" inputmode="numeric">`:''}
 <label>حداقل مجموع خرید (تومان)</label><input id="fm" value="${cf.min||''}" inputmode="numeric" placeholder="بدون محدودیت">
 <div class="k" style="margin:8px 0">${fa(list.length)} مشتری${list.length?` — مجموع بدهی: ${T(list.reduce((s,c)=>s+met(c).debt,0))}`:''}</div>
 <button class="b" id="addC">+ مشتری جدید</button><button class="b s" id="mg">ادغام تکراری‌ها</button><button class="b s" id="cx">خروجی CSV فهرست</button>
 ${sl.length?sl.map(c=>{const m=met(c);return `<div class="card" data-id="${c.id}"><b>${esc(c.name)}</b> <span class="k">${esc(c.phone)}</span>${c.dupPhone?'<span class="bd">شماره‌ی تکراری</span>':''}${c.archived?'<span class="bd">بایگانی</span>':''}
 <div class="k">${level(m.pt)} · امتیاز ${fa(m.pt)} · خرید ${fa(m.n)} (${T(m.tot)})${m.last?' · آخرین: '+fa(m.last):''}</div>${m.debt>0?`<div class="neg">بدهی: ${T(m.debt)}</div>`:''}
 <button class="b s" data-act="p360">پرونده</button><button class="b s" data-act="msg">پیام</button><button class="b s" data-act="edit">ویرایش</button>${c.archived?'<button class="b s" data-act="restore">بازگردانی</button>':''}<button class="b s d" data-act="del" style="color:#fff">حذف</button></div>`}).join(''):'<div class="card k">مشتری‌ای با این فیلتر پیدا نشد.</div>'}
 ${pages>1?`<div class="row"><button class="b s" id="pv" ${cf.page?'':'disabled'}>قبلی</button><span>${fa(cf.page+1)} / ${fa(pages)}</span><button class="b s" id="nx" ${cf.page<pages-1?'':'disabled'}>بعدی</button></div>`:''}`;
 $('#q').oninput=e=>{cf.q=e.target.value;cf.page=0;const p=e.target.selectionStart;R.cust();const i=$('#q');i.focus();i.setSelectionRange(p,p)};
 $('#fk').onchange=e=>{cf.kind=e.target.value;cf.page=0;R.cust()};$('#fs').onchange=e=>{cf.sort=e.target.value;R.cust()};if($('#fl'))$('#fl').onchange=e=>{cf.level=e.target.value;cf.page=0;R.cust()};
 if(cf.kind==='level'&&!cf.level){cf.level=db.loyalty.levels[0][0];R.cust();return}
 if($('#fd'))$('#fd').onchange=e=>{cf.days=num(e.target.value)||90;cf.page=0;R.cust()};$('#fm').onchange=e=>{cf.min=num(e.target.value);cf.page=0;R.cust()};
 $('#addC').onclick=()=>custForm();$('#mg').onclick=mergeDlg;if($('#pv'))$('#pv').onclick=()=>{cf.page--;R.cust()};if($('#nx'))$('#nx').onclick=()=>{cf.page++;R.cust()};
 $('#cx').onclick=()=>dlf('customers-filtered.csv',csvOut([['نام','موبایل','سطح','امتیاز','تعداد خرید','مجموع خرید','بدهی','آخرین خرید']].concat(list.map(c=>{const m=met(c);return[c.name,c.phone,level(m.pt),m.pt,m.n,m.tot,m.debt,m.last]}))),'text/csv');
 V.onclick=e=>{const a=e.target.dataset.act,id=e.target.closest('[data-id]')?.dataset.id;if(!a)return;if(a==='edit')custForm(id);if(a==='msg')msgDlg(id);if(a==='p360')p360(id);if(a==='del')custDelete(id);
  if(a==='restore')tx(()=>{cust(id).archived=false}).then(()=>R.cust())}};
function custHistory(id){return db.sales.some(s=>s.cid===id)||db.payments.some(p=>p.cid===id)||(db.cheques||[]).some(c=>c.type==='in'&&c.party===id)}
function mkCustDelete(id){const c=cust(id);if(!c)throw new Error('مشتری یافت نشد.');
 if(custHistory(id)){c.archived=true;return'archived'}
 db.customers=db.customers.filter(x=>x.id!==id);db.points=db.points.filter(x=>x.cid!==id);db.reminders=db.reminders.filter(x=>x.cid!==id);db.comms=(db.comms||[]).filter(x=>x.cid!==id);
 (db.campaigns||[]).forEach(k=>k.recips.forEach(r=>{if(r.cid===id&&r.status==='pending')r.status='skipped'}));return'deleted'}
async function custDelete(id){const c=cust(id),h=custHistory(id);
 if(!confirm(h?`«${c.name}» سابقه‌ی مالی دارد و برای حفظ اسناد حذف نمی‌شود؛ بایگانی شود؟ (از فهرست‌ها و فروش پنهان می‌شود و بازگردانی‌پذیر است)`:`«${c.name}» برای همیشه حذف شود؟`))return;
 let r;if(await tx(()=>{r=mkCustDelete(id)})){toast(r==='archived'?'مشتری بایگانی شد':'مشتری حذف شد');R.cust()}}
/* --- کالا: ویرایش، تعدیل موجودی، حذف --- */
let sf={q:'',kind:'all'};
R.stock=()=>{const k=nz(sf.q);let l=db.products.filter(p=>sf.kind==='inactive'?p.active===false:p.active!==false);
 if(sf.kind==='low')l=l.filter(p=>p.qty>0&&p.qty<=p.min);if(sf.kind==='out')l=l.filter(p=>p.qty<=0);
 if(k)l=l.filter(p=>nz(p.name).includes(k)||nz(p.brand||'').includes(k)||(p.barcode||'')===k);l.sort((a,b)=>a.name.localeCompare(b.name,'fa'));
 V.innerHTML=`<input id="q" placeholder="جستجوی نام، برند یا بارکد" value="${esc(sf.q)}"><div class="chips" style="margin-top:6px">${[['all','همه'],['low','کم‌موجود'],['out','تمام‌شده'],['inactive','غیرفعال']].map(c=>`<button data-f="${c[0]}" class="${sf.kind===c[0]?'on':''}">${c[1]}</button>`).join('')}</div>
 <div class="k">${fa(l.length)} کالا — ارزش موجودی: ${T(l.reduce((s,p)=>s+(globalThis.HanaPhase1?HanaPhase1.stockValue(p):p.qty*p.cost),0))}</div><button class="b" id="addP">+ کالا</button><button class="b s" id="addS">ورود موجودی (خرید)</button>
 ${l.length?l.map(p=>`<div class="card" data-id="${p.id}"><b>${esc(p.name)}</b> <span class="k">${esc(p.brand||'')}</span>${p.active===false?'<span class="bd">غیرفعال</span>':''}
 <div class="k">موجودی: ${fa(p.qty)} ${esc(p.unit)} · خرید: ${T(p.cost)} · فروش: ${T(p.price)}</div>${p.recipe?'<div class="k">ترکیب: '+p.recipe.map(r=>esc(prod(r.pid)?.name||'؟')+' '+fa(Math.round(r.per*100))+'٪').join('، ')+'</div>':''}${p.qty<=0?'<div class="err">تمام‌شده</div>':p.qty<=p.min?'<div class="err">کم‌موجود</div>':''}
 <button class="b s" data-act="edit">ویرایش</button><button class="b s" data-act="adj">تعدیل موجودی</button>${p.recipe?'<button class="b s" data-act="rb">تولید دوباره</button>':''}<button class="b s d" data-act="del" style="color:#fff">حذف</button></div>`).join(''):'<div class="card k">کالایی پیدا نشد.</div>'}`;
 $('#q').oninput=e=>{sf.q=e.target.value;const p=e.target.selectionStart;R.stock();const i=$('#q');i.focus();i.setSelectionRange(p,p)};$('#addP').onclick=prodForm;$('#addS').onclick=buyForm;
 V.onclick=e=>{const f=e.target.dataset.f,a=e.target.dataset.act,id=e.target.closest('[data-id]')?.dataset.id;if(f){sf.kind=f;R.stock()}if(a==='edit')prodEdit(id);if(a==='adj')stockAdjust(id);if(a==='rb')rebatch(id);if(a==='del')prodDelete(id)}};
function mkProdEdit(id,o){const p=prod(id);if(!p)throw new Error('کالا یافت نشد.');if(!o.name)throw new Error('نام کالا الزامی است.');if(o.price<0||o.min<0)throw new Error('مقادیر نمی‌توانند منفی باشند.');
 if(o.barcode&&db.products.some(x=>x.id!==id&&x.barcode===o.barcode))throw new Error('این بارکد برای کالای دیگری ثبت شده است.');Object.assign(p,o)}
function buyExistingProduct(id){
 const p=prod(id);if(!p)return toast('کالا یافت نشد.');
 modal('<h3>خرید جدید / افزایش موجودی — '+esc(p.name)+'</h3>'+
 '<div class="card"><div class="row"><span>موجودی فعلی</span><b>'+fa(p.qty)+' '+esc(p.unit)+'</b></div>'+
 '<div class="row"><span>بهای میانگین فعلی هر واحد</span><b>'+T(p.cost)+'</b></div></div>'+
 '<label>مقدار خرید جدید ('+esc(p.unit)+')</label><input id="bxQty" inputmode="numeric" placeholder="مثلاً 50">'+
 '<label>قیمت خرید هر واحد (تومان)</label><input id="bxCost" inputmode="numeric" value="'+p.cost+'">'+
 '<label>قیمت فروش جدید هر واحد (تومان)</label><input id="bxPrice" inputmode="numeric" value="'+p.price+'">'+
 '<label>تأمین‌کننده</label><select id="bxSup"><option value="">— بدون —</option>'+db.suppliers.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('')+'</select>'+
 '<label>روش پرداخت</label><select id="bxMethod"><option value="1101">نقدی (صندوق)</option><option value="1102">بانک</option><option value="2101">نسیه (بدهی به تأمین‌کننده)</option></select>'+
 '<div class="k">مقدار واردشده به موجودی فعلی اضافه می‌شود؛ قیمت خرید به‌صورت میانگین موزون محاسبه و سند خرید ثبت می‌شود.</div>'+
 '<div class="row"><span>موجودی پس از خرید</span><b id="bxResult">'+fa(p.qty)+' '+esc(p.unit)+'</b></div>'+
 '<div class="err" id="bxError"></div><button class="b" id="bxSave">ثبت خرید و به‌روزرسانی قیمت</button><button class="b s" id="bxCancel">لغو</button>');
 const parse=id=>{const t=en($(id).value).replace(/[,،٬\\s]/g,'');return /^\\d+$/.test(t)?Number(t):NaN};
 $('#bxQty').oninput=()=>{const n=parse('#bxQty');$('#bxResult').textContent=(Number.isSafeInteger(n)?fa(p.qty+n):'—')+' '+p.unit};
 $('#bxCancel').onclick=close;
 $('#bxSave').onclick=async()=>{
  const n=parse('#bxQty'),cost=parse('#bxCost'),price=parse('#bxPrice'),method=$('#bxMethod').value,sup=$('#bxSup').value;
  if(!Number.isSafeInteger(n)||n<=0||!Number.isSafeInteger(cost)||cost<=0||!Number.isSafeInteger(price)||price<0||!Number.isSafeInteger(p.qty+n))return $('#bxError').textContent='مقدار خرید و قیمت‌ها باید اعداد صحیح و معتبر باشند.';
  if(method==='2101'&&!sup)return $('#bxError').textContent='برای خرید نسیه تأمین‌کننده را انتخاب کنید.';
  if(await tx(()=>{mkBuy(id,n,cost,method,sup);mkProdEdit(id,{name:p.name,brand:p.brand||'',barcode:p.barcode||'',unit:p.unit,price,min:p.min||0,active:p.active!==false})})){close();toast('خرید ثبت و موجودی و قیمت فروش به‌روز شد');render()}
 };
}
function prodEdit(id){const p=prod(id);modal(`<h3>ویرایش کالا</h3><label>نام</label><input id="a" value="${esc(p.name)}"><label>برند</label><input id="b" value="${esc(p.brand||'')}"><label>بارکد</label><input id="c" inputmode="numeric" value="${esc(p.barcode||'')}">
 <label>واحد</label><input id="u" value="${esc(p.unit)}"><label>قیمت فروش (تومان)</label><input id="p" inputmode="numeric" value="${p.price}"><label>حداقل موجودی</label><input id="m" inputmode="numeric" value="${p.min||0}">
 <label><input type="checkbox" id="ac" style="width:auto;min-height:0" ${p.active!==false?'checked':''}> فعال (قابل فروش)</label><div class="k">موجودی و بهای تمام‌شده فقط از «تعدیل موجودی» یا خرید و فروش تغییر می‌کنند تا اسناد حسابداری سالم بمانند.</div><button class="b s" id="buyExisting">+ خرید جدید و افزایش موجودی</button><div class="err" id="e"></div><button class="b" id="ok">ذخیره</button><button class="b s" id="no">لغو</button>`);$('#no').onclick=close;$('#buyExisting').onclick=()=>buyExistingProduct(id);
 $('#ok').onclick=async()=>{if(await tx(()=>mkProdEdit(id,{name:$('#a').value.trim(),brand:$('#b').value.trim(),barcode:en($('#c').value).trim(),unit:$('#u').value.trim()||'گرم',price:num($('#p').value),min:num($('#m').value),active:$('#ac').checked}))){close();toast('ذخیره شد');render()}}}
function mkAdjust(id,newQty,reason){const p=prod(id);if(!p)throw new Error('کالا یافت نشد.');if(!Number.isInteger(newQty)||newQty<0&&!db.allowNegStock)throw new Error('موجودی جدید معتبر نیست.');
 const d=newQty-p.qty;if(d===0)throw new Error('موجودی جدید با موجودی فعلی برابر است.');const val=Math.abs(d)*p.cost,mid=uid();
 if(val>0)post(toJ(),'تعدیل موجودی '+p.name+' ('+reason+')',d<0?[{a:'6103',d:val},{a:'1104',c:val}]:[{a:'1104',d:val},{a:'6103',c:val}],mid);
 p.qty=newQty;(db.stockMoves=db.stockMoves||[]).push({id:mid,date:toJ(),pid:id,delta:d,reason,value:val})}
function stockAdjust(id){const p=prod(id),mv=(db.stockMoves||[]).filter(m=>m.pid===id).slice(-5).reverse();
 modal(`<h3>تعدیل موجودی — ${esc(p.name)}</h3><div class="row"><span>موجودی فعلی</span><b>${fa(p.qty)} ${esc(p.unit)}</b></div><div class="row"><span>بهای واحد</span><b>${T(p.cost)}</b></div><label>موجودی شمارش‌شده / جدید</label><input id="n" inputmode="numeric" value="${p.qty}">
 <label>علت</label><select id="r"><option>انبارگردانی</option><option>کسری</option><option>اضافه</option><option>ضایعات</option><option>کالای خراب</option><option>اصلاح اشتباه ثبت</option></select><div class="err" id="e"></div><button class="b" id="ok">ثبت تعدیل</button><button class="b s" id="no">لغو</button>
 ${mv.length?'<b>آخرین تعدیل‌ها</b>'+mv.map(m=>`<div class="row"><span>${fa(m.date)} ${esc(m.reason)}</span><b class="${m.delta<0?'neg':'pos'}">${fa(m.delta)}</b></div>`).join(''):''}`);$('#no').onclick=close;
 $('#ok').onclick=async()=>{if(await tx(()=>mkAdjust(id,parseInt(en($('#n').value),10),$('#r').value))){close();toast('موجودی تعدیل شد');render()}}}
function mkProdDelete(id){const p=prod(id);if(!p)throw new Error('کالا یافت نشد.');
 const used=db.sales.some(s=>s.lines.some(l=>l.pid===id))||db.purchases.some(x=>x.pid===id)||(db.stockMoves||[]).some(m=>m.pid===id);
 if(used){p.active=false;return'deactivated'}if(p.qty*p.cost>0)throw new Error('این کالا موجودی ارزشمند دارد؛ ابتدا موجودی را با «تعدیل» صفر کنید.');db.products=db.products.filter(x=>x.id!==id);return'deleted'}
async function prodDelete(id){const p=prod(id);if(!confirm(`حذف «${p.name}»؟ اگر در فاکتور یا خرید استفاده شده باشد فقط غیرفعال می‌شود تا اسناد حفظ شوند.`))return;let r;if(await tx(()=>{r=mkProdDelete(id)})){toast(r==='deleted'?'کالا حذف شد':'کالا غیرفعال شد');R.stock()}}
(()=>{const f=ensureDefaults;ensureDefaults=function(){f();if(!db.accounts.some(a=>a[0]==='6103'))db.accounts.push(['6103','کسری و ضایعات موجودی'])}})();

/* ================= داشبورد تعاملی و نموداری ================= */
let dp='month',LR=[];
const periodFrom=p=>{const t=toJ();return p==='today'?t:p==='week'?addDays(t,-6):p==='month'?t.slice(0,8)+'01':p==='year'?t.slice(0,5)+'01/01':''};
const short=n=>n>=1e9?fa((n/1e9).toFixed(1).replace(/\.0$/,''))+'م‌م':n>=1e6?fa((n/1e6).toFixed(1).replace(/\.0$/,''))+'م':n>=1e3?fa(Math.round(n/1e3))+'هز':fa(n);
const okSales=f=>db.sales.filter(s=>s.status!=='cancel'&&(!f||s.date>=f));
function plNums(f){const sal=-sumPL('4101',f,''),ds=sumPL('4102',f,''),cg=sumPL('5',f,''),ex=sumPL('6',f,''),net=sal-ds,gp=net-cg;return{sal,ds,net,cg,gp,ex,np:gp-ex}}
function lastMonths(n){const t=toJ().split('/').map(Number);let y=t[0],m=t[1];const o=[];for(let i=0;i<n;i++){o.unshift(y+'/'+pad2(m));m--;if(m<1){m=12;y--}}return o}
function trendData(p){const ok=db.sales.filter(s=>s.status!=='cancel'),t=toJ();
 if(p==='year'||p==='all')return lastMonths(12).map(k=>({id:k,l:fa(+k.slice(5)),v:ok.filter(s=>s.date.startsWith(k)).reduce((a,s)=>a+s.total,0)}));
 const days=p==='month'?Math.max(7,+t.slice(8)):7,o=[];for(let i=days-1;i>=0;i--){const d=addDays(t,-i);o.push({id:d,l:fa(+d.slice(8)),v:ok.filter(s=>s.date===d).reduce((a,s)=>a+s.total,0)})}return o}
function cmpData(){const ok=db.sales.filter(s=>s.status!=='cancel');return lastMonths(6).map(k=>({id:k,l:FAM[+k.slice(5)-1],a:ok.filter(s=>s.date.startsWith(k)).reduce((x,s)=>x+s.total,0),b:db.purchases.filter(p=>p.date.startsWith(k)).reduce((x,p)=>x+p.n*p.c,0)}))}
function topProducts(f){const m={};okSales(f).forEach(s=>s.lines.forEach(l=>{const q=l.n-(l.ret||0);if(q<=0)return;const o=m[l.pid]||(m[l.pid]={pid:l.pid,q:0,rev:0});o.q+=q;o.rev+=q*l.price}));return Object.values(m).sort((a,b)=>b.rev-a.rev).slice(0,6)}
function expByCat(f){const m={},nm=id=>db.expCats.find(c=>c.id===id)?.name||'بدون دسته';db.expenses.filter(e=>!f||e.date>=f).forEach(e=>{const k=nm(e.cat);m[k]=(m[k]||0)+e.amt});return Object.entries(m).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v).slice(0,7)}
function barsSvg(items,tag,two){const W=320,H=150,pb=20,pt=16,n=items.length,mx=Math.max(1,...items.flatMap(i=>two?[i.a,i.b]:[i.v])),st=(W-16)/n,bw=Math.max(5,Math.min(two?14:26,st/(two?2.4:1.5))),hh=H-pb-pt;
 const bar=(x,v,cl,id)=>{const h=Math.max(v?2:0,v/mx*hh);return `<rect class="bar" data-bar="${tag}:${id}" x="${x}" y="${H-pb-h}" width="${bw}" height="${h}" rx="3" style="fill:${cl}"/>`};
 return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="نمودار"><line x1="8" x2="${W-8}" y1="${H-pb}" y2="${H-pb}" style="stroke:var(--bd)"/>`+items.map((it,i)=>{const cx=W-8-(i+.5)*st;
  const lab=(n<=12||i%Math.ceil(n/10)===0)?`<text x="${cx}" y="${H-6}" text-anchor="middle" style="fill:var(--mu);font-size:9px">${it.l}</text>`:'';
  if(two)return bar(cx-bw-1,it.a,'var(--pr)',it.id)+bar(cx+1,it.b,'var(--ac)',it.id)+lab;
  const top=it.v&&n<=10?`<text x="${cx}" y="${H-pb-Math.max(2,it.v/mx*hh)-3}" text-anchor="middle" style="fill:var(--mu);font-size:8px">${short(it.v)}</text>`:'';
  return bar(cx-bw/2,it.v,'var(--pr)',it.id)+top+lab}).join('')+'</svg>'}
function hbars(rows,tag){const mx=Math.max(1,...rows.map(r=>r.v));return rows.map(r=>`<div class="hb" data-bar="${tag}:${esc(r.id)}"><span>${esc(r.k)}</span><b>${T(r.v)}</b><i style="width:${Math.max(2,r.v/mx*100)}%"></i></div>`).join('')||'<div class="k">داده‌ای برای این دوره نیست.</div>'}
function listDlg(title,rows,extra=''){LR=rows;modal(`<h3>${title}</h3>${rows.map((r,i)=>`<div class="row" data-i="${i}" style="cursor:pointer;min-height:44px"><span>${r.a}</span><span>${r.b||''}</span></div>`).join('')||'<div class="k">موردی وجود ندارد.</div>'}${extra}<button class="b s" id="no">بستن</button>`);
 $('#no').onclick=close;$('#dlg').onclick=e=>{const i=e.target.closest('[data-i]')?.dataset.i;if(i!==undefined&&LR[i]&&LR[i].f)LR[i].f()}}
const salesDlg=(title,arr)=>listDlg(title+' ('+fa(arr.length)+')',arr.slice().sort((a,b)=>(b.date+(b.time||'')).localeCompare(a.date+(a.time||''))).slice(0,100).map(s=>({a:`${s.no?fa(s.no):'قدیمی'} · ${fa(s.date)}<br><span class="k">${esc(cust(s.cid)?.name||'مشتری گذری')}</span>`,b:T(s.total),f:()=>showInv(s.id)})),`<div class="k">مجموع: ${T(arr.reduce((a,s)=>a+s.total,0))}</div>`);
function plDlg(f){const n=plNums(f),tr=(a,b)=>`<div class="row"><span>${a}</span><b>${b}</b></div>`;modal(`<h3>سود و زیان ${f?'از '+fa(f):'(از ابتدا)'}</h3>${tr('فروش (پس از مرجوعی)',T(n.sal))}${tr('تخفیف فروش',T(n.ds))}${tr('فروش خالص',T(n.net))}${tr('بهای تمام‌شده',T(n.cg))}${tr('سود ناخالص',`<span class="${n.gp<0?'neg':'pos'}">${T(n.gp)}</span>`)}${tr('هزینه‌ها',T(n.ex))}${tr('سود خالص',`<span class="${n.np<0?'neg':'pos'}">${T(n.np)}</span>`)}<div class="k">خریدهای مهاجرت‌شده از CRM قدیمی در سود و زیان دفتری نیستند.</div><button class="b s" id="no">بستن</button>`);$('#no').onclick=close}
function kpi(k){const f=periodFrom(dp),t=toJ();
 if(k==='sales'||k==='count')return salesDlg('فروش دوره',okSales(f));
 if(k==='gp'||k==='np'||k==='exp')return plDlg(f);
 if(k==='ar')return listDlg('مطالبات از مشتریان',db.customers.filter(c=>cDebt(c.id)>0).sort((a,b)=>cDebt(b.id)-cDebt(a.id)).map(c=>({a:esc(c.name),b:T(cDebt(c.id)),f:()=>p360(c.id)})));
 if(k==='ap')return listDlg('بدهی به تأمین‌کنندگان',db.suppliers.filter(x=>supBal(x.id)>0).map(x=>({a:esc(x.name),b:T(supBal(x.id)),f:()=>payForm(x.id)})));
 if(k==='cash')return listDlg('صندوق و بانک',[{a:'صندوق',b:T(bal('1101')),f:G.cash},{a:'بانک',b:T(bal('1102')),f:G.cash}]);
 if(k==='stock')return listDlg('ارزش موجودی',db.products.filter(p=>(globalThis.HanaPhase1?HanaPhase1.stockValue(p):p.qty*p.cost)>0).sort((a,b)=>(globalThis.HanaPhase1?HanaPhase1.stockValue(b):b.qty*b.cost)-(globalThis.HanaPhase1?HanaPhase1.stockValue(a):a.qty*a.cost)).slice(0,40).map(p=>({a:esc(p.name)+`<br><span class="k">${fa(p.qty)} ${esc(p.unit)}</span>`,b:T(globalThis.HanaPhase1?HanaPhase1.stockValue(p):p.qty*p.cost),f:()=>stockAdjust(p.id)})));
 if(k==='low')return listDlg('کالاهای کم‌موجود یا تمام‌شده',db.products.filter(p=>p.active!==false&&p.qty<=p.min).map(p=>({a:esc(p.name),b:`${fa(p.qty)} ${esc(p.unit)}`,f:()=>stockAdjust(p.id)})));
 if(k==='cust'){cf.kind='all';tab='cust';return render()}
 if(k==='bd'){const o=[];for(let i=0;i<=7;i++){const d=addDays(t,i);db.customers.forEach(c=>{if(!c.archived&&c.birth&&normJ(c.birth).slice(5)===d.slice(5))o.push({a:esc(c.name),b:i?`${fa(i)} روز دیگر`:'امروز',f:()=>msgDlg(c.id)})})}return listDlg('تولدهای ۷ روز آینده',o)}
 if(k==='rem'){tk.f='overdue';tab='task';return render()}if(k==='chq')return G.chq();if(k==='bk')return backup();
}
R.dash=()=>{const f=periodFrom(dp),t=toJ(),ok=okSales(f),n=plNums(f),stockVal=db.products.reduce((s,p)=>s+(globalThis.HanaPhase1?HanaPhase1.stockValue(p):p.qty*p.cost),0),low=db.products.filter(p=>p.active!==false&&p.qty<=p.min).length;
 const bd=db.customers.filter(c=>!c.archived&&c.birth&&normJ(c.birth).slice(5)===t.slice(5)).length,rem=db.reminders.filter(r=>!r.done&&r.date<=t).length,chq=(db.cheques||[]).filter(c=>c.status==='open'&&c.due<=addDays(t,7)).length;
 const K=[['sales','فروش دوره',T(ok.reduce((s,x)=>s+x.total,0))],['count','تعداد فاکتور',fa(ok.length)],['gp','سود ناخالص',T(n.gp),n.gp<0?'neg':'pos'],['np','سود خالص',T(n.np),n.np<0?'neg':'pos'],['exp','هزینه‌ها',T(n.ex)],['cash','صندوق و بانک',T(bal('1101')+bal('1102'))],['ar','مطالبات',T(bal('1103'))],['ap','بدهی به تأمین‌کنندگان',T(-bal('2101'))],['stock','ارزش موجودی',T(stockVal)],['low','کم‌موجود/تمام‌شده',fa(low),low?'neg':''],['cust','مشتریان',fa(db.customers.filter(c=>!c.archived).length)],['bd','تولد امروز',fa(bd)],['rem','یادآوری امروز/عقب‌افتاده',fa(rem),rem?'neg':''],['chq','چک‌های نزدیک سررسید',fa(chq),chq?'neg':'']];
 const tp=topProducts(f).map(r=>({id:r.pid,k:(prod(r.pid)?.name||'؟')+' ×'+fa(r.q),v:r.rev})),ec=expByCat(f).map(r=>({id:r.k,k:r.k,v:r.v}));
 V.onclick=e=>{const b=e.target.closest('[data-bar]'),kk=e.target.closest('[data-k]'),pp=e.target.closest('[data-p]');
  if(pp){dp=pp.dataset.p;R.dash()}else if(kk)kpi(kk.dataset.k);else if(b){const[tag,...r]=b.dataset.bar.split(':'),id=r.join(':');
   if(tag==='tr')salesDlg('فروش '+(id.length>7?fa(id):FAM[+id.slice(5)-1]+' '+fa(id.slice(0,4))),db.sales.filter(s=>s.status!=='cancel'&&s.date.startsWith(id)));
   if(tag==='cm'){const mm=FAM[+id.slice(5)-1];listDlg('خرید و فروش '+mm,[{a:'فروش',b:T(db.sales.filter(s=>s.status!=='cancel'&&s.date.startsWith(id)).reduce((a,s)=>a+s.total,0)),f:()=>salesDlg('فروش '+mm,db.sales.filter(s=>s.status!=='cancel'&&s.date.startsWith(id)))},{a:'خرید کالا',b:T(db.purchases.filter(p=>p.date.startsWith(id)).reduce((a,p)=>a+p.n*p.c,0))}])}
   if(tag==='tp')prodEdit(id);
   if(tag==='ex')listDlg('هزینه‌ها: '+id,db.expenses.filter(x=>(!f||x.date>=f)&&(db.expCats.find(c=>c.id===x.cat)?.name||'بدون دسته')===id).map(x=>({a:fa(x.date)+'<br><span class="k">'+esc(x.desc)+'</span>',b:T(x.amt)})))}};
 V.innerHTML=`<div class="chips">${[['today','امروز'],['week','۷ روز'],['month','این ماه'],['year','امسال'],['all','همه']].map(p=>`<button data-p="${p[0]}" class="${dp===p[0]?'on':''}">${p[1]}</button>`).join('')}</div>
 <div class="grid">${K.map(x=>`<button class="card kpi" data-k="${x[0]}"><div class="k">${x[1]}</div><div class="v ${x[3]||''}">${x[2]}</div></button>`).join('')}</div>
 ${(db.dirty||0)>=10?`<button class="card kpi err" data-k="bk">${fa(db.dirty)} تغییر هنوز در فایل JSON ذخیره نشده است — برای ذخیره بزنید</button>`:''}${Date.now()-db.lastBackup>(db.backupDays||7)*864e5&&!(db.dirty>=10)?'<button class="card kpi err" data-k="bk">بیش از '+fa(db.backupDays||7)+' روز از آخرین پشتیبان JSON گذشته است — برای ذخیره بزنید</button>':''}
 <div class="card"><b>روند فروش ${dp==='year'||dp==='all'?'(۱۲ ماه اخیر)':dp==='month'?'(این ماه)':'(۷ روز اخیر)'}</b><div class="k">برای دیدن فاکتورها روی ستون بزنید</div>${barsSvg(trendData(dp),'tr')}</div>
 <div class="card"><b>فروش در مقایسه با خرید کالا (۶ ماه)</b><div class="k"><span style="color:var(--pr)">■</span> فروش <span style="color:var(--ac)">■</span> خرید</div>${barsSvg(cmpData(),'cm',true)}</div>
 <div class="card"><b>کالاهای پرفروش دوره</b>${hbars(tp,'tp')}</div><div class="card"><b>هزینه‌ها به تفکیک دسته</b>${hbars(ec,'ex')}</div>`};
/* ================= ذخیره JSON، خروجی بخشی، پاک‌سازی ================= */
G.json=function(){const ago=db.lastBackup?fa(Math.round((Date.now()-db.lastBackup)/36e5))+' ساعت پیش':'هرگز';
 modal(`<h3>ذخیره و JSON</h3><div class="card"><div class="row"><span>آخرین پشتیبان</span><b>${ago}</b></div><div class="row"><span>تغییرات ذخیره‌نشده در فایل</span><b>${fa(Math.max(0,db.dirty||0))}</b></div><div class="k">همه‌ی تغییرات همان لحظه در پایگاه داده‌ی دستگاه ذخیره می‌شوند؛ فایل JSON برای نسخه‌ی پشتیبان بیرونی است.</div></div>
 <button class="b" data-x="full">ذخیره پشتیبان کامل (JSON)</button><button class="b s" data-x="customers">فقط مشتریان</button><button class="b s" data-x="products">فقط کالاها</button><button class="b s" data-x="restore">بازیابی / ورود JSON</button><button class="b s" id="no">بستن</button>`);
 $('#no').onclick=close;$('#dlg').onclick=e=>{const x=e.target.dataset.x;if(!x)return;if(x==='full')backup();else if(x==='restore'){const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=()=>readFile(i.files[0],'restore');i.click()}
  else dlf((db.shop.name+'_'+x+'_'+toJ().replace(/\//g,'-')+'.json'),JSON.stringify({kind:'partial',section:x,version:VER,savedAt:Date.now(),shop:db.shop.name,data:db[x]}),'application/json')}};
function mkImportPartial(j){const d=j.data;if(!Array.isArray(d))throw new Error('ساختار فایل نامعتبر است.');let add=0,skip=0;
 if(j.section==='customers'){const ids=new Set(db.customers.map(c=>c.id));d.forEach(c=>{if(!c||!c.id||!c.name||ids.has(c.id)){skip++;return}const dup=db.customers.some(x=>x.phone===c.phone);db.customers.push({...c,dupPhone:dup||c.dupPhone});ids.add(c.id);add++})}
 else if(j.section==='products'){const ids=new Set(db.products.map(p=>p.id));let opening=0;d.forEach(p=>{if(!p||!p.id||!p.name||ids.has(p.id)){skip++;return}const qty=p.qty||0,cost=p.cost||0;if(!Number.isSafeInteger(qty)||qty<0||!Number.isSafeInteger(cost)||cost<0||!Number.isSafeInteger(qty*cost))throw new Error('مقدار یا بهای کالای ورودی نامعتبر است.');db.products.push({...p,qty,cost});opening+=qty*cost;ids.add(p.id);add++});if(opening>0)post(toJ(),'موجودی افتتاحیه کالاهای واردشده از JSON',[{a:'1104',d:opening},{a:'3101',c:opening}],'partial-products')}
 else throw new Error('بخش «'+j.section+'» پشتیبانی نمی‌شود.');if(j.section==='customers'){const normalized=canonicalCustomerIds(db);if(normalized.changed)db=Object.assign(blank(),normalized.data)}return{add,skip}}
function importPartial(j){if(!confirm(`ورود ${j.section==='customers'?'مشتریان':'کالاها'}: ${(j.data||[]).length} رکورد. موارد با شناسه‌ی تکراری رد می‌شوند و داده‌ی فعلی تغییر نمی‌کند. ادامه؟`))return;let r;tx(()=>{r=mkImportPartial(j)}).then(ok=>{if(ok){toast(`وارد شد: ${r.add} · ردشده: ${r.skip}`);render()}})}
G.clear=function(){modal(`<h3>پاک کردن اطلاعات</h3><div class="err">این کار همه‌ی مشتریان، کالاها، فاکتورها، اسناد و تراکنش‌ها را پاک می‌کند. قبل از پاک‌سازی یک فایل پشتیبان JSON ذخیره می‌شود.</div>
 <label><input type="checkbox" id="ks" style="width:auto;min-height:0" checked> تنظیمات فروشگاه، قالب پیام‌ها، دسته‌ها و فهرست حساب‌ها حفظ شود</label><label>برای تأیید، کلمه‌ی «پاک» را بنویسید</label><input id="cf1"><div class="err" id="e"></div><button class="b d" id="ok">پاک کردن</button><button class="b s" id="no">لغو</button>`);$('#no').onclick=close;
 $('#ok').onclick=async()=>{if($('#cf1').value.trim()!=='پاک')return $('#e').textContent='برای تأیید باید دقیقاً «پاک» نوشته شود.';
  try{await dl('auto-before-clear_'+toJ().replace(/\//g,'-')+'.json',JSON.stringify(db))}catch(err){return $('#e').textContent='پاک‌سازی متوقف شد؛ ذخیره پشتیبان موفق نبود: '+err.message}const keep=$('#ks').checked;
  if(await tx(()=>{db=clearedDb(db,keep)})){close();toast('اطلاعات پاک شد؛ نسخه‌ی پشتیبان قبلی ذخیره شد');tab='dash';render()}}};
function clearedDb(old,keep){const n=blank();if(keep)['shop','theme','tpl','loyalty','accounts','expCats','holidays','hijriOffset','pfmt','allowNegStock'].forEach(k=>{if(old[k]!==undefined)n[k]=JSON.parse(JSON.stringify(old[k]))});n.lastBackup=Date.now();n.dirty=-1;return n}
$('#bSave').onclick=()=>backup();
const _nav=nav;nav=function(){_nav();const b=$('#bSave');if(b)b.dataset.n=String(Math.max(0,db.dirty||0))};

/* ================= محصول جدید و ترکیبی (ساخت رایحه) ================= */
function mkProduct(o){if(!o.name)throw new Error('نام کالا الزامی است.');if(db.products.some(p=>p.name===o.name))throw new Error('کالایی با این نام وجود دارد.');if(o.price<0||o.qty<0||o.cost<0||o.min<0)throw new Error('مقادیر نمی‌توانند منفی باشند.');
 if(o.barcode&&db.products.some(p=>p.barcode===o.barcode))throw new Error('این بارکد قبلاً ثبت شده است.');
 const p={id:uid(),name:o.name,brand:o.brand||'',barcode:o.barcode||'',unit:o.unit||'گرم',price:o.price||0,cost:o.cost||0,qty:o.qty||0,min:o.min||0};db.products.push(p);
 if(p.qty*p.cost>0)post(toJ(),'موجودی افتتاحیه '+p.name,[{a:'1104',d:p.qty*p.cost},{a:'3101',c:p.qty*p.cost}],p.id);return p.id}
function mkBlend(o){if(!(o.out>0)||!Number.isInteger(o.out))throw new Error('مقدار تولید باید عدد صحیح و مثبت باشد.');
 const ing=(o.ing||[]).filter(x=>x.pid&&x.qty>0);if(!ing.length)throw new Error('حداقل یک ماده‌ی اولیه با مقدار مشخص لازم است.');
 const seen=new Set();let raw=0;
 ing.forEach(x=>{if(seen.has(x.pid))throw new Error('یک ماده‌ی اولیه دو بار انتخاب شده است.');seen.add(x.pid);if(!Number.isInteger(x.qty))throw new Error('مقدار مواد باید عدد صحیح باشد.');
  const p=prod(x.pid);if(!p)throw new Error('ماده‌ی اولیه یافت نشد.');if(o.pid&&x.pid===o.pid)throw new Error('محصول نمی‌تواند ماده‌ی اولیه‌ی خودش باشد.');
  if(!db.allowNegStock&&p.qty<x.qty)throw new Error('موجودی «'+p.name+'» کافی نیست (موجود: '+fa(p.qty)+').');raw+=x.qty*p.cost;p.qty-=x.qty});
 const extra=o.extra||0;if(extra<0)throw new Error('هزینه‌ی اضافه نمی‌تواند منفی باشد.');
 let t=o.pid&&prod(o.pid);
 if(!t){if(!o.name)throw new Error('نام محصول را وارد کنید.');if(db.products.some(p=>p.name===o.name))throw new Error('محصولی با این نام وجود دارد؛ از «تولید دوباره» همان محصول استفاده کنید.');
  t={id:uid(),name:o.name,brand:o.brand||'',barcode:'',unit:o.unit||'گرم',price:o.price||0,cost:0,qty:0,min:0};db.products.push(t)}
 if(extra>0){if(!['1101','1102'].includes(o.extraMethod))throw new Error('منبع پرداخت هزینه‌ی اضافه را انتخاب کنید.');post(toJ(),'هزینه‌ی تولید '+t.name,[{a:'1104',d:extra},{a:o.extraMethod,c:extra}],uid())}
 if(t.qty+o.out<=0)throw new Error('موجودی منفی این محصول با مقدار تولید جبران نمی‌شود.');
 const before=t.qty*t.cost,total=raw+extra,nc=Math.round((before+total)/(t.qty+o.out)),diff=before+total-(t.qty+o.out)*nc,mid=uid();
 t.qty+=o.out;t.cost=nc;t.lastOut=o.out;t.recipe=ing.map(x=>({pid:x.pid,per:x.qty/o.out}));
 if(diff!==0)post(toJ(),'گرد کردن بهای تولید '+t.name,diff>0?[{a:'6103',d:diff},{a:'1104',c:diff}]:[{a:'1104',d:-diff},{a:'6103',c:-diff}],mid);
 (db.blends=db.blends||[]).push({id:mid,date:toJ(),pid:t.id,out:o.out,ing:ing.map(x=>({pid:x.pid,qty:x.qty})),raw,extra,cost:nc});return t.id}
function newProductDlg(cb,pre){pre=pre||{};const raws=db.products.filter(p=>p.active!==false&&p.qty>0&&p.id!==pre.pid),N=6,rows=pre.ing||[];
 const opt=(sel)=>'<option value="">— ماده‌ی اولیه —</option>'+raws.map(p=>`<option value="${p.id}"${p.id===sel?' selected':''}>${esc(p.name)} (${fa(p.qty)} ${esc(p.unit)})</option>`).join('');
 modal(`<h3>${pre.pid?'تولید دوباره — '+esc(prod(pre.pid).name):'محصول جدید'}</h3>
 ${pre.pid?'':`<label>نوع</label><select id="md"><option value="s">کالای ساده</option><option value="b">ترکیبی (ساخت از چند رایحه)</option></select><label>نام محصول</label><input id="a"><label>برند / توضیح</label><input id="b"><label>واحد</label><input id="u" value="گرم"><label>قیمت فروش واحد (تومان)</label><input id="p" inputmode="numeric">`}
 <div id="sm" ${pre.pid?'hidden':''}><label>بارکد</label><input id="c" inputmode="numeric"><label>حداقل موجودی</label><input id="m" value="0" inputmode="numeric"><label>موجودی اولیه</label><input id="q" value="0" inputmode="numeric"><label>بهای خرید هر واحد</label><input id="k" value="0" inputmode="numeric"></div>
 <div id="bl" ${pre.pid?'':'hidden'}><div class="k">مواد از موجودی کم می‌شوند و بهای تمام‌شده‌ی محصول از جمع بهای مواد محاسبه می‌شود.</div>
 ${Array.from({length:N},(_,i)=>`<div class="row" style="flex-wrap:wrap"><select data-i="${i}" style="flex:2 1 100%">${opt(rows[i]?.pid)}</select><input data-n="${i}" placeholder="مقدار مصرفی" inputmode="numeric" value="${rows[i]?rows[i].qty:''}" style="flex:1"></div>`).join('')}
 <label>مقدار تولیدشده (به واحد محصول)</label><input id="o" inputmode="numeric" value="${pre.out||''}"><label>هزینه‌ی اضافه (شیشه، بسته‌بندی، ...) — اختیاری</label><input id="x" value="0" inputmode="numeric"><label>پرداخت هزینه‌ی اضافه از</label><select id="xm"><option value="1101">صندوق</option><option value="1102">بانک</option></select>
 <div class="card" id="pv" style="margin-top:8px"></div></div><div class="err" id="e"></div><button class="b" id="ok">ثبت</button><button class="b s" id="no">لغو</button>`);
 const isB=()=>pre.pid||$('#md').value==='b',cost0=()=>{let r=0,z=[];for(let i=0;i<N;i++){const id=$(`[data-i="${i}"]`).value,q=num($(`[data-n="${i}"]`).value);if(id&&q){const p=prod(id);r+=q*p.cost;if(!p.cost)z.push(p.name)}}return{r,z}};
 const pv=()=>{if(!isB())return;const{r,z}=cost0(),o=num($('#o').value),x=num($('#x').value);$('#pv').innerHTML=o>0?`<b>بهای تمام‌شده‌ی هر واحد: ${T(Math.round((r+x)/o))}</b><div class="k">جمع مواد: ${T(r)}${x?' + هزینه اضافه '+T(x):''}</div>${z.length?'<div class="err">بهای خرید این مواد صفر است و بهای محصول ناقص محاسبه می‌شود: '+esc(z.join('، '))+'</div>':''}`:'<div class="k">مقدار تولید را وارد کنید.</div>'};
 if(!pre.pid)$('#md').onchange=()=>{$('#bl').hidden=!isB();$('#sm').hidden=isB();pv()};$('#bl').oninput=pv;pv();$('#no').onclick=close;
 $('#ok').onclick=async()=>{let id;const ok=await tx(()=>{if(isB()){const ing=[];for(let i=0;i<N;i++){const p=$(`[data-i="${i}"]`).value,q=num($(`[data-n="${i}"]`).value);if(p||q)ing.push({pid:p,qty:q})}
   if(ing.some(x=>!x.pid||!x.qty))throw new Error('برای هر ردیف، ماده و مقدار را کامل وارد کنید.');id=mkBlend({pid:pre.pid,name:pre.pid?'':$('#a').value.trim(),brand:pre.pid?'':$('#b').value.trim(),unit:pre.pid?'':$('#u').value.trim(),price:pre.pid?0:num($('#p').value),out:num($('#o').value),ing,extra:num($('#x').value),extraMethod:$('#xm').value})}
  else id=mkProduct({name:$('#a').value.trim(),brand:$('#b').value.trim(),unit:$('#u').value.trim(),price:num($('#p').value),barcode:en($('#c').value).trim(),min:num($('#m').value),qty:num($('#q').value),cost:num($('#k').value)})});
  if(ok){close();toast('محصول ثبت شد');cb?cb(id):render()}}}
function prodForm(){newProductDlg()}
function rebatch(id){const p=prod(id);newProductDlg(null,{pid:id,out:'',ing:(p.recipe||[]).map(r=>({pid:r.pid,qty:Math.round(r.per*(p.lastOut||30))}))})}
/* ================= منوی «بیشتر» به‌صورت بخش‌های جدا + تنظیمات ================= */
const go=t=>{tab=t;render()};let secK='sales';
const pickFile=(acc,cb)=>{const i=document.createElement('input');i.type='file';i.accept=acc;i.onchange=()=>i.files[0]&&cb(i.files[0]);i.click()};
const SEC=()=>({
 sales:['🧾','فروش و مشتریان',[['🧾','فاکتورها',()=>invList()],['💰','دریافت از مشتری',()=>recForm()],['✅','کارها و پیگیری',()=>go('task')],['📣','ارسال گروهی',()=>G.camp()],['💬','قالب پیام‌ها',()=>G.tpl()],['📅','تقویم',()=>go('cal')]]],
 stock:['📦','کالا و خرید',[['➕','خرید / ورود موجودی',()=>buyForm()],['🧪','محصول جدید / ترکیبی',()=>newProductDlg()],['🚚','تأمین‌کنندگان',()=>G.sup()],['📄','ورود و خروج CSV',()=>G.csv()]]],
 acct:['📒','حسابداری',[['🧾','ثبت هزینه',()=>expForm()],['📋','فهرست هزینه‌ها',()=>G.expl()],['🏦','صندوق و بانک',()=>G.cash()],['📝','چک‌ها',()=>G.chq()],['✍️','سند دستی',()=>G.jv()],['🗂️','فهرست حساب‌ها',()=>G.accs()],['📊','گزارش‌ها و دفاتر',()=>report()],['🔒','بستن دوره مالی',()=>G.close()]]],
 data:['💾','داده‌ها و پشتیبان',[['💾','ذخیره / JSON',()=>G.json()],['📥','ورود از CRM قدیمی',()=>pickFile('.json,application/json',f=>readFile(f,'old'))],['📄','ورود و خروج CSV',()=>G.csv()],['🗑️','پاک کردن اطلاعات',()=>G.clear()]]]});
R.more=()=>{V.onclick=null;const H=[['sales','🧾','فروش و مشتریان','فاکتور، دریافت، پیام، تقویم'],['stock','📦','کالا و خرید','خرید، محصول ترکیبی، تأمین‌کننده'],['acct','📒','حسابداری','هزینه، بانک، چک، دفاتر، گزارش'],['task','✅','کارها و پیگیری','یادآوری‌ها و کارهای امروز'],['data','💾','داده‌ها و پشتیبان','JSON، CSV، پاک‌سازی'],['set','⚙️','تنظیمات','فروشگاه، ظاهر، باشگاه، هزینه‌ها']];
 V.innerHTML=`<div class="tiles">${H.map(h=>`<button class="tile" data-h="${h[0]}"><span class="ic">${h[1]}</span><b>${h[2]}</b><small>${h[3]}</small></button>`).join('')}</div>`;
 V.onclick=e=>{const h=e.target.closest('[data-h]')?.dataset.h;if(!h)return;if(h==='task'||h==='set')return go(h);secK=h;go('sec')}};
R.sec=()=>{const S=SEC()[secK],f=periodFrom('month'),n=plNums(f);
 V.innerHTML=`<button class="b s" id="bk">→ بازگشت</button><h3 style="margin:8px 0">${S[0]} ${S[1]}</h3>
 ${secK==='acct'?`<div class="grid"><div class="card"><div class="k">صندوق</div><div class="v">${T(bal('1101'))}</div></div><div class="card"><div class="k">بانک</div><div class="v">${T(bal('1102'))}</div></div><div class="card"><div class="k">مطالبات</div><div class="v">${T(bal('1103'))}</div></div><div class="card"><div class="k">بدهی به تأمین‌کنندگان</div><div class="v">${T(-bal('2101'))}</div></div><div class="card"><div class="k">سود خالص این ماه</div><div class="v ${n.np<0?'neg':'pos'}">${T(n.np)}</div></div><div class="card"><div class="k">هزینه‌های این ماه</div><div class="v">${T(n.ex)}</div></div></div>`:''}
 <div class="tiles">${S[2].map((t,i)=>`<button class="tile" data-i="${i}"><span class="ic">${t[0]}</span><b>${t[1]}</b></button>`).join('')}</div>`;
 $('#bk').onclick=()=>go('more');V.onclick=e=>{const i=e.target.closest('[data-i]')?.dataset.i;if(i!==undefined)S[2][i][2]()}};
function validLevels(names,mins){if(names.some(n=>!n))return'نام همه‌ی سطح‌ها را وارد کنید.';if(new Set(names).size!==names.length)return'نام سطح‌ها نباید تکراری باشد.';if(mins[0]!==0)return'حداقل امتیاز اولین سطح باید صفر باشد.';for(let i=1;i<mins.length;i++)if(mins[i]<=mins[i-1])return'حداقل امتیاز سطح‌ها باید صعودی باشد.';return''}
R.set=()=>{V.onclick=null;const L=db.loyalty.levels;
 V.innerHTML=`<button class="b s" id="bk">→ بازگشت</button><h3 style="margin:8px 0">⚙️ تنظیمات</h3>
 <div class="card"><b>مشخصات فروشگاه</b><label>نام فروشگاه</label><input id="s1" value="${esc(db.shop.name)}"><label>نام مالک / مدیر</label><input id="s2" value="${esc(db.shop.owner||'')}"><label>تلفن</label><input id="s3" value="${esc(db.shop.phone)}"><label>آدرس</label><input id="s4" value="${esc(db.shop.addr||'')}"><label>متن پایان فاکتور</label><input id="s5" value="${esc(db.shop.footer)}"><button class="b" id="ssh">ذخیره</button></div>
 <div class="card"><b>ظاهر</b><label>تم</label><select id="t1"><option value="light">روشن</option><option value="dark">تاریک</option></select><label>اندازه‌ی متن</label><select id="t2">${[14,16,18,20].map(n=>`<option value="${n}">${fa(n)}</option>`).join('')}</select><button class="b" id="sap">ذخیره</button></div>
 <div class="card"><b>فروش و انبار</b><label><input type="checkbox" id="g1" style="width:auto;min-height:0"> اجازه‌ی موجودی منفی</label><label>قالب پیش‌فرض چاپ فاکتور</label><select id="g2"><option value="a4">A4</option><option value="f80">حرارتی ۸۰ میلی‌متر</option><option value="f58">حرارتی ۵۸ میلی‌متر</option></select><button class="b" id="sop">ذخیره</button></div>
 <div class="card"><b>باشگاه مشتریان</b><label>امتیاز به ازای هر ۱٬۰۰۰ تومان خرید</label><input id="l0" value="${db.loyalty.perThousand}" inputmode="numeric">
 ${L.concat([['','']]).map((l,i)=>`<div class="row"><input data-ln="${i}" placeholder="نام سطح" value="${esc(l[0])}"><input data-lm="${i}" placeholder="حداقل امتیاز" inputmode="numeric" value="${l[0]===''?'':l[1]}"></div>`).join('')}<div class="err" id="le"></div><div class="k">تغییر نرخ فقط روی فاکتورهای بعدی اثر دارد. ردیف خالی آخر برای افزودن سطح جدید است.</div><button class="b" id="slo">ذخیره</button></div>
 <div class="card"><b>دسته‌های هزینه</b>${db.expCats.map(c=>`<div class="row"><span>${esc(c.name)}</span><span class="k">${fa(c.acc)}</span></div>`).join('')}<label>دسته‌ی جدید</label><input id="c1"><button class="b" id="sca">افزودن</button></div>
 <div class="card"><b>پشتیبان‌گیری</b><label>یادآوری پشتیبان بعد از چند روز</label><input id="b1" value="${db.backupDays||7}" inputmode="numeric"><button class="b" id="sbk">ذخیره</button></div>`;
 $('#t1').value=db.theme;$('#t2').value=String(db.fs||16);$('#g1').checked=!!db.allowNegStock;$('#g2').value=db.pfmt||'a4';
 const sv=async(fn,m)=>{if(await tx(fn)){toast(m||'ذخیره شد');render()}};$('#bk').onclick=()=>go('more');
 $('#ssh').onclick=()=>sv(()=>{if(!$('#s1').value.trim())throw new Error('نام فروشگاه نمی‌تواند خالی باشد.');Object.assign(db.shop,{name:$('#s1').value.trim(),owner:$('#s2').value.trim(),phone:$('#s3').value.trim(),addr:$('#s4').value.trim(),footer:$('#s5').value.trim()})});
 $('#sap').onclick=()=>sv(()=>{db.theme=$('#t1').value;db.fs=+$('#t2').value});$('#sop').onclick=()=>sv(()=>{db.allowNegStock=$('#g1').checked;db.pfmt=$('#g2').value});
 $('#slo').onclick=()=>sv(()=>{const ns=[],ms=[];V.querySelectorAll('[data-ln]').forEach((n,i)=>{const nm=n.value.trim(),mn=V.querySelector(`[data-lm="${i}"]`).value.trim();if(!nm&&!mn)return;ns.push(nm);ms.push(num(mn))});const er=validLevels(ns,ms);if(er)throw new Error(er);
  db.loyalty.perThousand=Math.max(0,num($('#l0').value));db.loyalty.levels=ns.map((n,i)=>[n,ms[i]])});
 $('#sca').onclick=()=>sv(()=>addCat($('#c1').value));$('#sbk').onclick=()=>sv(()=>{const d=num($('#b1').value);if(d<1)throw new Error('عدد معتبر وارد کنید.');db.backupDays=d})};
(()=>{const r=render;render=function(){document.documentElement.style.setProperty('--fs',(db.fs||16)+'px');r()}})();
/* ================= کارها و پیگیری (با عملیات واقعی) ================= */
let tk={f:'overdue'};const TPL_OF={'خرید مجدد':'repurchase','خرید':'thanks','تولد':'birthday','بدهی':'debt'};
function taskItems(){const t=toJ(),out=db.reminders.slice();
 for(let i=0;i<=3;i++){const d=addDays(t,i);db.customers.forEach(c=>{if(c.archived||!c.birth||normJ(c.birth).slice(5)!==d.slice(5))return;const key='تبریک تولد '+d.slice(0,4);
  out.push({id:'bd:'+c.id+':'+d,virtual:true,type:'تولد',cid:c.id,date:d,title:'تولد '+c.name,done:(db.comms||[]).some(m=>m.cid===c.id&&m.title===key),bdKey:key})})}return out}
function taskBucket(it,t){return it.done?'done':it.date<t?'overdue':it.date===t?'today':it.date<=addDays(t,7)?'week':'later'}
function mkTaskDone(it,out,note,next){if(it.virtual){db.comms.push({id:uid(),cid:it.cid,date:toJ(),ch:out,title:it.bdKey});return}
 const r=db.reminders.find(x=>x.id===it.id);if(!r)throw new Error('کار یافت نشد.');if(r.done)throw new Error('این کار قبلاً انجام شده است.');if(next&&!validJ(next))throw new Error('تاریخ پیگیری بعدی معتبر نیست.');
 r.done=true;r.doneDate=toJ();r.result=out;r.note=note||'';if(r.cid)db.comms.push({id:uid(),cid:r.cid,date:toJ(),ch:out,title:r.title});
 if(next)db.reminders.push({id:uid(),cid:r.cid||'',type:r.type||'',title:'پیگیری: '+r.title,date:normJ(next),time:r.time||'09:00',done:false})}
function mkSnooze(id,date){const r=db.reminders.find(x=>x.id===id);if(!r||r.done)throw new Error('کار یافت نشد.');if(!validJ(date))throw new Error('تاریخ معتبر نیست.');r.date=normJ(date)}
function resultDlg(it,pre){modal(`<h3>ثبت نتیجه</h3><div class="k">${esc(it.title)}</div><label>نتیجه</label><select id="o">${['پیام ارسال شد','تماس گرفتم','خرید کرد','جواب نداد','انجام شد','نیاز ندارد'].map(x=>`<option${x===pre?' selected':''}>${x}</option>`).join('')}</select><label>یادداشت</label><textarea id="n" rows="2"></textarea>
 <label>پیگیری بعدی (اختیاری)</label><input id="nx" class="jd" readonly placeholder="انتخاب تاریخ"><div class="err" id="e"></div><button class="b" id="ok">ثبت و انجام شد</button><button class="b s" id="no">لغو</button>`);$('#no').onclick=close;
 $('#ok').onclick=async()=>{if(await tx(()=>mkTaskDone(it,$('#o').value,$('#n').value.trim(),$('#nx').value.trim()))){close();toast('ثبت شد');R.task()}}}
function snoozeDlg(it){modal(`<h3>تعویق</h3><div class="k">${esc(it.title)}</div>${[1,3,7,14].map(n=>`<button class="b s" data-n="${n}">${fa(n)} روز دیگر</button>`).join('')}<label>یا تاریخ دلخواه</label><input id="sd1" class="jd" readonly placeholder="انتخاب تاریخ"><button class="b" id="ok">ثبت تاریخ</button><button class="b s" id="no">لغو</button>`);$('#no').onclick=close;
 const apply=async d=>{if(await tx(()=>mkSnooze(it.id,d))){close();R.task()}};$('#dlg').onclick=e=>{const n=e.target.dataset.n;if(n)apply(addDays(it.date<toJ()?toJ():it.date,+n))};$('#ok').onclick=()=>apply($('#sd1').value)}
function expForm(p,cb){p=p||{};modal(`<h3>هزینهٔ جدید</h3><label>دسته</label><select id="ec">${db.expCats.map(c=>`<option value="${c.id}"${c.id===p.cat?' selected':''}>${esc(c.name)}</option>`).join('')}</select><input id="nc" placeholder="یا نام دستهٔ جدید" style="margin-top:6px">
 <label>شرح</label><input id="a" value="${esc(p.desc||'')}"><label>مبلغ (تومان)</label><input id="b" inputmode="numeric" value="${p.amt||''}"><label>تاریخ</label><input id="ed1" class="jd" readonly value="${toJ()}">
 <label>پرداخت</label><select id="m"><option value="1101">نقدی از صندوق</option><option value="1102">از بانک</option><option value="2103">نسیه (پرداخت بعداً)</option></select>
 <label><input type="checkbox" id="rc" style="width:auto;min-height:0" ${p.recur?'checked':''}> یادآوری ماه بعد (هزینه تکراری)</label><div class="err" id="e"></div><button class="b" id="ok">ثبت</button><button class="b s" id="no">لغو</button>`);if(p.method)$('#m').value=p.method;$('#no').onclick=close;
 $('#ok').onclick=async()=>{if(await tx(()=>{let cat=$('#ec').value;const n=$('#nc').value.trim();if(n)cat=addCat(n);mkExpense({cat,desc:$('#a').value.trim(),amt:num($('#b').value),date:$('#ed1').value,method:$('#m').value,recur:$('#rc').checked})})){close();toast('هزینه ثبت شد');cb&&await cb();render()}}}
function remForm(d0){let cid='';modal(`<h3>کار / یادآوری جدید</h3><label>عنوان</label><input id="a"><label>نوع</label><select id="rt">${['پیگیری مشتری','خرید مجدد','پرداخت','شخصی','سایر'].map(x=>`<option>${x}</option>`).join('')}</select><label>تاریخ (شمسی)</label><input id="d" class="jd" readonly value="${d0||toJ()}"><label>ساعت اعلان روی گوشی</label><input id="tm" type="time" value="11:00"><div class="k">برای نمونه: ۲۹ام ساعت ۱۱:۰۰. برای اعلان، مجوز اعلان‌ها را فعال کنید.</div>
 <label>مشتری مرتبط (اختیاری)</label><input id="rc" placeholder="جستجوی نام یا موبایل" autocomplete="off"><div id="rcr"></div><div class="err" id="e"></div><button class="b" id="ok">ثبت</button><button class="b s" id="no">لغو</button>`);$('#no').onclick=close;
 $('#rc').oninput=e=>{cid='';const r=findCust(e.target.value);$('#rcr').innerHTML=r.map(c=>`<div class="row" data-k="${c.id}" style="cursor:pointer;min-height:44px"><span>${esc(c.name)}</span><span class="k">${esc(c.phone)}</span></div>`).join('')};
 $('#rcr').onclick=e=>{const k=e.target.closest('[data-k]')?.dataset.k;if(k){cid=k;$('#rc').value=cust(k).name;$('#rcr').innerHTML=''}};
 $('#ok').onclick=async()=>{if(!validJ($('#d').value)||!$('#a').value.trim()||!validReminderTime($('#tm').value))return $('#e').textContent='عنوان، تاریخ و ساعت معتبر لازم است.';
  if(await tx(()=>db.reminders.push({id:uid(),title:$('#a').value.trim(),type:$('#rt').value,date:normJ($('#d').value),time:$('#tm').value,cid,done:false}))){close();toast('ثبت شد');render()}}}
R.task=()=>{const t=toJ(),all=taskItems(),B={overdue:[],today:[],week:[],later:[],done:[]};all.forEach(it=>B[taskBucket(it,t)].push(it));
 const list=(B[tk.f]||[]).slice().sort((a,b)=>tk.f==='done'?(b.doneDate||b.date).localeCompare(a.doneDate||a.date):tk.f==='overdue'?b.date.localeCompare(a.date):a.date.localeCompare(b.date)),sh=list.slice(0,60);
 V.innerHTML=`<div class="row"><button class="b s" id="bk" style="margin:0">→ بازگشت</button><button class="b" id="nw" style="margin:0">+ کار جدید</button></div>
 <div class="card"><b>🔔 اعلان‌های گوشی</b><div class="k">یادآوری کارها در ساعت انتخابی و تولد مشتری‌ها ساعت ۹ صبح. روی اندروید باید مجوز اعلان داده شود؛ برای اعلان دقیق نیز دسترسی ساعت‌های دقیق را فعال کنید.</div><button class="b" id="notifyOn">فعال‌کردن اعلان‌ها</button><button class="b s" id="notifyExact">فعال‌کردن ساعت دقیق (اختیاری)</button></div>
 <div class="chips" style="margin-top:8px">${[['overdue','عقب‌افتاده'],['today','امروز'],['week','۷ روز آینده'],['later','بعدی'],['done','انجام‌شده']].map(c=>`<button data-f="${c[0]}" class="${tk.f===c[0]?'on':''}">${c[1]} (${fa(B[c[0]].length)})</button>`).join('')}</div>
 <div class="k">${fa(list.length)} مورد${list.length>60?' — ۶۰ مورد نخست نمایش داده می‌شود':''}</div>
 ${sh.map(it=>{const c=cust(it.cid),phone=c&&c.phone;return `<div class="card" data-t="${esc(it.id)}"><b>${esc(it.title)}</b><div class="k">${fa(it.date)}${it.virtual?'':(' · ساعت '+fa(it.time||'09:00'))} · ${esc(it.type||'کار')}${c?' · '+esc(c.name):it.cname?' · '+esc(it.cname):''}</div>${it.result?`<div class="k">نتیجه: ${esc(it.result)}${it.note?' — '+esc(it.note):''}</div>`:''}
 ${it.done?(it.virtual?'':'<button class="b s" data-a="undo">بازگردانی</button>'):`${c?`<button class="b s" data-a="msg">پیام</button><a class="b s" href="tel:${esc(phone)}">تماس</a><button class="b s" data-a="p360">پرونده</button>`:''}${it.tpl?'<button class="b" data-a="exp">ثبت هزینه</button>':''}${it.type==='چک'?'<button class="b" data-a="chq">مدیریت چک</button>':''}<button class="b" data-a="res">ثبت نتیجه ✓</button>${it.virtual?'':'<button class="b s" data-a="snz">تعویق</button><button class="b s d" data-a="del" style="color:#fff">حذف</button>'}`}</div>`}).join('')||'<div class="card k">موردی در این بخش نیست.</div>'}`;
 $('#bk').onclick=()=>go('more');$('#nw').onclick=()=>remForm();
 $('#notifyOn').onclick=()=>{if(window.AndroidBridge&&AndroidBridge.requestNotifications)AndroidBridge.requestNotifications();else toast('اعلان روی گوشی فقط در نسخهٔ اندروید فعال می‌شود')};
 $('#notifyExact').onclick=()=>{if(window.AndroidBridge&&AndroidBridge.requestExactAlarms)AndroidBridge.requestExactAlarms();else toast('این تنظیم فقط در نسخهٔ اندروید در دسترس است')};
 V.onclick=async e=>{const f=e.target.dataset.f,a=e.target.dataset.a,id=e.target.closest('[data-t]')?.dataset.t;if(f){tk.f=f;return R.task()}if(!a)return;const it=taskItems().find(x=>x.id===id);if(!it)return;
  if(a==='msg')msgDlg(it.cid,TPL_OF[it.type]);if(a==='p360')p360(it.cid);if(a==='chq')G.chq();if(a==='res')resultDlg(it,it.type==='خرید مجدد'?'پیام ارسال شد':'انجام شد');if(a==='snz')snoozeDlg(it);
  if(a==='exp')expForm({...it.tpl,recur:true},async()=>{await tx(()=>mkTaskDone(it,'هزینه ثبت شد','',''))});
  if(a==='del'&&confirm('این کار حذف شود؟')&&await tx(()=>{db.reminders=db.reminders.filter(x=>x.id!==it.id)}))R.task();
  if(a==='undo'&&await tx(()=>{const r=db.reminders.find(x=>x.id===it.id);r.done=false;delete r.result;delete r.note;delete r.doneDate}))R.task()}};
G.rem2=()=>{tab='task';render()};

/* ================= داشبورد گرافیکی، فروش سریع، ورود سریع محصول ================= */
const PAL=['#1f5c4a','#b8923a','#3b82a0','#a34f6d','#7a8f3a','#8a6bbf','#c9653c'];
let pieMode='tp';
function lineSvg(items,tag){const W=340,H=176,pl=10,pr=10,pt=20,pb=24,n=items.length,mx=Math.max(1,...items.map(i=>i.v)),
 x=i=>n<2?W/2:W-pr-i*(W-pl-pr)/(n-1),y=v=>H-pb-v/mx*(H-pb-pt),P=items.map((it,i)=>[x(i),y(it.v)]);
 let d='M'+P[0][0]+','+P[0][1];for(let i=1;i<n;i++){const a=P[i-1],b=P[i],m=(a[0]+b[0])/2;d+=`C${m},${a[1]} ${m},${b[1]} ${b[0]},${b[1]}`}
 const area=d+`L${P[n-1][0]},${H-pb}L${P[0][0]},${H-pb}Z`,step=Math.ceil(n/8);
 return `<svg class="lc" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="نمودار خطی روند فروش"><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--pr)" stop-opacity=".35"/><stop offset="1" stop-color="var(--pr)" stop-opacity="0"/></linearGradient></defs>`+
 [0,.5,1].map(f=>`<line x1="${pl}" x2="${W-pr}" y1="${y(mx*f)}" y2="${y(mx*f)}" class="gl"/>`).join('')+
 `<text x="${W-pr}" y="${pt-6}" class="ax" text-anchor="end">${fa(short(mx))}</text><path d="${area}" fill="url(#lg)"/><path d="${d}" class="ln"/>`+
 items.map((it,i)=>`${i%step===0?`<text x="${P[i][0]}" y="${H-8}" class="ax" text-anchor="middle">${it.l}</text>`:''}<circle class="pt" cx="${P[i][0]}" cy="${P[i][1]}" r="${it.v?4:2.5}"/><circle class="hit" data-bar="${tag}:${it.id}" data-tip="${it.l}: ${T(it.v)}" cx="${P[i][0]}" cy="${P[i][1]}" r="13" tabindex="0"/>`).join('')+`</svg>`}
function pieSvg(items,tag){const tot=items.reduce((s,i)=>s+i.v,0);if(!tot)return '<div class="k">هنوز داده‌ای برای نمایش نیست.</div>';let cum=0;
 const arcs=items.map((it,i)=>{const p=it.v/tot*100,o=`<circle class="sl" data-bar="${tag}:${it.id}" data-tip="${esc(it.k)}: ${T(it.v)} (${fa(Math.round(p))}٪)" cx="21" cy="21" r="15.9155" stroke="${PAL[i%PAL.length]}" stroke-dasharray="${p} ${100-p}" stroke-dashoffset="${-cum}" tabindex="0"/>`;cum+=p;return o}).join('');
 return `<div class="pie"><svg viewBox="0 0 42 42" role="img" aria-label="نمودار دایره‌ای"><g transform="rotate(-90 21 21)">${arcs}</g><text x="21" y="20" class="pc1" text-anchor="middle">${fa(short(tot))}</text><text x="21" y="26" class="pc2" text-anchor="middle">جمع</text></svg>
 <div class="lg">${items.map((it,i)=>`<button class="lr" data-bar="${tag}:${it.id}"><i style="background:${PAL[i%PAL.length]}"></i><span>${esc(it.k)}</span><b>${fa(Math.round(it.v/tot*100))}٪</b></button>`).join('')}</div></div>`}
const dash0=R.dash;
R.dash=()=>{dash0();const f=periodFrom(dp),n=plNums(f),ok=okSales(f),tr=trendData(dp),
 pm=pieMode==='tp'?topProducts(f).map(r=>({id:r.pid,k:prod(r.pid)?.name||'؟',v:r.rev})):expByCat(f).map(r=>({id:r.k,k:r.k,v:r.v}));
 [...V.querySelectorAll('.card')].filter(c=>/^(روند فروش|کالاهای پرفروش|هزینه‌ها به تفکیک)/.test(c.textContent.trim())).forEach(c=>c.remove());
 const sum=ok.reduce((s,x)=>s+x.total,0),lbl={today:'امروز',week:'۷ روز اخیر',month:'این ماه',year:'امسال',all:'کل دوره'}[dp]||'';
 V.querySelector('.chips').insertAdjacentHTML('afterend',`${bkBanner()}<section class="hero"><div class="hl">فروش ${lbl}</div><div class="hv">${T(sum)}</div>
 <div class="hs"><span>سود ناخالص <b>${T(n.gp)}</b></span><span>${fa(ok.length)} فاکتور</span><span>صندوق و بانک <b>${T(bal('1101')+bal('1102'))}</b></span></div></section>
 <div class="acts"><button data-act="qs"><span>⚡</span>فروش سریع</button><button data-act="qp"><span>＋</span>محصول جدید</button><button data-act="buyForm"><span>📥</span>خرید کالا</button><button data-act="qr"><span>↩️</span>مرجوعی</button></div>
 <div class="card"><b>روند فروش</b><div class="tip" id="tip" aria-live="polite">روی نقطه‌ها بزنید یا نگه دارید</div>${lineSvg(tr,'tr')}</div>
 <div class="card"><div class="seg"><button data-pm="tp" class="${pieMode==='tp'?'on':''}">پرفروش‌ها</button><button data-pm="ex" class="${pieMode==='ex'?'on':''}">هزینه‌ها</button></div>${pieSvg(pm,pieMode)}</div>`);
 const old=V.onclick;V.onclick=e=>{const a=e.target.closest('[data-act]');if(a){G[a.dataset.act]?(G[a.dataset.act]()):window[a.dataset.act]();return}const m=e.target.closest('[data-pm]');if(m){pieMode=m.dataset.pm;R.dash();return}old(e)};
 const tip=t=>{const b=t.closest&&t.closest('[data-tip]');if(b&&$('#tip'))$('#tip').textContent=b.dataset.tip};V.onmouseover=e=>tip(e.target);V.onfocusin=e=>tip(e.target)};
/* --- ورود سریع محصول --- */
G.qp=function(){modal(`<h3>محصول جدید</h3><label>نام</label><input id="qn" autocomplete="off"><div class="grid"><div><label>قیمت فروش</label><input id="qpr" inputmode="numeric"></div><div><label>قیمت خرید</label><input id="qc" inputmode="numeric"></div></div><label>موجودی اولیه (گرم)</label><input id="qq" inputmode="numeric" value="1">
 <div class="err" id="e"></div><button class="b" id="s1">ثبت و بستن</button><button class="b s" id="s2">ثبت و محصول بعدی</button><button class="b s" id="no">بستن</button>`);$('#no').onclick=close;setTimeout(()=>$('#qn').focus(),50);
 const go=async more=>{const o={name:$('#qn').value.trim(),price:num($('#qpr').value),cost:num($('#qc').value),qty:num($('#qq').value),min:0};
  if(!o.name)return $('#e').textContent='نام محصول را وارد کنید.';if(!(o.price>0))return $('#e').textContent='قیمت فروش را وارد کنید.';
  if(await tx(()=>mkProduct(o))){toast('«'+o.name+'» ثبت شد');if(more){G.qp()}else{close();render()}}};
 $('#s1').onclick=()=>go(false);$('#s2').onclick=()=>go(true)};
/* --- فروش سریع --- */
async function qsCommit(q,method,cid=''){const credit=method==='credit',lines=Object.entries(q).map(([pid,n])=>({pid,n,price:prod(pid).price})),t=lines.reduce((s,l)=>s+l.n*l.price,0);let id;
 return await tx(()=>{id=mkSale(lines,cid,0,credit?0:t,credit?'1101':method)})?id:null}
G.qs=function(){const q={};let m='1101',s='',cid='';
 const tot=()=>Object.entries(q).reduce((a,[id,n])=>a+n*prod(id).price,0),cnt=()=>Object.values(q).reduce((a,b)=>a+b,0);
 const bar=()=>{$('#qt').textContent=T(tot());$('#qc2').textContent=fa(cnt())+' قلم';$('#qok').disabled=!cnt()};
 const tiles=()=>{const L=db.products.filter(p=>p.active!==false&&(db.allowNegStock||p.qty>0)&&(!s||nz(p.name+' '+(p.brand||'')).includes(nz(s))));
  $('#qg').innerHTML=L.map(p=>{const n=q[p.id]||0,u=esc(p.unit||'');return `<div class="qt ${n?'on':''}"><button data-a="add" data-id="${p.id}"><b>${esc(p.name)}</b><span>${T(p.price)} / ${u}</span><small>موجودی ${fa(p.qty)} ${u}</small></button>${n?`<div class="qn"><button data-a="sub" data-id="${p.id}" aria-label="کم کردن">−</button><input class="qin" inputmode="numeric" data-id="${p.id}" value="${n}" aria-label="مقدار (${u})"><button data-a="add" data-id="${p.id}" aria-label="اضافه کردن">+</button></div>${p.unit==='گرم'?`<div class="qch">${[5,10,20,50,100].map(v=>`<button data-a="inc" data-id="${p.id}" data-v="${v}">+${fa(v)}</button>`).join('')}</div>`:''}<div class="qlt">جمع: <b id="lt-${p.id}">${T(n*p.price)}</b></div>`:''}</div>`}).join('')||'<div class="k">کالایی پیدا نشد.</div>';
  bar();
  $('#qm1').className=m==='1101'?'on':'';$('#qm2').className=m==='1102'?'on':'';$('#qm3').className=m==='credit'?'on':''};
 const custUi=()=>{const c=cust(cid);$('#qcu').innerHTML=c?`<div class="qcc"><span>👤 <b>${esc(c.name)}</b> <small>${esc(c.phone||'')} · بدهی: ${T(cDebt(c.id))}</small></span><button data-a="cx" aria-label="حذف مشتری">✕</button></div>`:`<input id="qcq" placeholder="مشتری: نام یا موبایل (خالی = مشتری گذری)" autocomplete="off"><div id="qcr"></div>`;
  if(!c)$('#qcq').oninput=e=>{$('#qcr').innerHTML=e.target.value.trim()?findCust(e.target.value).slice(0,6).map(x=>`<button class="lr" data-a="pc" data-id="${x.id}"><span>${esc(x.name)}</span><small>${esc(x.phone||'')}</small></button>`).join('')||'<div class="k">مشتری پیدا نشد.</div>':''};
  $('#qm3').style.display=c?'':'none';if(!c&&m==='credit')m='1101'};
 modal(`<h3>فروش سریع</h3><div id="qcu"></div><input id="qs0" placeholder="جست‌وجوی کالا" autocomplete="off"><div class="qs" id="qg"></div>
 <div class="qb"><div><div class="v" id="qt"></div><div class="k" id="qc2"></div></div><div class="seg"><button id="qm1" data-a="m1101">نقد</button><button id="qm2" data-a="m1102">کارت</button><button id="qm3" data-a="mcredit">نسیه</button></div><button class="b" id="qok" data-a="ok">ثبت فاکتور</button><button class="b s" data-a="no">بستن</button></div>`);
 $('#qs0').oninput=e=>{s=e.target.value;tiles()};
 $('#dlg').onclick=async e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,p=prod(b.dataset.id);
  if(a==='pc'){cid=b.dataset.id;custUi();return tiles()}if(a==='cx'){cid='';custUi();return tiles()}
  if(a==='add'||a==='inc'){const n=q[p.id]||0,v=qsClamp(p,n+(a==='inc'?Number(b.dataset.v):qsStep(p)));if(v===n)return toast('موجودی «'+p.name+'» کافی نیست.');q[p.id]=v}
  else if(a==='sub'){const v=qsClamp(p,(q[p.id]||0)-qsStep(p));if(v)q[p.id]=v;else delete q[p.id]}else if(a[0]==='m')m=a.slice(1);else if(a==='no')return close();
  else if(a==='ok'){if(!cnt())return;const id=await qsCommit(q,m,cid);if(id){close();toast('فاکتور ثبت شد');render();showInv(id)}return}
  tiles()};custUi();tiles();
 $('#dlg').oninput=e=>{const i=e.target.closest&&e.target.closest('.qin');if(!i)return;const p=prod(i.dataset.id),v=qsClamp(p,num(i.value));if(v)q[p.id]=v;else delete q[p.id];const lt=$('#lt-'+p.id);if(lt)lt.textContent=T(v*p.price);bar()};
 $('#dlg').onchange=e=>{if(e.target.closest&&e.target.closest('.qin'))tiles()}};
/* --- دکمهٔ شناور فروش سریع در همهٔ صفحه‌ها --- */
const render0=render;render=function(){render0();if(!document.getElementById('fab')){const b=document.createElement('button');b.id='fab';b.textContent='⚡ فروش سریع';b.onclick=()=>G.qs();document.body.appendChild(b)}};

/* ================= هم‌سبک‌سازی صفحه‌های مشتریان، کالاها و فروش ================= */
const deco={cust(){V.querySelectorAll('.card[data-id]').forEach(c=>{const b=c.querySelector('b');if(b&&!c.querySelector('.av'))c.insertAdjacentHTML('afterbegin',`<span class="av" aria-hidden="true">${esc([...b.textContent.trim()][0]||'؟')}</span>`)})},
 stock(){if(V.querySelector('#addP')&&!V.querySelector('#qpb')){V.querySelector('#addP').insertAdjacentHTML('afterend','<button class="b s" id="qpb">⚡ ورود سریع</button>');V.querySelector('#qpb').onclick=()=>G.qp()}},
 sale(){if(!V.querySelector('#qsb')){V.insertAdjacentHTML('afterbegin','<button class="b qsb" id="qsb">⚡ فروش سریع کالاها</button>');V.querySelector('#qsb').onclick=()=>G.qs()}}};
['cust','stock','sale'].forEach(k=>{const o=R[k];R[k]=function(){o.apply(this,arguments);try{deco[k]()}catch(e){}}});

/* --- مرجوعی سریع: جست‌وجوی فاکتور با شماره، نام یا موبایل مشتری --- */
function qrFind(q){const k=nz(q||'');return db.sales.filter(x=>x.status!=='cancel'&&x.lines.some(l=>l.n-(l.ret||0)>0)).filter(x=>{if(!k)return true;const c=cust(x.cid);return String(x.no)===k||nz((c?c.name:'')+' '+(c?c.phone||'':'')).includes(k)}).sort((a,b)=>b.no-a.no).slice(0,15)}
G.qr=function(){const draw=v=>{$('#qrl').innerHTML=qrFind(v).map(x=>{const c=cust(x.cid);return `<button class="lr" data-id="${x.id}"><span>فاکتور ${fa(x.no)} · ${esc(c?c.name:'مشتری گذری')}<br><small>${fa(x.date)}</small></span><b>${T(x.total)}</b></button>`}).join('')||'<div class="k">فاکتوری پیدا نشد.</div>'};
 modal(`<h3>مرجوعی کالا</h3><div class="k">شمارهٔ فاکتور، نام یا موبایل مشتری را بنویسید و فاکتور را انتخاب کنید. کالا به انبار برمی‌گردد و از فروش کم می‌شود.</div><input id="qrs" autocomplete="off"><div id="qrl"></div><button class="b s" id="no">بستن</button>`);
 $('#no').onclick=close;$('#qrs').oninput=e=>draw(e.target.value);$('#qrl').onclick=e=>{const b=e.target.closest('[data-id]');if(b)retForm(b.dataset.id)};draw('');setTimeout(()=>$('#qrs').focus(),50)};

/* ================= گرم‌محور، پشتیبان خودکار، قفل برنامه ================= */
function qsStep(p){return p.unit==='گرم'?10:1}
function qsClamp(p,v){v=Math.floor(Number(v)||0);if(v<0)v=0;if(!db.allowNegStock&&v>p.qty)v=Math.max(0,p.qty);return v}
/* پشتیبان */
let bkWriter=(n,t)=>dlf(n,t,'application/json');
function bkDays(){return db.lastBackup?Math.floor((Date.now()-db.lastBackup)/864e5):null}
function bkBanner(){const d=bkDays();if(!(db.dirty>0)||(d!==null&&d<3))return '';return `<div class="bkb" role="alert"><span>⚠️ ${d===null?'هنوز پشتیبان نگرفته‌اید':fa(d)+' روز از آخرین پشتیبان گذشته'} (${fa(db.dirty)} تغییر ذخیره‌نشده)</span><button data-act="backup">ذخیره پشتیبان</button></div>`}
async function autoBackup(){try{if(!window.AndroidBridge||!(db.dirty>0)||Date.now()-(db.autoBk||0)<864e5)return false;
 await bkWriter('خودکار_'+(db.shop.name||'فروشگاه')+'_'+toJ().replace(/\//g,'-')+'.json',JSON.stringify(db));return await tx(()=>{db.lastBackup=db.autoBk=Date.now();db.dirty=-1})}catch(e){return false}}
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
/* اعلان‌های اندروید: تولد بر پایهٔ ماه/روز شمسی، کارها با تاریخ/ساعت محلی */
function validReminderTime(t){return /^([01]\d|2[0-3]):[0-5]\d$/.test(en(t||''))}
function reminderMillis(date,time){if(!validJ(date)||!validReminderTime(time))return NaN;
 const [y,m,d]=normJ(date).split('/').map(Number),g=d2g(j2d(y,m,d)),[h,mi]=en(time).split(':').map(Number);
 return new Date(g.gy,g.gm-1,g.gd,h,mi,0,0).getTime()}
function phoneAlertData(){const birthdays=db.customers.filter(c=>!c.archived&&c.birth&&validJ(c.birth)).map(c=>{
 const a=normJ(c.birth).split('/').map(Number);return{id:String(c.id),name:String(c.name||'مشتری'),month:a[1],day:a[2]}});
 const reminders=db.reminders.filter(r=>!r.done&&validJ(r.date)).map(r=>({id:String(r.id),title:String(r.title||'یادآوری فروشگاه'),when:reminderMillis(r.date,r.time||'09:00')})).filter(r=>Number.isFinite(r.when)&&r.when>Date.now());
 return{birthdays,reminders}}
function syncPhoneAlerts(){try{if(window.AndroidBridge&&AndroidBridge.syncNotifications)AndroidBridge.syncNotifications(JSON.stringify(phoneAlertData()))}catch(e){console.warn('Could not schedule Android reminders',e)}}
/* قفل */
const lkGet=()=>{try{return JSON.parse(localStorage.getItem('hana_lock')||'null')}catch(e){return null}};
const lkPut=o=>{try{localStorage.setItem('hana_lock',o?JSON.stringify(o):'')}catch(e){}};
const h53=(s,seed=0)=>{let a=0xdeadbeef^seed,b=0x41c6ce57^seed;for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,2654435761);b=Math.imul(b^c,1597334677)}a=Math.imul(a^a>>>16,2246822507)^Math.imul(b^b>>>13,3266489909);b=Math.imul(b^b>>>16,2246822507)^Math.imul(a^a>>>13,3266489909);return(4294967296*(2097151&b)+(a>>>0)).toString(36)};
async function pinHash(pin,salt){const d=salt+':'+pin;if(window.crypto&&crypto.subtle){const u=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(d));return 's'+[...new Uint8Array(u)].map(x=>x.toString(16).padStart(2,'0')).join('')}return 'h'+h53(d)}
const bioOk=()=>!!(window.AndroidBridge&&AndroidBridge.hasBiometric&&AndroidBridge.hasBiometric());
async function lkSet(pin){const salt=Math.random().toString(36).slice(2)+Date.now().toString(36);lkPut({salt,h:await pinHash(pin,salt),len:pin.length,bio:bioOk()})}
async function lkCheck(pin){const L=lkGet();return !!L&&L.len===pin.length&&await pinHash(pin,L.salt)===L.h}
let lkBuf='',lkFails=0,lkUntil=0,hiddenAt=0;
function lkHide(){const el=document.getElementById('lk');if(el)el.remove();lkBuf='';lkFails=0}
function lkDraw(el,msg){const L=lkGet();if(!L)return;
 el.innerHTML=`<div class="lkb"><div class="lkt">🔒 ${esc((db&&db.shop&&db.shop.name)||'مدیریت فروشگاه')}</div><div class="lkd" aria-live="polite">${'●'.repeat(lkBuf.length)}${'○'.repeat(Math.max(0,L.len-lkBuf.length))}</div><div class="lkm">${esc(msg||'رمز را وارد کنید')}</div><div class="lkp">${[1,2,3,4,5,6,7,8,9,'bio',0,'del'].map(k=>k==='bio'?(L.bio&&bioOk()?'<button data-k="bio" aria-label="اثر انگشت">🔐</button>':'<span></span>'):k==='del'?'<button data-k="del" aria-label="حذف">⌫</button>':`<button data-k="${k}">${fa(k)}</button>`).join('')}</div></div>`;
 el.onclick=async e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k;if(k==='bio'){AndroidBridge.authenticate();return}
  if(Date.now()<lkUntil)return lkDraw(el,'چند ثانیه صبر کنید…');
  if(k==='del')lkBuf=lkBuf.slice(0,-1);else if(lkBuf.length<L.len)lkBuf+=k;
  if(lkBuf.length===L.len){if(await lkCheck(lkBuf))return lkHide();lkBuf='';if(++lkFails>=5){lkUntil=Date.now()+30000;lkFails=0;return lkDraw(el,'۵ بار اشتباه؛ ۳۰ ثانیه صبر کنید')}return lkDraw(el,'رمز اشتباه است')}
  lkDraw(el,'')}}
function lkShow(){const L=lkGet();if(!L)return;document.querySelectorAll('dialog[open]').forEach(d=>d.close());let el=document.getElementById('lk');
 if(!el){el=document.createElement('div');el.id='lk';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');document.body.appendChild(el)}lkBuf='';lkDraw(el,'');
 if(L.bio&&bioOk()){window.__bio=ok=>{if(ok)lkHide()};setTimeout(()=>AndroidBridge.authenticate(),300)}}
G.lock=function(){const L=lkGet(),pf='type="password" inputmode="numeric" maxlength="6" autocomplete="off"';
 modal(L?`<h3>قفل برنامه (فعال)</h3><label>رمز فعلی</label><input id="lo" ${pf}><label>رمز جدید (۴ تا ۶ رقم) — فقط برای تغییر</label><input id="ln" ${pf}><div class="err" id="e"></div><button class="b" id="lc">تغییر رمز</button><button class="b d" id="ld">غیرفعال کردن</button><button class="b s" id="no">بستن</button>`
 :`<h3>فعال‌سازی قفل برنامه</h3><label>رمز (۴ تا ۶ رقم)</label><input id="ln" ${pf}><label>تکرار رمز</label><input id="lr" ${pf}><div class="k">${bioOk()?'اثر انگشت هم فعال می‌شود. ':''}اگر رمز را فراموش کنید راه بازیابی وجود ندارد (فقط پاک کردن اطلاعات برنامه). حتماً پشتیبان JSON داشته باشید.</div><div class="err" id="e"></div><button class="b" id="lc">فعال‌سازی</button><button class="b s" id="no">بستن</button>`);
 const P=id=>en($('#'+id).value).trim(),ok=p=>/^\d{4,6}$/.test(p);$('#no').onclick=close;
 $('#lc').onclick=async()=>{const n=P('ln');if(!ok(n))return $('#e').textContent='رمز باید ۴ تا ۶ رقم باشد.';
  if(L){if(!(await lkCheck(P('lo'))))return $('#e').textContent='رمز فعلی اشتباه است.'}else if(n!==P('lr'))return $('#e').textContent='تکرار رمز یکسان نیست.';
  await lkSet(n);close();toast(L?'رمز تغییر کرد.':'قفل برنامه فعال شد.');render()};
 if(L)$('#ld').onclick=async()=>{if(!(await lkCheck(P('lo'))))return $('#e').textContent='رمز فعلی اشتباه است.';lkPut(null);close();toast('قفل غیرفعال شد.');render()}};
const more0=R.more;R.more=function(){more0.apply(this,arguments);try{if(V.querySelector('.tiles')&&!V.querySelector('#lkb')){const d=bkDays();V.insertAdjacentHTML('beforeend',`<button class="b s" id="lkb" style="width:100%;margin:12px 0 0">${lkGet()?'🔒 قفل برنامه (فعال)':'🔓 قفل برنامه (غیرفعال)'}</button><div class="k" style="margin-top:6px">آخرین پشتیبان: ${d===null?'هنوز گرفته نشده':d===0?'امروز':fa(d)+' روز پیش'}</div>`);V.querySelector('#lkb').onclick=()=>G.lock()}}catch(e){}};
if(lkGet())lkShow();
document.addEventListener('visibilitychange',()=>{if(document.hidden){hiddenAt=Date.now();autoBackup()}else if(lkGet()&&hiddenAt&&Date.now()-hiddenAt>6e4&&!document.getElementById('lk'))lkShow()});
