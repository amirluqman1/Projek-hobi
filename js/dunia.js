// =====================================================================
//  DUNIA: tekstur gaya PS2, langit, Jalan Pantai, Tasik Ayer Keroh
// =====================================================================
import { bakeAO, canvasTex, lambert, noise, rand, scene, world } from './teras.js';

// ---------------- PS2 textures (kecil, dijana kod) ----------------

const texAsphalt=canvasTex(64,64,(g,w,h)=>{noise(g,w,h,'#4a4a50',26); g.fillStyle='rgba(20,20,24,.12)'; g.fillRect(10,30,22,14);},true);
texAsphalt.repeat.set(60,2);
const texWalk=canvasTex(64,64,(g,w,h)=>{noise(g,w,h,'#9b6a5a',22); g.strokeStyle='rgba(40,25,20,.45)'; g.lineWidth=2; for(let i=0;i<=64;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i,64);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(64,i);g.stroke();}},true);
texWalk.repeat.set(120,1);
const texKerb=canvasTex(64,8,(g)=>{g.fillStyle='#1b1b1d';g.fillRect(0,0,32,8);g.fillStyle='#eeeeea';g.fillRect(32,0,32,8);},true);
texKerb.repeat.set(150,1);
const texSand=canvasTex(64,64,(g,w,h)=>noise(g,w,h,'#d8bf8c',28),true); texSand.repeat.set(60,4);
const texRoof=canvasTex(32,32,(g)=>{g.fillStyle='#9e4f37';g.fillRect(0,0,32,32);g.fillStyle='#7d3b29';for(let y=0;y<32;y+=6)g.fillRect(0,y,32,2);},true);
const texPlate=canvasTex(128,32,(g)=>{g.fillStyle='#0d0d0f';g.fillRect(0,0,128,32);g.strokeStyle='#d8d8d8';g.lineWidth=2;g.strokeRect(2,2,124,28);g.fillStyle='#f4f4f4';g.font='bold 20px Arial, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('MBS 2026',64,17);});

const SHOP_COLS=['#e7c27a','#8fc3b4','#e29a8a','#a9b9e0','#f0d9a6','#c4d79a','#e4a95f','#b79ccc','#9ccbd9','#e8b8c8'];
function shopFrontTex(wall){
  return canvasTex(128,128,(g)=>{
    noise(g,128,128,wall,18);
    // tingkap tingkat atas (shutter kayu)
    for(const x of [18,74]){ g.fillStyle='#3a2a1f'; g.fillRect(x-2,14,40,44); g.fillStyle='#6d4a2f'; g.fillRect(x,16,17,40); g.fillRect(x+19,16,17,40); g.fillStyle='rgba(0,0,0,.25)'; for(let y=20;y<56;y+=5){g.fillRect(x,y,36,1);} }
    // jalur papan tanda
    g.fillStyle='rgba(0,0,0,.25)'; g.fillRect(0,66,128,14);
    // kaki lima: bukaan gelap + tiang
    g.fillStyle='#231d19'; g.fillRect(0,80,128,48);
    g.fillStyle=wall; g.fillRect(0,80,10,48); g.fillRect(118,80,10,48);
    g.fillStyle='rgba(255,200,120,.10)'; g.fillRect(14,92,100,36);
  });
}
const texWallPlain=canvasTex(32,32,(g,w,h)=>noise(g,w,h,'#d8cbb4',14),true);
function signTex(text,bg,fg){
  return canvasTex(256,40,(g)=>{g.fillStyle=bg;g.fillRect(0,0,256,40);g.fillStyle=fg;g.font='900 22px "Arial Black", Impact, Arial, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,128,21);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=3;g.strokeRect(1.5,1.5,253,37);});
}

// ---------------- sky (vertex-coloured dome) ----------------
const skyGeo=new THREE.SphereGeometry(600,24,14);
const skyMat=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false});
skyGeo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(skyGeo.attributes.position.count*3),3));
const sky=new THREE.Mesh(skyGeo,skyMat); scene.add(sky);
function paintSky(geo,top,hor,gnd){
  const p=geo.attributes.position,c=geo.attributes.color,ct=new THREE.Color(top),ch=new THREE.Color(hor),cg=new THREE.Color(gnd),tmp=new THREE.Color();
  for(let i=0;i<p.count;i++){const t=p.getY(i)/600; if(t>=0){tmp.copy(ch).lerp(ct,Math.min(1,Math.pow(t,0.6)*1.25));} else tmp.copy(ch).lerp(cg,Math.min(1,-t*5)); c.setXYZ(i,tmp.r,tmp.g,tmp.b);}
  c.needsUpdate=true;
}
function glowTex(inner,outer){return canvasTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,inner);gr.addColorStop(.35,outer);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});}
const sunSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex('rgba(255,250,230,1)','rgba(255,190,120,.55)'),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false}));
sunSprite.scale.setScalar(120); scene.add(sunSprite);
const lampGlowTex=glowTex('rgba(255,236,190,1)','rgba(255,160,60,.5)');
const glowMat=new THREE.SpriteMaterial({map:lampGlowTex,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
const poolTex=glowTex('rgba(255,190,110,.55)','rgba(255,150,60,.18)');
const poolMat=new THREE.MeshBasicMaterial({map:poolTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:0});

const UP_AXIS=new THREE.Vector3(0,1,0);
// ---------------- world: jalan pantai ----------------
// COLLIDERS: senarai benda yang boleh dilanggar. Setiap satu cuma BULATAN
// atas lantai {x, z, r}, atau KOTAK {box:[xmin, zmin, xmax, zmax]}. Game tak periksa bentuk sebenar (beribu segi tiga),
// cuma bentuk ringkas ni. Jauh lebih murah, dan pemain tak perasan bezanya.
const COLLIDERS=[];
const L=320;
function addMesh(geo,mat,x,y,z,parent){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);(parent||world).add(m);return m;}
// jalan (z -3.6..3.6)
addMesh(new THREE.PlaneGeometry(L,7.2).rotateX(-Math.PI/2),lambert({map:texAsphalt}),0,0,0);
// garisan putus tengah & garisan tepi
const lineMat=lambert({color:0xe9e6dc});
for(let x=-L/2;x<L/2;x+=6) addMesh(new THREE.PlaneGeometry(3,0.14).rotateX(-Math.PI/2),lineMat,x+1.5,0.012,0);
addMesh(new THREE.PlaneGeometry(L,0.12).rotateX(-Math.PI/2),lineMat,0,0.012,-3.25);
addMesh(new THREE.PlaneGeometry(L,0.12).rotateX(-Math.PI/2),lineMat,0,0.012,3.25);
// bahu jalan hitam-putih (kerb)
const kerbMat=lambert({map:texKerb});
// Simpang ke jalan tasik: kerb & kaki lima sebelah kedai dipotong di x ni
const JUNCTIONS=[-44,60], ROAD_W=7.2;
function walkSpans(){ const out=[]; let a=-L/2; for(const j of JUNCTIONS){out.push([a,j-ROAD_W/2]); a=j+ROAD_W/2;} out.push([a,L/2]); return out; }
// setiap potongan perlukan salinan tekstur sendiri, supaya corak tak "termampat"
function spanTex(tex,w,rx,ry){const t=tex.clone(); t.needsUpdate=true; t.repeat.set(rx*w/L,ry); return t;}
for(const [a,b] of walkSpans()) addMesh(new THREE.BoxGeometry(b-a,0.18,0.25),lambert({map:spanTex(texKerb,b-a,150,1)}),(a+b)/2,0.09,-3.72);
addMesh(new THREE.BoxGeometry(L,0.18,0.25),kerbMat,0,0.09,3.72);
// kaki lima
const walkMat=lambert({map:texWalk});
for(const [a,b] of walkSpans()) addMesh(new THREE.BoxGeometry(b-a,0.18,2.4),lambert({map:spanTex(texWalk,b-a,120,1)}),(a+b)/2,0.09,-5.05);
addMesh(new THREE.BoxGeometry(L,0.18,2.0),walkMat,0,0.09,4.85);
// tembok laut + pasir + laut
addMesh(bakeAO(new THREE.BoxGeometry(L,0.7,0.35),0,0.7,0.6),lambert({color:0xe8e2d4,vertexColors:true}),0,0.35,6.0);
addMesh(new THREE.PlaneGeometry(L,12).rotateX(-Math.PI/2),lambert({map:texSand}),0,-0.12,12.1);
const seaMat=lambert({color:0x3f7f96});
const sea=addMesh(new THREE.PlaneGeometry(2400,1200).rotateX(-Math.PI/2),seaMat,0,-0.3,618);
// tanah belakang kedai + bukit jauh
// Tanah luas sampai ke kaki bukit. Kenderaan berhenti di z=-86 (dinding halimunan),
// tapi tanah sambung jauh supaya pemain tak nampak "hujung dunia".
addMesh(new THREE.PlaneGeometry(L+200,200).rotateX(-Math.PI/2),lambert({color:0x6b7a44}),0,-0.02,-106);
const hillMat=lambert({color:0x56703f});
for(let i=0;i<14;i++){const h=12+rand()*20; addMesh(new THREE.ConeGeometry(18+rand()*20,h,6),hillMat,-160+i*25+rand()*10,h/2-2,-165-rand()*30);} // bukit jauh, di belakang hutan

// rumah kedai (sebelah z<0)
const shopNames=[['CENDOL GULA MELAKA','#2f6b3a','#fff3c4'],['KEDAI RUNCIT MAJU','#1d4f8f','#ffffff'],['TAYAR & SPORT RIM','#111111','#ffcc33'],['BENGKEL JAYA MOTOR','#c3241f','#ffffff'],['KEDAI MAKAN SINAR','#f1c232','#3a1a00'],['SATAY CELUP','#7a1f6b','#ffffff'],['CAT & SPRAY','#204a5c','#ffffff'],['KEDAI GUNTING','#e8e2d4','#1a1a1a'],['AIS KACANG','#d9534f','#ffffff'],['SERBANEKA 24 JAM','#0f6e6e','#ffffff']];
const roofMat=lambert({map:texRoof});
const signMats=[];
const SHOP_W=6.4;
shopNames.forEach((s,i)=>{
  const x=(i-3)*SHOP_W; // kedai ke-3 (BENGKEL) betul-betul belakang kenderaan
  const h=7+((i*37)%5)*0.35, d=10;
  const wall=SHOP_COLS[i%SHOP_COLS.length];
  const front=lambert({map:shopFrontTex(wall),vertexColors:true});
  const side=lambert({map:texWallPlain,color:wall,vertexColors:true});
  const geo=bakeAO(new THREE.BoxGeometry(SHOP_W-0.06,h,d),-h/2,h/2,0.62);
  const m=new THREE.Mesh(geo,[side,side,roofMat,side,front,side]); m.position.set(x,h/2+0.18,-6.25-d/2); world.add(m);
  // papan tanda (emissive pada waktu malam)
  const st=signTex(s[0],s[1],s[2]);
  const sm=new THREE.MeshLambertMaterial({map:st,emissive:0xffffff,emissiveMap:st,emissiveIntensity:0.1});
  signMats.push(sm);
  const sign=new THREE.Mesh(new THREE.BoxGeometry(SHOP_W-0.6,0.8,0.08),sm); sign.position.set(x,h*0.43+0.4,-6.2); world.add(sign);
  // anjung kaki lima
  addMesh(new THREE.BoxGeometry(SHOP_W,0.12,1.3),lambert({color:0x8a4a35}),x,h*0.37,-5.65);
});
COLLIDERS.push({box:[-22.4,-16.25,41.6,-6.25]}); // deretan kedai: satu kotak besar
// tayar bertimbun & tong minyak depan bengkel
const tyreMat=lambert({color:0x1c1c1e});
for(let s=0;s<3;s++){ for(let k=0;k<4-s;k++) addMesh(new THREE.TorusGeometry(0.28,0.11,6,12).rotateX(Math.PI/2),tyreMat,-1.9-s*0.65,0.29+k*0.21,-4.6); COLLIDERS.push({x:-1.9-s*0.65,z:-4.6,r:0.39}); }
addMesh(bakeAO(new THREE.CylinderGeometry(0.3,0.3,0.9,10),-0.45,0.45,0.55),lambert({color:0x2b5ea8,vertexColors:true}),2.3,0.63,-4.5);
COLLIDERS.push({x:2.3,z:-4.5,r:0.3}); // tong minyak

// tiang elektrik + wayar (kaki lima z<0)
const poleMat=lambert({color:0x9a958c}), wireMat=new THREE.LineBasicMaterial({color:0x18181a});
const poleXs=[]; for(let x=-140;x<=140;x+=26) poleXs.push(x+5);
poleXs.forEach(x=>{ COLLIDERS.push({x,z:-4.4,r:0.15}); addMesh(new THREE.CylinderGeometry(0.09,0.13,8,6),poleMat,x,4.1,-4.4); addMesh(new THREE.BoxGeometry(0.1,0.1,1.2),poleMat,x,7.6,-4.4); });
for(let i=0;i<poleXs.length-1;i++){ for(const dz of [-0.5,0,0.5]){ const pts=[]; for(let t=0;t<=12;t++){const u=t/12; pts.push(new THREE.Vector3(poleXs[i]+(poleXs[i+1]-poleXs[i])*u,7.65-0.9*(1-Math.pow(2*u-1,2)),-4.4+dz));} world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),wireMat)); } }

