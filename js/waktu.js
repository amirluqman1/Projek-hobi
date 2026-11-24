// =====================================================================
//  WAKTU & CAHAYA: tengah hari / senja / malam, peta pantulan, lampu jalan
// =====================================================================
import { lampGlows, lampHeadMat, paintSky, poolMat, seaMat, signMats, skyGeo, sunSprite } from './dunia.js';
import { HERO, HERO_ENV, PS2, headGlows, headSpot, vehicleRoot } from './kenderaan.js';
import { hemi, renderer, scene, state, sun } from './teras.js';

// ---------------- environment map (pantulan untuk material hero) ----------------

const pmrem=new THREE.PMREMGenerator(renderer);
const envScene=new THREE.Scene();
const envSkyGeo=skyGeo.clone(); const envSky=new THREE.Mesh(envSkyGeo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide}));
envScene.add(envSky);
const softMat=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide});
const soft1=new THREE.Mesh(new THREE.PlaneGeometry(260,60),softMat); soft1.position.set(0,320,-120); soft1.lookAt(0,0,0); envScene.add(soft1);
const soft2=new THREE.Mesh(new THREE.PlaneGeometry(120,40),softMat); soft2.position.set(-300,160,200); soft2.lookAt(0,0,0); envScene.add(soft2);
let envRT=null, envMap=null;

// ---------------- time of day (macam jadual "timecycle") ----------------
const TIMES={
  noon:{top:'#3d86d6',hor:'#cfe5f3',gnd:'#8a8a7a',fog:'#d6e6ee',near:45,far:220,sun:'#fff6e8',si:1.25,hs:'#dff0ff',hg:'#6b6a55',hi:0.75,sunDir:[0.3,0.9,0.4],sea:'#3b88a8',lamps:0,soft:'#ffffff',softI:1,sign:0.08},
  dusk:{top:'#4a5f9e',hor:'#f2a06a',gnd:'#5e4436',fog:'#e49a62',near:28,far:150,sun:'#ffad72',si:1.05,hs:'#ffd2a8',hg:'#5a4636',hi:0.62,sunDir:[-0.85,0.12,0.5],sea:'#6a6f8a',lamps:0.35,soft:'#ffd9b0',softI:1,sign:0.35},
  night:{top:'#050916',hor:'#1a2446',gnd:'#07080d',fog:'#141c33',near:14,far:95,sun:'#8ea6ff',si:0.22,hs:'#3a4a7a',hg:'#0c0c12',hi:0.28,sunDir:[0.4,0.7,-0.3],sea:'#0f1d2e',lamps:1,soft:'#ffb35c',softI:1,sign:1}
};
const lampLights=[];
for(const x of [-9,9]){const pl=new THREE.PointLight(0xffb866,0,18,1.8); pl.position.set(x,6.0,2.7); scene.add(pl); lampLights.push(pl);}
function applyTime(){
  const t=TIMES[state.time];
  paintSky(skyGeo,t.top,t.hor,t.gnd); paintSky(envSkyGeo,t.top,t.hor,t.gnd);
  scene.fog.color.set(t.fog); scene.fog.near=t.near; scene.fog.far=t.far; scene.background=new THREE.Color(t.fog);
  sun.color.set(t.sun); sun.intensity=t.si; sun.position.set(t.sunDir[0]*100,t.sunDir[1]*100,t.sunDir[2]*100);
  hemi.color.set(t.hs); hemi.groundColor.set(t.hg); hemi.intensity=t.hi;
  sunSprite.position.set(t.sunDir[0],t.sunDir[1],t.sunDir[2]).normalize().multiplyScalar(560);
  sunSprite.material.color.set(state.time==='night'?'#9fb2ff':'#ffffff'); sunSprite.scale.setScalar(state.time==='night'?60:120);
  seaMat.color.set(t.sea);
  const on=t.lamps;
  lampHeadMat.emissiveIntensity=on*1.2; lampGlows.forEach(g=>g.visible=on>0.3); poolMat.opacity=on*0.9;
  lampLights.forEach(l=>l.intensity=on*1.6);
  signMats.forEach(m=>m.emissiveIntensity=t.sign);
  const night=state.time==='night';
  HERO.head.emissiveIntensity=PS2.head.emissiveIntensity=night?1.6:0.5;
  HERO.tail.emissiveIntensity=PS2.tail.emissiveIntensity=night?1.4:0.35;
  headSpot.intensity=night?2.2:(state.time==='dusk'?0.6:0);
  headGlows.forEach(s=>s.visible=night);
  softMat.color.set(t.soft);
  // jana semula peta pantulan
  if(envRT) envRT.dispose();
  envRT=pmrem.fromScene(envScene,0.03); envMap=envRT.texture;
  HERO_ENV.forEach(k=>{HERO[k].envMap=envMap; HERO[k].envMapIntensity=night?0.7:1; HERO[k].needsUpdate=true;});
}

function updateLamps(){
  // Lampu jalan sebenar (PointLight) mahal, jadi cuma 2. Kita pindahkan
  // dua lampu tu ke tiang yang paling dekat dengan kenderaan. Tiang ada setiap 18 m.
  const lampBase=Math.floor((vehicleRoot.position.x-9)/18)*18+9;
  lampLights[0].position.x=lampBase; lampLights[1].position.x=lampBase+18;
}

// Dikongsi dengan fail lain:
export { applyTime, updateLamps };
