// =====================================================================
//  UI: panel bengkel (warna cat, kemasan, rim, waktu, material)
// =====================================================================
import { PAINTS, applyFinish, applyPaint, applyRim, applyStyle, applyVehicle } from './kenderaan.js';
import { state } from './teras.js';
import { applyTime } from './waktu.js';

// ---------------- UI ----------------

const sw=document.getElementById('swatches');
PAINTS.forEach((p,i)=>{const b=document.createElement('button'); b.type='button'; b.className='sw'; b.style.background=p[1]; b.setAttribute('aria-label',p[0]); b.title=p[0]; b.addEventListener('click',()=>{state.paint=i; applyPaint(); syncUI();}); sw.appendChild(b);});
function seg(id,key,fn){document.getElementById(id).addEventListener('click',e=>{const b=e.target.closest('button'); if(!b) return; state[key]=b.dataset.v; fn(); syncUI();});}
seg('segVehicle','vehicle',applyVehicle); seg('segFinish','finish',applyFinish); seg('segRim','rim',applyRim); seg('segTime','time',applyTime); seg('segStyle','style',applyStyle);
const NOTES={hero:'<strong>Hero berkilat:</strong> cat ada lapisan kilat (clearcoat) dan memantulkan langit. Dunia di sekeliling kekal ringkas gaya PS2, jadi kenderaan menonjol.',ps2:'<strong>PS2 rata:</strong> kenderaan guna material yang sama ringkas macam dunia. Bandingkan dengan Hero berkilat. Kos prestasi hampir sama, tapi rupa jauh berbeza.'};
function syncUI(){
  for(const [id,key] of [['segVehicle','vehicle'],['segFinish','finish'],['segRim','rim'],['segTime','time'],['segStyle','style']])
    document.querySelectorAll('#'+id+' button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===state[key])));
  sw.querySelectorAll('.sw').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===state.paint)));
  document.getElementById('styleNote').innerHTML=NOTES[state.style];
  document.getElementById('segFinish').style.opacity=state.style==='hero'?1:0.5;
}

// Dikongsi dengan fail lain:
export { syncUI };