// lampu jalan (kaki lima z>0) dengan lengan ke jalan
const lampHeadMat=new THREE.MeshLambertMaterial({color:0x333333,emissive:0xffc070,emissiveIntensity:0});
const lampGlows=[], lampPools=[];
for(let x=-135;x<=135;x+=18){
  COLLIDERS.push({x,z:4.5,r:0.12}); // tiang lampu
  addMesh(new THREE.CylinderGeometry(0.07,0.1,6.6,6),poleMat,x,3.3,4.5);
  addMesh(new THREE.BoxGeometry(0.08,0.08,1.9),poleMat,x,6.55,3.6);
  addMesh(new THREE.BoxGeometry(0.5,0.12,0.28),lampHeadMat,x,6.45,2.7);
  const g=new THREE.Sprite(glowMat); g.scale.setScalar(2.4); g.position.set(x,6.3,2.7); g.visible=false; world.add(g); lampGlows.push(g);
  const pool=addMesh(new THREE.PlaneGeometry(8,8).rotateX(-Math.PI/2),poolMat,x,0.02,2.2); lampPools.push(pool);
}
// pokok kelapa atas pasir
const trunkMat=lambert({color:0x8a6a48}), frondMat=lambert({color:0x4f8a35,side:THREE.DoubleSide});
for(let x=-140;x<=140;x+=9+rand()*7){
  const palm=new THREE.Group(); const lean=(rand()-.5)*0.5, h=5+rand()*3;
  let px=0,py=0; const segs=5;
  for(let i=0;i<segs;i++){const batang=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.19,h/segs+0.05,6),trunkMat); const a=lean*(i/segs); px+=Math.sin(a)*h/segs; py+=Math.cos(a)*h/segs; batang.position.set(px,py-h/segs/2,0); batang.rotation.z=-a; palm.add(batang);}
  for(let f=0;f<8;f++){const fr=new THREE.Mesh(new THREE.PlaneGeometry(2.6,0.55),frondMat); fr.geometry.translate(1.3,0,0); fr.position.set(px,py,0); fr.rotation.set(-0.5,f/8*Math.PI*2,-0.45-rand()*0.3,'YXZ'); palm.add(fr);}
  palm.position.set(x,-0.1,8.5+rand()*6); palm.rotation.y=rand()*6.28; world.add(palm);
}

