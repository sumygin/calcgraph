'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const FONT='"IBM Plex Sans",system-ui,sans-serif';
const C={};
function readColors(){const cs=getComputedStyle(document.documentElement);
  for(const k of ['bg','panel','ink','mute','line','grid','c1','c2','c3','c4','c5','good','bad'])C[k]=cs.getPropertyValue('--'+k).trim();}
const _cc=document.createElement('canvas').getContext('2d');
function rgb(col){_cc.fillStyle='#000';_cc.fillStyle=col;const h=_cc.fillStyle;return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16));}
function mix(a,b,t){return [0,1,2].map(i=>Math.round(a[i]+(b[i]-a[i])*t));}
function alpha(col,a){const c=rgb(col);return `rgba(${c[0]},${c[1]},${c[2]},${a})`;}
function fmt(x,d=4){if(x===undefined||x===null||Number.isNaN(x))return '—';if(!isFinite(x))return x>0?'∞':'−∞';
  const a=Math.abs(x);const s=(a!==0&&(a>=1e7||a<Math.pow(10,-d)))?x.toExponential(2):String(+x.toFixed(d));return s.replace(/-/g,'−');}
function nice(r,n){const raw=r/n,p=Math.pow(10,Math.floor(Math.log10(raw))),m=raw/p;return (m<1.5?1:m<3.5?2:m<7.5?5:10)*p;}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const range=(n,f)=>Array.from({length:n},(_,i)=>f(i));

class Plot{
  constructor(cv){this.cv=cv;this.x0=0;this.x1=1;this.y0=0;this.y1=1;this.L=38;this.R=10;this.T=10;this.B=24;this.w=300;this.h=200;}
  raw(){const cv=this.cv,dpr=window.devicePixelRatio||1,w=cv.clientWidth||300,h=cv.clientHeight||200;
    const g=this.g=cv.getContext('2d');if(this.clipped){g.restore();this.clipped=false;}
    if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}
    g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);this.w=w;this.h=h;g.font='12px '+FONT;g.lineJoin='round';g.lineCap='round';g.setLineDash([]);return g;}
  begin(x,y,o={}){this.raw();this.x0=x[0];this.x1=x[1];this.y0=y[0];this.y1=y[1];this.L=o.L??38;this.B=o.B??24;this.R=10;this.T=10;return this;}
  sq(cx,y){this.raw();this.L=this.R=this.T=this.B=0;this.y0=y[0];this.y1=y[1];const hw=(y[1]-y[0])*this.w/this.h/2;this.x0=cx-hw;this.x1=cx+hw;return this;}
  X(x){return this.L+(x-this.x0)/(this.x1-this.x0)*(this.w-this.L-this.R);}
  Y(y){return this.h-this.B-(y-this.y0)/(this.y1-this.y0)*(this.h-this.T-this.B);}
  iX(p){return this.x0+(p-this.L)/(this.w-this.L-this.R)*(this.x1-this.x0);}
  iY(p){return this.y0+(this.h-this.B-p)/(this.h-this.T-this.B)*(this.y1-this.y0);}
  axes(o={}){const g=this.g,{L,R,T,B,w,h}=this,pw=w-L-R,ph=h-T-B;g.lineWidth=1;g.textBaseline='middle';g.font='11px '+FONT;
    const tk=(v,s)=>{const d=Math.max(0,-Math.floor(Math.log10(s)+1e-9));let t=(+v.toFixed(d)).toString();if(t==='-0')t='0';return t.replace('-','−');};
    const sx=nice(this.x1-this.x0,Math.max(3,pw/75)),sy=nice(this.y1-this.y0,Math.max(3,ph/42));
    for(let x=Math.ceil(this.x0/sx-1e-9)*sx;x<=this.x1+1e-9;x+=sx){const px=this.X(x);g.strokeStyle=C.grid;g.beginPath();g.moveTo(px,T);g.lineTo(px,h-B);g.stroke();
      if(!o.nox){g.fillStyle=C.mute;g.textAlign='center';g.fillText(tk(x,sx),px,h-B+11);}}
    for(let y=Math.ceil(this.y0/sy-1e-9)*sy;y<=this.y1+1e-9;y+=sy){const py=this.Y(y);g.strokeStyle=C.grid;g.beginPath();g.moveTo(L,py);g.lineTo(w-R,py);g.stroke();
      if(!o.noy){g.fillStyle=C.mute;g.textAlign='right';g.fillText(tk(y,sy),L-5,py);}}
    g.strokeStyle=C.mute;g.globalAlpha=.7;
    if(this.y0<0&&this.y1>0){g.beginPath();g.moveTo(L,this.Y(0));g.lineTo(w-R,this.Y(0));g.stroke();}
    if(this.x0<0&&this.x1>0){g.beginPath();g.moveTo(this.X(0),T);g.lineTo(this.X(0),h-B);g.stroke();}
    g.globalAlpha=1;g.strokeStyle=C.line;g.strokeRect(L+.5,T+.5,pw-1,ph-1);g.fillStyle=C.mute;
    if(o.xl){g.textAlign='right';g.fillText(o.xl,w-R-5,h-B-9);}
    if(o.yl){g.textAlign='left';g.fillText(o.yl,L+6,T+10);}
    g.save();g.beginPath();g.rect(L,T,pw,ph);g.clip();this.clipped=true;return this;}
  fn(f,col,lw=2,dash,br){const g=this.g;g.strokeStyle=col||C.c1;g.lineWidth=lw;g.setLineDash(dash||[]);g.beginPath();let pen=false,py0=0,xp=this.x0;
    const n=Math.round((this.w-this.L-this.R)*1.5);
    for(let i=0;i<=n;i++){const x=this.x0+(this.x1-this.x0)*i/n,y=f(x);
      if(br&&br.some(b=>xp<b&&x>=b))pen=false;xp=x;
      if(!isFinite(y)){pen=false;continue;}
      const py=this.Y(y);if(pen&&Math.abs(py-py0)>this.h*2.5)pen=false;
      const cy=clamp(py,-5e3,5e3);if(pen)g.lineTo(this.X(x),cy);else{g.moveTo(this.X(x),cy);pen=true;}py0=py;}
    g.stroke();g.setLineDash([]);return this;}
  seg(x1,y1,x2,y2,col,lw=1.5,dash){const g=this.g;g.strokeStyle=col||C.ink;g.lineWidth=lw;g.setLineDash(dash||[]);g.beginPath();g.moveTo(this.X(x1),this.Y(y1));g.lineTo(this.X(x2),this.Y(y2));g.stroke();g.setLineDash([]);return this;}
  hl(y,col,lw=1.5,dash){return this.seg(this.x0,y,this.x1,y,col,lw,dash);}
  vl(x,col,lw=1.5,dash){return this.seg(x,this.y0,x,this.y1,col,lw,dash);}
  dot(x,y,col,r=3.5,hollow){const g=this.g;g.beginPath();g.arc(this.X(x),this.Y(y),r,0,7);if(hollow){g.fillStyle=C.panel;g.fill();g.strokeStyle=col||C.c1;g.lineWidth=1.6;g.stroke();}else{g.fillStyle=col||C.c1;g.fill();}return this;}
  pts(a,col,r=3,stem){for(const p of a){if(!isFinite(p[1]))continue;if(stem)this.seg(p[0],0,p[0],p[1],alpha(col||C.c1,.35),1);this.dot(p[0],p[1],col,r);}return this;}
  path(a,col,lw=1.5,dash){const g=this.g;g.strokeStyle=col||C.c1;g.lineWidth=lw;g.setLineDash(dash||[]);g.beginPath();a.forEach((p,i)=>i?g.lineTo(this.X(p[0]),this.Y(p[1])):g.moveTo(this.X(p[0]),this.Y(p[1])));g.stroke();g.setLineDash([]);return this;}
  box(x1,y1,x2,y2,fill,stroke,lw=1){const g=this.g,a=this.X(x1),b=this.Y(y1),c=this.X(x2)-a,d=this.Y(y2)-b;if(fill){g.fillStyle=fill;g.fillRect(a,b,c,d);}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.strokeRect(a,b,c,d);}return this;}
  poly(a,fill,stroke,lw=1.5){const g=this.g;g.beginPath();a.forEach((p,i)=>i?g.lineTo(this.X(p[0]),this.Y(p[1])):g.moveTo(this.X(p[0]),this.Y(p[1])));g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}return this;}
  area(f,a,b,fill){const n=120,p=[[a,0]];for(let i=0;i<=n;i++){const x=a+(b-a)*i/n;p.push([x,f(x)]);}p.push([b,0]);return this.poly(p,fill);}
  circ(x,y,rx,fill,stroke,lw=1.5,dash){const g=this.g;g.beginPath();g.ellipse(this.X(x),this.Y(y),Math.abs(this.X(x+rx)-this.X(x)),Math.abs(this.Y(y+rx)-this.Y(y)),0,0,7);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.setLineDash(dash||[]);g.stroke();g.setLineDash([]);}return this;}
  arrow(x1,y1,x2,y2,col,lw=2){const g=this.g,a=this.X(x1),b=this.Y(y1),c=this.X(x2),d=this.Y(y2),t=Math.atan2(d-b,c-a);g.strokeStyle=g.fillStyle=col||C.ink;g.lineWidth=lw;g.beginPath();g.moveTo(a,b);g.lineTo(c,d);g.stroke();
    g.beginPath();g.moveTo(c,d);g.lineTo(c-9*Math.cos(t-.4),d-9*Math.sin(t-.4));g.lineTo(c-9*Math.cos(t+.4),d-9*Math.sin(t+.4));g.closePath();g.fill();return this;}
  txt(s,x,y,col,al='left',dx=0,dy=0,bold){const g=this.g;g.fillStyle=col||C.ink;g.textAlign=al;g.textBaseline='middle';g.font=(bold?'600 ':'')+'12px '+FONT;g.fillText(s,this.X(x)+dx,this.Y(y)+dy);return this;}
  px(s,x,y,col,al='left',bold){const g=this.g;g.fillStyle=col||C.ink;g.textAlign=al;g.textBaseline='middle';g.font=(bold?'600 ':'')+'12px '+FONT;g.fillText(s,x,y);return this;}
  legend(items){const g=this.g;let y=this.T+13;g.font='12px '+FONT;
    const SW=14,GAP=8,PAD=6,wmax=Math.max(...items.map(([s])=>g.measureText(s).width)),bw=PAD+SW+GAP+wmax+PAD;
    const x0=Math.max(this.L+2,this.w-this.R-6-bw);
    for(const [s,col] of items){g.fillStyle=alpha(C.panel,.82);g.fillRect(x0,y-8,bw,16);
      g.fillStyle=col;g.fillRect(x0+PAD,y-2,SW,4);this.px(s,x0+PAD+SW+GAP,y,C.ink);y+=16;}return this;}
  onDrag(cb){const cv=this.cv;let dn=false;const h=e=>{const r=cv.getBoundingClientRect();cb(this.iX(e.clientX-r.left),this.iY(e.clientY-r.top),e);};
    cv.style.touchAction='none';cv.style.cursor='crosshair';
    cv.addEventListener('pointerdown',e=>{dn=true;try{cv.setPointerCapture(e.pointerId);}catch(_){ }h(e);});
    cv.addEventListener('pointermove',e=>{if(dn)h(e);});
    const up=()=>{dn=false;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);}
}
/* banded heat map with level curves; call after axes() */
function heat(P,f,za,zb,nl=14){const g=P.g,pw=Math.max(2,Math.round(P.w-P.L-P.R)),ph=Math.max(2,Math.round(P.h-P.T-P.B));
  const oc=heat.c||(heat.c=document.createElement('canvas'));oc.width=pw;oc.height=ph;const og=oc.getContext('2d'),im=og.createImageData(pw,ph),d=im.data;
  const lo=rgb(C.c1),hi=rgb(C.c2),bg=rgb(C.panel),ln=rgb(C.ink),pal=[],pe=[];
  for(let k=0;k<nl;k++){const c=mix(bg,mix(lo,hi,k/(nl-1)),.5);pal.push(c);pe.push(mix(c,ln,.4));}
  const K=new Int16Array(pw*ph);
  for(let j=0;j<ph;j++){const y=P.iY(P.T+j+.5);for(let i=0;i<pw;i++){const x=P.iX(P.L+i+.5);let t=(f(x,y)-za)/(zb-za);t=t<0?0:t>1?1:t;if(!(t>=0))t=0;
    const k=Math.min(nl-1,Math.floor(t*nl));K[j*pw+i]=k;const e=(i>0&&K[j*pw+i-1]!==k)||(j>0&&K[(j-1)*pw+i]!==k);const c=e?pe[k]:pal[k],q=(j*pw+i)*4;d[q]=c[0];d[q+1]=c[1];d[q+2]=c[2];d[q+3]=255;}}
  og.putImageData(im,0,0);g.drawImage(oc,P.L,P.T,P.w-P.L-P.R,P.h-P.T-P.B);}
