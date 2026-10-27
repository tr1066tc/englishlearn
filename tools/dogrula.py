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
