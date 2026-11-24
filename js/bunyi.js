// =====================================================================
//  BUNYI: enjin dijana kod (Web Audio), gear, bunyi langgar
// =====================================================================
import { inLake } from './dunia.js';
import { input } from './input.js';
import { vehicleRoot } from './kenderaan.js';
import { state } from './teras.js';
import { SPEC, ride } from './tunggang.js';

// ---------------- BUNYI ENJIN (Web Audio) ----------------
// Takde fail audio! Bunyi dijana terus oleh browser guna "oscillator",
// iaitu penjana gelombang. Macam synthesizer kecil.
//
// Macam mana enjin berbunyi? Setiap kali minyak meletup dalam silinder,
// keluar satu "dush". Enjin 4-lejang: setiap silinder meletup SEKALI
// setiap DUA pusingan. Jadi:
//     letupan sesaat = (RPM ÷ 60) × bilangan silinder ÷ 2
// Kapcai 1 silinder pada 1400 RPM = ~12 letupan sesaat: "pot-pot-pot".
// Pada 9000 RPM = 75 sesaat: letupan bercantum jadi "ngeeeeng".
// Kereta 4 silinder = 4 kali lebih banyak letupan, jadi bunyi lebih licin.
//
// GEAR: RPM bukan ikut laju terus. Setiap gear ada julat laju sendiri.
// Bila RPM sampai atas, tukar gear dan RPM jatuh. Itulah bunyi
// "ngeeng... ngeeng... ngeeng" kapcai pecut.
//   shift: had laju setiap gear, sebagai pecahan laju maksimum (top dalam SPEC)

const ENGINE={
  kapcai:{idle:1400, max:9000, cyl:1, shift:[0.22,0.45,0.7,1.0]},       // 4 gear
  car:   {idle:850,  max:6500, cyl:4, shift:[0.15,0.3,0.48,0.7,1.0]}    // 5 gear
};
let audio=null;   // dicipta bila pemain tekan Tunggang (lihat sebab di bawah)
let muted=false; try{ muted=localStorage.getItem('kapcai.mute')==='1'; }catch(e){}
let gear=1, rpm=900;
const gearEl=document.getElementById('gearNum'), muteBtn=document.getElementById('btnMute');

// Browser TAK BENARKAN laman web berbunyi sebelum pengguna tekan sesuatu
// (supaya iklan tak menjerit sendiri). Jadi bunyi cuma boleh dimulakan
// dalam fungsi yang dipanggil oleh tekanan butang.
function initAudio(){
  if(audio){ if(audio.ctx.state==='suspended') audio.ctx.resume(); return; }
  const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
  const ctx=new AC();
  // Rantai bunyi:  2 oscillator -> penapis (filter) -> kawalan kuat (gain) -> speaker
  const osc1=ctx.createOscillator(); osc1.type='sawtooth';  // gelombang gergaji: kasar, banyak "gigi"
  const osc2=ctx.createOscillator(); osc2.type='square';    // gelombang petak: tambah "dengung"
  const g1=ctx.createGain(); g1.gain.value=0.6;
  const g2=ctx.createGain(); g2.gain.value=0.25;
  // Penapis lowpass: buang bunyi nyaring, biar bunyi rendah lalu.
  // Buka penapis = bunyi lebih garang; tutup = bunyi tenggelam (macam dalam air).
  const filter=ctx.createBiquadFilter(); filter.type='lowpass'; filter.Q.value=4;
  const master=ctx.createGain(); master.gain.value=0;
  osc1.connect(g1); g1.connect(filter);
  osc2.connect(g2); g2.connect(filter);
  filter.connect(master); master.connect(ctx.destination);
  osc1.start(); osc2.start();
  // Bunyi "dush" langgar: 0.4 saat bunyi rawak (noise) yang makin perlahan
  const nb=ctx.createBuffer(1,Math.floor(ctx.sampleRate*0.4),ctx.sampleRate), d=nb.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
  audio={ctx,osc1,osc2,filter,master,noise:nb};
}

function playThud(power){
  if(!audio || muted) return;
  const c=audio.ctx, s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain();
  s.buffer=audio.noise; f.type='lowpass'; f.frequency.value=380; g.gain.value=Math.min(0.9,power*0.06);
  s.connect(f); f.connect(g); g.connect(c.destination); s.start();
}

function updateEngine(dt){
  const e=ENGINE[state.vehicle], top=SPEC[state.vehicle].top;
  const v=Math.abs(ride.speed)/top;                 // laju sebagai pecahan 0..1
  // Naik gear bila lepas had gear ni; turun bila jauh bawah had gear sebelum
  // (0.85 = "ruang" supaya gear tak tukar naik-turun-naik dengan cepat)
  while(gear<e.shift.length && v>e.shift[gear-1]) gear++;
  while(gear>1 && v<e.shift[gear-2]*0.85) gear--;
  const lo= gear===1 ? 0 : e.shift[gear-2], hi=e.shift[gear-1];
  const frac=Math.max(0,Math.min(1,(v-lo)/(hi-lo)));   // jauh mana dalam gear ni (0..1)
  // Gear 1 mula dari idle. Gear lain mula dari tengah: sebab tu RPM "jatuh" bila tukar gear.
  const from= gear===1 ? e.idle : e.idle+(e.max-e.idle)*0.45;
  let want=from+(e.max-from)*frac;
  if(input.gas && Math.abs(ride.speed)<0.5) want+=900;      // pulas minyak masa berhenti: "ngeng!"
  rpm += (want-rpm)*(1-Math.exp(-10*dt));              // jarum RPM tak lompat terus

  gearEl.textContent = Math.abs(ride.speed)<0.3 ? 'N' : String(gear);
  if(!audio) return;
  const t=audio.ctx.currentTime;
  const fire=rpm/60*e.cyl/2;                           // letupan sesaat (lihat formula atas)
  // setTargetAtTime: tukar nilai secara licin dalam ~0.03 s, elak bunyi "klik"
  audio.osc1.frequency.setTargetAtTime(fire,t,0.03);
  audio.osc2.frequency.setTargetAtTime(fire*2.01,t,0.03); // 2.01, bukan 2: sedikit sumbang = bunyi lebih hidup
  const load=input.gas?1:0.35;                         // pulas minyak = enjin "bekerja keras"
  let cutoff=250+fire*12*(0.5+load*0.7);
  if(inLake(vehicleRoot.position.x,vehicleRoot.position.z)) cutoff*=0.3; // dalam air: bunyi tenggelam
  audio.filter.frequency.setTargetAtTime(cutoff,t,0.05);
  const vol=(muted||state.mode!=='ride') ? 0 : 0.10+0.12*load+0.05*frac;
  audio.master.gain.setTargetAtTime(vol,t,0.08);
}

function setMuted(m){
  muted=m; try{ localStorage.setItem('kapcai.mute',m?'1':'0'); }catch(e){}
  muteBtn.textContent=m?'🔇':'🔊'; muteBtn.setAttribute('aria-label',m?'Hidupkan bunyi':'Senyapkan bunyi');
}
setMuted(muted);
muteBtn.addEventListener('click',()=>{ initAudio(); setMuted(!muted); });
addEventListener('keydown',e=>{ if(e.code==='KeyM' && state.mode==='ride'){ initAudio(); setMuted(!muted); } });
// Tukar tab / skrin phone tutup: hentikan bunyi
document.addEventListener('visibilitychange',()=>{ if(!audio) return; if(document.hidden) audio.ctx.suspend(); else audio.ctx.resume(); });

// Dikongsi dengan fail lain:
export { initAudio, playThud, updateEngine };
