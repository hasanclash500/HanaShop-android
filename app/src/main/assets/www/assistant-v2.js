'use strict';
/* HanaShop assistant V2: transparent local-language parser for on-device records.
   No server model, no network calls, no automatic financial mutations. */
(function(){
 const digitChars='۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩';
 const toLatin=str=>String(str||'').replace(/[۰-۹٠-٩]/g,c=>String(digitChars.indexOf(c)%10));
 const normalize=str=>toLatin(str).toLowerCase()
  .replace(/[يى]/g,'ی').replace(/[ك]/g,'ک').replace(/[ۀة]/g,'ه').replace(/[أإآ]/g,'ا')
  .replace(/[\u064b-\u065f\u0670]/g,'').replace(/[\u200c\u200d]/g,' ')
  .replace(/[؟?!،,؛;:()\u200e\u200f،.]/g,' ')
  .replace(/[\u0640]/g,'').replace(/\s+/g,' ').trim();
 const STOP=new Set('عطر ادکلن شیشه بطری آقای آقا خانم سرکار مشتری محصول کالا اقلام نوع مدل برند از برای که این اون همون یک و با به رو را چه چقدر چند من ما منو منم هست دارد دارم داری دارین داریش دارید شده است بود بگو بگی بگین بفرما میخوام می خوام لطفا الان الانش آیا قیمتش موجودیش حسابش مقدارش'.split(' '));
 const toks=s=>normalize(s).split(' ').filter(t=>t&&!STOP.has(t)&&t.length>1);
 function distance(a,b){if(a===b)return 0;if(Math.abs(a.length-b.length)>2)return 3;
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=next}
  return prev[b.length];
 }
 function entityMatch(coll,input){
  const q=normalize(input),qt=toks(q);
  const candidates=[];
  for(const item of coll||[]){if(item.archived||item.active===false)continue;
   const title=normalize(item.name||'');if(!title)continue;
   const words=toks(title);if(!words.length)continue;
   let score=0;
   if(q.includes(title))score=50+title.length;
   else{
    let hits=0,exact=0;
    for(const w of words){const m=qt.some(t=>t===w);if(m){hits+=1;exact+=1;continue}
      if(w.length>=5&&qt.some(t=>t.length>=5&&distance(t,w)<=1))hits+=0.55;
    }
    if(hits>=1&&hits/words.length>=0.49)score=hits/words.length*20+exact*3;
   }
   if(score>0)candidates.push({item,score});
  }
  candidates.sort((a,b)=>b.score-a.score);
  if(!candidates.length)return {item:null};
  const top=candidates[0],second=candidates[1];
  if(second&&Math.abs(top.score-second.score)<4)return{ambiguous:true,names:candidates.slice(0,4).map(c=>c.item.name)};
  if(top.score<10)return{item:null};
  return {item:top.item};
 }
 const cur={product:null,customer:null};
 const currency=v=>T(Number.isFinite(v)?Math.round(v):0);
 const itemProfit=(id,from='')=>globalThis.HanaBusiness?.itemProfit(from).rows.find(r=>r.pid===id)||null;
 function period(q){
  const today=toJ();
  if(/(دیروز|هفته پیش|سال پیش)/.test(q))return{unsupported:true};
  if(/(امروز|روز جاری)/.test(q))return{from:today,label:'امروز'};
  if(/(این ماه|ماه جاری|ماهانه|ماه امسال|ماه)/.test(q))return{from:today.slice(0,8)+'01',label:'این ماه'};
  return{from:'',label:'کل دوره'};
 }
 const phonePreview=p=>{const n=String(p.phone||'').replace(/[^\d]/g,'');return n?n:'ثبت نشده'};
 let pending='';
 function command(q){
  // Explicit verbs/imperatives only; an informational question never modifies books.
  if(/(ثبت کن|ثبت بکن|اضافه کن|بخر|بفروش|ایجاد کن|بساز|فاکتور بزن|حواله بزن)/.test(q)||
     /^(خرید|فروش)\s+\d/.test(q)||/^(تعریف کالا|ثبت خرید|ثبت فروش|مشتری جدید|کار جدید|یادآوری جدید)/.test(q)){
   if(/(مشتری جدید)/.test(q))return'customer';
   if(/(یادآور|کار جدید|تماس|قرار)/.test(q))return'reminder';
   if(/(فروش|بفروش|فاکتور)/.test(q))return'sale';
   if(/(تعریف|ایجاد کالا|کالا جدید)/.test(q))return'product';
   if(/(پرداخت|انتقال|واریز)/.test(q))return'payment';
   return'buy';
  }
  return'';
 }
 function respond(raw){
  const q=normalize(raw);
  if(!q)return'سؤال خود را بگویید یا تایپ کنید.';
  if(/^(سلام|سلام خوبی|درود|سلام دستیار)$/.test(q))return'سلام! می‌توانید موجودی عطر، قیمت خرید و فروش، بدهی مشتری، فروش امروز، سود ماه یا یادآوری‌ها را بپرسید.';
  const cmd=command(q);
  if(cmd){
   pending=cmd;
   const box=document.getElementById('hvPending');
   if(box){box.style.display='block';box.dataset.action=cmd}
   const labels={customer:'مشتری جدید',reminder:'یادآوری',sale:'فروش',product:'تعریف کالا',payment:'صندوق و بانک',buy:'خرید'};
   return'درخواست «'+labels[cmd]+'» دریافت شد. برای بازکردن فرم تأیید کنید. ثبت نهایی تنها با بررسی و ذخیره توسط شما انجام می‌شود.';
  }
  const invoiceMatch=q.match(/(?:فاکتور|شماره فاکتور|فاکتور شماره)\s*(\d{3,})/);
  if(invoiceMatch){const row=db.sales.find(x=>String(x.no)===invoiceMatch[1]);
   return row?'فاکتور '+row.no+': کل '+currency(row.total)+'، دریافت‌شده '+currency(row.paid)+'، مانده '+currency(row.total-row.paid)+'.':'فاکتوری با شماره '+invoiceMatch[1]+' پیدا نشد.'}
  const c=entityMatch(db.customers,q),p=entityMatch(db.products,q);
  const pronoun=/(قیمتش|موجودیش|چقدر ازش|حسابش|بدهیش|اون|همون|این عطر|اون عطر)/.test(q);
  const customerCue=/(مشتری|آقای|خانم|بده|طلب|حساب|امتیاز|شماره|تلفن|خریدها|آخرین خرید)/.test(q);
  const productCue=/(عطر|محصول|کالا|قیمت|موجود|گرم|میلی لیتر|چقدر از|چند تا|سود هر)/.test(q);
  const useCustomer=customerCue&&c.item&&(!p.item||!productCue||/(بده|امتیاز|مشتری)/.test(q));
  if(useCustomer||(!p.item&&pronoun&&cur.customer&&customerCue)){
   const x=useCustomer?c.item:db.customers.find(y=>y.id===cur.customer);
   if(x){cur.customer=x.id;const total=cSales(x.id).reduce((a,s)=>a+s.total,0);
    if(/(امتیاز|باشگاه|سطح)/.test(q))return x.name+': '+fa(cPoints(x.id))+' امتیاز؛ سطح '+level(cPoints(x.id))+'.';
    if(/(آخرین خرید|آخرین فاکتور)/.test(q)){const ss=cSales(x.id).slice().sort((a,b)=>b.date.localeCompare(a.date));return ss.length?'آخرین خرید '+x.name+': '+fa(ss[0].date)+'؛ '+currency(ss[0].total)+'.':'برای این مشتری خریدی ثبت نشده است.'}
    if(/(شماره|تلفن|موبایل)/.test(q))return'شماره تماس '+x.name+': '+phonePreview(x)+'.';
    if(/(مجموع خرید|چقدر خرید|تعداد خرید)/.test(q))return x.name+': '+fa(cSales(x.id).length)+' خرید، به ارزش '+currency(total)+'.';
    return'مانده حساب '+x.name+': '+currency(cDebt(x.id))+'؛ امتیاز '+fa(cPoints(x.id))+'؛ '+fa(cSales(x.id).length)+' فاکتور.';
   }
  }
  if(customerCue&&c.ambiguous)return'چند مشتری با این نام پیدا شد: '+c.names.join('، ')+'. نام کامل‌تری بگویید.';
  const effectiveProduct=p.item||(!c.item&&pronoun&&cur.product?db.products.find(x=>x.id===cur.product):null);
  if(effectiveProduct){
   cur.product=effectiveProduct.id;const x=effectiveProduct;
   if(/(سود|فروش این عطر|فروش این کالا)/.test(q)){
    const t=period(q);if(t.unsupported)return'برای بازه دیروز از بخش گزارش‌ها استفاده کنید.';
    const v=itemProfit(x.id,t.from);return v?'گزارش '+x.name+' در '+t.label+': '+fa(v.qty)+' '+x.unit+' فروش، مبلغ '+currency(v.revenue)+'، سود ناخالص '+currency(v.profit)+'.':'برای '+x.name+' در '+t.label+' فروشی پیدا نشد.';
   }
   if(/(قیمت خرید|قیمت تمام|چند خریدم|بهای خرید)/.test(q))return'بهای میانگین خرید '+x.name+' در هر '+x.unit+': '+currency(x.cost)+'.';
   if(/(قیمت فروش|چند بفروشم|قیمتش|چنده|چند میفروشم)/.test(q))return'قیمت فروش '+x.name+' در هر '+x.unit+': '+currency(x.price)+'.';
   if(/(موجود|چقدر|چند|گرم|حجم|باقی|دارم|مانده)/.test(q))return'موجودی '+x.name+': '+fa(x.qty)+' '+x.unit+'. قیمت فروش هر واحد: '+currency(x.price)+'.';
   return x.name+': موجودی '+fa(x.qty)+' '+x.unit+'، قیمت خرید '+currency(x.cost)+'، قیمت فروش '+currency(x.price)+'.';
  }
  if(productCue&&p.ambiguous)return'چند کالا پیدا شد: '+p.names.join('، ')+'. نام دقیق‌تری بگویید.';
  // Respond to entity-free aggregate questions only after checking named records.
  if(/(کم موجودی|کم موجود|کمبود|در حال تمام|زیر حداقل|موجودی کم)/.test(q)){
   const low=db.products.filter(x=>x.active!==false&&x.qty<=x.min);
   return low.length?'کالاهای کم‌موجودی: '+low.slice(0,8).map(x=>x.name+' '+fa(x.qty)+' '+x.unit).join('، ')+(low.length>8?'؛ و '+fa(low.length-8)+' کالای دیگر.':'.'):'فعلاً کالایی زیر حداقل موجودی نیست.';
  }
  if(/(ناموجود|تمام شده|موجودی صفر)/.test(q)){
   const out=db.products.filter(x=>x.active!==false&&x.qty<=0);
   return out.length?'کالاهای تمام‌شده: '+out.slice(0,8).map(x=>x.name).join('، '):'کالای تمام‌شده‌ای در فهرست نیست.';
  }
  if(/(تولد|متولدین)/.test(q)){
   const t=toJ(),who=db.customers.filter(c=>c.birth&&normJ(c.birth).slice(5)===t.slice(5));
   return who.length?'تولد امروز: '+who.map(c=>c.name).join('، ')+'.':'امروز تولدی در پرونده‌ها پیدا نشد.';
  }
  if(/(یادآور|یادآوری|کارهای امروز|قرار امروز)/.test(q)){
   const t=toJ(),items=db.reminders.filter(r=>!r.done&&r.date<=t);
   return items.length?'یادآوری‌های امروز و عقب‌افتاده: '+items.slice(0,8).map(x=>x.title+'، '+x.date+' ساعت '+(x.time||'09:00')).join('؛ '):'یادآوری عقب‌افتاده یا سررسید امروز ندارید.';
  }
  if(/(چند (تا )?مشتری|تعداد مشتری)/.test(q))return'تعداد مشتریان فعال: '+fa(db.customers.filter(c=>!c.archived).length)+'.';
  if(/(چند (تا )?کالا|تعداد کالا|چند نوع عطر)/.test(q))return'تعداد کالاهای فعال: '+fa(db.products.filter(x=>x.active!==false).length)+'.';
  if(/(بدهی تامین|بدهی شرکت|بدهی فروشنده|به شرکت ها بدهکار)/.test(q))return'جمع بدهی به تأمین‌کنندگان: '+currency(-bal('2101'))+'.';
  if(/(بدهی مشتریان|مشتریان بدهکار|چقدر طلب دارم|مطالبات)/.test(q))return'جمع مطالبات مشتریان: '+currency(bal('1103'))+'.';
  if(/(صندوق|نقدینگی نقدی|پول نقد)/.test(q))return'مانده دفتری صندوق: '+currency(bal('1101'))+'. مبلغ واقعی را در «شمارش صندوق» کنترل کنید.';
  if(/(موجودی بانک|حساب بانکی|بانک چقدر)/.test(q))return'مانده دفتری بانک: '+currency(bal('1102'))+'.';
  if(/(سود|زیان|درآمد|درامد)/.test(q)){
   const t=period(q);if(t.unsupported)return'برای گزارش سود دیروز یا بازه دلخواه، از صفحه گزارش‌ها استفاده کنید.';
   const r=plNums(t.from);return'سود و زیان '+t.label+': فروش خالص '+currency(r.net)+'، سود ناخالص '+currency(r.gp)+'، هزینه '+currency(r.ex)+'، سود خالص دفتری '+currency(r.np)+'.';
  }
  if(/(فروش|فروختم|فروختیم|درآمد فروش|فاکتورهای امروز)/.test(q)){
   const t=period(q);if(t.unsupported)return'برای گزارش فروش دیروز یا بازه دلخواه، از بخش گزارش‌ها استفاده کنید.';
   const rows=db.sales.filter(s=>s.status!=='cancel'&&(!t.from||s.date>=t.from));
   return'فروش '+t.label+': '+currency(rows.reduce((a,s)=>a+s.total,0))+' در '+fa(rows.length)+' فاکتور.';
  }
  if(/(هزینه|خرج|مخارج)/.test(q)){
   const t=period(q);if(t.unsupported)return'هزینه‌های دیروز را در گزارش‌ها ببینید.';
   const r=plNums(t.from);return'هزینه ثبت‌شده '+t.label+': '+currency(r.ex)+'.';
  }
  if(/(فاکتور|صورت حساب)/.test(q))return'برای مشاهده و ارسال فاکتور از بخش «فروش» یا «فاکتور و تسویه» استفاده کنید. شماره فاکتور را هم می‌توانید بپرسید.';
  if(/(خرید|سفارش)/.test(q))return'برای خرید و افزایش موجودی، از صفحه کالا یا فرم خرید استفاده کنید. برای ثبت با گفتار بگویید «ثبت خرید» و سپس در فرم تأیید کنید.';
  if(/(چه کار|کمک|راهنما|میتونی|می تونی)/.test(q))return'می‌توانید بپرسید: «چقدر اونتوس دارم؟»، «قیمتش چنده؟»، «بدهی رضا اکبری»، «سود این ماه»، «فروش امروز»، «موجودی صندوق» یا «تولدهای امروز».';
  if(productCue||customerCue)return'نام کالا یا مشتری را دقیق‌تر بگویید. مثلاً «موجودی کرید اونتوس» یا «بدهی رضا اکبری».';
  return'متوجه سؤال نشدم. درباره موجودی، قیمت، سود، فروش، هزینه، بدهی، مشتریان یا یادآوری‌ها بپرسید. مثال: «امروز چقدر فروختم؟»';
 }
 function handle(text){
  const input=document.getElementById('hvQuestion');if(input)input.value=text;
  const pendingBox=document.getElementById('hvPending');if(pendingBox){pendingBox.style.display='none';pendingBox.dataset.action=''}
  pending='';
  let response;try{response=respond(text)}catch(e){console.warn('Voice assistant',e);response='خواندن اطلاعات ممکن نشد. یک بار برنامه را باز و بسته کنید یا از صفحه گزارش‌ها استفاده کنید.'}
  const answer=document.getElementById('hvAnswer');if(answer)answer.textContent=response;
  return response;
 }
 function openAction(){
  const kind=pending;if(!kind)return;
  pending='';
  const p=document.getElementById('hvPending');if(p)p.style.display='none';close();
  switch(kind){
   case 'sale':tab='sale';render();break;
   case 'buy':buyForm();break;
   case 'product':if(G.measuredProduct)G.measuredProduct();else prodForm();break;
   case 'customer':custForm();break;
   case 'reminder':remForm();break;
   case 'payment':G.cash();break;
  }
 }
 function onResult(heard){return handle(heard)}
 function onError(msg){
  const ans=document.getElementById('hvAnswer');if(ans)ans.textContent=msg||'گفتار تشخیص داده نشد. برای نتیجه بهتر، نزدیک میکروفون صحبت کنید یا تایپ کنید.'
 }
 G.voiceAssistant=function(){
  modal('<h3>🤖 دستیار کاسبی حنا</h3>'+
   '<div class="card k">پاسخ‌ها از اطلاعات همین گوشی خوانده می‌شوند. سؤال‌های روزمره را ساده و محاوره‌ای بنویسید یا بگویید.</div>'+
   '<label for="hvQuestion">سؤال یا دستور</label><textarea id="hvQuestion" rows="2" placeholder="مثلاً اونتوس چقدر مونده؟"></textarea>'+
   '<div class="grid"><button class="b" id="hvListen">🎙️ صحبت کن</button><button class="b s" id="hvAsk">بپرس</button></div>'+
   '<div id="hvAnswer" class="card" role="status" aria-live="polite" style="margin-top:12px;white-space:pre-wrap">سلام! چه کمکی از دستم برمی‌آید؟</div>'+
   '<div id="hvPending" style="display:none"><div class="k">برای تغییر حسابداری باید فرم مربوطه را باز و عملیات را جداگانه ذخیره کنید.</div><button class="b" id="hvConfirm">تأیید و باز کردن فرم</button><button class="b s" id="hvCancel">انصراف</button></div>'+
   '<div class="k">نمونه سؤال‌ها:</div><div class="grid" id="hvExamples">'+
   ['اونتوس چقدر مونده؟','قیمتش چنده؟','امروز چقدر فروختم؟','سود این ماه','چه کالاهایی کم موجودی هستند؟','بدهی رضا اکبری'].map(s=>'<button type="button" class="b s" data-example="'+esc(s)+'" style="font-size:13px">'+esc(s)+'</button>').join('')+
   '</div><div class="k" style="margin-top:8px">تشخیص صدا ممکن است به سرویس گفتار گوشی و اینترنت نیاز داشته باشد. پاسخ‌های مالی در خود برنامه محاسبه می‌شوند. این یک دستیار مبتنی بر فرمان است، نه هوش مصنوعی مکالمه‌ای آنلاین.</div><button class="b s" id="hvClose">بستن</button>');
  document.getElementById('hvAsk').onclick=()=>handle(document.getElementById('hvQuestion').value);
  document.getElementById('hvQuestion').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handle(e.target.value)}};
  document.getElementById('hvListen').onclick=()=>{
   const ans=document.getElementById('hvAnswer');if(ans)ans.textContent='در حال بازکردن میکروفون گوشی...';
   if(window.AndroidBridge?.startVoiceRecognition){AndroidBridge.startVoiceRecognition();return}
   const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
   if(!Speech){onError('تشخیص گفتار روی این دستگاه فعال نیست؛ می‌توانید سؤال را تایپ کنید.');return}
   try{const r=new Speech();r.lang='fa-IR';r.interimResults=false;r.onresult=e=>onResult(e.results[0][0].transcript);r.onerror=()=>onError('صدا تشخیص داده نشد؛ یک بار دیگر امتحان کنید یا تایپ کنید.');r.start()}catch(e){onError('سرویس گفتار در دسترس نیست؛ تایپ کنید.')}
  };
  document.getElementById('hvExamples').onclick=e=>{const b=e.target.closest('[data-example]');if(b)handle(b.dataset.example)};
  document.getElementById('hvConfirm').onclick=openAction;
  document.getElementById('hvCancel').onclick=()=>{pending='';document.getElementById('hvPending').style.display='none';document.getElementById('hvAnswer').textContent='عملیات لغو شد؛ هیچ اطلاعاتی تغییر نکرد.'};
  document.getElementById('hvClose').onclick=close;
 };
 // Android calls these dynamic methods after external recognition finishes.
 globalThis.HanaVoice={handle,onResult,onError,parse:normalize,matchProduct:q=>entityMatch(db.products,q),matchCustomer:q=>entityMatch(db.customers,q),version:2};
 const KEY='hana_bot_pos_v2';
 function dimension(){return{width:window.innerWidth||360,height:window.innerHeight||700}}
 function limit(x,y){const d=dimension();return{x:Math.max(5,Math.min(d.width-59,x)),y:Math.max(58,Math.min(d.height-126,y))}}
 function position(bot,x,y){const p=limit(x,y);bot.style.left=p.x+'px';bot.style.top=p.y+'px';bot.style.bottom='auto';bot.style.right='auto';bot.style.insetInlineStart='auto';return p}
 function savedPosition(){try{const j=JSON.parse(localStorage.getItem(KEY)||'null');if(j&&Number.isFinite(j.x)&&Number.isFinite(j.y))return j}catch(e){}return null}
 function mountBot(){
  const bot=document.getElementById('fab');if(!bot)return;
  const inlineSale=document.getElementById('qsb');if(inlineSale)inlineSale.remove();
  if(bot.dataset.hanaBot==='1')return;
  bot.dataset.hanaBot='1';bot.textContent='🤖';bot.setAttribute('aria-label','باز کردن دستیار کاسبی؛ برای جابه‌جایی بکشید');bot.setAttribute('title','دستیار کاسبی');
  bot.classList.add('hana-bot');bot.onclick=null;
  const base=savedPosition(),d=dimension();position(bot,base?.x??14,base?.y??d.height-146);
  let start=null,dragging=false,ignoreClick=false;
  bot.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;
   start={id:e.pointerId,x:e.clientX,y:e.clientY,left:parseFloat(bot.style.left)||0,top:parseFloat(bot.style.top)||0};
   dragging=false;try{bot.setPointerCapture(e.pointerId)}catch(error){}});
  bot.addEventListener('pointermove',e=>{if(!start||e.pointerId!==start.id)return;
   const dx=e.clientX-start.x,dy=e.clientY-start.y;
   if(!dragging&&Math.hypot(dx,dy)>8)dragging=true;
   if(dragging){position(bot,start.left+dx,start.top+dy);e.preventDefault()}
  });
  const end=e=>{if(!start||e.pointerId!==start.id)return;
   if(dragging){ignoreClick=true;setTimeout(()=>{ignoreClick=false},250);try{localStorage.setItem(KEY,JSON.stringify({x:parseFloat(bot.style.left),y:parseFloat(bot.style.top)}))}catch(error){}}
   start=null;dragging=false};
  bot.addEventListener('pointerup',end);bot.addEventListener('pointercancel',end);
  bot.addEventListener('click',e=>{if(ignoreClick){ignoreClick=false;e.preventDefault();return}G.voiceAssistant()});
  window.addEventListener('resize',()=>position(bot,parseFloat(bot.style.left)||14,parseFloat(bot.style.top)||100));
 }
 const oldRender=render;
 render=function(){oldRender();mountBot()};
 // The previous renderer has already run once on startup in some WebViews.
 mountBot();
 globalThis.HanaBotV2={mountBot,position,savedPosition,normalize};
})();