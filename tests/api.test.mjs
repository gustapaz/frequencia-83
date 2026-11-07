import test from 'node:test';
import assert from 'node:assert/strict';
import {openDatabase} from '../scripts/local.mjs';
import {api} from '../server/api.js';
const origin='https://example.invalid';
const call=(db,path,body,source=origin)=>api(new Request(origin+'/api/'+path,{method:body?'POST':'GET',
 headers:body?{Origin:source,'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined}),db);
test('preserva ordem, repetição e expiração',async()=>{
 const db=openDatabase();
 try{
  const input={clips:['fim','pulso','fim']};
  const created=await call(db,'mixes',input);
  assert.equal(created.status,201);
  const {id}=await created.json();
  assert.deepEqual((await (await call(db,'mixes/'+id)).json()).clips,input.clips);
  await db.prepare('UPDATE mixes SET expires=? WHERE id=?').bind(Date.now()-1,id).run();
  assert.equal((await call(db,'mixes/'+id)).status,404);
 }finally{db.close();}
});
test('valida catálogo, limite e origem',async()=>{
 const db=openDatabase();
 try{
  assert.equal((await call(db,'mixes',{clips:['inventada']})).status,422);
  assert.equal((await call(db,'mixes',{clips:Array(7).fill('fim')})).status,422);
  assert.equal((await call(db,'mixes',{clips:['fim']},'https://other.invalid')).status,403);
 }finally{db.close();}
});
