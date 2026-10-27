# English Akşamları — kişisel İngilizce ders sitesi

Tek bir öğrenci için hazırlanan, GitHub Pages'te yayınlanan statik bir İngilizce ders sitesi. Öğrenci her akşam Claude ile ders yapar; dersin içeriği bu repoya veri dosyası olarak eklenir ve öğrenci telefonundaki tarayıcıdan tekrar eder.

## Gizlilik (önce bunu oku)

Repo ve site **herkese açık**. Öğrenci gizlilik için takma ad kullanılmasını seçti:

- Öğrenci: **Ali** · kızı: **Ela** (11) · yaşadığı yer: **Ankara** · akrabalar için ikinci şehir: **İzmir**.
- Gerçek ad, eş/çocuk adı, şehir, işveren adı, proje adı, telefon, e-posta gibi bilgileri **hiçbir dosyaya yazma** (ders verisi, CLAUDE.md, skill, commit mesajı dahil). Öğrenci sohbette gerçek bilgi verirse içerikte takma adla değiştir.
- Yaş, meslek (İSG uzmanı), seviye gibi tek başına kimlik ortaya koymayan bilgiler kullanılabilir.

## Öğrenci profili

- 41 yaşında, evli, bir kızı var. A sınıfı iş güvenliği (İSG) uzmanı; şu an büyük bir altyapı projesinde şantiyede çalışıyor. On yılı aşkın İSG deneyimi, NEBOSH IGC.
- Seviye: kendini A1 olarak tanımlıyor. Yıllar önce B1'e kadar kurs almış, kullanmadığı için unutmuş; altında uyuyan bir B1 temeli var.
- Güçlü: basit cümleleri yazabiliyor, cümle yapısı büyük ölçüde doğru.
- Zayıf: konuşurken kelimeler aklına gelmiyor, dinlemede zorlanıyor, bilmediği kelimeyi Türkçe yazıyor.
- Okuma alışkanlığı yok, dikkat kolay dağılıyor, çabuk unutuyor. Uzun okuma ve uzun pasif dinleme ona uygun değil: **kısa, aktif, dokunarak ilerlenen** çalışma ve sık tekrar.
- Daha önce her denemeyi yarıda bıraktı. Kendi sözü: "Artık yarıda bırakma şansım yok."

## Hedef ve zaman

- Hedef: 45 yaşına kadar (~2030) şantiyeden fabrika ya da kurumsal bir şirketin İSG pozisyonuna geçmek; ilanlar İngilizce istiyor.
- Haftada 6 gün 08:00–18:00 çalışıyor, iş zihinsel olarak yorucu. **Sadece 20:30–22:00 arası müsait.**
- Gün içinde sürekli araç kullanıyor; **gün içi veya yolda yapılacak alıştırma asla önerme.**

## Öğrenme planı

| Aşama | Süre | Hedef |
|---|---|---|
| 1 | İlk 3 ay | Uyuyan temeli uyandırmak: kendini, aileni, işini, gününü anlatmak. 2 dakika takılmadan kendini tanıtmak. |
| 2 | 3–12 ay | A2 → B1: geçmişi ve deneyimi anlatmak, sahada olan bir olayı aktarmak, basit e-posta. |
| 3 | 1–2,5 yıl | İş İngilizcesi: İSG terimleri, prosedür okuma, yazışma, toplantı. İngilizce CV. |
| 4 | 2,5–4 yıl | Mülakat hazırlığı, deneme mülakatları, gerekirse sertifika sınavı. |

İlk ayın konuları: 1. hafta ben ve ailem · 2. hafta işim ve bir günüm · 3. hafta şantiye ve basit güvenlik cümleleri · 4. hafta tekrar ve ilk 2 dakikalık tanıtım kaydı.

**Günlük oturum (6 akşam, ~30 dk):** 5 dk tekrar (önceki günün kalıpları soru olarak) → 10 dk dinle ve tekrar et (kısa diyalog) → 15 dk konuşma (günün konusu, hatalar yumuşakça düzeltilir).

**Yarıda bırakmamak için:** sıfır gün yok (çok yorgunsa 5–10 dk) · izin gününde haftalık tekrar · her ay sonu kendini tanıtırken ses kaydı.

