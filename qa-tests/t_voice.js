// Voice assistant regression: fake data; no audio or customer content sent over network.
const fs=require('fs'),{boot}=require('./harness');
const A=boot('app.js'),R=s=>A.run(s);
R(fs.readFileSync('business.js','utf8'));
R(fs.readFileSync('phase1.js','utf8'));
R(fs.readFileSync('management234.js','utf8'));
R(fs.readFileSync('voice-assistant.js','utf8'));
R('ensureDefaults()');
let pass=0,fail=0;
function check(name,yes){console.log((yes?'PASS ':'FAIL ')+name);yes?pass++:fail++}
const id=R("mkProduct({name:'کرید اونتوس',unit:'گرم',qty:70.375,cost:42000,price:126000,min:5})");
R("db.customers.push({id:'sample-c',name:'رضا اکبری',phone:'09120000000',promo:false})");
let a=R("HanaVoice.handle('از کرید اونتوس چقدر دارم؟')");
check('voice inventory understands Persian phrase',a.includes('۷۰.۳۷۵')&&a.includes('کرید اونتوس'));
a=R("HanaVoice.handle('قیمت فروش کرید اونتوس')");
check('voice product price',a.includes('۱۲۶,۰۰۰'));
a=R("HanaVoice.handle('بدهی مشتری رضا اکبری')");
check('voice customer balance read-only',a.includes('رضا اکبری')&&a.includes('۰ تومان'));
a=R("HanaVoice.handle('فروش امروز')");
check('voice daily sales reporting',a.includes('فروش امروز'));
a=R("HanaVoice.handle('سود امروز')");
check('voice ledger-backed P&L',a.includes('سود ناخالص')&&a.includes('سود خالص'));
const previous=R('db.journal.length');
a=R("HanaVoice.handle('خرید ۵۰ گرم کرید اونتوس')");
check('voice command requires confirmation before action',a.includes('تأیید'));
check('voice action never writes ledger automatically',R('db.journal.length')===previous);
check('voice fallback for unrecognized input',R("HanaVoice.handle('متن ناشناس')").includes('متوجه نشدم'));
console.log('VOICE TESTS '+pass+' passed, '+fail+' failed');
if(fail)process.exitCode=1;