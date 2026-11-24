// =====================================================================
//  MAIN: titik mula. Sambung semua bahagian dan jalankan game loop.
//
//  Susunan fail (setiap satu satu topik):
//    teras.js      state, renderer, scene, fungsi bantuan
//    dunia.js      tekstur, langit, jalan, kedai, tasik, pokok
//    kenderaan.js  material, bina kapcai/kereta, ubah suai
//    waktu.js      siang/senja/malam, pantulan, lampu jalan
//    input.js      papan kekunci & butang skrin
//    tunggang.js   fizik & pelanggaran
//    kamera.js     kamera orbit & kamera kejar
//    bunyi.js      bunyi enjin
//    multiplayer.js sambung server, pemain lain
//    ui.js         panel bengkel
// =====================================================================
import { initAudio, playThud, updateEngine } from './bunyi.js';
import { hooks, input } from './input.js';
import { orbit, updateCamera } from './kamera.js';
import { applyFinish, applyPaint, applyRim, applyStyle, applyVehicle, updateHeadlights, vehicles } from './kenderaan.js';
import { connectNet, updateNet } from './multiplayer.js';
import { camera, renderer, scene, state } from './teras.js';
import { ride, updateRide } from './tunggang.js';
import { syncUI } from './ui.js';
import { applyTime, updateLamps } from './waktu.js';


// Sambung "hooks": input.js & tunggang.js tak kenal bunyi.js; main.js yang kenalkan.
hooks.onPress=initAudio;
hooks.onCrash=playThud;

// ---- Tukar mod: bengkel <-> tunggang ----
const hintEl=document.getElementById('hint');
function setMode(m){
  state.mode=m;
  document.body.classList.toggle('riding',m==='ride');
  ride.speed=0; ride.steer=0; ride.lean=0; for(const k in input) input[k]=false;
  // Kapcai: tegak dan naikkan tongkat sisi bila ditunggang
  const k=vehicles.kapcai;
  k.rotation.x = m==='ride' ? 0 : -0.13;
  k.userData.stand.visible = (m!=='ride');
  vehicles.car.rotation.x=0; vehicles.car.userData.wheels.forEach(w=>w.rotation.y=0);
  hintEl.textContent = m==='ride'
    ? 'W / ↑ pecut · S / ↓ brek, tahan untuk undur · A D / ← → belok · M bunyi · seret untuk tengok sekeliling'
    : 'Seret untuk pusing · roda atau cubit untuk zum';
  orbit.auto=false; orbit.lastInteract=performance.now();
}
document.getElementById('btnRide').addEventListener('click',()=>{ initAudio(); setMode('ride'); connectNet(); });
document.getElementById('btnGarage').addEventListener('click',()=>setMode('garage'));
const speedNum=document.getElementById('speedNum'), speedUnit=document.getElementById('speedUnit');

// ---------------- boot ----------------
applyStyle(); applyPaint(); applyFinish(); applyRim(); applyTime(); applyVehicle(); syncUI();
setMode(state.mode);
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();});

// ---------------- GAME LOOP ----------------
// Dipanggil ~60 kali sesaat. Setiap kali: fizik -> kamera -> bunyi -> rangkaian -> lukis.
const clock=new THREE.Clock();
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),0.05);
  const riding=state.mode==='ride';
  if(riding){
    updateRide(dt);
    // Meter laju
    speedNum.textContent=Math.round(Math.abs(ride.speed)*3.6);
    speedUnit.textContent = ride.speed<-0.05 ? 'undur' : 'km/j';
    speedUnit.classList.toggle('rev', ride.speed<-0.05);
  }
  updateCamera(dt,riding);
  updateEngine(dt);    // bunyi enjin (senyap sendiri bila bukan mod tunggang)
  updateNet(dt);       // multiplayer: hantar kedudukan kita, lukis pemain lain
  updateLamps();
  updateHeadlights();
  renderer.render(scene,camera);
}
frame();