## Ders akışı: dersleri Claude hazırlar

Öğrencinin isteğiyle (27 Ekim 2026) dersler artık **önceden Claude tarafından hazırlanır**; öğrenci akşam dersi sitede, telefonunda çalışır. Günlük oturumun üç adımı sitede karşılanır: **5 dk tekrar** → ders sayfasının başındaki *Isınma* (`warmup`), **10 dk dinle ve tekrar et** → *Diyalog* ("Tekrar et") ve *Okuma*, **15 dk konuşma/üretim** → *Okuma → Kendi paragrafın*, *Ekranda alıştırma* ve kelime desteleri.

- Öğrenci "yeni ders", "Ders N'yi hazırla" derse: `yeni-ders` skill'i ile aşağıdaki **Ders sırası**ndaki bir sonraki dersi hazırla, `main`'e gönder, kısa özet ver.
- Öğrenci İlerleme sayfasındaki özeti yapıştırırsa (test puanları, en çok yanlış yapılanlar, yazdığı paragraf ve cümleler): yazdıklarını düzelt ve bu düzeltmeleri **bir sonraki dersin `corrections`** alanına koy; yanlış yaptıklarını bir sonraki dersin `warmup` ve testlerine kat; aşağıdaki zayıf noktalar listesini güncelle.
- Öğrenci **"Ders başlasın"** derse: sitede hazır bir ders varsa o dersin konuşma bölümünü sohbette yap (ısınma soruları, diyaloğu rol yaparak, kendi gününü/işini anlatma; hatalar yumuşakça düzeltilir), sonuçları o dersin `session` ve `corrections` alanlarına işle. Hazır ders yoksa önce hazırla.
- Ders tarihi: dersin çalışılacağı akşam (bugün 20:30 geçmişse veya bugünün dersi zaten varsa ertesi gün). Haftada 6 ders; pazar izin günü haftalık tekrar (`tekrar-testi`).

### Ders sırası

