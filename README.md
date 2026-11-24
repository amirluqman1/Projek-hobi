# Projek Hobi: Game Kapcai Melaka 🏍️🌅

Game hobi multiplayer open world: lepak dan berlumba dengan kapcai atau kereta yang diubah suai sendiri, dalam peta yang diilhamkan dari negeri Melaka. Dibina perlahan-lahan sambil belajar.

## Main demo sekarang
Buka `index.html` dalam browser (perlu internet untuk three.js dan font).

Kalau repo ni public, boleh aktifkan **GitHub Pages** (Settings → Pages → Branch: `main`, folder `/root`) supaya kawan boleh main guna link.

**Demo semasa: Bengkel Senja.** Satu jalan kedai tepi laut gaya PS2, dengan kapcai dan kereta low-poly yang boleh dipusing, ditukar cat (8 warna), kemasan (berkilat/metalik/matte), rim (chrome/hitam/emas), waktu (tengah hari/senja/malam), dan material (hero berkilat ↔ PS2 rata).

## Server multiplayer (`server/`)
- Kod server: `server/index.js` (Colyseus 0.15, Node.js). Pelanggan browser guna `colyseus.js@0.15.26`.
- **Jalankan dalam komputer sendiri:** `cd server && npm install && npm start`, kemudian buka `index.html`. Game sambung ke `ws://localhost:2567`.
- **Online (Render.com, percuma):** New + → Blueprint → pilih repo ni. Render baca `render.yaml` dan bina server bernama `kapcai-server`.
  Kalau alamat Render lain dari `kapcai-server.onrender.com`, tukar `SERVER_ONLINE` dalam `index.html`, atau buka game dengan `?server=wss://alamat-anda`.
- Server percuma "tidur" lepas 15 minit tiada orang. Pemain pertama tunggu ~1 minit.

## Visi game
1. **Multiplayer**: satu bilik, maksimum **15 orang**
2. **Open world**: peta diilhamkan dari Melaka. Sasaran jangka panjang 10 km × 10 km, mula dengan **100 m × 100 m**
3. **Voice chat ikut jarak**: makin jauh pemain, makin perlahan suara
4. **Lumba**: kapcai dan kereta yang bebas diubah suai (laju, pecutan, cengkam, rupa)
5. **Ubah suai avatar**
6. **Tempat**: track lumba, tempat lepak, kedai serbaguna (upgrade), bengkel, kedai makan, scenery cantik, kereta untuk drift

## Keputusan yang dah dibuat
| Perkara | Keputusan | Sebab |
|---|---|---|
| Enjin | **three.js dalam browser** | Kawan join guna link, phone pun boleh. Boleh pindah ke Godot kemudian kalau perlu. |
| Gaya grafik | **Dunia gaya PS2 / GTA San Andreas** + **kenderaan "hero asset" berkilat** | Ringan untuk phone, aset senang dibuat sorang, kenderaan tetap cantik |
| Fizik kenderaan | Library **Rapier** atau **cannon-es**, raycast vehicle | Moto "ditipu": dikira macam kereta kecil, badan dicondongkan bila belok |
| Server multiplayer | **Colyseus** (Node.js), `maxClients: 15` | Konsep bilik siap ada |
| Voice | **WebRTC + LiveKit** (SFU), kesan jarak guna Web Audio `PannerNode` | 15 orang hantar terus antara satu sama lain terlalu berat |
| Akaun & simpanan | **Supabase** (auth + Postgres) | Server yang pegang duit & part, bukan browser |
| Peta Melaka | **OpenStreetMap** + Blender (BlenderGIS) + mercu tanda dibuat tangan | Data sebenar. Wajib kredit "© OpenStreetMap contributors". |

## Pelan fasa
| Fasa | Hasil | Status |
|---|---|---|
| 0 | Faham asas kod (rujuk `pulau-contoh.html` dalam repo Game-contoh-macam-blokblast, branch `claude/pulau-contoh`) | ⏳ |
| — | Demo gaya visual: **Bengkel Senja** (`index.html`) | ✅ |
| 1 | Peta 100 m × 100 m, **satu kapcai boleh dibawa** (fizik + kamera kenderaan) | ✅ |
| 1a | Tekan **Tunggang**: bawa depan/belakang atas Jalan Pantai, kamera kejar, meter laju, butang skrin phone | ✅ |
| 1b | Belok (A/D, ←/→, butang ◀ ▶) + kapcai condong ikut fizik sebenar, kereta goyang ke luar | ✅ |
| 1c | Rasa arcade: tala `SPEC` (dibuat sendiri: top 40, accel 15, brake 90, turn 1.5) | ✅ |
| 1c+ | **Pelanggaran**: tiang, tong, tayar (collider bulatan), lantun/gesel, kamera bergegar | ✅ |
| 1d | **Tasik Ayer Keroh (rekaan)**: jalan berliku keliling tasik (~100 m × 80 m), simpang dari Jalan Pantai, hutan 140 pokok (instancing), wakaf, zon air | ✅ |
| 1e | **Bunyi enjin** dijana kod (Web Audio): gear, RPM, bunyi langgar, butang senyap | ✅ |
| 2 | **Multiplayer**: nampak kawan bawa moto (Colyseus, max 15) | 🔨 |
| 2a | Server Colyseus (`server/`) + pemain lain muncul sebagai "hantu" (masih tersentak-sentak) | 🧪 |
| 2b | Gerakan licin (interpolation) | ⬜ |
| 2c | Kod bilik | ⬜ |
| 2d | Nama atas kepala | ⬜ |
| 3 | **Lumba**: checkpoint, pemasa, kedudukan | ⬜ |
| 4 | **Bengkel & kedai**: duit, beli/pasang part, statistik, simpan (Supabase) | ⬜ |
| 5 | **Voice chat ikut jarak** (LiveKit + PannerNode), dengan mute/block/push-to-talk | ⬜ |
| 6 | **Peta Melaka besar** (OSM, chunk, LOD, mercu tanda) | ⬜ |
| 7 | Kereta drift, avatar, kedai makan, scenery | ⬜ |

## Peraturan projek
- **Takde jenama sebenar.** Tiada nama atau logo Honda, Yamaha, EX5, 125Z dan sebagainya. Guna nama rekaan (contoh "Kapcai 110 Klasik").
- **Takde aset dari game lain** (GTA dan lain-lain). Gaya boleh diilhamkan, aset mesti buatan sendiri atau berlesen (Kenney, Quaternius, Poly Haven: CC0).
- **Kredit OpenStreetMap** bila guna data peta.
- **Server yang kira duit dan part.** Jangan percaya browser.
- **Voice chat wajib ada mute, block dan push-to-talk.** Mula dengan bilik kawan (kod bilik).

## Konsep penting yang dah dipelajari
- **Sistem koordinat**: x kanan, y bawah (2D) / y atas (3D). Anchor, susunan lapisan, kanvas saiz sama untuk lapisan.
- **Real-time rendering**: artis bina dunia sekali, GPU "ambil gambar" setiap frame.
- **Trik**: chunk/streaming, instancing, LOD, culling, kabus, baked lighting, bayang bulat palsu.
- **Hero asset**: benda yang pemain tenung paling lama dapat kualiti paling tinggi.
- **Multiplayer**: lag, interpolation/extrapolation, server sebagai hakim, kos naik ganda kuasa dua ikut bilangan pemain.
