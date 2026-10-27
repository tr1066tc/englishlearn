// Ders sayfası: lesson.html?id=2026-10-25-ders-01
// Ders verisini data/lessons/<id>.json dosyasından, kelimeleri data/words.json dosyasından okur.
(async () => {
  const { h, fmt, listenBtn, speakQueue, stop } = App;
  App.header('lesson');
  const main = document.getElementById('main');
  const id = App.param('id');
  if (!id) { location.replace('index.html'); return; }

  let lesson, words;
  try {
    [lesson, words] = await Promise.all([App.loadLesson(id), App.loadWords()]);
  } catch (e) { return App.fail(main, e); }

  const key = 'lesson:' + lesson.id;
  const title = `Ders ${lesson.number}: ${lesson.title}`;
  document.title = title + ' · English Akşamları';
  App.markVisit(key, title);

  // ---------- Bölüm 1: Kelimeler ----------
  function wordsSection() {
    const box = h('div');
    const missing = [];
    for (const g of lesson.words?.groups || []) {
      const items = g.words.map(k => {
        const w = words.map.get(k.toLowerCase());
        if (!w) { missing.push(k); return null; }
        return h('div', { class: 'item' },
          h('div', { class: 'text' },
            h('div', {}, h('span', { class: 'en' }, w.en), ' ', h('span', { class: 'say' }, w.say)),
            h('div', { class: 'tr' }, w.tr)),
          listenBtn(w.en));
      });
      box.append(h('h3', {}, g.name), h('div', { class: 'card' }, items));
    }
    if (missing.length) console.warn('Kütüphanede olmayan kelimeler:', missing);
    const all = (lesson.words?.groups || []).flatMap(g => g.words).map(k => words.map.get(k.toLowerCase())).filter(Boolean);
    return h('section', {},
      lesson.words?.intro ? h('p', { class: 'muted small' }, lesson.words.intro) : null,
      h('div', { class: 'toolbar' },
        App.hideToggle(box),
        h('button', { class: 'chip', type: 'button', onclick: () => speakQueue(all.map(w => ({ text: w.en })))}, '🔊 Tümünü dinle'),
        h('button', { class: 'chip', type: 'button', onclick: stop }, '■ Durdur')),
      box);
  }

  // ---------- Bölüm 2: Kalıplar ----------
  function patternsSection() {
    const p = lesson.patterns || {};
    const box = h('div');
    for (const n of p.notes || []) {
      box.append(h('div', { class: 'note' }, h('div', { html: `<strong>${App.esc(n.title)}</strong>` }), h('div', { html: fmt(n.text) })));
    }
    for (const t of p.tables || []) {
      box.append(h('h3', {}, t.title),
        t.intro ? h('p', { class: 'small', html: fmt(t.intro) }) : null,
        h('div', { class: 'card table-wrap' },
          h('table', {},
            h('thead', {}, h('tr', {}, t.columns.map(c => h('th', {}, c)))),
            h('tbody', {}, t.rows.map(r => h('tr', {}, r.map((c, i) => h('td', { class: i === r.length - 1 ? 'en' : null }, c))))))));
    }
    for (const g of p.groups || []) {
      box.append(h('h3', {}, g.name), h('div', { class: 'card' },
        g.items.map(it => h('div', { class: 'item' },
          h('div', { class: 'text' }, h('div', { class: 'en' }, it.en), h('div', { class: 'tr' }, it.tr)),
          listenBtn(it.en)))));
    }
    if (p.footnote) box.append(h('p', { class: 'muted small' }, p.footnote));
    return h('section', {}, h('div', { class: 'toolbar' }, App.hideToggle(box)), box);
  }

  // ---------- Bölüm 3: Diyalog ----------
  function dialogueCard(d) {
    const body = h('div');
    const tabs = h('div', { class: 'seg', role: 'tablist' });
    const modes = { read: 'Oku ve dinle', repeat: 'Tekrar et' };
    let mode = 'read';
    for (const [m, label] of Object.entries(modes)) {
      tabs.append(h('button', { type: 'button', role: 'tab', 'aria-selected': String(m === mode), 'data-m': m, onclick: () => { mode = m; paint(); } }, label));
    }
    function paint() {
      stop();
      tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.m === mode)));
      App.fill(body, mode === 'read' ? readMode(d) : repeatMode(d));
    }
    paint();
    return h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, d.title), tabs, body);
  }

  function readMode(d) {
    const lines = d.lines.map(l => h('div', { class: 'line' + (l.who === d.student ? ' me' : '') },
      h('span', { class: 'who' }, d.speakers[l.who]),
      h('div', { class: 'text' }, h('div', { class: 'en' }, l.en), h('div', { class: 'tr' }, l.tr)),
      listenBtn(l.en)));
    const list = h('div', {}, lines);
    return h('div', {},
      h('div', { class: 'toolbar' },
        h('button', { class: 'chip', type: 'button', onclick: () => speakQueue(d.lines.map((l, i) => ({ text: l.en, el: lines[i] }))) }, '🔊 Tümünü dinle'),
        h('button', { class: 'chip', type: 'button', onclick: stop }, '■ Durdur'),
        App.hideToggle(list)),
      list);
  }

  // Öğrencinin satırları tek tek gelir; 3 kez "Söyledim" deyince sonraki cümle.
  function repeatMode(d) {
    const NEED = 3;
    const mine = d.lines.map((l, i) => ({ l, i })).filter(x => x.l.who === d.student);
    let pos = 0, count = 0;
    const root = h('div', { class: 'repeat' });
    let hideEn = false;
    function paint() {
      if (pos >= mine.length) {
        App.fill(root,
          h('p', { class: 'result big' }, 'Bitti! Bütün cümleleri ' + NEED + "'er kez söyledin."),
          h('div', { class: 'row' },
            h('button', { class: 'primary', type: 'button', onclick: () => { pos = 0; count = 0; paint(); } }, 'Baştan tekrar et')));
        return;
      }
      const { l, i } = mine[pos];
      const prev = i > 0 && d.lines[i - 1].who !== d.student ? d.lines[i - 1] : null;
      const dots = h('div', { class: 'dots', 'aria-label': `${count} / ${NEED}` },
        Array.from({ length: NEED }, (_, k) => h('span', { class: k < count ? 'on' : null })));
      const said = h('button', { class: 'primary', type: 'button' }, count + 1 < NEED ? `Söyledim (${count} / ${NEED})` : 'Söyledim, sonraki →');
      said.addEventListener('click', () => {
        count++;
        if (count >= NEED) { pos++; count = 0; }
        paint();
        if (count === 0 && pos < mine.length) playPartner();
      });
      const hideBtn = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(hideEn), onclick: () => { hideEn = !hideEn; paint(); } },
        hideEn ? 'İngilizceyi göster' : 'İngilizceyi gizle');
      const partner = prev ? h('div', { class: 'partner' },
        h('div', { class: 'line-text' }, h('span', { class: 'who' }, d.speakers[prev.who]), h('span', { class: 'en' }, prev.en), listenBtn(prev.en)),
        h('div', { class: 'tr small' }, prev.tr)) : null;
      root.className = 'repeat' + (hideEn ? ' hide-en' : '');
      App.fill(root,
        h('div', { class: 'quiz-head' }, h('span', {}, `Cümle ${pos + 1} / ${mine.length}`), hideBtn),
        h('div', { class: 'meter' }, h('span', { style: `width:${(pos / mine.length) * 100}%` })),
        partner,
        h('div', { class: 'mine' },
          h('div', { class: 'line-text' }, h('span', { class: 'en en-hideable' }, l.en), listenBtn(l.en)),
          h('div', { class: 'tr small' }, l.tr)),
        h('p', { class: 'muted small' }, hideEn ? 'Türkçeye bakıp İngilizcesini söyle. Bulanık yazıya dokunursan açılır.' : 'Önce dinle, sonra yüksek sesle söyle ve düğmeye bas.'),
        dots,
        h('div', { class: 'row' }, said,
          pos > 0 || count > 0 ? h('button', { type: 'button', onclick: () => { if (count > 0) count = 0; else pos--; paint(); } }, '← Geri') : null));
    }
    root.addEventListener('click', e => {
      const t = e.target.closest('.en-hideable');
      if (t) t.classList.toggle('revealed');
    });
    function playPartner() {
      const { i } = mine[pos];
      const prev = i > 0 && d.lines[i - 1].who !== d.student ? d.lines[i - 1] : null;
      if (prev) App.speak(prev.en);
    }
    paint();
    return h('div', {},
      h('p', { class: 'muted small' }, `Sen ${d.speakers[d.student]} rolündesin. Her cümleyi ${NEED} kez yüksek sesle söyle.`),
      h('div', { class: 'row' }, h('button', { class: 'chip', type: 'button', onclick: playPartner }, '🔊 Karşı tarafı dinle')),
      root);
  }

  function dialogueSection() {
    return h('section', {}, (lesson.dialogues || []).map(dialogueCard));
  }

  // ---------- Bölüm 4: Test ----------
  function testSection() {
    const wq = lesson.tests?.words || [];
    const pairs = App.dialoguePairs(lesson.dialogues);
    const wRoot = h('div'), dRoot = h('div');
    App.mcQuiz(wRoot, wq, { key, title, testName: 'words' });
    App.recallQuiz(dRoot, pairs, { key, title, testName: 'dialogue', intro: 'Soruyu dinle, cevabını yüksek sesle söyle, sonra cevabı aç.' });
    return h('section', {},
      wq.length ? h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Kelime testi'), wRoot) : null,
      pairs.length ? h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Diyalog testi'), dRoot) : null);
  }

  // ---------- Bölüm 5: Notlar (düzeltmeler, sohbet sonuçları) ----------
  function notesSection() {
    const c = lesson.corrections, s = lesson.session;
    const out = h('section');
    if (c) {
      out.append(h('div', { class: 'card' },
        h('h2', { style: 'margin-top:0' }, 'Tanıtım metnin ve düzeltmeler'),
        c.intro ? h('p', { class: 'muted small' }, c.intro) : null,
        c.original ? h('details', {}, h('summary', {}, 'İlk yazdığın metin'), h('p', { class: 'small' }, c.original)) : null,
        h('div', {}, (c.items || []).map(it => h('div', { class: 'item' },
          h('div', { class: 'text' },
            h('div', {}, h('s', { class: 'muted' }, it.wrong), ' → ', h('span', { class: 'en' }, it.right)),
            it.note ? h('div', { class: 'small muted' }, it.note) : null)))),
        c.corrected ? h('div', {},
          h('h3', {}, 'Düzeltilmiş metin'),
          h('div', { class: 'line-text' }, h('p', { style: 'flex:1' }, c.corrected), listenBtn(c.corrected))) : null));
    }
    if (s) {
      out.append(h('div', { class: 'card' },
        h('h2', { style: 'margin-top:0' }, 'Sohbetteki ders'),
        s.intro ? h('p', { class: 'muted small' }, s.intro) : null,
        (s.results || []).map(r => h('div', { class: 'item' },
          h('div', { class: 'text' }, h('div', {}, h('strong', {}, r.step), ' — ', r.score), r.note ? h('div', { class: 'small muted' }, r.note) : null))),
        s.watch?.length ? h('div', {}, h('h3', {}, 'Dikkat edilecekler'), h('ul', {}, s.watch.map(w => h('li', {}, w)))) : null));
    }
    return out;
  }

  // ---------- Sayfa ----------
  const sections = [
    ['kelimeler', 'Kelimeler', wordsSection],
    ['kaliplar', 'Kalıplar', patternsSection],
    ['diyalog', 'Diyalog', dialogueSection],
    ['test', 'Test', testSection],
  ];
  if (lesson.corrections || lesson.session) sections.push(['notlar', 'Notlar', notesSection]);

  const built = {};
  const view = h('div');
  const tabBar = h('div', { class: 'tabs', role: 'tablist' });
  function show(slug) {
    stop();
    if (!sections.some(s => s[0] === slug)) slug = sections[0][0];
    tabBar.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.s === slug)));
    built[slug] ||= sections.find(s => s[0] === slug)[2]();
    App.fill(view, built[slug]);
    tabBar.querySelector(`[data-s="${slug}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    history.replaceState(null, '', '#' + slug);
  }
  sections.forEach(([slug, label], n) => tabBar.append(
    h('button', { type: 'button', role: 'tab', 'data-s': slug, onclick: () => { show(slug); window.scrollTo({ top: 0 }); } }, `${n + 1}. ${label}`)));

  const done = () => !!App.readState().progress[key]?.completed;
  const doneBtn = h('button', { type: 'button' });
  const paintDone = () => {
    doneBtn.className = done() ? 'good' : 'primary';
    doneBtn.textContent = done() ? '✓ Ders tamamlandı (geri al)' : 'Dersi tamamladım';
  };
  doneBtn.addEventListener('click', () => { App.setCompleted(key, title, !done()); paintDone(); });
  paintDone();

  App.fill(main,
    h('p', { class: 'muted small' }, App.formatDate(lesson.date), ` · ${lesson.week}. hafta: ${lesson.topic}`),
    h('h1', {}, title),
    lesson.summary ? h('p', { class: 'muted' }, lesson.summary) : null,
    tabBar, view,
    h('div', { class: 'row', style: 'margin-top:24px' }, doneBtn,
      h('a', { class: 'btn', href: `exercises/${encodeURIComponent(lesson.id)}-alistirma.pdf`, target: '_blank', rel: 'noopener' }, '🖨 Alıştırma kağıdı (PDF)')));
  const top = document.getElementById('top');
  const fixTabs = () => { tabBar.style.top = top.offsetHeight + 'px'; };
  fixTabs();
  addEventListener('resize', fixTabs);
  show(location.hash.slice(1));
})();
