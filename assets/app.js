// Ortak yardımcılar: veri yükleme, ilerleme kaydı, ses, tema, üst menü ve testler.
// Tüm sayfalar bu dosyayı yükler; sayfaya özel kod ayrı dosyalardadır.
const App = (() => {
  const STORE_KEY = 'englishlearn:v1';

  // ---------- DOM yardımcıları ----------
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  // **kalın** yazımını destekleyen basit biçimlendirme
  function fmt(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(c));
    }
    return el;
  }
  // replaceChildren gibi, ama dizileri açar ve null/false değerleri atlar
  function fill(el, ...children) {
    el.replaceChildren(...children.flat(Infinity).filter(c => c != null && c !== false));
    return el;
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function param(name) {
    return new URLSearchParams(location.search).get(name);
  }
  function formatDate(iso, withDay = true) {
    const d = new Date(iso + 'T12:00:00');
    const opts = { day: 'numeric', month: 'long', year: 'numeric' };
    if (withDay) opts.weekday = 'long';
    return d.toLocaleDateString('tr-TR', opts);
  }

  // ---------- Veri ----------
  const cache = {};
  async function getJSON(path) {
    if (!cache[path]) {
      cache[path] = fetch(path, { cache: 'no-cache' }).then(r => {
        if (!r.ok) throw new Error(path + ' yüklenemedi (' + r.status + ')');
        return r.json();
      });
    }
    return cache[path];
  }
  const loadLessonIndex = () => getJSON('data/lessons/index.json');
  const loadLesson = id => getJSON('data/lessons/' + encodeURIComponent(id) + '.json');
  const loadReviewIndex = () => getJSON('data/reviews/index.json');
  const loadReview = id => getJSON('data/reviews/' + encodeURIComponent(id) + '.json');
  async function loadWords() {
    const list = await getJSON('data/words.json');
    const map = new Map(list.map(w => [w.en.toLowerCase(), w]));
    return { list, map };
  }

  // ---------- İlerleme (localStorage) ----------
  function readState() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { s = {}; }
    s.progress ||= {};
    s.missed ||= {};
    s.settings ||= {};
    return s;
  }
  function writeState(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* depolama kapalıysa sessizce geç */ }
  }
  function updateState(fn) {
    const s = readState();
    fn(s);
    writeState(s);
    return s;
  }
  function entry(s, key, title) {
    s.progress[key] ||= { tests: {} };
    if (title) s.progress[key].title = title;
    return s.progress[key];
  }
  function markVisit(key, title) {
    updateState(s => { entry(s, key, title).lastVisit = new Date().toISOString(); });
  }
  function setCompleted(key, title, done) {
    updateState(s => {
      const e = entry(s, key, title);
      e.completed = done;
      e.completedAt = done ? new Date().toISOString() : null;
    });
  }
  function saveTest(key, title, testName, score, total) {
    updateState(s => {
      const t = entry(s, key, title).tests;
      const prev = t[testName] || {};
      t[testName] = {
        score, total, at: new Date().toISOString(),
        best: Math.max(prev.best ?? 0, score),
        tries: (prev.tries ?? 0) + 1,
      };
    });
  }
  function noteMissed(text) {
    updateState(s => { s.missed[text] = (s.missed[text] || 0) + 1; });
  }

  // ---------- Ayarlar: hız ve tema ----------
  const RATES = { slow: 0.7, normal: 0.95 };
  function speed() { return readState().settings.speed || 'slow'; }
  function setSpeed(v) { updateState(s => { s.settings.speed = v; }); }
  function applyTheme() {
    const t = readState().settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  }
  function cycleTheme() {
    const order = ['auto', 'light', 'dark'];
    const cur = readState().settings.theme || 'auto';
    const next = order[(order.indexOf(cur) + 1) % order.length];
    updateState(s => { s.settings.theme = next; });
    applyTheme();
    return next;
  }

  // ---------- Ses (Web Speech API) ----------
  const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let voice = null;
  let voicesReady = false;
  function pickVoice() {
    if (!speechSupported) return;
    const vs = speechSynthesis.getVoices();
    if (!vs.length) return;
    voicesReady = true;
    const en = vs.filter(v => /^en[-_]/i.test(v.lang) || v.lang.toLowerCase() === 'en');
    voice = en.find(v => /en[-_]US/i.test(v.lang) && /google|samantha|natural/i.test(v.name))
      || en.find(v => /en[-_]US/i.test(v.lang))
      || en.find(v => /en[-_]GB/i.test(v.lang))
      || en[0] || null;
  }
  if (speechSupported) {
    pickVoice();
    speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
  }

  let queueToken = 0;
  function stop() {
    queueToken++;
    if (speechSupported) speechSynthesis.cancel();
    document.querySelectorAll('.playing').forEach(el => el.classList.remove('playing'));
  }
  function speakOne(text, token) {
    return new Promise(resolve => {
      if (!speechSupported || token !== queueToken) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = voice?.lang || 'en-US';
      if (voice) u.voice = voice;
      u.rate = RATES[speed()] || RATES.slow;
      u.onend = u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  }
  // Tek metin okur. Önceki okumayı keser.
  function speak(text, el) {
    stop();
    const token = queueToken;
    el?.classList.add('playing');
    // Bazı Chrome sürümleri cancel() sonrası hemen speak() çağrısını yutuyor; kısa gecikme
    return new Promise(r => setTimeout(r, 60))
      .then(() => speakOne(text, token))
      .finally(() => el?.classList.remove('playing'));
  }
  // Sırayla okur: items = [{text, el}]
  async function speakQueue(items) {
    stop();
    const token = queueToken;
    await new Promise(r => setTimeout(r, 60));
    for (const it of items) {
      if (token !== queueToken) return;
      it.el?.classList.add('playing');
      it.el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      await speakOne(it.text, token);
      it.el?.classList.remove('playing');
      await new Promise(r => setTimeout(r, 350));
    }
  }
  function listenBtn(text, label = 'Dinle') {
    const b = h('button', { class: 'listen', type: 'button', 'aria-label': label + ': ' + text, title: label },
      h('span', { 'aria-hidden': 'true' }, '🔊'));
    b.addEventListener('click', e => { e.stopPropagation(); speak(text, b); });
    return b;
  }

  // ---------- Üst menü ----------
  function header(active) {
    applyTheme();
    const el = document.getElementById('top');
    if (!el) return;
    const link = (href, text, key) => h('a', { href, class: active === key ? 'active' : null }, text);
    const speedBtn = h('button', { class: 'chip', type: 'button' });
    const paintSpeed = () => {
      speedBtn.textContent = speed() === 'slow' ? '🐢 Yavaş' : '▶ Normal';
      speedBtn.setAttribute('aria-label', 'Ses hızı: ' + (speed() === 'slow' ? 'yavaş' : 'normal') + '. Değiştirmek için dokun.');
    };
    paintSpeed();
    speedBtn.addEventListener('click', () => { setSpeed(speed() === 'slow' ? 'normal' : 'slow'); paintSpeed(); });
    const themeIcon = { auto: '🌓', light: '☀️', dark: '🌙' };
    const themeBtn = h('button', { class: 'chip icon', type: 'button', title: 'Tema' });
    const paintTheme = t => { themeBtn.textContent = themeIcon[t]; themeBtn.setAttribute('aria-label', 'Tema: ' + ({ auto: 'otomatik', light: 'açık', dark: 'koyu' })[t]); };
    paintTheme(readState().settings.theme || 'auto');
    themeBtn.addEventListener('click', () => paintTheme(cycleTheme()));
    el.append(
      h('div', { class: 'bar' },
        h('a', { href: 'index.html', class: 'brand' }, 'English ', h('span', {}, 'Akşamları')),
        h('div', { class: 'tools' }, speedBtn, themeBtn)),
      h('nav', { class: 'nav' },
        link('index.html', 'Dersler', 'home'),
        link('words.html', 'Kelimeler', 'words'),
        link('review.html', 'Tekrar', 'review'),
        link('exercises.html', 'Alıştırma', 'exercises'),
        link('progress.html', 'İlerleme', 'progress')),
    );
    el.after(voiceWarning());
  }

  function voiceWarning() {
    const box = h('div', { class: 'notice', hidden: true, role: 'status' });
    const show = msg => { box.innerHTML = msg; box.hidden = false; };
    if (!speechSupported) {
      show('<strong>Ses bu tarayıcıda çalışmıyor.</strong> Metinlerin hepsi yine kullanılabilir. Sesi duymak için sayfayı telefonun kendi tarayıcısında (Chrome veya Safari) açın; uygulama içi pencereler sesi engelliyor.');
      return box;
    }
    // Sesler geç yüklenebilir; biraz bekleyip İngilizce ses var mı bak
    setTimeout(() => {
      pickVoice();
      if (voicesReady && !voice) {
        show('<strong>İngilizce ses bulunamadı.</strong> Android\'de: Ayarlar → Erişilebilirlik (veya Sistem → Dil) → Metin okuma çıkışı → Google konuşma motoru → İngilizce ses verisini yükleyin. Metinler bu arada kullanılabilir.');
      }
    }, 1800);
    return box;
  }

  function fail(container, err) {
    console.error(err);
    const local = location.protocol === 'file:';
    fill(container, h('div', { class: 'card error' },
      h('p', {}, h('strong', {}, 'İçerik yüklenemedi.')),
      h('p', {}, local
        ? 'Sayfa dosyadan açılmış. Veriler ancak bir sunucu üzerinden okunabiliyor: GitHub Pages adresini kullanın veya klasörde "python3 -m http.server" çalıştırın.'
        : String(err.message || err))));
  }

  // ---------- Türkçeyi gizle ----------
  // Kapsayıcıya "hide-tr" sınıfı eklenince .tr öğeleri bulanıklaşır; dokununca açılır.
  function hideToggle(container, label = 'Türkçeyi gizle') {
    const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': 'false' }, label);
    b.addEventListener('click', () => {
      const on = container.classList.toggle('hide-tr');
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? label.replace('gizle', 'göster') : label;
      container.querySelectorAll('.revealed').forEach(x => x.classList.remove('revealed'));
    });
    container.addEventListener('click', e => {
      const t = e.target.closest('.tr, .en-hideable');
      if (t && container.contains(t)) t.classList.toggle('revealed');
    });
    return b;
  }

  // ---------- Testler ----------
  function scoreText(score, total) {
    const pct = total ? score / total : 0;
    const msg = pct === 1 ? 'Harika, hepsi doğru!' : pct >= 0.7 ? 'Çok iyi gidiyorsun.' : pct >= 0.4 ? 'Fena değil, yanlışları bir daha deneyelim.' : 'Sorun değil, tekrar ede ede oturacak.';
    return `${score} / ${total} — ${msg}`;
  }

  // Çoktan seçmeli test. items: [{q, options: [doğru, ...yanlışlar], say?}]
  // opts: {key, title, testName}
  function mcQuiz(root, items, opts) {
    let pool, idx, wrong, firstRound, firstScore;
    function start(list, first) {
      pool = shuffle(list).map(it => ({ ...it, shown: shuffle(it.options) }));
      idx = 0; wrong = []; firstRound = first; firstScore = 0;
      next();
    }
    function next() {
      if (idx >= pool.length) return finish();
      const it = pool[idx];
      const answer = it.options[0];
      const btns = it.shown.map(o => h('button', { class: 'option', type: 'button' }, o));
      const foot = h('div', { class: 'quiz-foot' });
      let answered = false;
      btns.forEach(b => b.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const ok = b.textContent === answer;
        btns.forEach(x => {
          x.disabled = true;
          if (x.textContent === answer) x.classList.add('right');
        });
        if (!ok) { b.classList.add('wrong'); wrong.push(it); noteMissed(answer); }
        else if (firstRound) firstScore++;
        const sentence = it.q.includes('___') ? it.q.replace('___', answer) : answer;
        speak(sentence);
        fill(foot,
          h('p', { class: ok ? 'ok-msg' : 'bad-msg' }, ok ? '✓ Doğru' : '✗ Doğrusu: ' + answer),
          h('button', { class: 'primary', type: 'button', onclick: () => { idx++; next(); } }, idx + 1 < pool.length ? 'Sonraki' : 'Sonucu gör'));
      }));
      fill(root,
        h('div', { class: 'quiz-head' }, h('span', {}, `${idx + 1} / ${pool.length}`), firstRound ? null : h('span', { class: 'tag' }, 'Yanlışlar')),
        h('div', { class: 'meter' }, h('span', { style: `width:${(idx / pool.length) * 100}%` })),
        h('p', { class: 'quiz-q' }, it.q),
        it.hint ? h('p', { class: 'muted small' }, it.hint) : null,
        h('div', { class: 'options' }, btns),
        foot);
    }
    function finish() {
      if (firstRound && opts?.key) saveTest(opts.key, opts.title, opts.testName, firstScore, pool.length);
      const missed = wrong.slice();
      fill(root,
        h('div', { class: 'result' },
          h('p', { class: 'big' }, firstRound ? scoreText(firstScore, pool.length) : (missed.length ? `${pool.length - missed.length} / ${pool.length} düzeldi.` : 'Yanlışların hepsi düzeldi!')),
          missed.length ? h('p', { class: 'muted' }, 'Yanlış yapılanlar: ' + missed.map(m => m.options[0]).join(', ')) : null,
          h('div', { class: 'row' },
            missed.length ? h('button', { class: 'primary', type: 'button', onclick: () => start(missed, false) }, `Sadece yanlışları sor (${missed.length})`) : null,
            h('button', { type: 'button', onclick: () => start(items, true) }, 'Baştan başla'))));
    }
    fill(root,
      h('p', { class: 'muted' }, `${items.length} soru. Doğru şıkka dokun; cevap sesli okunur.`),
      h('button', { class: 'primary', type: 'button', onclick: () => start(items, true) }, 'Testi başlat'));
  }

  // Hatırlama testi: soru görünür, cevap gizli. items: [{q, qTr?, a, aTr?, qSpeak?: bool}]
  function recallQuiz(root, items, opts) {
    let pool, idx, missed, firstRound, firstScore;
    function start(list, first) {
      pool = opts?.keepOrder ? list.slice() : shuffle(list);
      idx = 0; missed = []; firstRound = first; firstScore = 0;
      next();
    }
    function next() {
      if (idx >= pool.length) return finish();
      const it = pool[idx];
      const qSpeak = it.qSpeak !== false;
      const answerBox = h('div', { class: 'answer', hidden: true },
        h('div', { class: 'line-text' }, h('span', { class: 'en' }, it.a), listenBtn(it.a)),
        it.aTr ? h('div', { class: 'tr plain' }, it.aTr) : null);
      const foot = h('div', { class: 'row' });
      const reveal = h('button', { class: 'primary', type: 'button' }, 'Cevabı göster');
      reveal.addEventListener('click', () => {
        answerBox.hidden = false;
        speak(it.a);
        fill(foot,
          h('button', { class: 'good', type: 'button', onclick: () => grade(true) }, '✓ Bildim'),
          h('button', { class: 'bad', type: 'button', onclick: () => grade(false) }, '✗ Bilemedim'));
      });
      foot.append(reveal);
      function grade(ok) {
        if (ok && firstRound) firstScore++;
        if (!ok) { missed.push(it); noteMissed(it.a); }
        idx++; next();
      }
      fill(root,
        h('div', { class: 'quiz-head' }, h('span', {}, `${idx + 1} / ${pool.length}`), firstRound ? null : h('span', { class: 'tag' }, 'Bilemediklerin')),
        h('div', { class: 'meter' }, h('span', { style: `width:${(idx / pool.length) * 100}%` })),
        h('div', { class: 'quiz-q' },
          it.who ? h('span', { class: 'who' }, it.who) : null,
          h('span', {}, it.q), qSpeak ? listenBtn(it.q) : null),
        it.qTr ? h('p', { class: 'tr plain' }, it.qTr) : null,
        it.prompt ? h('p', { class: 'muted small' }, it.prompt) : null,
        answerBox, foot);
      if (qSpeak) speak(it.q);
    }
    function finish() {
      if (firstRound && opts?.key) saveTest(opts.key, opts.title, opts.testName, firstScore, pool.length);
      const list = missed.slice();
      fill(root,
        h('div', { class: 'result' },
          h('p', { class: 'big' }, firstRound ? scoreText(firstScore, pool.length) : (list.length ? `${pool.length - list.length} / ${pool.length} bu sefer bilindi.` : 'Hepsini bildin!')),
          h('div', { class: 'row' },
            list.length ? h('button', { class: 'primary', type: 'button', onclick: () => start(list, false) }, `Bilemediklerimi sor (${list.length})`) : null,
            h('button', { type: 'button', onclick: () => start(items, true) }, 'Baştan başla'))));
    }
    fill(root,
      h('p', { class: 'muted' }, `${items.length} soru. ${opts?.intro || 'Önce kendin söyle, sonra cevabı aç.'}`),
      h('button', { class: 'primary', type: 'button', onclick: () => start(items, true) }, 'Testi başlat'));
  }

  // Bir kelime listesinden çoktan seçmeli soru üretir (Türkçe → İngilizce).
  // Yanlış şıklar önce aynı konudan seçilir.
  function wordQuestions(words, allWords) {
    return words.map(w => {
      const same = shuffle(allWords.filter(x => x.en !== w.en && x.topic === w.topic));
      const other = shuffle(allWords.filter(x => x.en !== w.en && x.topic !== w.topic));
      const wrong = [...new Set([...same, ...other].map(x => x.en))].filter(e => e !== w.en).slice(0, 3);
      return { q: w.tr, options: [w.en, ...wrong] };
    }).filter(q => q.options.length >= 2);
  }

  // Bir derste "benim" satırlarını ve kalıpları hatırlama sorusuna çevirir.
  function dialoguePairs(dialogues) {
    const out = [];
    for (const d of dialogues || []) {
      for (let i = 1; i < d.lines.length; i++) {
        const a = d.lines[i - 1], b = d.lines[i];
        if (a.who !== d.student && b.who === d.student) {
          out.push({ who: d.speakers[a.who], q: a.en, qTr: a.tr, a: b.en, aTr: b.tr });
        }
      }
    }
    return out;
  }

  // ---------- Test adları (ana sayfa ve ilerleme için) ----------
  const TEST_NAMES = {
    words: 'Kelime testi', dialogue: 'Diyalog testi', phrases: 'Cümle testi',
    tf: 'Okuma: doğru/yanlış', cloze: 'Okuma: boşluk', match: 'Eşleştir', order: 'Cümle sırala', spell: 'Yaz',
  };
  const testLabel = n => TEST_NAMES[n] || n;

  // ---------- Öğrencinin yazdıkları ----------
  // Anahtar: "<ders-id>:okuma" (kendi paragrafı) veya "<ders-id>:cumleler" (kendi cümleleri)
  function getWriting(key) { return readState().writing?.[key] || ''; }
  function setWriting(key, text) {
    updateState(s => {
      s.writing ||= {};
      if (text.trim()) s.writing[key] = text; else delete s.writing[key];
    });
  }
  async function copyText(text, btn) {
    const label = btn.textContent;
    try { await navigator.clipboard.writeText(text); }
    catch {
      const t = h('textarea', { style: 'position:fixed;opacity:0' }); t.value = text;
      document.body.append(t); t.select(); try { document.execCommand('copy'); } catch { /* yok */ } t.remove();
    }
    btn.textContent = '✓ Kopyalandı';
    setTimeout(() => { btn.textContent = label; }, 2000);
  }
  // Kendi metnini yazma kutusu: yazdıkça bu telefona kaydedilir, "Claude'a kopyala" ile derse getirilir.
  function writingBox(key, { prompt, models, model, copyTitle }) {
    const ta = h('textarea', { class: 'write-box', rows: 7, placeholder: 'Buraya İngilizce yaz…', autocapitalize: 'sentences', spellcheck: 'false' });
    ta.value = getWriting(key);
    const status = h('span', { class: 'small muted' }, ta.value ? 'Kaydedildi.' : '');
    let t = null;
    ta.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { setWriting(key, ta.value); status.textContent = 'Kaydedildi.'; }, 400);
    });
    const copy = h('button', { class: 'primary', type: 'button' }, "Claude'a kopyala");
    copy.addEventListener('click', () => {
      setWriting(key, ta.value);
      copyText(`${copyTitle}:\n${ta.value.trim()}`, copy);
    });
    return h('div', {},
      prompt ? h('p', { class: 'small' }, prompt) : null,
      models?.length ? h('div', { class: 'models' }, models.map(m => h('div', { class: 'line-text' }, h('span', { class: 'en', style: 'font-weight:500' }, '• ' + m), listenBtn(m)))) : null,
      ta,
      h('div', { class: 'row', style: 'align-items:center' }, copy, status),
      model ? h('details', {}, h('summary', { class: 'small' }, 'Örnek metni göster'),
        h('div', { class: 'line-text' }, h('p', { style: 'flex:1' }, model), listenBtn(model))) : null,
      h('p', { class: 'small muted' }, "Yazdığın bu telefonda saklanır. Kopyalayıp bir sonraki derste Claude'a yapıştır, birlikte düzeltelim."));
  }

  return {
    TEST_NAMES, testLabel, getWriting, setWriting, copyText, writingBox,
    esc, fmt, h, fill, shuffle, param, formatDate,
    loadLessonIndex, loadLesson, loadReviewIndex, loadReview, loadWords,
    readState, writeState, updateState, markVisit, setCompleted, saveTest,
    speak, speakQueue, stop, listenBtn, speechSupported,
    header, fail, hideToggle, mcQuiz, recallQuiz, wordQuestions, dialoguePairs,
  };
})();