/* rotatable surface z=f(x,y) */
function surface(P,f,o){const g=P.raw(),w=P.w,h=P.h,n=o.n||26,[xa,xb]=o.x,[ya,yb]=o.y,[za,zb]=o.z;
  const cy=Math.cos(o.yaw),sy=Math.sin(o.yaw),cp=Math.cos(o.pitch),sp=Math.sin(o.pitch),S=Math.min(w,h*1.25)*.33;
  const pr=(x,y,z)=>{const u=(x-xa)/(xb-xa)*2-1,v=(y-ya)/(yb-ya)*2-1,t=((clamp(z,za,zb)-za)/(zb-za)*2-1)*.72,X=u*cy-v*sy,Yd=u*sy+v*cy;return [w/2+X*S,h/2-(Yd*sp+t*cp)*S,Yd*cp-t*sp];};
  const lo=rgb(C.c1),hi=rgb(C.c2),q=[];
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x0=xa+(xb-xa)*i/n,x1=xa+(xb-xa)*(i+1)/n,y0=ya+(yb-ya)*j/n,y1=ya+(yb-ya)*(j+1)/n;
    const zs=[f(x0,y0),f(x1,y0),f(x1,y1),f(x0,y1)].map(v=>isFinite(v)?v:0),p=[pr(x0,y0,zs[0]),pr(x1,y0,zs[1]),pr(x1,y1,zs[2]),pr(x0,y1,zs[3])];
    q.push([(p[0][2]+p[1][2]+p[2][2]+p[3][2])/4,p,(zs[0]+zs[1]+zs[2]+zs[3])/4]);}
  {const B=[pr(xa,ya,za),pr(xb,ya,za),pr(xb,yb,za),pr(xa,yb,za)];g.strokeStyle=C.line;g.lineWidth=1;g.beginPath();B.forEach((p,k)=>k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.stroke();P.px('x',(B[0][0]+B[1][0])/2,(B[0][1]+B[1][1])/2+12,C.mute,'center');P.px('y',(B[1][0]+B[2][0])/2+10,(B[1][1]+B[2][1])/2,C.mute);}
  q.sort((a,b)=>b[0]-a[0]);g.lineWidth=.6;
  for(const [,p,z] of q){const c=mix(lo,hi,clamp((z-za)/(zb-za),0,1));g.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},.82)`;g.strokeStyle=alpha(C.panel,.55);g.beginPath();g.moveTo(p[0][0],p[0][1]);for(let k=1;k<4;k++)g.lineTo(p[k][0],p[k][1]);g.closePath();g.fill();g.stroke();}
  if(o.pt){const [x,y]=o.pt,m=40;for(const [ff,col] of [[t=>[xa+(xb-xa)*t,y],C.c3],[t=>[x,ya+(yb-ya)*t],C.c4]]){g.strokeStyle=col;g.lineWidth=2.2;g.beginPath();for(let k=0;k<=m;k++){const [a,b]=ff(k/m),p=pr(a,b,f(a,b));k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);}g.stroke();}
    const p=pr(x,y,f(x,y));g.fillStyle=C.ink;g.beginPath();g.arc(p[0],p[1],5,0,7);g.fill();g.strokeStyle=C.panel;g.lineWidth=1.5;g.stroke();}
  if(o.path){g.strokeStyle=C.ink;g.lineWidth=2;g.beginPath();o.path.forEach((a,k)=>{const p=pr(a[0],a[1],f(a[0],a[1]));k?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]);});g.stroke();}
  P.px('drag to rotate',10,h-12,C.mute);}
function rotatable(P,s,redraw){const cv=P.cv;let dn=null;cv.style.touchAction='none';cv.style.cursor='grab';
  cv.addEventListener('pointerdown',e=>{dn=[e.clientX,e.clientY];try{cv.setPointerCapture(e.pointerId);}catch(_){ }});
  cv.addEventListener('pointermove',e=>{if(!dn)return;s.yaw+=(e.clientX-dn[0])*.01;s.pitch=clamp(s.pitch+(e.clientY-dn[1])*.008,.05,1.5);dn=[e.clientX,e.clientY];redraw();});
  const up=()=>{dn=null;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);}

/* ---- lab framework ---- */
const LABS={};
function lab(id,spec){LABS[id]=spec;}
function mountLab(fig){const spec=LABS[fig.dataset.lab];if(!spec){console.error('missing lab',fig.dataset.lab);return;}
  const body=document.createElement('div');const note=$('.note',fig);note?fig.insertBefore(body,note):fig.appendChild(body);
  const cw=document.createElement('div');cw.className='cvs';body.appendChild(cw);const P=[],s={};
  (spec.cv||[280]).forEach(h=>{const c=document.createElement('canvas');c.style.height=h+'px';cw.appendChild(c);P.push(new Plot(c));});
  const ctl=document.createElement('div');ctl.className='ctl';body.appendChild(ctl);
  const out=document.createElement('div');out.className='out';body.appendChild(out);const els=[];
  const redraw=()=>{if(!fig.isConnected||!cw.offsetParent)return;els.forEach(([c,el])=>{if(c.w)el.hidden=!c.w(s);});
    try{let htm='';spec.draw(s,P,h=>{htm=h;});out.innerHTML=htm;out.hidden=!htm;}catch(e){console.error('lab '+fig.dataset.lab,e);out.innerHTML='<span class="no">Could not draw this lab: '+e.message+'</span>';out.hidden=false;}};
  (spec.ctl||[]).forEach((c,i)=>{const id='c-'+fig.dataset.lab+'-'+i;let el;
    if(c.t==='s'){s[c.k]=c.v??c.o[0][0];el=document.createElement('label');el.innerHTML=`${c.l}<select id="${id}">${c.o.map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select>`;const x=$('select',el);x.value=s[c.k];x.onchange=()=>{s[c.k]=x.value;c.on&&c.on(s,sync);redraw();};}
    else if(c.t==='r'){s[c.k]=c.v;el=document.createElement('label');const f=c.f||(v=>fmt(v,3));el.innerHTML=`<span>${c.l}${f(c.v)===''?'<b hidden></b>':' = <b></b>'}</span><input type="range" id="${id}" min="${c.a}" max="${c.b}" step="${c.s}" value="${c.v}">`;const x=$('input',el),b=$('b',el);b.textContent=f(c.v);x.oninput=()=>{s[c.k]=+x.value;b.textContent=f(s[c.k]);redraw();};el._sync=()=>{x.value=s[c.k];b.textContent=f(s[c.k]);};}
    else if(c.t==='c'){s[c.k]=!!c.v;el=document.createElement('label');el.className='ck';el.innerHTML=`<input type="checkbox" id="${id}"${c.v?' checked':''}>${c.l}`;const x=$('input',el);x.onchange=()=>{s[c.k]=x.checked;redraw();};}
    else{el=document.createElement('button');el.type='button';el.id=id;el.textContent=c.l;el.onclick=()=>{c.on(s,redraw,sync);sync();redraw();};}
    ctl.appendChild(el);els.push([c,el]);});
  function sync(){els.forEach(([c,el])=>el._sync&&el._sync());}
  if(!(spec.ctl||[]).length)ctl.hidden=true;
  spec.init&&spec.init(s,P,redraw,sync);fig._redraw=redraw;redraw();}
function play(s,k,to,step,redraw,sync,ms=60){if(s._t){clearInterval(s._t);s._t=0;return;}if(s[k]>=to)s[k]=0;s._t=setInterval(()=>{s[k]=Math.min(to,+(s[k]+step).toFixed(6));sync();redraw();if(s[k]>=to){clearInterval(s._t);s._t=0;}},ms);}

/* ---- router ---- */
function showRoute(){let id=(location.hash||'#home').slice(1);let sec=document.getElementById('ch-'+id);if(!sec){id='home';sec=document.getElementById('ch-home');}
  $$('.ch').forEach(x=>{x.hidden=x!==sec;});$$('.rail a.n').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+id));
  const on=$('.rail a.n.on');if(on&&on.scrollIntoView&&window.innerWidth<=820)on.scrollIntoView({inline:'center',block:'nearest'});
  if(!sec._done){sec._done=1;
    if(window.renderMathInElement)try{renderMathInElement(sec,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false,ignoredTags:['script','style','textarea','pre','code','canvas','select','option']});}catch(e){console.error(e);}
    const hs=$$('h3',sec);if(hs.length>2){const t=document.createElement('ul');t.className='toc';hs.forEach(h=>{const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.textContent=h.firstChild.textContent.trim();b.onclick=()=>h.scrollIntoView({block:'start'});li.appendChild(b);t.appendChild(li);});const hd=$('header',sec);hd&&hd.after(t);}
    const all=$$('.ch'),i=all.indexOf(sec),pg=document.createElement('nav');pg.className='pager';const lk=(s,pre)=>s?`<a href="#${s.id.slice(3)}">${pre}${s.dataset.t}</a>`:'<span></span>';
    pg.innerHTML=lk(all[i-1],'← ')+lk(all[i+1],'Next: ');sec.appendChild(pg);
    $$('.lab',sec).forEach(mountLab);
  }else $$('.lab',sec).forEach(f=>f._redraw&&f._redraw());
  window.scrollTo(0,0);}
function redrawAll(){readColors();const sec=$('.ch:not([hidden])');sec&&$$('.lab',sec).forEach(f=>f._redraw&&f._redraw());}
function boot(){readColors();showRoute();window.addEventListener('hashchange',showRoute);
  let rt;window.addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(redrawAll,120);});
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',redrawAll);
  new MutationObserver(redrawAll).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(redrawAll);}

/* ===== Chapter 2 ===== */
lab('dq',{cv:[280],ctl:[{t:'r',k:'t',l:'t',a:-1.5,b:2,s:.05,v:1},{t:'r',k:'h',l:'Δt',a:.01,b:1.5,s:.01,v:1}],
draw(s,[P],out){const f=x=>x*x,m=2*s.t+s.h;P.begin([-2.5,3.5],[-1,9]).axes({xl:'t',yl:'f(t) = t²'});P.fn(f,C.c1,2.5);
  P.fn(x=>f(s.t)+2*s.t*(x-s.t),C.c4,1.5,[5,4]);P.fn(x=>f(s.t)+m*(x-s.t),C.c2,2);P.dot(s.t,f(s.t),C.ink,4.5);P.dot(s.t+s.h,f(s.t+s.h),C.c2,4.5);
  P.legend([['secant, slope 2t + Δt',C.c2],['tangent, slope 2t',C.c4]]);
  out(`Δf/Δt = 2t + Δt = <span class="k2">${fmt(m,3)}</span> &nbsp;→&nbsp; derivative 2t = <span class="k4">${fmt(2*s.t,3)}</span> &nbsp; (they differ by Δt = ${fmt(s.h,3)})`);}});

/* ===== Chapter 3 ===== */
(function(){
const cs={S:[-.5,.3],T:[.5,.3],U:[0,-.55]},r=.85,O=(a,b)=>a||b;
const OPS={u:['S ∪ T',(S,T)=>S||T],i:['S ∩ T',(S,T)=>S&&T],d:['S \\ T',(S,T)=>S&&!T],e:['T \\ S',(S,T)=>T&&!S],x:['S △ T',(S,T)=>S!==T],c:['complement of S',S=>!S],
  a:['(S ∪ T) ∩ U',(S,T,U)=>(S||T)&&U,'(S ∩ U) ∪ (T ∩ U)',(S,T,U)=>(S&&U)||(T&&U)],b:['(S ∩ T) ∪ U',(S,T,U)=>(S&&T)||U,'(S ∪ U) ∩ (T ∪ U)',(S,T,U)=>(S||U)&&(T||U)],
  m:['complement of (S ∪ T)',(S,T)=>!(S||T),'Sᶜ ∩ Tᶜ',(S,T)=>!S&&!T],n:['complement of (S ∩ T)',(S,T)=>!(S&&T),'Sᶜ ∪ Tᶜ',(S,T)=>!S||!T]};
const A={'100':[-.95,.62],'010':[.95,.62],'001':[0,-1.05],'110':[0,.8],'101':[-.62,-.3],'011':[.62,-.3],'111':[0,.02],'000':[0,1.28]};
lab('venn',{cv:[310],ctl:[{t:'s',k:'op',l:'Expression',o:[['u','S ∪ T (union)'],['i','S ∩ T (intersection)'],['d','S \\ T (difference)'],['e','T \\ S'],['x','S △ T (symmetric difference)'],['c','complement of S'],['a','Distributive law 1: (S ∪ T) ∩ U'],['b','Distributive law 2: (S ∩ T) ∪ U'],['m','De Morgan 1: complement of (S ∪ T)'],['n','De Morgan 2: complement of (S ∩ T)']]}],
draw(s,[P],out){const op=OPS[s.op],g=P.sq(0,[-1.65,1.5]).g,inn=(k,x,y)=>Math.hypot(x-cs[k][0],y-cs[k][1])<r;
  g.fillStyle=alpha(C.c1,.3);for(let px=0;px<P.w;px+=3)for(let py=0;py<P.h;py+=3){const x=P.iX(px+1.5),y=P.iY(py+1.5);if(op[1](inn('S',x,y),inn('T',x,y),inn('U',x,y)))g.fillRect(px,py,3,3);}
  for(const k in cs){P.circ(cs[k][0],cs[k][1],r,null,k==='U'?C.c3:k==='T'?C.c2:C.c1,2);}
  P.txt('S (even)',-1.25,1.2,C.c1,'center',0,0,1);P.txt('T (multiples of 3)',1.25,1.2,C.c2,'center',0,0,1);P.txt('U (1 to 6)',0,-1.52,C.c3,'center',0,0,1);
  const grp={},mem=n=>[n%2===0,n%3===0,n<=6];for(let n=1;n<=12;n++){const k=mem(n).map(b=>b?1:0).join('');(grp[k]=grp[k]||[]).push(n);}
  const L=[],R=[];for(const k in grp)grp[k].forEach((n,i)=>{const m=mem(n),on=op[1](...m);if(on)L.push(n);if(op[3]&&op[3](...m))R.push(n);
    P.txt(String(n),A[k][0]+(i-(grp[k].length-1)/2)*.24,A[k][1],on?C.ink:C.mute,'center',0,0,on);});
  L.sort((a,b)=>a-b);R.sort((a,b)=>a-b);
  out(op[2]?`<b>${op[0]}</b> = {${L.join(', ')}}<br><b>${op[2]}</b> = {${R.join(', ')}} &nbsp; <span class="${L.join()===R.join()?'ok':'no'}">${L.join()===R.join()?'same set, as the law says':'different'}</span>`:`<b>${op[0]}</b> = {${L.join(', ')||' '}}${L.length?'':' = ∅'}`);}});

const F=[0,0,1,2,2,2],YN=['a','b','c','d'],yy=[6,4.5,3,1.5];
lab('fmap',{cv:[270],init(s,[P],redraw){s.m=[1,2,3,0,0,0];P.onDrag((x,y,e)=>{if(e.type!=='pointerdown'||Math.abs(x-2.5)>1.6)return;const i=7-Math.round(y);if(i>=1&&i<=6){s.m[i-1]=(s.m[i-1]+1)%4;redraw();}});P.cv.style.cursor='pointer';},
draw(s,[P],out){P.begin([0,10],[0,7],{L:0,B:0});const g=P.g,inA=i=>s.m[i]&1,inB=i=>s.m[i]&2;
  const node=(x,y,t,a,b)=>{g.beginPath();g.arc(P.X(x),P.Y(y),14,0,7);g.fillStyle=a?alpha(C.c1,.35):C.panel;g.fill();g.strokeStyle=b?C.c2:C.mute;g.lineWidth=b?3.5:1;g.stroke();P.txt(t,x,y,C.ink,'center',0,0,1);};
  const fA=new Set,fB=new Set,fU=new Set,fI=new Set;
  for(let i=0;i<6;i++){P.arrow(2.5+.45,6-i,7.5-.5,yy[F[i]],s.m[i]?C.ink:C.line,s.m[i]?1.6:1);if(inA(i))fA.add(F[i]);if(inB(i))fB.add(F[i]);if(s.m[i])fU.add(F[i]);if(s.m[i]===3)fI.add(F[i]);}
  for(let i=0;i<6;i++)node(2.5,6-i,String(i+1),inA(i),inB(i));for(let j=0;j<4;j++)node(7.5,yy[j],YN[j],fA.has(j),fB.has(j));
  P.txt('domain',2.5,6.75,C.mute,'center');P.txt('codomain',7.5,6.75,C.mute,'center');P.txt('shaded = A   thick ring = B',5,.35,C.mute,'center');
  const st=(S)=>'{'+[...S].sort().map(j=>YN[j]).join(', ')+'}',el=f=>'{'+[0,1,2,3,4,5].filter(f).map(i=>i+1).join(', ')+'}';
  const cap=new Set([...fA].filter(j=>fB.has(j))),un=new Set([...fA,...fB]),eq=(a,b)=>st(a)===st(b);
  out(`A = ${el(inA)}, &nbsp; B = ${el(inB)} &nbsp;·&nbsp; f(A) = ${st(fA)}, f(B) = ${st(fB)}<br>f(A ∪ B) = ${st(fU)} &nbsp; and &nbsp; f(A) ∪ f(B) = ${st(un)} &nbsp; <span class="ok">always equal</span><br>f(A ∩ B) = ${st(fI)} &nbsp; and &nbsp; f(A) ∩ f(B) = ${st(cap)} &nbsp; <span class="${eq(fI,cap)?'ok':'no'}">${eq(fI,cap)?'equal this time':'not equal'}</span><br>Preimages: f⁻¹({a}) = {1, 2}, &nbsp; f⁻¹({b}) = {3}, &nbsp; f⁻¹({c}) = {4, 5, 6}, &nbsp; f⁻¹({d}) = ∅`);}});

const gcd=(a,b)=>b?gcd(b,a%b):a;
lab('count',{cv:[300],ctl:[{t:'s',k:'m',l:'Listing',o:[['z','Integers ℤ: 0, −1, 1, −2, 2, …'],['q','Rationals ℚ, by height |p| + q'],['d','A table of sets, by diagonals']]},{t:'r',k:'k',l:'Elements counted',a:1,b:36,s:1,v:9,f:v=>v}],
draw(s,[P],out){const k=s.k;
  if(s.m==='z'){P.begin([-8,8],[0,3.2],{L:0,B:0});P.seg(-8,1,8,1,C.mute,1);const z=i=>i%2?(i-1)/2:-i/2;
    for(let i=1;i<k;i++){const a=z(i),b=z(i+1);P.path(range(21,t=>[a+(b-a)*t/20,1+.11*Math.abs(b-a)*Math.sin(Math.PI*t/20)]),alpha(C.c1,.6),1.4);}
    for(let n=-7;n<=7;n++){const idx=n>=0?2*n+1:-2*n,on=idx<=k;P.dot(n,1,on?C.c1:C.line,on?5:3.5);P.txt(String(n).replace('-','−'),n,1,C.ink,'center',0,16);if(on)P.txt('#'+idx,n,1,C.c2,'center',0,32,1);}
    out(`Order of listing: ${range(Math.min(k,15),i=>fmt(z(i+1))).join(', ')}${k>15?', …':''}<br>Rule: n ≥ 0 gets the odd number 2n + 1; n &lt; 0 gets the even number 2|n|. Every integer receives exactly one natural number.`);}
  else if(s.m==='q'){const L=[];for(let h=1;L.length<k;h++)for(let p=-(h-1);p<=h-1;p++){const q=h-Math.abs(p);if(gcd(Math.abs(p),q)===1)L.push([p,q,h]);}L.length=k;
    P.begin([-7.5,7.5],[0,8],{L:26}).axes({xl:'numerator p',yl:'denominator q'});for(let p=-7;p<=7;p++)for(let q=1;q<=7;q++)if(gcd(Math.abs(p),q)===1)P.dot(p,q,C.line,3);
    P.path(L,alpha(C.c1,.7),1.4);L.forEach((a,i)=>{P.dot(a[0],a[1],C.c1,4.5);if(k<=20)P.txt('#'+(i+1),a[0],a[1],C.c2,'center',0,-12,1);});
    out(`Listed so far: ${L.map(a=>a[1]===1?fmt(a[0]):fmt(a[0])+'/'+a[1]).join(', ')}<br>Height of the last one: ${L[k-1][2]}. Only fractions in lowest terms are dots, so no rational appears twice.`);}
  else{const L=[];for(let d=2;d<=7;d++){const row=[];for(let i=1;i<d;i++)row.push([i,d-i]);if(d%2===0)row.reverse();L.push(...row);}const kk=Math.min(k,21);
    P.begin([0,7],[0,7],{L:0,B:0});for(let i=1;i<=6;i++)for(let j=1;j<=6;j++)P.txt('a'+i+j,j,7-i,C.mute,'center');
    const pt=L.slice(0,kk).map(a=>[a[1],7-a[0]]);P.path(pt,alpha(C.c1,.7),2);pt.forEach((p,i)=>{P.dot(p[0],p[1]+.28,C.c1,3);P.txt('#'+(i+1),p[0],p[1],C.c2,'center',0,14,1);});
    for(let i=1;i<=6;i++)P.txt('A'+i+':',.25,7-i,C.c3,'center',0,0,1);
    out(`Order: ${L.slice(0,kk).map(a=>'a<sub>'+a[0]+a[1]+'</sub>').join(', ')}, …<br>Row i holds the elements of the set A<sub>i</sub>. The entry a<sub>ij</sub> lies on diagonal i + j, and each diagonal is finite, so every entry is reached.${k>21?' (The picture shows the first 21.)':''}`);}}});
})();

/* ===== Chapter 4 ===== */
lab('implies',{cv:[],ctl:[{t:'s',k:'st',l:'The implication P ⇒ Q',o:[['r','it is raining ⇒ the sky is cloudy'],['x','x = 2 ⇒ x² < 6']]},{t:'s',k:'as',l:'You are also told',o:[['p','P is true'],['np','P is false'],['q','Q is true'],['nq','Q is false']]}],
draw(s,P,out){const T={r:['it is raining','it is not raining','the sky is cloudy','the sky is not cloudy','it can be cloudy without rain'],x:['x = 2','x ≠ 2','x² < 6','x² ≥ 6','x = 1 has x² < 6 but x ≠ 2']}[s.st];
  const R={p:[T[0],`<span class="ok">${T[2]}</span>`,'This is the implication itself.'],np:[T[1],'<span class="no">no deduction possible</span>','Q might hold anyway: '+T[4]+'.'],q:[T[2],'<span class="no">no deduction possible</span>','That would use the converse Q ⇒ P, which was never given: '+T[4]+'.'],nq:[T[3],`<span class="ok">${T[1]}</span>`,'This is the contrapositive, not-Q ⇒ not-P. If P were true, Q would have to be true.']}[s.as];
  out(`<table><tr><th>Assumption</th><th>Deduction</th><th>Why</th></tr><tr><td>${R[0]}</td><td>${R[1]}</td><td>${R[2]}</td></tr></table>Contrapositive (always valid): <b>${T[3]} ⇒ ${T[1]}</b>. &nbsp; Converse (not implied): ${T[2]} ⇒ ${T[0]}.`);}});

lab('twosq',{cv:[330],ctl:[{t:'s',k:'m',l:'Write n as a sum of',o:[[2,'two squares'],[3,'three squares'],[4,'four squares']]}],
draw(s,[P],out){const m=+s.m,ok=n=>{for(let a=0;a*a<=n;a++)for(let b=a;a*a+b*b<=n;b++){const r=n-a*a-b*b;if(m===2){if(r===0)return 1;}else for(let c=b;c*c<=r;c++){const q=r-c*c;if(m===3){if(q===0)return 1;}else{const d=Math.round(Math.sqrt(q));if(d*d===q)return 1;}}}return 0;};
  P.begin([0,10],[0,10],{L:0,B:0});const bad=[];for(let n=1;n<=100;n++){const c=(n-1)%10,r=9-Math.floor((n-1)/10),o=ok(n);if(!o)bad.push(n);P.box(c+.06,r+.06,c+.94,r+.94,o?alpha(C.c1,.28):null,o?null:C.c5,1.5);P.txt(String(n),c+.5,r+.5,o?C.ink:C.c5,'center',0,0,!o);}
  out(bad.length?`Not a sum of ${m===2?'two':'three'} squares: <span class="k5">${bad.slice(0,18).join(', ')}${bad.length>18?', …':''}</span> (${bad.length} of the first 100).<br>The smallest counterexample is <b>${bad[0]}</b>, and one is all it takes to disprove "every positive integer is a sum of ${m===2?'two':'three'} squares".`:'No counterexample up to 100. In fact every positive integer is a sum of four squares (Lagrange). A table cannot prove that: a "for all" statement needs a general argument.');}});

lab('oddsq',{cv:[320],ctl:[{t:'r',k:'n',l:'n',a:1,b:12,s:1,v:5,f:v=>v}],
draw(s,[P],out){const n=s.n;P.sq(n/2,[-.6,n+.6]);for(let i=0;i<n;i++)for(let j=0;j<n;j++){const l=Math.max(i,j),c=l===n-1?C.c2:C.c1;P.box(i+.05,j+.05,i+.95,j+.95,alpha(c,l===n-1?.75:.18+.05*(l%2)),alpha(c,.8),1);}
  for(let l=0;l<n;l++)P.txt(String(2*l+1),l+.5,l+.5,l===n-1?C.panel:C.ink,'center',0,0,1);
  out(`${range(n,i=>2*i+1).join(' + ')} = <b>${n*n}</b> = ${n}². &nbsp; The orange border has ${n-1} + ${n-1} + 1 = <span class="k2">${2*n-1}</span> cells.`);}});

lab('bern',{cv:[280],ctl:[{t:'r',k:'n',l:'n',a:1,b:10,s:1,v:3,f:v=>v},{t:'r',k:'p',l:'p',a:-.99,b:2,s:.01,v:.8}],
draw(s,[P],out){const n=s.n,f=p=>Math.pow(1+p,n),l=p=>1+n*p,ym=3+2.4*n;P.begin([-1,2],[-n,ym]).axes({xl:'p'});P.fn(f,C.c1,2.5);P.fn(l,C.c2,2);
  P.seg(s.p,l(s.p),s.p,f(s.p),C.c4,3);P.dot(s.p,f(s.p),C.c1,4.5);P.dot(s.p,l(s.p),C.c2,4.5);P.legend([['(1 + p)ⁿ',C.c1],['1 + np',C.c2]]);
  out(`(1 + p)<sup>n</sup> = <span class="k1">${fmt(f(s.p))}</span> &nbsp;≥&nbsp; 1 + np = <span class="k2">${fmt(l(s.p))}</span> &nbsp; gap <span class="k4">${fmt(f(s.p)-l(s.p))}</span>`);}});

lab('poly',{cv:[300],ctl:[{t:'r',k:'m',l:'Sides',a:3,b:10,s:1,v:6,f:v=>v},{t:'c',k:'fan',l:'Keep cutting (all diagonals from A₁)',v:false}],
draw(s,[P],out){const m=s.m,V=range(m,i=>{const a=Math.PI/2+2*Math.PI*i/m,rr=1+.12*Math.sin(i*2.3);return [rr*Math.cos(a),rr*Math.sin(a)];});P.sq(0,[-1.45,1.45]);
  if(m>3){P.poly([V[0],...V.slice(2)],alpha(C.c1,.22));P.poly(V.slice(0,3),alpha(C.c2,.4));}else P.poly(V,alpha(C.c2,.4));P.poly(V,null,C.ink,2);
  if(m>3)P.seg(V[0][0],V[0][1],V[2][0],V[2][1],C.c2,2.2);if(s.fan)for(let i=3;i<m-1;i++)P.seg(V[0][0],V[0][1],V[i][0],V[i][1],C.c1,1.5,[5,4]);
  V.forEach((v,i)=>{P.dot(v[0],v[1],C.ink,3.5);P.txt('A'+(i+1),v[0]*1.17,v[1]*1.17,C.ink,'center');});
  out(m===3?'Base case P(3): a triangle has angle sum π = 180°.':`${m}-gon = triangle A₁A₂A₃ <span class="k2">(π)</span> + a ${m-1}-gon <span class="k1">((${m-1} − 2)π = ${m-3}π)</span> &nbsp;⇒&nbsp; angle sum <b>(${m} − 2)π = ${m-2}π = ${(m-2)*180}°</b>${s.fan?`, i.e. ${m-2} triangles.`:''}`);}});

/* ===== Chapter 5: sequences ===== */
(function(){
const isPrime=n=>{if(n<2)return false;for(let i=2;i*i<=n;i++)if(n%i===0)return false;return true;};
const fib=n=>{let a=0,b=1;for(let i=1;i<n;i++)[a,b]=[b,a+b];return a;};
lab('seqx',{cv:[280],ctl:[{t:'s',k:'q',l:'Sequence',o:[['inv','1/n'],['one','constant 1'],['quad','n² − n'],['alt','(−1)ⁿ'],['prime','10⁻⁶ if n prime, else 1/n'],['ar','arithmetic: a₁ + (n − 1)d'],['ge','geometric: a·rⁿ⁻¹'],['fib','Fibonacci']]},
  {t:'r',k:'a',l:'first term',a:-5,b:5,s:.5,v:5,w:s=>s.q==='ar'||s.q==='ge'},{t:'r',k:'d',l:'difference d',a:-3,b:3,s:.5,v:2,w:s=>s.q==='ar'},{t:'r',k:'r',l:'ratio r',a:-1.5,b:1.5,s:.05,v:.8,w:s=>s.q==='ge'},{t:'r',k:'n',l:'terms shown',a:5,b:40,s:1,v:15,f:v=>v}],
draw(s,[P],out){const f={inv:n=>1/n,one:()=>1,quad:n=>n*n-n,alt:n=>n%2?-1:1,prime:n=>isPrime(n)?1e-6:1/n,ar:n=>s.a+(n-1)*s.d,ge:n=>s.a*Math.pow(s.r,n-1),fib}[s.q];
  const N=s.n,a=range(N,i=>f(i+1)),lo=Math.min(0,...a),hi=Math.max(0,...a),pad=(hi-lo||1)*.1;P.begin([0,N+1],[lo-pad,hi+pad],{L:48}).axes({xl:'n',yl:'aₙ'});P.pts(a.map((v,i)=>[i+1,v]),C.c1,3.5,true);
  const inc=a.every((v,i)=>!i||v>=a[i-1]),dec=a.every((v,i)=>!i||v<=a[i-1]),si=a.every((v,i)=>!i||v>a[i-1]),sd=a.every((v,i)=>!i||v<a[i-1]),S=a.reduce((x,y)=>x+y,0);
  let extra='';if(s.q==='ar')extra=` &nbsp;·&nbsp; formula n(a₁ + aₙ)/2 = ${fmt(N*(a[0]+a[N-1])/2)}`;if(s.q==='ge'&&s.r!==1)extra=` &nbsp;·&nbsp; formula a(1 − rⁿ)/(1 − r) = ${fmt(s.a*(1-Math.pow(s.r,N))/(1-s.r))}`;
  out(`First terms: ${a.slice(0,9).map(v=>fmt(v,4)).join(', ')}, …<br>On the terms shown: <b>${si?'strictly increasing':sd?'strictly decreasing':inc&&dec?'constant (both increasing and decreasing)':inc?'increasing, not strictly':dec?'decreasing, not strictly':'not monotonic'}</b> &nbsp;·&nbsp; sum of the first ${N} terms S = ${fmt(S)}${extra}`);}});

lab('bee',{cv:[120,220],ctl:[{t:'r',k:'t',l:'time (hours)',a:0,b:.5,s:.0025,v:.42},{t:'b',l:'Play / pause',on:(s,rd,sy)=>play(s,'t',.5,.0025,rd,sy,40)}],
init(s,[P,Q]){P.cv.style.flex='1 1 100%';Q.cv.style.flex='1 1 100%';},
draw(s,[P,Q],out){let pos=0,dir=1,tm=0;const land=[];for(let i=0;i<60;i++){const dt=(1-2*tm)/3;if(tm+dt>s.t){pos+=dir*2*(s.t-tm);break;}pos+=dir*2*dt;tm+=dt;land.push(pos);dir=-dir;}
  P.begin([-.08,1.08],[0,1],{L:10,B:22}).axes({noy:true,xl:'miles from the bee\'s start'});P.box(s.t-.07,.15,s.t,.6,alpha(C.c3,.6),C.c3);P.box(1-s.t,.15,1-s.t+.07,.6,alpha(C.c3,.6),C.c3);
  land.forEach(x=>P.seg(x,.05,x,.15,C.c2,1.5));P.vl(.5,C.c4,1,[4,4]);P.dot(clamp(pos,s.t,1-s.t),.4,C.c2,6);P.txt('bee',clamp(pos,s.t,1-s.t),.82,C.c2,'center',0,0,1);
  const xn=n=>.5*(1-Math.pow(-1/3,n));Q.begin([0,13],[.3,.75]).axes({xl:'landing n',yl:'xₙ'});Q.hl(.5,C.c4,1.5,[5,4]);Q.pts(range(12,i=>[i+1,xn(i+1)]),C.line,4);Q.pts(land.slice(0,12).map((x,i)=>[i+1,x]),C.c2,4.5);
  out(`Landings so far: <b>${land.length>=59?'more than you can count':land.length}</b> &nbsp;·&nbsp; bee at <span class="k2">${fmt(pos,5)}</span> miles${land.length?` &nbsp;·&nbsp; last landing x<sub>${Math.min(land.length,59)}</sub> = ${fmt(land[land.length-1],6)}, distance from ½: ${fmt(Math.abs(land[land.length-1]-.5),6)}`:''}`);}});

const SQ={inv:['1/n',n=>1/n,0],sinn:['sin(n)/n',n=>Math.sin(n)/n,0],ex20:['(3n² + 2n)/(6n² + 7n + 1)  (Example 20)',n=>(3*n*n+2*n)/(6*n*n+7*n+1),.5],bee:['the bee: ½(1 − (−⅓)ⁿ)',n=>.5*(1-Math.pow(-1/3,n)),.5],
  an:['1 + (−1)ⁿ/n',n=>1+(n%2?-1:1)/n,1],nn:['n/(n + 1)',n=>n/(n+1),1],rt:['1/√n',n=>1/Math.sqrt(n),0],alt:['(−1)ⁿ  (diverges)',n=>n%2?-1:1,0],altn:['(−1)ⁿ·n/8  (diverges)',n=>(n%2?-1:1)*n/8,0]};
lab('epsn',{cv:[310],ctl:[{t:'s',k:'q',l:'Sequence aₙ',o:Object.keys(SQ).map(k=>[k,SQ[k][0]]),on:(s,sy)=>{s.l=SQ[s.q][2];sy();}},{t:'r',k:'e',l:'ε',a:.005,b:1.2,s:.005,v:.28},{t:'r',k:'l',l:'claimed limit l',a:-1.5,b:1.5,s:.01,v:0},{t:'r',k:'v',l:'terms shown',a:15,b:200,s:1,v:30,f:v=>v}],
draw(s,[P],out){const f=SQ[s.q][1],H=4000;let last=0;for(let n=1;n<=H;n++)if(Math.abs(f(n)-s.l)>=s.e)last=n;const win=last<H;
  const a=range(s.v,i=>f(i+1)),lo=Math.min(s.l-s.e,...a),hi=Math.max(s.l+s.e,...a),pad=(hi-lo)*.08;P.begin([0,s.v+1],[Math.max(lo-pad,-3),Math.min(hi+pad,3)]).axes({xl:'n'});
  P.box(0,s.l-s.e,s.v+1,s.l+s.e,alpha(C.c4,.16));P.hl(s.l,C.c4,1.5);P.hl(s.l+s.e,C.c4,1,[4,4]);P.hl(s.l-s.e,C.c4,1,[4,4]);
  if(win&&last<=s.v){P.vl(last+.5,C.c2,2);P.txt('N = '+last,last+.5,P.y1,C.c2,'left',5,12,1);}
  a.forEach((v,i)=>P.dot(i+1,v,Math.abs(v-s.l)<s.e?C.c1:C.bad,s.v>80?2.5:3.5,Math.abs(v-s.l)>=s.e));P.txt('l + ε',s.v+1,s.l+s.e,C.c4,'right',-4,-8);P.txt('l − ε',s.v+1,s.l-s.e,C.c4,'right',-4,9);
  out(win?`<span class="ok">Verifier wins this round.</span> With ε = ${fmt(s.e,3)} and l = ${fmt(s.l,2)}, <b>N = ${last}</b> works: every term after a<sub>${last}</sub> is within ε of l${last?` (a<sub>${last}</sub> = ${fmt(f(last),5)} is the last one outside)`:''}.${s.q==='inv'&&s.l===0?` The notes' formula N(ε) = ⌈1/ε⌉ gives ${Math.ceil(1/s.e)}, which also works: any N at least this large does.`:''}`
    :`<span class="no">Refuter wins.</span> With ε = ${fmt(s.e,3)} and l = ${fmt(s.l,2)} there is no N: terms as late as a<sub>${last}</sub> are still at least ε from l. ${Math.abs(SQ[s.q][2]-s.l)>1e-9&&s.q!=='alt'&&s.q!=='altn'?'The sequence does converge, but not to this l.':s.q==='alt'||s.q==='altn'?'No choice of l rescues this sequence once ε is small.':'Shrinking ε cannot be the issue here; check l.'}`);}});

const CA={},cq={rt:['√n',n=>Math.sqrt(n)],inv:['1/n',n=>1/n],sinn:['sin(n)/n',n=>Math.sin(n)/n],p2:['partial sums of 1/k²',null,k=>1/(k*k)],h:['partial sums of 1/k (harmonic)',null,k=>1/k],alt:['(−1)ⁿ',n=>n%2?-1:1]};
const arr=k=>{if(!CA[k]){const a=[0];let S=0;for(let n=1;n<=3000;n++){if(cq[k][2]){S+=cq[k][2](n);a.push(S);}else a.push(cq[k][1](n));}CA[k]=a;}return CA[k];};
lab('cauchy',{cv:[290],ctl:[{t:'s',k:'q',l:'Sequence',o:Object.keys(cq).map(k=>[k,cq[k][0]])},{t:'r',k:'N',l:'N',a:1,b:200,s:1,v:20,f:v=>v},{t:'r',k:'e',l:'ε',a:.01,b:1,s:.01,v:.2}],
draw(s,[P],out){const a=arr(s.q),V=220;let lo=1/0,hi=-1/0;for(let n=s.N+1;n<=3000;n++){lo=Math.min(lo,a[n]);hi=Math.max(hi,a[n]);}
  let ylo=1/0,yhi=-1/0;for(let n=1;n<=V;n++){ylo=Math.min(ylo,a[n]);yhi=Math.max(yhi,a[n]);}const pad=(yhi-ylo)*.08;P.begin([0,V],[ylo-pad,yhi+pad],{L:44}).axes({xl:'n'});
  P.box(s.N,lo,V,hi,alpha(C.c2,.2),C.c2);P.vl(s.N,C.c2,1.5);for(let n=1;n<=V;n++)P.dot(n,a[n],C.c1,2);
  const sp=hi-lo;out(`Tail spread max |aₙ − aₘ| for n, m &gt; ${s.N} (to n = 3000): <span class="k2">${fmt(sp,5)}</span> ${sp<s.e?`<span class="ok">&lt; ε = ${fmt(s.e,2)}</span>`:`<span class="no">≥ ε = ${fmt(s.e,2)}</span>`} &nbsp;·&nbsp; one step |a<sub>N+1</sub> − a<sub>N</sub>| = ${fmt(Math.abs(a[s.N+1]-a[s.N]),5)}<br>${s.q==='rt'||s.q==='h'?'Not Cauchy: the single step is tiny, yet the tail spread is large and would keep growing if we looked further out.':s.q==='alt'?'Not Cauchy: the tail always contains both −1 and 1, spread 2.':'Cauchy: increase N and the spread drops below any ε.'}`);}});

lab('heron',{cv:[],ctl:[{t:'r',k:'n',l:'terms',a:1,b:8,s:1,v:5,f:v=>v}],
draw(s,P,out){let p=1n,q=1n,rows='';const R='1.4142135623730950488016887242';for(let i=1;i<=s.n;i++){const dec=(p*10n**28n/q).toString(),d='1.'+dec.slice(1);let m=0;while(m<d.length&&d[m]===R[m])m++;
    const fr=p.toString().length>22?`a ${p.toString().length}-digit numerator over a ${q.toString().length}-digit denominator`:`${p}/${q}`;
    rows+=`<tr><td>a<sub>${i}</sub></td><td class="mono">${fr}</td><td class="mono"><span class="k4">${d.slice(0,m)}</span>${d.slice(m)}</td></tr>`;[p,q]=[p*p+2n*q*q,2n*p*q];}
  out(`<table><tr><th>term</th><th>exact fraction</th><th>decimal (digits agreeing with √2 in green)</th></tr>${rows}</table>√2 = <span class="mono">${R}…</span> &nbsp; The number of correct digits roughly doubles each step. (This is Newton's method for x² − 2 = 0; see Chapter 12.)`);}});

const SW={a:['sin(n)/n',n=>Math.sin(n)/n,n=>-1/n,n=>1/n,'−1/n','1/n'],b:['(−1)ⁿ/n²',n=>(n%2?-1:1)/(n*n),n=>-1/(n*n),n=>1/(n*n),'−1/n²','1/n²'],c:['cos²(n)/√n',n=>Math.cos(n)**2/Math.sqrt(n),()=>0,n=>1/Math.sqrt(n),'0','1/√n'],d:['n!/nⁿ',n=>{let v=1;for(let k=1;k<=n;k++)v*=k/n;return v;},()=>0,n=>1/n,'0','1/n']};
lab('sandwich',{cv:[280],ctl:[{t:'s',k:'q',l:'Middle sequence',o:Object.keys(SW).map(k=>[k,SW[k][0]])},{t:'r',k:'e',l:'ε',a:.01,b:.5,s:.01,v:.1},{t:'r',k:'v',l:'terms shown',a:10,b:120,s:1,v:40,f:v=>v}],
draw(s,[P],out){const w=SW[s.q],lo=Math.min(-.15,w[2](1)*1.1),hi=Math.max(.15,w[3](1)*1.1);P.begin([0,s.v+1],[lo,hi]).axes({xl:'n'});P.box(0,-s.e,s.v+1,s.e,alpha(C.c4,.15));
  P.fn(x=>x>=1?w[3](x):NaN,C.c2,1.5);P.fn(x=>x>=1?w[2](x):NaN,C.c3,1.5);for(let n=1;n<=s.v;n++)P.dot(n,w[1](n),C.c1,s.v>70?2.5:3.5);
  let N=1;while(N<1e6&&(Math.abs(w[2](N))>=s.e||Math.abs(w[3](N))>=s.e))N++;if(N<=s.v)P.vl(N-.5,C.c4,1.5,[4,4]);P.legend([['upper uₙ = '+w[5],C.c2],['aₙ = '+w[0],C.c1],['lower lₙ = '+w[4],C.c3]]);
  out(`Both envelopes are within ε = ${fmt(s.e,2)} of 0 from <b>n = ${N}</b> on, so every a<sub>n</sub> beyond that is too. Limit: <b>0</b>.`);}});

const lf=[0];for(let i=1;i<400;i++)lf.push(lf[i-1]+Math.log(i));
const RS={a:['3⁻ⁿ',n=>-n*Math.log(3)],b:['1/n!',n=>-lf[n]],c:['n/2ⁿ',n=>Math.log(n)-n*Math.LN2],d:['n²·(0.9)ⁿ',n=>2*Math.log(n)+n*Math.log(.9)],e:['2ⁿ/n!',n=>n*Math.LN2-lf[n]],f:['1/n  (ratio → 1)',n=>-Math.log(n)],g:['(1.1)ⁿ/n  (ratio → 1.1)',n=>n*Math.log(1.1)-Math.log(n)]};
lab('ratioseq',{cv:[250,250],ctl:[{t:'s',k:'q',l:'Sequence aₙ',o:Object.keys(RS).map(k=>[k,RS[k][0]])},{t:'r',k:'c',l:'c',a:.05,b:.99,s:.01,v:.5}],
draw(s,[P,Q],out){const la=RS[s.q][1],M=45,L=range(M,i=>la(i+1)/Math.LN10),r=n=>Math.exp(la(n+1)-la(n));
  P.begin([0,M+1],[Math.min(...L,-1)-1,Math.max(...L,1)+1],{L:40}).axes({xl:'n',yl:'log₁₀ |aₙ|'});P.pts(L.map((v,i)=>[i+1,v]),C.c1,3);
  Q.begin([0,M+1],[0,Math.max(1.5,r(1)*1.1)]).axes({xl:'n',yl:'|aₙ₊₁ / aₙ|'});Q.hl(1,C.bad,1.5,[5,4]);Q.hl(s.c,C.c4,1.5);Q.txt('c',M+1,s.c,C.c4,'right',-4,-8,1);Q.pts(range(M,i=>[i+1,r(i+1)]),C.c2,3);
  let N=0;for(let n=1;n<=350;n++)if(r(n)>s.c)N=n;const lim=r(350);
  out(N<350?`<span class="ok">Ratio test passes</span> with c = ${fmt(s.c,2)}: |a<sub>n+1</sub>/a<sub>n</sub>| ≤ c for all n ≥ <b>${N+1}</b>, so a<sub>n</sub> → 0.`:`<span class="no">Ratio test not satisfied</span> with c = ${fmt(s.c,2)}: the ratio is still above c at n = 350.`+(lim>1.001?' The ratio settles above 1: the terms grow and the sequence diverges.':lim>.98?' The ratio tends to 1, so no c &lt; 1 will ever work. The test is inconclusive.':' Try a larger c: the ratio tends to about '+fmt(lim,2)+', so any c above that works.'));}});

const PK={a:['(−1)ⁿ(1 + 1/n)',n=>(n%2?-1:1)*(1+1/n)],b:['(−1)ⁿ(1 − 1/n)',n=>(n%2?-1:1)*(1-1/n)],c:['1/n',n=>1/n],d:['sin(1.3n)·(1 + 4/n)',n=>Math.sin(1.3*n)*(1+4/n)],e:['cos(n)·n/(n + 2)',n=>Math.cos(n)*n/(n+2)]};
lab('peaks',{cv:[280],ctl:[{t:'s',k:'q',l:'Sequence',o:Object.keys(PK).map(k=>[k,PK[k][0]])}],
draw(s,[P],out){const f=PK[s.q][1],H=6000,V=42,a=[0],pk=[];for(let n=1;n<=H;n++)a.push(f(n));let mx=-1/0;const isP=new Uint8Array(H+1);for(let n=H;n>=1;n--){if(a[n]>=mx){isP[n]=1;mx=a[n];}}
  for(let n=1;n<=H*.9;n++)if(isP[n])pk.push(n);const inf=pk.length&&pk[pk.length-1]>H*.5;let sub;
  if(inf)sub=pk.filter(n=>n<=V);else{let t=(pk.length?pk[pk.length-1]:0)+1;sub=[t];for(let n=t+1;n<=V;n++)if(a[n]>a[sub[sub.length-1]])sub.push(n);}
  P.begin([0,V+1],[Math.min(...a.slice(1,V+1))-.25,Math.max(...a.slice(1,V+1))+.25]).axes({xl:'n'});P.path(sub.map(n=>[n,a[n]]),C.c3,2);
  sub.forEach(n=>P.dot(n,a[n],C.c3,8,true));for(let n=1;n<=V;n++){P.seg(n,0,n,a[n],alpha(C.c1,.3),1);P.dot(n,a[n],isP[n]&&(inf||pk.includes(n))?C.c2:C.c1,isP[n]?4.5:3);}
  out(inf?`Peaks keep appearing (at n = ${pk.slice(0,8).join(', ')}, …). Each peak is at least as high as everything after it, so the peaks form a <b>decreasing</b> subsequence.`:`There ${pk.length?`are only ${pk.length} peak${pk.length>1?'s':''} (last at n = ${pk[pk.length-1]})`:'are no peaks at all'}. Starting just after, at n = ${sub[0]}, there is always a later, higher term: n = ${sub.slice(0,9).join(', ')}, … an <b>increasing</b> subsequence.`);}});

const SM={a:['1 − 1/n',n=>1-1/n,1,'1'],b:['partial sums of 1/k²',n=>{let S=0;for(let k=1;k<=n;k++)S+=1/(k*k);return S;},Math.PI**2/6,'π²/6'],c:['(1 + 1/n)ⁿ',n=>Math.pow(1+1/n,n),Math.E,'e'],d:['partial sums of 1/2ᵏ',n=>1-Math.pow(.5,n),1,'1']};
lab('supmono',{cv:[280],ctl:[{t:'s',k:'q',l:'Increasing sequence',o:Object.keys(SM).map(k=>[k,SM[k][0]])},{t:'r',k:'u',l:'candidate bound u (as a fraction of the way from a₁ to s)',a:.3,b:1.2,s:.01,v:.8},{t:'r',k:'e',l:'ε',a:.005,b:.5,s:.005,v:.1}],
draw(s,[P],out){const m=SM[s.q],f=m[1],sup=m[2],a1=f(1),u=a1+(sup-a1)*s.u,V=40;P.begin([0,V+1],[a1-(sup-a1)*.15,sup+(sup-a1)*.3],{L:44}).axes({xl:'n'});
  P.box(0,sup-s.e,V+1,sup,alpha(C.c4,.18));P.hl(sup,C.c2,2);P.txt('s = sup = '+m[3],V+1,sup,C.c2,'right',-4,-9,1);P.hl(u,C.c3,1.5,[6,4]);P.txt('u',0,u,C.c3,'left',6,-9,1);
  let N=1;while(N<1e6&&f(N)<=sup-s.e)N++;let ex=0;if(u<sup){ex=1;while(ex<1e6&&f(ex)<=u)ex++;}
  for(let n=1;n<=V;n++)P.dot(n,f(n),u<sup&&f(n)>u?C.c3:C.c1,3.5);if(N<=V)P.vl(N,C.c4,1.5,[4,4]);
  out(`${u>=sup?`<span class="ok">u = ${fmt(u)} is an upper bound</span>, but not the least one unless u = s.`:`<span class="no">u = ${fmt(u)} is not an upper bound</span>: a<sub>${ex}</sub> = ${fmt(f(ex),5)} already exceeds it.`}<br>s − ε = ${fmt(sup-s.e)} is not an upper bound either: the first term above it is a<sub>N</sub> with <b>N = ${N}</b>. From there on, every term lies in (s − ε, s].`);}});

lab('cut',{cv:[170],ctl:[{t:'r',k:'D',l:'largest denominator allowed',a:2,b:60,s:1,v:8,f:v=>v},{t:'r',k:'t',l:'probe position',a:0,b:1,s:.002,v:.42,f:()=>''}],
draw(s,[P],out){const g=(a,b)=>b?g(b,a%b):a,L=[];for(let d=1;d<=s.D;d++)for(let p=d;p<=2*d;p++)if(g(p,d)===1)L.push([p/d,p,d]);L.sort((a,b)=>a[0]-b[0]);
  const q=L[Math.round(s.t*(L.length-1))],r2=Math.SQRT2;P.begin([.95,2.05],[0,1],{L:10,B:22}).axes({noy:true});P.box(.95,0,r2,1,alpha(C.c1,.12));P.box(r2,0,2.05,1,alpha(C.c2,.12));P.vl(r2,C.ink,1.5,[4,4]);
  P.txt('A:  q² < 2',1,.9,C.c1,'left',0,0,1);P.txt('q² > 2',2,.9,C.c2,'right',0,0,1);P.txt('√2',r2,.9,C.ink,'center',0,0,1);
  for(const a of L)P.dot(a[0],.4,a[0]<r2?C.c1:C.c2,L.length>300?1.8:3);P.dot(q[0],.4,C.ink,6,true);P.txt(q[1]+'/'+q[2],q[0],.62,C.ink,'center',0,0,1);
  const lo=L.filter(a=>a[0]<r2).pop(),hi=L.find(a=>a[0]>r2);
  out(`Probe q = ${q[1]}/${q[2]}: q² = ${fmt(q[0]*q[0],6)} ${q[0]<r2?'<span class="k1">&lt; 2, so q ∈ A</span>':'<span class="k2">&gt; 2, so q ∉ A</span>'}<br>Best with denominators ≤ ${s.D}: largest in A is <span class="k1">${lo[1]}/${lo[2]}</span> (short by ${fmt(r2-lo[0],6)}), smallest outside is <span class="k2">${hi[1]}/${hi[2]}</span> (over by ${fmt(hi[0]-r2,6)}). Allow bigger denominators and both get beaten: A has no greatest element.`);}});
})();

