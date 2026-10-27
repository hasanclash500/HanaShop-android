'use strict';
/* HanaShop voice assistant: rule-based and fully local for queries. Speech-to-text is provided by Android. */
(function(){
 const normal=t=>en(String(t||'')).replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').replace(/[\u064b-\u065f]/g,'').replace(/[؟?!،,.؛:]/g,' ').replace(/\s+/g,' ').trim();
 const reply=(s)=>{const target=document.querySelector('#hvAnswer');if(target)target.textContent=s;return s};
 const money=n=>T(Number.isFinite(n)?n:0);
 const choose=(collection,name)=>{const needle=normal(name);if(!needle)return{value:null};
  const all=collection.filter(x=>normal(x.name)===needle);
  if(all.length===1)return{value:all[0]};
  if(all.length>1)return{ambiguous:true};
  const part=collection.filter(x=>normal(x.name).includes(needle)||needle.includes(normal(x.name)));
  return part.length===1?{value:part[0]}:{value:null,ambiguous:part.length>1};
 };
 const unknown='متوجه نشدم. می‌توانید درباره موجودی، قیمت، سود امروز، فروش امروز، بدهی مشتری، فاکتور یا ثبت خرید سؤال کنید.';
 function handle(original){
  const s=normal(original);
  if(!s)return reply('متن سؤال را بنویسید یا میکروفون را بزنید.');
  const out=document.querySelector('#hvQuestion');if(out)out.value=original;
  const fromPhrase=(arr)=>{for(const prefix of arr){const i=s.indexOf(prefix);if(i>=0)return s.slice(i+prefix.length).replace(/^(از |برای |عطر |مشتری )/,'').trim()}return ''};
  let who=fromPhrase(['بدهی مشتری ','حساب مشتری ','بدهی ','حساب ']);
  if(who){
   const result=choose(db.customers,who);
   return reply(result.ambiguous?'چند مشتری با این نام پیدا شد؛ نام کامل‌تری بگویید.':result.value?'مانده حساب '+result.value.name+': '+money(cDebt(result.value.id)):'این مشتری پیدا نشد. نام کامل پرونده را بگویید.');
  }
  const productQuery=fromPhrase(['موجودی ','چقدر از ','قیمت ','قیمت فروش ','قیمت خرید ','از ']).replace(/(چقدر دارم|چنده|چقدر است|دارم)$/,'').trim();
  if(productQuery){
   const result=choose(db.products,productQuery);
   if(result.ambiguous)return reply('چند کالا با این نام وجود دارد؛ نام دقیق‌تر بگویید.');
   if(result.value){const p=result.value;return reply('کالا: '+p.name+'؛ موجودی: '+fa(p.qty)+' '+p.unit+'؛ قیمت فروش هر واحد: '+money(p.price)+'؛ بهای میانگین خرید: '+money(p.cost)+'.')}
  }
  const today=toJ();
  if(/(سود|درآمد)/.test(s)){
   const f=s.includes('امروز')?today:s.includes('ماه')?today.slice(0,8)+'01':'';
   const r=plNums(f);return reply('گزارش '+(s.includes('امروز')?'امروز':s.includes('ماه')?'ماه جاری':'کل دوره')+': فروش خالص '+money(r.net)+'، سود ناخالص '+money(r.gp)+'، هزینه ثبت‌شده '+money(r.ex)+'، سود خالص دفتری '+money(r.np)+'.');
  }
  if(/(فروش امروز|امروز چقدر فروختم|خلاصه امروز)/.test(s)){
   const xs=db.sales.filter(x=>x.status!=='cancel'&&x.date===today),val=xs.reduce((a,x)=>a+(x.total||0),0);return reply('فروش امروز '+money(val)+' در '+fa(xs.length)+' فاکتور ثبت شده است.');
  }
  if(/(کم موجودی|کمبود کالا|چه کالایی کم)/.test(s)){
   const low=db.products.filter(p=>p.active!==false&&p.qty<=p.min);
   return reply(low.length?'کالاهای کم‌موجودی: '+low.slice(0,10).map(p=>p.name+' '+fa(p.qty)+' '+p.unit).join('؛ '):'فعلاً کالای زیر حداقل موجودی پیدا نشد.');
  }
  if(/(چند مشتری|تعداد مشتری)/.test(s))return reply('تعداد مشتریان ثبت‌شده: '+fa(db.customers.filter(c=>!c.archived).length)+' نفر.');
  if(/(فاکتور|صورت حساب)/.test(s)){
   const m=s.match(/(?:شماره |فاکتور )(\d+)/),invoice=m?db.sales.find(x=>String(x.no)===m[1]):null;
   if(invoice)return reply('فاکتور '+fa(invoice.no)+': مبلغ '+money(invoice.total)+'؛ مانده '+money(invoice.total-invoice.paid)+'. برای مشاهده یا چاپ، از بخش فروش و فاکتورها استفاده کنید.');
   return reply('برای مشاهده، چاپ و اشتراک فاکتور از صفحه فروش یا بخش «فاکتور و تسویه» استفاده کنید.');
  }
  const action = /^(خرید |ثبت خرید|فروش |ثبت فروش|تعریف |ثبت کالا|ایجاد کالا|واریز |انتقال وجه|پرداخت |یادآوری |کار جدید)/;
  if(action.test(s)){
   const box=document.querySelector('#hvPending');
   const kind=/(تعریف|ثبت کالا|ایجاد کالا)/.test(s)?'product':/(فروش)/.test(s)?'sale':/(یادآوری|کار جدید)/.test(s)?'reminder':/(واریز|انتقال وجه|پرداخت)/.test(s)?'payment':'buy';
   const label={product:'تعریف کالای جدید',sale:'فرم فروش',reminder:'یادآورها',payment:'صندوق و بانک',buy:'فرم ثبت خرید'}[kind];
   if(box){box.style.display='block';box.dataset.action=kind}
   return reply('فرمان دریافت شد: '+s+'. برای حفظ صحت حسابداری، ابتدا تأیید کنید تا فرم «'+label+'» باز شود. هیچ سندی به‌صورت خودکار ثبت نمی‌شود.');
  }
  return reply(unknown);
 }
 function openAction(){
  const p=document.querySelector('#hvPending'),kind=p?.dataset.action;if(!kind)return;
  p.style.display='none';close();
  switch(kind){
   case 'buy':buyForm();break;
   case 'sale':tab='sale';render();break;
   case 'product':if(G.measuredProduct)G.measuredProduct();else G.qp();break;
   case 'reminder':tab='task';render();break;
   case 'payment':G.cash();break;
  }
 }
 function speechResult(heard){
  const input=document.querySelector('#hvQuestion');if(input)input.value=heard;reply('شنیدم: '+heard);handle(heard)
 }
 function speechError(message){reply(message||'صدایی تشخیص داده نشد. دوباره امتحان کنید یا سؤال را تایپ کنید.')}
 function startVoice(){
  reply('در حال آماده‌کردن میکروفون...');
  if(window.AndroidBridge&&typeof AndroidBridge.startVoiceRecognition==='function'){AndroidBridge.startVoiceRecognition();return}
  const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(Speech){try{const r=new Speech();r.lang='fa-IR';r.interimResults=false;r.maxAlternatives=1;r.onresult=e=>speechResult(e.results[0][0].transcript);r.onerror=()=>speechError('تشخیص گفتار انجام نشد. سؤال را تایپ کنید.');r.onnomatch=()=>speechError('چیزی شنیده نشد؛ دوباره امتحان کنید.');r.start()}catch(e){speechError(e.message)}}
  else speechError('سرویس تشخیص گفتار در دسترس نیست. سؤال را تایپ کنید.')
 }
 G.voiceAssistant=function(){
  modal('<h3>🎙️ دستیار کاسبی HanaShop</h3>'+
   '<div class="card">درباره موجودی، قیمت فروش، سود امروز، فروش، بدهی مشتری یا فاکتور سؤال کنید. داده‌ها از همین گوشی خوانده می‌شوند.</div>'+
   '<label>سؤال یا دستور شما</label><textarea id="hvQuestion" rows="2" placeholder="مثلاً از کرید اونتوس چقدر دارم؟"></textarea>'+
   '<div class="grid"><button class="b" id="hvListen">🎤 صحبت کن</button><button class="b s" id="hvAsk">پرسیدن</button></div>'+
   '<div class="card" style="margin-top:12px" id="hvAnswer" role="status" aria-live="polite">برای شروع سؤال خود را بگویید یا تایپ کنید.</div>'+
   '<div id="hvPending" style="display:none"><div class="k">برای عملیات تغییردهنده، مرحله بعد تنها باز کردن فرم است و ذخیره نیاز به تأیید جداگانه دارد.</div><button class="b" id="hvConfirm">تأیید و باز کردن فرم</button><button class="b s" id="hvCancel">لغو</button></div>'+
   '<div class="k">تشخیص گفتار ممکن است از سرویس اندروید و اینترنت استفاده کند؛ در صورت حساس‌بودن اطلاعات، دستور را تایپ کنید.</div><button class="b s" id="hvClose">بستن</button>');
  document.querySelector('#hvListen').onclick=startVoice;
  document.querySelector('#hvAsk').onclick=()=>{const pending=document.querySelector('#hvPending');if(pending)pending.style.display='none';handle(document.querySelector('#hvQuestion').value)};
  document.querySelector('#hvConfirm').onclick=openAction;
  document.querySelector('#hvCancel').onclick=()=>{document.querySelector('#hvPending').style.display='none';reply('عملیات لغو شد. هیچ تغییری انجام نشد.')};
  document.querySelector('#hvClose').onclick=close;
 };
 const prevMore=R.more;R.more=function(){prevMore();if(document.querySelector('#hanaVoice'))return;
  V.insertAdjacentHTML('beforeend','<div class="card" id="hanaVoice"><b>🎙️ دستیار کاسبی</b><div class="k">سؤال درباره فروش، سود، کالا و حساب مشتری، با متن یا صدا</div><button class="b" id="hanaVoiceOpen">باز کردن دستیار</button></div>');
  document.querySelector('#hanaVoiceOpen').onclick=()=>G.voiceAssistant();
 };
 globalThis.HanaVoice={handle,onResult:speechResult,onError:speechError};
})();