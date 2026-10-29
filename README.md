# Saka Defteri - GitHub Pages Dosyaları

Bu klasördeki dosyalar hiçbir derleme (npm build, vite, node) gerektirmeden doğrudan GitHub Pages üzerinde çalışır:

1. `index.html` -> Tüm uygulama arayüzü, şifreleme, PIN ve kayıt mantığı
2. `manifest.json` -> Chrome / Android "Ana Ekrana Ekle" PWA bildirimi
3. `sw.js` -> Çevrimdışı (offline) çalışma Service Worker'ı
4. `icon.svg` -> Damacana su ikonu

## Tabletten GitHub Pages'e Yükleme Adımları:
1. GitHub.com'a girip ücretsiz hesabınızla yeni bir repo (depo) açın: `saka-defteri`
2. "Add file" > "Upload files" seçeneğiyle bu 4 dosyayı yükleyin.
3. Reponun **Settings > Pages** sekmesine gidin.
4. "Branch: main", "/ (root)" seçip **Save** butonuna basın.
5. 1-2 dakika içinde `https://<kullanici-adiniz>.github.io/saka-defteri/` adresiniz hazır olur!
