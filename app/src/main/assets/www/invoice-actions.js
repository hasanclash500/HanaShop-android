'use strict';
/* Invoice actions: auditable corrections and reversals. No physical removal of posted invoices.
   Purchase/stock history must remain traceable across old JSON backups. */
(function(){
 const qty=n=>HanaPhase1.q(n),nonnegative=n=>Number.isSafeInteger(n)&&n>=0;
 const sales=id=>db.sales.find(s=>String(s.id)===String(id));
 const copy=o=>JSON.parse(JSON.stringify(o));
 const safe=s=>esc(String(s??''));
 const now=()=>({date:toJ(),time:new Date().toTimeString().slice(0,5),timestamp:Date.now()});
 function originalPaid(s){
  const entry=db.journal.filter(j=>j.ref===s.id&&/فروش فاکتور/.test(j.desc||''))[0];
  if(!entry)return null;
  return entry.lines.filter(l=>l.a==='1101'||l.a==='1102').reduce((t,l)=>t+(l.d||0),0);
 }
 function activeJournals(s){
  const j=s.activeJournalIds?db.journal.filter(v=>s.activeJournalIds.includes(v.id)):db.journal.filter(v=>v.ref===s.id);
  if(!j.length||s.activeJournalIds&&j.length!==s.activeJournalIds.length)throw Error('سندهای اصلی فاکتور کامل نیستند؛ اصلاح متوقف شد.');
  return j;
 }
 function isReturned(s){return (db.returns||[]).some(x=>String(x.sid)===String(s.id))||(s.lines||[]).some(l=>Number(l.ret||0)>0)}
 function eligible(id){
  const s=sales(id);if(!s)throw Error('فاکتور پیدا نشد.');
  if(s.status==='cancel')throw Error('این فاکتور قبلاً لغو شده است.');
  if(!Array.isArray(s.lines)||!s.lines.length)throw Error('ویرایش خودکار فاکتورهای قدیمی بدون ردیف پشتیبانی نمی‌شود.');
  if(db.lockDate&&s.date<=db.lockDate)throw Error('این فاکتور مربوط به دوره مالی بسته‌شده است.');
  if(isReturned(s))throw Error('این فاکتور مرجوعی دارد. برای حفظ اسناد و موجودی، اصلاح مستقیم مجاز نیست.');
  const orig=originalPaid(s);if(orig===null)throw Error('سند حسابداری اولیه پیدا نشد.');
  if(s.paid!==orig)throw Error('پس از صدور فاکتور دریافت دیگری ثبت شده است؛ ابتدا حساب مشتری را بررسی کنید.');
  if(!s.lines.every(l=>prod(l.pid)&&Number.isFinite(l.n)&&l.n>0&&nonnegative(l.price)))
   throw Error('کالا یا اطلاعات تاریخی فاکتور معتبر نیست.');
  return s;
 }
 function inverseJournals(s,ref,description){
  const entries=activeJournals(s);
  for(const j of entries){
   const inverse=j.lines.map(l=>({...l,d:l.c||0,c:l.d||0}));
   post(toJ(),description+' | برگشت سند '+j.no,inverse,ref);
  }
 }
 function originalCost(line){
  const v=Number.isSafeInteger(line.cogs)?line.cogs:Math.round(line.n*(Number(line.cost)||0));
  if(!nonnegative(v))throw Error('بهای تمام‌شده اصلی معتبر نیست.');
  return v;
 }
 function stockRestore(s){
  for(const l of s.lines){
   const p=prod(l.pid);if(!p)throw Error('کالای فاکتور در انبار وجود ندارد.');
   HanaPhase1.incoming(p,qty(l.n),originalCost(l));
  }
 }
 function pointReverse(s,reference){
  const entries=s.activePointIds?db.points.filter(p=>s.activePointIds.includes(p.id)):
    db.points.filter(p=>p.ref===s.id);
  for(const p of entries){if(!p.n)continue;db.points.push({id:uid(),cid:p.cid,n:-p.n,why:'اصلاح / لغو امتیاز فاکتور '+s.no,ref:reference})}
 }
 function revised(id,next){
  const s=eligible(id),old=copy(s),lineArr=Array.isArray(next.lines)?next.lines:[];
  if(!lineArr.length)throw Error('فاکتور بدون کالا نمی‌تواند ثبت شود.');
  const lines=lineArr.map(l=>{
   const p=prod(l.pid),n=qty(Number(l.n)),price=Number(l.price);
   if(!p||!n||!nonnegative(price))throw Error('کالا، تعداد یا قیمت نامعتبر است.');
   const gross=Math.round(n*price);if(!nonnegative(gross))throw Error('مبلغ این قلم معتبر نیست.');
   return{pid:l.pid,n,price,gross};
  });
  const sub=lines.reduce((a,l)=>a+l.gross,0),disc=Number(next.discount??0),total=sub-disc;
  if(!nonnegative(sub)||!nonnegative(disc)||disc>sub||!nonnegative(total))throw Error('تخفیف یا مبلغ کل نامعتبر است.');
  const cid=next.cid||'';if(cid&&!cust(cid))throw Error('مشتری انتخاب‌شده پیدا نشد.');
  if(s.paid>total)throw Error('مبلغ جدید کمتر از پرداخت قبلی است. برای بازپرداخت از مرجوعی استفاده کنید.');
  if(total>s.paid&&!cid)throw Error('برای مانده نسیه، مشتری را انتخاب کنید.');
  const ref=uid();inverseJournals(s,ref,'اصلاح فاکتور '+s.no);stockRestore(s);
  const newLines=[];let totalCogs=0;
  for(const l of lines){
   const p=prod(l.pid);
   const unitCost=HanaPhase1.stockValue(p)/(p.qty||1);
   const cogs=HanaPhase1.outgoing(p,l.n);
   totalCogs+=cogs;newLines.push({...l,cogs,cost:unitCost,ret:0,retCogs:0,retGoodCogs:0,retDiscount:0});
  }
  const newIds=[],add=(title,rows)=>{post(toJ(),title,rows,s.id);newIds.push(db.journal[db.journal.length-1].id)};
  const entry=[];if(s.paid)entry.push({a:s.method,d:s.paid});
  if(total>s.paid)entry.push({a:'1103',d:total-s.paid});
  if(disc)entry.push({a:'4102',d:disc});
  entry.push({a:'4101',c:sub});
  add('فروش اصلاح‌شده فاکتور '+s.no,entry);
  if(totalCogs)add('بهای اصلاح‌شده فاکتور '+s.no,[{a:'5101',d:totalCogs},{a:'1104',c:totalCogs}]);
  pointReverse(s,ref);
  const pt=cid?Math.floor(total/1000)*db.loyalty.perThousand:0,pointIds=[];
  if(pt>0){const p={id:uid(),cid,n:pt,why:'فاکتور اصلاح‌شده '+s.no,ref:s.id};db.points.push(p);pointIds.push(p.id)}
  s.cid=cid;s.lines=newLines;s.sub=sub;s.disc=disc;s.total=total;
  s.originalSub=sub;s.originalDiscount=disc;
  s.status=s.paid>=total?'paid':s.paid>0?'part':'unpaid';
  s.activeJournalIds=newIds;s.activePointIds=pointIds;s.lastEdited=now();
  (db.invoiceRevisions=db.invoiceRevisions||[]).push({id:ref,sid:s.id,action:'edit',at:now(),before:old,after:copy(s)});
  return s.id;
 }
 function voidSale(id,reason,refunded){
  const s=eligible(id);if(s.paid>0&&!refunded)throw Error('برای لغو فاکتور پرداخت‌شده باید بازپرداخت وجه را تأیید کنید.');
  const old=copy(s),ref=uid();inverseJournals(s,ref,'ابطال فاکتور '+s.no);
  stockRestore(s);pointReverse(s,ref);
  s.status='cancel';s.cancelInfo={...now(),reason:String(reason||'لغو به درخواست فروشگاه').slice(0,240),refundAmount:s.paid,method:s.method||'',refundConfirmed:!!refunded};
  s.activeJournalIds=[];s.activePointIds=[];
  (db.invoiceRevisions=db.invoiceRevisions||[]).push({id:ref,sid:s.id,action:'cancel',at:now(),before:old});
  return id;
 }
 function editDialog(id){
  let s;try{s=eligible(id)}catch(e){toast(e.message);return}
  let draft=s.lines.map(l=>({pid:l.pid,n:l.n,price:l.price}));let discount=s.disc,cid=s.cid||'';
  function form(){
   const options=db.products.map(p=>'<option value="'+safe(p.id)+'">'+safe(p.name)+'</option>').join('');
   const row=(l,i)=>'<div class="inv-edit-line" data-i="'+i+'">'+
    '<label>کالا</label><select data-field="pid">'+options+'</select>'+
    '<div class="inv-edit-two"><label>مقدار<input data-field="n" inputmode="decimal" value="'+safe(l.n)+'"></label>'+
    '<label>قیمت واحد (تومان)<input data-field="price" inputmode="numeric" value="'+safe(l.price)+'"></label></div>'+
    '<button type="button" class="b d" data-delete="'+i+'">حذف این ردیف</button></div>';
   modal('<h3>✏️ ویرایش فاکتور '+fa(s.no)+'</h3>'+
    '<div class="k">با ذخیره، سند اصلاحی ثبت می‌شود؛ نسخه قبلی در تاریخچه باقی می‌ماند. مبلغ دریافت‌شده تغییر نمی‌کند.</div>'+
    '<label>مشتری</label><select id="ieCustomer"><option value="">مشتری گذری</option>'+
    db.customers.map(c=>'<option value="'+safe(c.id)+'">'+safe(c.name)+'</option>').join('')+'</select>'+
    '<div id="ieRows">'+draft.map(row).join('')+'</div><button class="b s" id="ieAdd">+ افزودن کالا</button>'+
    '<label>تخفیف فاکتور (تومان)</label><input id="ieDiscount" inputmode="numeric" value="'+safe(discount)+'">'+
    '<div class="card"><div>دریافتی قبلی: '+T(s.paid)+'</div><b id="ieTotal"></b></div>'+
    '<div class="err" id="ieError"></div><button class="b" id="ieSave">ذخیره اصلاح فاکتور</button>'+
    '<button class="b s" id="ieBack">انصراف</button>');
   $('#ieCustomer').value=cid;
   document.querySelectorAll('#ieRows .inv-edit-line').forEach((el,i)=>{el.querySelector('[data-field=pid]').value=draft[i].pid});
   const collect=()=>{
    draft=Array.from(document.querySelectorAll('#ieRows .inv-edit-line')).map(el=>({
     pid:el.querySelector('[data-field=pid]').value,
     n:en(el.querySelector('[data-field=n]').value).trim().replace(/٫/g,'.'),
     price:en(el.querySelector('[data-field=price]').value).replace(/[\s٬،,]/g,'')
    }));
    discount=en($('#ieDiscount').value).replace(/[\s٬،,]/g,'');cid=$('#ieCustomer').value;
   };
   const total=()=>{let amount=0;
    for(const l of draft){const n=Number(l.n),p=Number(l.price);
     if(!Number.isFinite(n)||!Number.isSafeInteger(p)||n<0||p<0)return $('#ieTotal').textContent='مقدار یا قیمت نامعتبر';
     amount+=Math.round(n*p);
    }$('#ieTotal').textContent='مبلغ نهایی: '+T(amount-Number(discount||0))};
   $('#ieRows').oninput=()=>{collect();total()};
   $('#ieDiscount').oninput=()=>{collect();total()};
   $('#ieCustomer').onchange=collect;
   $('#ieRows').onclick=e=>{const b=e.target.closest('[data-delete]');if(!b)return;collect();draft.splice(Number(b.dataset.delete),1);form()};
   $('#ieAdd').onclick=()=>{collect();const p=db.products[0];if(!p)return $('#ieError').textContent='کالایی در انبار موجود نیست';
    draft.push({pid:p.id,n:1,price:p.price});form()};
   $('#ieBack').onclick=()=>invList();
   $('#ieSave').onclick=async()=>{collect();const arr=draft.map(l=>({pid:l.pid,n:Number(l.n),price:Number(l.price)})),dis=Number(discount);
    if(!confirm('اصلاح فاکتور ثبت شود؟ اسناد حسابداری جدید و سابقه تغییر ذخیره خواهند شد.'))return;
    const ok=await tx(()=>revised(id,{cid,lines:arr,discount:dis}));
    if(ok){toast('اصلاح فاکتور ثبت شد');showInv(id)}
   };
   total();
  }form()
 }
 function cancelDialog(id){
  let s;try{s=eligible(id)}catch(e){toast(e.message);return}
  modal('<h3>لغو فاکتور '+fa(s.no)+'</h3>'+
   '<div class="card"><b>حذف فیزیکی انجام نمی‌شود.</b><p class="k">فاکتور با وضعیت «لغوشده» حفظ می‌شود، اسناد حسابداری معکوس و کالاها به انبار بازگردانده می‌شوند.</p>'+
   (s.paid?'<p class="err">مبلغ دریافتی: '+T(s.paid)+' — فقط درصورتی لغو کنید که وجه واقعاً مسترد شده است.</p>':'')+'</div>'+
   '<label>دلیل لغو</label><input id="ivReason" placeholder="مثلاً صدور اشتباهی">'+
   (s.paid?'<label><input type="checkbox" id="ivRefund" style="width:auto"> مبلغ '+T(s.paid)+' را از همان روش دریافت مسترد کرده‌ام</label>':'')+
   '<div class="err" id="ivError"></div><button class="b d" id="ivOk">تأیید لغو و ثبت سند برگشت</button><button class="b s" id="ivBack">انصراف</button>');
  $('#ivBack').onclick=()=>invList();$('#ivOk').onclick=async()=>{
   const refunded=s.paid?$('#ivRefund').checked:false;if(s.paid&&!refunded)return $('#ivError').textContent='بدون تأیید بازپرداخت لغو ممکن نیست.';
   if(!confirm('آیا از لغو فاکتور و برگشت موجودی و اسناد حسابداری مطمئن هستید؟'))return;
   if(await tx(()=>voidSale(id,$('#ivReason').value,refunded))){toast('فاکتور با حفظ سابقه لغو شد');invList()}
  }
 }
 function list(){
  modal('<h3>🧾 فاکتورها</h3><input id="iq" placeholder="جست‌وجوی شماره، نام یا موبایل مشتری" autocomplete="off">'+
   '<div id="invoiceList" class="invoice-list"></div>'+
   '<div class="k">«حذف» به معنی لغو سند با حفظ سابقه است. برای مرجوعی بخشی از کالا، دکمه مرجوعی را بزنید.</div>'+
   '<button class="b s" id="invoiceClose">بستن</button>');
  const draw=()=>{
   const k=en($('#iq').value).trim().toLowerCase();
   const rows=db.sales.slice().reverse().filter(s=>{const c=cust(s.cid);return !k||String(s.no||'').includes(k)||
    (c?.name||'').toLowerCase().includes(k)||(c?.phone||'').includes(k)}).slice(0,120);
   $('#invoiceList').innerHTML=rows.map(s=>{
    const c=cust(s.cid),cancelled=s.status==='cancel',ret=isReturned(s);
    const status=cancelled?'لغوشده':{paid:'تسویه',part:'پرداخت جزئی',unpaid:'نسیه'}[s.status]||'—';
    return '<section class="invoice-row" data-invoice="'+safe(s.id)+'">'+
     '<div class="invoice-row-top"><b>شماره '+fa(s.no||'—')+'</b><span>'+fa(s.date)+'</span>'+
      '<span class="'+(cancelled?'neg':'pos')+'">'+status+'</span></div>'+
     '<div class="invoice-row-main"><strong>'+safe(c?.name||'مشتری گذری')+'</strong><b>'+T(s.total)+'</b></div>'+
     '<div class="invoice-row-actions"><button class="b s" data-act="open">مشاهده</button>'+
     (!cancelled?'<button class="b s" data-act="edit" '+(ret?'disabled title="فاکتور مرجوعی دارد"':'')+'>ویرایش</button>'+
     '<button class="b s" data-act="return">مرجوعی</button>'+
     '<button class="b d" data-act="void" '+(ret?'disabled title="دارای مرجوعی"':'')+'>حذف / لغو</button>':'')+'</div></section>'
   }).join('')||'<div class="card k">فاکتوری پیدا نشد.</div>';
  };
  $('#iq').oninput=draw;
  $('#invoiceList').onclick=e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;
   const id=b.closest('[data-invoice]')?.dataset.invoice;
   if(!id)return;
   const act=b.dataset.act;
   if(act==='open')showInv(id);
   if(act==='edit')editDialog(id);
   if(act==='void')cancelDialog(id);
   if(act==='return'){const s=sales(id);if(s&&s.lines.some(l=>l.n>(l.ret||0)))retForm(id);else toast('مقداری برای مرجوعی باقی نمانده است')}
  };
  $('#invoiceClose').onclick=close;draw();
 }
 invList=list;
 const oldReturn=retForm;
 retForm=function(id){
  const s=sales(id);if(!s||s.status==='cancel')return toast('مرجوعی فاکتور لغوشده یا ناموجود مجاز نیست.');
  return oldReturn(id);
 };
 const oldShow=showInv;
 showInv=function(id){
  oldShow(id);
  const s=sales(id),dlg=$('#dlg');if(!s||!dlg)return;
  if(s.status==='cancel'){
   const btn=$('#rt');if(btn)btn.remove();
   const prev=$('#ip');if(prev)prev.insertAdjacentHTML('afterbegin','<div class="err" style="font-size:19px;text-align:center;border:2px solid;padding:9px">باطل شده — این فاکتور لغو شده است</div>');
  }
  const el=document.createElement('div');el.className='invoice-show-actions card';
  el.innerHTML=s.status==='cancel'?'<div class="err">این فاکتور لغو شده است؛ فقط مشاهده و چاپ سابقه مجاز است.</div>':
   '<div class="invoice-row-actions"><button class="b s" id="invoiceEdit">✏️ ویرایش فاکتور</button>'+
   '<button class="b s" id="invoiceReturn">↩️ مرجوعی</button>'+
   '<button class="b d" id="invoiceVoid">حذف / لغو</button></div>';
  dlg.appendChild(el);
  const e=el.querySelector('#invoiceEdit'),r=el.querySelector('#invoiceReturn'),v=el.querySelector('#invoiceVoid');
  if(e)e.onclick=()=>editDialog(id);
  if(r)r.onclick=()=>retForm(id);
  if(v)v.onclick=()=>cancelDialog(id);
 };
 function previewData(q,cid){
  const lines=Object.entries(q).filter(([pid,n])=>n>0&&prod(pid)).map(([pid,n])=>({pid,n,ret:0,price:prod(pid).price}));
  if(!lines.length)throw Error('برای چاپ ابتدا کالا انتخاب کنید.');
  const sub=lines.reduce((a,l)=>a+Math.round(l.n*l.price),0);
  return{id:'',no:null,date:toJ(),time:new Date().toTimeString().slice(0,5),cid:cid||'',lines,sub,disc:0,total:sub,paid:0,status:'unpaid'};
 }
 function printDraft(q,cid){
  const s=previewData(q,cid),format=HanaInvoiceStudio.validFormat(db.pfmt||HanaInvoiceStudio.config().format),
   template=HanaInvoicePremium.mode(HanaInvoiceStudio.config().template);
  const banner='<div dir="rtl" style="padding:12px;border:2px dashed #c17c18;background:#fff7e4;color:#8b5200;text-align:center;font-weight:bold">'+
   'پیش‌فاکتور — فقط چاپ، بدون ثبت فروش، دریافت وجه یا تغییر موجودی</div>';
  const body=['f58','f80'].includes(format)?invHTML(s):HanaInvoicePremium.html(s,template);
  printHTML(banner+body,format);
  return s;
 }
 globalThis.HanaInvoiceActions={eligible,revise:revised,voidSale,previewData,printDraft,list,editDialog,cancelDialog,originalPaid,activeJournals};
})();