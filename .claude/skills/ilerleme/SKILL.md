---
name: ilerleme
description: Tamamlanan dersleri, test sonuçlarını ve zayıf noktaları Türkçe olarak özetler; plana göre neredeyiz, sonraki adım ne, söyler. "ilerlememi göster", "nasıl gidiyorum", "özet çıkar" isteklerinde ya da öğrenci İlerleme sayfasındaki özeti yapıştırdığında kullan.
---

# İlerleme özeti

Tarayıcıdaki ilerleme (`localStorage`) Claude tarafından okunamaz. İki kaynak birleştirilir:

1. **Repodaki veriler** (her zaman var):
   - `data/lessons/index.json`: kaç ders yapıldı, tarihleri, hangi hafta/konu.
   - Ders dosyalarındaki `session.results` (sohbetteki tekrar/test puanları) ve `session.watch` (zayıf noktalar).
   - `data/words.json`: toplam kelime sayısı, konulara göre dağılım.
   - `data/reviews/index.json`: yapılan planlı tekrarlar.
2. **Öğrencinin yapıştırdığı özet** (İlerleme sayfası → "Özeti kopyala"): sitede tamamlanan dersler, test puanları, en çok yanlış yapılanlar. Yapıştırılmadıysa bir kez iste: "Telefonda İlerleme sayfasını aç, 'Özeti kopyala'ya bas ve buraya yapıştır." Yoksa yalnızca repo verileriyle devam et.

## Çıktı (Türkçe, kısa, yargısız)

- **Genel durum:** kaç ders, kaç kelime, plana göre hangi hafta/aşama (`CLAUDE.md` → öğrenme planı). Ders aralarında boşluk varsa suçlamadan belirt; "sıfır gün yok" kuralını hatırlat, kısa (5–10 dk) seçeneği öner.
- **Güçlü yanlar:** yüksek puanlı testler, düzelen zayıf noktalar (önce bunu söyle).
- **Takılınanlar:** en çok yanlış yapılan 5–10 kelime/cümle, süren `session.watch` maddeleri.
- **Sıradaki adım:** bir sonraki dersin konusu, gerekiyorsa `tekrar-testi` ile hazırlanacak tekrar, ay sonuysa ses kaydı hatırlatması (kendini 2 dakika tanıtma).

Gün içi veya yolda yapılacak alıştırma önerme. Uzun tablo yerine 8–12 satırlık bir özet yeterli.

## İsteğe bağlı kayıt

Öğrenci isterse özeti ilgili dersin `session` alanına (ör. son dersin `session.watch` güncellemesi) işle, `python3 tools/dogrula.py` çalıştır, commit ve push et. Gerçek ad/şehir yazma.