/* ===== Chapter 6: continuity ===== */
(function(){
const s1=x=>x===0?0:Math.sin(1/x);
const ED={sq:['x²',x=>x*x,[-1.5,1.5],[-.5,2.5]],xs:['x·sin(1/x), f(0) = 0',x=>x===0?0:x*Math.sin(1/x),[-1,1],[-1,1]],s1:['sin(1/x), f(0) = 0',s1,[-1,1],[-1.5,1.5]],sg:['sgn(x)',x=>Math.sign(x),[-1.5,1.5],[-1.7,1.7],[0]],ab:['|x|',x=>Math.abs(x),[-1.5,1.5],[-.4,1.8]],li:['2 + 3x',x=>2+3*x,[-1.5,1.5],[-3,7]],re:['1/x  (x > 0)',x=>x>0?1/x:NaN,[0,1.5],[0,12]]};
const okD=(f,x0,l,e,d,dom)=>{const t=x=>{if(x===x0||x<dom[0]||x>dom[1])return true;const v=f(x);return !isFinite(v)||Math.abs(v-l)<e;};
  for(let i=1;i<=1500;i++){const u=d*i/1501;if(!t(x0+u)||!t(x0-u))return false;}for(let k=1;k<50;k++){const u=d*Math.pow(.75,k);for(const m of [1,.93,.87,.8])if(!t(x0+u*m)||!t(x0-u*m))return false;}return true;};
lab('epsdel',{cv:[320],ctl:[{t:'s',k:'f',l:'Function',o:Object.keys(ED).map(k=>[k,ED[k][0]]),on:(s,sy)=>{s.x=s.f==='re'?.3:0;sy();}},{t:'r',k:'x',l:'x₀',a:-1,b:1,s:.01,v:0},{t:'r',k:'e',l:'ε',a:.02,b:1.5,s:.01,v:.4},{t:'r',k:'d',l:'δ',a:.005,b:1,s:.005,v:.5},
  {t:'b',l:'Shrink δ until it works',on:s=>{const m=ED[s.f],x0=s.f==='re'?Math.max(.05,s.x):s.x;let d=1;while(d>.005&&!okD(m[1],x0,m[1](x0),s.e,d,m[2]))d*=.9;s.d=Math.max(.005,+d.toFixed(3));}}],
draw(s,[P],out){const m=ED[s.f],f=m[1],x0=s.f==='re'?Math.max(.05,s.x):s.x,l=f(x0),ok=okD(f,x0,l,s.e,s.d,m[2]);P.begin(m[2],m[3]).axes({xl:'x'});
  P.box(P.x0,l-s.e,P.x1,l+s.e,alpha(C.c4,.16));P.box(x0-s.d,P.y0,x0+s.d,P.y1,alpha(C.c3,.13));P.hl(l,C.c4,1,[4,4]);P.vl(x0-s.d,C.c3,1,[4,4]);P.vl(x0+s.d,C.c3,1,[4,4]);
  P.fn(f,C.c1,2,null,m[4]);P.fn(x=>Math.abs(x-x0)<s.d&&x!==x0&&Math.abs(f(x)-l)>=s.e?f(x):NaN,C.bad,3.5,null,m[4]);P.dot(x0,l,C.ink,4.5);
  P.txt('l ± ε',P.x1,l+s.e,C.c4,'right',-5,-8,1);P.txt('x₀ ± δ',x0,P.y0,C.c3,'center',0,-9,1);
  out(`x₀ = ${fmt(x0,2)}, &nbsp; l = f(x₀) = ${fmt(l,3)}, &nbsp; ε = ${fmt(s.e,2)}, &nbsp; δ = ${fmt(s.d,3)} &nbsp;→&nbsp; ${ok?'<span class="ok">this δ works</span>: every x within δ of x₀ has f(x) within ε of l.':'<span class="no">this δ fails</span>: some x within δ of x₀ has |f(x) − l| ≥ ε (red).'}${!ok&&s.d<=.0051?' Even the smallest δ on the slider fails. For this ε there is no δ: f is not continuous at x₀.':''}`);}});

const g1=x=>Math.sin(3*x)+.5*x;
lab('evt',{cv:[280],ctl:[{t:'s',k:'c',l:'Function and interval',o:[['a','sin(3x) + x/2 on a closed interval [a, b]'],['b','1/x on (0, 1]'],['c','x on [0, 1)'],['d','x on [0, ∞)']]},{t:'r',k:'a',l:'a',a:-3,b:-.1,s:.05,v:-2,w:s=>s.c==='a'},{t:'r',k:'b',l:'b',a:.1,b:3,s:.05,v:2.2,w:s=>s.c==='a'}],
draw(s,[P],out){if(s.c==='a'){P.begin([-3.3,3.3],[-3,3]).axes({xl:'x'});P.fn(g1,C.line,1.5);P.fn(x=>x>=s.a&&x<=s.b?g1(x):NaN,C.c1,2.5);let mx=s.a,mn=s.a;for(let i=0;i<=2000;i++){const x=s.a+(s.b-s.a)*i/2000;if(g1(x)>g1(mx))mx=x;if(g1(x)<g1(mn))mn=x;}
    P.dot(s.a,g1(s.a),C.c1,4.5);P.dot(s.b,g1(s.b),C.c1,4.5);P.hl(g1(mx),C.c2,1,[4,4]);P.hl(g1(mn),C.c3,1,[4,4]);P.dot(mx,g1(mx),C.c2,6);P.dot(mn,g1(mn),C.c3,6);
    out(`On [${fmt(s.a,2)}, ${fmt(s.b,2)}]: maximum <span class="k2">${fmt(g1(mx),4)}</span> attained at r = ${fmt(mx,3)}; minimum <span class="k3">${fmt(g1(mn),4)}</span> attained at s = ${fmt(mn,3)}. <span class="ok">Both exist, as Theorem 22 promises.</span>`);}
  else if(s.c==='b'){P.begin([0,1.2],[0,14]).axes({xl:'x'});P.fn(x=>x>0&&x<=1?1/x:NaN,C.c1,2.5);P.dot(1,1,C.c3,6);P.dot(0,13.6,C.c1,4.5,true);out('1/x on (0, 1]: minimum <span class="k3">1</span> attained at x = 1. <span class="no">No maximum and no supremum</span>: the values exceed every bound as x → 0. The interval is not closed at 0.');}
  else if(s.c==='c'){P.begin([-.1,1.3],[-.1,1.3]).axes({xl:'x'});P.fn(x=>x>=0&&x<1?x:NaN,C.c1,2.5);P.hl(1,C.c2,1,[4,4]);P.dot(0,0,C.c3,6);P.dot(1,1,C.c2,5,true);out('x on [0, 1): minimum <span class="k3">0</span> attained at 0. The supremum is <span class="k2">1</span>, but <span class="no">it is not attained</span>: no point of [0, 1) maps to 1.');}
  else{P.begin([0,10],[0,10]).axes({xl:'x'});P.fn(x=>x,C.c1,2.5);P.dot(0,0,C.c3,6);P.arrow(8.6,8.6,9.8,9.8,C.c1,2.5);out('x on [0, ∞): the interval is unbounded, and so is the function. <span class="no">No maximum, no supremum.</span>');}}});

const IV={a:['x³ − x + 0.5 on [−1.5, 1.5]',x=>x*x*x-x+.5,-1.5,1.5,[-2.2,2.8]],b:['cos x + x/2 on [0, 6]',x=>Math.cos(x)+x/2,0,6,[-.5,4.5]],t:['tan x on [π/4, 3π/4]',x=>Math.tan(x),Math.PI/4,3*Math.PI/4,[-6,6],[Math.PI/2]]};
lab('ivt',{cv:[280],ctl:[{t:'s',k:'f',l:'Function',o:Object.keys(IV).map(k=>[k,IV[k][0]])},{t:'r',k:'t',l:'level s, as a fraction of the way from f(a) to f(b)',a:.02,b:.98,s:.01,v:.5,f:v=>fmt(v,2)}],
draw(s,[P],out){const m=IV[s.f],f=m[1],a=m[2],b=m[3],lv=f(a)+(f(b)-f(a))*s.t,c=[];P.begin([a-(b-a)*.08,b+(b-a)*.08],m[4]).axes({xl:'x'});P.fn(x=>x>=a&&x<=b?f(x):NaN,C.c1,2.5,null,m[5]);P.hl(lv,C.c2,1.5);
  const N=1500;for(let i=0;i<N;i++){let u=a+(b-a)*i/N,v=a+(b-a)*(i+1)/N;if((f(u)-lv)*(f(v)-lv)<=0){for(let k=0;k<50;k++){const w=(u+v)/2;(f(u)-lv)*(f(w)-lv)<=0?v=w:u=w;}if(Math.abs(f(u)-lv)<1e-6&&(!c.length||u-c[c.length-1]>1e-6))c.push(u);}}
  P.dot(a,f(a),C.ink,4.5);P.dot(b,f(b),C.ink,4.5);c.forEach(x=>{P.seg(x,P.y0,x,lv,C.c2,1,[4,4]);P.dot(x,lv,C.c2,6);});
  out(`f(a) = ${fmt(f(a),3)}, &nbsp; f(b) = ${fmt(f(b),3)}, &nbsp; level s = <span class="k2">${fmt(lv,3)}</span> &nbsp;→&nbsp; ${c.length?`<span class="ok">f(c) = s at c = ${c.map(x=>fmt(Math.abs(x)<(b-a)*1e-7?0:x,4)).join(', ')}</span>`:'<span class="no">no c with f(c) = s</span>. tan is not continuous at π/2: it leaves at +∞ and returns from −∞, skipping every level between f(b) and f(a). Assigning a value at π/2 could rescue at most one level.'}`);}});

const UN={a:['x² on [0, 2]',x=>x*x,0,2,[0,4.4]],b:['1/x on (0, 1]',x=>1/x,.004,1,[0,14]],c:['√x on [0, 1]',x=>Math.sqrt(x),0,1,[0,1.3]],d:['sin(1/x) on (0, 1]',x=>Math.sin(1/x),.004,1,[-1.4,1.4]]};
const bestD=(f,a,b,x0,e)=>{const h=(b-a)/5000,f0=f(x0);let r=1/0,l=1/0;for(let x=x0+h;x<=b;x+=h)if(Math.abs(f(x)-f0)>=e){r=x-x0;break;}for(let x=x0-h;x>=a;x-=h)if(Math.abs(f(x)-f0)>=e){l=x0-x;break;}return Math.min(r,l,b-a);};
lab('unif',{cv:[270,270],ctl:[{t:'s',k:'f',l:'Function',o:Object.keys(UN).map(k=>[k,UN[k][0]])},{t:'r',k:'e',l:'ε',a:.05,b:1,s:.01,v:.4},{t:'r',k:'t',l:'x₀',a:.02,b:.98,s:.005,v:.6,f:()=>''}],
draw(s,[P,Q],out){const m=UN[s.f],f=m[1],a=m[2],b=m[3],x0=a+(b-a)*s.t,d=bestD(f,a,b,x0,s.e);P.begin([Math.min(0,a),b*1.05],m[4]).axes({xl:'x'});
  P.box(P.x0,f(x0)-s.e,P.x1,f(x0)+s.e,alpha(C.c4,.16));P.box(x0-d,P.y0,x0+d,P.y1,alpha(C.c3,.16));P.fn(x=>x>=a&&x<=b?f(x):NaN,C.c1,2);P.dot(x0,f(x0),C.ink,4.5);
  const K=160,pts=range(K,i=>{const x=a+(b-a)*(i+.5)/K;return [x,bestD(f,a,b,x,s.e)];}),mn=Math.min(...pts.map(p=>p[1])),mxv=Math.max(...pts.map(p=>p[1]));
  Q.begin([Math.min(0,a),b*1.05],[0,Math.min(mxv*1.15,b-a)]).axes({xl:'x₀',yl:'largest δ that works at x₀'});Q.path(pts,C.c3,2);Q.hl(mn,C.c2,1.5,[5,4]);Q.dot(x0,d,C.ink,5);
  out(`At x₀ = ${fmt(x0,3)} with ε = ${fmt(s.e,2)}: largest δ = <span class="k3">${fmt(d,4)}</span>. &nbsp; Smallest over the whole domain: <span class="k2">${fmt(mn,4)}</span>${s.f==='a'?` (Example 28 guarantees at least ε/(2M) = ${fmt(s.e/4,4)}).`:''}<br>${s.f==='a'||s.f==='c'?'<span class="ok">Uniformly continuous</span>: the orange floor is a δ that works at every x₀.':'<span class="no">Not uniformly continuous</span>: the allowed δ shrinks towards 0 near x = 0 (the plot is cut off at x = 0.004; closer in, it is smaller still).'}`);}});
})();

