// Ekranda alıştırma: practice.html?id=<ders-id>
// Kağıttaki alıştırmalardan sitede olmayan üçü (eşleştir, cümle sırala, yaz) ve kendi cümlelerin.
// Sorular her açılışta karışık seçilir; sonuçlar ders kaydına ve "takıldıkların" listesine işlenir.
(async () => {
  const { h, listenBtn, shuffle } = App;
  App.header('exercises');
  const main = document.getElementById('main');
  const id = App.param('id');
  if (!id) { location.replace('exercises.html'); return; }
  let lesson, words;
  try { [lesson, words] = await Promise.all([App.loadLesson(id), App.loadWords()]); } catch (e) { return App.fail(main, e); }

  const key = 'lesson:' + lesson.id;
  const title = `Ders ${lesson.number}: ${lesson.title}`;
  document.title = 'Alıştırma · ' + title;
  const PROPER = new Set(['I', 'Ali', 'John', 'Ela', 'Ankara', 'İzmir']);
  const lessonWords = [...new Set((lesson.words?.groups || []).flatMap(g => g.words))]
    .map(k => words.map.get(k.toLowerCase())).filter(Boolean);
  const missed = text => App.updateState(st => { st.missed[text] = (st.missed[text] || 0) + 1; });
  const card = (t, ...body) => h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, t), ...body);
  const startScreen = (root, text, start) => App.fill(root, h('p', { class: 'muted' }, text), h('button', { class: 'primary', type: 'button', onclick: start }, 'Başlat'));
  const result = (root, score, total, extra, again) => App.fill(root, h('div', { class: 'result' },
    h('p', { class: 'big' }, `${score} / ${total}`), extra,
    h('div', { class: 'row' }, h('button', { class: 'primary', type: 'button', onclick: again }, '↻ Yeni set'))));

  // ---------- A. Eşleştir ----------
  const matchRoot = h('div');
  function matchStart() {
    const set = shuffle(lessonWords.filter(w => w.en.length <= 24)).slice(0, 6);
    let errors = 0, done = 0, picked = null;
    const pairOf = new Map();
    const mk = (w, side) => {
      const b = h('button', { class: 'option match', type: 'button' }, side === 'tr' ? w.tr : w.en);
      pairOf.set(b, { w, side });
      b.addEventListener('click', () => {
        if (b.disabled) return;
        if (!picked || pairOf.get(picked).side === side) {
          picked?.classList.remove('picked');
          picked = b; b.classList.add('picked');
          return;
        }
        const a = pairOf.get(picked).w;
        const other = picked;
        picked = null; other.classList.remove('picked');
        if (a === w) {
          [b, other].forEach(x => { x.disabled = true; x.classList.add('right'); });
          App.speak(w.en);
          if (++done === set.length) {
            const score = Math.max(0, set.length - errors);
            App.saveTest(key, title, 'match', score, set.length);
            setTimeout(() => result(matchRoot, score, set.length, h('p', { class: 'muted' }, errors ? `${errors} yanlış eşleştirme yaptın.` : 'Hiç hata yok!'), matchStart), 700);
          }
        } else {
          errors++;
          const trWord = side === 'tr' ? w : a;
          missed(trWord.en);
          [b, other].forEach(x => { x.classList.add('wrong'); setTimeout(() => x.classList.remove('wrong'), 600); });
        }
      });
      return b;
    };
    App.fill(matchRoot,
      h('p', { class: 'small muted' }, 'Bir Türkçe kelimeye, sonra onun İngilizcesine dokun.'),
      h('div', { class: 'match-grid' },
        h('div', { class: 'options' }, shuffle(set).map(w => mk(w, 'tr'))),
        h('div', { class: 'options' }, shuffle(set).map(w => mk(w, 'en')))));
  }
  startScreen(matchRoot, '6 kelime. Türkçesini İngilizcesiyle eşleştir.', matchStart);

  // ---------- B. Cümle sırala ----------
  const orderRoot = h('div');
  const sentenceSource = [...new Map([
    ...(lesson.patterns?.groups || []).flatMap(g => g.items),
    ...(lesson.reading?.sentences || []),
  ].map(x => [x.en, x])).values()].filter(x => { const n = x.en.split(' ').length; return n >= 4 && n <= 10; });
  function orderStart() {
    const pool = shuffle(sentenceSource).slice(0, 5);
    let i = 0, score = 0;
    const nextQ = () => {
      if (i >= pool.length) {
        App.saveTest(key, title, 'order', score, pool.length);
        return result(orderRoot, score, pool.length, null, orderStart);
      }
      const s = pool[i];
      const punct = /[.?!]$/.test(s.en) ? s.en.slice(-1) : '';
      const target = (punct ? s.en.slice(0, -1) : s.en).split(' ').map((t, k) =>
        k === 0 && !PROPER.has(t.replace(/[^\p{L}]/gu, '')) && !/^I'/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);
      let mix = shuffle(target.map((t, k) => ({ t, k })));
      for (let n = 0; n < 10 && mix.every((m, k) => m.t === target[k]); n++) mix = shuffle(mix);
      const answer = h('div', { class: 'answer-line' });
      const bank = h('div', { class: 'bank' });
      const fb = h('div');
      const chips = mix.map(m => {
        const c = h('button', { class: 'chip word-chip', type: 'button' }, m.t);
        c.addEventListener('click', () => {
          if (fb.childNodes.length) return;
          (c.parentNode === bank ? answer : bank).append(c);
          if (!bank.childNodes.length) check();
        });
        return c;
      });
      bank.append(...chips);
      function check() {
        const got = [...answer.childNodes].map(c => c.textContent);
        const ok = got.join(' ') === target.join(' ');
        if (ok) score++; else missed(s.en);
        answer.classList.add(ok ? 'right' : 'wrong');
        App.speak(s.en);
        App.fill(fb,
          h('p', { class: ok ? 'ok-msg' : 'bad-msg' }, ok ? '✓ Doğru' : '✗ Doğrusu:'),
          ok ? null : h('p', {}, h('strong', {}, s.en)),
          h('p', { class: 'tr plain small' }, s.tr),
          h('div', { class: 'row' }, h('button', { class: 'primary', type: 'button', onclick: () => { i++; nextQ(); } }, i + 1 < pool.length ? 'Sonraki' : 'Sonucu gör')));
      }
      App.fill(orderRoot,
        h('div', { class: 'quiz-head' }, h('span', {}, `${i + 1} / ${pool.length}`),
          h('button', { class: 'chip', type: 'button', onclick: () => { if (!fb.childNodes.length) bank.append(...chips); } }, 'Temizle')),
        h('div', { class: 'meter' }, h('span', { style: `width:${(i / pool.length) * 100}%` })),
        h('p', { class: 'small muted' }, `Türkçesi: ${s.tr}`),
        answer, bank,
        h('p', { class: 'small muted' }, 'Kelimelere doğru sırayla dokun. Yanlış seçtiğine dokunursan geri gider.' + (punct ? ` Sonundaki "${punct}" kendiliğinden eklenir.` : '')),
        fb);
    };
    nextQ();
  }
  startScreen(orderRoot, sentenceSource.length ? '5 cümle. Karışık kelimelerden doğru cümleyi kur.' : 'Bu derste sıralanacak cümle yok.', orderStart);

  // ---------- C. Kelimeyi yaz ----------
  const spellRoot = h('div');
  const norm = t => t.toLowerCase().replace(/[’`]/g, "'").replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim();
  function dist(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return d[a.length][b.length];
  }
  function spellStart() {
    const pool = shuffle(lessonWords.filter(w => w.en.split(' ').length <= 3)).slice(0, 8);
    let i = 0, score = 0;
    const nextQ = () => {
      if (i >= pool.length) {
        App.saveTest(key, title, 'spell', score, pool.length);
        return result(spellRoot, score, pool.length, null, spellStart);
      }
      const w = pool[i];
      const hint = w.en.split(' ').map(x => x[0] + ' _'.repeat(x.length - 1)).join('   ');
      const input = h('input', { class: 'search spell', type: 'text', autocomplete: 'off', autocapitalize: 'none', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'İngilizcesini yaz' });
      const fb = h('div');
      const checkBtn = h('button', { class: 'primary', type: 'button' }, 'Kontrol et');
      const check = () => {
        if (fb.childNodes.length || !input.value.trim()) return;
        const got = norm(input.value), want = norm(w.en);
        const ok = got === want;
        const near = !ok && want.length > 3 && dist(got, want) === 1;
        if (ok) score++; else missed(w.en);
        input.disabled = true; checkBtn.disabled = true;
        input.classList.add(ok ? 'right' : 'wrong');
        App.speak(w.en);
        App.fill(fb,
          h('p', { class: ok ? 'ok-msg' : 'bad-msg' }, ok ? '✓ Doğru' : near ? '≈ Neredeyse! Doğrusu:' : '✗ Doğrusu:'),
          ok ? null : h('p', { class: 'big-word', style: 'font-size:1.4rem;font-weight:700' }, w.en),
          h('p', { class: 'say' }, `okunuşu: ${w.say}`),
          h('div', { class: 'row' }, h('button', { class: 'primary', type: 'button', onclick: () => { i++; nextQ(); } }, i + 1 < pool.length ? 'Sonraki' : 'Sonucu gör')));
      };
      checkBtn.addEventListener('click', check);
      input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
      App.fill(spellRoot,
        h('div', { class: 'quiz-head' }, h('span', {}, `${i + 1} / ${pool.length}`)),
        h('div', { class: 'meter' }, h('span', { style: `width:${(i / pool.length) * 100}%` })),
        h('p', { class: 'quiz-q' }, w.tr),
        h('p', { class: 'hint-letters' }, hint),
        input,
        h('div', { class: 'row' }, checkBtn,
          h('button', { class: 'chip', type: 'button', onclick: () => App.speak(w.en) }, '🔊 İpucu: dinle')),
        fb);
      input.focus();
    };
    nextQ();
  }
  startScreen(spellRoot, '8 kelime. Türkçesine bak, İngilizcesini yaz. İlk harf ve harf sayısı verilir.', spellStart);

  // ---------- D. Kendi cümlelerin ----------
  const wg = lesson.exercises?.write;
  const groups = lesson.patterns?.groups || [];
  const models = wg?.models || (groups[1] || groups[0])?.items.slice(0, 3).map(x => x.en) || [];

  App.fill(main,
    h('p', { class: 'muted small' }, h('a', { href: 'exercises.html' }, '← Alıştırmalar'), ' · ', h('a', { href: 'lesson.html?id=' + encodeURIComponent(lesson.id) }, 'Dersi aç')),
    h('h1', {}, `Ders ${lesson.number}: ekranda alıştırma`),
    h('p', { class: 'muted' }, 'Kısa alıştırmalar. Yorgunsan sadece birini yap; "Cümle sırala" en hızlısı.'),
    card('A. Eşleştir', matchRoot),
    card('B. Cümle sırala', orderRoot),
    card('C. Kelimeyi yaz', spellRoot),
    card('D. Kendi cümlelerin', lesson.reading?.rewrite?.frames?.length
      ? h('div', {},
          App.frameBox(`${lesson.id}:cerceve`, lesson.reading.rewrite.frames, { writeKey: `${lesson.id}:okuma`, copyTitle: `Ders ${lesson.number}: kendi cümlelerim` }),
          h('details', {}, h('summary', { class: 'small' }, 'Serbest yaz (istersen)'),
            App.writingBox(`${lesson.id}:cumleler`, { prompt: 'İstersen kendi cümlelerini serbestçe yaz.', models, copyTitle: `Ders ${lesson.number}: serbest cümlelerim` })))
      : App.writingBox(`${lesson.id}:cumleler`, {
          prompt: wg?.title ? `${wg.title}. Örneklere bak, kendi hayatından 5 cümle yaz.` : 'Örneklere bak, kendi hayatından 5 cümle yaz.',
          models, copyTitle: `Ders ${lesson.number}: kendi cümlelerim`,
        })));
})();
