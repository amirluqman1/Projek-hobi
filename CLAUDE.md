# Nota untuk Claude

Baca `README.md` dulu untuk visi, keputusan teknikal dan pelan fasa projek ni.

## Tentang pemilik projek
- Ni **projek hobi**. Pemilik nak **belajar perlahan-lahan**, bukan siapkan cepat.
- Bahasa: **Bahasa Melayu santai**. Terang dengan detail, tapi pastikan benda penting jelas nampak penting dan tak tenggelam.
- Pemilik suka faham **konsep di sebalik** sesuatu ("kenapa" dan "macam mana"), guna analogi dan contoh kecil.
- Masih awal dalam coding. Elakkan jargon tanpa penerangan.
- Konteks sebelum ni: dah tengok demo Pulau Pelita (open world three.js, base yang nak diguna), perbandingan dengan Minecraft, konsep aset, sistem koordinat, real-time rendering, dan apa yang mustahil dalam bidang game.

## Cara kerja dalam repo ni
- Kod **dikomen dalam Bahasa Melayu**, ikut seksyen, supaya pemilik boleh belajar dengan membaca.
- Satu langkah kecil yang **boleh dimain** setiap kali. Elak buat banyak sistem serentak.
- Ikut **Peraturan projek** dalam README: takde jenama sebenar, takde aset dari game lain, kredit OSM, server pegang duit.
- Fasa 1 dipecah kecil (1a, 1b, 1c, 1d). Lihat jadual dalam README. **1a dan 1b dah siap**: seksyen `MOD TUNGGANG` dalam `index.html` (input → fizik: laju, stereng, belok, gerak, condong → kamera kejar).
- 1c siap: pemilik tala `SPEC` sendiri (nilai sekarang pilihan dia, jangan tukar tanpa tanya). Pelanggaran guna `COLLIDERS` (bulatan {x,z,r}) + `collide()`; kedai/tembok laut masih clamp z.
- Langkah seterusnya: **1d**, peta 100 m × 100 m + kawalan sentuh penuh.
- Pemilik test atas phone guna raw.githack.com (branch `fasa-1a-tunggang`), belum merge ke `main`.
- Pemilik tengah belajar Blender untuk design kapcai sendiri (mungkin kitbash dari model CC0). Model `.glb` nanti ganti `buildKapcai()`; fizik tak perlu diubah.
- Nota test: cdnjs diblok dalam container cloud. Untuk test dengan Playwright, ambil `three@0.128.0` dari npm dan `page.route` ke fail tu.
