---
name: yeni-ders
description: Bir sonraki İngilizce dersini hazırlayıp siteye ekler. Dersleri artık Claude önceden hazırlar; CLAUDE.md'deki ders sırasına, önceki derslere, zayıf noktalara ve (varsa) öğrencinin yapıştırdığı İlerleme özetine göre ders veri dosyasını yazar, kelimeleri kütüphaneye işler, PDF üretir, main'e gönderir. "yeni ders", "Ders N'yi hazırla", "dersi ekle", "Ders başlasın" (hazır ders yoksa) isteklerinde kullan.
---

# Yeni ders ekle

Önce `CLAUDE.md` içindeki gizlilik, öğrenci profili, ders içeriği kuralları ve veri formatlarını oku.

## 1. Girdiyi topla

Dersleri Claude hazırlar (öğrenci 27 Ekim 2026'da böyle istedi). Sohbet olmadan da eksiksiz çalışılabilir olmalı.

- **Konu:** `CLAUDE.md` → "Ders sırası" tablosundaki sıradaki ders. Tabloda yoksa öğrenme planına (aşama ve ilk ayın konuları) göre bir sonraki mantıklı konuyu seç.
- **Önceki dersler:** son 2–3 dersi oku. Kalıplarını ve kelimelerini yeni derste tekrar et (tekrar grubu, ısınma, okuma paragrafı).
- **Zayıf noktalar:** `CLAUDE.md` → "Ders içeriği kuralları" → "Şu an" listesi ve son derslerin `session.watch` alanları.
- **İlerleme özeti** (öğrenci yapıştırdıysa): test puanları, "en çok yanlış yapılanlar", "Yazdıkların". Yazdıklarını düzelt ve yeni dersin `corrections` alanına koy (`original` = öğrencinin metni, `items` = düzeltmeler, `corrected` = düzgün hâli). Yanlış yaptığı kelime/cümleleri `warmup` ve testlere kat.
- **Sohbette ders yapıldıysa** (öğrenci konuşmayı yapıştırdı ya da "Ders başlasın" ile burada yapıldı): cevaplarını, düzeltmeleri ve sonuçları `session` alanına işle.
- **Tarih:** dersin çalışılacağı akşam. Bugün 20:30'u geçtiyse ya da bugünün dersi zaten varsa ertesi gün. Ders numarası = son ders + 1. Kimlik: `YYYY-MM-DD-ders-NN`.

## 2. Ders dosyasını yaz: `data/lessons/<id>.json`

Format `CLAUDE.md` → "Veri formatları". İçerik ölçüsü (A1–A2):

- **words:** 15–30 kelime, 3–6 grup. Önceki derslerde geçen 3–5 kelimeyi de gruba koyabilirsin (tekrar).
- **patterns:** 2–4 kısa not (Türkçe açıklama, `**kalın**` ile vurgu), 3–5 grup × 3–5 cümle. Yeni kalıp sayısı az olsun; önceki dersin 1–2 kalıbını tekrar et. Cümleler öğrencinin hayatından (aile, İSG, şantiye, akşam rutini) ve takma adlarla.
- **warmup:** 5–6 soru-cevap (`q`, `a`, `tr`): önceki derslerin kalıplarından ve zayıf noktalardan. `tr` = cevabın Türkçesi + parantezde kısa ipucu (ör. "(saat için at)").
- **exercises.write:** `title` + 3 örnek cümle; ekranda ve kağıtta "Kendi cümlelerin" bölümü bunları kullanır.
- **dialogues:** 1–2 diyalog, 8–12 satır, karşı taraf soru sorar → öğrenci cevaplar sırasıyla (diyalog testi buna göre otomatik çıkar). Karşı taraf genelde "John"; öğrenci "Ali".
- **reading:** 6–10 kısa cümlelik paragraf; Ali'yi üçüncü şahısla anlatır ve o günün kelime/kalıplarını önceki derslerinkilerle birleştirir (en fazla 1–2 yeni kelime). `gist` (metni görmeden dinleyince 1 soru, 4 şık, doğru ilk), `truefalse` (4–5 cümle, yanlışlara `fix`), `blanks` (paragraftan 5–6 farklı kelime; o dersin yeni kelimeleri ve -s/-es fiiller iyi aday), `rewrite` (`prompt` + aynı paragrafın I/my ile hâli `model`). Sohbette öğrenci kendini anlattıysa paragraf onun anlattıklarından (takma adlarla) yazılsın. Format `CLAUDE.md` → "Okuma".
- **reading.rewrite.frames (zorunlu):** 12–14 yarım cümle (`text` içinde `___`; `blanks` = her boşluk için `{hint, answer?}`; `model` = örnek tam cümle). Öğrenci boş sayfaya yazamıyor; kalıp kutusu onun üretim basamağı. Her cümlede mümkünse iki tür boşluk: **dersin hedef kelimesi/kalıbı** (`answer` ile kontrol edilir: fiiller, phrasal verb'ler, *half past*, *there is/are*, edat kalıpları; alternatifleri `"a|b"`) ve **kişisel bilgi** (saat, sayı, yer; `answer` yok). `hint` Türkçe ve kısa (kutunun içinde görünür): "uyanmak", "saat", "var (çok)". Yalnızca kişisel bilgi soran kalıp kutusu yetmez (öğrencinin itirazı: fiil de en az saat kadar önemli). Dersin bütün yeni fiil ve kalıplarını kapsa.
- **Üretim önceliği:** öğrencinin asıl sorunu aklında arayıp bulmak (`CLAUDE.md` → Öğrenci profili). Kalıp cümleleri hazır, ezberlenmeye değer, öğrencinin kendi hayatına uyan cümleler olsun: bunlar otomatik olarak Cümleler destesinde Türkçe → İngilizce kart olur. Diyaloglardaki sorular "Sen cevapla" modunda öğrencinin kendisine sorulur; bu yüzden sorular kişisel cevaplanabilir olsun.
- **tests.words:** 12–18 soru, tam 4 şık, **doğru cevap ilk şık**. Yarısı Türkçe kelime → İngilizce, yarısı `___` boşluklu cümle. En az bir soru `session.watch` zayıf noktasını hedeflesin.
- **corrections / session:** sohbette yazılan metin, düzeltmeler ve adım sonuçları varsa ekle; `session.watch` listesine yeni ve süren zayıf noktaları yaz.
- **Her soru–cevap çiftini tek tek kontrol et:** cevap yalnızca sorulanı mı söylüyor? Sorulmayan bilgi varsa onu ayrı bir soruya çevir (*Why? → Because …*). Cümleler `CLAUDE.md`'deki "Ali'nin hayatı" bilgileriyle çelişmesin.
- Okunuşları `CLAUDE.md` → "Okunuş yazım kuralları"na göre yaz.
- Gerçek ad, şehir, işveren adı geçmeyecek — takma adlar: Ali, Ela, Ankara, İzmir.

## 3. Kelimeleri kütüphaneye işle

Her kelime için `kelime-ekle` skill'indeki kuralları uygula:
- `data/words.json`'da `en` (küçük harf) ile ara.
- Varsa: sadece `lessons` listesine yeni ders kimliğini ekle (yoksa). Anlamı genişletmek gerekiyorsa `tr`'yi güncelle.
- Yoksa: `en, tr, say, topic, example{en,tr}, lessons` ile ekle; gerekiyorsa `note`.
- Diziyi İngilizceye göre alfabetik sırala, `ensure_ascii=False`, 2 boşluk girinti.

Metinlerdeki (kalıp, diyalog, okuma, ısınma) bütün içerik kelimeleri kütüphanede olmalı: gruplarda olmayanları "Metinlerden kelimeler" grubuna, phrasal verb'leri (`topic: "phrasal verb"`) "Phrasal verbs" grubuna ekle. `python3 tools/dogrula.py` eksikleri uyarı olarak listeler; uyarı kalmasın.

## 4. Ana sayfa listesine ekle

`data/lessons/index.json` dizisine `{ id, number, date, week, topic, title }` ekle (ders dosyasıyla birebir aynı değerler).

## 5. Alıştırma kağıdını üret, denetle ve gönder

```bash
node tools/alistirma.js <ders-id>   # exercises/<id>-alistirma.pdf ve -cevaplar.pdf
python3 tools/dogrula.py            # PDF'i olmayan ders hata verir
```
PDF'lerin sayfa sayısına bak (`pdfinfo`, 5 sayfayı aşmasın); gerekirse `pdftoppm -r 60 -png` ile bir sayfaya göz at. PDF'ler de commit'e girer.
Hata kalmayana kadar düzelt. İstersen `python3 -m http.server` ile açıp Playwright'la 390 px genişlikte ders sayfasına bak (konsol hatası olmamalı). Sonra commit et ("Ders N: <başlık>") ve çalışılan dala push et. Öğrenci izin verdiği için aynı commit'i `git push origin <çalışma-dalı>:refs/heads/main` ile `main`'e de gönder (fast-forward), yoksa ders sitede görünmez.

**Yayının bittiğini doğrula.** `main`'e push GitHub Pages yayınını başlatır; yayın bitmeden ders bağlantısı 404 verir (30 Ekim'de yayın birkaç dakika kuyrukta bekledi ve öğrenci hata gördü). Bağlantıyı vermeden önce son yayının bu commit için `completed success` olmasını bekle:

```bash
until s=$(gh api "repos/tr1066tc/englishlearn/actions/runs?per_page=1" --jq '.workflow_runs[0] | "\(.status) \(.conclusion) \(.head_sha[0:7])"') && [[ "$s" == completed* ]]; do sleep 30; done; echo "$s"
```
(Arka planda çalıştır.) Sonuç `success` değilse ya da uzun sürüyorsa öğrenciye dersin hazır olduğunu ama yayının beklediğini söyle; bağlantıyı "birkaç dakika sonra" notuyla ver.

## 6. CLAUDE.md'yi güncelle

"Ders sırası" tablosunda dersi ✅ yap (tarih ile), sıradakini işaretle. Zayıf noktalar ("Şu an") değiştiyse güncelle. Bu değişiklik de aynı commit'e girsin.

## 7. Öğrenciye kısa özet

Türkçe, 3–6 satır: ders başlığı, kaç yeni kelime/kalıp, sayfanın bağlantısı (`https://tr1066tc.github.io/englishlearn/lesson.html?id=<id>`), önerilen çalışma sırası (Isınma → Kelimeler → Kalıplar → Diyalog → Okuma → Test → Ekranda alıştırma), ısınmada hangi zayıf noktaların sorulduğu ve "İlerleme özetini yapıştırırsan yazdıklarını düzeltirim" hatırlatması. Uzun açıklama yapma.
