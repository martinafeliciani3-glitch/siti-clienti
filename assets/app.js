(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),lerp=(a,b,t)=>a+(b-a)*t;
const seg=(p,a,b)=>clamp((p-a)/(b-a));
const ss=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10)};
const eo=t=>1-Math.pow(1-clamp(t),4);
const isMob=matchMedia('(max-width:900px)').matches;
let readyT=null;
/* Trusted Types: solo questa funzione puo' scrivere HTML nella pagina, e solo con contenuti fissi del sito */
const TT=window.trustedTypes&&trustedTypes.createPolicy?trustedTypes.createPolicy('fg',{createHTML:x=>x}):null;
const html=x=>TT?TT.createHTML(x):x;
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- LOADER ---------- */
const nm='Feliciani Group',lnm=$('#lname');[...nm].forEach((c,i)=>{const sp=document.createElement('span');sp.style.animationDelay=i*.04+'s';sp.textContent=c===' '?'\u00a0':c;lnm.appendChild(sp)});
let lp=0;const lpc=$('#lpc'),lbar=$('#lbar');
const lt=setInterval(()=>{lp=Math.min(100,lp+1+Math.random()*4);lpc.textContent=String(Math.floor(lp)).padStart(3,'0');lbar.style.width=lp+'%';
  if(lp>=100){clearInterval(lt);setTimeout(()=>{$('#loader').classList.add('done');document.body.classList.remove('loading');document.body.classList.add('ready');readyT=performance.now()/1000},350)}},40);

