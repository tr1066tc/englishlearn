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
    const modes = { read: 'Oku ve dinle', repeat: 'Tekrar et', answer: 'Sen cevapla' };
    let mode = 'read';
    for (const [m, label] of Object.entries(modes)) {
      tabs.append(h('button', { type: 'button', role: 'tab', 'aria-selected': String(m === mode), 'data-m': m, onclick: () => { mode = m; paint(); } }, label));
    }
    function paint() {
      stop();
      tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.m === mode)));
      App.fill(body, mode === 'read' ? readMode(d) : mode === 'repeat' ? repeatMode(d) : answerMode(d));
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

  // Sen cevapla: John'un sorusu gelir, öğrenci kendi bilgisiyle yüksek sesle cevaplar, sonra örnek cevaba bakar.
  // "Tekrar et"in bir sonraki basamağı: ezberden değil, aklında arayıp üreterek.
  function answerMode(d) {
    const root = h('div');
    const items = App.dialoguePairs([d]).map(p => ({ ...p, qTr: null, prompt: 'Kendi bilginle, yüksek sesle cevap ver. Kısa olsun; sadece sorulanı söyle. Sonra örnek cevaba bak.' }));
    App.recallQuiz(root, items, {
      key, title, testName: 'answer', keepOrder: true,
      intro: 'Bu sefer ezberden değil, kendi hayatından cevap ver. Kelime aklına gelmezse önce aklında ara; bulamazsan örneğe bak.',
      revealLabel: 'Örnek cevabı göster', yesLabel: '✓ Söyleyebildim', noLabel: '✗ Takıldım',
    });
    return root;
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

  // ---------- Okuma: kısa paragraf ve beş adım ----------
  function readingSection() {
    const r = lesson.reading;
    const card = (titleText, ...body) => h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, titleText), ...body);

    // 2. Oku ve dinle (1. adım cevaplanınca açılır)
    const sel = h('div', { class: 'note', hidden: true });
    const spans = r.sentences.map(x => {
      const sp = h('span', { class: 'rs', role: 'button', tabindex: '0' }, x.en);
      sp.addEventListener('click', () => {
        spans.forEach(o => o.classList.remove('sel'));
        sp.classList.add('sel');
        App.fill(sel, h('strong', {}, 'Türkçesi: '), x.tr);
        sel.hidden = false;
        App.speak(x.en, sp);
      });
      return sp;
    });
    const para = h('p', { class: 'reading-text' }, spans.flatMap((sp, i) => i ? [' ', sp] : [sp]));
    const readBody = h('div', { hidden: !!r.gist },
      h('div', { class: 'toolbar' },
        h('button', { class: 'chip', type: 'button', onclick: () => App.speakQueue(r.sentences.map((x, i) => ({ text: x.en, el: spans[i] }))) }, '🔊 Tümünü dinle'),
        h('button', { class: 'chip', type: 'button', onclick: App.stop }, '■ Durdur')),
      r.title ? h('h3', {}, r.title) : null,
      para, sel,
      h('p', { class: 'small muted' }, 'Bir cümleye dokun: sesli okunur ve Türkçesi görünür.'),
      r.note ? h('div', { class: 'note', html: fmt(r.note) }) : null);
    const readLocked = h('p', { class: 'small muted', hidden: !r.gist }, 'Önce 1. adımı yap: metni görmeden dinle ve soruyu cevapla.');

    // 1. Önce dinle
    let step1 = null;
    if (r.gist) {
      const opts = App.shuffle(r.gist.options);
      const fb = h('div');
      const btns = opts.map(o => h('button', { class: 'option', type: 'button' }, o));
      btns.forEach(b => b.addEventListener('click', () => {
        const ok = b.textContent === r.gist.options[0];
        btns.forEach(x => { x.disabled = true; if (x.textContent === r.gist.options[0]) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        App.fill(fb, h('p', { class: ok ? 'ok-msg' : 'bad-msg' }, ok ? '✓ Doğru! Şimdi metni okuyarak dinle.' : '✗ Sorun değil. Şimdi metni okuyarak dinle, daha iyi anlayacaksın.'));
        readBody.hidden = false; readLocked.hidden = true;
      }));
      step1 = card('1. Önce dinle',
        h('p', { class: 'small' }, 'Metne bakmadan dinle. İstersen birkaç kez dinle. Sonra soruyu cevapla.'),
        h('div', { class: 'toolbar' },
          h('button', { class: 'primary', type: 'button', onclick: () => App.speakQueue(r.sentences.map(x => ({ text: x.en }))) }, '🔊 Dinle'),
          h('button', { class: 'chip', type: 'button', onclick: App.stop }, '■ Durdur')),
        h('p', { class: 'quiz-q' }, r.gist.q),
        h('div', { class: 'options' }, btns), fb);
    }

    // 3. Doğru mu, yanlış mı?
    const tfRoot = h('div');
    function tfStart(list, first) {
      const pool = App.shuffle(list);
      let i = 0, score = 0;
      const missed = [];
      const nextQ = () => {
        if (i >= pool.length) {
          if (first) App.saveTest(key, title, 'tf', score, pool.length);
          App.fill(tfRoot, h('div', { class: 'result' },
            h('p', { class: 'big' }, first ? `${score} / ${pool.length}` : (missed.length ? `${pool.length - missed.length} / ${pool.length} düzeldi.` : 'Hepsi doğru!')),
            h('div', { class: 'row' },
              missed.length ? h('button', { class: 'primary', type: 'button', onclick: () => tfStart(missed, false) }, `Yanlışları tekrar sor (${missed.length})`) : null,
              h('button', { type: 'button', onclick: () => tfStart(r.truefalse, true) }, 'Baştan başla'))));
          return;
        }
        const q = pool[i];
        const fb = h('div', { class: 'quiz-foot' });
        const answer = val => {
          const ok = val === q.answer;
          if (ok && first) score++;
          if (!ok) missed.push(q);
          [yes, no].forEach(b => { b.disabled = true; });
          (q.answer ? yes : no).classList.add('right');
          if (!ok) (val ? yes : no).classList.add('wrong');
          App.fill(fb,
            h('div', {},
              h('p', { class: ok ? 'ok-msg' : 'bad-msg' }, ok ? '✓ Doğru' : '✗ Yanlış'),
              !q.answer && q.fix ? h('p', { class: 'small' }, 'Metinde: ', h('strong', {}, q.fix)) : null),
            h('button', { class: 'primary', type: 'button', onclick: () => { i++; nextQ(); } }, i + 1 < pool.length ? 'Sonraki' : 'Sonucu gör'));
          if (!q.answer && q.fix) App.speak(q.fix);
        };
        const yes = h('button', { class: 'option', type: 'button', onclick: () => answer(true) }, '✓ Doğru');
        const no = h('button', { class: 'option', type: 'button', onclick: () => answer(false) }, '✗ Yanlış');
        App.fill(tfRoot,
          h('div', { class: 'quiz-head' }, h('span', {}, `${i + 1} / ${pool.length}`)),
          h('div', { class: 'meter' }, h('span', { style: `width:${(i / pool.length) * 100}%` })),
          h('div', { class: 'quiz-q' }, h('span', {}, q.en), listenBtn(q.en)),
          q.tr ? h('p', { class: 'tr plain small' }, q.tr) : null,
          h('div', { class: 'options two' }, yes, no), fb);
      };
      nextQ();
    }
    if (r.truefalse?.length) {
      App.fill(tfRoot, h('p', { class: 'muted' }, `${r.truefalse.length} cümle. Metne göre doğru mu, yanlış mı?`),
        h('button', { class: 'primary', type: 'button', onclick: () => tfStart(r.truefalse, true) }, 'Başlat'));
    }

    // 4. Boşlukları doldur: kelime kutucuğuna dokun, ilk boş yere yerleşir; dolu boşluğa dokununca boşalır.
    const clozeRoot = h('div');
    function clozeStart() {
      const used = r.sentences.map(() => []);
      const slots = [];
      for (const word of r.blanks || []) {
        const re = new RegExp(`(^|[^A-Za-z'])(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?=[^A-Za-z']|$)`, 'g');
        for (let si = 0; si < r.sentences.length; si++) {
          let m, hit = null;
          re.lastIndex = 0;
          while ((m = re.exec(r.sentences[si].en))) {
            const start = m.index + m[1].length, end = start + word.length;
            if (!used[si].some(u => start < u.end && end > u.start)) { hit = { start, end }; break; }
          }
          if (hit) { used[si].push({ ...hit, word }); break; }
        }
      }
      const parts = [];
      r.sentences.forEach((x, si) => {
        if (si) parts.push(' ');
        let pos = 0;
        for (const u of used[si].sort((a, b) => a.start - b.start)) {
          parts.push(x.en.slice(pos, u.start));
          const slot = h('button', { class: 'slot', type: 'button', 'aria-label': 'Boşluk' }, ' ');
          slot.dataset.answer = u.word;
          slot.addEventListener('click', () => {
            if (!slot.dataset.chip || checked) return;
            bank.querySelector(`[data-i="${slot.dataset.chip}"]`).disabled = false;
            delete slot.dataset.chip; slot.textContent = ' '; slot.classList.remove('filled');
            paintCheck();
          });
          slots.push(slot); parts.push(slot);
          pos = u.end;
        }
        parts.push(x.en.slice(pos));
      });
      let checked = false;
      const bank = h('div', { class: 'bank' });
      App.shuffle(used.flat().map(u => u.word)).forEach((w, i) => {
        const chip = h('button', { class: 'chip word-chip', type: 'button', 'data-i': String(i) }, w);
        chip.addEventListener('click', () => {
          const empty = slots.find(sl => !sl.dataset.chip);
          if (!empty || checked) return;
          empty.dataset.chip = String(i); empty.textContent = w; empty.classList.add('filled');
          chip.disabled = true;
          paintCheck();
        });
        bank.append(chip);
      });
      const checkBtn = h('button', { class: 'primary', type: 'button', disabled: true }, 'Kontrol et');
      const fb = h('div');
      const paintCheck = () => { checkBtn.disabled = slots.some(sl => !sl.dataset.chip); };
      checkBtn.addEventListener('click', () => {
        checked = true;
        let score = 0;
        for (const sl of slots) {
          const ok = sl.textContent === sl.dataset.answer;
          sl.classList.add(ok ? 'right' : 'wrong');
          if (ok) score++;
          else { App.updateState(st => { st.missed[sl.dataset.answer] = (st.missed[sl.dataset.answer] || 0) + 1; }); sl.textContent = `${sl.textContent} → ${sl.dataset.answer}`; }
        }
        App.saveTest(key, title, 'cloze', score, slots.length);
        checkBtn.disabled = true;
        App.fill(fb, h('p', { class: score === slots.length ? 'ok-msg' : 'bad-msg' }, `${score} / ${slots.length} doğru`),
          h('div', { class: 'row' },
            h('button', { type: 'button', onclick: () => App.speakQueue(r.sentences.map(x => ({ text: x.en }))) }, '🔊 Doğru metni dinle'),
            h('button', { type: 'button', onclick: clozeStart }, '↻ Yeniden dene')));
      });
      App.fill(clozeRoot,
        h('p', { class: 'small muted' }, 'Aşağıdaki kelimelere sırayla dokun, boşluklara yerleşir. Yanlış yerleştirdiğine dokunursan geri alınır.'),
        h('p', { class: 'reading-text' }, parts), bank,
        h('div', { class: 'row' }, checkBtn), fb);
    }
    if (r.blanks?.length) clozeStart();

    return h('section', {},
      step1,
      card(`${step1 ? 2 : 1}. Oku ve dinle`, readLocked, readBody),
      r.truefalse?.length ? card(`${step1 ? 3 : 2}. Doğru mu, yanlış mı?`, tfRoot) : null,
      r.blanks?.length ? card(`${step1 ? 4 : 3}. Boşlukları doldur`, clozeRoot) : null,
      r.rewrite ? card(`${step1 ? 5 : 4}. Kendi paragrafın`, r.rewrite.frames?.length
        ? h('div', {},
            App.frameBox(`${lesson.id}:cerceve`, r.rewrite.frames, { writeKey: `${lesson.id}:okuma`, copyTitle: `Ders ${lesson.number}: kendi paragrafım` }),
            h('details', {}, h('summary', { class: 'small' }, 'Örnek paragrafı göster'),
              h('div', { class: 'line-text' }, h('p', { style: 'flex:1' }, r.rewrite.model), listenBtn(r.rewrite.model))))
        : App.writingBox(`${lesson.id}:okuma`, {
            prompt: r.rewrite.prompt, model: r.rewrite.model, copyTitle: `Ders ${lesson.number} okuma: kendi paragrafım`,
          })) : null);
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
      pairs.length ? h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Diyalog testi'), dRoot) : null,
      h('a', { class: 'card lesson-link', href: 'practice.html?id=' + encodeURIComponent(lesson.id) },
        h('div', { class: 'title' }, '✍ Ekranda alıştırma çöz'),
        h('div', { class: 'muted small' }, 'Eşleştir, cümle sırala, kelimeyi yaz ve kendi cümlelerin. Her açışta farklı sorular.')));
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

  // ---------- Isınma: önceki derslerden kısa tekrar (sohbetteki 5 dakikalık tekrarın yerine) ----------
  function warmupCard() {
    const items = (lesson.warmup || []).map(x => ({ q: x.q, a: x.a, aTr: x.tr }));
    if (!items.length) return null;
    const root = h('div');
    App.recallQuiz(root, items, { key, title, testName: 'warmup', keepOrder: true, intro: 'Önce bunlarla ısın: soruyu dinle, cevabını yüksek sesle söyle, sonra cevabı aç.' });
    return h('details', { class: 'card warmup', open: !App.readState().progress[key]?.tests?.warmup },
      h('summary', {}, `🔁 Isınma (5 dk): önceki derslerden ${items.length} soru`),
      root);
  }

  // ---------- Sayfa ----------
  const sections = [
    ['kelimeler', 'Kelimeler', wordsSection],
    ['kaliplar', 'Kalıplar', patternsSection],
    ['diyalog', 'Diyalog', dialogueSection],
    lesson.reading ? ['okuma', 'Okuma', readingSection] : null,
    ['test', 'Test', testSection],
  ].filter(Boolean);
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
    warmupCard(),
    tabBar, view,
    h('div', { class: 'row', style: 'margin-top:24px' }, doneBtn,
      h('a', { class: 'btn', href: `exercises/${encodeURIComponent(lesson.id)}-alistirma.pdf`, target: '_blank', rel: 'noopener' }, '🖨 Alıştırma kağıdı (PDF)')));
  const top = document.getElementById('top');
  const fixTabs = () => { tabBar.style.top = top.offsetHeight + 'px'; };
  fixTabs();
  addEventListener('resize', fixTabs);
  show(location.hash.slice(1));
})();
