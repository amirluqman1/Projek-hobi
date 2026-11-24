// =====================================================================
//  KENDERAAN: material (hero vs PS2), bina kereta & kapcai, ubah suai
//  Model ni dibina guna bentuk asas dalam kod. Nanti boleh diganti dengan
//  model Blender (.glb) tanpa ubah fizik.
// =====================================================================
import { glowMat, glowTex, texPlate } from './dunia.js';
import { hot, scene, state, target, world } from './teras.js';

// ---------------- materials (hero vs PS2) ----------------

const PAINTS=[['Merah Cili','#c41e29'],['Biru Selat','#1e5ea8'],['Hijau Pandan','#3e9a49'],['Kuning Kunyit','#e8b01a'],['Putih Mutiara','#ece8df'],['Hitam Malam','#141519'],['Ungu Terung','#5a2a6d'],['Oren Senja','#e6672a']];
const HERO={
  paint:new THREE.MeshPhysicalMaterial({color:PAINTS[0][1],metalness:0.25,roughness:0.2,clearcoat:1,clearcoatRoughness:0.05}),
  rim:new THREE.MeshStandardMaterial({color:0xe2e6ea,metalness:1,roughness:0.14}),
  chrome:new THREE.MeshStandardMaterial({color:0xeef1f4,metalness:1,roughness:0.1}),
  tire:new THREE.MeshStandardMaterial({color:0x151515,roughness:0.92}),
  glass:new THREE.MeshPhysicalMaterial({color:0x0c1219,metalness:0.1,roughness:0.04,clearcoat:1}),
  dark:new THREE.MeshStandardMaterial({color:0x1b1c20,roughness:0.65,metalness:0.2}),
  seat:new THREE.MeshStandardMaterial({color:0x101012,roughness:0.55}),
  metal:new THREE.MeshStandardMaterial({color:0x6f727a,metalness:0.8,roughness:0.4}),
  head:new THREE.MeshStandardMaterial({color:0xfffbe8,emissive:0xfff0c8,emissiveIntensity:0.5,roughness:0.2}),
  tail:new THREE.MeshStandardMaterial({color:0x4a0707,emissive:0xff2414,emissiveIntensity:0.35,roughness:0.3}),
  plate:new THREE.MeshStandardMaterial({map:texPlate,roughness:0.5})
};
const PS2={
  paint:new THREE.MeshLambertMaterial({color:PAINTS[0][1]}),
  rim:new THREE.MeshLambertMaterial({color:0xb8bcc2}),
  chrome:new THREE.MeshLambertMaterial({color:0xc4c8cc}),
  tire:new THREE.MeshLambertMaterial({color:0x1a1a1a}),
  glass:new THREE.MeshLambertMaterial({color:0x1e2a36}),
  dark:new THREE.MeshLambertMaterial({color:0x222327}),
  seat:new THREE.MeshLambertMaterial({color:0x151517}),
  metal:new THREE.MeshLambertMaterial({color:0x6f727a}),
  head:new THREE.MeshLambertMaterial({color:0xfffbe8,emissive:0xfff0c8,emissiveIntensity:0.5}),
  tail:new THREE.MeshLambertMaterial({color:0x4a0707,emissive:0xff2414,emissiveIntensity:0.35}),
  plate:new THREE.MeshLambertMaterial({map:texPlate})
};
const HERO_ENV=['paint','rim','chrome','glass','metal','dark','head'];

// ---------------- vehicle building helpers ----------------
function part(parent,geo,role,x,y,z,rx,ry,rz){const m=new THREE.Mesh(geo,HERO[role]); m.userData.role=role; m.position.set(x||0,y||0,z||0); m.rotation.set(rx||0,ry||0,rz||0); parent.add(m); return m;}
const UP=new THREE.Vector3(0,1,0);
function rod(parent,a,b,r,role){const d=new THREE.Vector3().subVectors(b,a); const m=part(parent,new THREE.CylinderGeometry(r,r,d.length(),8),role); m.position.copy(a).addScaledVector(d,0.5); m.quaternion.setFromUnitVectors(UP,d.clone().normalize()); return m;}
const V=(x,y,z)=>new THREE.Vector3(x,y,z);