/* ---------- CURSOR ---------- */
const cur=$('.cur'),dot=$('.dot');let mx=innerWidth/2,my=innerHeight/2,cx=mx,cy=my,nx=0,ny=0;
addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;nx=mx/innerWidth-.5;ny=my/innerHeight-.5;dot.style.transform=`translate(${mx}px,${my}px)`});
if(matchMedia('(hover:hover)').matches)(function f(){cx+=(mx-cx)*.12;cy+=(my-cy)*.12;cur.style.transform=`translate(${cx}px,${cy}px)`;requestAnimationFrame(f)})();
document.addEventListener('pointerover',e=>cur.classList.toggle('big',!!e.target.closest('a,button,.card,.ba')));
$$('.magnet').forEach(b=>{b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.3}px,${(e.clientY-r.top-r.height/2)*.3}px)`;b.style.transition='transform .2s'});b.addEventListener('pointerleave',()=>{b.style.transition='transform 1s var(--e)';b.style.transform=''})});

/* ---------- MENU ---------- */
const bg=$('#burger'),mn=$('#menu');
const setMenu=o=>{bg.classList.toggle('on',o);mn.classList.toggle('on',o);document.body.classList.toggle('menu-open',o);bg.setAttribute('aria-expanded',o);bg.setAttribute('aria-label',o?'Chiudi il menu':'Apri il menu');mn.setAttribute('aria-hidden',!o)};
bg.onclick=()=>setMenu(!mn.classList.contains('on'));
$$('#menu a').forEach(a=>a.onclick=()=>setMenu(false));
addEventListener('keydown',e=>{if(e.key==='Escape'&&mn.classList.contains('on'))setMenu(false)});
matchMedia('(min-width:901px)').addEventListener('change',e=>{if(e.matches)setMenu(false)});

/* ---------- REVEAL ---------- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');const c=e.target.querySelector('[data-c]');if(c)count(c);io.unobserve(e.target)}}),{threshold:.18});
$$('.rv').forEach(el=>io.observe(el));
function count(el){const t=+el.dataset.c,s=el.dataset.s||'',t0=performance.now();(function f(n){const k=eo((n-t0)/2600);el.textContent=Math.round(t*k);if(s){const su=document.createElement('sup');su.textContent=s;el.appendChild(su)}if(k<1)requestAnimationFrame(f)})(t0)}

/* ---------- MANIFESTO ---------- */
const mf=$('#manif'),mfw=mf.textContent.split(' ');mf.textContent='';mfw.forEach(w=>{const sp=document.createElement('span');sp.textContent=w;mf.append(sp,' ')});const mws=[...mf.children];

/* ---------- SERVIZI ---------- */
const SV=[
 ['Nuove costruzioni','Ville, palazzine e complessi residenziali realizzati con strutture antisismiche, materiali certificati e attenzione ai dettagli che fanno la differenza nel tempo.',['Residenziale','Antisismica','Chiavi in mano']],
 ['Ristrutturazioni','Interventi completi o parziali su appartamenti, case indipendenti e condomini: consolidamento, impianti, finiture. Gestiamo anche pratiche e permessi.',['Appartamenti','Condomini','Recupero edilizio']],
 ['Edilizia commerciale','Uffici, negozi, capannoni e spazi produttivi progettati sulle esigenze operative dell\'attività, rispettando tempi e budget concordati.',['Uffici','Capannoni','Retail']],
 ['Efficientamento energetico','Cappotti termici, serramenti, coperture e impianti per migliorare la classe energetica e ridurre i consumi.',['Cappotto','Serramenti','Impianti']],
 ['Opere strutturali','Fondazioni, strutture in cemento armato e opere di consolidamento eseguite da squadre specializzate.',['Cemento armato','Fondazioni','Consolidamento']]
];
const acc=$('#acc');SV.forEach((s,i)=>{const d=document.createElement('div');d.className='it'+(i===0?' open':'');
  d.innerHTML=html(`<button type="button" aria-expanded="${i===0}"><span class="n">0${i+1}</span><span class="t">${esc(s[0])}</span><span class="pl"></span></button><div class="body"><div><div class="inner"><p>${esc(s[1])}</p><div class="tags">${s[2].map(t=>`<span>${esc(t)}</span>`).join('')}</div></div></div></div>`);
  d.querySelector('button').onclick=()=>{const o=d.classList.contains('open');$$('.it').forEach(x=>{x.classList.remove('open');x.querySelector('button').setAttribute('aria-expanded','false')});if(!o){d.classList.add('open');d.querySelector('button').setAttribute('aria-expanded','true')}};acc.appendChild(d)});

/* =================== THREE =================== */
const T=window.THREE;
const W=14,D=10,FH=3.3,Y0=.8,N=8,H=40;
const C0=T?new T.Vector3(13,0,-11):null,UP=T?new T.Vector3(0,1,0):null;
const V3=(x,y,z)=>new T.Vector3(x,y,z);
function tex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;if(rep){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rep,rep)}t.anisotropy=8;return t}
const noise=(base,amp,n,sz=3)=>(g,w,h)=>{if(base){g.fillStyle=base;g.fillRect(0,0,w,h)}for(let i=0;i<n;i++){const v=(Math.random()-.5)*amp;g.fillStyle=v>0?`rgba(255,255,255,${v})`:`rgba(0,0,0,${-v})`;const s=Math.random()*sz+.6;g.fillRect(Math.random()*w,Math.random()*h,s,s)}};
const blot=(base,cols,n,r1,r2)=>(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let i=0;i<n;i++){const x=Math.random()*w,y=Math.random()*h,r=r1+Math.random()*(r2-r1),gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,cols[i%cols.length]);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}};
const both=(...f)=>(g,w,h)=>f.forEach(x=>x(g,w,h));
const grad=st=>(g,w,h)=>{const l=g.createLinearGradient(0,0,0,h);st.forEach(([o,c])=>l.addColorStop(o,c));g.fillStyle=l;g.fillRect(0,0,w,h)};
function beam(a,b,t,m){const d=new T.Vector3().subVectors(b,a),L=d.length(),me=new T.Mesh(new T.BoxGeometry(t,L,t),m);me.position.copy(a).addScaledVector(d,.5);me.quaternion.setFromUnitVectors(UP,d.normalize());me.castShadow=true;return me}
function lerpAng(a,b,t){let d=((b-a)%(Math.PI*2)+Math.PI*3)%(Math.PI*2)-Math.PI;return a+d*t}
const box=(w,h,d,m,x=0,y=0,z=0,sh=true)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=sh;o.receiveShadow=true;return o};

function makeMats(){
  const ct=tex(512,512,both(blot('#c3beb5',['rgba(60,50,40,.10)','rgba(255,255,255,.12)','rgba(90,80,70,.08)'],80,20,90),noise(null,.12,18000,2)),1);
  const st=tex(256,64,(g,w,h)=>{g.fillStyle='#eceae5';g.fillRect(0,0,w,h);g.fillStyle='#b9402c';for(let x=-64;x<w+64;x+=64){g.beginPath();g.moveTo(x,0);g.lineTo(x+22,0);g.lineTo(x+54,h);g.lineTo(x+32,h);g.fill()}});
  const mk=o=>new T.MeshStandardMaterial(o);
  return{conc:mk({map:ct,roughness:.88}),concD:mk({map:ct,color:0x9a958d,roughness:.95}),
    glass:mk({color:0x1c2731,metalness:.92,roughness:.035,transparent:true,opacity:.74,envMapIntensity:1.5}),
    rglass:mk({color:0xb7ccd6,metalness:.1,roughness:.02,transparent:true,opacity:.22,envMapIntensity:1.2}),
    mull:mk({color:0x2a2b2d,metalness:.7,roughness:.35}),band:mk({color:0xefebe3,roughness:.55}),
    inter:mk({color:0x1c1814,emissive:0xffb66c,emissiveIntensity:0,roughness:1}),
    crane:mk({color:0xd9a32a,metalness:.35,roughness:.42}),dark:mk({color:0x2c2e31,metalness:.5,roughness:.5}),
    wood:mk({color:0x7a5a3a,roughness:.9}),leaf:mk({color:0x46613c,roughness:1,flatShading:true}),
    white:mk({color:0xe9e5dd,roughness:.7}),ctx:mk({color:0x8d877e,roughness:.95}),
    vest:mk({color:0xff6a13,roughness:.8}),skin:mk({color:0xb98a6a,roughness:.8}),helm:mk({color:0xf4f2ea,roughness:.35}),
    rail:mk({color:0xd0402f,roughness:.6}),rebar:mk({color:0x5b3e2c,metalness:.4,roughness:.6}),rubber:mk({color:0x161616,roughness:.9}),
    drum:mk({map:st,roughness:.45,metalness:.25}),pv:mk({color:0x16223a,metalness:.6,roughness:.18,envMapIntensity:1.3})}
}

function mergeMeshes(list,mat,shadow=true){let n=0;const gs=list.map(m=>{m.updateMatrixWorld(true);const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrixWorld);n+=g.attributes.position.count;return g});
  const P=new Float32Array(n*3),Q=new Float32Array(n*3);let o=0;gs.forEach(g=>{P.set(g.attributes.position.array,o*3);Q.set(g.attributes.normal.array,o*3);o+=g.attributes.position.count;g.dispose()});
  const G=new T.BufferGeometry();G.setAttribute('position',new T.BufferAttribute(P,3));G.setAttribute('normal',new T.BufferAttribute(Q,3));G.computeBoundingSphere();const m=new T.Mesh(G,mat);m.castShadow=shadow;m.receiveShadow=true;return m}

const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function lowerMetal(sc){sc.traverse(o=>{const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{if(m&&m.metalness!==undefined){if(m.metalness>.25)m.metalness=.2;if(m.roughness<.25)m.roughness=.25;m.needsUpdate=true}})})}
function makeWorld(canvas,o){
  const noEnv0=isIOS||isMob;
  const r=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
  r.setPixelRatio(Math.min(devicePixelRatio,isMob?1.35:1.75));r.outputEncoding=T.sRGBEncoding;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=o.exp;
  r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;
  const s=new T.Scene();s.fog=new T.Fog(o.fog,o.fogN,o.fogF);const fogT=new T.Color(o.fog);
  const hemi=new T.HemisphereLight(0xc4d4e8,0x4a3c2e,o.hemi);s.add(hemi);
  const sun=new T.DirectionalLight(o.sunC||0xffffff,o.sunI);sun.target.position.set(6,0,0);s.add(sun,sun.target);
  sun.castShadow=true;const sc=sun.shadow.camera;sc.left=-44;sc.right=44;sc.top=44;sc.bottom=-44;sc.near=1;sc.far=420;
  sun.shadow.mapSize.set(isMob?1024:2048,isMob?1024:2048);sun.shadow.bias=-.0003;sun.shadow.normalBias=.04;
  const mkDome=(st,rad,op)=>new T.Mesh(new T.SphereGeometry(rad,32,16),new T.MeshBasicMaterial({map:tex(4,256,grad(st)),side:T.BackSide,fog:false,depthWrite:false,toneMapped:false,transparent:op!=null,opacity:op==null?1:op}));
  const vd=mkDome(o.sky,3000);vd.renderOrder=-2;s.add(vd);let vd2=null;if(o.sky2){vd2=mkDome(o.sky2,2900,0);vd2.renderOrder=-1;s.add(vd2)}
  const pm=new T.PMREMGenerator(r),envS=new T.Scene();envS.add(mkDome(o.env,40));const envD2=o.env2?mkDome(o.env2,39,0):null;if(envD2)envS.add(envD2);
  const spot=new T.Mesh(new T.SphereGeometry(1.4,12,8),new T.MeshBasicMaterial({color:0xfff2dc,toneMapped:false}));envS.add(spot);
  let envRT=null;const sd=new T.Vector3();
  function setSun(el,az,env=true){sd.setFromSphericalCoords(1,T.MathUtils.degToRad(90-el),T.MathUtils.degToRad(az));
    sun.position.copy(sun.target.position).addScaledVector(sd,200);spot.position.copy(sd).multiplyScalar(36);
    if(env&&!W0.noEnv){try{const n=pm.fromScene(envS);if(envRT)envRT.dispose();envRT=n;s.environment=n.texture}catch(e){s.environment=null}}}
  const mix=d=>{if(envD2)envD2.material.opacity=d;if(vd2)vd2.material.opacity=d};
  const gt=tex(512,512,both(blot('#615447',['rgba(30,22,15,.22)','rgba(150,128,100,.16)','rgba(70,82,50,.18)'],140,10,60),noise(null,.16,26000,2)),120);
  const gr=new T.Mesh(new T.PlaneGeometry(6000,6000),new T.MeshStandardMaterial({map:gt,roughness:1}));gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;s.add(gr);
  const pt=tex(512,512,both(blot('#8b8378',['rgba(40,35,30,.18)','rgba(255,255,255,.1)'],60,15,70),noise(null,.22,30000,2)),5);
  const pad=new T.Mesh(new T.PlaneGeometry(74,52),new T.MeshStandardMaterial({map:pt,roughness:1}));pad.rotation.x=-Math.PI/2;pad.position.set(9,.02,-1);pad.receiveShadow=true;s.add(pad);
  const cam=new T.PerspectiveCamera(o.fov||34,1,1,8000);
  const res=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;r.setSize(w,h,false);cam.aspect=w/h;
    if(o.off){const f=o.off(w,h);cam.setViewOffset(w,h,f[0]*w,f[1]*h,w,h)}else cam.clearViewOffset();cam.updateProjectionMatrix()};
  addEventListener('resize',res);res();
  const chk=()=>{const pr=r.getPixelRatio();if(canvas.clientWidth&&canvas.clientHeight&&(Math.abs(canvas.clientWidth*pr-r.domElement.width)>2||Math.abs(canvas.clientHeight*pr-r.domElement.height)>2))res()};
  let vis=true;new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(canvas);
  const W0={r,s,cam,sun,hemi,canvas,sky:null,setSun,fogT,mix,chk,noEnv:noEnv0,frames:0,get vis(){return vis}};return W0;
}

function tree(M,sc){const g=new T.Group();const tr=new T.Mesh(new T.CylinderGeometry(.14,.24,2.6,6),M.wood);tr.position.y=1.3;tr.castShadow=true;g.add(tr);
  const n=3+(Math.random()*2|0);for(let i=0;i<n;i++){const f=new T.Mesh(new T.IcosahedronGeometry(1.2+Math.random()*.9,1),M.leaf);f.position.set((Math.random()-.5)*1.6,2.7+i*.8+Math.random()*.4,(Math.random()-.5)*1.6);f.castShadow=true;f.receiveShadow=true;g.add(f)}g.scale.setScalar(sc);g.rotation.y=Math.random()*6;return g}

function context(s,M){
  const wm=new T.MeshStandardMaterial({color:0x8d877e,roughness:.92}),bl=[],tw=[],tl=[];
  for(let i=0;i<(isMob?45:70);i++){const a=Math.random()*Math.PI*2,d=130+Math.random()*320,h=6+Math.random()*30,w=10+Math.random()*22;
    const b=new T.Mesh(new T.BoxGeometry(w,h,w*.7+Math.random()*12));b.position.set(Math.cos(a)*d,h/2,Math.sin(a)*d);b.rotation.y=Math.random()*3;bl.push(b)}
  s.add(mergeMeshes(bl,wm,false));
  for(let i=0;i<(isMob?45:70);i++){const a=Math.random()*Math.PI*2,d=46+Math.random()*90;const t=tree(M,.8+Math.random()*.9);t.position.set(9+Math.cos(a)*d,0,-1+Math.sin(a)*d);t.updateMatrixWorld(true);t.children.forEach((c,j)=>(j?tl:tw).push(c))}
  s.add(mergeMeshes(tw,M.wood));s.add(mergeMeshes(tl,M.leaf));
  [[9,1,-27,74,2,.08],[9,1,25,74,2,.08],[-28,1,-1,.08,2,52],[46,1,-1,.08,2,52]].forEach(([x,y,z,a,b,c])=>s.add(box(a,b,c,M.white,x,y,z)));
  s.add(box(6,2.6,2.4,M.white,-19,1.3,16));s.add(box(6,2.6,2.4,M.white,-19,3.9,16));s.add(box(6,2.6,2.4,M.white,-12.5,1.3,18));
  for(let i=0;i<4;i++)s.add(box(1.2,.5,1,M.wood,36+i*1.5,.25,-16+(i%2)*1.4));
  for(let i=0;i<3;i++)s.add(box(6,.3,.5,M.rebar,34,.15+i*.3,-20));
}

function makeBuilding(s,M){
  const B=new T.Group();s.add(B);
  const pad=box(W+3,Y0,D+3,M.concD,0,Y0/2,0);B.add(pad);
  const cg=new T.BoxGeometry(.5,FH,.5);cg.translate(0,FH/2,0);
  const slabGeo=new T.BoxGeometry(W+.8,.32,D+.8);
  const xs=[-W/2,-W/6,W/6,W/2],zs=[-D/2,0,D/2],m4=new T.Matrix4(),gh=FH-.36;
  const mg=new T.BoxGeometry(.09,gh,.2);mg.translate(0,gh/2,0);
  const mp=[];for(let k=0;k<=7;k++){const x=-W/2-.15+k*(W+.3)/7;mp.push([x,D/2+.24],[x,-D/2-.24])}for(let k=0;k<=5;k++){const z=-D/2-.15+k*(D+.3)/5;mp.push([W/2+.24,z],[-W/2-.24,z])}
  const fg1=new T.BoxGeometry(W+.3,gh,.04),fg2=new T.BoxGeometry(.04,gh,D+.3);
  const bF=new T.BoxGeometry(W+1.04,.5,.12),bS=new T.BoxGeometry(.12,.5,D+1.04);
  const rg=new T.CylinderGeometry(.03,.03,1.1,4);rg.translate(0,.55,0);
  const zw=(W-1.6)/3,zg=new T.BoxGeometry(zw-.15,gh-.3,D-1.6);
  const floors=[];
  for(let i=0;i<N;i++){const base=Y0+i*FH;
    const cols=new T.InstancedMesh(cg,M.conc,12);let k=0;xs.forEach(x=>zs.forEach(z=>{m4.makeTranslation(x,0,z);cols.setMatrixAt(k++,m4)}));
    cols.castShadow=cols.receiveShadow=true;cols.position.y=base;cols.scale.y=.001;cols.visible=false;B.add(cols);
    const slab=new T.Mesh(slabGeo,M.conc);slab.position.y=base+FH+.16;slab.castShadow=slab.receiveShadow=true;slab.visible=false;B.add(slab);
    const rebar=new T.InstancedMesh(rg,M.rebar,48);k=0;xs.forEach(x=>zs.forEach(z=>[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{m4.makeTranslation(x+a*.15,0,z+b*.15);rebar.setMatrixAt(k++,m4)})));
    rebar.position.y=base+FH+.32;rebar.visible=false;rebar.castShadow=true;B.add(rebar);
    const fac=new T.Group();fac.position.y=base;fac.visible=false;B.add(fac);
    const gm=M.glass.clone();gm.opacity=0;
    [[fg1,0,D/2+.2],[fg1,0,-D/2-.2],[fg2,W/2+.2,0],[fg2,-W/2-.2,0]].forEach(([g,x,z])=>{const m=new T.Mesh(g,gm);m.position.set(x,gh/2+.34,z);fac.add(m)});
    const mu=new T.InstancedMesh(mg,M.mull,mp.length);mp.forEach((p,j)=>{m4.makeTranslation(p[0],.34,p[1]);mu.setMatrixAt(j,m4)});mu.castShadow=true;fac.add(mu);
    [[bF,0,D/2+.46],[bF,0,-D/2-.46],[bS,W/2+.46,0],[bS,-W/2-.46,0]].forEach(([g,x,z])=>{const m=new T.Mesh(g,M.band);m.position.set(x,FH+.16,z);m.castShadow=m.receiveShadow=true;fac.add(m)});
    if(i>0)[-W/3+.3,W/3-.3].forEach(bx=>{const z0=D/2+.4;fac.add(box(3.6,.2,1.5,M.band,bx,.22,z0+.75));
      const g1=new T.Mesh(new T.BoxGeometry(3.6,1,.03),M.rglass);g1.position.set(bx,.82,z0+1.48);fac.add(g1);
      [-1,1].forEach(sx=>{const g2=new T.Mesh(new T.BoxGeometry(.03,1,1.5),M.rglass);g2.position.set(bx+sx*1.79,.82,z0+.75);fac.add(g2)});
      fac.add(box(3.62,.05,.06,M.mull,bx,1.34,z0+1.48))});
    const ims=[],lits=[];for(let z=0;z<3;z++){const im=M.inter.clone();im.color.setHSL(.08,.12,.08+Math.random()*.06);const m=new T.Mesh(zg,im);m.position.set(-zw+z*zw,gh/2+.34,0);fac.add(m);ims.push(im);lits.push(Math.random()<.72?.35+Math.random()*.8:.03)}
    floors.push({cols,slab,rebar,fac,gm,ims,lits});
  }
  const roof=new T.Group();roof.position.y=Y0+N*FH+.32;roof.visible=false;B.add(roof);
  [[W+1.04,1.1,.2,0,D/2+.42],[W+1.04,1.1,.2,0,-D/2-.42],[.2,1.1,D+1.04,W/2+.42,0],[.2,1.1,D+1.04,-W/2-.42,0]].forEach(([a,b,c,x,z])=>roof.add(box(a,b,c,M.band,x,b/2,z)));
  roof.add(box(3.6,2,2.6,M.dark,-4,1,0));roof.add(box(1.4,.8,1.4,M.mull,-1.4,.4,-2.4));
  for(let r=0;r<2;r++)for(let c=0;c<4;c++){const p=box(1.7,.06,1.05,M.pv,1.4+c*1.85,.55,-2.2+r*2.6);p.rotation.x=-.42;roof.add(p);roof.add(box(.06,.5,.06,M.mull,1.4+c*1.85,.25,-2.2+r*2.6+.3))}
  return{B,pad,floors,roof,slabGeo};
}

function makeCrane(s,M){
  const c=new T.Group();c.position.copy(C0);s.add(c);const a=1,mb=[],jb=[];
  c.add(box(5,1.2,5,M.concD,0,.6,0));[[-1.6,-1.6],[1.6,1.6]].forEach(([x,z])=>c.add(box(1.4,.9,1.4,M.concD,x,1.65,z)));
  [[-a,-a],[a,-a],[a,a],[-a,a]].forEach(([x,z])=>mb.push(beam(V3(x,1.2,z),V3(x,H,z),.2,M.crane)));
  for(let y=1.2,k=0;y<H-.5;y+=3,k++){const y2=Math.min(H,y+3),f=k%2?1:-1;
    mb.push(beam(V3(-a*f,y,a),V3(a*f,y2,a),.09,M.crane),beam(V3(a*f,y,-a),V3(-a*f,y2,-a),.09,M.crane),beam(V3(a,y,a*f),V3(a,y2,-a*f),.09,M.crane),beam(V3(-a,y,-a*f),V3(-a,y2,a*f),.09,M.crane));
    mb.push(beam(V3(-a,y,a),V3(a,y,a),.07,M.crane),beam(V3(-a,y,-a),V3(a,y,-a),.07,M.crane),beam(V3(a,y,-a),V3(a,y,a),.07,M.crane),beam(V3(-a,y,-a),V3(-a,y,a),.07,M.crane))}
  c.add(mergeMeshes(mb,M.crane));
  const sl=new T.Group();sl.position.y=H;c.add(sl);const y0=1.2,h=1.6,w=.8,L=44,CL=13;
  sl.add(box(2.6,1.2,2.6,M.crane,0,.6,0));sl.add(box(1.9,1.9,1.7,M.white,1.4,.3,1.9));
  const cw=new T.Mesh(new T.BoxGeometry(1.94,.9,1.74),M.glass);cw.position.set(1.4,.62,1.9);sl.add(cw);
  jb.push(beam(V3(0,y0,w),V3(L,y0,w),.15,M.crane));jb.push(beam(V3(0,y0,-w),V3(L,y0,-w),.15,M.crane));jb.push(beam(V3(0,y0+h,0),V3(L-1,y0+h,0),.15,M.crane));
  for(let x=0;x<L-1.5;x+=2.2){jb.push(beam(V3(x,y0,w),V3(x+2.2,y0+h,0),.07,M.crane));jb.push(beam(V3(x,y0,-w),V3(x+2.2,y0+h,0),.07,M.crane))}
  jb.push(beam(V3(0,y0,w),V3(-CL,y0,w),.17,M.crane));jb.push(beam(V3(0,y0,-w),V3(-CL,y0,-w),.17,M.crane));
  for(let x=0;x>-CL+1;x-=2.6)jb.push(beam(V3(x,y0,w),V3(x-2.6,y0,-w),.07,M.crane));
  jb.push(beam(V3(0,y0+1.1,w+.1),V3(-CL,y0+1.1,w+.1),.05,M.crane));jb.push(beam(V3(0,y0+1.1,-w-.1),V3(-CL,y0+1.1,-w-.1),.05,M.crane));
  for(let k=0;k<3;k++)sl.add(box(.9,2.6,2.2,M.concD,-CL+1.2+k*.95,y0-.7,0));
  const P=V3(0,y0+8,0);[[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([x,z])=>jb.push(beam(V3(x*.9,y0,z*.8),P,.15,M.crane)));
  sl.add(new T.LineSegments(new T.BufferGeometry().setFromPoints([V3(L*.62,y0+h,0),P,P,V3(-CL+1,y0,0),V3(L*.3,y0+h,0),P]),new T.LineBasicMaterial({color:0x222222})));
  sl.add(mergeMeshes(jb,M.crane));
  const tip=new T.Mesh(new T.SphereGeometry(.22,8,6),new T.MeshBasicMaterial({color:0xff3a1a}));tip.position.set(L,y0+h+.3,0);sl.add(tip);
  const tr=box(1.5,.5,1.9,M.dark,0,y0-.25,0);sl.add(tr);
  const hook=new T.Group();hook.add(box(.9,1.1,.7,M.crane,0,.75,0));hook.add(box(.5,.3,.72,M.dark,0,1.25,0));
  const hk=new T.Mesh(new T.TorusGeometry(.22,.07,6,12,Math.PI*1.4),M.dark);hk.position.y=.1;hk.rotation.z=Math.PI*.8;hook.add(hk);s.add(hook);
  const rg=new T.BufferGeometry();rg.setAttribute('position',new T.BufferAttribute(new Float32Array(12),3));
  const rope=new T.LineSegments(rg,new T.LineBasicMaterial({color:0x141414,transparent:true}));rope.frustumCulled=false;s.add(rope);
  const tw=new T.Vector3();
  const tWorld=(th,r,o)=>o.set(C0.x+r*Math.cos(th),H+y0-.5,C0.z-r*Math.sin(th));
  function set(th,r,hp){sl.rotation.y=th;tr.position.x=r;tWorld(th,r,tw);hook.position.copy(hp);const A=rg.attributes.position.array;
    A[0]=tw.x-.3;A[1]=tw.y;A[2]=tw.z;A[3]=hp.x-.12;A[4]=hp.y+1.4;A[5]=hp.z;A[6]=tw.x+.3;A[7]=tw.y;A[8]=tw.z;A[9]=hp.x+.12;A[10]=hp.y+1.4;A[11]=hp.z;rg.attributes.position.needsUpdate=true}
  return{c,hook,rope,set,tWorld,tip};
}
const pol=v=>({th:Math.atan2(-(v.z-C0.z),v.x-C0.x),r:Math.hypot(v.x-C0.x,v.z-C0.z)});

function mixer(M){const g=new T.Group();
  g.add(box(7.6,.45,2.1,M.dark,0,1.05,0));g.add(box(2,2.1,2.3,M.white,2.9,2.15,0));
  const ws=new T.Mesh(new T.BoxGeometry(.06,.9,2.05),M.glass);ws.position.set(3.92,2.6,0);g.add(ws);
  const piv=new T.Group();piv.position.set(-.8,2.75,0);piv.rotation.z=-.17;g.add(piv);const spin=new T.Group();piv.add(spin);
  const dr=new T.Mesh(new T.CylinderGeometry(.75,1.25,4.2,28),M.drum);dr.rotation.z=Math.PI/2;dr.castShadow=true;spin.add(dr);
  const cap=new T.Mesh(new T.CylinderGeometry(.35,.75,.8,20),M.drum);cap.rotation.z=Math.PI/2;cap.position.x=-2.5;spin.add(cap);
  [2.6,-1.3,-2.7].forEach(x=>[-1.05,1.05].forEach(z=>{const wh=new T.Mesh(new T.CylinderGeometry(.52,.52,.4,18),M.rubber);wh.rotation.x=Math.PI/2;wh.position.set(x,.52,z);wh.castShadow=true;g.add(wh)}));
  g.add(beam(V3(-3.4,2.6,0),V3(-4.4,1.4,0),.25,M.dark));
  return{g,spin}}

function worker(M){const g=new T.Group();const leg=()=>{const l=new T.Mesh(new T.BoxGeometry(.15,.85,.17),M.dark);l.geometry.translate(0,-.42,0);l.castShadow=true;return l};
  const l1=leg(),l2=leg();l1.position.set(-.1,.88,0);l2.position.set(.1,.88,0);
  const arm=()=>{const a=new T.Mesh(new T.BoxGeometry(.11,.6,.13),M.vest);a.geometry.translate(0,-.3,0);a.castShadow=true;return a};const a1=arm(),a2=arm();a1.position.set(-.28,1.48,0);a2.position.set(.28,1.48,0);
  const body=box(.44,.64,.26,M.vest,0,1.2,0),head=new T.Mesh(new T.SphereGeometry(.12,10,8),M.skin);head.position.y=1.66;
  const hel=new T.Mesh(new T.SphereGeometry(.15,12,6,0,Math.PI*2,0,Math.PI/2),M.helm);hel.position.y=1.69;hel.castShadow=true;
  g.add(l1,l2,a1,a2,body,head,hel);g.userData={l1,l2,a1,a2,t:V3(0,0,0),wait:Math.random()*2,ph:Math.random()*6};return g}
function walk(g,dt){const u=g.userData;
  if(u.wait>0){u.wait-=dt;[u.l1,u.l2,u.a1,u.a2].forEach(x=>x.rotation.x*=.85);return}
  const dx=u.t.x-g.position.x,dz=u.t.z-g.position.z,d=Math.hypot(dx,dz);
  if(d<.12){u.wait=1.5+Math.random()*3.5;u.t.set((Math.random()-.5)*(W-2.5),0,(Math.random()-.5)*(D-2.5));return}
  g.position.x+=dx/d*1.05*dt;g.position.z+=dz/d*1.05*dt;g.rotation.y=lerpAng(g.rotation.y,Math.atan2(dx,dz),Math.min(1,dt*5));
  u.ph+=dt*7.5;const a=Math.sin(u.ph)*.55;u.l1.rotation.x=a;u.l2.rotation.x=-a;u.a1.rotation.x=-a*.7;u.a2.rotation.x=a*.7}
function rails(M){const g=new T.Group(),pts=[],m4=new T.Matrix4(),hw=W/2+.3,hd=D/2+.3;
  for(let x=-hw;x<=hw+.01;x+=(2*hw)/8){pts.push([x,hd],[x,-hd])}for(let z=-hd+(2*hd)/5;z<hd-.01;z+=(2*hd)/5){pts.push([hw,z],[-hw,z])}
  const pg=new T.BoxGeometry(.06,1.1,.06);pg.translate(0,.55,0);const po=new T.InstancedMesh(pg,M.dark,pts.length);pts.forEach((p,i)=>{m4.makeTranslation(p[0],0,p[1]);po.setMatrixAt(i,m4)});g.add(po);
  [.5,1.05].forEach(y=>{g.add(box(2*hw,.08,.04,M.rail,0,y,hd));g.add(box(2*hw,.08,.04,M.rail,0,y,-hd));g.add(box(.04,.08,2*hd,M.rail,hw,y,0));g.add(box(.04,.08,2*hd,M.rail,-hw,y,0))});
  return g}

const worlds=[];
function heroW(){
  const w=makeWorld($('#c1'),{exp:1,fog:0xeec09a,fogN:140,fogF:1100,hemi:.5,sunC:0xffd2a2,sunI:2.7,
    sky:[[0,'#24304a'],[.28,'#5f6b88'],[.43,'#c99a80'],[.5,'#eec09a'],[1,'#eec09a']],
    env:[[0,'#3a4560'],[.35,'#8a8a98'],[.5,'#f0c39a'],[.55,'#8c7a68'],[1,'#4e4338']],off:(w,h)=>w>h?[-.16,0]:[0,.14]});
  w.setSun(6.5,-52);
  const M=makeMats(),bl=makeBuilding(w.s,M);context(w.s,M);const cr=makeCrane(w.s,M);
  const mx=mixer(M);mx.g.position.set(-12,0,12.5);mx.g.rotation.y=-.35;w.s.add(mx.g);
  const rl=rails(M);w.s.add(rl);
  const wk=[0,1,2,3].map(()=>{const g=worker(M);g.position.set((Math.random()-.5)*(W-3),0,(Math.random()-.5)*(D-3));g.userData.t.copy(g.position);w.s.add(g);return g});
  const g2=worker(M);g2.position.set(-8.5,0,10);g2.rotation.y=1.2;w.s.add(g2);
  const P0=new T.Vector3(32,0,7),PP=pol(P0),PT=pol(new T.Vector3(0,0,0));
  const PRE=3,SL=3.4,HH=H-4.6,DUR=[2.8,1.5,1.7,3.4,2.2,1.2,4];
  [-2.5,2.5].forEach(o=>{const d=new T.Mesh(new T.BoxGeometry(.3,.3,D+1.4),M.wood);d.position.set(P0.x+o*Math.cos(PP.th-PT.th),.15,P0.z-o*Math.sin(PP.th-PT.th));d.rotation.y=PP.th-PT.th;d.castShadow=true;w.s.add(d)});
  const stack=[];for(let k=0;k<N-PRE;k++){const m=new T.Mesh(bl.slabGeo,M.conc);m.position.set(P0.x,.46+k*.34,P0.z);m.rotation.y=PP.th-PT.th;m.castShadow=m.receiveShadow=true;w.s.add(m);stack.push(m)}
  const load=new T.Mesh(bl.slabGeo,M.conc);load.castShadow=true;load.visible=false;w.s.add(load);
  const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(new Float32Array(24),3));const sling=new T.LineSegments(sg,new T.LineBasicMaterial({color:0x1d1d1d}));sling.frustumCulled=false;sling.visible=false;w.s.add(sling);
  const corners=[[1,1],[1,-1],[-1,1],[-1,-1]].map(([a,b])=>new T.Vector3(a*(W/2-.6),.16,b*(D/2-.6))),tmp=new T.Vector3();
  const fac=[],colT=[];
  for(let i=0;i<PRE;i++){const f=bl.floors[i];f.cols.visible=true;f.cols.scale.y=1;f.slab.visible=true;if(i<PRE-1)fac[i]=-20}
  bl.floors[PRE-1].rebar.visible=true;
  let st={th:PT.th+.9,r:20,hy:HH},from,to,ph=-1,pt=0,fi=PRE,carry=false,roofT=null,tm=0,wy=Y0+PRE*FH+.32;
  const hp=new T.Vector3(),hv=new T.Vector3(),tw=new T.Vector3();cr.tWorld(st.th,st.r,tw);hp.set(tw.x,HH,tw.z);
  const pickY=()=>.46+(stack.length-1)*.34+.16+SL;
  const tgt=p=>[{th:PP.th,r:PP.r,hy:HH},{th:PP.th,r:PP.r,hy:pickY()},{th:PP.th,r:PP.r,hy:HH},{th:PT.th,r:PT.r,hy:HH},{th:PT.th,r:PT.r,hy:Y0+(fi+1)*FH+.32+SL},{th:PT.th,r:PT.r,hy:HH},{th:PT.th+1.05,r:22,hy:HH}][p];
  const hudF=$('#hudF'),hudS=$('#hudS'),LBL=['Rotazione gru','Aggancio solaio','Sollevamento','Trasporto in quota','Posa solaio','Sgancio','Struttura completata'];
  function start(p){ph=p;pt=0;from={...st};to=tgt(p);
    if(p===0)colT[fi]=tm;
    if(p===2){carry=true;const m=stack.pop();m.visible=false;load.visible=sling.visible=true}
    if(p===5){carry=false;load.visible=sling.visible=false;bl.floors[fi].slab.visible=true;if(fi<N-1)bl.floors[fi].rebar.visible=true;if(fi>0)fac[fi-1]=tm+.4;fi++;wy=Y0+fi*FH+.32;wk.forEach(g=>g.position.y=wy);if(fi===N){fac[N-1]=tm+2;roofT=tm+2.6}}
    hudF.textContent=`Piano ${String(Math.min(p===6?N:fi+1,N)).padStart(2,'0')} / 0${N}`;hudS.textContent=LBL[p];
  }
  wk.forEach(g=>g.position.y=wy);
  w.update=(dt,t)=>{tm+=dt;
    if(ph<0&&readyT!==null&&t-readyT>1.2)start(0);
    if(ph>=0&&ph<7){pt+=dt;const k=ss(pt/DUR[ph]);const kr=ph===3?ss((pt/DUR[ph]-.12)/.88):k;
      st.th=lerpAng(from.th,to.th,k);st.r=lerp(from.r,to.r,kr);st.hy=lerp(from.hy,to.hy,k);
      if(pt>=DUR[ph]){if(ph<5)start(ph+1);else if(ph===5)start(fi<N?0:6);else ph=7}}
    if(ph===7)st.th=lerpAng(st.th,PT.th+1.05+Math.sin(tm*.12)*.18,Math.min(1,dt*.6));
    cr.tWorld(st.th,st.r,tw);
    hv.x+=((tw.x-hp.x)*2.6-hv.x*.75)*dt;hv.z+=((tw.z-hp.z)*2.6-hv.z*.75)*dt;hp.x+=hv.x*dt;hp.z+=hv.z*dt;
    if(ph===1||ph===4){const q=ss(pt/DUR[ph]);hp.x=lerp(hp.x,tw.x,q*q);hp.z=lerp(hp.z,tw.z,q*q);hv.multiplyScalar(1-q*.12)}
    hp.y=st.hy;cr.set(st.th,st.r,hp);
    if(carry){load.position.set(hp.x,hp.y-SL-.16,hp.z);load.rotation.y=st.th-PT.th+Math.sin(tm*.8)*.015;
      const A=sg.attributes.position.array;corners.forEach((c,j)=>{tmp.copy(c).applyAxisAngle(UP,load.rotation.y).add(load.position);A.set([hp.x,hp.y,hp.z,tmp.x,tmp.y,tmp.z],j*6)});sg.attributes.position.needsUpdate=true}
    bl.floors.forEach((f,i)=>{if(colT[i]!=null){const k=ss((tm-colT[i])/3.6);f.cols.visible=k>0;f.cols.scale.y=Math.max(.001,k);if(i>0&&k>.35)bl.floors[i-1].rebar.visible=false}
      if(fac[i]!=null){const k=ss((tm-fac[i])/3);f.fac.visible=k>0;f.fac.scale.y=Math.max(.001,k);f.gm.opacity=.74*k;f.ims.forEach((m,j)=>m.emissiveIntensity=f.lits[j]*ss((tm-fac[i]-2.5)/1.8))}});
    if(roofT!=null){const k=ss((tm-roofT)/2);bl.roof.visible=k>0;bl.roof.scale.y=Math.max(.001,k)}
    rl.position.y=wy;rl.visible=roofT===null||tm<roofT;
    wk.forEach(g=>{g.visible=rl.visible;walk(g,dt)});
    mx.spin.rotation.x+=dt*1.6;cr.tip.visible=Math.sin(tm*4)>0;
    const intro=readyT===null?0:ss((t-readyT)/6),port=w.cam.aspect<1;
    const R=lerp(port?118:56,port?104:76,intro),az=.74+tm*.01+Math.sin(tm*.07)*.02+nx*.07,el=lerp(.5,.3,intro)-ny*.04+Math.sin(tm*.11)*.004;
    const tg=new T.Vector3(port?6:5,port?15:12,0);
    w.cam.position.set(tg.x+R*Math.cos(el)*Math.sin(az),tg.y+R*Math.sin(el),tg.z+R*Math.cos(el)*Math.cos(az));w.cam.lookAt(tg);
  };
  worlds.push(w);
}
function buildW(){
  const sec=$('#build');
  const w=makeWorld($('#c2'),{exp:1,fog:0xe1e9ef,fogN:160,fogF:1300,hemi:.55,sunC:0xfff3e4,sunI:2.6,fov:32,
    sky:[[0,'#4c7cb6'],[.3,'#8eb1d6'],[.45,'#cfdeea'],[.5,'#e1e9ef'],[1,'#e1e9ef']],sky2:[[0,'#141a2b'],[.3,'#45486a'],[.44,'#c47a5c'],[.5,'#e59e72'],[1,'#e59e72']],
    env:[[0,'#5c86b9'],[.35,'#a3c0dc'],[.5,'#e6edf1'],[.55,'#8f877b'],[1,'#5e564c']],env2:[[0,'#1c2236'],[.35,'#5d5a6e'],[.5,'#f0a070'],[.55,'#6e5a4a'],[1,'#3b322b']]});
  w.setSun(52,-40);
  const M=makeMats();const bl=makeBuilding(w.s,M);context(w.s,M);
  const cM={crane:M.crane.clone(),concD:M.concD.clone(),white:M.white.clone(),glass:M.glass.clone(),dark:M.dark.clone()};Object.values(cM).forEach(m=>m.transparent=true);
  const cr=makeCrane(w.s,cM);const PT=pol(new T.Vector3(0,0,0));
  const mx=mixer(M);mx.g.position.set(-60,0,10.5);w.s.add(mx.g);
  const v=[],A=(a,b,c,d)=>v.push(a,.08,b,c,.08,d);
  [-W/2,-W/6,W/6,W/2].forEach(x=>A(x,-D/2-6,x,D/2+6));[-D/2,0,D/2].forEach(z=>A(-W/2-6,z,W/2+6,z));
  const rc=(x,z,a,b)=>{A(x,z,x+a,z);A(x+a,z,x+a,z+b);A(x+a,z+b,x,z+b);A(x,z+b,x,z)};rc(-W/2-1.5,-D/2-1.5,W+3,D+3);
  A(-W/2,D/2+4,W/2,D/2+4);A(-W/2-4,-D/2,-W/2-4,D/2);
  [-W/2,-W/6,W/6,W/2].forEach(x=>{for(let k=0;k<12;k++){const a1=k/12*Math.PI*2,a2=(k+1)/12*Math.PI*2;A(x+Math.cos(a1)*.8,D/2+6.8+Math.sin(a1)*.8,x+Math.cos(a2)*.8,D/2+6.8+Math.sin(a2)*.8)}});
  const bpM=new T.MeshBasicMaterial({color:0xfff1d6,transparent:true,toneMapped:false,fog:false}),bps=[];
  for(let i=0;i<v.length;i+=6){const x1=v[i],z1=v[i+2],x2=v[i+3],z2=v[i+5],L=Math.hypot(x2-x1,z2-z1);const g=new T.PlaneGeometry(1,.16);g.translate(.5,0,0);const m=new T.Mesh(g,bpM);m.rotation.x=-Math.PI/2;m.rotation.z=Math.atan2(-(z2-z1),x2-x1);m.position.set(x1,.1,z1);m.userData.L=L;m.scale.x=.001;m.visible=false;w.s.add(m);bps.push(m)}
  const pit=new T.Mesh(new T.PlaneGeometry(W+6,D+6),new T.MeshStandardMaterial({color:0x3a3028,roughness:1,transparent:true,opacity:0}));pit.rotation.x=-Math.PI/2;pit.position.y=.05;pit.receiveShadow=true;w.s.add(pit);
  const fw=new T.Group();w.s.add(fw);[[W+3.4,0,(D+3.4)/2,0],[W+3.4,0,-(D+3.4)/2,0],[D+3.4,(W+3.4)/2,0,1],[D+3.4,-(W+3.4)/2,0,1]].forEach(([l,x,z,r])=>{const m=box(l,Y0+.3,.14,M.wood,x,(Y0+.3)/2,z);if(r)m.rotation.y=Math.PI/2;fw.add(m)});
  const lawn=new T.Mesh(new T.PlaneGeometry(40,30),new T.MeshStandardMaterial({color:0x56703f,roughness:1,transparent:true,opacity:0}));lawn.rotation.x=-Math.PI/2;lawn.position.y=.06;lawn.receiveShadow=true;w.s.add(lawn);
  const path=new T.Mesh(new T.PlaneGeometry(3,13),new T.MeshStandardMaterial({color:0xd8cfbf,roughness:.9,transparent:true,opacity:0}));path.rotation.x=-Math.PI/2;path.position.set(0,.08,D/2+8);w.s.add(path);
  const gt=[];[[-13,9],[-13,-6],[-4.5,12],[5,12.5],[13,8],[13,-7],[-9,-10],[3,-11],[-15,2],[15,1]].forEach(([x,z])=>{const t=tree(M,1);t.position.set(x,0,z);t.scale.setScalar(.001);w.s.add(t);gt.push(t)});
  const phs=$$('#phases li'),pdesc=$('#pdesc'),pfill=$('#pfill'),capL=$('#capL'),capP=$('#capP');
  const DS=['Rilievi, progetto architettonico e strutturale, permessi: ogni dettaglio viene definito prima di aprire il cantiere.','Scavo, casseforme e getto della platea di fondazione in cemento armato: la base di tutto.','Pilastri e solai crescono piano dopo piano, con verifiche costanti della direzione lavori.','Facciate vetrate, balconi, serramenti e impianti: l\'edificio prende forma e carattere.','Sistemazioni esterne, collaudi e consegna delle chiavi, nei tempi concordati.'];
  const B=[0,.14,.28,.6,.82];let cur=-1,p=0,ps=0,lastD=-1;
  const dayF=new T.Color(0xe1e9ef),duskF=new T.Color(0xe59e72),sunD=new T.Color(0xfff3e4),sunK=new T.Color(0xffa15e),hp=new T.Vector3(),tw=new T.Vector3();
  function txt(q){let i=0;B.forEach((b,j)=>{if(q>=b)i=j});if(i!==cur){cur=i;phs.forEach((l,j)=>l.classList.toggle('on',j===i));pdesc.style.opacity=0;setTimeout(()=>{pdesc.textContent=DS[i];pdesc.style.opacity=1},200);capL.textContent='Fase 0'+(i+1)}
    pfill.style.width=q*100+'%';capP.textContent=Math.round(q*100)+'%'}
  w.update=(dt,t)=>{
    const r=sec.getBoundingClientRect();p=clamp(-r.top/(r.height-innerHeight));ps+=(p-ps)*Math.min(1,dt*3.2);const q=ps;txt(p);
    const bk=seg(q,0,.12)*bps.length;bps.forEach((m,i)=>{const k=clamp(bk-i*.85);m.visible=k>0;m.scale.x=Math.max(.001,m.userData.L*k)});bpM.opacity=.95*(1-seg(q,.3,.42));
    pit.material.opacity=ss(seg(q,.13,.18))*(1-seg(q,.84,.9));
    const fk=ss(seg(q,.16,.2));fw.visible=fk>0&&q<.3;fw.scale.y=Math.max(.001,fk);
    const pk=ss(seg(q,.2,.27));bl.pad.scale.y=Math.max(.001,pk);bl.pad.position.y=Y0/2*pk;bl.pad.visible=pk>0;
    mx.g.position.x=lerp(-60,-15,ss(seg(q,.14,.2)))-lerp(0,50,ss(seg(q,.28,.34)));mx.spin.rotation.x+=dt*1.6;mx.g.visible=q>.13&&q<.35;
    bl.floors.forEach((f,i)=>{const a=.28+i*.04,ck=ss(seg(q,a,a+.026)),sk=ss(seg(q,a+.022,a+.04));
      f.cols.visible=ck>0;f.cols.scale.y=Math.max(.001,ck);f.slab.visible=sk>0;f.slab.scale.set(lerp(.6,1,sk),Math.max(.001,sk),lerp(.6,1,sk));
      f.rebar.visible=sk>.9&&i<N-1&&q<.28+(i+1)*.04+.01;
      const b=.6+i*.026,fk2=ss(seg(q,b,b+.045));f.fac.visible=fk2>0;f.fac.scale.y=Math.max(.001,fk2);f.gm.opacity=.74*fk2;
      f.ims.forEach((m,j)=>m.emissiveIntensity=f.lits[j]*ss(seg(q,.88+i*.01+j*.004,.96+i*.004)))});
    const rk=ss(seg(q,.8,.84));bl.roof.visible=rk>0;bl.roof.scale.y=Math.max(.001,rk);
    const ca=(1-ss(seg(q,.85,.91)));Object.values(cM).forEach(m=>m.opacity=m===cM.glass?.74*ca:ca);cr.rope.material.opacity=ca;
    cr.c.visible=cr.hook.visible=cr.rope.visible=ca>.01;
    const th=PT.th+.25+Math.sin(q*24)*.55,rr=17+Math.sin(q*15)*6;cr.tWorld(th,rr,tw);hp.set(tw.x,H-10-Math.abs(Math.sin(q*19))*14,tw.z);cr.set(th,rr,hp);cr.tip.visible=Math.sin(t*4)>0;
    lawn.material.opacity=path.material.opacity=ss(seg(q,.84,.9));gt.forEach((g,i)=>g.scale.setScalar(Math.max(.001,eo(seg(q,.84+i*.007,.9+i*.007)))));
    const d=ss(seg(q,.84,1));
    w.setSun(lerp(52,4,d),lerp(-40,-62,d),Math.abs(d-lastD)>.07||(d===1&&lastD!==1));if(Math.abs(d-lastD)>.07||(d===1&&lastD!==1))lastD=d;
    w.mix(d);w.fogT.copy(dayF).lerp(duskF,d);w.sun.intensity=lerp(2.6,2.2,d);w.sun.color.copy(sunD).lerp(sunK,d);w.hemi.intensity=lerp(.55,.3,d);
    const port=w.cam.aspect<1.1,az=lerp(-.55,.72,q)+nx*.03,el=lerp(.8,.27,ss(seg(q,.05,.75))),R=lerp(70,62,q)*(port?1.3:1);
    const tg=new T.Vector3(1,lerp(3,11,ss(seg(q,.1,.8))),0);
    w.cam.position.set(tg.x+R*Math.cos(el)*Math.sin(az),tg.y+R*Math.sin(el),tg.z+R*Math.cos(el)*Math.cos(az));w.cam.lookAt(tg);
  };
  worlds.push(w);
}
[[heroW,'#c1','linear-gradient(160deg,#2a3142,#c79b7a)'],[buildW,'#c2','linear-gradient(160deg,#6e8fb6,#e2e6e6)']].forEach(([f,c,bgc])=>{try{if(!T)throw 0;f();const w=worlds[worlds.length-1];w.bgc=bgc;if(w.noEnv){w.s.environment=null;lowerMetal(w.s);w.hemi.intensity*=1.25}}catch(e){console.warn(e);$(c).style.background=bgc}});
const px=new Uint8Array(4);
function whiteCheck(w){try{const gl=w.r.getContext(),W_=gl.drawingBufferWidth,H_=gl.drawingBufferHeight;let n=0;[[.5,.5],[.3,.35],[.7,.35],[.3,.7],[.7,.7]].forEach(([a,b])=>{gl.readPixels(W_*a|0,H_*b|0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);if(px[0]>238&&px[1]>238&&px[2]>238)n++});return n>=4}catch(e){return false}}
function safeMode(w){w.noEnv=true;w.s.environment=null;lowerMetal(w.s);w.r.shadowMap.enabled=false;w.s.traverse(o=>{if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)})}
let last=performance.now();
(function loop(n){requestAnimationFrame(loop);const dt=Math.min(.05,(n-last)/1000);last=n;const t=n/1000;
  worlds.forEach(w=>{if(!w.vis||w.dead)return;try{w.chk();w.update(dt,t)}catch(e){if(!w.err){w.err=1;console.warn(e)}}w.s.fog.color.lerp(w.fogT,Math.min(1,dt*2.5));w.r.render(w.s,w.cam);w.frames++;
    if(w.frames===12||w.frames===60){if(whiteCheck(w)){if(!w.safe){w.safe=1;safeMode(w);w.frames=13}else{w.dead=1;w.canvas.style.opacity=0;w.canvas.parentNode.style.background=w.bgc}}}});
})(last);

/* ---------- SCROLL ---------- */
const top=$('#top'),tc=$('#top circle');
function hsize(){}
function onScroll(){const y=scrollY,h=document.documentElement.scrollHeight-innerHeight;top.classList.toggle('on',y>innerHeight);tc.style.strokeDashoffset=151*(1-y/h);
  const r=mf.getBoundingClientRect(),k=clamp((innerHeight*.82-r.top)/(r.height+innerHeight*.25))*mws.length;mws.forEach((w,i)=>w.style.opacity=.14+.86*clamp(k-i));
}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',()=>{hsize();onScroll()});
top.onclick=()=>scrollTo({top:0,behavior:'smooth'});

/* ---------- PRIMA / DOPO ---------- */
function house(af){const id=af?'a':'b',wall=af?'#efe4d0':'#b5a084',trim=af?'#f8f3ea':'#9c917f',shut=af?'#2f4b3c':'#7c8870';
  const ups=[275,365,575,665],dns=[275,365,575,665];
  let s=`<svg viewBox="0 0 1000 540" preserveAspectRatio="xMidYMid slice"><defs>
  <linearGradient id="sk${id}" x1="0" y1="0" x2="0" y2="1">${af?'<stop offset="0" stop-color="#6f8db0"/><stop offset=".6" stop-color="#e6c49e"/><stop offset="1" stop-color="#f2d9b8"/>':'<stop offset="0" stop-color="#868b8e"/><stop offset="1" stop-color="#c5c6c1"/>'}</linearGradient>
  <linearGradient id="gl${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${af?'#9fb6cc':'#1e1c19'}"/><stop offset=".5" stop-color="${af?'#e7caa6':'#2a2723'}"/><stop offset="1" stop-color="${af?'#ffcf87':'#1a1815'}"/></linearGradient>
  <linearGradient id="sh${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <linearGradient id="lt${id}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd8a8" stop-opacity="${af?.35:0}"/><stop offset=".6" stop-color="#ffd8a8" stop-opacity="0"/></linearGradient>
  <radialGradient id="sn${id}"><stop offset="0" stop-color="#fff4d6"/><stop offset=".3" stop-color="#ffe2b0" stop-opacity=".8"/><stop offset="1" stop-color="#ffd09a" stop-opacity="0"/></radialGradient>
  <filter id="pl${id}"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${af?.1:.28} 0"/></filter>
  <filter id="gr${id}"><feTurbulence type="fractalNoise" baseFrequency=".035 .004" numOctaves="4" seed="9"/><feColorMatrix values="0 0 0 0 .16 0 0 0 0 .13 0 0 0 0 .09 0 0 0 2.6 -1.05"/></filter>
  <filter id="pe${id}"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 .6 0 0 0 0 .38 0 0 0 0 .27 0 0 0 9 -5.3"/></filter>
  <pattern id="tl${id}" width="22" height="12" patternUnits="userSpaceOnUse"><path d="M0 11.5H22M11 0V12" stroke="#000" stroke-opacity="${af?.18:.35}" stroke-width="1.2"/></pattern>
  <clipPath id="wc${id}"><rect x="230" y="186" width="540" height="294"/></clipPath></defs>
  <rect width="1000" height="480" fill="url(#sk${id})"/>`;
  if(af)s+=`<circle cx="840" cy="130" r="140" fill="url(#sn${id})"/>`;
  s+=`<path d="M0 480V420c40-30 80-34 120-14c30-34 80-36 110 0V480ZM770 480V412c30-36 90-40 120-8c30-28 80-20 110 6V480Z" fill="${af?'#5e7050':'#646a5b'}" opacity=".85"/>
  <polygon points="200,180 500,88 800,180" fill="${af?'#a8573b':'#6a5245'}"/><polygon points="200,180 500,88 800,180" fill="url(#tl${id})"/>`;
  if(!af)s+=`<path d="M380 140l26-8 6 14-24 7zM560 128l30 6-6 16-28-6zM640 160l22-2 2 12-22 2z" fill="#3a2d25"/>`;
  s+=`<rect x="200" y="172" width="600" height="16" fill="${trim}"/><rect x="230" y="186" width="540" height="294" fill="${wall}"/>
  <g clip-path="url(#wc${id})"><rect x="230" y="186" width="540" height="294" filter="url(#pl${id})"/>${af?'':`<rect x="230" y="186" width="540" height="294" filter="url(#gr${id})"/><rect x="230" y="186" width="540" height="294" filter="url(#pe${id})"/>`}
  <rect x="230" y="186" width="540" height="22" fill="url(#sh${id})"/></g>
  <rect x="224" y="326" width="552" height="11" fill="${trim}"/>`;
  if(af)s+=`<rect x="230" y="186" width="16" height="294" fill="${trim}" opacity=".7"/><rect x="754" y="186" width="16" height="294" fill="${trim}" opacity=".7"/>`;
  const win=(x,y,w,h,i)=>{let o=`<rect x="${x-7}" y="${y-7}" width="${w+14}" height="${h+14}" fill="${trim}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#gl${id})"/>`;
    if(af){o+=`<line x1="${x+w/2}" y1="${y}" x2="${x+w/2}" y2="${y+h}" stroke="${trim}" stroke-width="3"/><line x1="${x}" y1="${y+h*.4}" x2="${x+w}" y2="${y+h*.4}" stroke="${trim}" stroke-width="3"/>`;
      if(i%3===1)o+=`<rect x="${x+3}" y="${y+h*.42}" width="${w-6}" height="${h*.55}" fill="#ffc778" opacity=".55"/>`}
    else if(i%2===0)o+=`<path d="M${x+6} ${y+8}l${w*.5} ${h*.4}l${-w*.2} ${h*.3}M${x+w-10} ${y+12}l${-w*.3} ${h*.5}" stroke="#7a756c" stroke-width="1.4" fill="none"/>`;
    const sl=(sx,rot)=>{let q=`<g transform="rotate(${rot} ${sx} ${y})"><rect x="${sx}" y="${y-4}" width="26" height="${h+8}" fill="${shut}"/>`;for(let k=y+4;k<y+h;k+=9)q+=`<line x1="${sx+3}" y1="${k}" x2="${sx+23}" y2="${k}" stroke="#000" stroke-opacity="${af?.25:.35}"/>`;return q+'</g>'};
    if(af){o+=sl(x-36,0)+sl(x+w+10,0)}else{if(i!==2)o+=sl(x-36,0);if(i%2)o+=sl(x+w+10,i===1?9:0)}
    o+=`<rect x="${x-12}" y="${y+h+7}" width="${w+24}" height="7" fill="${trim}"/>`;
    if(!af)o+=`<rect x="${x}" y="${y+h+14}" width="${w}" height="40" fill="#3a2a1c" opacity=".18"/>`;return o};
  ups.forEach((x,i)=>s+=win(x,214,56,90,i));dns.forEach((x,i)=>s+=win(x,358,56,90,i+4));
  // balcony door
  s+=win(472,208,56,108,9)+`<rect x="440" y="318" width="120" height="9" fill="${trim}"/>`;
  s+=af?`<g stroke="#26282a" stroke-width="2.4">${Array.from({length:12},(_,k)=>`<line x1="${446+k*10}" y1="290" x2="${446+k*10}" y2="318"/>`).join('')}<line x1="442" y1="290" x2="558" y2="290"/></g><circle cx="452" cy="286" r="10" fill="#4f6b3f"/><circle cx="548" cy="286" r="10" fill="#4f6b3f"/><circle cx="455" cy="280" r="4" fill="#c4553b"/>`
    :`<g stroke="#6b3d22" stroke-width="2.4">${Array.from({length:12},(_,k)=>k===4||k===8?'':`<line x1="${446+k*10}" y1="${k===5?298:290}" x2="${446+k*10}" y2="318"/>`).join('')}<path d="M442 290H500L520 297"/></g>`;
  // door
  s+=`<rect x="462" y="370" width="76" height="110" fill="${trim}"/><rect x="470" y="378" width="60" height="102" fill="${af?'#4a2f1e':'#5a4a3b'}"/><rect x="476" y="386" width="20" height="40" fill="none" stroke="#000" stroke-opacity=".3"/><rect x="504" y="386" width="20" height="40" fill="none" stroke="#000" stroke-opacity=".3"/>`;
  if(af)s+=`<circle cx="500" cy="362" r="34" fill="#ffd28a" opacity=".25"/><rect x="495" y="356" width="10" height="12" fill="#ffd28a"/>`;
  // downpipe
  s+=af?`<rect x="238" y="186" width="7" height="294" fill="#7c7f82"/>`:`<path d="M241 186V300l8 14V480" stroke="#6e4128" stroke-width="7" fill="none"/>`;
  if(!af)s+=`<path d="M318 196l10 28-7 20 14 34-5 24M690 360l-12 22 9 18-8 26M600 200l8 16" stroke="#3b3128" stroke-width="1.6" fill="none"/>`;
  // ground
  s+=af?`<rect y="480" width="1000" height="60" fill="#5b7148"/><path d="M430 480H570L600 540H400Z" fill="#d9cfbd"/><path d="M230 480c20-26 60-26 80 0M640 480c20-28 70-28 100 0" fill="#3f5a35"/>`
    :`<rect y="480" width="1000" height="60" fill="#6c624f"/><path d="M240 480l6-16 4 16 6-22 4 22M700 480l5-14 5 14 4-20 4 20M380 480l4-12 3 12" stroke="#5c6644" stroke-width="2" fill="none"/>`;
  s+=`<rect width="1000" height="540" fill="url(#lt${id})"/></svg>`;return s}
$('#baB').innerHTML=html(house(false));$('#baA').innerHTML=html(house(true));
(function(){const ba=$('#ba'),af=$('#baA'),h=$('#bah');let dr=false,auto=true,cur=.5,tgt=.5;
  const set=k=>{af.style.clipPath=`inset(0 0 0 ${k*100}%)`;h.style.left=k*100+'%'};
  const pos=x=>{const r=ba.getBoundingClientRect();return clamp((x-r.left)/r.width,.02,.98)};
  ba.addEventListener('pointerdown',e=>{dr=true;auto=false;ba.setPointerCapture(e.pointerId);tgt=pos(e.clientX)});
  ba.addEventListener('pointermove',e=>{if(dr)tgt=pos(e.clientX)});ba.addEventListener('pointerup',()=>dr=false);ba.addEventListener('pointercancel',()=>dr=false);
  let t0=null;new IntersectionObserver(e=>{if(e[0].isIntersecting&&t0===null)t0=performance.now()},{threshold:.5}).observe(ba);
  (function f(n){requestAnimationFrame(f);if(auto&&t0!==null){const t=(n-t0)/1000;if(t<4.2)tgt=.5+Math.sin(t/4.2*Math.PI*2)*.32*(1-t/4.2)}if(Math.abs(tgt-cur)>.0004){cur+=(tgt-cur)*.14;set(cur)}})(performance.now());
})();

/* ---------- FORM ---------- */
(function(){let s=0,t3=0;const qs=$$('.qs'),nf=$('#qf'),nb=$('#qb'),q={tipo:'',when:'Appena possibile',mq:120};
  const TIPI=['Nuova costruzione','Ristrutturazione completa','Ristrutturazione parziale','Edificio commerciale','Efficientamento energetico','Altro'];
  const QUANDO=['Appena possibile','Entro sei mesi','Sto valutando'];
  const LIM={qn:80,qp:20,qt:500};
  /* Ripulisce il testo inserito: toglie caratteri di controllo e invisibili, i simboli < >,
     normalizza gli spazi e taglia alla lunghezza massima */
  const clean=(v,max,multi)=>{v=String(v||'').normalize('NFC')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028-\u202E\u2060-\u2069\uFEFF]/g,'')
      .replace(/[<>]/g,'');
    v=multi?v.replace(/\r\n?/g,'\n').replace(/[ \t]+/g,' ').replace(/ ?\n ?/g,'\n').replace(/\n{3,}/g,'\n\n'):v.replace(/\s+/g,' ');
    return v.trim().slice(0,max)};
  const okName=v=>v.length>=2&&v.length<=LIM.qn&&/^[\p{L}][\p{L}\p{M}'’ .-]*$/u.test(v);
  const okPhone=v=>{const d=v.replace(/\D/g,'');return /^\+?[0-9 ()./-]+$/.test(v)&&d.length>=6&&d.length<=15};
  const fld=id=>$(id),mark=(el,bad)=>el.setAttribute('aria-invalid',bad?'true':'false');
  /* i campi non accettano piu' caratteri del limite, anche se incollati */
  [['#qn',LIM.qn],['#qp',LIM.qp],['#qt',LIM.qt]].forEach(([id,m])=>{const el=fld(id);
    el.addEventListener('input',()=>{if(el.value.length>m)el.value=el.value.slice(0,m);if(el.getAttribute('aria-invalid')==='true')mark(el,false)});
    el.addEventListener('blur',()=>{el.value=clean(el.value,m,id==='#qt')})});
  const pick=(id,k,list)=>$$(id+' button').forEach(b=>{b.type='button';b.onclick=()=>{const v=b.textContent.trim();if(!list.includes(v))return;
    $$(id+' button').forEach(x=>x.classList.remove('on'));b.classList.add('on');q[k]=v}});
  pick('#c-tipo','tipo',TIPI);pick('#c-when','when',QUANDO);
  $('#mqr').oninput=e=>{q.mq=Math.round(clamp(+e.target.value||120,20,2000)/10)*10;$('#mqv').textContent=q.mq.toLocaleString('it-IT')};
  const shake=el=>el.animate([{transform:'translateX(0)'},{transform:'translateX(-7px)'},{transform:'translateX(7px)'},{transform:'translateX(0)'}],{duration:380,easing:'ease-out'});
  function show(){qs.forEach((x,i)=>x.classList.toggle('on',i===s));$('#pg').style.width=Math.min(100,(s+1)*33.34)+'%';nb.style.visibility=s>0&&s<3?'visible':'hidden';$('#qnav').style.display=s===3?'none':'flex';nf.querySelector('span').textContent=s===2?'Vedi riepilogo':'Continua →';if(s===2&&!t3)t3=performance.now()}
  nf.onclick=()=>{if(s===0&&!TIPI.includes(q.tipo))return shake($('#c-tipo'));
    if(s===2){
      /* anti-spam: campo nascosto compilato o compilazione troppo veloce = bot, la richiesta non viene preparata */
      if(fld('#qw').value!==''||performance.now()-t3<2500)return;
      const ni=fld('#qn'),pi=fld('#qp'),ti=fld('#qt');
      const n=clean(ni.value,LIM.qn),p=clean(pi.value,LIM.qp),nt=clean(ti.value,LIM.qt,true);
      ni.value=n;pi.value=p;ti.value=nt;
      if(!okName(n)){mark(ni,true);ni.focus();return shake(ni.parentNode)}mark(ni,false);
      if(!okPhone(p)){mark(pi,true);pi.focus();return shake(pi.parentNode)}mark(pi,false);
      const tipo=TIPI.includes(q.tipo)?q.tipo:'Altro',when=QUANDO.includes(q.when)?q.when:QUANDO[0],mq=Math.round(clamp(q.mq,20,2000));
      /* il riepilogo e' inserito come testo semplice, mai come HTML */
      $('#sum').textContent=`Intervento: ${tipo}\nSuperficie: ${mq.toLocaleString('it-IT')} m²\nTempistica: ${when}\nNome: ${n}\nTelefono: ${p}${nt?'\nNote: '+nt:''}`;
      const tx='Richiesta preventivo dal sito\n\n'+$('#sum').textContent;
      $('#qwa').href='https://wa.me/393661557209?text='+encodeURIComponent(tx);
      $('#qmail').href='mailto:felicianigrp@gmail.com?subject='+encodeURIComponent('Richiesta preventivo - '+n)+'&body='+encodeURIComponent(tx)}
    s++;show()};
  nb.onclick=()=>{s=Math.max(0,s-1);show()};
  })();

hsize();onScroll();addEventListener('load',()=>{hsize();onScroll()});
})();