/* ===== Chapter 7: integration ===== */
(function(){
const rnd=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const RI={a:['x² on [0, 2]',x=>x*x,0,2,8/3,[-.3,4.3]],b:['x³ on [−1, 1]',x=>x*x*x,-1,1,0,[-1.2,1.2]],c:['sin x on [0, 2π]',Math.sin,0,2*Math.PI,0,[-1.3,1.3]],d:['1/x on [1, 3]',x=>1/x,1,3,Math.log(3),[-.1,1.2]],e:['a step: 1 for x < 1, then 2.5',x=>x<1?1:2.5,0,2,3.5,[-.2,3]],g:['exp(−x²) on [−2, 2]',x=>Math.exp(-x*x),-2,2,1.764162781524843,[-.1,1.2]]};
lab('riemann',{cv:[320],ctl:[{t:'s',k:'f',l:'Function',o:Object.keys(RI).map(k=>[k,RI[k][0]])},{t:'r',k:'n',l:'subintervals n',a:1,b:128,s:1,v:6,f:v=>v},{t:'s',k:'p',l:'Partition',o:[['u','equal widths'],['r','uneven']]},{t:'s',k:'m',l:'Sample points sᵢ',o:[['r','right end'],['l','left end'],['m','midpoint'],['x','random']]},{t:'b',l:'Refine (double n)',on:s=>{s.n=Math.min(128,s.n*2);}}],
draw(s,[P],out){const m=RI[s.f],f=m[1],a=m[2],b=m[3],n=s.n;let r=s.p==='u'?range(n+1,i=>a+(b-a)*i/n):[a,b,...range(n-1,i=>a+(b-a)*(.04+.92*rnd(i+1)))].sort((x,y)=>x-y);
  P.begin([a-(b-a)*.04,b+(b-a)*.04],m[5]).axes({xl:'x'});let L=0,U=0,S=0,nm=0;
  for(let i=0;i<n;i++){const w=r[i+1]-r[i];let lo=1/0,hi=-1/0;for(let k=0;k<=40;k++){const v=f(r[i]+w*k/40);lo=Math.min(lo,v);hi=Math.max(hi,v);}if(s.f==='e'&&r[i]<1&&r[i+1]>=1){lo=1;hi=2.5;}
    const si=s.m==='r'?r[i+1]:s.m==='l'?r[i]:s.m==='m'?r[i]+w/2:r[i]+w*rnd(i+77);L+=w*lo;U+=w*hi;S+=w*f(si);nm=Math.max(nm,w);
    P.box(r[i],0,r[i+1],lo,alpha(C.c3,.3),n>70?null:alpha(C.c3,.8));P.box(r[i],lo,r[i+1],hi,alpha(C.c2,.22),n>70?null:C.c2);if(n<=40)P.dot(si,f(si),C.ink,3);}
  P.fn(x=>x>=a&&x<=b?f(x):NaN,C.c1,2.2,null,s.f==='e'?[1]:null);
  out(`<span class="k3">L(f, P) = ${fmt(L,5)}</span> &nbsp;≤&nbsp; S = <b>${fmt(S,5)}</b> &nbsp;≤&nbsp; <span class="k2">U(f, P) = ${fmt(U,5)}</span> &nbsp;·&nbsp; exact ∫ = ${fmt(m[4],5)}<br>U − L = <b>${fmt(U-L,5)}</b> &nbsp;·&nbsp; norm ‖P‖ = ${fmt(nm,4)}${s.f==='a'&&s.p==='u'&&s.m==='r'?` &nbsp;·&nbsp; Example 29: 8/3 + 4/n + 4/(3n²) = ${fmt(8/3+4/n+4/(3*n*n),5)}`:''}${s.p==='r'?'<br>Each increase of n adds one point to the uneven partition, so every step is a refinement.':''}`);}});

const IM={a:['1/x² from 1 to X → ∞',x=>1/(x*x),X=>1-1/X,1,1],b:['1/x from 1 to X → ∞',x=>1/x,X=>Math.log(X),1,null],c:['1/√x from a → 0 to 1',x=>1/Math.sqrt(x),A=>2-2*Math.sqrt(A),0,2],d:['1/x from a → 0 to 1',x=>1/x,A=>-Math.log(A),0,null]};
lab('improper',{cv:[260,260],ctl:[{t:'s',k:'f',l:'Integral',o:Object.keys(IM).map(k=>[k,IM[k][0]])},{t:'r',k:'t',l:'push the cut-off towards the limit',a:0,b:1,s:.005,v:.35,f:()=>''}],
draw(s,[P,Q],out){const m=IM[s.f],inf=m[3]===1,c=inf?Math.pow(10,2.5*s.t):Math.pow(10,-4*s.t),A=m[2](c);
  if(inf){P.begin([0,Math.max(6,c*1.15)],[0,1.25]).axes({xl:'x'});P.area(m[1],1,c,alpha(C.c1,.3));P.fn(x=>x>=.8?m[1](x):NaN,C.c1,2.2);P.vl(c,C.c2,1.5);P.txt('X',c,1.15,C.c2,'right',-5,0,1);}
  else{P.begin([0,1.1],[0,14]).axes({xl:'x'});P.area(m[1],c,1,alpha(C.c1,.3));P.fn(x=>x>0?m[1](x):NaN,C.c1,2.2);P.vl(c,C.c2,1.5);P.txt('a',c,13,C.c2,'left',5,0,1);}
  Q.begin(inf?[0,2.5]:[-4,0],[0,inf?6:9.5]).axes({xl:inf?'log₁₀ X':'log₁₀ a',yl:'area so far'});Q.fn(u=>m[2](Math.pow(10,u)),C.c1,2.2);if(m[4]!==null){Q.hl(m[4],C.c4,1.5,[5,4]);Q.txt('limit '+m[4],inf?0:-4,m[4],C.c4,'left',6,-9,1);}Q.dot(Math.log10(c),A,C.c2,5.5);
  out(`${inf?'X':'a'} = ${fmt(c,4)} &nbsp;→&nbsp; area = <span class="k2">${fmt(A,5)}</span> &nbsp;·&nbsp; ${m[4]!==null?`<span class="ok">converges</span> to ${m[4]}: the area still to come is only ${fmt(m[4]-A,5)}.`:'<span class="no">diverges</span>: each factor of 10 in the cut-off adds another ln 10 ≈ 2.303 of area, forever.'}`);}});
})();