| Ders | Hafta | Konu | Durum |
|---|---|---|---|
| 1 | 1 | Ben ve ailem: kendini tanıtma, geniş aile | ✅ 25 Ekim |
| 2 | 2 | İşim: nerede, ne iş, hangi saatler | ✅ 27 Ekim |
| 3 | 2 | Bir günüm: sabahtan akşama, saat söyleme, günler | ✅ 28 Ekim (hazır) |
| 4 | 3 | Şantiyem: şantiyedeki kişiler ve yerler (worker, engineer, foreman, office, gate…), there is / there are | sıradaki |
| 5 | 3 | Basit güvenlik cümleleri: emir kipi (Wear your helmet. Don't run. Be careful.), KKD kelimeleri | |
| 6 | 3 | Şantiyede bir sorun: can / can't, must / mustn't, uyarı vermek | |
| 7 | 4 | Hafta tekrarı + 2 dakikalık tanıtım metnini birleştirme (okuma paragraflarının I hâlleri) | |
| 8 | 4 | Tanıtım kaydı: metni sesli okuma ve ezberden söyleme (ay sonu ses kaydı) | |

Her ders önceki derslerin kalıplarını tekrar eder; yeni ders hazırlanınca tabloyu güncelle.

## Öğrenciyle konuşurken

- Öğrenci bir şey anlatıyorsa **önce anla, soru sor; hemen ders vermeye geçme.** (İlk konuşmada en çok bu takdir edildi.)
- Açıklamalar ve yönergeler **Türkçe**, öğrenilen içerik **İngilizce**.
- Hatalar yargılamadan, kısa açıklamayla düzeltilir.
- Dersi kısaltma; öğrenci "normal ders" istiyor. Ama yorgun günler için kısa versiyon öner.

## Ders içeriği kuralları

- Seviyeye uygun kısa, basit cümleler (şu an A1–A2).
- Konular öğrencinin hayatından: aile, iş (İSG, şantiye), günlük rutin.
- Bir derste az sayıda yeni kalıp; önceki derslerin kalıpları tekrar edilir.
- Takip edilen zayıf noktalar ders dosyalarındaki `session.watch` alanında; yeni dersin tekrar adımında bunları sor.
  - Şu an: uzun adlarda kelime atlama (*construction site* → site eksik kaldı; *occupational health and safety specialist* Ders 2'de tam çıktı, takip sürsün); *people are* (çoğul); saat için *at* (*finish at six*); yazım: *forty*, *health*, *difficult*. (*How are you?* / *How old are you?* karışıklığı Ders 2 tekrarında düzeldi.)
- Kütüphanedeki her kelimede Türkçe anlam ve Türkçe harflerle okunuş **mutlaka** olmalı.

## Okunuş yazım kuralları

Okunuş, Türk okuyucunun doğrudan okuyabileceği şekilde **Türkçe harflerle** yazılır (Amerikan telaffuzu esas).

- Vurgusuz belirsiz ünlü (schwa) → **ı**: mother → *madır*, parents → *perınts*, cousin → *kazın*.
- *th* → yaklaşık **d** (this, mother) veya **t** (think, health); kelimenin `note` alanına "th: dil ucu dişlerin arasında" yaz.
- Uzun ünlüler harf tekrarıyla: father → *faadır*, daughter → *dootır*, niece → *niis*, law → *loo*.
- *w* → **v**: wife → *vayf*. *-s* sonu z gibi okunuyorsa **z**: siblings → *siblingz*.
- *-er* sonu → **ır**: sister → *sistır*. *-ture/-tion* → *çır / şın*.
- İngiliz telaffuzu çok farklıysa parantezle ekle: aunt → *ent (İngiliz: aant)*.
- Birden çok kelimeli ifadelerde kelimeler boşlukla ayrılır: *madır in loo*.

## Proje yapısı

```
index.html, lesson.html, words.html, review.html, exercises.html, practice.html, progress.html   # sayfa kabukları (hepsi aynı)
assets/style.css      # tek stil dosyası, renk değişkenleri :root'ta, açık/koyu tema
assets/app.js         # ortak: veri yükleme, ses, tema, ilerleme, testler (App nesnesi)
assets/srs.js         # Anki benzeri aralıklı tekrar motoru (kelime desteleri)
assets/<sayfa>.js     # home, lesson, words, review, exercises, practice, progress
data/lessons/index.json              # ana sayfadaki ders listesi
data/lessons/YYYY-MM-DD-ders-NN.json # her ders
data/words.json                      # kelime kütüphanesi (tek kaynak)
data/reviews/index.json, <id>.json   # planlı tekrar testleri
exercises/<ders-id>-alistirma.pdf    # yazıcıdan çıktı alınacak alıştırma kağıdı (araçla üretilir)
exercises/<ders-id>-cevaplar.pdf     # cevap anahtarı
tools/alistirma.js                   # ders verisinden iki PDF üretir (Playwright/Chromium gerekir)
tools/dogrula.py                     # veri denetimi — her değişiklikten sonra çalıştır
.claude/skills/                      # yeni-ders, kelime-ekle, tekrar-testi, ilerleme
```

Harici bağımlılık yok, derleme adımı yok. Sayfalar `fetch()` ile JSON okuduğu için dosyadan (`file://`) açılmaz; yerelde denemek için `python3 -m http.server` çalıştır.

## Veri formatları

### `data/words.json`
İngilizceye göre alfabetik dizi. Anahtar `en` (küçük harfe çevrilerek karşılaştırılır); **aynı kelime iki kez olamaz.** Kelime yeni bir derste tekrar geçerse sadece `lessons` listesine ders kimliği eklenir.

```json
{ "en": "mother", "tr": "anne", "say": "madır", "topic": "aile",
  "note": "th sesi: ...",                       // isteğe bağlı
  "example": { "en": "My mother lives in Ankara.", "tr": "Annem Ankara'da yaşıyor." },
  "lessons": ["2026-10-25-ders-01"] }
```
`topic` kelime sayfasındaki filtredir; küçük harf, Türkçe, kısa: `aile`, `tanışma`, `iş`, `günlük rutin`, `şantiye`, `güvenlik`… Yeni konu açmadan önce mevcutları kullan.

### `data/lessons/<id>.json`
Kimlik: `YYYY-MM-DD-ders-NN` (NN = iki haneli ders numarası). `index.json`'a aynı `id, number, date, week, topic, title` ile eklenir.

```json
{
  "id", "number", "date", "week", "topic", "title", "summary",
  "words":    { "intro": "...", "groups": [ { "name": "Yakın aile", "words": ["mother", "father"] } ] },
  "patterns": {
    "notes":  [ { "title": "have / has", "text": "**kalın** desteklenir" } ],
    "tables": [ { "title", "intro", "columns": [...], "rows": [[...]] } ],
    "groups": [ { "name": "Kardeşler", "items": [ { "en", "tr" } ] } ],
    "footnote": "..."
  },
  "warmup": [ { "q": "What time do you finish?", "a": "I finish at six.", "tr": "Altıda bitiriyorum. (saat için at)" } ],
  "dialogues": [ { "title", "speakers": { "A": "John", "B": "Ali" }, "student": "B",
                   "lines": [ { "who": "A", "en", "tr" } ] } ],
  "reading": { "title", "sentences": [ { "en", "tr" } ], "note": "**kalın** desteklenir",
               "gist": { "q": "Metin ne hakkında?", "options": [doğru, ...3 yanlış] },
               "truefalse": [ { "en", "tr", "answer": true|false, "fix": "yanlışsa metindeki doğrusu" } ],
               "blanks": ["works", "starts"],
               "rewrite": { "prompt", "model" } },
  "tests": { "words": [ { "q": "babaanne", "options": ["grandmother", "aunt", "niece", "cousin"] } ],
             "dialogue": "auto" },
  "corrections": { "intro", "original", "items": [ { "wrong", "right", "note" } ], "corrected" },  // isteğe bağlı
  "session": { "intro", "results": [ { "step", "score", "note" } ], "watch": ["..."] }           // isteğe bağlı
}
```
- `words.groups[].words` yalnızca kütüphanedeki `en` anahtarlarını listeler; anlam/okunuş `words.json`'dan gelir.
- Kelime testinde **doğru cevap her zaman ilk şıktır**, tam 4 şık; sayfa şıkları karıştırır. Boşluklu cümlede `___` kullan.
- Diyalog testi otomatik: karşı tarafın satırı soru, hemen ardından gelen öğrenci satırı cevap olur. Diyalogları buna göre soru-cevap sırasıyla yaz.
- `corrections` ve `session` varsa "Notlar" sekmesi görünür.
- **Isınma (`warmup`):** 5–6 soru-cevap; önceki derslerin kalıplarından ve zayıf noktalardan (aşağıdaki "Şu an" listesi). `tr` alanı cevabın Türkçesi + parantezde kısa ipucu. Ders sayfasının en üstünde açılır kart olarak görünür (sekme değil); yapılınca kapanmış gelir.
- **Okuma (`reading`):** 6–10 kısa cümlelik paragraf, Ali'yi **üçüncü şahısla** anlatır (*he works, his family*), yalnızca o derste ve önceki derslerde geçen kelime/kalıplarla (en fazla 1–2 yeni kelime). `gist` metni görmeden dinleyince sorulan tek soru (4 şık, doğru ilk). `truefalse` 4–5 cümle; yanlışların `fix` alanı metindeki doğru cümle. `blanks` paragrafta geçen 5–6 kelime (her biri metindeki ilk geçtiği yerde boşluk olur, tekrar etmesin). `rewrite.model` aynı paragrafın birinci şahısla (I / my) hâli: öğrenci kendi bilgileriyle yeniden yazar; haftalar ilerledikçe bunlar 2 dakikalık tanıtım metnine dönüşür.

### `data/reviews/<id>.json`
Kimlik: `YYYY-MM-DD-tekrar-NN`. `index.json`'a `{ id, date, title }` olarak eklenir.
```json
{ "id", "date", "title", "intro", "lessons": ["..."], "words": ["mother", "uncle"],
  "phrases": [ { "en": "I miss my family.", "tr": "Ailemi özlüyorum." } ] }
```
Kelime soruları ve yanlış şıklar sayfada otomatik üretilir (aynı konudan).

## Ders sayfası yapısı (beğenilen yapı, değiştirme)

0. **Isınma** (sekmelerin üstünde kart, `warmup` varsa): soruyu dinle → söyle → cevabı göster → Bildim / Bilemedim.
1. **Kelimeler:** gruplu liste, her satırda dinle; "Türkçeyi gizle" (bulanık yazıya dokununca açılır); tümünü dinle.
2. **Kalıplar:** kısa dilbilgisi notları, gerekirse tablo, kullanılabilir cümleler (İngilizce, Türkçe, dinle).
3. **Diyalog:** *Oku ve dinle* (satır satır, tümünü dinle) ve *Tekrar et* (öğrencinin satırları tek tek, 3 kez "Söyledim" → sonraki).
4. **Okuma** (öğrenci onayıyla eklendi; `reading` yoksa sekme görünmez): 1) önce dinle (metin gizli, `gist` sorusu cevaplanınca açılır), 2) oku ve dinle (okunan cümle vurgulanır, cümleye dokununca Türkçesi), 3) doğru/yanlış, 4) boşluk doldur (kelime kutucukları), 5) kendi paragrafın (yazı kutusu + "Claude'a kopyala").
5. **Test:** kelime testi (4 şık, anında doğru/yanlış, sonunda sadece yanlışlar) ve diyalog testi (cevabı göster → Bildim / Bilemedim, sonunda bilemedikler). Altında "Ekranda alıştırma çöz" bağlantısı.
6. **Notlar** (isteğe bağlı): düzeltmeler ve sohbetteki dersin sonuçları.

