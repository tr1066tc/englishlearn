---
name: yeni-ders
description: Günün İngilizce dersini siteye ekler. Verilen konudan ya da Claude ile yapılan ders konuşmasından (yapıştırılan metin) ders veri dosyasını oluşturur, ana sayfa listesine ekler, kelimeleri kütüphaneye işler. "yeni ders", "dersi ekle", "bugünkü dersi siteye koy", "Ders başlasın" sonrası kullan.
---

# Yeni ders ekle

Önce `CLAUDE.md` içindeki gizlilik, öğrenci profili, ders içeriği kuralları ve veri formatlarını oku.

## 1. Girdiyi topla

- **Ders konuşması yapıştırıldıysa:** konuşmadaki kelimeleri, kalıpları, diyaloğu, öğrencinin cevaplarını, düzeltmeleri ve sonuçları (ör. tekrar 3/5) çıkar.
- **Sadece konu verildiyse:** planın neresinde olunduğuna bak (`data/lessons/index.json` son ders, hafta ve konu; `CLAUDE.md` ilk ay konuları) ve içeriği sen hazırla.
- Tarih verilmediyse bugünün tarihini kullan. Ders numarası = son ders numarası + 1. Hafta: plan haftası (aynı hafta konusu devam ediyorsa aynı numara).
- Kimlik: `YYYY-MM-DD-ders-NN`. Aynı gün ikinci ders olursa numara yine bir artar.
- Önceki 2–3 dersi oku: tekrar edilecek kalıpları ve `session.watch` zayıf noktalarını al.

## 2. Ders dosyasını yaz: `data/lessons/<id>.json`

Format `CLAUDE.md` → "Veri formatları". İçerik ölçüsü (A1–A2):

- **words:** 15–30 kelime, 3–6 grup. Önceki derslerde geçen 3–5 kelimeyi de gruba koyabilirsin (tekrar).
- **patterns:** 2–4 kısa not (Türkçe açıklama, `**kalın**` ile vurgu), 3–5 grup × 3–5 cümle. Yeni kalıp sayısı az olsun; önceki dersin 1–2 kalıbını tekrar et. Cümleler öğrencinin hayatından (aile, İSG, şantiye, akşam rutini) ve takma adlarla.
- **dialogues:** 1–2 diyalog, 8–12 satır, karşı taraf soru sorar → öğrenci cevaplar sırasıyla (diyalog testi buna göre otomatik çıkar). Karşı taraf genelde "John"; öğrenci "Ali".
- **tests.words:** 12–18 soru, tam 4 şık, **doğru cevap ilk şık**. Yarısı Türkçe kelime → İngilizce, yarısı `___` boşluklu cümle. En az bir soru `session.watch` zayıf noktasını hedeflesin.
- **corrections / session:** sohbette yazılan metin, düzeltmeler ve adım sonuçları varsa ekle; `session.watch` listesine yeni ve süren zayıf noktaları yaz.
- Okunuşları `CLAUDE.md` → "Okunuş yazım kuralları"na göre yaz.
- Gerçek ad, şehir, işveren adı geçmeyecek — takma adlar: Ali, Ela, Ankara, İzmir.

## 3. Kelimeleri kütüphaneye işle

Her kelime için `kelime-ekle` skill'indeki kuralları uygula:
- `data/words.json`'da `en` (küçük harf) ile ara.
- Varsa: sadece `lessons` listesine yeni ders kimliğini ekle (yoksa). Anlamı genişletmek gerekiyorsa `tr`'yi güncelle.
- Yoksa: `en, tr, say, topic, example{en,tr}, lessons` ile ekle; gerekiyorsa `note`.
- Diziyi İngilizceye göre alfabetik sırala, `ensure_ascii=False`, 2 boşluk girinti.

## 4. Ana sayfa listesine ekle

`data/lessons/index.json` dizisine `{ id, number, date, week, topic, title }` ekle (ders dosyasıyla birebir aynı değerler).

## 5. Alıştırma kağıdını üret, denetle ve gönder

```bash
node tools/alistirma.js <ders-id>   # exercises/<id>-alistirma.pdf ve -cevaplar.pdf
python3 tools/dogrula.py            # PDF'i olmayan ders hata verir
```
PDF'lerin sayfa sayısına bak (`pdfinfo`, 5 sayfayı aşmasın); gerekirse `pdftoppm -r 60 -png` ile bir sayfaya göz at. PDF'ler de commit'e girer.
Hata kalmayana kadar düzelt. İstersen `python3 -m http.server` ile açıp Playwright'la 390 px genişlikte ders sayfasına bak (konsol hatası olmamalı). Sonra commit et ("Ders N: <başlık>") ve çalışılan dala push et. Öğrenci izin verdiği için aynı commit'i `git push origin <çalışma-dalı>:refs/heads/main` ile `main`'e de gönder (fast-forward), yoksa ders sitede görünmez.

## 6. Öğrenciye kısa özet

Türkçe, 3–5 satır: ders başlığı, kaç yeni kelime/kalıp, sayfanın bağlantısı (`lesson.html?id=<id>`), bir sonraki derste tekrar edilecek zayıf nokta. Uzun açıklama yapma.