/* ===== Chapter 8: series ===== */
(function(){
const primes=[];for(let n=2;primes.length<400;n++){if(primes.every(p=>p*p>n||n%p))primes.push(n);}
const fac=[1];for(let i=1;i<171;i++)fac.push(fac[i-1]*i);
const zeta=c=>{let S=0;const M=20000;for(let n=1;n<=M;n++)S+=Math.pow(n,-c);return S+Math.pow(M,1-c)/(c-1);};
const PS={inv2:['1/n²',n=>1/(n*n),()=>Math.PI**2/6,'π²/6'],harm:['1/n  (harmonic)',n=>1/n,()=>null],geo:['xⁿ  (geometric)',(n,s)=>Math.pow(s.x,n),s=>Math.abs(s.x)<1?s.x/(1-s.x):null,'x/(1 − x)'],pc:['1/nᶜ',(n,s)=>Math.pow(n,-s.c),s=>s.c>1?zeta(s.c):null,'ζ(c)'],
  alt:['(−1)ⁿ⁺¹/n  (alternating harmonic)',n=>(n%2?1:-1)/n,()=>Math.LN2,'ln 2'],tel:['1/(n(n + 1))  (telescoping)',n=>1/(n*(n+1)),()=>1,'1'],fa:['1/n!',n=>n<171?1/fac[n]:0,()=>Math.E-1,'e − 1'],pr:['1/p over the primes',n=>1/primes[n-1],()=>null]};
lab('psum',{cv:[250,250],ctl:[{t:'s',k:'q',l:'Summand aₙ',o:Object.keys(PS).map(k=>[k,PS[k][0]])},{t:'r',k:'x',l:'x',a:-1.2,b:1.2,s:.01,v:.6,w:s=>s.q==='geo'},{t:'r',k:'c',l:'c',a:.3,b:3,s:.05,v:1.5,w:s=>s.q==='pc'},{t:'r',k:'n',l:'terms',a:5,b:300,s:1,v:30,f:v=>v}],
draw(s,[P,Q],out){const m=PS[s.q],N=s.n,a=range(N,i=>m[1](i+1,s)),S=[];let t=0;a.forEach(v=>{t+=v;S.push(t);});const lim=m[2](s),r=N>120?1.8:N>50?2.5:3.5;
  const yr=(v,x)=>{const lo=Math.min(0,...v,...x),hi=Math.max(0,...v,...x),p=(hi-lo||1)*.1;return [clamp(lo-p,-50,0),clamp(hi+p,.1,50)];};
  P.begin([0,N+1],yr(a,[]),{L:42}).axes({xl:'n',yl:'aₙ'});P.pts(a.map((v,i)=>[i+1,v]),C.c1,r,N<=60);
  Q.begin([0,N+1],yr(S,lim===null?[]:[lim]),{L:42}).axes({xl:'n',yl:'Sₙ'});if(lim!==null){Q.hl(lim,C.c4,1.5,[5,4]);}Q.pts(S.map((v,i)=>[i+1,v]),C.c2,r);
  out(`a<sub>${N}</sub> = ${fmt(a[N-1],6)} &nbsp;·&nbsp; S<sub>${N}</sub> = <span class="k2">${fmt(t,6)}</span> &nbsp;·&nbsp; ${lim!==null?`<span class="ok">converges</span> to ${m[3]} = ${fmt(lim,6)} (still ${fmt(Math.abs(lim-t),6)} away)`:`<span class="no">diverges</span>${s.q==='geo'?': |x| ≥ 1, the terms do not tend to 0':s.q==='pc'?': c ≤ 1':': the partial sums are unbounded, although the terms tend to 0'}`}`);}});

lab('harm',{cv:[260],ctl:[{t:'r',k:'k',l:'groups',a:1,b:16,s:1,v:8,f:v=>v}],
draw(s,[P],out){const K=s.k,g=[];let S=1,n=1;for(let k=1;k<=K;k++){let t=0;const e=2**k;for(n=e/2+1;n<=e;n++)t+=1/n;g.push(t);S+=t;}
  P.begin([0,K+1],[0,.8]).axes({xl:'group k  (terms 1/(2ᵏ⁻¹+1) … 1/2ᵏ)'});g.forEach((v,i)=>{P.box(i+.6,0,i+1.4,v,alpha(C.c1,.55),C.c1);if(K<=10)P.txt(2**i+(2**i>1?' terms':' term'),i+1,v,C.mute,'center',0,-9);});P.hl(.5,C.c2,1.5,[5,4]);P.txt('½',0,.5,C.c2,'left',6,-9,1);
  out(`S<sub>2^${K}</sub> = S<sub>${2**K}</sub> = <span class="k1">${fmt(S,5)}</span> &nbsp;≥&nbsp; 1 + ${K}/2 = <span class="k2">${fmt(1+K/2,2)}</span>. &nbsp; Smallest group sum so far: ${fmt(Math.min(...g),5)} (they decrease towards ln 2 ≈ 0.693, never below ½).<br>To push the sum past 10 takes 12,367 terms; past 20 takes about 272 million.`);}});

lab('invsq',{cv:[270],ctl:[{t:'r',k:'n',l:'n',a:4,b:80,s:1,v:20,f:v=>v}],
draw(s,[P],out){const N=s.n,S=[];let t=0;for(let i=1;i<=N;i++){t+=1/(i*i);S.push([i,t]);}P.begin([0,N+1],[.9,2.1],{L:40}).axes({xl:'n'});
  P.fn(x=>x>=2?2-1/x:NaN,C.c2,1.8);P.fn(x=>x>=2?1.5-1/(x+1):NaN,C.c3,1.8);P.hl(Math.PI**2/6,C.c4,1.5,[5,4]);P.pts(S,C.c1,N>50?2.5:3.5);P.legend([['upper bound 2 − 1/n',C.c2],['Sₙ',C.c1],['π²/6',C.c4],['lower bound 3/2 − 1/(n+1)',C.c3]]);
  out(`<span class="k3">${fmt(1.5-1/(N+1),5)}</span> &nbsp;&lt;&nbsp; S<sub>${N}</sub> = <span class="k1">${fmt(t,5)}</span> &nbsp;&lt;&nbsp; <span class="k2">${fmt(2-1/N,5)}</span> &nbsp;·&nbsp; π²/6 = ${fmt(Math.PI**2/6,5)}`);}});

const CM={a:['1/(n² + 3n)  against  1/n²  (convergent)',n=>1/(n*n+3*n),n=>1/(n*n),1],b:['(2n + 5)/n³  against  1/n²  (convergent)',n=>(2*n+5)/n**3,n=>1/(n*n),1],c:['1/√n  against  1/n  (divergent)',n=>1/Math.sqrt(n),n=>1/n,0],d:['ln(n + 1)/n  against  1/n  (divergent)',n=>Math.log(n+1)/n,n=>1/n,0],e:['1/n²  against  1/n  (divergent): the wrong way round',n=>1/(n*n),n=>1/n,0]};
lab('cmp',{cv:[260],ctl:[{t:'s',k:'q',l:'Test aₙ against a known series',o:Object.keys(CM).map(k=>[k,CM[k][0]])},{t:'r',k:'l',l:'λ',a:.1,b:5,s:.1,v:1}],
draw(s,[P],out){const m=CM[s.q],V=60,cv=m[3];let last=0;for(let n=1;n<=5000;n++)if(cv?m[1](n)>s.l*m[2](n):m[1](n)<s.l*m[2](n))last=n;
  P.begin([0,V+1],[-4.2,1]).axes({xl:'n',yl:'log₁₀ of the terms'});P.fn(x=>x>=1?Math.log10(s.l*m[2](x)):NaN,cv?C.c4:C.bad,2);P.pts(range(V,i=>[i+1,Math.log10(m[1](i+1))]),C.c1,3);if(last<V&&last<5000)P.vl(last+.5,C.c2,1.5,[4,4]);
  P.legend([['aₙ',C.c1],[cv?'λ·cₙ (convergent)':'λ·dₙ (divergent)',cv?C.c4:C.bad]]);
  out(last<5000?`<span class="ok">Comparison holds</span>: a<sub>i</sub> ${cv?'≤ λ·c':'≥ λ·d'}<sub>i</sub> for all i &gt; <b>N = ${last}</b> with λ = ${fmt(s.l,1)}. So Σ a<sub>i</sub> <b>${cv?'converges':'diverges'}</b>.`:`<span class="no">No conclusion</span> with λ = ${fmt(s.l,1)}: a<sub>i</sub> ${cv?'≤ λ·c':'≥ λ·d'}<sub>i</sub> keeps failing. ${s.q==='e'?'And no λ can fix it: 1/n² lies below every multiple of 1/n eventually. Sitting below a divergent series proves nothing (indeed Σ 1/n² converges).':'Try another λ.'}`);}});

lab('inttest',{cv:[280],ctl:[{t:'r',k:'p',l:'p',a:.4,b:2.5,s:.05,v:1},{t:'r',k:'n',l:'N',a:3,b:40,s:1,v:10,f:v=>v},{t:'c',k:'u',l:'draw rectangles to the left (under the curve)',v:false}],
draw(s,[P],out){const p=s.p,N=s.n,f=x=>Math.pow(x,-p),I=b=>Math.abs(p-1)<1e-9?Math.log(b):(Math.pow(b,1-p)-1)/(1-p);let S=0;P.begin([0,N+2],[0,1.15]).axes({xl:'x'});
  for(let n=1;n<=N;n++){S+=f(n);if(s.u){if(n>1)P.box(n-1,0,n,f(n),alpha(C.c3,.35),C.c3);}else P.box(n,0,n+1,f(n),alpha(C.c2,.3),C.c2);}P.fn(x=>x>=1?f(x):NaN,C.c1,2.4);
  out(`∫₁<sup>N+1</sup> = ${fmt(I(N+1),4)} &nbsp;≤&nbsp; Σ<sub>n=1..${N}</sub> 1/n<sup>p</sup> = <b>${fmt(S,4)}</b> &nbsp;≤&nbsp; 1 + ∫₁<sup>N</sup> = ${fmt(1+I(N),4)}<br>p = ${fmt(p,2)}: ${p>1?`<span class="ok">∫₁<sup>∞</sup> x<sup>−p</sup> dx = 1/(p − 1) = ${fmt(1/(p-1),3)} converges</span>, so the series converges (to something between ${fmt(1/(p-1),3)} and ${fmt(1+1/(p-1),3)}).`:`<span class="no">∫₁<sup>∞</sup> x<sup>−p</sup> dx diverges</span>, so the series diverges.`}`);}});

lab('rearr',{cv:[280],ctl:[{t:'s',k:'m',l:'Order of the terms',o:[['p','p positive terms, then q negative terms'],['t','greedy: steer towards a target']]},{t:'r',k:'p',l:'p',a:1,b:6,s:1,v:2,f:v=>v,w:s=>s.m==='p'},{t:'r',k:'q',l:'q',a:1,b:6,s:1,v:1,f:v=>v,w:s=>s.m==='p'},{t:'r',k:'T',l:'target',a:-1.5,b:3,s:.05,v:1.5,w:s=>s.m==='t'},{t:'r',k:'n',l:'terms used',a:20,b:800,s:10,v:120,f:v=>v}],
draw(s,[P],out){let S=0,ip=0,iq=0;const pts=[[0,0]],first=[];for(let k=0;k<s.n;k++){const pos=s.m==='p'?(k%(s.p+s.q))<s.p:S<=s.T;if(pos){S+=1/(2*ip+1);if(k<10)first.push('+1/'+(2*ip+1));ip++;}else{S-=1/(2*iq+2);if(k<10)first.push('−1/'+(2*iq+2));iq++;}pts.push([k+1,S]);}
  const lim=s.m==='p'?Math.LN2+.5*Math.log(s.p/s.q):s.T,ys=pts.map(p=>p[1]);P.begin([0,s.n],[Math.min(lim-.4,...ys.slice(5)),Math.max(lim+.4,...ys.slice(5))]).axes({xl:'number of terms'});
  P.hl(lim,C.c4,1.5,[5,4]);P.hl(Math.LN2,C.mute,1,[2,4]);P.txt('ln 2',s.n,Math.LN2,C.mute,'right',-4,9);P.path(pts,C.c1,1.6);
  out(`Order: ${first.join(' ').replace(/^\+/,'')} …<br>Sum after ${s.n} terms: <span class="k1">${fmt(S,5)}</span> &nbsp;·&nbsp; limit of this arrangement: <span class="k4">${s.m==='p'?`ln 2 + ½ ln(${s.p}/${s.q}) = `:''}${fmt(lim,5)}</span>${s.m==='p'&&s.p===2&&s.q===1?' = (3/2) ln 2, as in the notes':s.m==='p'&&s.p===s.q?' = ln 2: equal numbers of each, in blocks, do not change the sum':''} &nbsp;·&nbsp; used ${ip} positive and ${iq} negative terms.`);}});

const LS={a:['(−1)ⁿ',n=>n%2?-1:1],b:['sin(nπ/2)',n=>[0,1,0,-1][n%4]],c:['(−1)ⁿ(1 + 1/n)',n=>(n%2?-1:1)*(1+1/n)],d:['sin n',n=>Math.sin(n)],e:['1/n',n=>1/n],f:['(−1)ⁿ/n',n=>(n%2?-1:1)/n],g:['cos(n)·n/(n + 3)',n=>Math.cos(n)*n/(n+3)]};
lab('limsup',{cv:[270],ctl:[{t:'s',k:'q',l:'Sequence aₙ',o:Object.keys(LS).map(k=>[k,LS[k][0]])}],
draw(s,[P],out){const f=LS[s.q][1],H=20000,V=45,b=new Float64Array(H+2),c=new Float64Array(H+2);b[H+1]=-1/0;c[H+1]=1/0;for(let n=H;n>=1;n--){b[n]=Math.max(b[n+1],f(n));c[n]=Math.min(c[n+1],f(n));}
  P.begin([0,V+1],[Math.min(c[1],-.2)-.25,Math.max(b[1],.2)+.25]).axes({xl:'n'});const st=a=>{const p=[];for(let n=1;n<=V;n++){p.push([n-.5,a[n]]);p.push([n+.5,a[n]]);}return p;};
  P.path(st(b),C.c2,2);P.path(st(c),C.c3,2);P.pts(range(V,i=>[i+1,f(i+1)]),C.c1,3.3);P.legend([['bₙ = sup of the tail',C.c2],['aₙ',C.c1],['cₙ = inf of the tail',C.c3]]);
  const ls=b[H/2],li=c[H/2];out(`lim sup a<sub>n</sub> ≈ <span class="k2">${fmt(ls,3)}</span> &nbsp;·&nbsp; lim inf a<sub>n</sub> ≈ <span class="k3">${fmt(li,3)}</span> &nbsp;→&nbsp; ${Math.abs(ls-li)<.01?'<span class="ok">they agree, so the sequence converges</span> to that value.':'<span class="no">they differ, so the sequence has no limit</span>. Every subsequential limit lies between them.'}`);}});

const RR={x:['Example 34: 1, 1, 1/2, 1/3, 1/2², 1/3², …',n=>-Math.floor(n/2)*Math.log(n%2?3:2)],f:['1/n!',n=>{let t=0;for(let k=2;k<=n;k++)t-=Math.log(k);return t;}],h:['n/2ⁿ',n=>Math.log(n)-n*Math.LN2],s:['1/n²',n=>-2*Math.log(n)],e:['Exercise 25: (n/(n+1))^(n²) · 4ⁿ',n=>n*n*Math.log(n/(n+1))+n*Math.log(4)],z:['2^(−n + (−1)ⁿ)',n=>(-n+(n%2?-1:1))*Math.LN2]};
lab('rr',{cv:[280],ctl:[{t:'s',k:'q',l:'Series Σ aₙ',o:Object.keys(RR).map(k=>[k,RR[k][0]])}],
draw(s,[P],out){const la=RR[s.q][1],V=40,ra=n=>Math.exp(la(n+1)-la(n)),ro=n=>Math.exp(la(n)/n);P.begin([0,V+1],[0,2.6]).axes({xl:'n'});P.hl(1,C.bad,1.5,[5,4]);
  P.path(range(V,i=>[i+1,Math.min(ra(i+1),9)]),alpha(C.c3,.5),1);P.pts(range(V,i=>[i+1,ra(i+1)]),C.c3,3.2);P.pts(range(V,i=>[i+1,ro(i+1)]),C.c2,3.2);P.legend([['ratio |aₙ₊₁/aₙ|',C.c3],['root |aₙ|^(1/n)',C.c2]]);
  let a=1/0,b=-1/0,c=1/0,d=-1/0;for(let n=300;n<=340;n++){a=Math.min(a,ra(n));b=Math.max(b,ra(n));c=Math.min(c,ro(n));d=Math.max(d,ro(n));}const one=x=>Math.abs(x-1)<.03;
  out(`Ratio: lim inf ≈ ${a<1e-6?'0':fmt(a,3)}, lim sup ≈ ${b>50?'∞':fmt(b,3)} ${b-a<.02?'(limit exists)':'<span class="no">(no limit: ratio test fails)</span>'} &nbsp;·&nbsp; Root: lim sup ≈ <span class="k2">${fmt(d,3)}</span><br>Root test: ${one(d)?'lim sup = 1, <b>inconclusive</b> (here the series converges, but the test cannot tell).':d<1?'<span class="ok">lim sup &lt; 1, converges absolutely.</span>':'<span class="no">lim sup &gt; 1, diverges.</span>'}`);}});
})();

/* ===== Chapter 9: differentiation ===== */
(function(){
const SF={sq:['x²',x=>x*x,x=>2*x,[-1,5]],ab:['|x|',x=>Math.abs(x),x=>x===0?NaN:Math.sign(x),[-1,3]],si:['sin x',Math.sin,Math.cos,[-2,2]],cu:['x³ − x',x=>x*x*x-x,x=>3*x*x-1,[-3,3]],ex:['eˣ',Math.exp,Math.exp,[-1,7]]};
lab('secant',{cv:[310],ctl:[{t:'s',k:'f',l:'Function',o:Object.keys(SF).map(k=>[k,SF[k][0]]),v:'sq'},{t:'r',k:'x',l:'x',a:-2,b:2,s:.05,v:.5},{t:'r',k:'h',l:'h',a:-1.5,b:1.5,s:.01,v:1},{t:'c',k:'d',l:"show the derivative f′",v:false},{t:'b',l:'Kink: |x| at 0',on:(s)=>{s.f='ab';s.x=0;}}],
init(s,P,rd,sy){s._sy=sy;},
draw(s,[P],out){const m=SF[s.f],f=m[1],h=Math.abs(s.h)<.005?(s.h<0?-.005:.005):s.h,q=(f(s.x+h)-f(s.x))/h,d=m[2](s.x);const sel=P.cv.closest('.lab').querySelector('select');if(sel.value!==s.f)sel.value=s.f;
  P.begin([-2.6,2.6],m[3]).axes({xl:'x'});if(s.d)P.fn(m[2],C.c3,1.6,[2,3],s.f==='ab'?[0]:null);P.fn(f,C.c1,2.5);if(isFinite(d))P.fn(x=>f(s.x)+d*(x-s.x),C.c4,1.5,[6,4]);
  P.fn(x=>f(s.x)+q*(x-s.x),C.c2,2);P.dot(s.x,f(s.x),C.ink,4.5);P.dot(s.x+h,f(s.x+h),C.c2,4.5);P.legend([['secant',C.c2],['tangent',C.c4]].concat(s.d?[["f′",C.c3]]:[]));
  out(`Difference quotient (f(x + h) − f(x))/h with h = ${fmt(h,3)}: <span class="k2">${fmt(q,5)}</span> &nbsp;·&nbsp; ${isFinite(d)?`f′(${fmt(s.x,2)}) = <span class="k4">${fmt(d,5)}</span> &nbsp;·&nbsp; difference ${fmt(Math.abs(q-d),5)}`:'<span class="no">f′(0) does not exist</span>: the quotient is −1 for every h &lt; 0 and +1 for every h &gt; 0.'}`);}});

const MV={a:['x³ − x',x=>x*x*x-x,x=>3*x*x-1,[-2,2],[-3,3]],b:['sin x + x/2',x=>Math.sin(x)+x/2,x=>Math.cos(x)+.5,[-4,4],[-3,3]],c:['cos x  (try f(a) = f(b))',Math.cos,x=>-Math.sin(x),[-4,4],[-1.6,1.6]]};
lab('mvt',{cv:[290],ctl:[{t:'s',k:'f',l:'Function',o:Object.keys(MV).map(k=>[k,MV[k][0]])},{t:'r',k:'a',l:'a (fraction of the window)',a:0,b:.45,s:.005,v:.12,f:()=>''},{t:'r',k:'b',l:'b',a:.55,b:1,s:.005,v:.88,f:()=>''},{t:'b',l:'Make f(a) = f(b)',on:s=>{s.f='c';s.a=.25;s.b=.75;}}],
draw(s,[P],out){const m=MV[s.f],f=m[1],df=m[2],W=m[3],a=W[0]+(W[1]-W[0])*s.a,b=W[0]+(W[1]-W[0])*s.b,sl=(f(b)-f(a))/(b-a),c=[];const sel=P.cv.closest('.lab').querySelector('select');if(sel.value!==s.f)sel.value=s.f;
  P.begin(W,m[4]).axes({xl:'x'});P.fn(f,C.c1,2.5);P.seg(a,f(a),b,f(b),C.c2,2);P.dot(a,f(a),C.c2,5);P.dot(b,f(b),C.c2,5);P.txt('a',a,f(a),C.c2,'center',0,-12,1);P.txt('b',b,f(b),C.c2,'center',0,-12,1);
  const N=800;for(let i=0;i<N;i++){let u=a+(b-a)*i/N,v=a+(b-a)*(i+1)/N;if((df(u)-sl)*(df(v)-sl)<0){for(let k=0;k<40;k++){const w=(u+v)/2;(df(u)-sl)*(df(w)-sl)<=0?v=w:u=w;}c.push(u);}}
  c.forEach(x=>{const w=(W[1]-W[0])*.11;P.seg(x-w,f(x)-sl*w,x+w,f(x)+sl*w,C.c4,2.5);P.dot(x,f(x),C.c4,5);});
  out(`a = ${fmt(a,2)}, b = ${fmt(b,2)} &nbsp;·&nbsp; chord slope (f(b) − f(a))/(b − a) = <span class="k2">${fmt(sl,4)}</span> &nbsp;·&nbsp; f′(c) equals it at <span class="k4">c = ${c.map(x=>fmt(x,3)).join(', ')||'…'}</span>${Math.abs(sl)<.005?' &nbsp;(Rolle: horizontal tangent)':''}`);}});

const fc=[1];for(let i=1;i<20;i++)fc.push(fc[i-1]*i);
const TE={si:['sin x',(k,x)=>Math.sin(x+k*Math.PI/2),()=>1,[-7,7],[-3,3]],co:['cos x',(k,x)=>Math.cos(x+k*Math.PI/2),()=>1,[-7,7],[-3,3]],ex:['eˣ',(k,x)=>Math.exp(x),(n,lo,hi)=>Math.exp(hi),[-3,3],[-1,10]],ln:['ln x',(k,x)=>k===0?Math.log(x):(k%2?1:-1)*fc[k-1]/Math.pow(x,k),(n,lo)=>fc[n-1]/Math.pow(lo,n),[0,5],[-3,3]]};
lab('taylorerr',{cv:[310],ctl:[{t:'s',k:'f',l:'Function',o:Object.keys(TE).map(k=>[k,TE[k][0]])},{t:'r',k:'n',l:'n (error term uses the nth derivative)',a:1,b:9,s:1,v:4,f:v=>v},{t:'r',k:'c',l:'x₀ (position in window)',a:.1,b:.9,s:.01,v:.5,f:()=>''},{t:'r',k:'p',l:'probe x',a:.02,b:.98,s:.005,v:.72,f:()=>''}],
draw(s,[P],out){const m=TE[s.f],W=m[3],D=m[1],n=s.n,x0=W[0]+(W[1]-W[0])*s.c,xp=W[0]+(W[1]-W[0])*s.p,co=range(n,k=>D(k,x0)/fc[k]);
  const p=x=>{let v=0,t=1;for(let k=0;k<n;k++){v+=co[k]*t;t*=(x-x0);}return v;},B=x=>m[2](n,Math.min(x,x0),Math.max(x,x0))*Math.pow(Math.abs(x-x0),n)/fc[n],f=x=>D(0,x),lo=s.f==='ln'?.06:W[0];
  P.begin(W,m[4]).axes({xl:'x'});const up=[],dn=[];for(let i=0;i<=300;i++){const x=lo+(W[1]-lo)*i/300,b=Math.min(B(x),50);up.push([x,clamp(p(x)+b,-60,60)]);dn.push([x,clamp(p(x)-b,-60,60)]);}
  P.poly(up.concat(dn.reverse()),alpha(C.c2,.18));P.fn(x=>x>=lo?f(x):NaN,C.c1,2.5);P.fn(p,C.c2,2);P.vl(x0,C.mute,1,[3,4]);P.dot(x0,f(x0),C.ink,4.5);P.seg(xp,f(xp),xp,p(xp),C.c5,3);P.dot(xp,f(xp),C.c1,4.5);P.dot(xp,p(xp),C.c2,4.5);
  P.legend([['f',C.c1],['Taylor polynomial, degree '+(n-1),C.c2]]);
  out(`x₀ = ${fmt(x0,2)}, x = ${fmt(xp,2)} &nbsp;·&nbsp; f(x) = ${fmt(f(xp),5)}, polynomial = ${fmt(p(xp),5)}<br>actual error <span class="k5">${fmt(Math.abs(f(xp)-p(xp)),6)}</span> &nbsp;≤&nbsp; Lagrange bound max|f<sup>(${n})</sup>|·|x − x₀|<sup>${n}</sup>/${n}! = <span class="k2">${fmt(B(xp),6)}</span>`);}});

const LH={a:['sin x / x  at 0',Math.sin,x=>x,Math.cos,()=>1,0,1],b:['(eˣ − 1)/(x − x³)  at 0',x=>Math.exp(x)-1,x=>x-x*x*x,Math.exp,x=>1-3*x*x,0,1],c:['(2 sin x − sin 2x)/(x − sin x)  at 0',x=>2*Math.sin(x)-Math.sin(2*x),x=>x-Math.sin(x),x=>2*Math.cos(x)-2*Math.cos(2*x),x=>1-Math.cos(x),0,6],d:['(1 − cos x)/x²  at 0',x=>1-Math.cos(x),x=>x*x,Math.sin,x=>2*x,0,.5],e:['(x² − 1)/(x − 1)  at 1',x=>x*x-1,x=>x-1,x=>2*x,()=>1,1,2]};
lab('lhop',{cv:[260,260],ctl:[{t:'s',k:'q',l:'Quotient f/g',o:Object.keys(LH).map(k=>[k,LH[k][0]])},{t:'r',k:'z',l:'zoom',a:0,b:1,s:.01,v:.25,f:()=>''}],
draw(s,[P,Q],out){const m=LH[s.q],c=m[5],w=3*Math.pow(10,-1.6*s.z),xs=range(201,i=>c-w+2*w*i/200),mx=Math.max(...xs.map(x=>Math.max(Math.abs(m[1](x)),Math.abs(m[2](x)))))*1.1;
  P.begin([c-w,c+w],[-mx,mx],{L:50}).axes({xl:'x'});P.fn(m[1],C.c1,2.3);P.fn(m[2],C.c3,2.3);P.dot(c,0,C.ink,4.5);P.legend([['f',C.c1],['g',C.c3]]);
  const q=x=>Math.abs(x-c)<1e-9?NaN:m[1](x)/m[2](x),dq=x=>{const d=m[4](x);return Math.abs(d)<1e-12?NaN:m[3](x)/d;},vs=xs.map(q).filter(v=>isFinite(v)&&Math.abs(v-m[6])<6),sp=Math.max(.4,...vs.map(v=>Math.abs(v-m[6])))*1.2;
  Q.begin([c-w,c+w],[m[6]-sp,m[6]+sp],{L:50}).axes({xl:'x'});Q.hl(m[6],C.c4,1,[4,4]);Q.fn(dq,C.c2,1.6,[6,4],[c]);Q.fn(q,C.c1,2.3,null,[c]);Q.dot(c,m[6],C.c1,5,true);Q.legend([['f/g',C.c1],["f′/g′",C.c2]]);
  out(`Window x = ${fmt(c,0)} ± ${fmt(w,3)} &nbsp;·&nbsp; f/g at x = ${fmt(c+w/4,4)}: <span class="k1">${fmt(q(c+w/4),5)}</span> &nbsp;·&nbsp; f′/g′ there: <span class="k2">${fmt(dq(c+w/4),5)}</span> &nbsp;·&nbsp; limit <span class="k4">${m[6]}</span>${s.q==='c'?' (f′/g′ is itself 0/0 here; the rule is applied three times)':s.q==='d'?' (applied twice)':''}`);}});

const FT={a:['sin x',Math.sin,[0,7],[-1.3,1.3],[-.3,2.3]],b:['cos 2x + ½',x=>Math.cos(2*x)+.5,[0,7],[-.8,1.8],[-.3,4.3]],c:['1/(1 + x²)',x=>1/(1+x*x),[-4,4],[-.2,1.2],[-.2,3]],d:['x/2 − 1',x=>x/2-1,[0,6],[-1.2,2.2],[-1.2,3.2]]};
lab('ftc',{cv:[200,200],ctl:[{t:'s',k:'f',l:'f(x)',o:Object.keys(FT).map(k=>[k,FT[k][0]])},{t:'r',k:'t',l:'y',a:.02,b:.9,s:.005,v:.3,f:()=>''},{t:'r',k:'h',l:'h',a:.01,b:.6,s:.01,v:.3}],
init(s,[P,Q]){P.cv.style.flex=Q.cv.style.flex='1 1 100%';},
draw(s,[P,Q],out){const m=FT[s.f],f=m[1],a=m[2][0],b=m[2][1],y=a+(b-a)*s.t,h=Math.min(s.h,b-y),F=x=>{const n=200,d=(x-a)/n;let t=f(a)+f(x);for(let i=1;i<n;i++)t+=f(a+i*d)*(i%2?4:2);return t*d/3;};
  P.begin(m[2],m[3]).axes({yl:'f'});P.area(f,a,y,alpha(C.c1,.28));P.area(f,y,y+h,alpha(C.c2,.5));P.fn(f,C.c1,2.3);P.vl(y,C.ink,1,[3,3]);P.dot(y,f(y),C.ink,4.5);P.txt('y',y,m[3][0],C.ink,'center',0,-9,1);
  Q.begin(m[2],m[4]).axes({xl:'y',yl:'F(y) = area from a to y'});Q.fn(F,C.c3,2.3);const q=(F(y+h)-F(y))/h;Q.seg(y,F(y),y+h,F(y+h),C.c2,2.5);Q.fn(x=>F(y)+f(y)*(x-y),C.c4,1.3,[5,4]);Q.dot(y,F(y),C.ink,4.5);Q.dot(y+h,F(y+h),C.c2,4.5);
  out(`y = ${fmt(y,2)} &nbsp;·&nbsp; F(y) = ${fmt(F(y),4)} &nbsp;·&nbsp; strip area F(y + h) − F(y) = ${fmt(F(y+h)-F(y),5)} &nbsp;·&nbsp; divided by h: <span class="k2">${fmt(q,5)}</span> &nbsp;·&nbsp; f(y) = <span class="k4">${fmt(f(y),5)}</span>`);}});
})();

