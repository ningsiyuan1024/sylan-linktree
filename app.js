import * as THREE from './assets/three.module.js';

const container=document.querySelector('#scene'), garden=document.querySelector('.garden');
const nodes=[...document.querySelectorAll('.branch')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let paused=reduced, targetRotation=0, renderer, scene, camera, tree, flowers, petals;
const dialog=document.querySelector('dialog');
document.querySelector('[data-action=wechat]').addEventListener('click',()=>{document.querySelector('#copy-status').textContent='';dialog.showModal();});
document.querySelector('.close').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()});
document.querySelector('#copy-contact').onclick=async()=>{const value=document.querySelector('#contact-id').textContent;try{await navigator.clipboard.writeText(value);document.querySelector('#copy-status').textContent='已复制';}catch{document.querySelector('#copy-status').textContent='请长按或选中上方文字复制';}};
document.querySelector('#motion').setAttribute('aria-pressed',String(paused));
document.querySelector('#motion-label').textContent=paused?'开启动效':'暂停动效';
document.querySelector('#motion').onclick=()=>{paused=!paused;document.querySelector('#motion').setAttribute('aria-pressed',String(paused));document.querySelector('#motion-label').textContent=paused?'开启动效':'暂停动效';};
document.querySelector('#reset').onclick=()=>{targetRotation=0;};
let seed=1368;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}function range(a,b){return a+(b-a)*rnd();}
const V=(x,y,z=0)=>new THREE.Vector3(x,y,z);
const endpoints=[V(.85,4.58),V(-1.23,3.78),V(1.3,2.98),V(-1.35,2.18),V(1.26,1.38)];
const clusterData=[], flowerGroups=[];
function branch(points,r0,r1){
 const curve=new THREE.CatmullRomCurve3(points), N=96,R=18,frames=curve.computeFrenetFrames(N,false),positions=[],indices=[],colors=[];
 for(let i=0;i<=N;i++){let t=i/N,c=curve.getPointAt(t),radius=THREE.MathUtils.lerp(r0,r1,t);for(let j=0;j<=R;j++){
  let angle=j/R*Math.PI*2,rough=1+.025*Math.sin(i*.24+j*2)+.012*Math.sin(j*5+i*.13),p=c.clone().addScaledVector(frames.normals[i],Math.cos(angle)*radius*rough).addScaledVector(frames.binormals[i],Math.sin(angle)*radius*rough);positions.push(p.x,p.y,p.z);let shade=.65+.13*Math.sin(j*2.1+i*.12);colors.push(shade,shade*.87,shade*.7);
  if(i<N&&j<R){let k=i*(R+1)+j;indices.push(k,k+R+1,k+1,k+1,k+R+1,k+R+2);}
 }}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();let m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x63513c,roughness:1,vertexColors:true}));m.castShadow=true;tree.add(m);return curve;
}
function init(){
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setClearColor(0x000000,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;container.appendChild(renderer.domElement);
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(31,1,.1,100);camera.position.set(0,3.15,11.9);camera.lookAt(0,2.55,0);
 scene.add(new THREE.HemisphereLight(0xfff7eb,0x6d7455,3.2));let sun=new THREE.DirectionalLight(0xffeed6,4.5);sun.position.set(-3,7,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-4;sun.shadow.camera.right=4;sun.shadow.camera.top=6;sun.shadow.camera.bottom=-2;sun.shadow.bias=-.001;scene.add(sun);let rim=new THREE.DirectionalLight(0xffcfdb,1.5);rim.position.set(4,4,-2);scene.add(rim);
 tree=new THREE.Group();scene.add(tree);
 const trunk=branch([V(0,.4),V(-.21,.88,.03),V(.18,1.6,-.03),V(-.27,2.35,.03),V(.2,3.07),V(-.12,3.8,.04),V(.1,4.52)],.23,.026);
 for(let i=0;i<endpoints.length;i++){
  const end=endpoints[i],start=trunk.getPointAt(.91-i*.19),side=i%2===0?1:-1;
  const c=branch([start,start.clone().add(V(side*.23,.05,.03)),end.clone().add(V(-side*.48,-.1,.03)),end],.072-i*.001,.009);
  for(let j=0;j<7;j++){
   const t=.28+j*.1,base=c.getPointAt(t),tip=base.clone().add(V(range(-.28,.28),range(.08,.32),range(-.35,.3)));
   branch([base,base.clone().lerp(tip,.5).add(V(0,.09,0)),tip],.018,.003);
   clusterData.push({p:tip,group:i,r:range(.16,.28)});
  }
  clusterData.push({p:end,group:i,r:.28});
 }
 for(let j=0;j<4;j++){let angle=j*Math.PI/2;branch([V(0,.55),V(Math.cos(angle)*.3,.48,Math.sin(angle)*.22),V(Math.cos(angle)*.56,.38,Math.sin(angle)*.4)],.12,.016);}
 // A shallow, hand-thrown ceramic pot, soil, moss and fine surface stones.
 const potShape=[[0,0],[.55,0],[.69,.07],[.82,.29],[.86,.36],[.84,.42],[.75,.42],[.72,.35],[.1,.35]].map(p=>new THREE.Vector2(...p));
 const pot=new THREE.Mesh(new THREE.LatheGeometry(potShape,72),new THREE.MeshStandardMaterial({color:0x737c67,roughness:.85,metalness:.06,side:THREE.DoubleSide}));pot.scale.z=.72;pot.castShadow=true;pot.receiveShadow=true;tree.add(pot);
 const soil=new THREE.Mesh(new THREE.CylinderGeometry(.75,.74,.035,64),new THREE.MeshStandardMaterial({color:0x55523b,roughness:1}));soil.position.y=.365;soil.scale.z=.72;soil.receiveShadow=true;tree.add(soil);
 const stoneGeo=new THREE.IcosahedronGeometry(1,0),mossMat=new THREE.MeshStandardMaterial({color:0x697c3f,roughness:1});const moss=new THREE.InstancedMesh(stoneGeo,mossMat,220),dummy=new THREE.Object3D();
 for(let i=0;i<220;i++){let a=range(0,Math.PI*2),r=Math.sqrt(rnd())*.68;dummy.position.set(Math.cos(a)*r,.39+range(-.01,.035),Math.sin(a)*r*.68);dummy.scale.set(range(.015,.07),range(.012,.04),range(.02,.055));dummy.rotation.set(rnd()*3,rnd()*3,rnd()*3);dummy.updateMatrix();moss.setMatrixAt(i,dummy.matrix);moss.setColorAt(i,new THREE.Color().setHSL(range(.19,.26),range(.2,.45),range(.21,.36)));}tree.add(moss);
 const petalGeo=new THREE.SphereGeometry(1,6,4),petalMat=new THREE.MeshStandardMaterial({color:0xffd9df,roughness:.8,side:THREE.DoubleSide});
 const blossomCount=clusterData.length*17,petalCount=blossomCount*5;
 flowers=new THREE.InstancedMesh(petalGeo,petalMat,petalCount);let fi=0;
 for(const c of clusterData){for(let b=0;b<17;b++){
  const angle=range(0,Math.PI*2),r=Math.cbrt(rnd())*c.r,p=c.p.clone().add(V(Math.cos(angle)*r,range(-.09,.13),Math.sin(angle)*r*.85));const blossomRotation=new THREE.Euler(range(-.7,.7),range(0,6.28),range(-.5,.5)),q=new THREE.Quaternion().setFromEuler(blossomRotation),size=range(.028,.049);
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2,offset=V(Math.cos(a)*size*.75,Math.sin(a)*size*.75,0).applyQuaternion(q);dummy.position.copy(p).add(offset);dummy.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(V(0,0,1),a));dummy.scale.set(size*.83,size*1.23,size*.22);dummy.updateMatrix();flowers.setMatrixAt(fi,dummy.matrix);flowers.setColorAt(fi,new THREE.Color().setHSL(range(.94,.98),range(.27,.49),range(.74,.91)));fi++;}
  flowerGroups.push({p:p.clone(),group:c.group});
 }}flowers.instanceMatrix.needsUpdate=true;tree.add(flowers);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.12}));ground.rotation.x=-Math.PI/2;ground.position.y=-.016;ground.receiveShadow=true;scene.add(ground);
 const fallingGeo=new THREE.BufferGeometry(),arr=new Float32Array(72*3);petals=[];
 for(let i=0;i<72;i++){const p={x:range(-2,2),y:range(.3,5),z:range(-.6,1.1),speed:range(.08,.25),phase:rnd()*6.28};petals.push(p);arr.set([p.x,p.y,p.z],i*3);}fallingGeo.setAttribute('position',new THREE.BufferAttribute(arr,3));
 const petalCanvas=document.createElement('canvas');petalCanvas.width=32;petalCanvas.height=32;const ctx=petalCanvas.getContext('2d');ctx.fillStyle='#efb2bd';ctx.beginPath();ctx.ellipse(16,16,7,13,.6,0,Math.PI*2);ctx.fill();const texture=new THREE.CanvasTexture(petalCanvas);const falling=new THREE.Points(fallingGeo,new THREE.PointsMaterial({map:texture,size:.065,transparent:true,opacity:.7,depthWrite:false,color:0xffc5d0}));scene.add(falling);
 let dragging=false,lastX=0;container.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;dragging=true;lastX=e.clientX;container.setPointerCapture(e.pointerId)});container.addEventListener('pointermove',e=>{if(dragging){targetRotation=THREE.MathUtils.clamp(targetRotation+(e.clientX-lastX)*.004,-.45,.45);lastX=e.clientX;}});container.addEventListener('pointerup',()=>dragging=false);container.addEventListener('pointercancel',()=>dragging=false);
 let last=performance.now(),t=0;
 function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=11.9;camera.fov=w<650?32:31;tree.scale.set(w<650?.56:1,1,w<650?.8:1);camera.updateProjectionMatrix();positionLabels();}window.addEventListener('resize',resize);resize();
 function positionLabels(){const w=container.clientWidth,h=container.clientHeight,mobile=w<650;tree.updateMatrixWorld();endpoints.forEach((p,i)=>{let point=tree.localToWorld(p.clone()).project(camera),x=(point.x*.5+.5)*w,y=(-point.y*.5+.5)*h,side=i%2===0?'right':'left',gap=mobile?34:44;nodes[i].dataset.side=side;const labelWidth=mobile?105:177;x+=side==='right'?gap:-gap;if(side==='right')x=Math.min(x,w-labelWidth-12);else x=Math.max(x,labelWidth+12);if(mobile)x=side==='right'?w-112:112;nodes[i].style.setProperty('--x',`${x}px`);nodes[i].style.setProperty('--y',`${y}px`);});}
 function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.04);last=now;if(!paused&&document.visibilityState==='visible'){t+=dt;const pos=fallingGeo.attributes.position;petals.forEach((p,i)=>{p.y-=p.speed*dt;p.x+=Math.sin(t*.65+p.phase)*dt*.06;if(p.y<.1){p.y=4.9;p.x=range(-1.7,1.7);}pos.setXYZ(i,p.x+Math.sin(t+p.phase)*.06,p.y,p.z);});pos.needsUpdate=true;}const idle=paused?0:Math.sin(t*.25)*.035;tree.rotation.y+=((targetRotation+idle)-tree.rotation.y)*.065;positionLabels();renderer.render(scene,camera);}
 document.body.classList.add('ready');requestAnimationFrame(frame);
}
try{init();}catch(error){console.error('Tree rendering unavailable',error);document.body.classList.add('ready','no-webgl');document.querySelector('#loading').textContent='';}
