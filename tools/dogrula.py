#!/usr/bin/env python3
"""Veri dosyalarını denetler. Kullanım: python3 tools/dogrula.py

Kontroller:
- JSON dosyaları okunabiliyor mu
- data/words.json: zorunlu alanlar, tekrar eden kelime yok, ders bağlantıları geçerli
- data/lessons/index.json ile ders dosyaları birbirini tutuyor mu
- Derslerde geçen her kelime kütüphanede var mı ve kelimenin "lessons" listesinde o ders var mı
- Testlerde 4 şık var mı, şıklar tekrar etmiyor mu
- Diyalog satırlarındaki konuşmacılar tanımlı mı
- data/reviews: kelimeler kütüphanede var mı, dersler mevcut mu
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
errors, warnings = [], []


def load(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        errors.append(f"{path.relative_to(ROOT)}: okunamadı ({e})")
        return None


words = load(DATA / "words.json") or []
by_key = {}
for i, w in enumerate(words):
    where = f"words.json[{i}] {w.get('en', '?')!r}"
    for field in ("en", "tr", "say", "topic", "lessons"):
        if not w.get(field):
            errors.append(f"{where}: '{field}' eksik")
    if "example" in w and not (w["example"].get("en") and w["example"].get("tr")):
        errors.append(f"{where}: örnek cümlede en/tr eksik")
    if "example" not in w:
        warnings.append(f"{where}: örnek cümle yok")
    k = w.get("en", "").strip().lower()
    if k in by_key:
        errors.append(f"{where}: kütüphanede iki kez var")
    by_key[k] = w

index = load(DATA / "lessons" / "index.json") or []
ids = set()
for entry in index:
    lid = entry.get("id")
    if lid in ids:
        errors.append(f"lessons/index.json: {lid} iki kez listelenmiş")
    ids.add(lid)
    path = DATA / "lessons" / f"{lid}.json"
    if not path.exists():
        errors.append(f"lessons/index.json: {lid} için dosya yok")
        continue
    lesson = load(path)
    if not lesson:
        continue
    for field in ("id", "number", "date", "week", "topic", "title"):
        if lesson.get(field) != entry.get(field):
            errors.append(f"{lid}: '{field}' index.json ile aynı değil")
    for kind in ("alistirma", "cevaplar"):
        if not (ROOT / "exercises" / f"{lid}-{kind}.pdf").exists():
            errors.append(f"{lid}: exercises/{lid}-{kind}.pdf yok (node tools/alistirma.js {lid})")
    if not lid.startswith(lesson.get("date", "")):
        errors.append(f"{lid}: dosya adı tarihle başlamıyor")

    for g in lesson.get("words", {}).get("groups", []):
        for k in g.get("words", []):
            w = by_key.get(k.lower())
            if not w:
                errors.append(f"{lid}: '{k}' kelimesi words.json içinde yok")
            elif lid not in w.get("lessons", []):
                errors.append(f"{lid}: '{k}' kelimesinin lessons listesinde bu ders yok")

    for q in lesson.get("tests", {}).get("words", []):
        opts = q.get("options", [])
        if len(opts) != 4:
            errors.append(f"{lid}: '{q.get('q')}' sorusunda {len(opts)} şık var (4 olmalı)")
        if len(set(opts)) != len(opts):
            errors.append(f"{lid}: '{q.get('q')}' sorusunda aynı şık iki kez var")

    for d in lesson.get("dialogues", []):
        sp = d.get("speakers", {})
        if d.get("student") not in sp:
            errors.append(f"{lid}: '{d.get('title')}' diyaloğunda student tanımsız")
        for n, line in enumerate(d.get("lines", [])):
            if line.get("who") not in sp:
                errors.append(f"{lid}: '{d.get('title')}' satır {n + 1}: konuşmacı tanımsız")
            if not (line.get("en") and line.get("tr")):
                errors.append(f"{lid}: '{d.get('title')}' satır {n + 1}: en/tr eksik")

    for n, q in enumerate(lesson.get("warmup", [])):
        if not (q.get("q") and q.get("a")):
            errors.append(f"{lid}: ısınma sorusu {n + 1}: q/a eksik")
    r = lesson.get("reading")
    if not r:
        warnings.append(f"{lid}: okuma paragrafı (reading) yok")
    else:
        sents = r.get("sentences", [])
        if not (4 <= len(sents) <= 12):
            warnings.append(f"{lid}: okuma {len(sents)} cümle (4–12 olmalı)")
        for n, x in enumerate(sents):
            if not (x.get("en") and x.get("tr")):
                errors.append(f"{lid}: okuma cümle {n + 1}: en/tr eksik")
        text = " ".join(x.get("en", "") for x in sents)
        for w in r.get("blanks", []):
            if not re.search(rf"(^|[^A-Za-z']){re.escape(w)}(?=[^A-Za-z']|$)", text):
                errors.append(f"{lid}: okuma boşluğu '{w}' metinde geçmiyor")
        if len(set(r.get("blanks", []))) != len(r.get("blanks", [])):
            errors.append(f"{lid}: okuma boşluklarında aynı kelime iki kez var")
        for q in r.get("truefalse", []):
            if not isinstance(q.get("answer"), bool) or not q.get("en"):
                errors.append(f"{lid}: doğru/yanlış sorusu eksik: {q.get('en')!r}")
            if q.get("answer") is False and not q.get("fix"):
                warnings.append(f"{lid}: yanlış cümle için 'fix' (metindeki doğrusu) yok: {q.get('en')!r}")
        g = r.get("gist")
        if g and len(g.get("options", [])) != 4:
            errors.append(f"{lid}: okuma 'gist' sorusunda 4 şık olmalı")

# Ders metinlerinde geçen her içerik kelimesi kütüphanede olmalı (öğrencinin isteği).
STOP = set("""i you he she it we they me him her us them my your his its our their a an the is am are be was were
and but or not don't doesn't isn't aren't can't do does did to of in on at for from with by as than this that
these those there here what where when how which who that's let's i'm you're he's she's it's what's they're
yes no any some many much lot every too very one two three four five six seven eight nine ten eleven twelve
forty forty-one ali john ela ankara izmir""".split())
IRREG = {"has": "have", "goes": "go", "children": "child", "grandchildren": "grandchild", "passed": "pass", "dealing": "deal"}
lib = set(by_key)
for w in words:
    lib.update(w.get("en", "").lower().replace("-", " ").split())
def known_word(t):
    t = IRREG.get(t, t)
    cands = {t, t[:-1], t[:-2], t[:-3] + "y", t[:-2] + "e" if t.endswith("ed") else t, t[:-3], t[:-3] + "e"}
    if t.endswith("'s"):
        cands.add(t[:-2])
    return any(c in lib or c in STOP for c in cands if c)
for entry in index:
    path = DATA / "lessons" / f"{entry.get('id')}.json"
    if not path.exists():
        continue
    lesson = json.loads(path.read_text(encoding="utf-8"))
    texts = [i["en"] for g in lesson.get("patterns", {}).get("groups", []) for i in g.get("items", [])]
    texts += [l["en"] for d in lesson.get("dialogues", []) for l in d.get("lines", [])]
    texts += [x["en"] for x in (lesson.get("reading") or {}).get("sentences", [])]
    texts += [x[k] for x in lesson.get("warmup", []) for k in ("q", "a")]
    missing = sorted({t for txt in texts for t in re.findall(r"[a-z'-]+", txt.replace("İ", "I").lower().replace("’", "'")) if not known_word(t.strip("'-"))})
    if missing:
        warnings.append(f"{entry.get('id')}: metinde geçip kütüphanede olmayan kelimeler: {', '.join(missing)}")

for path in sorted((DATA / "lessons").glob("*.json")):
    if path.name != "index.json" and path.stem not in ids:
        errors.append(f"lessons/{path.name}: index.json içinde listelenmemiş")

for w in words:
    for lid in w.get("lessons", []):
        if lid not in ids:
            errors.append(f"words.json '{w.get('en')}': bilinmeyen ders {lid}")

rindex = load(DATA / "reviews" / "index.json") or []
rids = set()
for entry in rindex:
    rid = entry.get("id")
    rids.add(rid)
    path = DATA / "reviews" / f"{rid}.json"
    if not path.exists():
        errors.append(f"reviews/index.json: {rid} için dosya yok")
        continue
    review = load(path) or {}
    for k in review.get("words", []):
        if k.lower() not in by_key:
            errors.append(f"{rid}: '{k}' kelimesi words.json içinde yok")
    for lid in review.get("lessons", []):
        if lid not in ids:
            errors.append(f"{rid}: bilinmeyen ders {lid}")
    for p in review.get("phrases", []):
        if not (p.get("en") and p.get("tr")):
            errors.append(f"{rid}: cümlede en/tr eksik")
for path in sorted((DATA / "reviews").glob("*.json")):
    if path.name != "index.json" and path.stem not in rids:
        errors.append(f"reviews/{path.name}: index.json içinde listelenmemiş")

for w in warnings:
    print("UYARI:", w)
for e in errors:
    print("HATA:", e)
print(f"{len(words)} kelime, {len(ids)} ders, {len(rids)} tekrar testi. {len(errors)} hata, {len(warnings)} uyarı.")
sys.exit(1 if errors else 0)
