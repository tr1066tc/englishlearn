---
name: kelime-ekle
description: Kelime kütüphanesine (data/words.json) kelime ekler — Türkçe anlam, Türkçe harflerle okunuş, örnek cümle ve ders bağlantısıyla; tekrarları önler. "kelime ekle", "şu kelimeleri kütüphaneye koy", "okunuşunu yaz" isteklerinde ve yeni-ders sırasında kullan.
---

# Kütüphaneye kelime ekle

Tek kaynak `data/words.json`. Format ve okunuş kuralları `CLAUDE.md` içinde.

## Adımlar

1. Her kelimeyi küçük harfe çevirip `en` alanıyla karşılaştır. Çoğul/tekil farklı kelimeyse ayrı kayıt olur (child / children); düzenli çoğul (-s) ayrı kayıt olmaz, sadece `note`'ta belirtilir.
2. **Kelime zaten varsa:** yeni kayıt açma. Sadece ders kimliğini `lessons` listesine ekle (yoksa). Yeni bir anlam öğretildiyse `tr`'ye virgülle ekle.
3. **Yoksa** yeni kayıt:
   ```json
   { "en": "helmet", "tr": "baret", "say": "helmıt", "topic": "şantiye",
     "example": { "en": "Wear your helmet.", "tr": "Baretini tak." },
     "lessons": ["2026-11-08-ders-12"] }
   ```
   - `tr`: kısa, en yaygın anlam(lar). Türkçede birden çok karşılığı olanları yaz (uncle → amca, dayı, enişte).
   - `say`: Türkçe harflerle okunuş, `CLAUDE.md` → "Okunuş yazım kuralları". Emin değilsen Amerikan telaffuzunu esas al.
   - `topic`: mevcut konulardan birini kullan (`python3 -c "import json;print(sorted({w['topic'] for w in json.load(open('data/words.json'))}))"`). Gerçekten yeni bir alansa yeni konu aç.
   - `example`: öğrencinin hayatından, A1–A2, 4–8 kelimelik cümle; takma adlarla (Ali, Ela, Ankara, İzmir).
   - `note` (isteğe bağlı): th sesi, düzensiz çoğul, sık yapılan hata, Türkçede ayrı/İngilizcede tek kelime gibi kısa ipucu.
   - `lessons`: kelime bir derse bağlı değilse en son dersi değil, öğrencinin istediği dersi yaz; ders yoksa sor. (Doğrulayıcı boş `lessons` kabul etmez.)
4. Diziyi `en`'e göre alfabetik sırala ve kaydet (`ensure_ascii=False`, `indent=2`).
5. Kelime bir derse aitse o dersin `words.groups` listesinde de yer alsın.
6. `python3 tools/dogrula.py` çalıştır, hatasız olmalı.

Toplu eklemede küçük bir Python betiği yazmak (scratchpad'e) elle düzenlemekten güvenlidir.