/* ===== Chapter 10: power series ===== */
(function(){
const lf=[0];for(let i=1;i<200;i++)lf.push(lf[i-1]+Math.log(i));const fc=[1];for(let i=1;i<60;i++)fc.push(fc[i-1]*i);
const RA={one:['aₙ = 1  (geometric)',()=>0,1],sq:['aₙ = n²  (Example 38)',n=>2*Math.log(n),1],inv:['aₙ = 1/n',n=>-Math.log(n),1],fa:['aₙ = 1/n!  (exponential)',n=>-lf[n],1/0],nf:['aₙ = n!',n=>lf[n],0],two:['aₙ = 2ⁿ',n=>n*Math.LN2,.5],ex:['Example 37: 1/2ᵏ and 1/3ᵏ alternating',n=>-Math.floor(n/2)*Math.log(n%2?3:2),Math.SQRT2],ln:['aₙ = 1/(n·2ⁿ)  (ln x about 2)',n=>-Math.log(n)-n*Math.LN2,2]};
lab('radius',{cv:[250,250],ctl:[{t:'s',k:'q',l:'Coefficients',o:Object.keys(RA).map(k=>[k,RA[k][0]])},{t:'r',k:'x',l:'|x − c|',a:.05,b:3,s:.01,v:.8}],
draw(s,[P,Q],out){const m=RA[s.q],la=m[1],r=m[2],V=40,ro=range(V,i=>[i+1,Math.exp(la(i+1)/(i+1))]),ra=range(V,i=>[i+1,Math.exp(la(i+2)-la(i+1))]),top=clamp(Math.max(...ro.map(p=>p[1]))*1.15,1.6,6);
  P.begin([0,V+1],[0,top]).axes({xl:'n'});if(r>0&&isFinite(r)){P.hl(1/r,C.c4,1.5,[5,4]);P.txt('1/r',V+1,1/r,C.c4,'right',-4,-9,1);}P.pts(ra,alpha(C.c3,.8),2.6);P.pts(ro,C.c2,3.2);P.legend([['|aₙ|^(1/n)',C.c2],['|aₙ₊₁/aₙ|',C.c3]]);
  const T=range(V,i=>[i+1,(la(i+1)+(i+1)*Math.log(s.x))/Math.LN10]),ys=T.map(p=>p[1]);Q.begin([0,V+1],[Math.max(-30,Math.min(-1,...ys)-1),Math.min(30,Math.max(1,...ys)+1)],{L:40}).axes({xl:'n',yl:'log₁₀ |aₙ(x − c)ⁿ|'});Q.pts(T,C.c1,3.2);
  const rs=r===0?'0':isFinite(r)?fmt(r,4):'∞';out(`Radius of convergence r = <b>${rs}</b>${s.q==='ex'?' = √2':''} &nbsp;·&nbsp; |x − c| = ${fmt(s.x,2)}: ${s.x<r-.004?'<span class="ok">inside the radius: the terms decay geometrically and the series converges absolutely</span>':s.x>r+.004?'<span class="no">outside the radius: the terms grow and the series diverges</span>':'<b>on the boundary</b>: the theorem is silent; each end-point needs its own argument'}.${r===0?' With aₙ = n! the series converges only at x = c.':''}`);}});

const CP={g:['1/(1 − x)',n=>1],e:['eˣ',n=>1/fc[n]],a:['1/(1 + x)',n=>n%2?-1:1],t:['3x',n=>n===1?3:0],s:['1/(1 + x²)',n=>n%2?0:(n%4?-1:1)],l:['ln(1 + x)',n=>n?(n%2?1:-1)/n:0],h:['½ · 1/(1 − x)',n=>.5],k:['−⅙ · 1/(1 − x/3)',n=>-1/(6*3**n)]};
lab('cauchyprod',{cv:[],ctl:[{t:'s',k:'f',l:'f(x)',o:Object.keys(CP).map(k=>[k,CP[k][0]]),v:'g'},{t:'s',k:'g',l:'g(x)',o:Object.keys(CP).map(k=>[k,CP[k][0]]),v:'g'}],
draw(s,P,out){const a=CP[s.f][1],b=CP[s.g][1];let r='';for(let n=0;n<=8;n++){let c=0;const parts=[];for(let i=0;i<=n;i++){c+=a(i)*b(n-i);}r+=`<tr><td>x<sup>${n}</sup></td><td>${fmt(a(n),4)}</td><td>${fmt(b(n),4)}</td><td class="k4">${fmt(a(n)+b(n),4)}</td><td class="k2">${fmt(c,4)}</td></tr>`;}
  const k=[s.f,s.g].sort().join(''),nt={gg:'f·g = 1/(1 − x)²: coefficients 1, 2, 3, …',ee:'f·g = e^(2x): coefficients 2ⁿ/n!',ag:'f·g = 1/(1 − x²): 1, 0, 1, 0, …',st:'f·g = 3x/(1 + x²) = 3x − 3x³ + 3x⁵ − … (Exercise 31 i)',hk:'f + g = 1/((x − 1)(x − 3)) (Exercise 31 ii): coefficients ½ − 1/(6·3ⁿ)',ae:'',el:''}[k]||'';
  out(`<table><tr><th>power</th><th>aₙ (of f)</th><th>bₙ (of g)</th><th>f + g: aₙ + bₙ</th><th>f·g: a₀bₙ + a₁bₙ₋₁ + … + aₙb₀</th></tr>${r}</table>${nt}`);}});

const TY={cube:['(1 + x)³ about 0',x=>(1+x)**3,(k)=>[1,3,3,1][k]||0,()=>1/0,[-3,2],[-4,10]],geo:['1/(1 − x), movable centre',x=>1/(1-x),(k,c)=>Math.pow(1-c,-(k+1)),c=>Math.abs(1-c),[-3,3],[-6,8],[-2,.6],[1]],
  ln1:['ln(1 + x) about 0',x=>x>-1?Math.log(1+x):NaN,k=>k?(k%2?1:-1)/k:0,()=>1,[-1.5,3],[-4,3]],sin:['sin x about 0',Math.sin,k=>k%2?(k%4===1?1:-1)/fc[k]:0,()=>1/0,[-10,10],[-3,3]],cos:['cos x about 0',Math.cos,k=>k%2?0:(k%4?-1:1)/fc[k],()=>1/0,[-10,10],[-3,3]],
  exp:['eˣ about 0',Math.exp,k=>1/fc[k],()=>1/0,[-4,4],[-2,12]],lnx:['ln x, movable centre',x=>x>0?Math.log(x):NaN,(k,c)=>k?(k%2?1:-1)/(k*Math.pow(c,k)):Math.log(c),c=>c,[0,7],[-3,3],[.5,3.5]],bump:['exp(−1/x²) about 0  (Example 39)',x=>x===0?0:Math.exp(-1/(x*x)),()=>0,()=>0,[-3,3],[-.3,1.2]]};
lab('taylor',{cv:[320],ctl:[{t:'s',k:'f',l:'Function',o:Object.keys(TY).map(k=>[k,TY[k][0]]),v:'sin'},{t:'r',k:'n',l:'highest power n',a:0,b:25,s:1,v:5,f:v=>v},{t:'r',k:'c',l:'centre c',a:0,b:1,s:.01,v:.6,f:()=>'',w:s=>!!TY[s.f][6]},{t:'r',k:'p',l:'probe x',a:.02,b:.98,s:.005,v:.7,f:()=>''}],
draw(s,[P],out){const m=TY[s.f],W=m[4],c=m[6]?m[6][0]+(m[6][1]-m[6][0])*s.c:0,r=m[3](c),co=range(s.n+1,k=>m[2](k,c)),p=x=>{let v=0;for(let k=s.n;k>=0;k--)v=v*(x-c)+co[k];return v;},xp=W[0]+(W[1]-W[0])*s.p;
  P.begin(W,m[5]).axes({xl:'x'});if(r>0)P.box(Math.max(W[0],c-r),P.y0,Math.min(W[1],c+r),P.y1,alpha(C.c4,.13));P.fn(m[1],C.c1,2.5,null,m[7]);P.fn(p,C.c2,2);P.vl(c,C.mute,1,[3,4]);P.dot(c,m[1](c),C.ink,4.5);
  if(isFinite(m[1](xp))){P.dot(xp,m[1](xp),C.c1,4.5);P.dot(xp,clamp(p(xp),-1e3,1e3),C.c2,4.5);}P.legend([['f',C.c1],['partial sum fₙ, n = '+s.n,C.c2]]);
  const ins=Math.abs(xp-c)<r;out(`Centre c = ${fmt(c,2)} &nbsp;·&nbsp; radius of convergence <b>${r===0?'none: the series is identically 0 and matches f only at 0':isFinite(r)?fmt(r,2):'∞'}</b>${isFinite(r)&&r>0?` &nbsp;(interval ${fmt(c-r,2)} to ${fmt(c+r,2)})`:''}<br>At x = ${fmt(xp,2)}: f(x) = ${fmt(m[1](xp),5)}, &nbsp; f<sub>${s.n}</sub>(x) = <span class="k2">${fmt(p(xp),5)}</span>, &nbsp; error ${fmt(Math.abs(m[1](xp)-p(xp)),5)} &nbsp; ${r===0?'':ins?'<span class="ok">inside: the error → 0 as n grows</span>':'<span class="no">outside: adding terms does not help</span>'}`);}});

lab('ode',{cv:[290],ctl:[{t:'r',k:'k',l:'k',a:-2,b:2,s:.05,v:1},{t:'r',k:'a',l:'a₀ = y(0)',a:-2,b:3,s:.1,v:1},{t:'r',k:'n',l:'terms kept (up to xⁿ)',a:0,b:15,s:1,v:3,f:v=>v}],
draw(s,[P],out){const a=[s.a];for(let i=0;i<s.n;i++)a.push(s.k*a[i]/(i+1));const p=x=>{let v=0;for(let k=s.n;k>=0;k--)v=v*x+a[k];return v;};
  P.begin([-3,3],[-4,8]).axes({xl:'x',yl:'y'});P.fn(x=>s.a*Math.exp(s.k*x),C.c1,2.5);P.fn(p,C.c2,2);P.dot(0,s.a,C.ink,4.5);P.legend([['a₀·e^(kx)',C.c1],['series up to xⁿ',C.c2]]);
  out(`Recurrence a<sub>i+1</sub> = k·a<sub>i</sub>/(i + 1) from a₀ = ${fmt(s.a,1)}: &nbsp; ${a.slice(0,7).map((v,i)=>`a<sub>${i}</sub> = ${fmt(v,4)}`).join(', &nbsp;')}${s.n>6?', …':''}<br>These are a₀·kⁱ/i!, the coefficients of a₀·e<sup>kx</sup>.`);}});
})();

/* ===== Chapter 11: multivariate ===== */
(function(){
const SU={par:['x² + y²  (paraboloid)',()=>(x,y)=>x*x+y*y,[-2,2],[-2,2],[0,8]],hyp:['x²/a² − y²/b²  (hyperboloid, a saddle)',s=>(x,y)=>x*x/(s.a*s.a)-y*y/(s.b*s.b),[-2,2],[-2,2],[-4,4]],x3:['x³y²',()=>(x,y)=>x*x*x*y*y,[-2,2],[-2,2],[-8,8]],dome:['−x² − y²',()=>(x,y)=>-x*x-y*y,[-2,2],[-2,2],[-8,0]],
  e52:['x³ − 12x + y³ − 3y  (Example 52)',()=>(x,y)=>x*x*x-12*x+y*y*y-3*y,[-3.4,3.4],[-2.4,2.4],[-22,22]],d1:['x² + y⁴  (degenerate minimum)',()=>(x,y)=>x*x+y**4,[-1.6,1.6],[-1.6,1.6],[0,6]],d2:['x² − y⁴  (degenerate saddle)',()=>(x,y)=>x*x-y**4,[-1.6,1.6],[-1.6,1.6],[-5,3]],
  e32:['xy(x² − y²)/(x² + y²)  (Exercise 32)',()=>(x,y)=>x===0&&y===0?0:x*y*(x*x-y*y)/(x*x+y*y),[-2,2],[-2,2],[-2,2]]};
const CR=[[2,1],[-2,-1],[-2,1],[2,-1]];
function cls(a,b,c){const D=b*b-a*c;return Math.abs(D)<1e-3?'<b>degenerate</b> (b² − ac = 0): the second derivatives cannot decide':D>0?'<span class="k5">saddle point</span> (b² − ac &gt; 0)':a>0?'<span class="ok">minimum</span> (b² − ac &lt; 0, a &gt; 0)':'<span class="k2">maximum</span> (b² − ac &lt; 0, a &lt; 0)';}
lab('surf',{cv:[330,330],ctl:[{t:'s',k:'f',l:'Function',o:Object.keys(SU).map(k=>[k,SU[k][0]]),on:(s)=>{s.px=.8;s.py=.5;s.ci=0;}},{t:'r',k:'a',l:'a',a:.5,b:2,s:.05,v:1,w:s=>s.f==='hyp'},{t:'r',k:'b',l:'b',a:.5,b:2,s:.05,v:1,w:s=>s.f==='hyp'},
  {t:'b',l:'Jump to the next critical point',on:s=>{const p=CR[s.ci%4];s.ci++;s.px=p[0];s.py=p[1];},w:s=>s.f==='e52'},{t:'b',l:'Go to (0, 0)',on:s=>{s.px=0;s.py=0;},w:s=>s.f!=='e52'}],
init(s,[P,Q],rd){s.px=.8;s.py=.5;s.yaw=-.6;s.pitch=.55;s.ci=0;rotatable(P,s,rd);Q.onDrag((x,y)=>{const m=SU[s.f];s.px=clamp(x,m[2][0],m[2][1]);s.py=clamp(y,m[3][0],m[3][1]);rd();});},
draw(s,[P,Q],out){const m=SU[s.f],f=m[1](s),x=s.px,y=s.py,h=1e-3,fx=(f(x+h,y)-f(x-h,y))/(2*h),fy=(f(x,y+h)-f(x,y-h))/(2*h);
  const a=(f(x+h,y)-2*f(x,y)+f(x-h,y))/(h*h),c=(f(x,y+h)-2*f(x,y)+f(x,y-h))/(h*h),b=(f(x+h,y+h)-f(x+h,y-h)-f(x-h,y+h)+f(x-h,y-h))/(4*h*h);
  surface(P,f,{x:m[2],y:m[3],z:m[4],yaw:s.yaw,pitch:s.pitch,pt:[x,y]});Q.sq(0,m[3]).axes({nox:1,noy:1});heat(Q,f,m[4][0],m[4][1],16);Q.px('x →',Q.w-28,Q.h-12,C.ink);Q.px('y ↑',8,12,C.ink);
  Q.hl(y,C.c3,1.5);Q.vl(x,C.c4,1.5);let gm=0;for(let i=0;i<=8;i++)for(let j=0;j<=8;j++){const u=m[2][0]+(m[2][1]-m[2][0])*i/8,v=m[3][0]+(m[3][1]-m[3][0])*j/8;gm=Math.max(gm,Math.hypot((f(u+h,v)-f(u-h,v))/(2*h),(f(u,v+h)-f(u,v-h))/(2*h)));}
  const k=.3*(m[2][1]-m[2][0])/gm,g=Math.hypot(fx,fy);if(g>1e-3)Q.arrow(x,y,x+fx*k,y+fy*k,C.ink,2.5);Q.dot(x,y,C.ink,5);
  const z0=v=>Math.abs(v)<1e-5?0:v;
  out(`At (${fmt(x,2)}, ${fmt(y,2)}): f = ${fmt(f(x,y),3)} &nbsp;·&nbsp; <span class="k3">∂f/∂x = ${fmt(fx,3)}</span> &nbsp;·&nbsp; <span class="k4">∂f/∂y = ${fmt(fy,3)}</span> &nbsp;·&nbsp; ∇f = (${fmt(fx,3)}, ${fmt(fy,3)}), length ${fmt(g,3)}<br>Second derivatives: a = ∂²f/∂x² = ${fmt(z0(a),2)}, &nbsp; b = ∂²f/∂x∂y = ${fmt(z0(b),2)}, &nbsp; c = ∂²f/∂y² = ${fmt(z0(c),2)}${g<.02?` &nbsp;→&nbsp; critical point: ${s.f==='e32'?'(the mixed derivative is not well defined here: taken in the two orders it gives −1 and +1)':cls(a,b,c)}`:''}`);}});

lab('chain',{cv:[],ctl:[{t:'r',k:'u',l:'u₁',a:-2,b:2,s:.05,v:.4},{t:'r',k:'v',l:'u₂',a:-2,b:2,s:.05,v:-.3}],
draw(s,P,out){const z=(u,v)=>Math.sin(3*u+5*v)+6*Math.cos(2*u-v),x1=3*s.u+5*s.v,x2=2*s.u-s.v,h=1e-5,A=Math.cos(x1),B=-6*Math.sin(x2);
  out(`x₁ = 3u₁ + 5u₂ = ${fmt(x1,3)}, &nbsp; x₂ = 2u₁ − u₂ = ${fmt(x2,3)}, &nbsp; ∂z/∂x₁ = cos x₁ = ${fmt(A,4)}, &nbsp; ∂z/∂x₂ = −6 sin x₂ = ${fmt(B,4)}
  <table><tr><th></th><th>route through x₁</th><th>route through x₂</th><th>sum (chain rule)</th><th>finite difference</th></tr>
  <tr><td>∂z/∂u₁</td><td>${fmt(A,4)} × 3 = ${fmt(3*A,4)}</td><td>${fmt(B,4)} × 2 = ${fmt(2*B,4)}</td><td class="k2">${fmt(3*A+2*B,5)}</td><td class="k4">${fmt((z(s.u+h,s.v)-z(s.u-h,s.v))/(2*h),5)}</td></tr>
  <tr><td>∂z/∂u₂</td><td>${fmt(A,4)} × 5 = ${fmt(5*A,4)}</td><td>${fmt(B,4)} × (−1) = ${fmt(-B,4)}</td><td class="k2">${fmt(5*A-B,5)}</td><td class="k4">${fmt((z(s.u,s.v+h)-z(s.u,s.v-h))/(2*h),5)}</td></tr></table>`);}});

lab('crit1',{cv:[240],ctl:[{t:'r',k:'n',l:'n',a:2,b:7,s:1,v:2,f:v=>v},{t:'s',k:'g',l:'sign of the nth derivative',o:[['1','positive'],['-1','negative']]}],
draw(s,[P],out){const g=+s.g;P.begin([-1.5,1.5],[-1.6,1.6]).axes({xl:'y'});P.fn(y=>g*Math.pow(y,s.n),C.c1,2.5);P.dot(0,0,C.ink,5);
  out(`f(y) = ${g<0?'−':''}y<sup>${s.n}</sup>: first non-zero derivative at 0 is f<sup>(${s.n})</sup>(0) = ${g<0?'−':''}${s.n}! &nbsp;→&nbsp; n is ${s.n%2?'odd':'even'}: <b>${s.n%2?'point of inflection':g>0?'minimum':'maximum'}</b>`);}});

lab('quad',{cv:[250,250,250],ctl:[{t:'r',k:'a',l:'a',a:-10,b:10,s:.5,v:6},{t:'r',k:'b',l:'b',a:-10,b:10,s:.5,v:7},{t:'r',k:'c',l:'c',a:-10,b:10,s:.5,v:10},{t:'b',l:'Example 49',on:s=>{s.a=6;s.b=7;s.c=10;}},{t:'b',l:'Example 50',on:s=>{s.a=6;s.b=8;s.c=10;}}],
init(s,[P],rd){s.yaw=-.5;s.pitch=.5;rotatable(P,s,rd);},
draw(s,[P,Q,R],out){const {a,b,c}=s,f=(x,y)=>.5*(a*x*x+2*b*x*y+c*y*y),zm=Math.max(1,Math.abs(f(1,1)),Math.abs(f(1,-1)),Math.abs(f(1,0)),Math.abs(f(0,1)));
  surface(P,f,{x:[-1,1],y:[-1,1],z:[-zm,zm],yaw:s.yaw,pitch:s.pitch,n:22});Q.sq(0,[-1,1]).axes({nox:1,noy:1});heat(Q,f,-zm,zm,22);Q.dot(0,0,C.ink,4.5);
  const q=t=>a*t*t+2*b*t+c,ym=Math.max(4,Math.abs(c)*1.5,Math.abs(q(-b/(a||1)))*1.5);R.begin([-4,4],[-ym,ym]).axes({xl:'t',yl:'at² + 2bt + c'});R.fn(q,C.c1,2.5);
  const D=b*b-a*c,tr=a+c,det=a*c-b*b,sq=Math.sqrt(Math.max(0,tr*tr-4*det)),e1=(tr+sq)/2,e2=(tr-sq)/2;
  out(`H = [[${a}, ${b}], [${b}, ${c}]] &nbsp;·&nbsp; b² − ac = <b>${fmt(D,2)}</b> &nbsp;·&nbsp; det H = ${fmt(det,2)}, tr H = ${fmt(tr,2)} &nbsp;·&nbsp; eigenvalues <b>${fmt(e1,3)}</b> and <b>${fmt(e2,3)}</b><br>The critical point (0, 0) is a ${cls(a,b,c)}.`);}});
})();