// ---- KERETA (hatchback kecil) ----
function buildCar(){
  const g=new THREE.Group();
  const wr=0.33, wx=1.28, ar=0.43;
  // profil sisi badan dengan lengkung roda
  const s=new THREE.Shape(); s.moveTo(-2.0,0.32); s.lineTo(-wx-ar,0.32);
  for(let i=0;i<=8;i++){const a=Math.PI-i/8*Math.PI; s.lineTo(-wx+Math.cos(a)*ar,wr+Math.sin(a)*ar);}
  s.lineTo(wx-ar,0.32);
  for(let i=0;i<=8;i++){const a=Math.PI-i/8*Math.PI; s.lineTo(wx+Math.cos(a)*ar,wr+Math.sin(a)*ar);}
  s.lineTo(2.0,0.32); s.lineTo(2.08,0.5); s.lineTo(2.03,0.74); s.lineTo(1.88,0.82); s.lineTo(0.72,0.92); s.lineTo(-1.72,0.97); s.lineTo(-2.02,0.92); s.lineTo(-2.08,0.6); s.lineTo(-2.0,0.32);
  const body=new THREE.ExtrudeGeometry(s,{depth:1.6,bevelEnabled:true,bevelThickness:0.06,bevelSize:0.05,bevelSegments:2,curveSegments:4});
  body.translate(0,0,-0.8); part(g,body,'paint');
  // kabin kaca
  const c=new THREE.Shape(); c.moveTo(0.78,0.9); c.lineTo(-0.02,1.4); c.lineTo(-1.42,1.42); c.lineTo(-1.98,0.95); c.lineTo(0.78,0.9);
  const cab=new THREE.ExtrudeGeometry(c,{depth:1.34,bevelEnabled:true,bevelThickness:0.03,bevelSize:0.03,bevelSegments:1}); cab.translate(0,0,-0.67); part(g,cab,'glass');
  part(g,new THREE.BoxGeometry(1.44,0.06,1.38),'paint',-0.72,1.44,0);          // bumbung
  for(const z of [-0.69,0.69]){ part(g,new THREE.BoxGeometry(0.12,0.5,0.04),'paint',-0.55,1.17,z); } // tiang B
  // bampar, gril, lampu
  part(g,new THREE.BoxGeometry(0.16,0.22,1.62),'dark',2.06,0.4,0);
  part(g,new THREE.BoxGeometry(0.16,0.22,1.62),'dark',-2.06,0.42,0);
  part(g,new THREE.BoxGeometry(0.05,0.12,0.7),'dark',2.1,0.64,0);
  for(const z of [-0.56,0.56]){ part(g,new THREE.BoxGeometry(0.06,0.13,0.34),'head',2.08,0.69,z); part(g,new THREE.BoxGeometry(0.06,0.16,0.3),'tail',-2.1,0.76,z); }
  part(g,new THREE.BoxGeometry(0.02,0.11,0.44),'plate',2.15,0.42,0,0,Math.PI/2*0,0).rotation.y=-Math.PI/2;
  part(g,new THREE.BoxGeometry(0.02,0.11,0.44),'plate',-2.15,0.5,0).rotation.y=Math.PI/2;
  for(const z of [-0.88,0.88]){ part(g,new THREE.BoxGeometry(0.16,0.1,0.12),'paint',0.62,1.02,z); } // cermin sisi
  part(g,new THREE.BoxGeometry(3.0,0.1,1.5),'dark',0,0.3,0); // skirt bawah
  // roda (simpan dalam senarai supaya boleh dipusing masa bergerak)
  const wheels=[];
  for(const x of [-wx,wx]) for(const z of [-0.79,0.79]){
    const w=new THREE.Group(); w.position.set(x,wr,z); g.add(w); wheels.push(w);
    part(w,new THREE.CylinderGeometry(wr,wr,0.24,16).rotateX(Math.PI/2),'tire');
    const sgn=Math.sign(z);
    part(w,new THREE.CylinderGeometry(0.21,0.21,0.02,14).rotateX(Math.PI/2),'dark',0,0,sgn*0.115);
    part(w,new THREE.TorusGeometry(0.205,0.022,6,16),'rim',0,0,sgn*0.125);
    part(w,new THREE.CylinderGeometry(0.05,0.05,0.04,8).rotateX(Math.PI/2),'rim',0,0,sgn*0.13);
    for(let k=0;k<5;k++){const a=k/5*Math.PI*2; part(w,new THREE.BoxGeometry(0.17,0.04,0.025),'rim',Math.cos(a)*0.11,Math.sin(a)*0.11,sgn*0.128,0,0,a);}
  }
  g.userData={target:0.75,shadow:[5.2,2.6],headPos:V(2.1,0.69,0),dist:5.8,wheels,wr,
    hit:{r:0.8, offs:[1.25,0,-1.25]}}; // 3 bulatan sepanjang badan kereta
  return g;
}

