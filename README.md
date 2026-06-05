# Furkan Doğmuş — Kişisel Blog

Sade, statik bir kişisel blog. Build adımı yok — saf HTML/CSS/JS.

## Yapı

```
.
├── index.html            # Ana sayfa (yazı listesi)
├── about.html            # Hakkımda
├── posts/                # Blog yazıları (her biri bir HTML dosyası)
├── assets/
│   ├── css/style.css     # Tüm stiller
│   └── js/
│       ├── main.js       # Tema değiştirici + yıl
│       └── posts.js      # Yazı listesi (yeni yazıyı buraya ekle)
└── netlify.toml          # Netlify ayarları
```

## Yerelde önizleme

Herhangi bir statik sunucu işini görür:

```bash
python3 -m http.server 8000
# tarayıcıda: http://localhost:8000
```

## Yeni yazı ekleme

1. `posts/` içindeki bir dosyayı kopyalayıp yeni bir isim ver, içeriği değiştir.
2. `assets/js/posts.js` listesinin başına yazının bilgilerini ekle.

## Netlify'a deploy

**Yöntem 1 — Sürükle-bırak (en hızlı):**
[app.netlify.com/drop](https://app.netlify.com/drop) adresine bu klasörü sürükle.

**Yöntem 2 — Git ile (otomatik deploy):**
1. Bu klasörü bir GitHub deposuna gönder.
2. Netlify'da *Add new site → Import an existing project* ile depoyu seç.
3. Build command boş, publish directory `.` olarak kalsın.
4. Her `git push` otomatik yeni deploy başlatır.
