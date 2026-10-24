'use strict';
const fs=require('node:fs'), vm=require('node:vm'), crypto=require('node:crypto'), path=require('node:path');
const root=path.join(__dirname,'..');
const assert=require('node:assert/strict');
class MockRange {
 constructor(sheet,r,c,n,k){Object.assign(this,{sheet,r,c,n,k});}
 setValues(rows){rows.forEach((row,i)=>row.forEach((x,j)=>{this.sheet.arr[this.r+i-1] ||= []; this.sheet.arr[this.r+i-1][this.c+j-1]=x}));return this;}
 getDisplayValues(){return Array.from({length:this.n},(_,i)=>Array.from({length:this.k},(_,j)=>String(this.sheet.arr[this.r+i-1]?.[this.c+j-1]??'').replace(/^'/,'')));}
 clearContent(){for(let i=0;i<this.n;i++)for(let j=0;j<this.k;j++)if(this.sheet.arr[this.r+i-1])this.sheet.arr[this.r+i-1][this.c+j-1]='';return this;}
 setFontWeight(){return this}setBackground(){return this}setNumberFormat(){return this}
}
class Sheet {
 constructor(name){this.name=name;this.arr=[];}
 getLastRow(){let n=this.arr.length;while(n>0&&(!this.arr[n-1]||this.arr[n-1].every(v=>v===''||v==null)))n--;return n;}
 getMaxRows(){return 100000;}
 getRange(r,c,n=1,k=1){return new MockRange(this,r,c,n,k)}
 appendRow(v){this.getRange(this.getLastRow()+1,1,1,v.length).setValues([v])}
 deleteRow(row){this.arr.splice(row-1,1)}
 setFrozenRows(){} autoResizeColumns(){}
}
class Spreadsheet {
 constructor(){this.tabs={}}getId(){return 'test-id'}getUrl(){return 'https://example.invalid/test'}
 getSheetByName(name){return this.tabs[name]||null}
 insertSheet(name){return this.tabs[name]=new Sheet(name)}
}
const ss=new Spreadsheet(),props={},cache=new Map(),pin='987654321',pepper=crypto.randomBytes(32).toString('hex');
const hexDigest=crypto.createHmac('sha256',pepper).update(pin).digest('hex');
const sb={console,Date,Math,Number,String,Object,Array,Set,Error,JSON,RegExp,
 Utilities:{getUuid:()=>crypto.randomUUID(),computeHmacSha256Signature:(candidate,key)=>[...crypto.createHmac('sha256',key).update(candidate).digest()]},
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]||null,setProperty:(k,v)=>{props[k]=v},deleteProperty:(k)=>{delete props[k]}})},
 CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v)})},
 SpreadsheetApp:{getActiveSpreadsheet:()=>ss,openById:id=>{if(id!=='test-id')throw Error('invalid Sheet');return ss},flush:()=>{}},
 LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},Logger:{log:()=>{}},
 HtmlService:{createTemplateFromFile:()=>({evaluate:()=>({setTitle(){return this},addMetaTag(){return this}})})},
 PRIVATE_PIN_PEPPER:pepper,PRIVATE_PIN_DIGEST:hexDigest
};
vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(root,'apps-script','Code.gs'),'utf8'),sb);
assert.equal(sb.setupDatabase(),'Setup completed.');
assert.throws(()=>sb.getAppData(),/Session expired/);
assert.throws(()=>sb.getAppData('random'),/Session expired/);
assert.throws(()=>sb.verifyPin('000000'),/Incorrect PIN/);
const token=sb.verifyPin(pin).token;
assert.equal(sb.getAppData(token).entries.length,0);
assert.equal(sb.getAppData(token).categories.length,19);
const category=sb.getAppData(token).categories.find(x=>x.name==='Milk');
assert.throws(()=>sb.saveEntry(null,{date:'2026-10-24',categoryId:category.id,amount:40}),/Session expired/);
let d=sb.saveEntry(token,{date:'2026-10-24',categoryId:category.id,amount:40,note:'Test'});
assert.equal(d.entries.length,1);
const id=d.entries[0].id;
d=sb.saveEntry(token,{id,date:'2026-10-24',categoryId:category.id,amount:45,note:'Edited'});
assert.equal(d.entries[0].amount,45);
d=sb.savePlan(token,'2027-01',{income:71234,budget:15000});
assert.equal(d.plans['2027-01'].income,71234);
d=sb.addCategory(token,'Home Repair','expense');
assert(d.categories.some(c=>c.name==='Home Repair'));
d=sb.deleteEntry(token,id);
assert.equal(d.entries.length,0);
// Any redeploy with a new PIN digest automatically makes old sessions invalid.
sb.PRIVATE_PIN_DIGEST='changed';
assert.throws(()=>sb.getAppData(token),/Session expired/);
sb.PRIVATE_PIN_DIGEST=hexDigest;
for(let i=1;i<=5;i++)assert.throws(()=>sb.verifyPin('000000'),i===5?/Too many incorrect/:/Incorrect PIN/);
assert.throws(()=>sb.verifyPin(pin),/Too many incorrect/);
console.log('PASS: PIN lock, failed-attempt throttle, session rotation, CRUD, January 2027 monthly plan, no anonymous data access.');
