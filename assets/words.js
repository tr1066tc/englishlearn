// Kelime kütüphanesi: arama, konuya göre filtre, dinle, okunuş, ders bağlantısı.
(async () => {
  const { h, listenBtn } = App;
  App.header('words');
  const main = document.getElementById('main');
  let words, lessons;
  try {
    [words, lessons] = await Promise.all([App.loadWords(), App.loadLessonIndex()]);
  } catch (e) { return App.fail(main, e); }

  const lessonById = new Map(lessons.map(l => [l.id, l]));
  const topics = [...new Set(words.list.map(w => w.topic))].sort((a, b) => a.localeCompare(b, 'tr'));
  const cap = s => s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
  const norm = s => s.toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');

  let topic = App.param('konu') || '';
  let query = '';
  const list = h('div');
  const count = h('p', { class: 'muted small' });
  const search = h('input', { class: 'search', type: 'search', placeholder: 'Ara: İngilizce, Türkçe veya okunuş', 'aria-label': 'Kelime ara', autocomplete: 'off' });
  search.addEventListener('input', () => { query = search.value; paint(); });

  const chips = h('div', { class: 'chips' });
  const chipFor = (val, label) => {
    const b = h('button', { class: 'chip', type: 'button', 'aria-pressed': String(topic === val) }, label);
    b.addEventListener('click', () => {
      topic = val;
      chips.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      paint();
    });
    return b;
  };
  chips.append(chipFor('', 'Tümü'), ...topics.map(t => chipFor(t, cap(t))));

  function card(w) {
    return h('div', { class: 'card word' },
      h('div', { class: 'head' },
        h('div', { class: 'text' },
          h('div', { class: 'en' }, w.en),
          h('div', { class: 'say' }, 'okunuşu: ', w.say),
          h('div', { class: 'tr' }, w.tr)),
        listenBtn(w.en)),
      w.note ? h('p', { class: 'small muted' }, w.note) : null,
      w.example ? h('div', { class: 'example' },
        h('div', { class: 'text' }, h('div', {}, w.example.en), h('div', { class: 'tr small' }, w.example.tr)),
        listenBtn(w.example.en, 'Örneği dinle')) : null,
      h('div', { class: 'links' },
        h('span', { class: 'tag' }, cap(w.topic)), ' ',
        (w.lessons || []).map(id => {
          const l = lessonById.get(id);
          return h('a', { href: 'lesson.html?id=' + encodeURIComponent(id) + '#kelimeler', style: 'margin-right:10px' }, l ? `Ders ${l.number}` : id);
        })));
  }

  function paint() {
    const q = norm(query.trim());
    const shown = words.list
      .filter(w => !topic || w.topic === topic)
      .filter(w => !q || [w.en, w.tr, w.say].some(x => norm(x).includes(q)))
      .sort((a, b) => a.en.localeCompare(b.en, 'en'));
    count.textContent = `${shown.length} kelime`;
    App.fill(list, ...(shown.length ? shown.map(card) : [h('p', { class: 'muted' }, 'Eşleşen kelime yok.')]));
  }

  App.fill(main,
    h('h1', {}, 'Kelime kütüphanesi'),
    h('p', { class: 'muted small' }, 'Bütün derslerdeki kelimeler. Okunuşlar Türkçe harflerle yazıldı; sesi duymak için 🔊 düğmesine dokun.'),
    search, chips,
    h('div', { class: 'toolbar' }, count, App.hideToggle(list)),
    list);
  paint();
})();
