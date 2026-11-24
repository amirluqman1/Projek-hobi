// =====================================================================
//  TERAS: benda asas yang semua fail lain perlukan
//  state (keadaan game), renderer, scene, kamera, dan fungsi bantuan kecil.
// =====================================================================
if(!window.THREE){
  document.querySelector('.title p').textContent='Enjin 3D tak dapat dimuatkan. Semak internet dan muat semula.';
  throw new Error('three.js tak dapat dimuatkan');
}
// "hot": nilai permulaan pilihan (diguna masa ujian automatik). Biasanya kosong.
const hot=(window.claude && window.claude.hot && window.claude.hot.data) || {};
const state = Object.assign({mode:'garage', x:0, z:-1.8, heading:0, vehicle:'kapcai', paint:0, finish:'gloss', rim:'chrome', time:'dusk', style:'hero', yaw:0.9, pitch:0.28, dist:4.2}, hot);

// ---------------- renderer / scene ----------------
const canvas=document.getElementById('view');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setSize(innerWidth,innerHeight,false);
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0xe49a62,25,130);
const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.05,1200);
const world=new THREE.Group(); scene.add(world);

const hemi=new THREE.HemisphereLight(0xffd2a8,0x5a4636,0.7); scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffb27a,1.1); scene.add(sun); scene.add(sun.target);

// ---------------- helpers ----------------
const rand=(function(){let a=7;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();
function canvasTex(w,h,draw,rep){
  const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); draw(g,w,h);
  const t=new THREE.CanvasTexture(c); if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;} t.anisotropy=2; return t;
}
function noise(g,w,h,base,amt){
  g.fillStyle=base; g.fillRect(0,0,w,h);
  const d=g.getImageData(0,0,w,h); for(let i=0;i<d.data.length;i+=4){const n=(rand()-.5)*amt; d.data[i]+=n; d.data[i+1]+=n; d.data[i+2]+=n;} g.putImageData(d,0,0);
}
// fake "baked" lighting: darken bottoms of boxes via vertex colours (cahaya dicat dalam bucu)
function bakeAO(geo,minY,maxY,low){
  const p=geo.attributes.position, col=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){const t=Math.min(1,Math.max(0,(p.getY(i)-minY)/(maxY-minY))); const v=low+(1-low)*Math.sqrt(t); col[i*3]=v;col[i*3+1]=v;col[i*3+2]=v;}
  geo.setAttribute('color',new THREE.BufferAttribute(col,3)); return geo;
}
function lambert(opts){ return new THREE.MeshLambertMaterial(opts); }

// Titik yang kamera pandang (biasanya tengah kenderaan)
const target=new THREE.Vector3(0,0.72,-1.8);

// Dikongsi dengan fail lain:
export { bakeAO, camera, canvas, canvasTex, hemi, hot, lambert, noise, rand, renderer, scene, state, sun, target, world };