// ---- KAPCAI (underbone 110cc rekaan) ----
function buildKapcai(){
  const g=new THREE.Group();
  const wr=0.3, fx=0.63, rx=-0.62;
  function wheel(x,front){
    const w=new THREE.Group(); w.position.set(x,wr,0); g.add(w);
    part(w,new THREE.TorusGeometry(0.255,0.05,8,22),'tire');
    part(w,new THREE.TorusGeometry(0.205,0.014,6,22),'rim');
    part(w,new THREE.CylinderGeometry(0.045,0.045,0.13,10).rotateX(Math.PI/2),'metal');
    for(let k=0;k<5;k++){const a=k/5*Math.PI*2+0.3; part(w,new THREE.BoxGeometry(0.16,0.028,0.03),'rim',Math.cos(a)*0.12,Math.sin(a)*0.12,0,0,0,a);}
    if(front) part(w,new THREE.CylinderGeometry(0.11,0.11,0.01,16).rotateX(Math.PI/2),'chrome',0,0,0.05);
    return w;
  }
  const wheels=[wheel(fx,true), wheel(rx,false)];
  // badan underbone (profil sisi, diekstrud nipis)
  const s=new THREE.Shape();
  [[0.40,1.0],[0.5,0.86],[0.36,0.46],[0.15,0.34],[-0.36,0.34],[-0.72,0.5],[-1.0,0.68],[-1.03,0.8],[-0.22,0.8],[-0.06,0.56],[0.12,0.56],[0.3,0.92]].forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));
  const bg=new THREE.ExtrudeGeometry(s,{depth:0.24,bevelEnabled:true,bevelThickness:0.03,bevelSize:0.025,bevelSegments:2}); bg.translate(0,0,-0.12); part(g,bg,'paint');
  // perisai kaki (legshield)
  part(g,new THREE.BoxGeometry(0.05,0.52,0.44),'paint',0.42,0.68,0,0,0,-0.38);
  // fender depan
  part(g,new THREE.TorusGeometry(0.32,0.045,4,12,Math.PI*0.62),'paint',fx,wr,0,0,0,Math.PI*0.2);
  // fork depan & bar hendal
  for(const z of [-0.075,0.075]) rod(g,V(fx,wr,z),V(0.46,0.96,z),0.022,'chrome');
  rod(g,V(0.42,1.04,-0.33),V(0.42,1.04,0.33),0.016,'chrome');
  for(const z of [-0.3,0.3]) part(g,new THREE.CylinderGeometry(0.024,0.024,0.12,8).rotateX(Math.PI/2),'seat',0.42,1.04,z);
  // cermin
  for(const z of [-0.22,0.22]){ rod(g,V(0.42,1.05,z),V(0.38,1.3,z*1.25),0.008,'chrome'); part(g,new THREE.CylinderGeometry(0.06,0.06,0.015,10).rotateZ(Math.PI/2),'chrome',0.38,1.32,z*1.25); }
  // kepala lampu (cowl) + lampu
  part(g,new THREE.BoxGeometry(0.2,0.14,0.26),'paint',0.5,0.98,0,0,0,-0.2);
  part(g,new THREE.BoxGeometry(0.03,0.08,0.18),'head',0.61,0.96,0,0,0,-0.2);
  // bakul depan (ikon kapcai!)
  const basket=new THREE.Group(); basket.position.set(0.7,0.84,0); g.add(basket);
  const bb=new THREE.BoxGeometry(0.26,0.18,0.32);
  basket.add(new THREE.LineSegments(new THREE.EdgesGeometry(bb),new THREE.LineBasicMaterial({color:0x111111})));
  const bl=[]; for(let i=-0.12;i<=0.121;i+=0.06){bl.push(new THREE.Vector3(0.13,-0.09,i),new THREE.Vector3(0.13,0.09,i),new THREE.Vector3(-0.13,-0.09,i),new THREE.Vector3(-0.13,0.09,i));}
  for(let i=-0.1;i<=0.101;i+=0.05){bl.push(new THREE.Vector3(i,-0.09,-0.16),new THREE.Vector3(i,0.09,-0.16),new THREE.Vector3(i,-0.09,0.16),new THREE.Vector3(i,0.09,0.16));}
  basket.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(bl),new THREE.LineBasicMaterial({color:0x111111})));
  rod(g,V(0.58,0.78,0),V(0.48,0.92,0),0.012,'dark');
  // enjin, tempat kaki, swingarm, absorber
  part(g,new THREE.BoxGeometry(0.34,0.24,0.2),'metal',-0.14,0.3,0);
  part(g,new THREE.CylinderGeometry(0.07,0.08,0.18,8),'metal',0.06,0.36,0,0,0,-1.1);
  part(g,new THREE.BoxGeometry(0.34,0.035,0.34),'dark',0.04,0.36,0);
  for(const z of [-0.1,0.1]){ rod(g,V(-0.12,0.3,z),V(rx,wr,z),0.025,'dark'); rod(g,V(rx+0.06,wr+0.02,z*1.15),V(-0.78,0.78,z*1.15),0.022,'chrome'); }
  // tempat duduk panjang
  part(g,new THREE.BoxGeometry(0.74,0.1,0.27),'seat',-0.62,0.86,0);
  part(g,new THREE.BoxGeometry(0.6,0.05,0.25),'seat',-0.6,0.92,0);
  // rak belakang + lampu belakang + plat
  part(g,new THREE.BoxGeometry(0.22,0.02,0.24),'chrome',-1.06,0.9,0);
  part(g,new THREE.BoxGeometry(0.05,0.07,0.16),'tail',-1.06,0.78,0);
  part(g,new THREE.BoxGeometry(0.02,0.09,0.18),'plate',-1.08,0.66,0).rotation.y=Math.PI/2;
  // fender belakang
  part(g,new THREE.TorusGeometry(0.31,0.04,4,10,Math.PI*0.45),'dark',rx,wr,0,0,0,Math.PI*0.32);
  // ekzos chrome (sebelah kanan, +z)
  rod(g,V(0.0,0.24,0.12),V(-0.45,0.26,0.17),0.03,'chrome');
  part(g,new THREE.CylinderGeometry(0.058,0.05,0.42,12),'chrome',-0.68,0.32,0.18,0,0,Math.PI/2+0.12);
  part(g,new THREE.CylinderGeometry(0.04,0.04,0.05,10),'dark',-0.9,0.35,0.18,0,0,Math.PI/2+0.12);
  // tongkat sisi (sebelah kiri, -z)
  const stand=rod(g,V(-0.1,0.3,-0.12),V(-0.05,0.02,-0.34),0.014,'dark');
  g.rotation.x=-0.13; // senget ke kiri, atas tongkat sisi (tongkat di sebelah -z)
  g.position.y=0.02;
  g.userData={target:0.72,shadow:[2.4,1.0],headPos:V(0.62,0.96,0),dist:3.6,wheels,wr,stand,
    hit:{r:0.3, offs:[0.55,0,-0.55]}}; // 3 bulatan kecil: depan, tengah, belakang
  return g;
}