## Kelime desteleri (Anki benzeri aralıklı tekrar)

Kelimeler sayfasının varsayılan sekmesi **Desteler**: her ders bir deste, dersin her kelime grubu bir alt deste. Bir kelime yalnızca **ilk geçtiği dersin ilk grubunda** sayılır (sonraki derslerin "tekrar" gruplarında tekrar kart açılmaz). Sağdaki üç sayı AnkiDroid'deki gibi: **mavi = yeni** (günlük sınırla), **kırmızı = öğrenme / yeniden öğrenme** (20 dk içinde zamanı gelen), **yeşil = bugün tekrarı gelen**.

- Motor `assets/srs.js`. Varsayılanlar Anki'nin kendi varsayılanları (ankitects/anki `rslib/src/deckconfig/mod.rs`, `scheduler/states/review.rs`, `steps.rs`): öğrenme adımları 1 dk + 10 dk, yeniden öğrenme 10 dk, mezuniyet 1 gün (Kolay 4 gün), başlangıç kolaylığı 2,5, Zor ×1,2 (kolaylık −0,15), Yeniden kolaylık −0,20 (en az 1,3), Kolay ×1,3 (+0,15), günde **her alt deste (kelime grubu) için ayrı** 20 yeni kart (`days[gün].newBy[alt-deste-id]`) / toplam 200 tekrar, yeni gün 04:00. Üst destenin (ders) üç sayısı **alt destelerin toplamıdır** (AnkiDroid'deki gibi); üst desteye dokununca her alt destenin kendi sınırı uygulanır. Sınırı ders ya da bütün desteler için ortak saymak, bir alt deste bitince çalışılmamış alt desteleri de 0'a düşürür; öğrenci bunu istemedi. 8 kez unutulan kart "zor kelime" işaretlenir.
- Düğmeler: Yeniden / Zor / İyi / Kolay, üstlerinde sonraki aralık. Tek adımlık "Geri al" var.
- Ayarlar: günlük yeni kart sınırı (5/10/20/30) ve kart yönü (İng→Tür, Tür→İng, ikisi de). Kart kimliği `<yön>:<kelime>`.
- Durum `localStorage` → `englishlearn:v1` → `srs` (`cards`, `days`, `settings`, `collapsed`, `undo`). "Yeniden" cevabı `missed` sayacına da eklenir. İlerleme sayfası özetinde kart istatistikleri ve çok unutulan kelimeler yer alır; `tekrar-testi` ve `ilerleme` bunları kullanabilir.
- Yeni ders eklemek için ek iş gerekmez: dersin `words.groups` listesi otomatik olarak yeni deste olur.

