// Customer UI integration test with a lightweight synthetic DOM.
const fs=require('fs');
const nodes={};
const node=(name)=>nodes[name]||(nodes[name]={
  name,value:'',textContent:'',innerHTML:'',checked:false,style:{},dataset:{},
  classList:{add(){},remove(){}},
  open:false,showModal(){this.open=true},close(){this.open=false},focus(){},select(){},setSelectionRange(){},
  setAttribute(){},appendChild(){},insertAdjacentHTML(){},addEventListener(){},querySelectorAll(){return []},querySelector(){return null}
});
const btn=(act,id)=>({
  dataset:{act},onclick:null,closest(sel){return sel.includes('data-id')?{dataset:{id}}:null}
});
const acts=['p360','msg','edit'];
const buttons=acts.map(a=>btn(a,'cust1'));
const view=node('#view');
view.querySelectorAll=sel=>sel.includes('button[data-act]')?buttons:[];
view.querySelector=sel=>node(sel);
const doc={
  documentElement:{dataset:{},style:{setProperty(){}}},
  body:{appendChild(){},querySelectorAll(){return []}},
  querySelector:s=>node(s),
  getElementById:id=>nodes['#'+id]||null,
  addEventListener(){},createElement:()=>node('created')
};
global.__DOC=doc;
const {boot}=require('./harness');const A=boot('app.js'),R=s=>A.run(s);
R(fs.readFileSync('customer-actions.js','utf8'));
R("ensureDefaults();db.customers.push({id:'cust1',name:'مشتری آزمایشی',phone:'09120000000',birth:'1370/01/01',promo:false});");
let pass=0,fail=0;
function check(name,x){console.log((x?'PASS ':'FAIL ')+name);x?pass++:fail++}
R('R.cust()');
check('customer actions buttons bound',buttons.every(b=>typeof b.onclick==='function'));
const ev={preventDefault(){},stopPropagation(){}};
buttons[0].onclick(ev);
check('profile opens dialog',nodes['#dlg'].innerHTML.includes('صورت‌حساب')&&nodes['#dlg'].open===true);
nodes['#customerMsgType']=node('#customerMsgType');nodes['#customerMsgType'].value='thanks';
buttons[1].onclick(ev);
check('message dialog opens',nodes['#dlg'].innerHTML.includes('نوع پیام'));
check('template preview generated',nodes['#customerMsgText'].value.includes('مشتری آزمایشی'));
check('all templates available',nodes['#dlg'].innerHTML.includes('تبریک تولد')&&nodes['#dlg'].innerHTML.includes('یادآوری بدهی'));
nodes['#customerMsgType'].value='birthday';
nodes['#customerMsgType'].onchange();
check('message type switching updates body',nodes['#customerMsgText'].value.includes('تولد'));
let opened=[];
A.ctx.AndroidBridge={openSmsDraft:(phone,body)=>opened.push({phone,body})};
nodes['#customerMsgSms'].onclick();
check('SMS opens valid draft only',opened.length===1&&opened[0].phone==='09120000000'&&opened[0].body.includes('تولد'));
check('no automatic sent-message history',R('db.comms.length')===0);
nodes['#customerMsgType'].value='bulk';nodes['#customerMsgType'].onchange();
nodes['#customerMsgSms'].onclick();
check('unsolicited marketing blocked',opened.length===1&&nodes['#customerMsgError'].textContent.includes('تبلیغاتی'));
check('customer record unchanged',R("cust('cust1').phone")==='09120000000');
console.log('CUSTOMER UI TESTS '+pass+' passed, '+fail+' failed');
if(fail)process.exitCode=1;