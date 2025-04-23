# Handler Bot Discord.js v14 Advanced (ESM) - Udah Sharding! 🚀

[![Discord.js](https://img.shields.io/badge/Discord.js-v14-7289DA?style=flat&logo=discord&logoColor=white)](https://discord.js.org) [![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.18-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/) [![ESM](https://img.shields.io/badge/Syntax-ESM-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) [![discord--hybrid--sharding](https://img.shields.io/badge/Sharding-discord--hybrid--sharding-blueviolet?style=flat)](https://github.com/meister03/discord-hybrid-sharding) [![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/) [![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=flat)](https://mongoosejs.com/) [![NPM](https://img.shields.io/badge/NPM-%23CB3837?style=flat&logo=npm&logoColor=white)](https://www.npmjs.com/) [![Winston](https://img.shields.io/badge/Logging-Winston-6f42c1?style=flat)](https://github.com/winstonjs/winston) [![dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=flat)](https://www.npmjs.com/package/dotenv) [![Chokidar](https://img.shields.io/badge/Hot_Reload-Chokidar-9B59B6?style=flat)](https://github.com/paulmillr/chokidar) [![License: ISC](https://img.shields.io/badge/License-MIT-blue?style=flat)](https://opensource.org/licenses/MIT)

---

## 📜 Ringkasan Singkat (Buat yang Mager Baca 😅)

Yo Wazzap Gaes! 👋 Ini tuh **kerangka (handler/template)** buat bikin bot Discord pake **Discord.js v14** dengan gaya **ESM (JavaScript modern)**. Udah dibikin pake **struktur Class** biar rapi + ditambahin **Sharding** pake `discord-hybrid-sharding` biar bot kamu kuat nampung banyak server tanpa ngelag! 👾

Pokoknya, handler ini modular banget, gampang dikembangin, dan fiturnya udah lumayan lengkap. Jadi, kamu bisa lebih fokus bikin fitur unik bot kamu daripada pusing mikirin strukturnya. Cocok buat bot simpel sampe bot komunitas gede!

---

## ✨ Fitur GGWP & Kenapa Ini Keren 😎

Kenapa pake template ini? Soalnya udah ada:

*   **🚀 Command Hybrid (Prefix & Slash Jadi Satu!):** Gak perlu bikin dua file! Satu file command bisa dipanggil pake prefix (cth: `!ping`) *dan* slash command (`/ping`). Hemat waktu, Cuy! Kode otomatis nyesuain cara panggilnya.
*   **🖱️ Menu Klik Kanan (Context Menu):** Support penuh buat menu pas klik kanan **User** atau **Pesan**. Bikin interaksi sama bot makin gampang.
*   **🧩 Kode Rapi Terstruktur:** File dipisah berdasarkan fungsinya (Commands, Events, Components). Gampang dicari & gak bikin pusing.
*   **⚡ Support Sharding dari Lahir:** Pake `discord-hybrid-sharding`, bot kamu bisa dibagi jadi beberapa proses (cluster). Wajib kalo bot kamu udah masuk banyak server biar gak berat!
*   **🏛️ Pake Class Biar Pro:** Logika utama bot dibungkus dalem Class `BotClient`. Kode jadi lebih teratur dan gampang di-manage.
*   **🔄 Reload Cepet Tanpa Matiin Bot (Hot Reload):** Lagi ngoding? Tinggal save, fitur baru langsung aktif! Berlaku buat **Commands**, **Events**, **Komponen UI (Tombol, Menu)**, bahkan **Config**. *(Ada trik khusus buat sharding)*.
*   **💾 Data Gak Ilang (MongoDB + Mongoose):** Simpen settingan atau data penting lainnya pake MongoDB. Udah disiapin cetakan (schema) buat:
  *   Settingan tiap server (Prefix, Role Mod, dll. - Contoh: command `setprefix`).
  *   Cooldown command (biar gak di-spam, ada per user/server).
  *   Dasar buat bikin task otomatis (misal: pengingat).
*   **🛠️ Fitur Command Kelas Berat:** Ada fitur izin (permission Discord/Role/User), cooldown, kategori otomatis, `context` object cerdas buat ambil argumen (gak peduli prefix/slash), autocomplete buat slash command, plus flag `ownerOnly` & `guildOnly`.
*   **🌐 Siap Go Internasional (Banyak Server):** Udah dirancang buat jalan lancar di banyak server sekaligus.
*   **📊 Log Jelas Gak Bikin Pusing (Winston):** Logging pake Winston, ada warnanya, ada timestamp, ada levelnya (info/warn/error/debug). Gampang banget nyari masalah. Ada pemisah log buat Manager dan Cluster-nya juga!
*   **⚙️ Anti Crash Club (Error Handling):** Ada penangkal error global (`unhandledRejection`, `uncaughtException`). Biar bot kamu gak gampang K.O.
*   **❓ Menu Bantuan Modern:** Ada contoh command `/help` interaktif pake Embed & Select Menu.
*   **🛡️ Keamanan Dasar:** Token bot kamu otomatis disensor di output `eval` (command khusus owner).
*   **🔧 Konfigurasi Aman (`dotenv`):** Simpen token & info rahasia lain di file `.env` biar aman.

---

<details>
<summary><strong>🔧 Yang Harus Kamu Punya Dulu (Prerequisites)</strong> (Klik Buka!)</summary>

Sebelum gas, pastiin ini udah siap ya:

*   **Node.js:** Versi **18.18.0 atau lebih baru** sangat disarankan (cek badge Node.js). Cek pake `node -v`.
*   **Package Manager:** `npm` (biasanya udah ada bareng Node.js) atau `Yarn`. Cek pake `npm -v` atau `yarn -v`.
*   **Version Control:** `Git` (Biar gampang update & kolaborasi).
*   **Database:** Akses ke **MongoDB**. Bisa install di komputermu atau pake yang gratisan di cloud kayak [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
*   **Kunci dari Discord:**
    *   **Token Bot**: Ambil dari [Discord Developer Portal](https://discord.com/developers/applications) (bagian Bot). Jaga baik-baik!
    *   **Client ID**: Ada di halaman Application di portal developer juga.
    *   **User ID Discord Kamu**: Buat akses command `ownerOnly`. Bisa cek pake mode developer di Discord.

</details>

---

## 🚀 Yuk, Mulai! (Getting Started)

Langkah-langkah biar bot kamu idup:

1.  **Ambil Kodenya:**
    *   **Pake Git (Disarankan):**
    ```bash
    # Ganti URL kalo repositorinya beda
    git clone https://github.com/Laun0/discordjs-v14-esm-handler-pro.git bot-discord-gw
    cd bot-discord-gw
    ```
    *   **Download Manual:** Download file ZIP, terus ekstrak.

2.  **Cek Versi Node.js:**
    ```bash
    node -v
    # Pastikan versinya udah sesuai syarat (misal: >= 18.18.0)
    ```

3.  **Install Semua Paket Wajib:** Buka terminal di folder proyek, lalu ketik:
    ```bash
    npm install
    # Atau kalo pake Yarn:
    yarn install
    ```

4.  **Isi Berkas Rahasia (`.env`):**
    *   Buat file baru namanya `.env` di folder utama. Kalo ada `.env.example`, copy aja: `cp .env.example .env`.
    *   Buka file `.env` dan isi pake data kamu:
    ```dotenv
    DISCORD_TOKEN=TOKEN_BOT_KAMU_DISINI
    CLIENT_ID=CLIENT_ID_APLIKASI_BOT_KAMU
    MONGO_URI=STRING_KONEKSI_MONGODB_KAMU_(misal_dari_Atlas)
    OWNER_IDS=ID_DISCORD_KAMU,ID_TEMEN_DEKET_KAMU_MUNGKIN
    ```
    *   **INGAT!** Jangan upload file `.env` ke Git atau ke mana pun! Rahasia!

5.  **(Opsional) Settingan Tambahan di `config/config.json`:**
    ```json
    {
      "defaultPrefix": "!", // Ganti prefix default kalo mau
      "logLevel": "info"  // Ganti jadi "debug" kalo mau liat log lebih detail pas development
    }
    ```

6.  **Invite Bot Kamu:**
    *   Bikin link invite (centang scope `bot` dan `applications.commands`). Kasih permission secukupnya (Send Messages, Embed Links, dll.).
    *   Klik linknya, masukin bot ke server kamu.

7.  **Jalankan Botnya!:**
    *   **Mode Sharding (Cara Normal & Recommended):**
    ```bash
    npm start
    # Atau pas lagi ngoding:
    npm run dev
    ```
    Ini bakal jalanin `index.js` (Managernya), yang ntar bikin proses-proses kecil (Cluster) buat botnya. Kamu bakal liat log dari `[Manager]` dan `[Cluster-X]`.

---

## 💻 Cara Bikin Command (Masih Mirip Kok!)

<details>
<summary><strong>📄 Struktur File Command & Export-nya</strong> (Klik Baca!)</summary>

Bikin command tetep gampang. Taro file `.js` di folder kategori di `src/commands/`. Isinya wajib export (default) object kayak gini:

*   **Wajib:** `name` (string unik), `type` (string: `hybrid`, `slash`, `prefix`, `context-user`, `context-message`), `execute` (async function).
*   **Wajib (Slash/Hybrid):** `description` (string).
*   **Wajib (Context Menu):** `data` (object dari builder).
*   **Opsional:** `category` (otomatis), `aliases` (buat prefix/hybrid), `options` (buat slash/hybrid), `cooldown` (object), `permissions` (object), `botPermissions` (array), `guildOnly` (boolean), `ownerOnly` (boolean), `autocomplete` (async function).

*(Detail tiap properti liat di versi README sebelumnya kalo lupa)*

</details>

<details>
<summary><strong>📦 `context` Object: Sahabat Terbaik Developer</strong> (Klik Buat Kenalan Lagi!)</summary>

Object `context` ini masih jadi andalan utama! Dikirim ke fungsi `execute` dan `autocomplete`, isinya info lengkap tanpa peduli command dipanggil gimana.

**Intinya kamu bisa akses:** (List lengkap liat README versi lama)
*   `client`: Bot kamu (`BotClient`).
*   Penanda Tipe: `isInteraction`, `isPrefix`, dll.
*   Objek Discord: `user`, `member`, `channel`, `guild`.
*   Objek Asli: `interaction` atau `message`.
*   Data DB: `guildConfig`.
*   Helper Balas: `reply()`, `editReply()`, `defer()`.
*   **Helper Argumen Juara:** `getString()`, `getInteger()`, `getBoolean()`, `getUser()` (Interaction), `getArgumentsJoined()` (Prefix), dll.

Pake helper `context.get...()` biar kode command kamu fleksibel!

</details>

<details>
<summary><strong>💡 Contoh Command `setprefix.js` (Terbaru!)</strong> (Klik Intip!)</summary>

Command ini contoh bagus buat interaksi DB, cek permission, dan pakai `context` helper.

```javascript
// src/commands/config/setprefix.js
import { PermissionsBitField } from 'discord.js';
import GuildConfig from '../../models/GuildConfig.js';

export default {
  name: 'setprefix',
  description: 'Ganti prefix command buat server ini.',
  type: 'hybrid', category: 'config', guildOnly: true,
  permissions: { discord: [PermissionsBitField.Flags.ManageGuild] }, // Cuma admin server
  options: [ /* Opsi slash 'new_prefix' di sini */ ],
  async execute(context) {
    // Ambil prefix baru pake helper, otomatis dari slash atau prefix arg
    const newPrefix = context.getString('new_prefix', true) ?? context.getString(0);

    // Validasi input (panjang, karakter, dll)
    if (!newPrefix || newPrefix.length > 5 /* ... validasi lain ... */) {
      return context.reply({ content: '❌ Prefix gak valid!', ephemeral: true });
    }

    try {
      // Update database (atau bikin baru kalo belum ada)
      await GuildConfig.findOneAndUpdate(
        { guildId: context.guild.id },
        { prefix: newPrefix },
        { upsert: true, new: true } // Ini penting!
      );
      // Optional: update cache di context biar langsung update
      if (context.guildConfig) context.guildConfig.prefix = newPrefix;

      // Kasih tau user udah berhasil
      await context.reply({ content: `✅ Siap! Prefix command server ini udah jadi: \`${newPrefix}\`` }); // Info penting, jangan ephemeral

    } catch (error) {
      context.client.logger.error(`Gagal ganti prefix buat ${context.guild.id}:`, error);
      await context.reply({ content: '❌ Duh, ada error pas nyimpen prefix baru. Coba lagi nanti.', ephemeral: true });
    }
  }
};
```

</details>

---

## ✨ Ngembangin Fitur Lain (Konteks Sharding)

<details>
<summary><strong>🗓️ Bikin Event Listener & 🧩 Komponen UI (Efek Sharding?)</strong> (Klik Penjelasannya!)</summary>

*   **Event Listener (`src/events/`):** Cara bikinnya sama aja. Kode event listener kamu bakal jalan di **cluster/proses** yang nerima event itu dari Discord. Biasanya gak perlu mikirin sharding *di dalam* kode event standar.
*   **Komponen UI (`src/components/`):** Bikinnya juga sama. Discord otomatis ngarahin interaksi tombol/menu ke shard/cluster yang tepat. Fungsi `execute(context)` komponen kamu bakal jalan di proses yang nerima interaksi itu.

</details>

<details>
<summary><strong>📡 Ngobrol Antar Cluster (Fitur Tingkat Lanjut!)</strong> (Klik Kalo Penasaran)</summary>

*   Kalo butuh, `discord-hybrid-sharding` punya cara buat proses/cluster saling kirim pesan (misal: `client.cluster.send()` atau `client.cluster.broadcastEval()` buat jalanin kode di semua cluster).
*   Berguna kalo kamu butuh data gabungan dari semua shard (misal: total user semua server) atau mau nyebar perintah (misal: update setting di semua cluster).
*   Butuh perencanaan hati-hati biar gak kacau. Cek dokumentasi `discord-hybrid-sharding` buat detailnya.

</details>

---

## 🔄 Hot Reloading (Pas Udah Sharding)

<details>
<summary><strong>⚙️ Hot Reload di Dunia Sharding: Gimana Caranya?</strong> (Klik Biar Paham)</summary>

*   **Cara Kerja:** Masih pake `chokidar` buat mantau file.
*   **Strategi Sharding:**
  *   **Masalah:** Kalo tiap cluster jalanin pemantau file, nanti kerjanya dobel & bisa konflik (misal: semua cluster barengan daftar command).
  *   **Solusi Template Ini:** Pemantau file (`initializeReloadWatcher`) dan pendaftaran command global (`_registerCommands`) **cuma dijalanin di Cluster 0**. Lebih efisien dan aman.
*   **Yang Perlu Diperhatikan:**
  *   Kalo kamu ubah file *handler* atau *utilitas* inti yang udah ke-load, mungkin tetep perlu restart manual semua cluster.
  *   Reload event listener di Cluster 0 doang berarti cluster lain gak langsung update. Kalo lagi development event, mungkin restart pake `npm run dev` lebih pasti.
  *   Buat produksi (bot udah live), paling aman matiin hot reload (`NODE_ENV=production`) dan pake restart full kalo ada update.

</details>

---

## 💾 Database & Sharding (MongoDB + Mongoose)

<details>
<summary><strong>🗄️ Interaksi DB di Bot Sharding: Aman Gak?</strong> (Klik Cekidot!)</summary>

*   **Aman Jaya!** Interaksi database (pake Mongoose kayak di command `setprefix`) **jalan normal** di bot sharding. Semua cluster nyambung ke **database MongoDB yang sama**.
*   **Konsisten:** Karena databasenya terpusat, data bakal konsisten di semua cluster. Kalo Cluster 1 ganti prefix, Cluster 2 bakal liat prefix baru pas dia ambil data server itu lagi.
*   **Model (`src/models/`):** Tetep sama fungsinya. `GuildConfig` buat settingan server, `Cooldown` buat ngatur cooldown command pake TTL Index biar data lama kehapus otomatis.

</details>

---

## 🪵 Logging (Winston) & Error Handling

<details>
<summary><strong>📢 Log yang Lebih Jelas & Bot Lebih Stabil</strong> (Klik Lihat!)</summary>

*   **Logging (`src/utils/logger.js`):**
  *   Setup Winston tetep sama.
  *   **Pembeda:** Manager (`index.js`) pake logger sendiri yang ada tulisan `[Manager]`. Tiap Cluster pake logger utama, jadi lognya gak ada prefix cluster otomatis (kecuali kamu modif logger atau cara forward log dari `Cluster.js`).
*   **Error Handling (`src/handlers/errorHandler.js`):**
  *   Jalan **per cluster**. Kalo satu cluster error parah, yang lain masih bisa jalan (meskipun Manager mungkin bakal coba restart cluster yang error). Ini bikin bot lebih tahan banting.

</details>

---

## 🤝 Pengen Bantu? / Kontribusi

Nemuin bug? Punya ide fitur GG? Mau benerin typo di sini? Monggo!

1.  **Fork** repository ini.
2.  Bikin **branch** baru (`git checkout -b fitur/keren` atau `bugfix/error-anu`).
3.  Modif kodenya.
4.  **Commit** (`git commit -m 'Tambah fitur keren banget'`).
5.  **Push** ke branch kamu (`git push origin fitur/keren`).
6.  Buka **Pull Request**!

Kita appreciate banget semua kontribusi! 😉

---

## 📄 Lisensi

Santuy, proyek ini pake Lisensi MIT. Bebas dipake & dimodif. (Cek file `LICENSE`).
