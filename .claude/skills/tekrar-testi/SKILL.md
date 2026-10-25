---
name: tekrar-testi
description: Geçmiş derslerin kelime ve kalıplarından karışık bir tekrar testi sayfası üretir (aralıklı tekrar, unutmaya karşı). "tekrar testi hazırla", "haftalık tekrar", "izin günü tekrarı", "unuttuklarımı sor" isteklerinde kullan.
---

# Tekrar testi üret

Sitede `review.html` zaten her açılışta rastgele bir karışık tekrar sunuyor. Bu skill **planlı** bir tekrar hazırlar: hangi derslerin, hangi kelime ve cümlelerin tekrar edileceğini aralıklı tekrar mantığıyla seçer ve `data/reviews/` altına kaydeder.

## 1. Kaynakları oku

- `data/lessons/index.json` ve ders dosyaları: kelime grupları, `patterns.groups[].items`, diyaloglarda öğrencinin satırları, `session.watch`.
- `data/reviews/index.json`: önceki tekrarlar (aynı içeriği art arda verme).
- Öğrenci İlerleme sayfasındaki özeti yapıştırdıysa: "En çok yanlış yapılanlar" listesi ve düşük test puanlı dersler. **Bunlar önceliklidir.** Yapıştırmadıysa isteğe bağlı olarak iste, ama bekleme.

## 2. Seç (aralıklı tekrar)

Bugünden geriye bakarak dersleri aralıklara göre seç: **1, 3, 7, 14, 30 gün önce** yapılan dersler (±1 gün). Haftalık tekrar (izin günü) istendiyse o haftanın bütün derslerini al.

- **words:** 10–15 kelime anahtarı (`words.json`'daki `en`). Önce yanlış yapılanlar, sonra seçilen derslerin kelimeleri; en az 2 tanesi eski bir dersten olsun.
- **phrases:** 6–10 cümle `{en, tr}`. Kalıplardan ve diyaloglardaki öğrenci satırlarından; `session.watch` zayıf noktalarını mutlaka kat (ör. How old are you? → I'm forty-one years old.).
- Kısa versiyon istenirse (yorgun gün): 6 kelime + 4 cümle.

## 3. Yaz

`data/reviews/<YYYY-MM-DD>-tekrar-NN.json`:
```json
{
  "id": "2026-11-01-tekrar-01",
  "date": "2026-11-01",
  "title": "1. hafta tekrarı: Ben ve ailem",
  "intro": "Bu haftanın kelime ve kalıpları. Önce kelimeler, sonra cümleler.",
  "lessons": ["2026-10-25-ders-01"],
  "words": ["grandmother", "uncle"],
  "phrases": [ { "en": "I miss my family.", "tr": "Ailemi özlüyorum." } ]
}
```
`data/reviews/index.json` dizisine `{ "id", "date", "title" }` ekle. Kelime soruları ve yanlış şıklar sayfada otomatik üretilir.

## 4. Denetle ve gönder

`python3 tools/dogrula.py` hatasız olmalı. Commit ("Tekrar: <başlık>") ve push. Öğrenciye bağlantıyı ver: `review.html?id=<id>`.
