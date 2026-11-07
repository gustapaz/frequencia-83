import {z} from 'zod';
export const clips=[
 {id:'pulso',name:'Pulso da cidade',tag:'ABERTURA',notes:[48,55,60,63,60,55,48,60],beat:.21,wave:'triangle'},
 {id:'orbita',name:'Órbita baixa',tag:'TRANSIÇÃO',notes:[72,69,64,60,64,67],beat:.24,wave:'sine'},
 {id:'neon',name:'Neon no cais',tag:'IDENTIFICAÇÃO',notes:[45,45,57,52,55,57,60,57],beat:.18,wave:'square'},
 {id:'fim',name:'Última luz',tag:'ENCERRAMENTO',notes:[67,64,62,60,55,48],beat:.32,wave:'triangle'},
];
const schema=z.object({clips:z.array(z.enum(clips.map(clip=>clip.id))).min(1).max(6)});
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function input(request){
 const reader=request.body?.getReader();
 if(!reader)return null;
 let size=0,text='';
 const decoder=new TextDecoder();
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done)return JSON.parse(text+decoder.decode());
   size+=value.byteLength;
   if(size>1024){await reader.cancel();return null;}
   text+=decoder.decode(value,{stream:true});
  }
 }catch{return null;}
}
export async function api(request,db){
 const url=new URL(request.url),now=Date.now();
 if(url.pathname==='/api/clips'&&request.method==='GET')return json({clips});
 try{
  const match=url.pathname.match(/^\/api\/mixes\/([a-f0-9-]{36})$/);
  if(match&&request.method==='GET'){
   const row=await db.prepare('SELECT clips,expires FROM mixes WHERE id=? AND expires>?').bind(match[1],now).first();
   return row?json({id:match[1],clips:JSON.parse(row.clips),expires:row.expires}):json({error:'Sequência inexistente ou expirada.'},404);
  }
  if(url.pathname!=='/api/mixes'||request.method!=='POST')return json({error:'Rota inexistente.'},404);
  if(request.headers.get('Origin')!==url.origin||request.headers.get('Content-Type')?.split(';')[0]!=='application/json')return json({error:'Origem ou formato inválido.'},403);
  const result=schema.safeParse(await input(request));
  if(!result.success)return json({error:'Escolha de uma a seis vinhetas do catálogo.'},422);
  const id=crypto.randomUUID(),expires=now+604800000;
  await db.prepare('DELETE FROM mixes WHERE id IN (SELECT id FROM mixes WHERE expires<=? ORDER BY expires LIMIT 24)').bind(now).run();
  const write=await db.prepare('INSERT INTO mixes(id,clips,expires) SELECT ?,?,? WHERE (SELECT count(*) FROM mixes)<2000').bind(id,JSON.stringify(result.data.clips),expires).run();
  return write.meta.changes===1?json({id,clips:result.data.clips,expires},201):json({error:'Arquivo de sequências cheio.'},429);
 }catch{return json({error:'Cabine temporariamente indisponível.'},503);}
}
