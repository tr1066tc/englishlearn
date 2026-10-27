#!/usr/bin/env node
// Ders verisinden yazıcıdan çıktı alınabilir alıştırma kağıdı ve cevap anahtarı (PDF) üretir.
//
//   node tools/alistirma.js 2026-10-27-ders-02      # tek ders
//   node tools/alistirma.js --all                   # bütün dersler
//
// Çıktı: exercises/<ders-id>-alistirma.pdf ve exercises/<ders-id>-cevaplar.pdf
// Playwright (Chromium) gerekir. Aynı ders için çıktı her seferinde aynı sorulardan oluşur (tohumlu rastgelelik).
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'exercises');
const PROPER = new Set(['Ali', 'John', 'Ela', 'Ankara', 'İzmir']);

const readJSON = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- tohumlu rastgelelik ----------
function rng(seedText) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) { h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const letter = i => String.fromCharCode(65 + i);
const lower = i => String.fromCharCode(97 + i);

// ---------- içerik seçimi ----------
function build(lesson, wordMap) {
  const rand = rng(lesson.id);
  const lessonWords = [...new Set((lesson.words?.groups || []).flatMap(g => g.words))]
    .map(k => wordMap.get(k.toLowerCase())).filter(Boolean)
    .filter(w => w.en.split(' ').length <= 3 && w.en.length <= 24);
  const pool = shuffled(lessonWords, rand);
  const matchWords = pool.slice(0, Math.min(10, pool.length));
  const rest = pool.slice(matchWords.length);
  const writeWords = (rest.length >= 8 ? rest : pool).slice(0, Math.min(8, pool.length));

  // A: eşleştirme
  const rightOrder = shuffled(matchWords, rand);
  const match = {
    left: matchWords.map(w => w.tr),
    right: rightOrder.map(w => w.en),
    answers: matchWords.map(w => letter(rightOrder.indexOf(w))),
  };

  // B: çoktan seçmeli (boşluklu cümleler ve diğer sorular)
  const mcSource = (lesson.tests?.words || []);
  const cloze = mcSource.filter(q => q.q.includes('___'));
  const others = mcSource.filter(q => !q.q.includes('___') && /\?|nasıl/.test(q.q));
  const mc = shuffled([...cloze, ...others], rand).slice(0, 8).map(q => {
    const opts = shuffled(q.options, rand);
    return { q: q.q, opts, answer: lower(opts.indexOf(q.options[0])), answerText: q.options[0] };
  });

  // C: Türkçesini İngilizce yaz
  const write = writeWords.map(w => ({ tr: w.tr, en: w.en }));

  // D: cümle sırala
  const sentences = [...new Set((lesson.patterns?.groups || []).flatMap(g => g.items.map(i => i.en)))]
    .filter(s => { const n = s.split(' ').length; return n >= 4 && n <= 9; });
  const scramble = shuffled(sentences, rand).slice(0, 5).map(s => {
    const last = s.slice(-1);
    const punct = /[.?!]/.test(last) ? last : '';
    const tokens = (punct ? s.slice(0, -1) : s).split(' ').map((t, i) => {
      if (i === 0 && t !== 'I' && !/^I'/.test(t) && !PROPER.has(t.replace(/[^\p{L}]/gu, ''))) return t[0].toLowerCase() + t.slice(1);
      return t;
    });
    let mix = shuffled(tokens, rand);
    for (let k = 0; k < 10 && mix.join(' ') === tokens.join(' '); k++) mix = shuffled(tokens, rand);
    return { chips: mix, answer: s };
  });

  // E: diyalog tamamla, F: söyleme çizelgesi
  const dialogues = (lesson.dialogues || []).map(d => ({
    title: d.title,
    lines: d.lines.map(l => ({ who: d.speakers[l.who], mine: l.who === d.student, en: l.en, tr: l.tr })),
  }));

  // G: kendi cümlelerin
  const wg = lesson.exercises?.write;
  const groups = lesson.patterns?.groups || [];
  const model = wg || (groups[1] ? { title: groups[1].name, models: groups[1].items.slice(0, 3).map(i => i.en) } : null);

  return { match, mc, write, scramble, dialogues, model };
}

// ---------- HTML ----------
const CSS = `
@page { size: A4; margin: 13mm 14mm 16mm; }
* { box-sizing: border-box; }
body { font: 11.5pt/1.35 "Liberation Sans", "DejaVu Sans", Arial, sans-serif; color: #111; margin: 0; }
h1 { font-size: 17pt; margin: 0 0 2mm; }
.sub { color: #444; margin: 0 0 3mm; font-size: 10.5pt; }
.meta { display: flex; gap: 8mm; margin: 2mm 0 5mm; font-size: 10.5pt; }
.meta span { flex: 1; border-bottom: 1px solid #111; padding-bottom: 1mm; }
section { margin: 0 0 7mm; break-inside: avoid; }
section.flow { break-inside: auto; }
h2 { font-size: 12.5pt; margin: 0 0 1.5mm; display: flex; align-items: center; gap: 2.5mm; }
h2 b { display: inline-flex; width: 7mm; height: 7mm; border-radius: 50%; background: #111; color: #fff; align-items: center; justify-content: center; font-size: 11pt; flex: none; }
.how { margin: 0 0 3mm; color: #333; font-size: 10.5pt; }
.cols { display: flex; justify-content: space-between; gap: 14mm; }
.cols > div { flex: 1; }
.mrow { display: flex; align-items: center; gap: 3mm; height: 8.5mm; }
.mrow .box { width: 9mm; height: 7mm; border: 1.2px solid #111; border-radius: 1.5mm; flex: none; }
.mrow .n { width: 5mm; text-align: right; color: #444; flex: none; }
.rrow { height: 8.5mm; display: flex; align-items: center; gap: 3mm; }
.rrow .l { width: 5mm; font-weight: bold; }
.q { margin: 0 0 3.2mm; break-inside: avoid; }
.q .opts { margin-top: 1mm; display: flex; flex-wrap: wrap; gap: 2mm 7mm; padding-left: 6mm; }
.q .opts span b { margin-right: 1mm; }
.wline { display: flex; align-items: flex-end; gap: 3mm; height: 10mm; }
.wline .n { width: 5mm; text-align: right; color: #444; flex: none; }
.wline .tr { width: 52mm; flex: none; }
.wline .fill { flex: 1; border-bottom: 1px solid #111; height: 7mm; }
.wline .hint { width: 22mm; flex: none; color: #888; }
.chips { display: flex; flex-wrap: wrap; gap: 2mm; margin: 1mm 0 1mm 6mm; }
.chip { border: 1.2px solid #111; border-radius: 2mm; padding: 0.8mm 2.6mm; }
.sl { border-bottom: 1px solid #111; height: 8mm; margin: 0 0 0 6mm; }
.dl { margin: 0 0 3mm; break-inside: avoid; }
.dl .john { font-weight: bold; }
.dl .hint { color: #555; font-style: italic; font-size: 10pt; margin: 0.5mm 0 0 6mm; }
.dl .me { display: flex; align-items: flex-end; gap: 2mm; height: 8mm; }
.dl .me .who { width: 12mm; flex: none; color: #444; font-size: 10pt; }
.dl .me .fill { flex: 1; border-bottom: 1px solid #111; height: 7mm; }
.dl .me .ans { flex: 1; border-bottom: 1px solid #aaa; padding-bottom: 0.5mm; }
.say { display: flex; align-items: center; gap: 4mm; margin: 0 0 2.4mm; break-inside: avoid; }
.say .t { flex: 1; }
.say .cb { display: flex; gap: 2mm; flex: none; }
.say .cb i { width: 5.5mm; height: 5.5mm; border: 1.2px solid #111; border-radius: 1mm; display: block; }
.models { background: #f1f1f1; border-radius: 2mm; padding: 2.5mm 4mm; margin: 0 0 2mm; }
.models div { margin: 0.6mm 0; }
.key p { margin: 0 0 1mm; }
.grid { display: flex; flex-wrap: wrap; gap: 1.5mm 8mm; }
.grid > span b { margin-right: 1mm; }
.note { color: #555; font-size: 9.5pt; }
`;

function head(lesson, titleSuffix, sub) {
  return `<h1>Ders ${lesson.number}: ${esc(lesson.title)}</h1>
  <p class="sub">${esc(titleSuffix)}${sub ? ' · ' + esc(sub) : ''}</p>`;
}
const sec = (letterMark, title, how, body, cls = '') =>
  `<section class="${cls}"><h2><b>${letterMark}</b>${esc(title)}</h2>${how ? `<p class="how">${how}</p>` : ''}${body}</section>`;

function worksheetHTML(lesson, x) {
  const parts = [];
  parts.push(head(lesson, 'Alıştırma kağıdı', `${lesson.date.split('-').reverse().join('.')} · ${lesson.week}. hafta: ${lesson.topic}`));
  parts.push(`<div class="meta"><span>Tarih:</span><span>Süre: ______ dk</span><span>Puan: ____ / ____</span></div>`);

  if (x.match.left.length) {
    const left = x.match.left.map((t, i) => `<div class="mrow"><span class="n">${i + 1}.</span><span class="box"></span><span>${esc(t)}</span></div>`).join('');
    const right = x.match.right.map((t, i) => `<div class="rrow"><span class="l">${letter(i)}</span><span>${esc(t)}</span></div>`).join('');
    parts.push(sec('A', 'Eşleştir', 'Türkçe kelimenin İngilizcesini bul. Kutuya doğru harfi yaz.', `<div class="cols"><div>${left}</div><div>${right}</div></div>`));
  }
  if (x.mc.length) {
    const qs = x.mc.map((q, i) => `<div class="q"><div>${i + 1}. ${esc(q.q)}</div><div class="opts">${q.opts.map((o, k) => `<span><b>${lower(k)})</b>${esc(o)}</span>`).join('')}</div></div>`).join('');
    parts.push(sec('B', 'Doğru şıkkı daire içine al', 'Boşluğa uyan ya da soruya cevap olan şıkkı seç.', qs, 'flow'));
  }
  if (x.write.length) {
    const hint = en => en.split(' ').map(w => w[0] + '…').join(' ');
    const rows = x.write.map((w, i) => `<div class="wline"><span class="n">${i + 1}.</span><span class="tr">${esc(w.tr)}</span><span class="hint">${esc(hint(w.en))}</span><span class="fill"></span></div>`).join('');
    parts.push(sec('C', 'Türkçesini İngilizce yaz', 'Her kelimenin ilk harfi verildi. Gerisini sen yaz.', rows));
  }
  if (x.scramble.length) {
    const rows = x.scramble.map((s, i) => `<div class="q"><div>${i + 1}.</div><div class="chips">${s.chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div><div class="sl"></div></div>`).join('');
    parts.push(sec('D', 'Cümleyi doğru sırala', 'Kutulardaki kelimelerle doğru cümleyi çizgiye yaz. Cümlenin sonuna nokta ya da soru işareti koy.', rows, 'flow'));
  }
  x.dialogues.forEach((d, di) => {
    const rows = d.lines.map(l => l.mine
      ? `<div class="dl"><div class="hint">${esc(l.tr)}</div><div class="me"><span class="who">${esc(l.who)}:</span><span class="fill"></span></div></div>`
      : `<div class="dl"><div class="john">${esc(l.who)}: ${esc(l.en)}</div></div>`).join('');
    parts.push(sec(di === 0 ? 'E' : 'E' + (di + 1), `Diyaloğu tamamla: ${d.title}`, 'Sen Ali\'sin. Türkçe ipucuna bakıp cevabını İngilizce yaz.', rows, 'flow'));
  });
  const mine = x.dialogues.flatMap(d => d.lines.filter(l => l.mine));
  if (mine.length) {
    const rows = mine.map(l => `<div class="say"><span class="t"><b>${esc(l.en)}</b><br><span class="note">${esc(l.tr)}</span></span><span class="cb"><i></i><i></i><i></i></span></div>`).join('');
    parts.push(sec('F', 'Yüksek sesle söyle', 'Her cümleyi 3 kez yüksek sesle söyle. Her söyleyişte bir kutuyu işaretle.', rows, 'flow'));
  }
  if (x.model) {
    const models = x.model.models.map(m => `<div>• ${esc(m)}</div>`).join('');
    const lines = Array.from({ length: 5 }, () => '<div class="sl" style="margin-left:0"></div>').join('');
    parts.push(sec('G', x.model.title ? `Kendi cümlelerin: ${x.model.title}` : 'Kendi cümlelerin', 'Örneklere bak. Kendi hayatından 5 cümle yaz. Sonra yüksek sesle oku.', `<div class="models">${models}</div>${lines}`));
  }
  return parts.join('\n');
}

function keyHTML(lesson, x) {
  const parts = [];
  parts.push(head(lesson, 'Cevap anahtarı', 'Önce kendin yap, sonra kontrol et'));
  const grid = items => `<div class="grid">${items.join('')}</div>`;
  if (x.match.left.length) parts.push(sec('A', 'Eşleştir', '', grid(x.match.left.map((t, i) => `<span><b>${i + 1}.</b>${x.match.answers[i]} <span class="note">(${esc(t)} = ${esc(x.match.right[x.match.answers[i].charCodeAt(0) - 65])})</span></span>`))));
  if (x.mc.length) parts.push(sec('B', 'Doğru şıkkı seç', '', grid(x.mc.map((q, i) => `<span><b>${i + 1}.</b>${q.answer}) ${esc(q.answerText)}</span>`))));
  if (x.write.length) parts.push(sec('C', 'Türkçesini İngilizce yaz', '', grid(x.write.map((w, i) => `<span><b>${i + 1}.</b>${esc(w.en)}</span>`))));
  if (x.scramble.length) parts.push(sec('D', 'Cümleyi sırala', '', x.scramble.map((s, i) => `<p><b>${i + 1}.</b> ${esc(s.answer)}</p>`).join(''), 'key'));
  x.dialogues.forEach((d, di) => {
    const rows = d.lines.map(l => l.mine
      ? `<div class="dl"><div class="me"><span class="who">${esc(l.who)}:</span><span class="ans"><b>${esc(l.en)}</b></span></div></div>`
      : `<div class="dl"><div class="john">${esc(l.who)}: ${esc(l.en)}</div></div>`).join('');
    parts.push(sec(di === 0 ? 'E' : 'E' + (di + 1), `Diyalog: ${d.title}`, '', rows, 'flow'));
  });
  parts.push(sec('G', 'Kendi cümlelerin', '', '<p>Tek bir doğru cevap yok. Cümlenin yapısına bak: özne + fiil + tamamlayıcı. Emin olmadığın cümleyi bir sonraki derste Claude\'a göster.</p>'));
  return parts.join('\n');
}

const page = (title, body) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}</body></html>`;

async function main() {
  const args = process.argv.slice(2);
  const index = readJSON('data/lessons/index.json');
  const ids = args.includes('--all') ? index.map(e => e.id) : args.filter(a => !a.startsWith('--'));
  if (!ids.length) { console.error('Kullanım: node tools/alistirma.js <ders-id> | --all'); process.exit(2); }
  const words = readJSON('data/words.json');
  const wordMap = new Map(words.map(w => [w.en.toLowerCase(), w]));
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  for (const id of ids) {
    if (!index.some(e => e.id === id)) { console.error('Ders bulunamadı:', id); process.exitCode = 1; continue; }
    const lesson = readJSON(`data/lessons/${id}.json`);
    const x = build(lesson, wordMap);
    for (const [kind, name, html] of [
      ['Alıştırma', 'alistirma', worksheetHTML(lesson, x)],
      ['Cevap anahtarı', 'cevaplar', keyHTML(lesson, x)],
    ]) {
      const p = await ctx.newPage();
      await p.setContent(page(`Ders ${lesson.number} ${kind}`, html), { waitUntil: 'load' });
      const footer = `<div style="width:100%;font-size:8px;color:#666;text-align:center;font-family:Arial,sans-serif">English Akşamları · Ders ${lesson.number} · ${kind} · sayfa <span class="pageNumber"></span> / <span class="totalPages"></span></div>`;
      const file = path.join(OUT, `${id}-${name}.pdf`);
      await p.pdf({ path: file, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: footer, margin: { top: '13mm', bottom: '16mm', left: '14mm', right: '14mm' } });
      await p.close();
      console.log('yazıldı:', path.relative(ROOT, file));
    }
  }
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
