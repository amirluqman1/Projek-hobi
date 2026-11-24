// =====================================================================
//  KAMERA: orbit di bengkel (seret/zum) dan kamera kejar masa tunggang
// =====================================================================
import { COLLIDERS, sky } from './dunia.js';
import { vehicleRoot, vehicles } from './kenderaan.js';
import { camera, canvas, hot, state, target } from './teras.js';
import { ride } from './tunggang.js';


const RIDE_CAM={pitch:0.2};
// ---------------- camera orbit ----------------
// orbit.auto: kamera pusing sendiri bila lama tak disentuh (mod bengkel)
const orbit={auto:!hot.yaw, lastInteract:0};
const pointers=new Map(); let pinchDist=0;
canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); orbit.auto=false; orbit.lastInteract=performance.now(); try{canvas.setPointerCapture(e.pointerId);}catch(err){} if(pointers.size===2){const [a,b]=[...pointers.values()]; pinchDist=Math.hypot(a.x-b.x,a.y-b.y);}});
canvas.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId)) return;
  const prev=pointers.get(e.pointerId); pointers.set(e.pointerId,{x:e.clientX,y:e.clientY}); orbit.lastInteract=performance.now();
  if(pointers.size===1){ state.yaw-=(e.clientX-prev.x)*0.006; state.pitch=Math.min(1.25,Math.max(0.04,state.pitch+(e.clientY-prev.y)*0.005)); }
  else if(pointers.size===2){const [a,b]=[...pointers.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y); if(pinchDist>0) state.dist=Math.min(14,Math.max(1.8,state.dist*pinchDist/d)); pinchDist=d;}
});
function up(e){pointers.delete(e.pointerId); pinchDist=0;}
canvas.addEventListener('pointerup',up); canvas.addEventListener('pointercancel',up);
canvas.addEventListener('wheel',e=>{e.preventDefault(); state.dist=Math.min(14,Math.max(1.8,state.dist*(1+e.deltaY*0.001))); orbit.lastInteract=performance.now(); orbit.auto=false;},{passive:false});

// Untuk kamera: beza sudut paling pendek (contoh: 350° ke 10° = +20°, bukan -340°)
function angleDiff(a,b){ let d=(b-a)%(Math.PI*2); if(d>Math.PI) d-=Math.PI*2; if(d<-Math.PI) d+=Math.PI*2; return d; }

const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const tmpV=new THREE.Vector3();
const camFrom=new THREE.Vector3(), camTo=new THREE.Vector3(), camStep=new THREE.Vector3();

function updateCamera(dt,riding){
  const veh=vehicles[state.vehicle];
  if(riding){
    // ---- 3. KAMERA KEJAR ----
    // "Lerp" = gerak SEBAHAGIAN jarak ke sasaran setiap frame, bukan terus lompat.
    // Hasilnya kamera ketinggalan sikit bila laju (rasa laju!) dan lembut bila berhenti.
    // Formula 1-exp(-k*dt) pastikan rasa sama walaupun fps berbeza. k besar = kejar lebih ketat.
    const desired=tmpV.set(vehicleRoot.position.x, vehicleRoot.position.y+veh.userData.target, vehicleRoot.position.z);
    target.lerp(desired, 1-Math.exp(-10*dt));
    if(pointers.size===0){ // pemain tak seret skrin: kamera balik ke belakang kenderaan
      const k=1-Math.exp(-3*dt);
      // Kamera di BELAKANG kenderaan: sudut kamera = heading - 90°.
      // Sebab kamera lerp perlahan (k kecil), bila belok kamera tertinggal sikit
      // dan kau nampak sisi moto. Itu yang bagi rasa "belok".
      state.yaw  += angleDiff(state.yaw, state.heading-Math.PI/2)*k;
      state.pitch+= (RIDE_CAM.pitch-state.pitch)*k;
      // makin laju, kamera undur sikit ke belakang: nampak lebih jalan di depan.
      // Skrin phone (tegak, sempit) perlukan kamera lebih jauh supaya moto tak penuh skrin.
      const narrow=Math.min(1.6, Math.max(1, 0.75/camera.aspect));
      state.dist += (veh.userData.dist*1.05*narrow + Math.abs(ride.speed)*0.05 - state.dist)*k;
    }
  } else {
    if(!orbit.auto && performance.now()-orbit.lastInteract>6000 && pointers.size===0) orbit.auto=true;
    if(orbit.auto && !reduce) state.yaw+=dt*0.18;
  }
  const cp=Math.cos(state.pitch);
  camera.position.set(target.x+Math.sin(state.yaw)*cp*state.dist, target.y+Math.sin(state.pitch)*state.dist, target.z+Math.cos(state.yaw)*cp*state.dist);
  if(camera.position.y<0.15) camera.position.y=0.15;
  // Jangan bagi kamera tembus masuk bangunan. Kita "berjalan" dari kenderaan
  // ke kamera dalam 12 langkah kecil. Kalau satu langkah masuk dalam kotak
  // bangunan, kamera diletak di langkah sebelum tu. Ni versi ringkas "raycast".
  if(riding){
    camFrom.copy(target); camTo.copy(camera.position);
    for(let i=1;i<=12;i++){
      camStep.lerpVectors(camFrom,camTo,i/12);
      if(COLLIDERS.some(o=>o.box && camStep.x>o.box[0]-0.3 && camStep.x<o.box[2]+0.3 && camStep.z>o.box[1]-0.3 && camStep.z<o.box[3]+0.3)){
        camera.position.lerpVectors(camFrom,camTo,(i-1)/12); break;
      }
    }
  }
  camera.lookAt(target);
  // Gegaran kamera: anjak kamera rawak sikit, makin lama makin lemah.
  // Trik murah yang buat perlanggaran rasa "berat".
  if(ride.shake>0){
    camera.position.x+=(Math.random()-.5)*ride.shake; camera.position.y+=(Math.random()-.5)*ride.shake;
    ride.shake=Math.max(0, ride.shake-dt*1.2);
  }
  sky.position.copy(camera.position);
}

// Dikongsi dengan fail lain:
export { orbit, updateCamera };
