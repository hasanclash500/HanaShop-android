'use strict';
/* A4/A5 premium and formal sales invoices; thermal rendering remains owned by core.
   This module reads stored invoices and shop configuration, never writes financial data. */
(function(){
 const modes=['elegant','formal','classic'],thermal=f=>f==='f58'||f==='f80';
 const sty=()=>HanaInvoiceStudio.config(),mode=v=>modes.includes(v)?v:'elegant';
 const fmt=v=>HanaInvoiceStudio.validFormat(v);
 const escp=s=>esc(String(s??''));
 const money=n=>fa(Math.round(Number(n)||0));
 const seller=cfg=>({name:db.shop.name||'',subtitle:cfg.subtitle||'',phone:cfg.phone||db.shop.phone||'',address:cfg.address||db.shop.addr||''});
 const customer=s=>cust(s.cid)||{};
 const nval=s=>Number.isFinite(Number(s))?Number(s):0;
 const details=s=>db.invoiceDetails?.[s.id]||{};
 const words0=['صفر','یک','دو','سه','چهار','پنج','شش','هفت','هشت','نه','ده','یازده','دوازده','سیزده','چهارده','پانزده','شانزده','هفده','هجده','نوزده'];
 const tens=['','','بیست','سی','چهل','پنجاه','شصت','هفتاد','هشتاد','نود'];
 const hundreds=['','صد','دویست','سیصد','چهارصد','پانصد','ششصد','هفتصد','هشتصد','نهصد'];
 function three(n){const parts=[];const h=Math.floor(n/100),b=n%100;
  if(h)parts.push(hundreds[h]);if(b<20&&b)parts.push(words0[b]);else if(b){parts.push(tens[Math.floor(b/10)]);if(b%10)parts.push(words0[b%10])}return parts.join(' و ');
 }
 function amountWords(value){
  if(!Number.isSafeInteger(Number(value))||Number(value)<0)return'مبلغ نامعتبر';
  let n=Number(value);if(!n)return'صفر تومان';
  const grp=['','هزار','میلیون','میلیارد','هزار میلیارد'];let i=0,a=[];
  while(n&&i<grp.length){const p=n%1000;if(p)a.unshift(three(p)+(grp[i]?' '+grp[i]:''));n=Math.floor(n/1000);i++}
  return (n?'مبلغ بزرگ':'')+(n?' ':'')+a.join(' و ')+' تومان';
 }
 function data(s){
  const c=customer(s),extra=details(s),cfg=sty(),shop=seller(cfg);
  const activeLines=Array.isArray(s.lines)?s.lines.filter(l=>nval(l.n)-nval(l.ret)>0):[];
  const lines=HanaInvoiceStudio.rows(s).map((r,i)=>({
   index:i+1,name:r.name||'کالا/خدمت',qty:nval(r.qty),unit:prod(activeLines[i]?.pid)?.unit||'عدد',
   price:nval(r.price),total:Math.round(nval(r.total)),
   discount:0,tax:null
  }));
  // The POS records invoice-level discount, not per-line tax. Never fabricate tax amounts.
  const tax=Number.isFinite(s.tax)&&s.tax>=0?s.tax:null;
  return{cfg,shop,c,extra,s,lines,tax,discount:Math.round(nval(s.disc)),
   subtotal:Math.round(nval(s.sub)),total:Math.round(nval(s.total)),
   paid:Math.round(nval(s.paid)),remaining:Math.round(nval(s.total)-nval(s.paid))};
 }
 function html(s,selected){
  const v=mode(selected),d=data(s);if(v==='classic')return invHTML(s);
  const {cfg,shop,c,extra,lines,tax}=d,clr= /^#[\da-f]{6}$/i.test(cfg.color)?cfg.color:'#2452ce',isFormal=v==='formal';
  const contact=(label,value)=>'<div><span class="p-inv-muted">'+escp(label)+': </span><b>'+escp(value||'—')+'</b></div>';
  const img=(source,alt,cls)=>HanaInvoiceStudio.safeImg(source)?'<img class="'+cls+'" src="'+source+'" alt="'+alt+'">':'';
  const sellerFields=contact('نام فروشگاه',shop.name)+contact('تلفن',shop.phone)+contact('نشانی',shop.address)+
   contact('شناسه ملی',cfg.sellerNationalId)+contact('کد اقتصادی',cfg.sellerEconomicCode)+contact('شماره ثبت',cfg.sellerRegisterNo)+contact('شناسه مالیاتی',cfg.sellerTaxId);
  const buyerFields=contact('نام',c.name||'عمومی')+contact('تلفن',c.phone)+contact('نشانی',extra.buyerAddress||c.addr)+
   contact('شناسه/کد ملی',extra.buyerNationalId||c.nationalId)+contact('کد اقتصادی',extra.buyerEconomicCode||c.economicCode);
  const headers=isFormal?['ردیف','شرح کالا و خدمات','واحد','تعداد','قیمت واحد','تخفیف','مالیات و عوارض','مبلغ کل']:['ردیف','شرح کالا و خدمات','تعداد','واحد','قیمت واحد','قیمت کل (تومان)'];
  const rows=lines.map(l=>'<tr>'+
   [money(l.index),escp(l.name),...(isFormal?[escp(l.unit),fa(l.qty),money(l.price),'—','—',money(l.total)]:[fa(l.qty),escp(l.unit),money(l.price),money(l.total)])]
   .map((x,i)=>'<td'+(i===1?' class="p-inv-name"':'')+'>'+x+'</td>').join('')+'</tr>').join('');
  const sellerHeader='<div class="p-inv-top">'+
   (img(cfg.logo,'لوگو','p-inv-logo'))+'<div class="p-inv-brand"><div class="p-inv-shop">'+escp(shop.name)+'</div><div class="p-inv-tagline">'+escp(shop.subtitle)+'</div></div>'+
   '<div class="p-inv-meta">'+contact('شماره',s.no?fa(s.no):'قدیمی')+contact('تاریخ',fa(s.date))+'</div></div>';
  const legalWarning=isFormal?'<div class="p-inv-legal">قالب رسمیِ قابل چاپ؛ اعتبار مالیاتی و ثبت در سامانه مؤدیان باید جداگانه بررسی شود. مالیات فقط از داده ثبت‌شده فاکتور نمایش داده می‌شود.</div>':'';
  const notes=cfg.legalNote||db.shop.footer||'';
  return '<article class="hana-premium-invoice '+(isFormal?'p-inv-formal':'p-inv-elegant')+'" dir="rtl" style="--inv-accent:'+clr+'">'+
   '<style>'+
   '.hana-premium-invoice{width:100%;max-width:850px;min-width:315px;margin:auto;padding:24px;background:#fff;color:#202b3d;font:14px/1.75 Tahoma,Arial,sans-serif;box-sizing:border-box;direction:rtl}'+
   '.hana-premium-invoice *{box-sizing:border-box}.hana-premium-invoice .p-inv-basmala{text-align:center;color:#48566f;font-size:12px;margin:0 0 8px}'+
   '.hana-premium-invoice .p-inv-top{display:flex;align-items:center;gap:14px;min-height:105px;padding:15px 20px;border-radius:12px;background:var(--inv-accent);color:#fff}'+
   '.hana-premium-invoice .p-inv-logo{height:65px;width:65px;object-fit:contain;background:#fff;border-radius:8px;padding:3px}'+
   '.hana-premium-invoice .p-inv-brand{flex:1;text-align:center}.hana-premium-invoice .p-inv-shop{font-size:22px;font-weight:800}.hana-premium-invoice .p-inv-tagline{font-size:12px}'+
   '.hana-premium-invoice .p-inv-meta{min-width:120px;max-width:155px;font-size:11px}.hana-premium-invoice .p-inv-muted{opacity:.72;font-weight:normal}'+
   '.hana-premium-invoice .p-inv-heading{text-align:center;font-size:19px;font-weight:800;color:var(--inv-accent);padding:16px 0 9px;border-bottom:2px solid var(--inv-accent);margin-bottom:12px}'+
   '.hana-premium-invoice .p-inv-box{border:1px solid #d5dbe6;border-radius:9px;padding:10px 14px;margin:9px 0;background:#fff;min-width:0;overflow-wrap:anywhere}'+
   '.hana-premium-invoice .p-inv-panels{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0}.hana-premium-invoice .p-inv-panels .p-inv-box{margin:0;padding:0;overflow:hidden}'+
   '.hana-premium-invoice .p-inv-panel-title{background:#edf2ff;color:var(--inv-accent);padding:7px 10px;font-weight:700}'+
   '.hana-premium-invoice .p-inv-panel-body{padding:10px 12px;font-size:11px;line-height:1.9}'+
   '.hana-premium-invoice table{width:100%;border-collapse:collapse;table-layout:fixed;margin-top:12px;font-size:12px}'+
   '.hana-premium-invoice th,.hana-premium-invoice td{border:1px solid #d8dce6;padding:8px 4px;text-align:center;overflow-wrap:anywhere}'+
   '.hana-premium-invoice th{background:var(--inv-accent);color:#fff;font-weight:700}.hana-premium-invoice td.p-inv-name{text-align:right}'+
   '.hana-premium-invoice tbody tr:nth-child(even){background:#f7f8fc}.hana-premium-invoice .p-inv-totals{margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px}'+
   '.hana-premium-invoice .p-inv-totals .p-inv-box{margin:0}.hana-premium-invoice .p-inv-money{width:100%;border-collapse:collapse;margin:0}'+
   '.hana-premium-invoice .p-inv-money td{padding:5px 7px;border:0;border-bottom:1px solid #e1e5ec;text-align:right}'+
   '.hana-premium-invoice .p-inv-highlight{background:#eaf0ff;color:var(--inv-accent);font-weight:800}'+
   '.hana-premium-invoice .p-inv-payment{background:#eef2fb;margin-top:12px}.hana-premium-invoice .p-inv-signs{display:flex;gap:24px;margin-top:45px;padding-top:14px}'+
   '.hana-premium-invoice .p-inv-sign{flex:1;text-align:center;border-top:1px solid #cfd5e1;min-height:110px;font-size:12px}'+
   '.hana-premium-invoice .p-inv-sign img{max-width:112px;max-height:79px;object-fit:contain;margin:6px auto;display:block}'+
   '.hana-premium-invoice .p-inv-footer{border-top:1px solid #e0e4eb;margin-top:20px;padding-top:9px;font-size:11px;color:#58657a;text-align:center;overflow-wrap:anywhere}'+
   '.hana-premium-invoice .p-inv-legal{font-size:10px;color:#68738b;margin:14px 0 0}'+
   '.hana-premium-invoice.p-inv-formal .p-inv-top{background:#fff;color:#263954;border-radius:0;border-bottom:3px solid var(--inv-accent);padding:10px}'+
   '.hana-premium-invoice.p-inv-formal .p-inv-shop{color:var(--inv-accent)}'+
   '.hana-premium-invoice.p-inv-formal .p-inv-heading{background:#eaf0ff;padding:9px;border:1px solid #d0dafa;border-radius:8px}'+
   '.hana-premium-invoice.p-inv-formal th{background:#e8efff;color:#243a69}'+
   '.hana-premium-invoice.p-inv-formal .p-inv-panel-title{background:#dfe8ff}'+
   '@media print{body{background:#fff!important}.hana-premium-invoice{padding:8mm!important;max-width:none!important}.hana-premium-invoice tr{break-inside:avoid}.hana-premium-invoice .p-inv-box{break-inside:avoid}.hana-premium-invoice .p-inv-signs{break-inside:avoid}}'+
   '</style>'+
   (cfg.showBasmalah?'<div class="p-inv-basmala">باسمه تعالی</div>':'')+
   sellerHeader+'<div class="p-inv-heading">'+(isFormal?'فاکتور رسمی فروش':escp(cfg.title||'فاکتور فروش'))+'</div>'+
   (isFormal?'<div class="p-inv-panels"><section class="p-inv-box"><div class="p-inv-panel-title">مشخصات فروشنده</div><div class="p-inv-panel-body">'+sellerFields+'</div></section>'+
      '<section class="p-inv-box"><div class="p-inv-panel-title">مشخصات خریدار</div><div class="p-inv-panel-body">'+buyerFields+'</div></section></div>':
      '<div class="p-inv-box">'+contact('خریدار',c.name||'عمومی')+(c.phone?' | '+contact('شماره تماس',c.phone):'')+'</div>')+
   '<table><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table>'+
   '<div class="p-inv-totals"><div class="p-inv-box"><strong>مبلغ قابل پرداخت به حروف</strong><div>'+escp(amountWords(d.total))+'</div></div>'+
   '<div class="p-inv-box"><table class="p-inv-money"><tr><td>جمع کل</td><td>'+money(d.subtotal)+'</td></tr>'+
   '<tr><td>تخفیف</td><td>'+money(d.discount)+'</td></tr>'+
   (isFormal?'<tr><td>مالیات و عوارض ثبت‌شده</td><td>'+(tax===null?'ثبت نشده':money(tax))+'</td></tr>':'')+
   '<tr class="p-inv-highlight"><td>قابل پرداخت</td><td>'+money(d.total)+' تومان</td></tr>'+
   '<tr><td>پرداخت‌شده</td><td>'+money(d.paid)+'</td></tr><tr><td>مانده</td><td>'+money(d.remaining)+'</td></tr></table></div></div>'+
   (cfg.bankInfo?'<div class="p-inv-box p-inv-payment"><strong>اطلاعات پرداخت: </strong>'+escp(cfg.bankInfo)+'</div>':'')+
   '<div class="p-inv-signs"><div class="p-inv-sign">مهر و امضای فروشنده'+
    (cfg.showStamp?img(cfg.stamp,'مهر','p-inv-stamp'):'')+(cfg.showSignature?img(cfg.signature,'امضا','p-inv-signature'):'')+
    '</div><div class="p-inv-sign">امضای خریدار</div></div>'+
   '<div class="p-inv-footer">'+escp(notes)+
   '<div>نشانی: '+escp(shop.address||'—')+' | تلفن: '+escp(shop.phone||'—')+'</div></div>'+legalWarning+
   '</article>';
 }
 function drawBox(ctx,x,y,w,h,fill,stroke){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.strokeRect(x+.3,y+.3,w-.6,h-.6)}}
 function drawText(ctx,txt,x,y,align='right',size=13,color='#263044',bold=false,maxWidth){
  ctx.textAlign=align;ctx.direction='rtl';ctx.fillStyle=color;ctx.font=(bold?'bold ':'')+size+'px Tahoma, sans-serif';
  ctx.fillText(String(txt??''),x,y,maxWidth);
 }
 function wrap(ctx,text,maxWidth,maxLines=3){
  ctx.font='12px Tahoma';const chars=String(text??'').split(' '),out=[];let line='';
  for(const w of chars){const t=line?line+' '+w:w;
   if(line&&ctx.measureText(t).width>maxWidth){out.push(line);line=w}else line=t}
  if(line)out.push(line);return out.slice(0,maxLines);
 }
 function loadImg(src){const d=HanaInvoiceStudio.safeImg(src);if(!d)return Promise.resolve(null);
  return new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=d});
 }
 async function canvas(s,format,selected){
  const v=mode(selected),f=fmt(format);if(thermal(f)||v==='classic')return invCanvas(s,f);
  const d=data(s),c=d.cfg,col=c.color||'#2452ce',formal=v==='formal',W=f==='a5'?559:794,margin=f==='a5'?20:32,
   rw=W-margin*2,tableTop=formal?302:248,rowH=38,headerH=37,
   minH=f==='a5'?794:1123,needed=tableTop+headerH+d.lines.length*rowH+360,H=Math.max(minH,needed);
  const cv=document.createElement('canvas');cv.width=W*2;cv.height=H*2;
  const x=cv.getContext('2d');x.scale(2,2);drawBox(x,0,0,W,H,'#fff');
  const muted='#64718a',border='#d8ddeb';
  if(c.showBasmalah)drawText(x,'باسمه تعالی',W/2,23,'center',11,muted);
  const top=c.showBasmalah?34:14,headH=102;
  if(formal){drawBox(x,margin,top,rw,headH,'#fff');drawBox(x,margin,top+headH-3,rw,3,col)}
  else drawBox(x,margin,top,rw,headH,col);
  const tc=formal?col:'#fff';
  drawText(x,d.shop.name,W/2,top+37,'center',22,tc,true,rw*.55);
  drawText(x,d.shop.subtitle,W/2,top+59,'center',12,formal?'#45516c':'#e7efff',false,rw*.55);
  drawText(x,'شماره: '+(s.no?fa(s.no):'قدیمی'),margin+9,top+34,'left',12,formal?'#24354f':'#fff');
  drawText(x,'تاریخ: '+fa(s.date),margin+9,top+56,'left',12,formal?'#24354f':'#fff');
  const logo=await loadImg(c.logo);
  if(logo){const width=64,height=68;drawBox(x,W-margin-width-8,top+11,width,height,'#fff');x.drawImage(logo,W-margin-width-5,top+13,width-6,height-4)}
  drawText(x,formal?'فاکتور رسمی فروش':(c.title||'فاکتور فروش'),W/2,top+headH+33,'center',19,col,true);
  if(formal){
   const by=top+headH+52,half=(rw-10)/2,pw=half;
   drawBox(x,margin,by,pw,114,'#fff',border);drawBox(x,margin+pw+10,by,pw,114,'#fff',border);
   drawBox(x,margin,by,pw,24,'#e9efff');drawBox(x,margin+pw+10,by,pw,24,'#e9efff');
   drawText(x,'مشخصات خریدار',margin+pw-9,by+17,'right',12,col,true);
   drawText(x,'مشخصات فروشنده',W-margin-9,by+17,'right',12,col,true);
   const buyer=['نام: '+(d.c.name||'عمومی'),'تلفن: '+(d.c.phone||'—'),'نشانی: '+(d.extra.buyerAddress||d.c.addr||'—'),
    'شناسه/کد ملی: '+(d.extra.buyerNationalId||d.c.nationalId||'—'),'کد اقتصادی: '+(d.extra.buyerEconomicCode||d.c.economicCode||'—')];
   const shop=['نام: '+d.shop.name,'تلفن: '+(d.shop.phone||'—'),'شناسه ملی: '+(c.sellerNationalId||'—'),
    'کد اقتصادی: '+(c.sellerEconomicCode||'—'),'ثبت/مالیاتی: '+(c.sellerRegisterNo||'—')+' / '+(c.sellerTaxId||'—')];
   buyer.forEach((t,i)=>drawText(x,t,margin+pw-9,by+39+i*14,'right',9,muted,false,pw-16));
   shop.forEach((t,i)=>drawText(x,t,W-margin-9,by+39+i*14,'right',9,muted,false,pw-16));
  }else{
   const by=top+headH+53;drawBox(x,margin,by,rw,44,'#f7f9ff',border);
   drawText(x,'خریدار: '+(d.c.name||'عمومی')+'     '+(d.c.phone||''),W-margin-12,by+27,'right',12,'#273751',false,rw-24);
  }
  const ty=tableTop,cols=formal?[
   ['ردیف',.06],['شرح کالا و خدمات',.32],['واحد',.09],['تعداد',.08],['قیمت واحد',.14],['تخفیف',.09],['مالیات',.09],['مبلغ کل',.13]
  ]:[
   ['ردیف',.08],['شرح کالا و خدمات',.35],['تعداد',.11],['واحد',.11],['قیمت واحد',.17],['مبلغ کل',.18]
  ];
  const headerBG=formal?'#e8efff':col,headFG=formal?'#253858':'#fff';
  let xx=W-margin;
  cols.forEach(([name,p])=>{const cw=rw*p;drawBox(x,xx-cw,ty,cw,headerH,headerBG,border);
    drawText(x,name,xx-cw/2,ty+23,'center',formal?10:11,headFG,true,cw-6);xx-=cw});
  d.lines.forEach((l,i)=>{
   const y=ty+headerH+i*rowH,vals=formal?[money(l.index),l.name,l.unit,fa(l.qty),money(l.price),'—','—',money(l.total)]:
      [money(l.index),l.name,fa(l.qty),l.unit,money(l.price),money(l.total)];
   let cur=W-margin;
   cols.forEach(([name,p],j)=>{const cw=rw*p;drawBox(x,cur-cw,y,cw,rowH,i%2?'#f7f9fd':'#fff',border);
    if(j===1){const lines=wrap(x,vals[j],cw-10,2);lines.forEach((ln,k)=>drawText(x,ln,cur-5,y+15+k*15,'right',11,'#263248',false,cw-10))}
    else drawText(x,vals[j],cur-cw/2,y+24,'center',10,'#273751',false,cw-5);cur-=cw;
   });
  });
  const below=ty+headerH+d.lines.length*rowH+15;
  const half=(rw-12)/2;
  drawBox(x,margin,below,half,151,'#f8faff',border);
  drawBox(x,margin+half+12,below,half,151,'#fff',border);
  const totals=[['جمع کل',money(d.subtotal)],['تخفیف',money(d.discount)]];
  if(formal)totals.push(['مالیات ثبت‌شده',d.tax===null?'ثبت نشده':money(d.tax)]);
  totals.push(['قابل پرداخت',money(d.total)+' تومان'],['پرداخت‌شده',money(d.paid)],['مانده',money(d.remaining)]);
  totals.forEach((t,i)=>{
   const ty_=below+20+i*(formal?23:23);
   if(t[0]==='قابل پرداخت')drawBox(x,margin+half+12,ty_-16,half,21,'#eaf0ff');
   drawText(x,t[0],W-margin-10,ty_,'right',11,t[0]==='قابل پرداخت'?col:'#3a485d',t[0]==='قابل پرداخت');
   drawText(x,t[1],margin+half+22,ty_,'left',11,t[0]==='قابل پرداخت'?col:'#3a485d',t[0]==='قابل پرداخت');
  });
  drawText(x,'مبلغ به حروف',margin+half-10,below+29,'right',13,col,true);
  const wordLines=wrap(x,amountWords(d.total),half-20,4);wordLines.forEach((w,i)=>drawText(x,w,margin+half-10,below+53+i*21,'right',11,'#323b50',false,half-18));
  const payY=below+164;if(c.bankInfo){drawBox(x,margin,payY,rw,47,'#eef2ff',border);
   drawText(x,'اطلاعات پرداخت: '+c.bankInfo,W-margin-12,payY+28,'right',12,col,false,rw-24)}
  const footY=Math.max(payY+(c.bankInfo?69:30),H-160);
  drawBox(x,margin,footY,rw/2-10,1,border);drawBox(x,margin+rw/2+10,footY,rw/2-10,1,border);
  drawText(x,'امضای خریدار',margin+rw*.23,footY+18,'center',11,muted);
  drawText(x,'مهر و امضای فروشنده',margin+rw*.76,footY+18,'center',11,muted);
  const stamp=c.showStamp?await loadImg(c.stamp):null,sign=c.showSignature?await loadImg(c.signature):null;
  if(stamp)x.drawImage(stamp,margin+rw*.6,footY+24,Math.min(92,rw*.17),68);
  if(sign)x.drawImage(sign,margin+rw*.77,footY+24,Math.min(92,rw*.17),68);
  const baseY=Math.min(H-28,footY+110);
  drawBox(x,margin,baseY-11,rw,1,border);
  drawText(x,'نشانی: '+(d.shop.address||'—'),W-margin-2,baseY+10,'right',10,muted,false,rw-10);
  drawText(x,'تلفن: '+(d.shop.phone||'—'),W-margin-2,baseY+26,'right',10,muted,false,rw-10);
  return cv;
 }
 function asBlob(cv,type,quality){return new Promise((resolve,reject)=>cv.toBlob(b=>b?resolve(b):reject(new Error('ایجاد تصویر ناموفق بود')),type,quality))}
 async function pdf(s,format,selected){
  const f=fmt(format),v=mode(selected);if(thermal(f)||v==='classic')return invPdf(s,f);
  const cv=await canvas(s,f,v),raw=atob(cv.toDataURL('image/jpeg',.93).split(',')[1]),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
  return new Blob([pdfFromJpeg(bytes,cv.width,cv.height,f)],{type:'application/pdf'});
 }
 async function picture(s,format,selected,type='image/png'){const f=fmt(format),v=mode(selected),cv=await canvas(s,f,v);
  return asBlob(cv,type,type==='image/jpeg'?.91:undefined)}
 function settingsPreview(){G.invoiceSettings()}
 const previousShow=showInv;
 showInv=function(id){
  previousShow(id);const s=db.sales.find(x=>x.id===id);if(!s)return;
  const pick=$('#fm'),area=$('#ip'),dlg=$('#dlg'),current=sty();
  const label=document.createElement('div');
  label.className='card';label.innerHTML='<label>طراحی فاکتور A4 / A5</label>'+
   '<select id="hanaTemplate"><option value="elegant">فاکتور فروش شکیل</option><option value="formal">فاکتور رسمی</option><option value="classic">طرح ساده قدیمی</option></select>'+
   '<div class="k">قالب‌های حرارتی ۵۸ و ۸۰ میلی‌متری بدون تغییر هستند. فاکتور رسمی، به‌تنهایی سند مورد تأیید سازمان مالیاتی نیست.</div>'+
   '<button class="b s" id="hanaLegalDetails">اطلاعات حقوقی خریدار در این فاکتور</button>';
  area.insertAdjacentElement('beforebegin',label);
  const sel=label.querySelector('#hanaTemplate');sel.value=mode(current.template);
  const typ=()=>mode(sel.value),paper=()=>fmt(pick.value),isReceipt=()=>thermal(paper());
  function refresh(){
   db.pfmt=paper();area.innerHTML=isReceipt()?invHTML(s):html(s,typ());
   area.style.cssText='max-height:65vh;overflow:auto;background:#f0f3f8;border-radius:8px;padding:4px;';
   const disabled=isReceipt();sel.disabled=disabled;
  }
  sel.onchange=refresh;pick.onchange=refresh;refresh();
  const run=async task=>{try{await task()}catch(e){const er=$('#ifsExportError');if(er)er.textContent='خروجی تولید نشد: '+e.message}};
  $('#bp').onclick=()=>{db.pfmt=paper();printHTML(isReceipt()?invHTML(s):html(s,typ()),paper())};
  $('#bd').onclick=()=>run(async()=>{db.pfmt=paper();await dlf('invoice-'+(s.no||'old')+'.pdf',await pdf(s,paper(),typ()),'application/pdf');toast('PDF ذخیره شد')});
  $('#bs').onclick=()=>run(async()=>shareFile(await pdf(s,paper(),typ()),'invoice-'+(s.no||'old')+'.pdf',invText(s)));
  $('#bi').onclick=()=>run(async()=>shareFile(await picture(s,paper(),typ()),'invoice-'+(s.no||'old')+'.png',invText(s)));
  const jpeg=$('#ifsJpeg');if(jpeg)jpeg.onclick=()=>run(async()=>{await dlf('invoice-'+(s.no||'old')+'.jpg',await picture(s,paper(),typ(),'image/jpeg'),'image/jpeg');toast('JPEG ذخیره شد')});
  const h=$('#ifsHtml');if(h)h.onclick=()=>run(async()=>{
   const body=isReceipt()?invHTML(s):html(s,typ());const page='<!DOCTYPE html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>فاکتور</title>'+body+'</html>';
   await dlf('invoice-'+(s.no||'old')+'.html',page,'text/html;charset=utf-8');toast('HTML ذخیره شد')
  });
  label.querySelector('#hanaLegalDetails').onclick=()=>{
   const x=details(s),c=customer(s);
   const escaped=v=>escp(v||'');
   modal('<h3>اطلاعات حقوقی خریدار</h3><div class="k">این موارد فقط برای چاپ این فاکتور هستند و سند مالی را تغییر نمی‌دهند.</div>'+
    '<label>نشانی خریدار</label><textarea id="invBuyerAddress" rows="2">'+escaped(x.buyerAddress||c.addr)+'</textarea>'+
    '<label>شناسه ملی / کد ملی خریدار</label><input id="invBuyerNational" value="'+escaped(x.buyerNationalId||c.nationalId)+'">'+
    '<label>کد اقتصادی خریدار</label><input id="invBuyerEconomic" value="'+escaped(x.buyerEconomicCode||c.economicCode)+'">'+
    '<div class="err" id="invBuyerError"></div><button class="b" id="invBuyerSave">ذخیره اطلاعات فاکتور</button><button class="b s" id="invBuyerCancel">انصراف</button>');
   $('#invBuyerCancel').onclick=()=>showInv(id);
   $('#invBuyerSave').onclick=async()=>{
    const add={buyerAddress:$('#invBuyerAddress').value.trim().slice(0,350),
     buyerNationalId:$('#invBuyerNational').value.trim().slice(0,50),
     buyerEconomicCode:$('#invBuyerEconomic').value.trim().slice(0,50)};
    if(await tx(()=>{db.invoiceDetails=db.invoiceDetails||{};db.invoiceDetails[s.id]=add}))showInv(id);
   };
  };
 };
 globalThis.HanaInvoicePremium={html,canvas,pdf,picture,data,amountWords,mode,thermal};
})();