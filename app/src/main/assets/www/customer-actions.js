'use strict';
/* Customer actions: reliable button bindings and editable message templates.
 * No customer messages are sent automatically, and we do not mark a draft as sent. */
(function(){
 const phoneOf=c=>String(c?.phone||'').replace(/[\s()+\-]/g,'').replace(/^0098/,'98');
 const waPhone=c=>{const n=phoneOf(c);return /^09\d{9}$/.test(n)?'98'+n.slice(1):/^989\d{9}$/.test(n)?n:''};
 function msg(id,key){
  ensureDefaults();
  const c=cust(id);if(!c){toast('این مشتری پیدا نشد.');return}
  const last=cSales(id).slice().sort((a,b)=>a.date.localeCompare(b.date)).pop();
  const ex={pd:last?.date||'',pn:last?.desc||(last?.lines?.[0]&&prod(last.lines[0].pid)?.name)||'',no:last?.no,amt:last?T(last.total):''};
  const keys=Object.keys(DEFTPL),initial=keys.includes(key)?key:'thanks';
  const options=keys.map(k=>'<option value="'+esc(k)+'"'+(k===initial?' selected':'')+'>'+esc(DEFTPL[k][0])+'</option>').join('');
  modal('<h3>پیام به '+esc(c.name)+'</h3><div class="k">شماره: '+esc(c.phone||'ثبت نشده')+'</div>'+
   '<label for="customerMsgType">نوع پیام</label><select id="customerMsgType">'+options+'</select>'+
   '<label for="customerMsgText">متن پیام (قابل ویرایش)</label><textarea id="customerMsgText" rows="6"></textarea>'+
   '<div class="card k" id="customerMsgNote">برنامه پیام‌رسان باز می‌شود؛ ارسال نهایی با تأیید شماست.</div>'+
   '<div class="grid"><button class="b" id="customerMsgSms">پیامک</button><button class="b" id="customerMsgWa">واتساپ</button>'+
   '<button class="b s" id="customerMsgTelegram">اشتراک تلگرام</button><button class="b s" id="customerMsgCopy">کپی متن</button></div>'+
   '<div class="err" id="customerMsgError" role="alert"></div><button class="b s" id="customerMsgClose">بستن</button>');
  const kind=$('#customerMsgType'),msgField=$('#customerMsgText'),error=$('#customerMsgError'),note=$('#customerMsgNote');
  const refresh=()=>{msgField.value=fill(db.tpl[kind.value]||DEFTPL[kind.value][1],c,ex);
   error.textContent='';note.textContent=PROMO.includes(kind.value)&&c.promo===false?
    'این مشتری رضایت دریافت پیام تبلیغاتی ندارد؛ نوع دیگری انتخاب کنید.':
    'متن قابل ویرایش است. ارسال نهایی فقط در برنامه پیام‌رسان و با تأیید شما انجام می‌شود.'};
  kind.onchange=refresh;refresh();$('#customerMsgClose').onclick=close;
  const validate=()=>{if(PROMO.includes(kind.value)&&c.promo===false){error.textContent='مشتری دریافت پیام تبلیغاتی را نپذیرفته است.';return false}
   if(!msgField.value.trim()){error.textContent='متن پیام را وارد کنید.';return false}
   return true};
  const openUrl=url=>{try{openExt(url);return true}catch(e){error.textContent='بازکردن برنامه پیام‌رسان ممکن نشد؛ متن را کپی کنید.';return false}};
  $('#customerMsgSms').onclick=()=>{if(!validate())return;
   const n=phoneOf(c);
   if(!(/^(09\d{9}|989\d{9})$/.test(n))){error.textContent='شماره موبایل معتبر نیست؛ ابتدا شماره مشتری را ویرایش کنید.';return}
   if(window.AndroidBridge&&typeof AndroidBridge.openSmsDraft==='function'){
    AndroidBridge.openSmsDraft(n,msgField.value);return
   }
   openUrl('sms:'+encodeURIComponent(n)+'?body='+encodeURIComponent(msgField.value));
  };
  $('#customerMsgWa').onclick=()=>{if(!validate())return;
   const n=waPhone(c);if(!n){error.textContent='برای واتساپ، شماره موبایل صحیح وارد کنید.';return}
   openUrl('https://wa.me/'+n+'?text='+encodeURIComponent(msgField.value));
  };
  $('#customerMsgTelegram').onclick=()=>{if(!validate())return;
   // Telegram share chooser (not a direct link to a phone number).
   openUrl('https://t.me/share/url?url=&text='+encodeURIComponent(msgField.value));
  };
  $('#customerMsgCopy').onclick=async()=>{if(!validate())return;try{
    if(navigator.clipboard&&navigator.clipboard.writeText)await navigator.clipboard.writeText(msgField.value);
    else{msgField.focus();msgField.select();if(!document.execCommand('copy'))throw Error('copy unsupported')}
    toast('متن پیام کپی شد');
   }catch(e){error.textContent='کپی خودکار ممکن نشد؛ متن را نگه دارید و کپی کنید.'}};
 }
 function customerAction(action,id){const c=cust(id);if(!c)return toast('مشتری پیدا نشد.');
  try{
   if(action==='p360')return p360(id);
   if(action==='msg')return msg(id);
   if(action==='edit')return custForm(id);
   if(action==='del')return custDelete(id);
   if(action==='restore')return tx(()=>{cust(id).archived=false}).then(ok=>{if(ok)R.cust()});
  }catch(err){console.warn('customer action',action,err);toast('بازکردن این بخش ممکن نشد: '+err.message)}
 }
 // Render-time handlers prevent nested tap targets and stale delegated handlers.
 const oldCust=R.cust;
 R.cust=function(){oldCust();
   V.querySelectorAll('.card[data-id] button[data-act]').forEach(btn=>{
     btn.onclick=e=>{e.preventDefault();e.stopPropagation();
       const id=btn.closest('.card[data-id]')?.dataset.id;
       if(id)customerAction(btn.dataset.act,id);
     };
   });
 };
 // Reuse this fixed message dialog from customer profiles, reminders and campaigns.
 msgDlg=msg;
 G.customerMessage=msg;
 G.openCustomerRecord=id=>customerAction('p360',id);
 globalThis.HanaCustomerActions={phoneOf,waPhone,msg,customerAction};
})();