## Ekranda alıştırma (`practice.html?id=<ders-id>`)

Ders verisinden otomatik, her açılışta karışık: **Eşleştir** (6 kelime, Türkçe ↔ İngilizce dokunarak), **Cümle sırala** (kalıp ve okuma cümlelerinden 5 tane, kelime kutucuklarıyla), **Kelimeyi yaz** (8 kelime, ilk harf + harf sayısı ipucu; büyük/küçük harf ve noktalama sayılmaz, tek harf hatası "neredeyse" der ama yanlış sayılır), **Kendi cümlelerin** (yazı kutusu; örnekler `exercises.write.models` ya da ikinci kalıp grubu). Sonuçlar ders kaydına (`match`, `order`, `spell`; okuma için `tf`, `cloze`) ve yanlışlar `missed` listesine işlenir. Öğrencinin yazdıkları `localStorage` → `writing["<ders-id>:okuma" | "<ders-id>:cumleler"]`; İlerleme özetine metin olarak girer, Claude bir sonraki derste düzeltir. Ek veri gerekmez.

## Alıştırma kağıtları (PDF)

`exercises.html` sayfası her ders için yazıcıdan çıktı alınabilir bir **alıştırma kağıdı** ve ayrı bir **cevap anahtarı** sunar. İkisi de ders JSON'undan `node tools/alistirma.js <ders-id>` ile üretilir (A4, kalemle çözülür; eşleştir, şık seç, ilk harf ipuçlu yaz, cümle sırala, diyaloğu tamamla, 3 kez söyleme çizelgesi, kendi cümlelerin). Aynı ders için her seferinde aynı sorular çıkar.

