# English Akşamları

Kişisel İngilizce ders sitesi. Her akşamın dersi bir veri dosyası olarak eklenir; site telefonun tarayıcısında açılıp tekrar edilir.

- **Dersler** (`index.html`): dersler gün gün; her ders kelimeler → kalıplar → diyalog → test.
- **Kelimeler** (`words.html`): bütün kelimeler, Türkçe anlam, Türkçe harflerle okunuş, sesli telaffuz, arama ve konu filtresi.
- **Tekrar** (`review.html`): karışık ve planlı tekrar testleri.
- **Alıştırma** (`exercises.html`): her ders için yazıcıdan çıktı alınabilir PDF alıştırma kağıdı ve cevap anahtarı (`node tools/alistirma.js <ders-id>` üretir).
- **İlerleme** (`progress.html`): bu telefondaki ilerleme ve Claude'a gönderilecek özet.

## Yayınlama (GitHub Pages)

Settings → Pages → Source: *Deploy from a branch* → Branch: `main`, klasör `/ (root)`.

## Yerelde deneme

```bash
python3 -m http.server 8000   # sonra http://localhost:8000
python3 tools/dogrula.py      # veri denetimi
```

Ses tarayıcının konuşma motoruyla çalışır. Claude uygulamasının içindeki pencerede çalışmaz; siteyi Chrome/Safari'de açın. Android'de İngilizce ses yoksa: Ayarlar → Metin okuma çıkışı → Google konuşma motoru → İngilizce ses verisini yükleyin.

Proje kuralları ve veri formatları için `CLAUDE.md`'ye bakın.
