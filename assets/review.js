// Tekrar sayfası.
// review.html?id=<id> → data/reviews/<id>.json içindeki planlı tekrar testi
// review.html          → bütün derslerden karışık tekrar (önce daha önce yanlış yapılanlar)
(async () => {
  const { h, shuffle } = App;
  App.header('review');
  const main = document.getElementById('main');
  const id = App.param('id');

  let words, review, lessonIndex;
  try {
    [words, lessonIndex] = await Promise.all([App.loadWords(), App.loadLessonIndex()]);
    review = id ? await App.loadReview(id) : await randomReview();
  } catch (e) { return App.fail(main, e); }

  // Daha önce yanlış yapılanlar önce gelsin, gerisi rastgele
  function pick(list, n, textOf) {
    const missed = App.readState().missed;
    return shuffle(list)
      .map(x => ({ x, m: missed[textOf(x)] || 0 }))
      .sort((a, b) => b.m - a.m)
      .slice(0, n)
      .map(o => o.x);
  }

  async function randomReview() {
    const lessons = await Promise.all(lessonIndex.map(l => App.loadLesson(l.id)));
    const keys = [...new Set(lessons.flatMap(l => (l.words?.groups || []).flatMap(g => g.words)))];
    const phrases = [];
    for (const l of lessons) {
      for (const g of l.patterns?.groups || []) phrases.push(...g.items);
      for (const d of l.dialogues || []) phrases.push(...d.lines.filter(x => x.who === d.student).map(x => ({ en: x.en, tr: x.tr })));
    }
    const uniq = [...new Map(phrases.map(p => [p.en, p])).values()];
    return {
      id: null,
      title: 'Karışık tekrar',
      intro: 'Bütün derslerden seçildi. Daha önce yanlış yaptıkların öne alındı. Sayfayı yenileyince yeni bir set gelir.',
      words: pick(keys, 10, k => k),
      phrases: pick(uniq, 8, p => p.en),
    };
  }

  const key = review.id ? 'review:' + review.id : null;
  const title = review.title;
  document.title = title + ' · English Akşamları';
  if (key) App.markVisit(key, title);

  const chosen = (review.words || []).map(k => words.map.get(k.toLowerCase())).filter(Boolean);
  const wq = App.wordQuestions(chosen, words.list);
  const pq = (review.phrases || []).map(p => ({ q: p.tr, qSpeak: false, a: p.en, prompt: 'İngilizcesini yüksek sesle söyle, sonra cevabı aç.' }));

  const wRoot = h('div'), pRoot = h('div');
  App.mcQuiz(wRoot, wq, key && { key, title, testName: 'words' });
  App.recallQuiz(pRoot, pq, { ...(key && { key, title, testName: 'phrases' }), intro: 'Türkçeyi oku, İngilizcesini söyle.' });

  const lessonLinks = (review.lessons || []).map(lid => {
    const l = lessonIndex.find(x => x.id === lid);
    return h('a', { href: 'lesson.html?id=' + encodeURIComponent(lid), style: 'margin-right:10px' }, l ? `Ders ${l.number}` : lid);
  });

  let doneBtn = null;
  if (key) {
    const done = () => !!App.readState().progress[key]?.completed;
    doneBtn = h('button', { type: 'button' });
    const paint = () => { doneBtn.className = done() ? 'good' : 'primary'; doneBtn.textContent = done() ? '✓ Tekrar yapıldı (geri al)' : 'Tekrarı bitirdim'; };
    doneBtn.addEventListener('click', () => { App.setCompleted(key, title, !done()); paint(); });
    paint();
  }

  App.fill(main,
    review.date ? h('p', { class: 'muted small' }, App.formatDate(review.date)) : null,
    h('h1', {}, title),
    review.intro ? h('p', { class: 'muted' }, review.intro) : null,
    lessonLinks.length ? h('p', { class: 'small' }, 'Kapsadığı dersler: ', lessonLinks) : null,
    wq.length ? h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Kelimeler'), wRoot) : null,
    pq.length ? h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Cümleler'), pRoot) : null,
    doneBtn ? h('div', { class: 'row' }, doneBtn) : h('div', { class: 'row' }, h('button', { type: 'button', onclick: () => location.reload() }, '↻ Yeni karışık set')));
})();