/* ===== Chapter 12: numerical methods ===== */
(function(){
const CW={lin:['F(x) = a·x',s=>x=>s.a*x,[-3,3],s=>[[0,s.a]]],cos:['F(x) = cos x',()=>Math.cos,[-3,3],()=>[[.7390851332,-Math.sin(.7390851332)]]],cube:['F(x) = x³',()=>x=>x*x*x,[-1.6,1.6],()=>[[-1,3],[0,0],[1,3]]]};
lab('cobweb',{cv:[340],ctl:[{t:'s',k:'f',l:'Map',o:Object.keys(CW).map(k=>[k,CW[k][0]]),on:s=>{s.x=s.f==='cube'?.5:.4;s._s&&s._s();}},{t:'r',k:'a',l:'a',a:-1.6,b:1.6,s:.05,v:.7,w:s=>s.f==='lin'},{t:'r',k:'x',l:'x₀ (fraction of window)',a:.02,b:.98,s:.005,v:.82,f:()=>''},{t:'r',k:'n',l:'iterations',a:1,b:40,s:1,v:12,f:v=>v}],
draw(s,[P],out){const m=CW[s.f],F=m[1](s),W=m[2],x0=W[0]+(W[1]-W[0])*s.x;P.sq(0,W);P.g.strokeStyle=C.grid;for(let v=Math.ceil(W[0]);v<=W[1];v++){P.seg(v,W[0],v,W[1],C.grid,1);P.seg(P.x0,v,P.x1,v,C.grid,1);}
  P.seg(P.x0,0,P.x1,0,C.mute,1);P.seg(0,W[0],0,W[1],C.mute,1);
  for(let v=Math.ceil(P.x0);v<=P.x1;v++)if(v!==0&&v>P.x0+.25&&v<P.x1-.25)P.txt(String(v),v,0,C.mute,'center',0,11);
  for(let v=Math.ceil(W[0]);v<=W[1];v++)if(v!==0&&v>W[0]+.25&&v<W[1]-.25)P.txt(String(v),0,v,C.mute,'left',6,-1);
  P.fn(x=>x,C.mute,1.5,[5,4]);P.fn(F,C.c1,2.5);const pts=[[x0,x0]];let x=x0;for(let i=0;i<s.n;i++){const y=clamp(F(x),-50,50);pts.push([x,y],[y,y]);x=y;}
  P.path(pts,C.c2,1.6);P.dot(x0,x0,C.c2,5);P.dot(x,x,C.ink,4.5);m[3](s).forEach(p=>P.dot(p[0],p[0],Math.abs(p[1])<1?C.c4:C.bad,6,true));{const g=P.g;g.font='12px '+FONT;const t='y = x',tw=g.measureText(t).width,tx=P.X(W[1])-8,ty=P.Y(W[1])+20;
   g.fillStyle=alpha(C.panel,.85);g.fillRect(tx-tw-4,ty-8,tw+8,16);P.px(t,tx-tw,ty,C.mute);}
  out(`x₀ = ${fmt(x0,3)} &nbsp;→&nbsp; after ${s.n} iterations: <b>${fmt(x,6)}</b><br>Fixed points: ${m[3](s).map(p=>`x* = ${fmt(p[0],4)} with |F′(x*)| = ${fmt(Math.abs(p[1]),3)} → ${Math.abs(p[1])<1?'<span class="ok">attractor</span>':Math.abs(p[1])>1?'<span class="no">repellor</span>':'<b>neutral</b> (|F′| = 1: neither)'}`).join(' &nbsp;·&nbsp; ')}`);}});

const NW={a:['cos x − x³',x=>Math.cos(x)-x**3,x=>-Math.sin(x)-3*x*x,[-1,2],[-3,2],.5],b:['cos x − x',x=>Math.cos(x)-x,x=>-Math.sin(x)-1,[-1,2.5],[-2.5,1.5],1.5],c:['x² − 2',x=>x*x-2,x=>2*x,[0,2.6],[-2.5,4.5],1.5],d:['x³ − 3x² + 3  (Exercise 1)',x=>x**3-3*x*x+3,x=>3*x*x-6*x,[-1.5,3.5],[-3,4],1],e:['cos(x/2)  (root at π)',x=>Math.cos(x/2),x=>-.5*Math.sin(x/2),[0,5],[-1,1.2],1.5]};
lab('newton',{cv:[320],ctl:[{t:'s',k:'f',l:'Solve f(x) = 0 for f(x) =',o:Object.keys(NW).map(k=>[k,NW[k][0]]),on:(s,sy)=>{const m=NW[s.f];s.x=(m[5]-m[3][0])/(m[3][1]-m[3][0]);sy();}},{t:'r',k:'x',l:'starting guess x₀',a:.02,b:.98,s:.002,v:.5,f:()=>''},{t:'r',k:'k',l:'tangents drawn',a:1,b:8,s:1,v:3,f:v=>v},{t:'r',k:'g',l:'damping γ',a:.1,b:1,s:.05,v:1},
  {t:'b',l:'Exercise 1: start at 0.25',on:s=>{s.f='d';s.x=(.25+1.5)/5;}}],
draw(s,[P],out){const m=NW[s.f],f=m[1],df=m[2],W=m[3],x0=W[0]+(W[1]-W[0])*s.x,xs=[x0];const sel=P.cv.closest('.lab').querySelector('select');if(sel.value!==s.f)sel.value=s.f;
  for(let i=0;i<2000;i++){const x=xs[xs.length-1];if(Math.abs(f(x))<1e-12||df(x)===0||!isFinite(x))break;xs.push(x-s.g*f(x)/df(x));}const root=xs[xs.length-1],okc=Math.abs(f(root))<1e-12;
  P.begin(W,m[4]).axes({xl:'x'});P.fn(f,C.c1,2.5);for(let i=0;i<Math.min(s.k,xs.length-1);i++){const x=xs[i],t=x-f(x)/df(x);P.seg(x,0,x,f(x),C.mute,1,[3,3]);P.seg(x,f(x),t,0,alpha(C.c2,1-.09*i),2);P.dot(x,f(x),C.c2,4);P.dot(xs[i+1],0,C.ink,3.5);P.txt('x'+'₀₁₂₃₄₅₆₇₈'[i],x,0,C.ink,'center',0,11,1);}
  if(okc)P.dot(root,0,C.c4,6,true);let rows='';xs.slice(0,8).forEach((x,i)=>{rows+=`<tr><td>x<sub>${i}</sub></td><td class="mono">${x.toFixed(12)}</td><td>${fmt(Math.abs(f(x)),3)}</td><td>${okc?fmt(Math.abs(x-root),3):'—'}</td></tr>`;});
  out(`${okc?`<span class="ok">Converged</span> to <b>${root.toFixed(10)}</b> in <b>${xs.length-1}</b> iteration${xs.length===2?'':'s'} (stopping when |f(x)| &lt; 10⁻¹²).`:'<span class="no">Did not converge</span> in 2000 iterations from this start.'}${s.f==='e'&&Math.abs(s.g-.1)<.01?' With γ = 0.1 this is the run in the notes.':''}<table><tr><th></th><th>iterate</th><th>|f(xₙ)|</th><th>distance to the limit</th></tr>${rows}</table>`);}});

const GD={a:['x²',x=>x*x,x=>2*x,()=>2,[-2,2],[-.5,4.2],1.5,0],b:['x⁴ − 3x³ + 1',x=>x**4-3*x**3+1,x=>4*x**3-9*x*x,x=>12*x*x-18*x,[-.6,3.2],[-8,3],2,2.25]};
lab('gd1',{cv:[270,270],ctl:[{t:'s',k:'f',l:'Minimise f(x) =',o:Object.keys(GD).map(k=>[k,GD[k][0]]),on:(s,sy)=>{s.e=s.f==='a'?.1:.01;sy();}},{t:'r',k:'e',l:'step size η',a:.005,b:1.1,s:.005,v:.1},{t:'r',k:'n',l:'steps shown',a:1,b:150,s:1,v:30,f:v=>v},{t:'b',l:'η = 0.01',on:s=>{s.e=.01;}},{t:'b',l:'η = 0.1',on:s=>{s.e=.1;}}],
draw(s,[P,Q],out){const m=GD[s.f],f=m[1],df=m[2],xs=[m[6]],nx=[m[6]];let it=0,x=m[6];for(;it<10000&&Math.abs(df(x))>=1e-12&&Math.abs(x)<1e6;it++)x-=s.e*df(x);
  for(let i=0;i<s.n;i++){const v=xs[i];xs.push(clamp(v-s.e*df(v),-1e6,1e6));}for(let i=0;i<12;i++){const v=nx[i],d=m[3](v);nx.push(Math.abs(df(v))<1e-12||d===0?v:v-df(v)/d);}let ni=0;while(ni<12&&Math.abs(df(nx[ni]))>=1e-12)ni++;
  P.begin(m[4],m[5]).axes({xl:'x'});P.fn(f,C.c1,2.5);P.path(xs.map(v=>[v,f(v)]),alpha(C.c2,.6),1.2);xs.forEach((v,i)=>P.dot(v,f(v),C.c2,i?3:5));
  Q.begin([0,s.n],[m[4][0],m[4][1]]).axes({xl:'iteration n',yl:'xₙ'});Q.hl(m[7],C.mute,1,[4,4]);Q.path(nx.map((v,i)=>[i,v]),C.c4,2);Q.path(xs.map((v,i)=>[i,v]),C.c2,2);Q.legend([['gradient descent',C.c2],["Newton's method",C.c4]]);
  const mu=1-s.e*m[3](m[7]);out(`Gradient descent with η = ${fmt(s.e,3)}: ${Math.abs(x)>=1e6?'<span class="no">diverges</span> (the iterates blow up)':it>=10000?'<span class="no">has not converged after 10,000 iterations</span>':`<span class="ok">converges in ${it} iterations</span> to ${fmt(x,6)}`} &nbsp;·&nbsp; Newton: ${ni} iteration${ni===1?'':'s'}<br>At the minimum x* = ${m[7]}: G′(x*) = 1 − η·f″(x*) = <b>${fmt(mu,4)}</b> → ${Math.abs(mu)<1?'|G′| &lt; 1, an attractor':'|G′| ≥ 1, <span class="no">not an attractor: the step is too large</span>'}`);}});

const G2={a:['x² + y²  (Example 53)',(x,y)=>x*x+y*y,(x,y)=>[2*x,2*y],[-2,2],[-2,2],[0,8]],b:['x² + 10y²  (a narrow valley)',(x,y)=>x*x+10*y*y,(x,y)=>[2*x,20*y],[-2,2],[-1.2,1.2],[0,12]],c:['x³ − 12x + y³ − 3y  (Example 52)',(x,y)=>x**3-12*x+y**3-3*y,(x,y)=>[3*x*x-12,3*y*y-3],[-3.4,3.4],[-2.4,2.4],[-22,22]]};
lab('gd2',{cv:[340],ctl:[{t:'s',k:'f',l:'Landscape',o:Object.keys(G2).map(k=>[k,G2[k][0]]),on:(s,sy)=>{s.e=s.f==='a'?.2:s.f==='b'?.08:.03;s.px=s.f==='c'?.3:-1.6;s.py=s.f==='c'?2:1;sy();}},{t:'r',k:'e',l:'step size η',a:.005,b:1.1,s:.005,v:.2},{t:'r',k:'n',l:'steps',a:1,b:80,s:1,v:25,f:v=>v}],
init(s,[P],rd){s.px=-1.6;s.py=1;P.onDrag((x,y)=>{const m=G2[s.f];s.px=clamp(x,m[3][0],m[3][1]);s.py=clamp(y,m[4][0],m[4][1]);rd();});},
draw(s,[P],out){const m=G2[s.f],pts=[[s.px,s.py]];for(let i=0;i<s.n;i++){const p=pts[i],g=m[2](p[0],p[1]),q=[p[0]-s.e*g[0],p[1]-s.e*g[1]];if(Math.abs(q[0])>50||Math.abs(q[1])>50){pts.push(q);break;}pts.push(q);}
  P.sq(0,m[4]).axes({nox:1,noy:1});heat(P,m[1],m[5][0],m[5][1],18);P.path(pts,C.ink,1.8);pts.forEach((p,i)=>P.dot(p[0],p[1],i?C.ink:C.c5,i?2.8:6));const L=pts[pts.length-1],g=m[2](L[0],L[1]);
  out(`Start (${fmt(s.px,2)}, ${fmt(s.py,2)}) &nbsp;→&nbsp; after ${pts.length-1} steps: (${fmt(L[0],4)}, ${fmt(L[1],4)}), f = ${fmt(m[1](L[0],L[1]),4)}, |∇f| = ${fmt(Math.hypot(g[0],g[1]),4)}${s.f==='a'?`<br>Each step multiplies the position by 1 − 2η = <b>${fmt(1-2*s.e,2)}</b>: ${Math.abs(1-2*s.e)<1?'converges'+(1-2*s.e<0?', flipping sides each step':''):'<span class="no">does not converge</span>'}.`:s.f==='b'?`<br>Per step: x is multiplied by ${fmt(1-2*s.e,2)}, y by ${fmt(1-20*s.e,2)}. The steep y-direction needs η &lt; 0.1 to stay stable, which leaves x crawling.`:'<br>The minimum is at (2, 1). Start left of x = −2 or below y = −1 and the path runs away downhill instead: this function is not bounded below.'}`);}});

const erfc=x=>{const z=Math.abs(x),t=1/(1+.5*z),r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(.37409196+t*(.09678418+t*(-.18628806+t*(.27886807+t*(-1.13520398+t*(1.48851587+t*(-.82215223+t*.17087277)))))))));return x>=0?r:2-r;},Phi=x=>.5*erfc(-x/Math.SQRT2);
lab('finance',{cv:[],ctl:[{t:'r',k:'c',l:'bond price C',a:700,b:1200,s:10,v:900,f:v=>v},{t:'r',k:'p',l:'option price',a:2.05,b:4,s:.05,v:2.2}],
draw(s,P,out){const F=[100,100,100,1100],f=r=>F.reduce((a,v,i)=>a+v/Math.pow(1+r,i+1),0)-s.c,df=r=>F.reduce((a,v,i)=>a-(i+1)*v/Math.pow(1+r,i+2),0),xs=[1];for(let i=0;i<60&&Math.abs(f(xs[i]))>=1e-12;i++)xs.push(xs[i]-f(xs[i])/df(xs[i]));
  const call=sg=>{const d1=(Math.log(20/18)+.5*sg*sg*.25)/(sg*.5),d2=d1-sg*.5;return 20*Phi(d1)-18*Phi(d2)-s.p;},ss=[.1,.2];for(let i=1;i<40&&Math.abs(call(ss[i]))>=1e-10;i++){const a=ss[i],b=ss[i-1],d=call(a)-call(b);if(d===0)break;ss.push(a-call(a)*(a-b)/d);}
  out(`<b>Bond yield</b> (Newton, r₀ = 1): ${xs.map(v=>fmt(v,5)).join(' → ')}<br>Yield = <span class="k2">${fmt(100*xs[xs.length-1],2)}%</span> after ${xs.length-1} iterations.<br><br><b>Implied volatility</b> (secant, σ₀ = 0.1, σ₁ = 0.2): ${ss.map(v=>fmt(v,5)).join(' → ')}<br>Implied volatility = <span class="k2">${fmt(100*ss[ss.length-1],2)}%</span> after ${ss.length-2} secant steps.`);}});
})();

/* ===== Chapter 13: metric spaces ===== */
(function(){
const D={1:(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]),2:(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]),i:(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]))};
const shape=(P,m,c,r,fill,stroke,lw=2)=>{if(m==='2')P.circ(c[0],c[1],r,fill,stroke,lw);else if(m==='1')P.poly([[c[0]+r,c[1]],[c[0],c[1]+r],[c[0]-r,c[1]],[c[0],c[1]-r]],fill,stroke,lw);else P.poly([[c[0]+r,c[1]+r],[c[0]-r,c[1]+r],[c[0]-r,c[1]-r],[c[0]+r,c[1]-r]],fill,stroke,lw);};
lab('miles',{cv:[230],ctl:[{t:'r',k:'a',l:'London – Manchester',a:20,b:400,s:5,v:190,f:v=>v},{t:'r',k:'b',l:'London – Sheffield',a:20,b:400,s:5,v:160,f:v=>v},{t:'r',k:'c',l:'Manchester – Sheffield',a:20,b:400,s:5,v:40,f:v=>v}],
draw(s,[P],out){const {a,b,c}=s,ok=[a<=b+c,b<=a+c,c<=a+b],all=ok.every(x=>x);P.sq(a/2,[-60,Math.max(120,b*.7)]);const Lp=[0,0],M=[a,0];let S;
  if(all){const x=(a*a+b*b-c*c)/(2*a);S=[x,Math.sqrt(Math.max(0,b*b-x*x))];P.poly([Lp,M,S],alpha(C.c1,.15),C.c1,2);}else{S=[a/2,40];P.seg(0,0,a,0,C.bad,2.5);P.seg(0,0,S[0],S[1],C.mute,1.5,[5,4]);P.seg(a,0,S[0],S[1],C.mute,1.5,[5,4]);}
  [[Lp,'London'],[M,'Manchester'],[S,'Sheffield']].forEach(([p,n],i)=>{P.dot(p[0],p[1],C.ink,5);P.txt(n,p[0],p[1],C.ink,'center',0,i<2?16:-14,1);});
  const row=(t,x,y,z,o)=>`${t}: ${x} ≤ ${y} + ${z} = ${y+z} ${o?'<span class="ok">holds</span>':'<span class="no">fails</span>'}`;
  out(`${row('L–M',a,b,c,ok[0])} &nbsp;·&nbsp; ${row('L–S',b,a,c,ok[1])} &nbsp;·&nbsp; ${row('M–S',c,a,b,ok[2])}<br>${all?'<span class="ok">A metric</span>: zero only on the diagonal, symmetric, and every triangle inequality holds'+(a===b+c||b===a+c||c===a+b?' (with equality: the three towns lie on one straight road).':'.'):'<span class="no">Not a metric</span>: no triangle with these side lengths exists.'}`);}});

lab('balls',{cv:[340],ctl:[{t:'r',k:'r',l:'radius r',a:.3,b:1.5,s:.05,v:1}],
init(s,[P],rd){s.p=[.75,.5];P.onDrag((x,y)=>{s.p=[clamp(x,-2.2,2.2),clamp(y,-1.6,1.6)];rd();});},
draw(s,[P],out){P.sq(0,[-1.75,1.75]).axes({nox:1,noy:1});const o=[0,0];shape(P,'i',o,s.r,alpha(C.c4,.1),C.c4);shape(P,'2',o,s.r,alpha(C.c1,.1),C.c1);shape(P,'1',o,s.r,alpha(C.c2,.12),C.c2);
  P.seg(0,0,s.p[0],0,C.c2,1.5,[4,3]);P.seg(s.p[0],0,s.p[0],s.p[1],C.c2,1.5,[4,3]);P.seg(0,0,s.p[0],s.p[1],C.c1,1.5);P.dot(0,0,C.ink,4);P.dot(s.p[0],s.p[1],C.ink,5.5);P.txt('x',s.p[0],s.p[1],C.ink,'left',8,-8,1);
  P.legend([['d₁ = r  (taxi-cab)',C.c2],['d₂ = r  (Euclidean)',C.c1],['d∞ = r  (maximum)',C.c4]]);const d1=D[1](o,s.p),d2=D[2](o,s.p),di=D.i(o,s.p),io=d=>d<s.r?'inside':'outside';
  out(`x = (${fmt(s.p[0],2)}, ${fmt(s.p[1],2)}): &nbsp; <span class="k4">d∞ = ${fmt(di,3)}</span> &nbsp;≤&nbsp; <span class="k1">d₂ = ${fmt(d2,3)}</span> &nbsp;≤&nbsp; <span class="k2">d₁ = ${fmt(d1,3)}</span> &nbsp;≤&nbsp; √2·d₂ = ${fmt(Math.SQRT2*d2,3)} &nbsp;≤&nbsp; 2·d∞ = ${fmt(2*di,3)}<br>Ball of radius ${fmt(s.r,2)}: ${io(d1)} for d₁, ${io(d2)} for d₂, ${io(di)} for d∞. In the discrete metric x is at distance ${d2===0?0:1} from the centre, wherever it is.`);}});

lab('bits',{cv:[150],init(s,[P],rd){s.b=['0000100110011111','0000110110011111','0000100111011111'].map(t=>t.split('').map(Number));P.cv.style.cursor='pointer';P.onDrag((x,y,e)=>{if(e.type!=='pointerdown')return;const r=3-Math.round(y),c=Math.round(x);if(r>=0&&r<3&&c>=0&&c<16){s.b[r][c]^=1;rd();}});},
draw(s,[P],out){P.begin([-2,16],[.3,3.7],{L:0,B:0});const nm=['b','b′','b″'],fd=(u,v)=>{for(let i=0;i<16;i++)if(u[i]!==v[i])return i;return -1;},d=(u,v)=>{const i=fd(u,v);return i<0?0:Math.pow(2,-i);},f01=fd(s.b[0],s.b[1]);
  s.b.forEach((row,r)=>{P.txt(nm[r]+' =',-.8,3-r,C.ink,'right',0,0,1);row.forEach((v,c)=>{P.box(c-.42,3-r-.36,c+.42,3-r+.36,v?alpha(C.c1,.3):null,C.line);P.txt(String(v),c,3-r,C.ink,'center',0,0,v);});});
  for(let c=0;c<16;c++)P.txt(String(c),c,.5,C.mute,'center');if(f01>=0)P.box(f01-.46,1.6,f01+.46,3.4,null,C.c2,2.5);
  const a=d(s.b[0],s.b[1]),b=d(s.b[1],s.b[2]),c=d(s.b[0],s.b[2]),fr=x=>x===0?'0':`1/2<sup>${Math.round(-Math.log2(x))}</sup> = ${fmt(x,5)}`;
  out(`d(b, b′) = <span class="k2">${fr(a)}</span>${f01>=0?` (first difference at index ${f01}, boxed)`:''} &nbsp;·&nbsp; d(b′, b″) = ${fr(b)} &nbsp;·&nbsp; d(b, b″) = ${fr(c)}<br>Triangle inequality: ${fmt(c,5)} ≤ ${fmt(a,5)} + ${fmt(b,5)} <span class="ok">holds</span>; in fact d(b, b″) ≤ max = ${fmt(Math.max(a,b),5)}.`);}});