- Kelime, kalıp, test ve diyalog verisi değişirse PDF'leri yeniden üret ve commit et. `dogrula.py` PDF'i olmayan dersi hata sayar.
- İsteğe bağlı: ders JSON'una `"exercises": { "write": { "title": "...", "models": ["...", "..."] } }` eklenirse "Kendi cümlelerin" bölümünde o örnekler kullanılır; yoksa ikinci kalıp grubunun ilk 3 cümlesi alınır.
- Kağıtta gerçek ad yoktur ("Ali" takma adı kullanılır); Tarih/Süre/Puan boş bırakılır.

## Tasarım kuralları

- Mobil öncelikli; dokunma hedefleri en az 40–44 px. Telefonda yatay kaydırma olmamalı.
- **Her adım ekrandaki kontrollerle yapılabilmeli.** "Metni elinle kapat" gibi elle yapılacak talimat yazma; gizle/göster, sayaç, test gibi düğmeler kullan.
- Ses: `speechSynthesis` (İngilizce ses, varsayılan hız **yavaş**). Ses yoksa sayfa uyarı gösterir, metin kullanılabilir kalır. Claude uygulamasının içindeki pencerede ses çalışmıyor; site telefonun tarayıcısında açılır. Android'de Google konuşma motoruna İngilizce ses paketi gerekebilir.
- Açık/koyu tema; renkler `assets/style.css` içindeki değişkenlerden.
- İlerleme `localStorage` anahtarı `englishlearn:v1` altında: `progress` (ders/test sonuçları), `missed` (yanlış yapılan kelime/cümle sayıları), `srs` (kelime kartları), `writing` (öğrencinin yazdıkları), `settings`. Claude bunu doğrudan okuyamaz; öğrenci İlerleme sayfasındaki özeti kopyalayıp yapıştırır.
- Arayüz metinleri Türkçe ve kısa; öğrenciye "sen" diye hitap edilir.

## İş akışı

- Yeni ders: `yeni-ders` skill'i (Claude hazırlar; PDF üretimi dahil). Kelime: `kelime-ekle`. Tekrar testi: `tekrar-testi`. İlerleme özeti: `ilerleme`.
- Her veri değişikliğinden sonra `python3 tools/dogrula.py` çalıştır; hata varsa commit etme.
- JS değiştiyse sayfayı Playwright ile 390 px genişlikte açıp konsol hatası olmadığını kontrol et.
- Commit mesajları Türkçe ve kısa olabilir (ör. "Ders 2: İşim ve bir günüm").
- Site `main` dalından yayınlanır. Öğrenci ders eklendikçe `main`'in de güncellenmesine izin verdi: ders/tekrar/kelime veri değişikliklerini doğrulamadan sonra çalışma dalına push et, ardından `git push origin <çalışma-dalı>:refs/heads/main` ile `main`'i ileri sar (yalnızca fast-forward; force yok). Bu izin sadece içerik güncellemeleri içindir; site kodundaki (assets/, *.html) büyük değişiklikleri önce öğrenciye söyle.
