'use strict';
/* HanaShop business tools v2 — additive, backward-compatible with existing IndexedDB backups.
   Cash counts are observations, never silent accounting adjustments. Quantities use whole
   grams or millilitres; converting between mass and volume needs a product-specific density. */
(function(){
  const oldDefaults=ensureDefaults;
  ensureDefaults=function(){
    oldDefaults();
    if(!Array.isArray(db.cashCounts))db.cashCounts=[];
  };
  const whole=n=>Number.isSafeInteger(n)&&n>=0;
  function ledgerHealth(){
    const totals=db.journal.reduce((a,j)=>{(j.lines||[]).forEach(l=>{a.d+=l.d||0;a.c+=l.c||0});return a},{d:0,c:0});
    const stock=Math.round(db.products.reduce((a,p)=>a+(globalThis.HanaPhase1?HanaPhase1.stockValue(p):(p.qty||0)*(p.cost||0)),0));
    const receivable=db.customers.reduce((a,c)=>a+cDebt(c.id),0);
    const payable=db.suppliers.reduce((a,s)=>a+supBal(s.id),0);
    const checks=[
      {name:'تراز اسناد حسابداری',actual:totals.d,expected:totals.c,ok:totals.d===totals.c},
      {name:'موجودی دفتر و کالاها',actual:bal('1104'),expected:stock,ok:bal('1104')===stock},
      {name:'مطالبات دفتر و مشتریان',actual:bal('1103'),expected:receivable,ok:bal('1103')===receivable},
      {name:'بدهی دفتر و تأمین‌کنندگان',actual:-bal('2101'),expected:payable,ok:-bal('2101')===payable}
    ];
    return checks;
  }
  function countCash(actual,note){
    if(!whole(actual))throw new Error('مبلغ شمارش‌شده باید عدد صحیح و غیرمنفی باشد.');
    const expected=bal('1101');
    const record={id:uid(),date:toJ(),at:new Date().toISOString(),expected,actual,difference:actual-expected,note:String(note||'').trim()};
    db.cashCounts.push(record);
    return record;
  }
  function itemProfit(from=''){
    const by={};let excluded=0;
    db.sales.filter(s=>s.status!=='cancel'&&(!from||s.date>=from)).forEach(s=>{
      if(!Array.isArray(s.lines)||!s.lines.length){excluded++;return}
      const rows=s.lines.filter(l=>l.n-(l.ret||0)>0);
      const gross=rows.reduce((a,l)=>a+(l.n-(l.ret||0))*l.price,0);
      const netTotal=s.total;
      let allocated=0;
      rows.forEach((l,i)=>{
        const qty=l.n-(l.ret||0),p=prod(l.pid),revenue=i===rows.length-1?netTotal-allocated:Math.round(netTotal*(qty*l.price)/Math.max(1,gross));
        allocated+=revenue;
        const cost=Number.isSafeInteger(l.cogs)?l.cogs-(l.retGoodCogs||0):Math.round(qty*(l.cost||0));
        const o=by[l.pid]||(by[l.pid]={pid:l.pid,name:p?.name||'کالای حذف‌شده',unit:p?.unit||'',qty:0,revenue:0,cost:0,profit:0});
        o.qty+=qty;o.revenue+=revenue;o.cost+=cost;o.profit+=revenue-cost;
      });
    });
    return{rows:Object.values(by).sort((a,b)=>b.profit-a.profit),excluded};
  }
  function retentionData(days=60){
    const today=toJ();
    const rows=db.customers.filter(c=>!c.archived).map(c=>{
      const ss=cSales(c.id),last=ss.map(s=>s.date).sort().pop()||'',total=ss.reduce((a,s)=>a+s.total,0);
      return{id:c.id,name:c.name,phone:c.phone,last,days:last?jdiff(today,last):null,orders:ss.length,total,debt:cDebt(c.id),points:cPoints(c.id),promo:c.promo!==false};
    });
    return{inactive:rows.filter(x=>x.days!==null&&x.days>=days).sort((a,b)=>b.days-a.days),
      never:rows.filter(x=>!x.orders),top:rows.filter(x=>x.orders).sort((a,b)=>b.total-a.total).slice(0,15)};
  }
  function makeMeasuredProduct(o){
    if(!['گرم','میلی‌لیتر','عدد'].includes(o.unit))throw new Error('واحد کالا نامعتبر است.');
    for(const k of ['price','cost','qty','min'])if(!whole(o[k]))throw new Error('قیمت و مقدار باید عدد صحیح و غیرمنفی باشند.');
    if(!o.name.trim())throw new Error('نام کالا الزامی است.');
    return mkProduct(o);
  }
  /* Never reinterpret historical quantities by silently changing a product's unit. */
  const originalProdEdit=mkProdEdit;
  mkProdEdit=function(id,o){
    const p=prod(id);
    if(p&&o.unit!==p.unit&&(p.qty!==0||db.sales.some(s=>s.lines.some(l=>l.pid===id))||
       db.purchases.some(x=>x.pid===id)||(db.stockMoves||[]).some(m=>m.pid===id)))
      throw new Error('واحد کالای دارای موجودی یا سابقه را تغییر ندهید؛ کالای جدید با واحد درست بسازید.');
    return originalProdEdit(id,o);
  };
  G.cashCount=function(){
    ensureDefaults();
    const expected=bal('1101'),hist=db.cashCounts.slice(-8).reverse();
    modal('<h3>🧮 کنترل و شمارش صندوق</h3>'+
      '<div class="card"><div class="row"><span>موجودی دفتری صندوق</span><b>'+T(expected)+'</b></div>'+
      '<div class="k">مبلغ واقعی پول نقد را بشمارید. ثبت اختلاف، سند مالی یا موجودی دفتر را خودکار تغییر نمی‌دهد.</div></div>'+
      '<label>پول نقد شمارش‌شده (تومان)</label><input id="countActual" inputmode="numeric" placeholder="مبلغ واقعی">'+
      '<label>توضیح / علت اختلاف</label><textarea id="countNote" rows="2" placeholder="مثلاً پایان شیفت"></textarea>'+
      '<div class="err" id="countError"></div><button class="b" id="countSave">ثبت شمارش</button><button class="b s" id="countNo">بستن</button>'+
      (hist.length?'<h4>آخرین شمارش‌ها</h4>'+hist.map(r=>'<div class="row"><span>'+fa(r.date)+' · '+esc(r.note||'بدون توضیح')+'</span><b class="'+(r.difference?'neg':'pos')+'">'+T(r.difference)+'</b></div>').join(''):''));
    $('#countNo').onclick=close;
    $('#countSave').onclick=async()=>{
      const raw=en($('#countActual').value).replace(/[,،٬\s]/g,'');
      if(!/^\d+$/.test(raw))return $('#countError').textContent='مبلغ صحیح و غیرمنفی وارد کنید.';
      let r;if(await tx(()=>{r=countCash(Number(raw),$('#countNote').value)})){
        close();toast(r.difference?'اختلاف ثبت شد؛ برای اصلاح دفتر، سند جداگانه لازم است.':'صندوق بدون اختلاف ثبت شد.');render();
      }
    };
  };
  G.businessAudit=function(){
    ensureDefaults();const rows=ledgerHealth(),ok=rows.every(x=>x.ok);
    modal('<h3>📒 کنترل سلامت حسابداری</h3><div class="card '+(ok?'':'err')+'">'+
      (ok?'چهار کنترل اصلی بدون اختلاف هستند.':'اختلاف شناسایی شد؛ قبل از اصلاح از اطلاعات پشتیبان بگیرید.')+'</div>'+
      rows.map(x=>'<div class="card"><b>'+(x.ok?'✓ ':'⚠️ ')+x.name+'</b><div class="row"><span>دفتر</span><b>'+T(x.actual)+'</b></div><div class="row"><span>محاسبه مستقل</span><b>'+T(x.expected)+'</b></div></div>').join('')+
      '<div class="k">این کنترل‌ها جایگزین رسیدگی کامل حسابداری یا انبارگردانی فیزیکی نیستند.</div><button class="b s" id="auditNo">بستن</button>');
    $('#auditNo').onclick=close;
  };
  G.profitByProduct=function(){
    const f=periodFrom(dp),p=itemProfit(f),pl=plNums(f),rows=p.rows.slice(0,40);
    modal('<h3>📈 سود کالاها</h3><div class="k">دوره انتخاب‌شده در داشبورد: '+(f?fa(f)+' به بعد':'همه')+
      ' · فروش‌های همین دوره پس از مرجوعی‌های ثبت‌شده تا امروز. تخفیف فاکتور به نسبت مبلغ ردیف تقسیم شده است.</div>'+
      '<div class="card"><div class="row"><span>سود ناخالص دفتری دوره</span><b>'+T(pl.gp)+'</b></div><div class="row"><span>سود خالص پس از هزینه‌ها</span><b>'+T(pl.np)+'</b></div></div>'+
      rows.map(r=>'<div class="card"><b>'+esc(r.name)+'</b><div class="k">'+fa(r.qty)+' '+esc(r.unit)+'</div>'+
      '<div class="row"><span>فروش خالص</span><b>'+T(r.revenue)+'</b></div>'+
      '<div class="row"><span>بهای تمام‌شده تاریخی</span><b>'+T(r.cost)+'</b></div>'+
      '<div class="row"><span>سود ناخالص تقریبی</span><b class="'+(r.profit<0?'neg':'pos')+'">'+T(r.profit)+'</b></div></div>').join('')+
      (p.excluded?'<div class="err">'+fa(p.excluded)+' فاکتور قدیمی فاقد ردیف کالا در این گزارش محاسبه نشده است.</div>':'')+
      '<div class="k">گزارش کالایی ممکن است به دلیل تاریخ مرجوعی، ثبت دستی و تعدیل موجودی با سود دفتر متفاوت باشد. مرجع نهایی سود دوره، دفتر حسابداری است.</div>'+
      '<button class="b s" id="profitNo">بستن</button>');
    $('#profitNo').onclick=close;
  };
  G.customerInsights=function(){
    const data=retentionData(60);
    const row=(c,mode)=>'<button class="lr" data-customer="'+esc(c.id)+'"><span>'+esc(c.name)+
      '<small>'+esc(c.phone||'')+' · '+(mode==='inactive'?fa(c.days)+' روز بدون خرید':fa(c.orders)+' خرید')+'</small></span><b>'+T(c.total)+'</b></button>';
    modal('<h3>💝 مشتریان و وفاداری</h3><div class="card"><b>مشتریان بدون خرید در ۶۰ روز اخیر: '+fa(data.inactive.length)+'</b>'+
      '<div class="k">پیام تبلیغاتی فقط برای مشتریانی که رضایت دارند ارسال شود؛ هیچ پیام خودکاری فرستاده نمی‌شود.</div></div>'+
      '<h4>نیازمند پیگیری</h4>'+data.inactive.slice(0,20).map(c=>row(c,'inactive')).join('')+
      '<h4>مشتریان برتر</h4>'+data.top.map(c=>row(c,'top')).join('')+
      '<div class="k">بدون سابقه خرید: '+fa(data.never.length)+' نفر</div><button class="b s" id="loyalNo">بستن</button>');
    $('#loyalNo').onclick=close;$('#dlg').onclick=e=>{const id=e.target.closest('[data-customer]')?.dataset.customer;if(id)p360(id)};
  };
  G.measuredProduct=function(){
    modal('<h3>🧴 ثبت عطر با واحد مشخص</h3>'+
      '<label>نام عطر</label><input id="mpName" placeholder="نام کالا">'+
      '<label>واحد اندازه‌گیری</label><select id="mpUnit"><option>گرم</option><option>میلی‌لیتر</option><option>عدد</option></select>'+
      '<div class="k">گرم و میلی‌لیتر قابل تبدیل خودکار نیستند؛ چگالی هر عطر متفاوت است. در این نسخه مقدارها به واحد کامل ثبت می‌شوند.</div>'+
      '<label>موجودی اولیه (واحد انتخابی)</label><input id="mpQty" inputmode="numeric" value="0">'+
      '<label>حداقل موجودی برای هشدار</label><input id="mpMin" inputmode="numeric" value="0">'+
      '<label>قیمت خرید هر واحد (تومان)</label><input id="mpCost" inputmode="numeric" value="0">'+
      '<label>قیمت فروش هر واحد (تومان)</label><input id="mpPrice" inputmode="numeric" value="0">'+
      '<div class="err" id="mpError"></div><button class="b" id="mpSave">ثبت کالا</button><button class="b s" id="mpNo">لغو</button>');
    $('#mpNo').onclick=close;$('#mpSave').onclick=async()=>{
      const n=k=>{const raw=en($(k).value).replace(/[,،٬\s]/g,'');return /^\d+$/.test(raw)?Number(raw):NaN};
      const o={name:$('#mpName').value.trim(),unit:$('#mpUnit').value,qty:n('#mpQty'),min:n('#mpMin'),cost:n('#mpCost'),price:n('#mpPrice')};
      if(!o.name||!['qty','min','cost','price'].every(k=>whole(o[k])))return $('#mpError').textContent='نام و مقادیر صحیح و غیرمنفی لازم است.';
      if(await tx(()=>makeMeasuredProduct(o))){close();toast('عطر ثبت شد');render()}
    };
  };
  const priorDash=R.dash;
  R.dash=function(){
    priorDash();
    ensureDefaults();
    const check=ledgerHealth(),healthy=check.every(x=>x.ok),last=db.cashCounts[db.cashCounts.length-1],
      margin=itemProfit(periodFrom(dp)).rows[0],inactive=retentionData(60).inactive.length;
    V.insertAdjacentHTML('beforeend','<div class="card"><b>📌 مدیریت روزانه فروشگاه</b>'+
      '<div class="row"><span>کنترل حسابداری</span><b class="'+(healthy?'pos':'neg')+'">'+(healthy?'بدون اختلاف':'نیازمند بررسی')+'</b></div>'+
      '<div class="row"><span>آخرین اختلاف شمارش صندوق</span><b>'+(last?T(last.difference):'ثبت نشده')+'</b></div>'+
      '<div class="row"><span>مشتریان بدون خرید در ۶۰ روز</span><b>'+fa(inactive)+' نفر</b></div>'+
      '<div class="row"><span>بیشترین سود ناخالص کالایی در دوره</span><b>'+esc(margin?.name||'—')+'</b></div>'+
      '<div class="grid"><button class="b s" id="dashAudit">کنترل حسابداری</button>'+
      '<button class="b s" id="dashMargin">سود کالاها</button><button class="b s" id="dashCount">شمارش صندوق</button></div></div>');
    const bind=(id,fn)=>{const el=V.querySelector(id);if(el)el.onclick=fn};
    bind('#dashAudit',()=>G.businessAudit());bind('#dashMargin',()=>G.profitByProduct());bind('#dashCount',()=>G.cashCount());
  };
  const oldMore=R.more;
  R.more=function(){
    oldMore();
    V.insertAdjacentHTML('beforeend','<div class="card"><b>✨ ابزارهای مدیریت فروشگاه</b>'+
      '<div class="grid"><button class="b" id="businessAudit">کنترل حسابداری</button>'+
      '<button class="b" id="cashCount">شمارش صندوق</button>'+
      '<button class="b" id="profitByProduct">سود هر عطر</button>'+
      '<button class="b" id="customerInsights">وفاداری مشتریان</button>'+
      '<button class="b" id="measuredProduct">ثبت عطر گرمی / میلی‌لیتری</button></div></div>');
    ['businessAudit','cashCount','profitByProduct','customerInsights','measuredProduct'].forEach(k=>{
      const el=V.querySelector('#'+k);if(el)el.onclick=()=>G[k]();
    });
  };
  /* Exposed only to local QA; these functions do not transmit customer data. */
  globalThis.HanaBusiness={ledgerHealth,countCash,itemProfit,retentionData,makeMeasuredProduct};
})();