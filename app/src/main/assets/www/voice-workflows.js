'use strict';
/* Voice-to-form preparation: recognizer text is parsed locally; no bookkeeping
 * write ever occurs until the user presses the EXISTING form Save button. */
(function(){
 const normalize=t=>HanaVoice.parse(String(t||''));
 const digits=t=>en(String(t||'')).replace(/[٬،,](?=\d{3}\b)/g,'').replace(/٫/g,'.');
 const moneyWords={صفر:0,یک:1,یه:1,دو:2,سه:3,چهار:4,پنج:5,شش:6,هفت:7,هشت:8,نه:9,ده:10,یازده:11,دوازده:12,سیزده:13,چهارده:14,پانزده:15,شانزده:16,هفده:17,هجده:18,نوزده:19,بیست:20,سی:30,چهل:40,پنجاه:50,شصت:60,هفتاد:70,هشتاد:80,نود:90,صد:100,دویست:200,سیصد:300,چهارصد:400,پانصد:500,ششصد:600,هفتصد:700,هشتصد:800,نهصد:900};
 function spokenNumber(s){
  const t=digits(s).trim(),n=Number(t.replace(/\s/g,''));
  if(t&&Number.isFinite(n)&&n>=0)return n;
  if(t==='نیم')return .5;
  if(!t||!/^(?:(?:صفر|یک|یه|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده|یازده|دوازده|سیزده|چهارده|پانزده|شانزده|هفده|هجده|نوزده|بیست|سی|چهل|پنجاه|شصت|هفتاد|هشتاد|نود|صد|دویست|سیصد|چهارصد|پانصد|ششصد|هفتصد|هشتصد|نهصد|هزار|میلیون|و|نیم|ممیز)\s*)+$/.test(t))return null;
  let total=0,current=0,decimal='',afterDecimal=false;
  for(const w of t.split(/\s+/).filter(x=>x&&x!=='و')){
   if(w==='ممیز'){afterDecimal=true;continue}
   if(w==='نیم'){if(afterDecimal)decimal+='5';else current+=.5;continue}
   const v=moneyWords[w];if(w==='هزار'||w==='میلیون'){const factor=w==='هزار'?1000:1000000;total+=(current||1)*factor;current=0;continue}
   if(v===undefined)return null;
   if(afterDecimal)decimal+=String(v);else current+=v;
  }
  return total+current+(decimal?Number('0.'+decimal):0);
 }
 const numberRE='(?:[0-9۰-۹٠-٩][0-9۰-۹٠-٩,،٬.٫]*|نیم|(?:یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده|بیست|سی|چهل|پنجاه|شصت|هفتاد|هشتاد|نود|صد|دویست|سیصد|چهارصد|پانصد|هزار|میلیون)(?: و | )?(?:[آ-ی ]{0,14})?)';
 const numberPattern=new RegExp(numberRE,'g');
 function numericBeforeUnit(s){
  const re=new RegExp('('+numberRE+')\\s*(گرم|گرمی|میل|میلی لیتر|عدد|تا|دانه)(?:\\s|$)','i'),m=re.exec(s);
  return m?spokenNumber(m[1]):null;
 }
 function amountAfter(s,labels){
  for(const label of labels){
   const i=s.indexOf(label);if(i<0)continue;
   const t=s.slice(i+label.length).trim().replace(/^هر\s+(گرم|میل|عدد)\s*/,'');
   const m=t.match(/^([0-9۰-۹٠-٩][0-9۰-۹٠-٩,،٬.٫]*|[آ-ی]+(?: و [آ-ی]+){0,6}(?: هزار| میلیون)?)/);
   if(m){const v=spokenNumber(m[1]);if(v!==null)return v}
  }
  return null;
 }
 function chooseFrom(collection,raw){if(!Array.isArray(collection)||!collection.length)return{value:null};
  const q=normalize(raw),eligible=collection.filter(c=>c.active!==false&&!c.archived);
  const matches=eligible.filter(c=>q.includes(normalize(c.name))).sort((a,b)=>b.name.length-a.name.length);
  if(matches.length===1)return{value:matches[0]};
  if(matches.length>1){
   const top=matches[0];if(matches[1].name.length===top.name.length)return{ambiguous:true,names:matches.slice(0,4).map(x=>x.name)};
   return{value:top}
  }
  const lookup=eligible===db.products?HanaVoice.matchProduct:eligible===db.customers?HanaVoice.matchCustomer:null;
  const result=collection===db.products?HanaVoice.matchProduct(q):collection===db.customers?HanaVoice.matchCustomer(q):null;
  return result?{value:result.item||null,ambiguous:result.ambiguous,names:result.names}: {value:null};
 }
 function cleanName(t){return String(t||'').replace(/^(?:جدید|به نام|برای|مشتری|آقای|خانم)\s*/g,'').replace(/\s*(?:شماره|موبایل|تلفن|تاریخ تولد|متولد|قیمت|مبلغ)\s*.*/,'').trim()}
 function classify(raw){
  const s=normalize(raw);
  if(/^(?:ثبت|اضافه کن|ایجاد|بساز)\s+(?:مشتری|شخص)\b/.test(s)||/^(?:مشتری|شخص)\s+جدید/.test(s))return'customer';
  if(/^(?:ثبت|اضافه کن)\s+(?:فروش|فاکتور فروش)|^(?:فروش|بفروش)\s|^(?:فاکتور بزن)/.test(s))return'sale';
  if(/^(?:ثبت|اضافه کن)\s+(?:خرید|ورود موجودی)|^(?:خرید|بخر)\s/.test(s))return'buy';
  if(/^(?:ثبت|اضافه کن)\s+(?:هزینه|خرج)|^(?:هزینه جدید)/.test(s))return'expense';
  if(/^(?:ثبت|اضافه کن)\s+(?:یادآوری|یاداور|قرار)|^(?:یادم بنداز|یادآوری جدید)/.test(s))return'reminder';
  if(/^(?:ثبت|تعریف|اضافه کن)\s+(?:کالا|محصول|عطر جدید)|^(?:کالای جدید)/.test(s))return'product';
  return'';
 }
 function parse(raw){
  const s=normalize(raw),kind=classify(raw);
  if(!kind)return null;
  const result={kind,original:raw,fields:{},errors:[],warnings:[]},f=result.fields;
  if(kind==='customer'){
   const first=s.replace(/^(ثبت|اضافه کن|ایجاد|بساز)\s*/,'').replace(/^(مشتری|شخص)\s*/,'').replace(/^جدید\s*/,'');
   const phoneMatch=digits(s).match(/(?:\b0?9\d{9}\b|\b989\d{9}\b)/);
   if(phoneMatch)f.phone=normPhone(phoneMatch[0]);
   const parts=first.split(/\s*(?:شماره|موبایل|تلفن|تاریخ تولد|متولد)\s*/);
   f.name=cleanName(parts[0]);if(!f.name)result.errors.push('نام مشتری مشخص نیست.');
   if(!f.phone)result.warnings.push('شماره موبایل را در فرم تکمیل کنید.');
   const date=digits(s).match(/\b1[34]\d{2}\/\d{1,2}\/\d{1,2}\b/);
   if(date&&validJ(date[0]))f.birth=normJ(date[0]);
  }else if(kind==='sale'||kind==='buy'){
   const found=chooseFrom(db.products,raw);
   if(found.ambiguous)result.errors.push('نام کالا مبهم است: '+(found.names||[]).join('، '));
   else if(found.value)f.pid=found.value.id;
   else result.errors.push('کالا مشخص نیست. نام کامل کالا را بگویید.');
   f.qty=numericBeforeUnit(s);
   if(f.qty===null){const m=s.replace(/^(ثبت|اضافه کن|خرید|فروش|بخر|بفروش|فاکتور فروش)\s*/g,'').match(/^(\d+(?:\.\d+)?|[آ-ی]+)\s/);if(m)f.qty=spokenNumber(m[1])}
   if(f.qty===null||!(f.qty>0))result.warnings.push('مقدار خرید/فروش را در فرم وارد کنید.');
   f.method=/(کارت|بانک|کارتخوان|کارت خوان|پوز)/.test(s)?'1102':/(نسیه|حساب)/.test(s)?'2101':'1101';
   if(kind==='buy'){
    f.cost=amountAfter(s,['قیمت خرید هر واحد','قیمت خرید','فی خرید','هر گرم','هر میل','قیمت','فی']);
    const supplier=chooseFrom(db.suppliers,s);
    if(supplier.value)f.supplier=supplier.value.id;
    if(f.cost===null)result.warnings.push('قیمت خرید واحد را در فرم کنترل کنید.');
   }else{
    const customer=chooseFrom(db.customers,s);
    if(customer.ambiguous)result.warnings.push('مشتری مبهم است؛ در فرم انتخاب کنید.');
    if(customer.value)f.cid=customer.value.id;
    if(f.method==='2101')f.method='1101';
    f.paid=amountAfter(s,['پرداخت','واریز','دریافت']);
    f.discount=amountAfter(s,['تخفیف']);
   }
  }else if(kind==='expense'){
   f.amount=amountAfter(s,['مبلغ','هزینه','خرج']);
   f.method=/(کارت|بانک)/.test(s)?'1102':/(نسیه)/.test(s)?'2103':'1101';
   f.description=s.replace(/^(ثبت|اضافه کن)\s*/,'').replace(/^(هزینه|خرج|جدید)\s*/,'')
     .replace(/(?:مبلغ)\s*.*/,'').trim().slice(0,160);
   if(f.amount===null)result.warnings.push('مبلغ هزینه باید در فرم تکمیل شود.');
  }else if(kind==='reminder'){
   const t=s.match(/(?:ساعت)\s*(\d{1,2})(?::(\d{1,2}))?/),today=toJ();
   if(t){const h=Number(t[1]),m=Number(t[2]||0);if(h<=23&&m<=59)f.time=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')}
   const j=digits(s).match(/\b1[34]\d{2}\/\d{1,2}\/\d{1,2}\b/);
   if(j&&validJ(j[0]))f.date=normJ(j[0]);
   else if(/فردا/.test(s))f.date=addDays(today,1);
   else if(/امروز/.test(s))f.date=today;
   else {const day=digits(s).match(/(?:روز|تاریخ|روز\s+)(\d{1,2})/);if(day){const d=Number(day[1]),parts=today.split('/').map(Number);const v=parts[0]+'/'+String(parts[1]).padStart(2,'0')+'/'+String(d).padStart(2,'0');if(validJ(v))f.date=v}}
   f.title=s.replace(/^(?:ثبت|اضافه کن)\s*/,'').replace(/^(?:یادآوری|یاداور|قرار|جدید|یادم بنداز)\s*/,'').replace(/(?:فردا|امروز|ساعت\s*\d+(?::\d+)?|روز\s*\d+|تاریخ\s*[\d/]+|1[34]\d{2}\/\d{1,2}\/\d{1,2})/g,'').trim().slice(0,180);
   if(!f.title)result.warnings.push('عنوان یادآوری را در فرم کامل کنید.');
   if(!f.date)result.warnings.push('تاریخ دقیق شمسی را در فرم انتخاب کنید.');
  }else if(kind==='product'){
   const first=s.replace(/^(ثبت|تعریف|اضافه کن)\s*/,'').replace(/^(کالا|محصول|عطر جدید|کالای جدید)\s*/,'');
   f.name=first.split(/\s*(?:قیمت خرید|قیمت فروش|موجودی|تعداد|با قیمت)\s*/)[0].trim();
   f.unit=/(میلی لیتر|میل)/.test(s)?'میلی‌لیتر':/(عدد|دانه)/.test(s)?'عدد':'گرم';
   f.cost=amountAfter(s,['قیمت خرید','بهای خرید']);f.price=amountAfter(s,['قیمت فروش']);
   f.qty=numericBeforeUnit(s);if(!f.name)result.errors.push('نام محصول مشخص نیست.');
   result.warnings.push('موجودی اولیه و قیمت‌ها را قبل از ذخیره کنترل کنید.');
  }
  return result;
 }
 let draft=null;
 const labels={customer:'مشتری جدید',sale:'فروش',buy:'خرید',expense:'هزینه',reminder:'یادآوری',product:'محصول جدید'};
 function report(d){
  const f=d.fields,items=[['نام',f.name],['کالا',f.pid?prod(f.pid)?.name:null],['مشتری',f.cid?cust(f.cid)?.name:null],
  ['مقدار',f.qty],['شماره',f.phone],['قیمت خرید',f.cost],['قیمت فروش',f.price],['مبلغ',f.amount],
  ['تاریخ',f.date],['ساعت',f.time],['شرح',f.title||f.description]];
  return 'فرمان «'+labels[d.kind]+'» تشخیص داده شد.\n'+items.filter(x=>x[1]!==null&&x[1]!==undefined&&x[1]!=='').map(x=>x[0]+': '+x[1]).join(' | ')+
   (d.errors.length?'\n⚠️ '+d.errors.join('؛ '):'')+
   (d.warnings.length?'\nنیاز به بررسی: '+d.warnings.join('؛ '):'')+
   '\nبا تأیید، فقط فرم مربوط باز و اطلاعات شناسایی‌شده در آن قرار می‌گیرد. برای ثبت نهایی خودتان «ذخیره/ثبت» را بزنید.';
 }
 function response(text){
  const p=parse(text);if(!p){draft=null;return formerHandle(text)}
  draft=p;
  const question=document.getElementById('hvQuestion');if(question)question.value=text;
  const answer=document.getElementById('hvAnswer');if(answer)answer.textContent=report(p);
  const pending=document.getElementById('hvPending');
  if(pending){pending.style.display='block';pending.dataset.action=p.kind}
  return report(p);
 }
 function applyFields(){
  if(!draft)return false;
  const d=draft,kind=d.kind,f=d.fields;
  if(d.errors.length){const answer=document.getElementById('hvAnswer');if(answer)answer.textContent='ابتدا این موارد را روشن کنید: '+d.errors.join('، ');return false}
  draft=null;close();
  if(kind==='customer'){
   custForm();if(f.name)$('#fn').value=f.name;if(f.phone)$('#fp').value=f.phone;if(f.birth)$('#fb').value=f.birth;
  }else if(kind==='product'){
   newProductDlg();if(f.name)$('#a').value=f.name;if(f.unit)$('#u').value=f.unit;
   if(f.qty!=null)$('#q').value=String(f.qty);if(f.price!=null)$('#p').value=String(f.price);if(f.cost!=null)$('#k').value=String(f.cost);
  }else if(kind==='buy'){
   buyForm();if(f.pid)$('#p').value=f.pid;if(f.qty!=null)$('#n').value=String(f.qty);
   if(f.cost!=null)$('#c').value=String(f.cost);if(f.supplier)$('#sp').value=f.supplier;
   if(f.method==='2101'&&!f.supplier)$('#m').value='1101';else $('#m').value=f.method;
  }else if(kind==='sale'){
   tab='sale';if(f.cid)saleCid=String(f.cid);if(f.pid)saleSel=f.pid;
   R.sale();
   if(f.pid&&f.qty!=null&&f.qty>0){$('#sn').value=String(f.qty);$('#add')?.click()}
   if(f.discount!=null){saleD=String(f.discount);$('#sd').value=saleD}
   if(f.paid!=null){saleP=String(f.paid);$('#spd').value=saleP}
   if(f.method==='1102')$('#sm').value='1102';
   nav();
  }else if(kind==='expense'){
   expForm();if(f.amount!=null)$('#b').value=String(f.amount);if(f.description)$('#a').value=f.description;
   if(f.method)$('#m').value=f.method;
  }else if(kind==='reminder'){
   remForm();if(f.title)$('#a').value=f.title;if(f.date)$('#d').value=f.date;if(f.time)$('#tm').value=f.time;
  }
  toast('فرم با اطلاعات گفتار آماده شد؛ لطفاً بررسی و سپس ثبت کنید.');return true;
 }
 const formerHandle=HanaVoice.handle;
 HanaVoice.handle=response;HanaVoice.onResult=response;
 const previous=G.voiceAssistant;
 G.voiceAssistant=function(){
  previous();
  const ask=document.getElementById('hvAsk');if(ask)ask.onclick=()=>response(document.getElementById('hvQuestion').value);
  const q=document.getElementById('hvQuestion');if(q)q.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();response(q.value)}};
  const ok=document.getElementById('hvConfirm');if(ok)ok.onclick=applyFields;
  const ex=document.getElementById('hvExamples');if(ex)ex.onclick=e=>{const b=e.target.closest('[data-example]');if(b)response(b.dataset.example)};
 };
 globalThis.HanaVoiceForms={parse,classify,spokenNumber,numericBeforeUnit,amountAfter,report,respond:response,applyFields,getDraft:()=>draft};
})();