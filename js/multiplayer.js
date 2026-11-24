// =====================================================================
//  MULTIPLAYER: sambung ke server Colyseus, lukis pemain lain ("hantu")
// =====================================================================
import { HERO, PAINTS, blob, buildCar, buildKapcai, vehicleRoot, vehicles } from './kenderaan.js';
import { scene, state } from './teras.js';
import { groundY, ride } from './tunggang.js';

// ---------------- MULTIPLAYER (Fasa 2a) ----------------
// Kita sambung ke server Colyseus. Konsep:
//   - Kita HANTAR kedudukan sendiri ~15 kali sesaat (mesej "gerak").
//   - Server simpan kedudukan SEMUA orang dalam state, dan hantar kepada kita.
//   - Untuk setiap pemain lain, kita lukis satu "hantu" (ghost): moto yang
//     kita tak kawal, cuma ikut kedudukan yang server bagi.
//
// Alamat server: localhost masa test dalam komputer sendiri, Render bila online.
// Boleh tukar guna URL: index.html?server=wss://alamat-lain

const SERVER_ONLINE='wss://kapcai-server.onrender.com';
function serverUrl(){
  const q=new URLSearchParams(location.search).get('server'); if(q) return q;
  if(location.protocol==='file:' || location.hostname==='localhost' || location.hostname==='127.0.0.1') return 'ws://localhost:2567';
  return SERVER_ONLINE;
}
const SEND_RATE=15;  // berapa kali sesaat kita hantar kedudukan
const net={room:null, connecting:false, ghosts:new Map(), sendT:0, lastRupa:''};
const netEl=document.getElementById('netStatus');
function setNet(st,text){ netEl.dataset.st=st; netEl.textContent=text; }
setNet('off','Offline');

async function connectNet(){
  if(net.room || net.connecting) return;
  if(!window.Colyseus){ setNet('off','Offline · pustaka multiplayer tak dapat dimuat'); return; }
  net.connecting=true;
  setNet('wait','Menyambung… server percuma mungkin ambil ~1 minit untuk "bangun"');
  try{
    const client=new Colyseus.Client(serverUrl());
    // joinOrCreate: masuk bilik "lepak" yang ada; kalau takde (atau penuh), buat baru
    const room=await client.joinOrCreate('lepak',{vehicle:state.vehicle, paint:state.paint});
    net.room=room; net.lastRupa='';
    // Tempat mula: server pilih x rawak supaya pemain tak bertindih di satu titik.
    // Cuma guna kalau kita belum bergerak dari tempat asal bengkel.
    room.onStateChange.once(st=>{
      const me=st.players.get(room.sessionId);
      if(me && Math.abs(vehicleRoot.position.x)<0.5 && Math.abs(vehicleRoot.position.z+1.8)<0.5 && Math.abs(ride.speed)<0.1){
        vehicleRoot.position.x=state.x=me.x;
      }
    });
    room.onLeave(()=>{ net.room=null; clearGhosts(); setNet('off','Terputus dari server'); });
    room.onError((code,msg)=>console.warn('Ralat server',code,msg));
  }catch(err){
    console.warn('Tak dapat sambung:',err);
    setNet('off','Offline · tak dapat sambung ke server (main sorang dulu)');
  }
  net.connecting=false;
}

// ---- Hantu (pemain lain) ----
function makeGhost(p){
  const body = p.vehicle==='car' ? buildCar() : buildKapcai();
  if(body.userData.stand){ body.userData.stand.visible=false; body.rotation.x=0; } // kapcai tegak
  // Cat sendiri untuk setiap hantu: kalau kongsi material, semua moto jadi warna sama
  const paintMat=HERO.paint.clone(); paintMat.color.set(PAINTS[p.paint][1]);
  body.traverse(o=>{ if(o.isMesh && o.userData.role==='paint') o.material=paintMat; });
  const group=new THREE.Group(); group.add(body);
  const sh=new THREE.Mesh(blob.geometry,blob.material); sh.position.y=0.015;
  sh.scale.set(body.userData.shadow[0],1,body.userData.shadow[1]); group.add(sh);
  scene.add(group);
  return {group, body, vehicle:p.vehicle, paint:p.paint, paintMat};
}
function removeGhost(id){
  const g=net.ghosts.get(id); if(!g) return;
  scene.remove(g.group);
  g.body.traverse(o=>{ if(o.isMesh) o.geometry.dispose(); });  // pulangkan memori GPU
  g.paintMat.dispose(); net.ghosts.delete(id);
}
function clearGhosts(){ for(const id of [...net.ghosts.keys()]) removeGhost(id); }

function updateNet(dt){
  const room=net.room; if(!room) return;
  // 1. HANTAR kedudukan kita (15 kali sesaat, bukan setiap frame: jimat internet)
  net.sendT+=dt;
  if(net.sendT>=1/SEND_RATE){
    net.sendT=0;
    room.send('gerak',{x:vehicleRoot.position.x, z:vehicleRoot.position.z, h:state.heading,
      l:state.vehicle==='kapcai'?vehicles.kapcai.rotation.x:0, s:ride.speed});
  }
  const rupa=state.vehicle+':'+state.paint;           // tukar kenderaan/cat? beritahu server
  if(rupa!==net.lastRupa){ net.lastRupa=rupa; room.send('rupa',{vehicle:state.vehicle, paint:state.paint}); }

  // 2. LUKIS pemain lain ikut state dari server
  const seen=new Set();
  room.state.players.forEach((p,id)=>{
    if(id===room.sessionId) return;                  // itu kita sendiri
    seen.add(id);
    let g=net.ghosts.get(id);
    if(g && g.vehicle!==p.vehicle){ removeGhost(id); g=null; }
    if(!g){ g=makeGhost(p); net.ghosts.set(id,g); }
    if(g.paint!==p.paint){ g.paintMat.color.set(PAINTS[p.paint][1]); g.paint=p.paint; }
    // ⚠️ Fasa 2a: kita LETAK TERUS hantu di kedudukan terbaru. Sebab data sampai
    // 15 kali sesaat tapi skrin lukis 60 kali sesaat, hantu akan nampak
    // TERSENTAK-SENTAK. Itu sengaja, dan Fasa 2b (interpolation) akan betulkan.
    g.group.position.set(p.x, groundY(p.x,p.z), p.z);
    g.group.rotation.y=p.heading;
    if(p.vehicle==='kapcai') g.body.rotation.x=p.lean;
    const u=g.body.userData; u.wheels.forEach(w=>{ w.rotation.z-=p.speed*dt/u.wr; });
  });
  for(const id of [...net.ghosts.keys()]) if(!seen.has(id)) removeGhost(id);  // dah keluar
  const n=room.state.players.size;
  setNet('on','Online · '+n+' pemain'+(n===1?' (kongsi link untuk ajak kawan)':''));
}

// Dikongsi dengan fail lain:
export { connectNet, updateNet };
