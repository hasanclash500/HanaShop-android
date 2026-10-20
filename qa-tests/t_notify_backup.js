// Offline regression: Jalali -> local time, birthday data, notification sync, JSON backup validation.
const {boot} = require('./harness');
const A = boot('app.js');
const R = s => A.run(s);
R('render=function(){}');
const sleep = n => new Promise(resolve => setTimeout(resolve, n));
let pass = 0, fail = 0;
function ck(label, yes, details) {
  if (yes) pass++; else fail++;
  console.log((yes ? 'PASS ' : 'FAIL ') + label + (yes ? '' : ' ' + String(details || '')));
}
(async () => {
  await sleep(50);
  R('render=function(){};ensureDefaults()');
  ck('valid time 11:00', R("validReminderTime('11:00')") === true);
  ck('time 25:00 rejected', R("validReminderTime('25:00')") === false);
  ck('time 11:60 rejected', R("validReminderTime('11:60')") === false);
  ck('invalid Jalali date rejected', Number.isNaN(R("reminderMillis('1405/13/29','11:00')")));
  ck('Jalali datetime maps to local 11:00', R("new Date(reminderMillis('1405/07/29','11:00')).getHours()") === 11);
  ck('time survives Persian date conversion', R("toJ(new Date(reminderMillis('1405/07/29','11:00'))) ") === '1405/07/29');
  R("db.customers.push({id:'c1',name:'رها',birth:'1378/04/03',archived:false},{id:'c2',name:'آرشیوی',birth:'1368/04/03',archived:true});");
  R("db.reminders.push({id:'r1',title:'تماس با شرکت',date:'1405/07/29',time:'11:00',done:false},{id:'r2',title:'تمام شده',date:'1405/07/29',time:'12:00',done:true});");
  ck('one active birthday only', R('phoneAlertData().birthdays.length') === 1);
  ck('birthday is Persian month/day', R('phoneAlertData().birthdays[0].month===4&&phoneAlertData().birthdays[0].day===3'));
  ck('completed tasks excluded', R('phoneAlertData().reminders.length') <= 1);
  ck('backup validator accepts current database', R('verifyFullBackup(JSON.parse(JSON.stringify(db)))') === '');
  ck('backup validator rejects missing required records', !!R("verifyFullBackup({...JSON.parse(JSON.stringify(db)),journal:null})"));
  ck('backup validator rejects unbalanced journal', !!R("verifyFullBackup({...JSON.parse(JSON.stringify(db)),journal:[{lines:[{a:'1101',d:5}]}]})"));
  R('db.dirty=3;db.lastBackup=0;bkWriter=async()=>{throw Error("not saved")}');
  const no = await R('backup()');
  ck('failed backup returns false', no === false);
  ck('failed backup preserves dirty flag', R('db.dirty') === 3);
  ck('failed backup does not claim lastBackup', R('db.lastBackup') === 0);
  R('bkWriter=async()=>true');
  const yes = await R('backup()');
  ck('successful backup returns true', yes === true);
  ck('successful backup updates date and resets dirty', R('db.lastBackup>0&&db.dirty===0'));
  R('window.AndroidBridge={syncNotifications(json){window.lastPhonePayload=JSON.parse(json)}}');
  const saved = await R("tx(()=>{db.reminders.push({id:'r3',title:'یک یادآور',date:'1405/07/29',time:'11:00',done:false})})");
  ck('successful transaction persisted', saved === true);
  ck('native phone synchronization after save', R('Array.isArray(window.lastPhonePayload.birthdays)&&Array.isArray(window.lastPhonePayload.reminders)'));
  console.log(`NOTIFICATION/BACKUP RESULT pass=${pass} fail=${fail}`);
  process.exit(fail ? 1 : 0);
})().catch(e=>{console.error(e);process.exit(1)});
