import {html,render} from 'lit';

const root=document.querySelector('#app');
let library=[], queue=[], active=null, audio, output, timer, playing=false, run=0;
let saving=false, notice='', link='', loading=true;
const clip=id=>library.find(item=>item.id===id);
const duration=item=>item.notes.length*item.beat;
async function request(path,body){
 const response=await fetch('/api/'+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(8000)});
 const result=await response.json();
 if(!response.ok)throw new Error(result.error??'A cabine não respondeu.');
 return result;
}
function stop(){
 run++;
 clearTimeout(timer);
 if(output){output.disconnect();output=null;}
 active=null;playing=false;draw();
}
async function play(ids){
 stop();
 if(!ids.length)return;
 const ticket=run;
 playing=true;notice='';draw();
 try{
  audio??=new AudioContext();
  await audio.resume();
  if(run!==ticket)return;
  output=audio.createGain();output.gain.value=.25;output.connect(audio.destination);
  const next=index=>{
   if(run!==ticket)return;
   if(index===ids.length){stop();return;}
   const item=clip(ids[index]);
   active=item.id;draw();
   const base=audio.currentTime+.02;
   item.notes.forEach((note,i)=>{
    const oscillator=audio.createOscillator(), gain=audio.createGain();
    const at=base+i*item.beat;
    oscillator.type=item.wave;
    oscillator.frequency.value=440*2**((note-69)/12);
    gain.gain.setValueAtTime(.001,at);
    gain.gain.exponentialRampToValueAtTime(.24,at+.025);
    gain.gain.exponentialRampToValueAtTime(.001,at+item.beat*.93);
    oscillator.connect(gain);gain.connect(output);
    oscillator.start(at);oscillator.stop(at+item.beat);
   });
   timer=setTimeout(()=>next(index+1),duration(item)*1000+100);
  };
  next(0);
 }catch{if(run===ticket){stop();notice='Este navegador não conseguiu reproduzir o áudio.';draw();}}
}
function update(items){
 if(saving)return;
 queue=items;link='';notice='';draw();
}
function move(index,step){
 const next=[...queue];
 [next[index],next[index+step]]=[next[index+step],next[index]];
 update(next);
}
function share(id){
 const url=new URL(location.pathname,location.origin);
 url.searchParams.set('mix',id);
 link=url.href;
}
async function save(){
 if(saving||!queue.length)return;
 saving=true;notice='';draw();
 try{
  const result=await request('mixes',{clips:queue});
  share(result.id);notice='Sequência salva por sete dias.';
 }catch(error){notice=error.message;}
 finally{saving=false;draw();}
}
function draw(){
 render(html`
 <a class="skip" href="#library">Ir para as vinhetas</a>
 <header><a href="/" class="brand"><img src="/mark.svg" width="33" height="33" alt=""> FREQ<span>83</span></a><p>CABINE DE RÁDIO / DEMO</p><a href="#queue">Ir para a sequência</a></header>
 <main>
 <section class="transmission" aria-labelledby="title">
 <div class="broadcast"><p class="label"><i></i> ESTAÇÃO INDEPENDENTE / CANAL 01</p><h1 id="title">Frequência <em>83</em></h1><p>Escolha as vinhetas e monte a abertura da sua transmissão.</p></div>
 <div class="scope ${playing?'live':''}" aria-hidden="true"><svg viewBox="0 0 600 110" preserveAspectRatio="none"><path d="M0 55h40l14-14 14 30 15-55 15 78 15-41 15 9 15-19 15 32 15-56 15 65 15-26 15 3 15-32 15 49 15-68 15 83 15-50 15 15 15-34 15 49 15-58 15 74 15-47 15 10 15-24 15 37 15-64 15 76 15-39 15 10 15-20 15 31 15-45 15 45 15-21h50"/></svg></div>
 <div class="monitor"><p class="label">MONITOR DE ÁUDIO</p><p role="status">${active?'No ar: '+clip(active).name:playing?'Preparando áudio…':'Pronto para ouvir'}</p><button ?disabled=${!playing} @click=${stop}>Parar</button></div>
 </section>
 <div class="console">
 <section id="library" aria-labelledby="library-title"><p class="label">A / BANCO DE SOM</p><h2 id="library-title">Vinhetas</h2>
 ${loading?html`<p role="status">Carregando vinhetas…</p>`:null}
 ${library.map((item,index)=>html`<article class="clip"><span class="index">0${index+1}</span><div><p class="label">${item.tag}</p><h3>${item.name}</h3><small>${duration(item).toFixed(1).replace('.',',')} s</small></div><div class="controls"><button aria-label=${'Ouvir '+item.name} @click=${()=>play([item.id])}>Ouvir</button><button aria-label=${'Adicionar '+item.name} ?disabled=${saving||queue.length>=6} @click=${()=>update([...queue,item.id])}>Adicionar</button></div></article>`)}
 </section>
 <section id="queue" aria-labelledby="queue-title"><p class="label">B / ORDEM DE TRANSMISSÃO</p><h2 id="queue-title">Sua sequência</h2><p>${queue.length} / 6 vinhetas · ${queue.reduce((sum,id)=>sum+duration(clip(id)),0).toFixed(1).replace('.',',')} s de áudio</p>
 ${queue.length?html`<ol class="sequence">${queue.map((id,index)=>html`<li><strong>${clip(id).name}</strong><div class="controls"><button aria-label=${'Subir posição '+(index+1)} ?disabled=${saving||index===0} @click=${()=>move(index,-1)}>↑</button><button aria-label=${'Descer posição '+(index+1)} ?disabled=${saving||index===queue.length-1} @click=${()=>move(index,1)}>↓</button><button aria-label=${'Remover posição '+(index+1)} ?disabled=${saving} @click=${()=>update(queue.filter((_,i)=>i!==index))}>Remover</button></div></li>`)}</ol>`:html`<p class="empty">Adicione a primeira vinheta pelo banco de som.</p>`}
 <div class="controls"><button class="primary" ?disabled=${!queue.length||playing} @click=${()=>play([...queue])}>Tocar sequência</button><button ?disabled=${!queue.length||saving} @click=${save}>Salvar sequência</button></div>
 <p id="notice" role="status">${notice}</p>${link?html`<a class="share" href=${link}>Abrir link compartilhável</a>`:null}
 </section></div>
 </main><footer><span>FREQUÊNCIA 83 / ESTUDO FULL-STACK</span><span>Vinhetas originais sintetizadas no navegador.</span></footer>`,root);
}
draw();
try{
 ({clips:library}=await request('clips'));
 const mix=new URLSearchParams(location.search).get('mix');
 if(mix){
  if(!/^[a-f0-9-]{36}$/.test(mix))throw new Error('Link inválido.');
  const result=await request('mixes/'+mix);
  queue=result.clips;share(result.id);notice='Sequência recuperada.';
 }
}catch(error){notice=error.message;}
finally{loading=false;draw();}
