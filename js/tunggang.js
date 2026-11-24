// =====================================================================
//  TUNGGANG: fizik kenderaan (laju, stereng, belok, condong) & pelanggaran
// =====================================================================
import { COLLIDERS, JUNCTIONS, ROAD_W, inLake } from './dunia.js';
import { hooks, input } from './input.js';
import { vehicleRoot, vehicles } from './kenderaan.js';
import { state } from './teras.js';

// ---------------- MOD TUNGGANG (Fasa 1a: depan & belakang) ----------------
// Setiap frame (lebih kurang 60 kali sesaat) kita buat 3 benda ikut urutan:
//   1. INPUT  : butang apa yang pemain sedang tekan?
//   2. FIZIK  : dari input, kira LAJU baru, lepas tu KEDUDUKAN baru
//   3. KAMERA : kamera kejar kenderaan dari belakang (dalam kamera.js)
// Ni "fizik arcade": bukan simulasi enjin dan tayar sebenar, cuma formula
// ringkas yang RASA betul. Kebanyakan game lumba buat macam ni.
//
// Unit: meter (m) dan saat (s). Laju dalam m/s. Darab 3.6 untuk dapat km/j.
// ARAH: kenderaan ada "heading" (sudut hadap, dalam radian).
//   heading 0      = hadap +x (sepanjang jalan)
//   heading positif = dah belok ke KIRI (pusing lawan arah jam bila tengok dari atas)
// Arah depan = (cos heading, 0, -sin heading). Ni trigonometri bulatan biasa:
// cos bagi "berapa banyak ke depan", sin bagi "berapa banyak ke tepi".

// Spesifikasi setiap kenderaan. Cuba ubah nombor ni dan rasa bezanya!
//   top   : laju maksimum (m/s). 25 m/s = 90 km/j
//   accel : kuat pecutan dari berhenti (m/s setiap saat)
//   brake : kuat brek (m/s setiap saat)
//   rev   : laju undur maksimum. Kapcai takde gear undur, jadi ni macam
//           tolak guna kaki: perlahan sangat.
//   turn  : kuat belok (radian sesaat) masa laju rendah. 1.3 rad ≈ 75° sesaat
const SPEC={
  kapcai:{top:40, accel:15,   brake:90,  rev:1.5, turn:1.5},
  car:   {top:33, accel:4,   brake:10, rev:5,   turn:1.0}
};
const COAST=1.2;      // bila lepas minyak, laju turun sendiri (geseran + angin)
const STEER_RATE=4;   // berapa cepat stereng sampai ke hujung (sesaat). Papan kekunci cuma on/off, jadi kita lembutkan.
const G=9.8;          // graviti (m/s²), untuk kira condong
const MAX_LEAN=0.7;   // condong paling banyak ≈ 40°
// Sempadan dunia (sementara, sebelum ada pelanggaran sebenar):
const ROAD_END=150;   // hujung jalan (meter dari tengah). Jalan panjang 320 m.
const Z_MIN=-86, SIDE_MAX=5.55; // hujung hutan (-z) dan tembok laut (+z)
// Tinggi lantai di satu titik: kaki lima 0.18 m, dalam tasik -0.3 m (terendam), lain 0.
function groundY(x,z){
  if(inLake(x,z)) return -0.3;
  const inJunction=JUNCTIONS.some(j=>Math.abs(x-j)<ROAD_W/2);
  if(z<-3.6 && z>-6.25 && !inJunction) return 0.18;  // kaki lima depan kedai
  if(z>3.6) return 0.18;                             // kaki lima tepi laut
  return 0;
}

// Nilai yang BERUBAH setiap frame dan dibaca oleh fail lain (bunyi, multiplayer,
// kamera). Disimpan dalam satu objek "ride" sebab fail lain boleh BACA
// pembolehubah yang di-export, tapi tak boleh UBAH. Isi objek pula boleh diubah.
const ride={
  speed:0,   // laju sekarang (m/s). Negatif = undur.
  steer:0,   // stereng: -1 (kanan penuh) .. 0 (lurus) .. +1 (kiri penuh)
  lean:0,    // sudut condong kapcai sekarang (radian)
  shake:0    // kuat gegaran kamera bila langgar (hilang sendiri)
};
vehicleRoot.position.set(state.x,0,state.z); vehicleRoot.rotation.y=state.heading;

