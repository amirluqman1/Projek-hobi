// =====================================================================
//  Server multiplayer game kapcai (Colyseus 0.15)
//
//  Tugas server ni: jadi "pondok pengawal" di tengah-tengah.
//    1. Pemain sambung (join) ke satu BILIK (room). Max 15 orang.
//    2. Setiap pemain hantar kedudukan dia ~15 kali sesaat.
//    3. Server simpan semua kedudukan dalam satu STATE (keadaan bilik).
//    4. Colyseus hantar perubahan state kepada semua pemain secara automatik
//       (cuma bahagian yang berubah, bukan semua, jadi jimat internet).
//
//  Jalankan dalam komputer sendiri:   cd server && npm install && npm start
//  Server dengar di port 2567 (atau PORT yang Render bagi).
// =====================================================================
const http = require('http');
const { Server, Room } = require('colyseus');
const { WebSocketTransport } = require('@colyseus/ws-transport');
const { Schema, MapSchema, defineTypes } = require('@colyseus/schema');

// ---------------- STATE: apa yang semua orang perlu tahu ----------------
// "Schema" = bentuk data yang Colyseus tahu macam mana nak hantar dengan jimat.
// float32 = nombor perpuluhan 4 bait. uint8 = nombor bulat 0..255 (1 bait).
class Player extends Schema {}
defineTypes(Player, {
  vehicle: 'string',   // 'kapcai' atau 'car'
  paint:   'uint8',    // nombor warna cat (0..7)
  x: 'float32', z: 'float32',        // kedudukan atas lantai (meter)
  heading: 'float32',                // arah hadap (radian)
  lean:    'float32',                // condong (radian)
  speed:   'float32'                 // laju (m/s), untuk pusing roda
});

class LepakState extends Schema {
  constructor() { super(); this.players = new MapSchema(); } // senarai pemain, ikut ID sesi
}
defineTypes(LepakState, { players: { map: Player } });

// Had dunia (sama macam dalam index.html). Server tolak nombor pelik.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const num = (v, d) => (typeof v === 'number' && Number.isFinite(v)) ? v : d;

// ---------------- BILIK "lepak" ----------------
class LepakRoom extends Room {
  onCreate() {
    this.maxClients = 15;          // ikut visi game: max 15 orang
    this.setState(new LepakState());
    this.setPatchRate(1000 / 15);  // hantar perubahan 15 kali sesaat

    // Pemain hantar "gerak": kedudukan terbaru dia.
    // ⚠️ Sekarang server PERCAYA je apa yang pemain hantar (cuma tapis nombor pelik).
    // Untuk kedudukan moto, ok. Untuk DUIT nanti, server mesti kira sendiri.
    this.onMessage('gerak', (client, d) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || !d) return;
      p.x = clamp(num(d.x, p.x), -150, 150);
      p.z = clamp(num(d.z, p.z), -90, 10);
      p.heading = num(d.h, p.heading);
      p.lean = clamp(num(d.l, 0), -1, 1);
      p.speed = clamp(num(d.s, 0), -20, 80);
    });

    // Pemain tukar kenderaan / warna
    this.onMessage('rupa', (client, d) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || !d) return;
      if (d.vehicle === 'kapcai' || d.vehicle === 'car') p.vehicle = d.vehicle;
      p.paint = clamp(Math.round(num(d.paint, p.paint)), 0, 7);
    });
  }

  onJoin(client, options) {
    const p = new Player();
    p.vehicle = options && options.vehicle === 'car' ? 'car' : 'kapcai';
    p.paint = clamp(Math.round(num(options && options.paint, 0)), 0, 7);
    p.x = -10 + Math.random() * 20; p.z = -1.8; p.heading = 0;
    this.state.players.set(client.sessionId, p);
    console.log(`+ ${client.sessionId} masuk (${this.clients.length} pemain)`);
  }

  onLeave(client) {
    this.state.players.delete(client.sessionId);
    console.log(`- ${client.sessionId} keluar (${this.clients.length} pemain)`);
  }
}

// ---------------- Hidupkan server ----------------
// Laman HTTP ringkas: Render guna ni untuk check "server hidup ke tak".
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Server kapcai hidup 🏍️');
});
const gameServer = new Server({ transport: new WebSocketTransport({ server: httpServer }) });
gameServer.define('lepak', LepakRoom);
const PORT = Number(process.env.PORT) || 2567;
gameServer.listen(PORT).then(() => console.log(`Server kapcai dengar di port ${PORT}`));