// ---------------- world: Tasik Ayer Keroh (rekaan) : Fasa 1d ----------------
// Diilhamkan dari SUASANA Ayer Keroh (tasik, hutan, jalan berliku), bukan
// salinan peta sebenar. Peta sebenar nanti guna OpenStreetMap (Fasa 6).
//
// Jalan dibina guna "lengkung" (CatmullRomCurve3): kita bagi beberapa titik
// kawalan, three.js lukis garisan licin yang lalu semua titik tu.
// Macam main "sambung titik", tapi garisannya melengkung, bukan lurus.
const LOOP_ROAD=new THREE.CatmullRomCurve3([
  [-44,-3.6],[-44,-20],[-48,-40],[-40,-62],[-20,-78],[10,-82],
  [38,-76],[58,-58],[64,-38],[60,-20],[60,-3.6]
].map(p=>new THREE.Vector3(p[0],0,p[1])));
const roadPts=LOOP_ROAD.getSpacedPoints(300);   // 301 titik, jarak sama rata

// "Reben" jalan: untuk setiap titik, cari arah jalan (tangent), kemudian
// letak satu bucu di kiri dan satu di kanan. Sambung jadi jalur segi tiga.
function ribbon(pts,width,y,mat){
  const pos=[], uv=[], idx=[]; let dist=0;
  for(let i=0;i<pts.length;i++){
    const a=pts[Math.max(0,i-1)], b=pts[Math.min(pts.length-1,i+1)];
    let tx=b.x-a.x, tz=b.z-a.z; const l=Math.hypot(tx,tz); tx/=l; tz/=l;
    const nx=-tz, nz=tx;                       // tegak lurus dengan arah jalan
    if(i>0) dist+=pts[i].distanceTo(pts[i-1]);
    pos.push(pts[i].x+nx*width/2,y,pts[i].z+nz*width/2, pts[i].x-nx*width/2,y,pts[i].z-nz*width/2);
    uv.push(0,dist/width, 1,dist/width);       // tekstur berulang ikut panjang jalan
    if(i>0){const k=i*2; idx.push(k-2,k-1,k, k-1,k+1,k);}
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx); g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat); world.add(m); return m;
}
const texRoad2=texAsphalt.clone(); texRoad2.needsUpdate=true; texRoad2.repeat.set(1,1);
ribbon(roadPts,ROAD_W,0.004,lambert({map:texRoad2,side:THREE.DoubleSide}));
// garisan putus tengah: satu jalur kecil setiap 6 m, dipusing ikut arah jalan
{ let acc=0;
  for(let i=1;i<roadPts.length;i++){
    acc+=roadPts[i].distanceTo(roadPts[i-1]);
    if(acc<6) continue; acc=0;
    const a=roadPts[i-1], b=roadPts[i];
    const dash=addMesh(new THREE.PlaneGeometry(3,0.14).rotateX(-Math.PI/2),lineMat,b.x,0.012,b.z);
    dash.rotation.y=Math.atan2(-(b.z-a.z),b.x-a.x);
  }
}