// ---- PELANGGARAN ----
// Kenderaan diwakili beberapa bulatan sepanjang badan (lihat userData.hit).
// Kapcai panjang 2 m tapi kurus. Satu bulatan besar = tepi badan tembus
// tiang dari sisi; bulatan kecil berderet ikut bentuk dia dengan lebih baik.
//
// Untuk setiap bulatan kenderaan vs setiap bulatan collider:
//   jarak antara pusat < jejari1 + jejari2  ->  BERTINDIH = langgar!
// Bila langgar:
//   1. TOLAK keluar: anjak kenderaan sejauh bahagian yang bertindih,
//      ikut arah dari tiang ke kenderaan (arah "normal").
//   2. LAJU: langgar berdepan = lantun ke belakang; langgar serong = gesel,
//      hilang sikit laju je.
function collide(){
  const u=vehicles[state.vehicle].userData, h=state.heading;
  const fx=Math.cos(h), fz=-Math.sin(h);       // arah depan kenderaan
  const dir=Math.sign(ride.speed);                  // +1 ke depan, -1 undur
  let worst=0;
  for(const off of u.hit.offs){
    for(const o of COLLIDERS){
      const cx=vehicleRoot.position.x+fx*off, cz=vehicleRoot.position.z+fz*off;
      // Bulatan: titik paling dekat = pusat dia.
      // Kotak: titik paling dekat = "kepit" (clamp) pusat kita ke dalam kotak.
      //   Contoh: kotak x dari 0 ke 10, kita di x=13 -> titik terdekat x=10.
      let px,pz,rr;
      if(o.box){ px=Math.max(o.box[0],Math.min(o.box[2],cx)); pz=Math.max(o.box[1],Math.min(o.box[3],cz)); rr=0; }
      else     { px=o.x; pz=o.z; rr=o.r; }
      const dx=cx-px, dz=cz-pz;
      const d=Math.hypot(dx,dz), min=u.hit.r+rr;
      if(d>=min || d<1e-6) continue;           // tak bertindih: selamat
      const nx=dx/d, nz=dz/d;                  // arah normal (panjang 1)
      vehicleRoot.position.x+=nx*(min-d);      // 1. tolak keluar
      vehicleRoot.position.z+=nz*(min-d);
      // Dot product: berapa "tepat" kita menghala ke tiang.
      // 1 = betul-betul berdepan, 0 = lalu tepi je, negatif = tengah menjauh.
      const head=-(fx*nx+fz*nz)*dir;
      if(head<=0) continue;
      worst=Math.max(worst, Math.abs(ride.speed)*head);
      if(head>0.7) ride.speed=-ride.speed*0.3;           // 2. berdepan: lantun
      else ride.speed*=1-head;                      //    serong: gesel
    }
  }
  if(worst>2){ ride.shake=Math.min(0.35, worst*0.02); hooks.onCrash(worst); } // langgar kuat = kamera bergegar + bunyi
}

