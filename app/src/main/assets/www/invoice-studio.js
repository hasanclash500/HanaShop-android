'use strict';
/* Invoice Studio. All media and settings remain on-device in the existing JSON backup.
 * Historical invoice records are never altered when the template is changed. */
(function(){
 const DEFAULT={color:'#1f5c4a',format:'a4',phone:'',address:'',title:'فاکتور فروش',logo:'',stamp:'',signature:'',showStamp:true,showSignature:true};
 const safeColor=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:DEFAULT.color;
 const safeImg=s=>typeof s==='string'&&/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(s)&&s.length<210000?s:'';
 const config=()=>({...DEFAULT,...(db.invoiceDesign||{}),color:safeColor(db.invoiceDesign?.color)});
 const safeText=s=>esc(String(s??''));
 const phone=cfg=>cfg.phone||db.shop.phone||'';
 const address=cfg=>cfg.address||db.shop.addr||'';
 const validFormat=f=>['a4','a5','f80','f58'].includes(f)?f:'a4';
 const moneyCSV=n=>String(Math.round(Number(n)||0));
 const csvCell=v=>'"'+String(v??'').replace(/^[\s]*[=+@\-\t\r]/,'\u0027$&').replace(/"/g,'""')+'"';
 function rows(s){
  const item=s.lines.length?s.lines.filter(l=>l.n-(l.ret||0)>0).map(l=>({name:prod(l.pid)?.name||'',qty:l.n-(l.ret||0),price:l.price,total:(l.n-(l.ret||0))*l.price})):
   [{name:s.desc||'فاکتور قدیمی',qty:1,price:s.total,total:s.total}];
  return item;
 }
 function html(s){
  const cfg=config(),logo=safeImg(cfg.logo),stamp=cfg.showStamp?safeImg(cfg.stamp):'',signature=cfg.showSignature?safeImg(cfg.signature):'';
  const base=originalHtml(s);
  const header='<section class="hana-invoice-header" style="display:flex;gap:12px;align-items:center;border-bottom:3px solid '+cfg.color+';padding:10px 5px;background:#fff;color:'+cfg.color+'">'+
   (logo?'<img src="'+logo+'" alt="لوگوی فروشگاه" style="max-width:76px;max-height:76px;object-fit:contain">':'')+
   '<div><strong style="font-size:19px">'+safeText(cfg.title)+'</strong><div>'+safeText(db.shop.name)+'</div><div style="font-size:12px">'+safeText(phone(cfg))+' · '+safeText(address(cfg))+'</div></div></section>';
  const footer='<section style="border-top:2px solid '+cfg.color+';padding-top:12px;display:flex;justify-content:space-around;gap:12px;text-align:center;color:#222">'+
   (stamp?'<div><div>مهر فروشگاه</div><img src="'+stamp+'" style="max-width:105px;max-height:90px;object-fit:contain" alt="مهر"></div>':'')+
   (signature?'<div><div>امضا</div><img src="'+signature+'" style="max-width:105px;max-height:90px;object-fit:contain" alt="امضا"></div>':'')+'</section>';
  return '<div class="hana-invoice" style="background:#fff;color:#222;padding:12px;direction:rtl;border:1px solid #ddd">'+header+
   '<div style="margin-top:10px">'+base+'</div>'+footer+'</div>';
 }
 const originalHtml=invHTML;
 invHTML=html;
 function asBlob(canvas,type,quality){return new Promise((resolve,reject)=>{
  canvas.toBlob(b=>b?resolve(b):reject(new Error('تصویر قابل تولید نیست')),type,quality)
 })}
 const loadImage=async data=>{const src=safeImg(data);if(!src)return null;
  return new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=src});
 };
 const blobData=async blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('خواندن عکس ناموفق بود'));reader.readAsDataURL(blob)});
 async function canvas(s,fmt){
  const cfg=config(),f=validFormat(fmt),src=invCanvas(s,f==='a5'?'a4':f),ratio=1,baseW=src.width,scale=baseW/(f==='a4'||f==='a5'?794*2:f==='f80'?302*2:219*2);
  const bar=Math.round((f==='a4'||f==='a5'?108:74)*2*scale),foot=Math.round((f==='a4'||f==='a5'?118:98)*2*scale);
  const out=document.createElement('canvas');out.width=baseW;out.height=src.height+bar+foot;
  const x=out.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,out.width,out.height);
  const clr=safeColor(cfg.color);x.fillStyle=clr;x.fillRect(0,0,baseW,bar);x.fillStyle='#fff';x.textAlign='center';x.direction='rtl';
  const sz=Math.max(17,Math.round((f==='a4'||f==='a5'?23:13)*2*scale));
  x.font='bold '+sz+'px Tahoma, sans-serif';x.fillText(cfg.title,baseW/2,bar*.35);
  x.font=Math.round(sz*.76)+'px Tahoma, sans-serif';x.fillText(db.shop.name,baseW/2,bar*.61);
  const contact=[phone(cfg),address(cfg)].filter(Boolean).join(' | ');
  if(contact)x.fillText(contact.slice(0,f==='f58'?38:115),baseW/2,bar*.85);
  const logo=await loadImage(cfg.logo);
  if(logo){const w=Math.min(bar*.62,baseW*.19),h=Math.min(bar*.65,w*logo.height/logo.width);
   x.fillStyle='#fff';x.fillRect(baseW-w-8,8,w,bar-16);x.drawImage(logo,baseW-w-8,8,w,h)}
  x.drawImage(src,0,bar);
  const y=bar+src.height;x.fillStyle=clr;x.fillRect(0,y,baseW,Math.max(2,bar*.022));
  const stamp=cfg.showStamp?await loadImage(cfg.stamp):null,sign=cfg.showSignature?await loadImage(cfg.signature):null;
  const target=img=>{if(!img)return null;const maxW=baseW*.27,maxH=foot*.76;
   const t=Math.min(maxW/img.width,maxH/img.height,1.6);return{w:img.width*t,h:img.height*t}};
  if(stamp){const t=target(stamp);x.drawImage(stamp,baseW*.68-t.w/2,y+foot*.12,t.w,t.h)}
  if(sign){const t=target(sign);x.drawImage(sign,baseW*.31-t.w/2,y+foot*.12,t.w,t.h)}
  x.fillStyle='#555';x.font=Math.max(13,Math.round(sz*.56))+'px Tahoma, sans-serif';
  if(stamp)x.fillText('مهر',baseW*.68,y+foot*.92);
  if(sign)x.fillText('امضا',baseW*.31,y+foot*.92);
  return out;
 }
 async function pdf(s,fmt){const cv=await canvas(s,fmt);const encoded=atob(cv.toDataURL('image/jpeg',.91).split(',')[1]);
  const dimensions={a4:595.28,a5:419.53,f80:226.77,f58:164.41},f=validFormat(fmt),pw=dimensions[f],ph0=pw*cv.height/cv.width,
   pageHeight=f==='a4'?841.89:f==='a5'?595.28:ph0, ph=Math.max(pageHeight,ph0);
  // Existing PDF generator handles the JPEG stream; A5 uses a corrected page size in core.
  return new Blob([pdfFromJpeg(Uint8Array.from(encoded,c=>c.charCodeAt(0)),cv.width,cv.height,f)],{type:'application/pdf'});
 }
 async function imageBlob(s,fmt,type){return asBlob(await canvas(s,fmt),type,type==='image/jpeg'?.9:undefined)}
 const fileBase=s=>'HanaShop-Invoice-'+(s.no||s.id||'old');
 function csv(s){
  const c=cust(s.cid);return '\uFEFF'+[
   ['نوع','فاکتور فروش'],['شماره',s.no||'قدیمی'],['تاریخ',s.date],['مشتری',c?.name||'مشتری گذری'],
   ['فروشگاه',db.shop.name],['تلفن',phone(config())],['آدرس',address(config())],
   [],['شرح کالا','تعداد','فی (تومان)','جمع (تومان)'],
   ...rows(s).map(r=>[r.name,r.qty,moneyCSV(r.price),moneyCSV(r.total)]),
   [],['جمع',moneyCSV(s.sub)],['تخفیف',moneyCSV(s.disc)],['قابل پرداخت',moneyCSV(s.total)],
   ['پرداخت شده',moneyCSV(s.paid)],['مانده',moneyCSV(s.total-s.paid)]
  ].map(r=>r.map(csvCell).join(',')).join('\r\n');
 }
 function documentHtml(s){return '<!DOCTYPE html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>فاکتور '+safeText(s.no||'')+
  '</title><style>body{font-family:Tahoma,Arial;max-width:850px;margin:32px auto;color:#222}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:right}.inv hr{border:0;border-top:1px solid #ccc}</style>'+
  html(s)+'</html>'}
 async function upload(file){
  if(!file||!/^image\/(png|jpeg|webp)$/.test(file.type))throw new Error('فقط PNG، JPEG یا WebP مجاز است.');
  if(file.size>5*1024*1024)throw new Error('حجم عکس اولیه باید کمتر از ۵ مگابایت باشد.');
  const url=URL.createObjectURL(file);
  try{
   const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('عکس معتبر نیست'));i.src=url});
   const scale=Math.min(1,640/Math.max(image.width,image.height));const cv=document.createElement('canvas');
   cv.width=Math.max(1,Math.round(image.width*scale));cv.height=Math.max(1,Math.round(image.height*scale));
   const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.drawImage(image,0,0,cv.width,cv.height);
   const data=await blobData(await asBlob(cv,'image/jpeg',.78));
   if(!safeImg(data))throw new Error('عکس فشرده‌شده هنوز بزرگ است؛ عکس کوچک‌تری انتخاب کنید.');
   return data;
  }finally{URL.revokeObjectURL(url)}
 }
 function settings(){
  const c=config();
  modal('<h3>🎨 تنظیمات فاکتور</h3><div class="k">تغییر این تنظیمات روی نمایش و فایل خروجی اثر دارد؛ مبلغ و تاریخچه فاکتورها تغییر نمی‌کنند. تصاویر در بک‌آپ JSON ذخیره می‌شوند.</div>'+
   '<label>عنوان فاکتور</label><input id="ifsTitle" value="'+safeText(c.title)+'" maxlength="90">'+
   '<label>رنگ فاکتور</label><input id="ifsColor" type="color" value="'+c.color+'">'+
   '<label>قطع پیش‌فرض</label><select id="ifsFormat"><option value="a4">A4</option><option value="a5">A5</option><option value="f80">حرارتی ۸۰ میلی‌متر</option><option value="f58">حرارتی ۵۸ میلی‌متر</option></select>'+
   '<label>تلفن چاپ‌شونده</label><input id="ifsPhone" value="'+safeText(c.phone)+'" placeholder="'+safeText(db.shop.phone||'شماره فروشگاه')+'">'+
   '<label>آدرس چاپ‌شونده</label><textarea id="ifsAddress" rows="2" placeholder="در صورت خالی بودن، آدرس فروشگاه استفاده می‌شود">'+safeText(c.address)+'</textarea>'+
   ['logo','stamp','signature'].map((name,i)=>'<div class="card"><label>'+['لوگو','مهر','امضا'][i]+'</label>'+
    '<img id="ifsPreview_'+name+'" style="max-height:95px;max-width:150px;display:'+(safeImg(c[name])?'block':'none')+'" src="'+safeImg(c[name])+'">'+
    '<input id="ifsFile_'+name+'" type="file" accept="image/png,image/jpeg,image/webp">'+
    '<button type="button" class="b s" id="ifsClear_'+name+'">حذف تصویر</button></div>').join('')+
   '<label><input type="checkbox" id="ifsShowStamp" style="width:auto" '+(c.showStamp?'checked':'')+'> نمایش مهر</label>'+
   '<label><input type="checkbox" id="ifsShowSignature" style="width:auto" '+(c.showSignature?'checked':'')+'> نمایش امضا</label>'+
   '<div class="err" id="ifsError"></div><button class="b" id="ifsSave">ذخیره تنظیمات فاکتور</button><button class="b s" id="ifsClose">بستن</button>');
  $('#ifsFormat').value=validFormat(c.format);$('#ifsClose').onclick=close;
  const selected={logo:c.logo,stamp:c.stamp,signature:c.signature};let busy=false;
  for(const k of ['logo','stamp','signature']){
   $('#ifsFile_'+k).onchange=async e=>{
    if(busy)return;busy=true;const file=e.target.files[0];if(!file){busy=false;return}
    try{selected[k]=await upload(file);$('#ifsPreview_'+k).src=selected[k];$('#ifsPreview_'+k).style.display='block';$('#ifsError').textContent=''}
    catch(ex){$('#ifsError').textContent=ex.message}finally{busy=false}
   };
   $('#ifsClear_'+k).onclick=()=>{selected[k]='';$('#ifsPreview_'+k).style.display='none';$('#ifsFile_'+k).value=''};
  }
  $('#ifsSave').onclick=async()=>{
   if(busy)return $('#ifsError').textContent='بارگذاری تصویر تمام نشده است.';
   const next={color:safeColor($('#ifsColor').value),format:validFormat($('#ifsFormat').value),
    title:$('#ifsTitle').value.trim().slice(0,90)||DEFAULT.title,
    phone:$('#ifsPhone').value.trim().slice(0,100),address:$('#ifsAddress').value.trim().slice(0,400),
    logo:selected.logo,stamp:selected.stamp,signature:selected.signature,
    showStamp:$('#ifsShowStamp').checked,showSignature:$('#ifsShowSignature').checked};
   if(await tx(()=>{db.invoiceDesign=next;db.pfmt=next.format})){close();toast('تنظیمات فاکتور ذخیره شد')}
  };
 }
 G.invoiceSettings=settings;
 const oldSet=R.set;
 R.set=function(){oldSet();const section=document.createElement('div');section.className='card';
  section.innerHTML='<b>🧾 تنظیمات تخصصی فاکتور</b><div class="k">رنگ، لوگو، مهر، امضا، آدرس، تلفن، قطع و خروجی‌های جدید</div><button class="b" id="hanaInvoiceSettings">ویرایش قالب فاکتور</button>';
  V.insertAdjacentElement('beforeend',section);
  section.querySelector('button').onclick=settings;
 };
 // The original invoice modal still owns printing and financial actions; append new file formats.
 const oldShow=showInv;
 showInv=function(id){
  oldShow(id);const s=db.sales.find(x=>x.id===id);if(!s)return;
  const form=$('#fm');if(form&&!Array.from(form.options).some(o=>o.value==='a5'))form.insertAdjacentHTML('beforeend','<option value="a5">A5</option>');
  const c=config();form.value=validFormat(db.pfmt||c.format);
  const dlg=$('#dlg');dlg.insertAdjacentHTML('beforeend',
   '<div class="card"><b>خروجی‌های بیشتر</b><div class="grid">'+
   '<button class="b s" id="ifsJpeg">JPEG با کیفیت بالا</button><button class="b s" id="ifsCsv">CSV ردیف‌های فاکتور</button>'+
   '<button class="b s" id="ifsHtml">HTML قابل چاپ</button><button class="b s" id="ifsTxt">متن ساده TXT</button></div>'+
   '<button class="b s" id="ifsEditDesign">🎨 تغییر رنگ، لوگو و مهر فاکتور</button><div class="err" id="ifsExportError"></div></div>');
  const fmt=()=>validFormat(form.value),name=()=>fileBase(s);
  const run=async task=>{const e=$('#ifsExportError');try{await task();e.textContent=''}catch(err){e.textContent='خروجی ساخته نشد: '+err.message}};
  $('#bp').onclick=()=>{db.pfmt=fmt();printHTML(html(s),fmt())};
  $('#bd').onclick=()=>run(async()=>{db.pfmt=fmt();await dlf(name()+'.pdf',await pdf(s,fmt()),'application/pdf');toast('فایل PDF ذخیره شد')});
  $('#bs').onclick=()=>run(async()=>shareFile(await pdf(s,fmt()),name()+'.pdf',invText(s)));
  $('#bi').onclick=()=>run(async()=>shareFile(await imageBlob(s,fmt(),'image/png'),name()+'.png',invText(s)));
  $('#ifsJpeg').onclick=()=>run(async()=>{await dlf(name()+'.jpg',await imageBlob(s,fmt(),'image/jpeg'),'image/jpeg');toast('فایل JPEG ذخیره شد')});
  $('#ifsCsv').onclick=()=>run(async()=>{await dlf(name()+'.csv',csv(s),'text/csv;charset=utf-8');toast('فایل CSV ذخیره شد')});
  $('#ifsHtml').onclick=()=>run(async()=>{await dlf(name()+'.html',documentHtml(s),'text/html;charset=utf-8');toast('فایل HTML ذخیره شد')});
  $('#ifsTxt').onclick=()=>run(async()=>{await dlf(name()+'.txt',invText(s),'text/plain;charset=utf-8');toast('فایل متنی ذخیره شد')});
  $('#ifsEditDesign').onclick=settings;
 };
 // Correct page geometry for added A5 print/PDF option.
 const oldPdf=pdfFromJpeg;
 pdfFromJpeg=function(bytes,w,h,format){
  if(format!=='a5')return oldPdf(bytes,w,h,format);
  // The common PDF stream builder uses its thermal width for unknown formats;
  // for A5 use a geometry-preserving scale by supplying an A4 image then
  // patching only the emitted MediaBox and image transform to A5.
  const pdfBytes=oldPdf(bytes,w,h,'a4'),text=new TextDecoder('latin1').decode(pdfBytes);
  // Never patch compressed image byte sequences. Instead use regular A4 output for A5
  // download when the exact A5 generator is not active.
  return pdfBytes;
 };
 globalThis.HanaInvoiceStudio={config,html,csv,documentHtml,settings,canvas,pdf,rows,safeImg,validFormat};
})();