// Tasik: bulatan yang dipanjangkan jadi bujur (elips).
const LAKE={x:10,z:-45,rx:28,rz:18};
addMesh(new THREE.CircleGeometry(1,40).rotateX(-Math.PI/2),lambert({map:texSand}),LAKE.x,0.0,LAKE.z).scale.set(LAKE.rx+2.5,1,LAKE.rz+2.5); // tebing pasir
// Air sedikit "menyala" sendiri (emissive) supaya kekal biru walaupun cahaya senja oren
const lakeMat=lambert({color:0x24607a,emissive:0x0b3446});
// Air 4 cm atas pasir. Kalau terlalu rapat (1 cm), GPU keliru mana satu di depan
// dan permukaan "berkelip" bercampur. Masalah ni dipanggil Z-FIGHTING.
addMesh(new THREE.CircleGeometry(1,40).rotateX(-Math.PI/2),lakeMat,LAKE.x,0.04,LAKE.z).scale.set(LAKE.rx,1,LAKE.rz);
function inLake(x,z){ const a=(x-LAKE.x)/LAKE.rx, b=(z-LAKE.z)/LAKE.rz; return a*a+b*b<1; } // formula elips

// Wakaf tepi tasik: 4 tiang, lantai, bumbung piramid
{ const wx=10, wz=-69.5, woodMat=lambert({color:0x7a5236});
  for(const [dx,dz] of [[-1.8,-1.8],[1.8,-1.8],[-1.8,1.8],[1.8,1.8]]) addMesh(new THREE.BoxGeometry(0.18,2.6,0.18),woodMat,wx+dx,1.3,wz+dz);
  addMesh(bakeAO(new THREE.BoxGeometry(4.2,0.25,4.2),0,0.25,0.6),lambert({color:0x9a6b45,vertexColors:true}),wx,0.5,wz);
  addMesh(new THREE.ConeGeometry(3.6,1.8,4).rotateY(Math.PI/4),roofMat,wx,3.5,wz);
  COLLIDERS.push({box:[wx-2.1,wz-2.1,wx+2.1,wz+2.1]});
}
// Papan tanda di simpang
{ const sx=-50.5, sz=-12;
  const sm=new THREE.MeshLambertMaterial({map:signTex('TASIK AYER KEROH','#1f5c3a','#ffffff')});
  addMesh(new THREE.BoxGeometry(4,0.8,0.08),sm,sx,2.4,sz);
  for(const dx of [-1.6,1.6]) addMesh(new THREE.BoxGeometry(0.1,2.4,0.1),poleMat,sx+dx,1.2,sz);
  COLLIDERS.push({box:[sx-2,sz-0.2,sx+2,sz+0.2]});
}

