// =====================================================================
//  INPUT: butang apa yang pemain sedang tekan (papan kekunci & skrin)
//  Fail ni cuma REKOD butang. Fizik (tunggang.js) yang baca dan guna.
// =====================================================================
import { state } from './teras.js';


const input={gas:false, brake:false, left:false, right:false};  // keadaan butang SEKARANG
// "hooks": tempat fail lain sangkut fungsi untuk dipanggil bila sesuatu berlaku.
// Contoh: main.js letak initAudio() dalam hooks.onPress, supaya bunyi mula
// bila pemain tekan butang pertama, TANPA input.js perlu kenal bunyi.js.
const hooks={ onPress(){}, onCrash(power){} };

// ---- 1. INPUT: papan kekunci ----
// Kita cuma simpan "butang tengah ditekan ke tak". Fizik yang baca nanti.
const KEYS={KeyW:'gas',ArrowUp:'gas',KeyS:'brake',ArrowDown:'brake',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
addEventListener('keydown',e=>{const k=KEYS[e.code]; if(k && state.mode==='ride'){hooks.onPress(); input[k]=true; e.preventDefault();}});
addEventListener('keyup',e=>{const k=KEYS[e.code]; if(k) input[k]=false;});
addEventListener('blur',()=>{for(const k in input) input[k]=false;}); // tukar tab = lepas semua butang

// ---- 1. INPUT: butang skrin (phone) ----
// Tekan dan tahan = true, lepas jari = false.
document.querySelectorAll('.pad').forEach(b=>{
  const k=b.dataset.k;
  const on=e=>{e.preventDefault(); hooks.onPress(); input[k]=true; b.classList.add('held'); try{b.setPointerCapture(e.pointerId);}catch(err){}};
  const off=()=>{input[k]=false; b.classList.remove('held');};
  b.addEventListener('pointerdown',on);
  b.addEventListener('pointerup',off); b.addEventListener('pointercancel',off); b.addEventListener('lostpointercapture',off);
  b.addEventListener('contextmenu',e=>e.preventDefault()); // elak menu "tekan lama" phone
});

// Dikongsi dengan fail lain:
export { hooks, input };