// ---------------- vehicle management ----------------
const vehicleRoot=new THREE.Group(); scene.add(vehicleRoot);
const shadowTex=glowTex('rgba(0,0,0,.75)','rgba(0,0,0,.45)');
const blob=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));
blob.position.y=0.015; vehicleRoot.add(blob);
const vehicles={car:buildCar(),kapcai:buildKapcai()};
// Kedudukan & arah disimpan pada vehicleRoot (induk), jadi kenderaan sendiri duduk di 0,0,0.
Object.values(vehicles).forEach(v=>vehicleRoot.add(v));
const headSpot=new THREE.SpotLight(0xfff0d0,0,26,0.42,0.55,1.4); scene.add(headSpot); scene.add(headSpot.target);
const headGlows=[new THREE.Sprite(glowMat),new THREE.Sprite(glowMat)]; headGlows.forEach(s=>{s.visible=false;scene.add(s);});

function applyStyle(){
  const set=state.style==='hero'?HERO:PS2;
  vehicleRoot.traverse(o=>{ if(o.isMesh && o.userData.role) o.material=set[o.userData.role]; });
}
function applyPaint(){
  const c=PAINTS[state.paint][1]; HERO.paint.color.set(c); PS2.paint.color.set(c);
  document.getElementById('paintName').textContent=PAINTS[state.paint][0];
}
function applyFinish(){
  const p=HERO.paint;
  if(state.finish==='gloss'){p.metalness=0.25;p.roughness=0.2;p.clearcoat=1;p.clearcoatRoughness=0.05;}
  if(state.finish==='metal'){p.metalness=0.85;p.roughness=0.32;p.clearcoat=0.7;p.clearcoatRoughness=0.15;}
  if(state.finish==='matte'){p.metalness=0.0;p.roughness=0.85;p.clearcoat=0;p.clearcoatRoughness=0.5;}
  p.needsUpdate=true;
}
function applyRim(){
  const r=HERO.rim, q=PS2.rim;
  if(state.rim==='chrome'){r.color.set(0xe2e6ea);r.metalness=1;r.roughness=0.14;q.color.set(0xb8bcc2);}
  if(state.rim==='black'){r.color.set(0x1c1c1f);r.metalness=0.6;r.roughness=0.35;q.color.set(0x232326);}
  if(state.rim==='gold'){r.color.set(0xd6a640);r.metalness=1;r.roughness=0.22;q.color.set(0xc39a3c);}
}
function applyVehicle(){
  for(const k in vehicles) vehicles[k].visible=(k===state.vehicle);
  const v=vehicles[state.vehicle], u=v.userData;
  blob.scale.set(u.shadow[0],1,u.shadow[1]); blob.position.set(0,0.015,0);
  target.set(vehicleRoot.position.x,u.target,vehicleRoot.position.z);
  if(!hot.dist) state.dist=u.dist;
  hot.dist=null;
  countTris();
}
function countTris(){
  const n=o=>{let t=0;o.traverse(m=>{if(m.isMesh&&m.visible!==false){const g=m.geometry;t+=(g.index?g.index.count:g.attributes.position.count)/3;}});return Math.round(t);};
  document.getElementById('triVehicle').textContent=n(vehicles[state.vehicle]).toLocaleString('ms-MY');
  document.getElementById('triWorld').textContent=n(world).toLocaleString('ms-MY');
}