// ---- 2. FIZIK ----
// dt = berapa saat berlalu sejak frame lepas (biasanya ~0.016 s).
// Semua kiraan didarab dengan dt supaya game sama laju walaupun
// komputer laju (120 fps) atau phone perlahan (30 fps).
function updateRide(dt){
  const s=SPEC[state.vehicle];
  const veh=vehicles[state.vehicle], u=veh.userData;

  // (a) LAJU: pecut, brek, undur
  if(input.gas){
    // Makin dekat laju maksimum, makin kurang pecutan (1 - laju/top).
    // Sebab tu 0→50 km/j cepat, tapi 80→90 km/j lambat. Macam moto betul.
    ride.speed += s.accel*(1-ride.speed/s.top)*dt;
  } else if(input.brake){
    if(ride.speed>0.05) ride.speed=Math.max(0, ride.speed-s.brake*dt);  // tengah ke depan: brek
    else           ride.speed=Math.max(-s.rev, ride.speed-2*dt);    // dah berhenti: undur perlahan
  } else {
    // Takde butang: laju turun sendiri sampai 0 (tak lajak jadi negatif).
    const drop=COAST*dt;
    ride.speed = Math.abs(ride.speed)<=drop ? 0 : ride.speed-Math.sign(ride.speed)*drop;
  }

  // (b) STERENG: gerak perlahan-lahan ke arah yang pemain mahu
  const want=(input.left?1:0)-(input.right?1:0);
  const step=STEER_RATE*dt;
  ride.steer += Math.max(-step, Math.min(step, want-ride.steer));

  // (c) BELOK: berapa laju kenderaan berpusing (radian sesaat)
  //   - grip: berhenti = tak boleh pusing di tempat (tayar kena bergolek dulu)
  //   - (1 + laju×0.08): makin laju, makin susah belok tajam. Tanpa ni,
  //     belok penuh pada 90 km/j = pusing macam gasing. Tak realistik, tak seronok.
  //   - Math.sign(ride.speed): bila undur, stereng terbalik (macam kereta betul)
  const grip=Math.min(1, Math.abs(ride.speed)/3);
  const yawRate = ride.steer*s.turn/(1+Math.abs(ride.speed)*0.08)*grip*Math.sign(ride.speed);
  state.heading += yawRate*dt;
  vehicleRoot.rotation.y=state.heading;

  // (d) GERAK ikut arah hadap: jarak = laju × masa, dipecah jadi x dan z
  let x=vehicleRoot.position.x + Math.cos(state.heading)*ride.speed*dt;
  let z=vehicleRoot.position.z - Math.sin(state.heading)*ride.speed*dt;
  if(Math.abs(x)>ROAD_END){ x=Math.sign(x)*ROAD_END; ride.speed=0; }   // hujung jalan
  if(z<Z_MIN || z>SIDE_MAX){                                       // hujung hutan / tembok laut
    z=Math.max(Z_MIN, Math.min(SIDE_MAX, z));
    ride.speed -= ride.speed*3*dt;  // bergesel = hilang laju
  }
  vehicleRoot.position.x=x; vehicleRoot.position.z=z;
  collide();   // periksa tiang/tong. Mungkin anjak kenderaan sikit.
  state.x=vehicleRoot.position.x; state.z=vehicleRoot.position.z;
  // Tinggi ikut lantai (kaki lima / tasik), dilembutkan supaya tak "lompat"
  vehicleRoot.position.y += (groundY(x,z)-vehicleRoot.position.y)*(1-Math.exp(-8*dt));
  // Dalam tasik: air "tarik" kenderaan. Bukan dinding, tapi ZON yang ubah fizik.
  if(inLake(x,z)) ride.speed -= ride.speed*2.5*dt;

  // (e) CONDONG
  if(state.vehicle==='kapcai'){
    // FIZIK SEBENAR! Bila belok, badan ditarik ke luar selekoh (daya emparan).
    // Penunggang condong ke DALAM supaya graviti lawan tarikan tu.
    // Sudut seimbang: tan(condong) = laju × kadar pusing / graviti
    // Makin laju atau makin tajam belok = makin condong.
    // Tolak (-) sebab condong ke kiri = putaran x negatif dalam three.js.
    let want=-Math.atan(ride.speed*yawRate/G);
    want=Math.max(-MAX_LEAN, Math.min(MAX_LEAN, want));
    ride.lean += (want-ride.lean)*(1-Math.exp(-6*dt));   // lembutkan: badan ambil masa untuk condong
    veh.rotation.x=ride.lean;
  } else {
    // Kereta pula terbalik: badan "goyang" sikit ke LUAR selekoh (spring suspension).
    const roll=Math.max(-0.06, Math.min(0.06, ride.speed*yawRate/G*0.05));
    veh.rotation.x += (roll-veh.rotation.x)*(1-Math.exp(-6*dt));
    // tayar depan kereta (wheels[2], [3]) belok ikut stereng
    u.wheels[2].rotation.y=u.wheels[3].rotation.y=ride.steer*0.45;
  }

  // (f) Roda berpusing: sudut (radian) = jarak / jejari roda.
  // Tolak (-=) sebab bergerak ke depan bermaksud roda pusing ikut arah jam.
  u.wheels.forEach(w=>{w.rotation.z -= ride.speed*dt/u.wr;});
}

// Dikongsi dengan fail lain:
export { SPEC, groundY, ride, updateRide };