lab('nbhd',{cv:[320],ctl:[{t:'s',k:'m',l:'Metric',o:[['2','Euclidean d₂'],['1','taxi-cab d₁'],['i','maximum d∞']]},{t:'r',k:'d',l:'δ',a:.5,b:1.5,s:.05,v:1.2}],
init(s,[P],rd){s.p=[.55,.35];P.onDrag((x,y)=>{s.p=[x,y];rd();});},
draw(s,[P],out){P.sq(0,[-1.75,1.75]).axes({nox:1,noy:1});const a=[0,0],dist=D[s.m](a,s.p),inn=dist<s.d,eta=s.d-dist;shape(P,s.m,a,s.d,alpha(C.c1,.14),C.c1,2);P.g.setLineDash([]);
  if(inn)shape(P,s.m,s.p,eta,alpha(C.c2,.3),C.c2,2);P.dot(0,0,C.c1,4.5);P.txt('a',0,0,C.c1,'right',-8,0,1);P.dot(s.p[0],s.p[1],inn?C.c2:C.bad,5);P.txt('b',s.p[0],s.p[1],inn?C.c2:C.bad,'left',8,-8,1);
  out(inn?`d(a, b) = ${fmt(dist,3)} &lt; δ = ${fmt(s.d,2)}, so b ∈ B(a; δ). Any η up to δ − d(a, b) = <span class="k2">${fmt(eta,3)}</span> gives B(b; η) ⊆ B(a; δ): for x in the small ball, d(a, x) ≤ d(a, b) + d(b, x) &lt; ${fmt(dist,3)} + ${fmt(eta,3)} = δ.`:`d(a, b) = ${fmt(dist,3)} ≥ δ: <span class="no">b is not in the open ball</span>. Points at distance exactly δ are outside too.`);}});

lab('mconv',{cv:[280,280],ctl:[{t:'r',k:'n',l:'points shown',a:5,b:80,s:1,v:25,f:v=>v}],
draw(s,[P,Q],out){const L=[.2,.1],x=n=>[L[0]+1.5/n*Math.cos(n),L[1]+1.5/n*Math.sin(n)],pts=range(s.n,i=>x(i+1));P.sq(.2,[-1.5,1.7]).axes({nox:1,noy:1});P.path(pts,alpha(C.c1,.4),1);pts.forEach((p,i)=>P.dot(p[0],p[1],C.c1,i<9?3.5:2.5));P.dot(L[0],L[1],C.c2,6,true);P.txt('x',L[0],L[1],C.c2,'left',9,9,1);P.txt('x₁',pts[0][0],pts[0][1],C.ink,'left',7,-7);
  Q.begin([0,s.n+1],[0,2.2]).axes({xl:'n',yl:'d(x, xₙ)'});for(const [k,col] of [['1',C.c2],['2',C.c1],['i',C.c4]])Q.pts(pts.map((p,i)=>[i+1,D[k](L,p)]),col,2.6);Q.legend([['d₁',C.c2],['d₂',C.c1],['d∞',C.c4]]);const p=pts[s.n-1];
  out(`n = ${s.n}: &nbsp; <span class="k2">d₁ = ${fmt(D[1](L,p),4)}</span>, &nbsp; <span class="k1">d₂ = ${fmt(D[2](L,p),4)}</span>, &nbsp; <span class="k4">d∞ = ${fmt(D.i(L,p),4)}</span>, &nbsp; discrete metric: 1. &nbsp; Here d₂(x, xₙ) = 1.5/n → 0.`);}});
})();

/* ===== Chapter 14: vector derivatives ===== */
(function(){
lab('vec',{cv:[340],ctl:[{t:'r',k:'c',l:'scalar c',a:-2,b:2,s:.1,v:1.5}],
init(s,[P],rd){s.u=[2,.6];s.v=[.6,1.8];let sel='u';P.onDrag((x,y,e)=>{if(e.type==='pointerdown')sel=Math.hypot(x-s.u[0],y-s.u[1])<Math.hypot(x-s.v[0],y-s.v[1])?'u':'v';s[sel]=[clamp(x,-4,4),clamp(y,-3,3)];rd();});},
draw(s,[P],out){P.sq(0,[-3.2,3.2]).axes({nox:1,noy:1});const {u,v,c}=s,w=[u[0]+v[0],u[1]+v[1]];P.seg(u[0],u[1],w[0],w[1],C.mute,1,[4,4]);P.seg(v[0],v[1],w[0],w[1],C.mute,1,[4,4]);
  P.arrow(0,0,c*u[0],c*u[1],alpha(C.c4,.75),5);P.arrow(0,0,w[0],w[1],C.c3,2.2);P.arrow(0,0,u[0],u[1],C.c1,2.5);P.arrow(0,0,v[0],v[1],C.c2,2.5);
  P.txt('u',u[0],u[1],C.c1,'left',8,-8,1);P.txt('v',v[0],v[1],C.c2,'left',8,-8,1);P.txt('u + v',w[0],w[1],C.c3,'left',8,-8,1);P.txt('cu',c*u[0],c*u[1],C.c4,'left',8,10,1);
  const dot=u[0]*v[0]+u[1]*v[1],nu=Math.hypot(...u),nv=Math.hypot(...v),th=Math.acos(clamp(dot/(nu*nv||1),-1,1))*180/Math.PI,f=a=>`(${fmt(a[0],2)}, ${fmt(a[1],2)})`;
  out(`<span class="k1">u = ${f(u)}</span>, &nbsp; <span class="k2">v = ${f(v)}</span>, &nbsp; <span class="k3">u + v = ${f(w)}</span>, &nbsp; <span class="k4">cu = ${f([c*u[0],c*u[1]])}</span><br>u · v = ${fmt(u[0],2)}×${fmt(v[0],2)} + ${fmt(u[1],2)}×${fmt(v[1],2)} = <b>${fmt(dot,3)}</b> = ‖u‖‖v‖ cos θ = ${fmt(nu,3)} × ${fmt(nv,3)} × cos ${fmt(th,1)}° &nbsp;→&nbsp; ${Math.abs(dot)<.05?'perpendicular':dot>0?'acute angle':'obtuse angle'}`);}});

const min1=f=>{let a=-20,b=20;for(let i=0;i<120;i++){const m1=a+(b-a)/3,m2=b-(b-a)/3;f(m1)<f(m2)?b=m2:a=m1;}return (a+b)/2;};
lab('reg',{cv:[320,320],ctl:[{t:'s',k:'mode',l:'Model',o:[['o','y = mx  (through the origin)'],['a','y = c + mx']]},{t:'r',k:'m',l:'slope m',a:-1,b:3,s:.01,v:.4},{t:'r',k:'c',l:'intercept c',a:-3,b:4,s:.05,v:0,w:s=>s.mode==='a'},
  {t:'b',l:'Jump to the least-squares optimum',on:s=>{const o=s._opt();s.m=+o[0].toFixed(2);s.c=+o[1].toFixed(2);}},{t:'c',k:'n1',l:'show 1-norm fit',v:false,w:s=>s.mode==='o'},{t:'c',k:'ni',l:'show ∞-norm fit',v:false,w:s=>s.mode==='o'}],
init(s,[P],rd){s.pts=[[.6,.9],[1.2,1.1],[1.9,2.4],[2.6,2.5],[3.3,3.9],[4,3.8],[4.6,5]];let k=0;P.onDrag((x,y,e)=>{if(e.type==='pointerdown'){let b=1e9;s.pts.forEach((p,i)=>{const d=Math.hypot(p[0]-x,p[1]-y);if(d<b){b=d;k=i;}});}s.pts[k]=[clamp(x,.1,6.5),clamp(y,-.5,6.5)];rd();});
  s._opt=()=>{const p=s.pts,n=p.length,sx=p.reduce((a,q)=>a+q[0],0),sy=p.reduce((a,q)=>a+q[1],0),sxx=p.reduce((a,q)=>a+q[0]*q[0],0),sxy=p.reduce((a,q)=>a+q[0]*q[1],0);if(s.mode==='o')return [sxy/sxx,0];const m=(sxy-sx*sy/n)/(sxx-sx*sx/n);return [m,sy/n-m*sx/n];};},
draw(s,[P,Q],out){const p=s.pts,c=s.mode==='a'?s.c:0,e=m=>p.map(q=>c+m*q[0]-q[1]),L2=m=>e(m).reduce((a,v)=>a+v*v,0),L1=m=>e(m).reduce((a,v)=>a+Math.abs(v),0),Li=m=>Math.max(...e(m).map(Math.abs)),o=s._opt();
  P.sq(3.2,[-.8,6.8]).axes({nox:1,noy:1});P.seg(P.x0,0,P.x1,0,C.mute,1);P.seg(0,-1,0,7,C.mute,1);p.forEach(q=>{const r=c+s.m*q[0]-q[1];P.box(q[0],q[1],q[0]+Math.abs(r),q[1]+r,alpha(C.c2,.18),alpha(C.c2,.6));P.seg(q[0],q[1],q[0],q[1]+r,C.c2,2);});
  if(s.mode==='o'&&s.n1){const m=min1(L1);P.fn(x=>m*x,C.c3,1.5,[6,4]);}if(s.mode==='o'&&s.ni){const m=min1(Li);P.fn(x=>m*x,C.c5,1.5,[2,4]);}
  P.fn(x=>o[1]+o[0]*x,alpha(C.c4,.8),1.5,[5,4]);P.fn(x=>c+s.m*x,C.c1,2.5);p.forEach(q=>P.dot(q[0],q[1],C.ink,5));
  const ms=range(81,i=>-1+4*i/80),top=Math.max(10,L2(s.m)*1.2,L2(o[0])*4);Q.begin([-1,3],[0,top],{L:44}).axes({xl:'m',yl:'L = Σ eᵢ²'+(s.mode==='a'?'  (c held at its slider value)':'')});Q.path(ms.map(m=>[m,L2(m)]),C.c1,2.3);const mb=s.mode==='o'?o[0]:min1(L2);Q.dot(mb,L2(mb),C.c4,5,true);Q.dot(s.m,L2(s.m),C.c2,5.5);
  out(`Current line: y = ${s.mode==='a'?fmt(c,2)+' + ':''}${fmt(s.m,2)}x &nbsp;·&nbsp; <span class="k2">L = ‖e‖₂² = ${fmt(L2(s.m),3)}</span> &nbsp;·&nbsp; ‖e‖₁ = ${fmt(L1(s.m),3)} &nbsp;·&nbsp; ‖e‖∞ = ${fmt(Li(s.m),3)}<br>Least squares: <span class="k4">${s.mode==='o'?`m = x·y / x·x = ${fmt(o[0],4)}`:`m = ${fmt(o[0],4)}, c = ȳ − m·x̄ = ${fmt(o[1],4)}`}</span>${s.mode==='o'&&(s.n1||s.ni)?` &nbsp;·&nbsp; ${s.n1?`<span class="k3">1-norm: m = ${fmt(min1(L1),4)}</span> `:''}${s.ni?`<span class="k5">∞-norm: m = ${fmt(min1(Li),4)}</span>`:''}`:''}`);}});

lab('graph',{cv:[250],ctl:[{t:'r',k:'a',l:'a',a:-3.14,b:3.14,s:.01,v:.7}],
draw(s,[P],out){P.begin([0,10],[0,6],{L:0,B:0});const a=s.a,b1=Math.sin(a),b2=Math.cos(a),c=4*b1*b1+3*b2*b2,g=P.g;
  const node=(x,y,t,v,col)=>{g.fillStyle=alpha(col,.14);g.strokeStyle=col;g.lineWidth=1.8;g.beginPath();g.roundRect(P.X(x)-62,P.Y(y)-22,124,44,8);g.fill();g.stroke();P.txt(t,x,y,C.ink,'center',0,-8,1);P.txt('= '+fmt(v,4),x,y,C.ink,'center',0,9);};
  const edge=(x1,y1,x2,y2,t,v,col)=>{P.arrow(x1,y1,x2,y2,col,1.8);P.txt(t+' = '+fmt(v,3),(x1+x2)/2,(y1+y2)/2,col,'center',0,y2>y1?-12:(y2<y1?14:-12),1);};
  edge(2.05,3.3,3.9,4.75,'cos a',b2,C.c1);edge(2.05,2.7,3.9,1.25,'−sin a',-b1,C.c2);edge(6.1,4.75,7.95,3.3,'8b₁',8*b1,C.c1);edge(6.1,1.25,7.95,2.7,'6b₂',6*b2,C.c2);
  node(1.1,3,'a',a,C.mute);node(5,4.8,'b₁ = sin a',b1,C.c1);node(5,1.2,'b₂ = cos a',b2,C.c2);node(8.9,3,'c = 4b₁² + 3b₂²',c,C.c3);
  const p1=8*b1*b2,p2=-6*b2*b1;out(`Path through b₁: <span class="k1">${fmt(8*b1,3)} × ${fmt(b2,3)} = ${fmt(p1,4)}</span> &nbsp;·&nbsp; path through b₂: <span class="k2">${fmt(6*b2,3)} × ${fmt(-b1,3)} = ${fmt(p2,4)}</span><br>dc/da = sum of the paths = <b>${fmt(p1+p2,5)}</b> &nbsp;·&nbsp; closed form 2 sin a cos a = <b>${fmt(2*b1*b2,5)}</b>`);}});

const BD=[[.3,1.1],[.8,1.9],[1.4,1.8],[1.9,2.9],[2.5,2.8],[3,3.7],[3.5,3.6],[4,4.5]];
lab('backprop',{cv:[280,280],ctl:[{t:'r',k:'e',l:'step size η',a:.005,b:.2,s:.005,v:.05},{t:'b',l:'Step',on:s=>s._step(1)},{t:'b',l:'Run 50 steps',on:s=>s._step(50)},{t:'b',l:'Reset',on:s=>{s.w=0;s.b=0;s.h=[s._L()];}}],
init(s){s.w=0;s.b=0;s._L=()=>BD.reduce((a,p)=>a+(p[1]-s.w*p[0]-s.b)**2,0)/BD.length;s.h=[s._L()];
  s._step=k=>{for(let i=0;i<k;i++){let dw=0,db=0;for(const p of BD){const r=p[1]-(s.w*p[0]+s.b);dw+=-2*r*p[0];db+=-2*r;}s.w-=s.e*dw/BD.length;s.b-=s.e*db/BD.length;const L=s._L();s.h.push(L);if(!isFinite(L)||L>1e9){s.w=0;s.b=0;s.h=[s._L()];s._blew=1;break;}}};},
draw(s,[P,Q],out){P.begin([0,4.5],[0,5.5]).axes({xl:'x',yl:'y'});const n=BD.length,sx=BD.reduce((a,p)=>a+p[0],0),sy=BD.reduce((a,p)=>a+p[1],0),sxx=BD.reduce((a,p)=>a+p[0]*p[0],0),sxy=BD.reduce((a,p)=>a+p[0]*p[1],0),m=(sxy-sx*sy/n)/(sxx-sx*sx/n),c=sy/n-m*sx/n;
  P.fn(x=>c+m*x,alpha(C.c4,.8),1.5,[5,4]);BD.forEach(p=>P.seg(p[0],p[1],p[0],s.w*p[0]+s.b,alpha(C.c2,.6),1.5));P.fn(x=>s.w*x+s.b,C.c1,2.5);BD.forEach((p,i)=>P.dot(p[0],p[1],i?C.ink:C.c5,i?4:6));P.legend([['current ŷ = wx + b',C.c1],['least-squares line',C.c4]]);
  const h=s.h,K=Math.max(20,h.length-1);Q.begin([0,K],[0,Math.max(1,Math.min(h[0]*1.1,Math.max(...h)*1.1))],{L:40}).axes({xl:'update number',yl:'mean loss'});Q.path(h.map((v,i)=>[i,v]),C.c2,2);Q.dot(h.length-1,h[h.length-1],C.c2,4.5);
  const p=BD[0],yh=s.w*p[0]+s.b,r=p[1]-yh,bl=s._blew;s._blew=0;
  out(`${bl?'<span class="no">The loss exploded (η too large for this data), so the parameters were reset.</span><br>':''}w = <b>${fmt(s.w,4)}</b>, b = <b>${fmt(s.b,4)}</b> after ${h.length-1} updates &nbsp;·&nbsp; mean loss <span class="k2">${fmt(h[h.length-1],5)}</span> &nbsp;·&nbsp; exact least squares: w = ${fmt(m,4)}, b = ${fmt(c,4)}<br>
  <span class="k5">Highlighted observation</span> (x, y) = (${p[0]}, ${p[1]}). Forward: ŷ = ${fmt(yh,4)}, r = y − ŷ = ${fmt(r,4)}, ℓ = r² = ${fmt(r*r,4)}. Backward: ∂ℓ/∂r = 2r = ${fmt(2*r,4)}, ∂ℓ/∂ŷ = −2r = ${fmt(-2*r,4)}, ∂ℓ/∂w = −2r·x = ${fmt(-2*r*p[0],4)}, ∂ℓ/∂b = −2r = ${fmt(-2*r,4)}.`);}});

const sg=u=>1/(1+Math.exp(-u));
lab('nn',{cv:[310,310],ctl:[{t:'r',k:'e',l:'step size η',a:.1,b:4,s:.1,v:1},{t:'b',l:'Step',on:s=>s._step(1)},{t:'b',l:'Run 25 steps',on:s=>s._step(25)},{t:'b',l:'Reset',on:s=>s._reset()}],
init(s){s.x=[1,.5,-1];s.y=.85;s._reset=()=>{s.W=[[.4,-.6,.3],[-.5,.2,.7]];s.b1=[.1,-.1];s.V=[.5,-.4];s.b2=0;s.h=[];s._fwd();s.h=[s.F.l];};
  s._fwd=()=>{const u=s.W.map((w,k)=>w.reduce((a,v,j)=>a+v*s.x[j],s.b1[k])),v=u.map(sg),u2=s.V[0]*v[0]+s.V[1]*v[1]+s.b2,yh=sg(u2),r=s.y-yh,d2=-2*r*yh*(1-yh),dv=s.V.map(w=>d2*w),d1=dv.map((g,k)=>g*v[k]*(1-v[k]));s.F={u,v,u2,yh,r,l:r*r,d2,dv,d1};};
  s._step=n=>{for(let i=0;i<n;i++){const F=s.F;for(let k=0;k<2;k++){for(let j=0;j<3;j++)s.W[k][j]-=s.e*F.d1[k]*s.x[j];s.b1[k]-=s.e*F.d1[k];}const v=F.v.slice();s.V=s.V.map((w,k)=>w-s.e*F.d2*v[k]);s.b2-=s.e*F.d2;s._fwd();s.h.push(s.F.l);}};s._reset();},
draw(s,[P,Q],out){P.begin([0,10],[0,6],{L:0,B:0});const F=s.F,g=P.g,I=[[1.2,5],[1.2,3],[1.2,1]],H=[[5,4.2],[5,1.8]],O=[8.6,3];
  const edge=(a,b,w)=>P.seg(a[0],a[1],b[0],b[1],alpha(w>=0?C.c1:C.c2,.85),clamp(Math.abs(w)*3.2,.6,7));I.forEach((p,j)=>H.forEach((q,k)=>edge(p,q,s.W[k][j])));H.forEach((q,k)=>edge(q,O,s.V[k]));
  const node=(p,t,v)=>{g.beginPath();g.arc(P.X(p[0]),P.Y(p[1]),25,0,7);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.ink;g.lineWidth=1.6;g.stroke();P.txt(t,p[0],p[1],C.mute,'center',0,-8);P.txt(fmt(v,3),p[0],p[1],C.ink,'center',0,7,1);};
  I.forEach((p,j)=>node(p,'x'+'₁₂₃'[j],s.x[j]));H.forEach((p,k)=>node(p,'v'+'₁₂'[k],F.v[k]));node(O,'ŷ',F.yh);P.txt('input',1.2,5.85,C.mute,'center');P.txt('hidden',5,5.85,C.mute,'center');P.txt('output',8.6,5.85,C.mute,'center');P.txt('target y = '+s.y,8.6,1.9,C.c4,'center',0,0,1);
  const h=s.h,K=Math.max(20,h.length-1);Q.begin([0,K],[0,Math.max(.02,h[0]*1.1)],{L:44}).axes({xl:'update number',yl:'loss ℓ = (y − ŷ)²'});Q.path(h.map((v,i)=>[i,v]),C.c2,2);Q.dot(h.length-1,h[h.length-1],C.c2,4.5);
  out(`<b>Forward:</b> u⁽¹⁾ = (${fmt(F.u[0],3)}, ${fmt(F.u[1],3)}) → v = σ(u⁽¹⁾) = (${fmt(F.v[0],3)}, ${fmt(F.v[1],3)}) → u⁽²⁾ = ${fmt(F.u2,3)} → ŷ = σ(u⁽²⁾) = <b>${fmt(F.yh,4)}</b> → r = ${fmt(F.r,4)} → <span class="k2">ℓ = ${fmt(F.l,5)}</span><br><b>Backward:</b> ∂ℓ/∂ŷ = −2r = ${fmt(-2*F.r,4)} → ∂ℓ/∂u⁽²⁾ = ∂ℓ/∂ŷ · ŷ(1 − ŷ) = ${fmt(F.d2,4)} → ∂ℓ/∂v = (${fmt(F.dv[0],4)}, ${fmt(F.dv[1],4)}) → ∂ℓ/∂u⁽¹⁾ = (${fmt(F.d1[0],4)}, ${fmt(F.d1[1],4)})<br>Then every weight gets ∂ℓ/∂w = (signal arriving from the right) × (value arriving from the left), e.g. ∂ℓ/∂w⁽²⁾₁ = ${fmt(F.d2,4)} × ${fmt(F.v[0],3)} = ${fmt(F.d2*F.v[0],4)}. Blue edges are positive weights, orange negative.`);}});
})();


boot();
