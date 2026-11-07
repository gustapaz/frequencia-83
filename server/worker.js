import {api} from './api.js';
import assets from './assets.js';
const types={'/':'text/html','/app.js':'text/javascript','/style.css':'text/css','/mark.svg':'image/svg+xml'};
export default {
 fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path.startsWith('/api/'))return api(request,env.DB);
  if(!['GET','HEAD'].includes(request.method)||!Object.hasOwn(assets,path))return new Response('Página não encontrada.',{status:404});
  return new Response(request.method==='HEAD'?null:assets[path],{headers:{
   'Content-Type':types[path]+'; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
   'Content-Security-Policy':"default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
  }});
 },
};
