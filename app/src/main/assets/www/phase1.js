'use strict';
/* Fractional inventory: additive, never rewrites historical IndexedDB records on load. */
(function(){
 const SCALE=1000;
 const q=n=>{if(typeof n!=='number'||!Number.isFinite(n)||n<0||!Number.isSafeInteger(Math.round(n*SCALE))||Math.abs(n*SCALE-Math.round(n*SCALE))>1e-7)throw Error('مقدار باید غیرمنفی و با حداکثر سه رقم اعشار باشد');return Math.round(n*SCALE)/SCALE};
 const parse=s=>{const x=en(s).trim().replace(/٫/g,'.').replace(/[٬،\s]/g,'').replace(/,/g,'.');return /^\d+(\.\d{1,3})?$/.test(x)?q(Number(x)):NaN};
 const goodMoney=n=>Number.isSafeInteger(n)&&n>=0;
 const stockValue=p=>Number.isSafeInteger(p.stockValue)?p.stockValue:Math.round(p.qty*p.cost);
 function setStock(p,n,v){p.qty=q(n);if(!goodMoney(v)||(!p.qty&&v!==0))throw Error('ارزش موجودی نامعتبر است');p.stockValue=v;if(p.qty)p.cost=Math.round(v/p.qty)}
 function incoming(p,n,val){n=q(n);if(!n||!goodMoney(val))throw Error('خرید نامعتبر است');setStock(p,q(p.qty+n),stockValue(p)+val)}
 function outgoing(p,n){n=q(n);if(!n||p.qty<n||p.qty<=0)throw Error('موجودی «'+p.name+'» کافی نیست');const old=stockValue(p),after=q(p.qty-n),used=after===0?old:Math.min(old,Math.round(old*n/p.qty));setStock(p,after,old-used);return used}
 stockIn=function(p,n,v){incoming(p,n,v)};
 mkBuy=function(id,n,c,method,supplier){n=q(n);if(!n||!goodMoney(c)||c<=0)throw Error('مقدار یا قیمت خرید نامعتبر است');
  if(!['1101','1102','2101'].includes(method))throw Error('روش پرداخت نامعتبر است');
  if(method==='2101'&&(!supplier||!db.suppliers.some(x=>x.id===supplier)))throw Error('برای خرید نسیه تأمین‌کننده لازم است');
  const p=prod(id);if(!p)throw Error('کالا یافت نشد');const val=Math.round(n*c);if(!goodMoney(val))throw Error('مبلغ خرید نامعتبر است');
  const ref=uid();post(toJ(),'خرید '+p.name,[{a:'1104',d:val},{a:method,c:val,p:method==='2101'?supplier:undefined}],ref);
  incoming(p,n,val);db.purchases.push({id:ref,date:toJ(),pid:id,n,c,method,sup:supplier||'',amount:val});return ref
 };
 mkSale=function(items,cid,disc,paid,method){if(!Array.isArray(items)||!items.length)throw Error('سبد خالی است');
  if(!goodMoney(disc)||!goodMoney(paid))throw Error('مبلغ یا تخفیف نامعتبر است');
  if(paid>0&&!['1101','1102'].includes(method))throw Error('روش پرداخت نامعتبر است');
  const rows=items.map(l=>{const p=prod(l.pid),n=q(l.n);if(!p||!n||!goodMoney(l.price))throw Error('ردیف نامعتبر');return {pid:l.pid,n,price:l.price,gross:Math.round(n*l.price)}});
  const sub=rows.reduce((a,l)=>a+l.gross,0),total=sub-disc;if(!goodMoney(sub)||disc>sub||paid>total)throw Error('مبلغ فاکتور نامعتبر است');
  if(total>paid&&!cid)throw Error('برای فروش نسیه مشتری انتخاب کنید');
  const id=uid(),no=Math.max(1000,...db.sales.map(s=>+s.no||0))+1;let cost=0;
  rows.forEach(l=>{const p=prod(l.pid),original=stockValue(p)/(p.qty||1);l.cogs=outgoing(p,l.n);l.cost=original;l.ret=0;l.retCogs=0;l.retGoodCogs=0;l.retDiscount=0;cost+=l.cogs});
  db.sales.push({id,no,date:toJ(),time:new Date().toTimeString().slice(0,5),cid,lines:rows,sub,disc,total,paid,method,originalSub:sub,originalDiscount:disc,status:paid>=total?'paid':paid>0?'part':'unpaid'});
  const entries=[];if(paid)entries.push({a:method,d:paid});if(total>paid)entries.push({a:'1103',d:total-paid});
  if(disc)entries.push({a:'4102',d:disc});entries.push({a:'4101',c:sub});
  // Discount is a contra-revenue debit, so the document stays balanced.
  post(toJ(),'فروش فاکتور '+no,entries,id);
  if(cost)post(toJ(),'بهای تمام‌شده فاکتور '+no,[{a:'5101',d:cost},{a:'1104',c:cost}],id);
  if(cid){const pt=Math.floor(total/1000)*db.loyalty.perThousand;if(pt>0)db.points.push({id:uid(),cid,n:pt,why:'فاکتور '+no,ref:id})}
  return id
 };
 mkReturn=function(sid,index,amount,method,cond){const s=db.sales.find(x=>x.id===sid),l=s?.lines[index];if(!l)throw Error('ردیف فاکتور یافت نشد');
  if(!['1101','1102','1103'].includes(method))throw Error('روش بازپرداخت نامعتبر است');
  const n=q(amount),old=q(l.ret||0),next=q(old+n);if(!n||next>l.n)throw Error('مقدار برگشتی نامعتبر است');
  const gross=Math.round(next*l.price)-Math.round(old*l.price);
  const base=s.originalSub||s.sub+Math.round(old*l.price);
  const discount=s.originalDiscount??s.disc;
  const cumulativeDiscount=Math.round(discount*Math.round(next*l.price)/Math.max(1,base));
  const discShare=cumulativeDiscount-(l.retDiscount||0),net=gross-discShare;
  if(!goodMoney(net))throw Error('مبلغ مرجوعی نامعتبر است');
  if(method==='1103'&&(s.total-s.paid)<net)throw Error('مانده فاکتور کمتر از برگشتی است');
  if(method!=='1103'&&s.paid<net)throw Error('مبلغ دریافتی کمتر از برگشتی است');
  const originalCost=Number.isSafeInteger(l.cogs)?l.cogs:Math.round(l.n*l.cost);
  const cumulCost=next===l.n?originalCost:Math.round(originalCost*next/l.n);
  const restCost=cumulCost-(l.retCogs||0);const id=uid();
  const e=[{a:'4101',d:gross}];if(discShare)e.push({a:'4102',c:discShare});e.push({a:method,c:net});
  post(toJ(),'مرجوعی فاکتور '+s.no,e,id);
  if(cond==='ok'){const p=prod(l.pid);if(p){if(restCost)post(toJ(),'بازگشت بهای کالا',[{a:'1104',d:restCost},{a:'5101',c:restCost}],id);incoming(p,n,restCost)}}
  l.ret=next;l.retCogs=cumulCost;l.retGoodCogs=(l.retGoodCogs||0)+(cond==='ok'?restCost:0);l.retDiscount=cumulativeDiscount;
  s.sub-=gross;s.disc-=discShare;s.total-=net;if(method!=='1103')s.paid-=net;s.status=s.paid>=s.total?'paid':s.paid>0?'part':'unpaid';
  (db.returns=db.returns||[]).push({id,date:toJ(),sid,li:index,qty:n,net,method,cond,refundCost:restCost});
  if(s.cid){const pt=Math.floor(net/1000)*db.loyalty.perThousand;if(pt>0)db.points.push({id:uid(),cid:s.cid,n:-pt,why:'مرجوعی '+s.no,ref:id})}
  return id
 };
 mkAdjust=function(id,value,reason){const p=prod(id);if(!p)throw Error('کالا پیدا نشد');const next=q(value),delta=q(Math.abs(next-p.qty))*(next<p.qty?-1:1);
  if(!delta)throw Error('موجودی تغییر نکرده است');
  const old=stockValue(p),amount=delta>0?Math.round(delta*p.cost):next===0?old:Math.round(old*(-delta)/p.qty);
  if(!goodMoney(amount))throw Error('ارزش تعدیل نامعتبر است');
  const ref=uid();if(amount)post(toJ(),'تعدیل موجودی '+p.name+' '+reason,delta>0?[{a:'1104',d:amount},{a:'6103',c:amount}]:[{a:'6103',d:amount},{a:'1104',c:amount}],ref);
  setStock(p,next,old+(delta>0?amount:-amount));(db.stockMoves=db.stockMoves||[]).push({id:ref,date:toJ(),pid:id,delta,reason,value:amount});return ref
 };
 mkProduct=function(o){if(!o||!String(o.name||'').trim())throw Error('نام کالا لازم است');
  if(db.products.some(p=>p.name===o.name))throw Error('کالایی با این نام وجود دارد');
  const n=q(o.qty||0),min=q(o.min||0);if(!goodMoney(o.price)||!goodMoney(o.cost))throw Error('قیمت نامعتبر است');
  if(o.barcode&&db.products.some(p=>p.barcode===o.barcode))throw Error('بارکد تکراری است');
  const v=Math.round(n*o.cost),p={id:uid(),name:o.name,brand:o.brand||'',barcode:o.barcode||'',unit:o.unit||'گرم',price:o.price,cost:o.cost,qty:n,min,stockValue:v};
  db.products.push(p);if(v)post(toJ(),'موجودی افتتاحیه '+p.name,[{a:'1104',d:v},{a:'3101',c:v}],p.id);return p.id
 };
 mkBlend=function(o){
  const output=q(o.out),inputs=(o.ing||[]).filter(x=>x.pid&&x.qty>0);
  if(!output||!inputs.length)throw Error('مقدار محصول ترکیبی و مواد اولیه لازم است');
  const extra=o.extra||0;if(!goodMoney(extra))throw Error('هزینه تولید نامعتبر است');
  if(extra>0&&!['1101','1102'].includes(o.extraMethod))throw Error('روش پرداخت هزینه تولید نامعتبر است');
  const seen=new Set();for(const row of inputs){const n=q(row.qty),p=prod(row.pid);
   if(!n||!p||seen.has(row.pid)||row.pid===o.pid||p.qty<n)throw Error('مقدار مواد اولیه کافی نیست');seen.add(row.pid)}
  let target=o.pid&&prod(o.pid);
  if(!target){if(!String(o.name||'').trim()||db.products.some(p=>p.name===o.name))throw Error('نام محصول جدید نامعتبر است');
   target={id:uid(),name:o.name,brand:o.brand||'',barcode:'',unit:o.unit||'گرم',price:o.price||0,cost:0,qty:0,min:0,stockValue:0};db.products.push(target)}
  if(seen.has(target.id))throw Error('محصول نمی‌تواند ماده اولیه خودش باشد');
  let moved=0;for(const row of inputs)moved+=outgoing(prod(row.pid),q(row.qty));
  if(extra)post(toJ(),'هزینه تولید '+target.name,[{a:'1104',d:extra},{a:o.extraMethod,c:extra}],uid());
  incoming(target,output,moved+extra);
  const ref=uid();target.lastOut=output;target.recipe=inputs.map(x=>({pid:x.pid,per:x.qty/output}));
  (db.blends=db.blends||[]).push({id:ref,date:toJ(),pid:target.id,out:output,ing:inputs.map(x=>({pid:x.pid,qty:q(x.qty)})),raw:moved,extra,cost:Math.round((moved+extra)/output)});
  return target.id
 };
 const cash=parseInt;
 const readMoney=id=>{const x=en($(id).value).replace(/[\s٬،,]/g,'');return /^\d+$/.test(x)?Number(x):NaN};
 function purchaseEditor(id){const p=prod(id);if(!p)return toast('کالا پیدا نشد');
  modal('<h3>خرید جدید — '+esc(p.name)+'</h3><div class="card">موجودی فعلی: '+fa(p.qty)+' '+esc(p.unit)+'</div>'+
   '<label>مقدار خرید (تا ۳ رقم اعشار)</label><input id="phN" inputmode="decimal" placeholder="۵۰٫۳۷۵">'+
   '<label>قیمت خرید هر واحد (تومان)</label><input id="phC" inputmode="numeric" value="'+p.cost+'">'+
   '<label>قیمت فروش جدید هر واحد</label><input id="phP" inputmode="numeric" value="'+p.price+'">'+
   '<label>روش پرداخت</label><select id="phM"><option value="1101">صندوق</option><option value="1102">بانک</option><option value="2101">نسیه</option></select>'+
   '<label>تأمین‌کننده</label><select id="phS"><option value="">—</option>'+db.suppliers.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>').join('')+'</select>'+
   '<div class="k" id="phInfo"></div><div class="err" id="phErr"></div><button class="b" id="phSave">ثبت خرید و تغییر قیمت</button><button class="b s" id="phNo">لغو</button>');
  const draw=()=>{const n=parse($('#phN').value);$('#phInfo').textContent=Number.isFinite(n)?'موجودی جدید: '+fa(Math.round((p.qty+n)*1000)/1000)+' '+p.unit:''};
  $('#phN').oninput=draw;$('#phNo').onclick=close;
  $('#phSave').onclick=async()=>{const n=parse($('#phN').value),c=readMoney('#phC'),price=readMoney('#phP'),m=$('#phM').value,sup=$('#phS').value;
   if(!Number.isFinite(n)||!n||!goodMoney(c)||!c||!goodMoney(price))return $('#phErr').textContent='مقدار یا قیمت معتبر نیست';
   if(m==='2101'&&!sup)return $('#phErr').textContent='تأمین‌کننده را انتخاب کنید';
   if(await tx(()=>{mkBuy(id,n,c,m,sup);mkProdEdit(id,{name:p.name,brand:p.brand||'',barcode:p.barcode||'',unit:p.unit,price,min:p.min||0,active:p.active!==false})})){close();toast('خرید و قیمت ثبت شد');render()}
  }
 }
 const oldEdit=prodEdit;prodEdit=function(id){oldEdit(id);const b=$('#buyExisting');if(b){b.textContent='خرید و افزایش موجودی اعشاری';b.onclick=()=>purchaseEditor(id)}};
 buyForm=function(){if(!db.products.length)return toast('ابتدا کالا تعریف کنید');
  modal('<h3>خرید / ورود موجودی</h3><label>محصول</label><select id="p">'+db.products.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join('')+'</select>'+
   '<label>مقدار اعشاری</label><input id="n" inputmode="decimal"><label>بهای هر واحد (تومان)</label><input id="c" inputmode="numeric">'+
   '<label>روش پرداخت</label><select id="m"><option value="1101">صندوق</option><option value="1102">بانک</option><option value="2101">نسیه</option></select>'+
   '<label>تأمین‌کننده</label><select id="sp"><option value="">—</option>'+db.suppliers.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>').join('')+'</select>'+
   '<div class="err" id="e"></div><button class="b" id="ok">ثبت</button><button class="b s" id="no">لغو</button>');
  $('#no').onclick=close;$('#ok').onclick=async()=>{const n=parse($('#n').value),c=readMoney('#c');if(!Number.isFinite(n)||!n||!goodMoney(c)||!c)return $('#e').textContent='مقدار یا قیمت اشتباه است';
   if(await tx(()=>mkBuy($('#p').value,n,c,$('#m').value,$('#sp').value))){close();toast('خرید ثبت شد');render()}}
 };
 stockAdjust=function(id){const p=prod(id);modal('<h3>شمارش موجودی — '+esc(p.name)+'</h3><div class="card">موجودی: '+fa(p.qty)+' '+esc(p.unit)+'</div><label>موجودی واقعی</label><input id="n" inputmode="decimal" value="'+p.qty+'"><label>دلیل</label><select id="r"><option>انبارگردانی</option><option>ضایعات</option><option>اصلاح اشتباه</option></select><div class="err" id="e"></div><button class="b" id="ok">ثبت</button><button class="b s" id="no">لغو</button>');
  $('#no').onclick=close;$('#ok').onclick=async()=>{const n=parse($('#n').value);if(!Number.isFinite(n))return $('#e').textContent='مقدار نامعتبر';if(await tx(()=>mkAdjust(id,n,$('#r').value))){close();render()}}
 };
 const previousSale=R.sale;R.sale=function(){previousSale();const a=$('#add');if(a&&$('#sn'))a.onclick=()=>{const p=typeof saleSel!=='undefined'?prod(saleSel):prod($('#sp')?.value),n=parse($('#sn').value);
  if(!p||!Number.isFinite(n)||n<=0)return $('#e').textContent='مقدار نامعتبر';cart.push({pid:p.id,n,price:p.price});if(typeof saleSel!=='undefined')saleSel='';R.sale()}};
 finishSale=async function(){if(!cart.length)return $('#e').textContent='سبد خالی';
  const sub=cart.reduce((a,l)=>a+Math.round(l.n*l.price),0),disc=readMoney('#sd');
  const raw=$('#spd').value.trim(),paid=raw===''?sub-disc:readMoney('#spd');if(!goodMoney(disc)||!goodMoney(paid))return $('#e').textContent='مبلغ نامعتبر';
  let id;if(await tx(()=>{id=mkSale(cart,$('#sc').value,disc,paid,$('#sm').value)})){cart=[];if(typeof saleSel!=='undefined')saleSel='';toast('فاکتور ثبت شد');render();showInv(id)}
 };
 const prevReturn=retForm;retForm=function(id){const s=db.sales.find(x=>x.id===id),opts=s?.lines.map((l,i)=>[l,i]).filter(x=>x[0].n>(x[0].ret||0))||[];
  if(!opts.length)return toast('قلم قابل برگشت وجود ندارد');
  modal('<h3>مرجوعی</h3><label>کالا</label><select id="li">'+opts.map(x=>'<option value="'+x[1]+'">'+esc(prod(x[0].pid)?.name||'')+'</option>').join('')+'</select><label>مقدار</label><input id="rq" inputmode="decimal"><label>وضعیت</label><select id="rc"><option value="ok">سالم</option><option value="bad">ضایعات</option></select><label>روش بازپرداخت</label><select id="rm"><option value="1101">صندوق</option><option value="1102">بانک</option><option value="1103">کاهش بدهی</option></select><div class="err" id="e"></div><button class="b" id="ok">ثبت</button><button class="b s" id="no">لغو</button>');
  $('#no').onclick=close;$('#ok').onclick=async()=>{const n=parse($('#rq').value);if(!Number.isFinite(n)||!n)return $('#e').textContent='مقدار نامعتبر';if(await tx(()=>mkReturn(id,+$('#li').value,n,$('#rm').value,$('#rc').value))){close();render()}}
 };
 G.measuredProduct=function(){modal('<h3>کالای گرمی / میلی‌لیتری</h3><label>نام</label><input id="pmName"><label>واحد</label><select id="pmUnit"><option>گرم</option><option>میلی‌لیتر</option><option>عدد</option></select><label>موجودی</label><input id="pmQty" inputmode="decimal" value="0"><label>حداقل موجودی</label><input id="pmMin" inputmode="decimal" value="0"><label>قیمت خرید</label><input id="pmCost" inputmode="numeric" value="0"><label>قیمت فروش</label><input id="pmPrice" inputmode="numeric" value="0"><div class="err" id="pmErr"></div><button class="b" id="pmSave">ثبت کالا</button><button class="b s" id="pmNo">لغو</button>');
  $('#pmNo').onclick=close;$('#pmSave').onclick=async()=>{const o={name:$('#pmName').value.trim(),unit:$('#pmUnit').value,qty:parse($('#pmQty').value),min:parse($('#pmMin').value),cost:readMoney('#pmCost'),price:readMoney('#pmPrice')};
   if(!o.name||![o.qty,o.min].every(Number.isFinite)||![o.cost,o.price].every(goodMoney))return $('#pmErr').textContent='ورودی نامعتبر';if(await tx(()=>mkProduct(o))){close();render()}}
 };
 if(globalThis.HanaBusiness)HanaBusiness.makeMeasuredProduct=o=>{if(!['گرم','میلی‌لیتر','عدد'].includes(o.unit))throw Error('واحد نامعتبر');o.qty=q(o.qty);o.min=q(o.min);return mkProduct(o)};
 globalThis.HanaPhase1={SCALE,q,qtyInput:parse,stockValue,incoming,outgoing};
})();