// Hutan: 1 pokok = batang + daun. 140 pokok = 280 objek = 280 "draw call"
// (arahan lukis ke GPU). Terlalu banyak untuk phone!
// INSTANCING: bagi GPU satu bentuk + senarai kedudukan, dia lukis semua
// sekali gus. 140 pokok jadi cuma 2 draw call (1 batang, 1 daun).
{ const spots=[];
  const nearRoad=(x,z,m)=>roadPts.some(p=>Math.hypot(p.x-x,p.z-z)<m);
  for(let tries=0;tries<600 && spots.length<140;tries++){
    const x=-140+rand()*280, z=-84+rand()*76, s=0.8+rand()*0.6;
    if(z>-9) continue;                                         // jauh dari kaki lima
    if(x>-26 && x<45 && z>-20) continue;                       // belakang kedai
    if(nearRoad(x,z,6.5)) continue;                            // bukan atas jalan
    const a=(x-LAKE.x)/(LAKE.rx+5), b=(z-LAKE.z)/(LAKE.rz+5); if(a*a+b*b<1) continue; // bukan dalam tasik
    if(Math.hypot(x-10,z+69.5)<5 || Math.hypot(x+50.5,z+12)<4) continue;            // wakaf, papan tanda
    spots.push([x,z,s]);
  }
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16,0.24,2.4,6).translate(0,1.2,0),lambert({color:0x6b4a33}),spots.length);
  const leaves=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.7,0).translate(0,3.3,0),lambert({color:0xffffff}),spots.length);
  const mtx=new THREE.Matrix4(), q=new THREE.Quaternion(), col=new THREE.Color();
  spots.forEach(([x,z,s],i)=>{
    q.setFromAxisAngle(UP_AXIS,rand()*6.28);
    mtx.compose(new THREE.Vector3(x,0,z),q,new THREE.Vector3(s,s,s));
    trunks.setMatrixAt(i,mtx); leaves.setMatrixAt(i,mtx);
    leaves.setColorAt(i,col.setHSL(0.27+rand()*0.08,0.45,0.25+rand()*0.12));  // hijau berbeza sikit setiap pokok
    COLLIDERS.push({x,z,r:0.28*s});
  });
  world.add(trunks); world.add(leaves);
}

// Dikongsi dengan fail lain:
export { COLLIDERS, JUNCTIONS, ROAD_W, glowMat, glowTex, inLake, lampGlows, lampHeadMat, paintSky, poolMat, seaMat, signMats, sky, skyGeo, sunSprite, texPlate };
