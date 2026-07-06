# 🎮 Retro Arcade Mini-Suite

Aplikasi kabinet arked mini retro yang dipenuhi dengan pelbagai permainan mini neon yang interaktif dan menyeronokkan, dibina menggunakan **React**, **Vite**, **TypeScript**, dan **Tailwind CSS**.

---

## 🚀 Panduan Cara Deploy ke Render (100% PERCUMA)

Anda boleh mengehoskan aplikasi ini di **Render** sebagai **Static Site** (Laman Statik) yang pantas dan percuma. Sila ikuti salah satu langkah mudah di bawah:

### Cara 1: Menggunakan Render Blueprint (`render.yaml`) - *SANGAT DISORKAN*
Kami telah menyediakan fail konfigurasi `render.yaml` di dalam projek ini untuk memudahkan proses deploy.
1. Muat naik (Push) kod projek ini ke dalam repositori **GitHub** atau **GitLab** anda.
2. Log masuk ke akaun [Render](https://dashboard.render.com/).
3. Klik butang **"New"** (Baru) di dashboard Render, kemudian pilih **"Blueprint"**.
4. Sambungkan akaun GitHub anda dan pilih repositori projek ini.
5. Render akan mengesan fail `render.yaml` secara automatik dan mengkonfigurasikan segala-galanya untuk anda (termasuk kawalan routing untuk mengelakkan masalah halaman tidak dijumpai/404 semasa refresh).
6. Klik **"Approve"** untuk memulakan proses deploy!

---

### Cara 2: Manual Deploy sebagai Static Site
Sekiranya anda ingin menyediakannya secara manual tanpa Blueprint:
1. Klik **"New"** di dashboard Render, kemudian pilih **"Static Site"**.
2. Sambungkan ke repositori GitHub anda.
3. Masukkan tetapan konfigurasi berikut:
   - **Name:** `retro-arcade-mini-suite` (atau nama pilihan anda)
   - **Branch:** `main` (atau branch utama anda)
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. **SANGAT PENTING (Untuk mengelakkan ralat 404 pada sub-halaman):**
   - Pergi ke tab **"Redirects/Rewrites"** dalam tetapan perkhidmatan Render anda.
   - Klik **"Add Rule"** dan masukkan:
     - **Source:** `/*`
     - **Destination:** `/index.html`
     - **Action:** `Rewrite`
5. Klik **"Create Static Site"** untuk deploy!

---

## 💻 Cara Menjalankan Projek Secara Lokal

Untuk menguji projek ini di komputer anda:

1. **Pasang Dependencies:**
   ```bash
   npm install
   ```

2. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
   Buka pelayar web anda di alamat `http://localhost:3000` (atau port yang dipaparkan dalam terminal).

3. **Bina Aplikasi untuk Produksi:**
   ```bash
   npm run build
   ```
   Ini akan menghasilkan fail statik yang dioptimumkan sepenuhnya di dalam direktori `dist/`.

---

## 🛠️ Ciri-ciri & Pengoptimuman yang Ditambah

- Fail **`render.yaml`** yang ditala khusus untuk mengehos laman statik tanpa caj bulanan.
- Konfigurasi **URL Rewrite** terbina dalam untuk mengekalkan keutuhan routing dan navigasi laman web (mencegah pepijat 404).
- Tiada API rahsia sebelah pelayan (server-side secrets) yang diperlukan, menjadikannya sangat selamat untuk dideploy secara statik secara percuma.