// Lampu depan ikut kenderaan (dipanggil setiap frame)
const tmpH=new THREE.Vector3();
function updateHeadlights(){
  // lampu depan kenderaan aktif
  const v=vehicles[state.vehicle]; tmpH.copy(v.userData.headPos); v.localToWorld(tmpH);
  headSpot.position.copy(tmpH); headSpot.target.position.set(tmpH.x+Math.cos(state.heading)*12,0,tmpH.z-Math.sin(state.heading)*12); // 12 m ke depan
  headGlows[0].position.copy(tmpH); headGlows[0].scale.setScalar(state.vehicle==='car'?0.8:0.6);
  if(state.vehicle==='car'){ const a=V(2.1,0.69,0.56), b=V(2.1,0.69,-0.56); v.localToWorld(a); v.localToWorld(b); headGlows[0].position.copy(a); headGlows[1].position.copy(b); headGlows[1].scale.setScalar(0.8); headGlows[1].visible=headGlows[0].visible; }
  else headGlows[1].visible=false;
}

// Dikongsi dengan fail lain:
export { HERO, HERO_ENV, PAINTS, PS2, applyFinish, applyPaint, applyRim, applyStyle, applyVehicle, blob, buildCar, buildKapcai, headGlows, headSpot, updateHeadlights, vehicleRoot, vehicles };
