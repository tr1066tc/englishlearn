// Kelimeler sayfası.
//   #desteler (varsayılan) → Anki benzeri desteler: her ders bir deste, her kelime grubu bir alt deste
//   #calis/<deste-id>      → çalışma ekranı (kart, cevabı göster, Yeniden / Zor / İyi / Kolay)
//   #kutuphane             → bütün kelimeler: arama, konu filtresi, okunuş, dinle
(async () => {
  const { h, listenBtn } = App;
  App.header('words');
  const main = document.getElementById('main');
  let words, index, lessons;
  try {
    [words, index] = await Promise.all([App.loadWords(), App.loadLessonIndex()]);
    lessons = await Promise.all(index.map(l => App.loadLesson(l.id)));
  } catch (e) { return App.fail(main, e); }

  const lessonById = new Map(index.map(l => [l.id, l]));
  const cap = s => s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
  let timer = null;
  const sentences = SRS.sentenceIndex(lessons);

  // ---------- yönlendirme ----------
  function route() {
    clearTimeout(timer);
    App.stop();
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash.startsWith('calis/')) return study(hash.slice(6));
    if (hash === 'kutuphane') return library();
    return deckList();
  }
  addEventListener('hashchange', route);
  const go = hash => { location.hash = hash; };

  function tabs(active) {
    const seg = h('div', { class: 'seg', role: 'tablist', style: 'margin:8px 0 4px' });
    for (const [key, label] of [['desteler', 'Desteler'], ['kutuphane', 'Tüm kelimeler']]) {
      seg.append(h('button', { type: 'button', role: 'tab', 'aria-selected': String(active === key), onclick: () => go(key) }, label));
    }
    return seg;
  }

  function decks() {
    const s = SRS.load();
    return { s, list: SRS.buildDecks(lessons, words, s.srs.settings.dir) };
  }
  function findDeck(list, id) {
    for (const d of list) {
      if (d.id === id) return { deck: d, title: d.name };
      const sd = d.subs.find(x => x.id === id);
      if (sd) return { deck: sd, title: `${d.name} › ${sd.name}` };
    }
    return null;
  }
  const countsEl = c => h('span', { class: 'counts' },
    h('span', { class: 'c-new' + (c.new ? '' : ' zero') }, String(c.new)),
    h('span', { class: 'c-learn' + (c.learn ? '' : ' zero') }, String(c.learn)),
    h('span', { class: 'c-rev' + (c.review ? '' : ' zero') }, String(c.review)));

  // ---------- desteler ----------
  function deckList() {
    const { s, list } = decks();
    const total = list.map(d => SRS.counts(d, s))
      .reduce((a, c) => ({ new: a.new + c.new, learn: a.learn + c.learn, review: a.review + c.review }), { new: 0, learn: 0, review: 0 });
    const t = SRS.todayStats(s);
    const rows = h('div', { class: 'card decks' });

    for (const d of list) {
      const c = SRS.counts(d, s);
      const open = !s.srs.collapsed[d.id];
      const chev = h('button', { class: 'chev', type: 'button', 'aria-expanded': String(open), 'aria-label': open ? 'Alt desteleri gizle' : 'Alt desteleri göster' }, open ? '⌄' : '›');
      chev.addEventListener('click', () => { SRS.toggleCollapsed(d.id); deckList(); });
      rows.append(h('div', { class: 'deck-row' }, chev,
        h('button', { class: 'deck-name', type: 'button', onclick: () => go('calis/' + d.id) }, h('span', {}, d.name), countsEl(c))));
      if (open) {
        for (const sd of d.subs) {
          rows.append(h('div', { class: 'deck-row sub' },
            h('span', { class: 'chev-space' }),
            h('button', { class: 'deck-name', type: 'button', onclick: () => go('calis/' + sd.id) }, h('span', {}, sd.name), countsEl(SRS.counts(sd, s)))));
        }
      }
    }

    const set = s.srs.settings;
    const chipRow = (label, key, options) => h('div', {},
      h('p', { class: 'small', style: 'margin:10px 0 4px' }, label),
      h('div', { class: 'chips', style: 'padding:0' }, options.map(([v, text]) =>
        h('button', { class: 'chip', type: 'button', 'aria-pressed': String(set[key] === v), onclick: () => { SRS.setSetting(key, v); deckList(); } }, text))));

    const secs = t.n ? Math.round(t.ms / 1000 / t.n) : 0;
    const dueAll = total.new + total.learn + total.review;
    App.fill(main,
      h('h1', {}, 'Kelimeler'),
      tabs('desteler'),
      h('p', { class: 'muted' }, dueAll ? `${dueAll} kartın sırası geldi.` : 'Bugün için sırası gelen kart yok. 🎉'),
      h('div', { class: 'legend small' },
        h('span', { class: 'c-new' }, '● Yeni'), h('span', { class: 'c-learn' }, '● Öğrenme'), h('span', { class: 'c-rev' }, '● Tekrar')),
      set.dir === 'en' ? h('div', { class: 'note small' },
        h('div', {}, h('strong', {}, 'Öneri: '), 'Kelime kartların şu an İngilizce yüzüyle geliyor; bu sadece tanımayı çalıştırır. Konuşurken kelime aklına gelsin istiyorsan Türkçe yüzüyle çalış.'),
        h('div', { class: 'row', style: 'margin:6px 0 0' },
          h('button', { class: 'chip', type: 'button', onclick: () => { SRS.setSetting('dir', 'tr'); deckList(); } }, 'Türkçe → İngilizce yap'),
          h('button', { class: 'chip', type: 'button', onclick: () => { SRS.setSetting('dir', 'both'); deckList(); } }, 'İkisi de'))) : null,
      list.length ? rows : h('p', { class: 'muted' }, 'Henüz deste yok.'),
      h('p', { class: 'small muted' }, `Bugün ${t.n} kart, ${Math.round(t.ms / 60000)} dakikada çalışıldı (${secs} sn/kart).`),
      h('details', { class: 'card' },
        h('summary', {}, 'Sayılar ne anlama geliyor?'),
        h('ul', {},
          h('li', {}, h('strong', { class: 'c-new' }, 'Mavi (Yeni): '), 'bugün öğrenmeye başlayacağın, hiç görmediğin kartlar. Günlük sınır kadar gösterilir.'),
          h('li', {}, h('strong', { class: 'c-learn' }, 'Kırmızı (Öğrenme): '), 'şu anda öğrenmekte olduğun ya da unuttuğun için yeniden öğrendiğin kartlar. Dakikalar sonra tekrar gelir.'),
          h('li', {}, h('strong', { class: 'c-rev' }, 'Yeşil (Tekrar): '), 'öğrendiğin ve bugün tekrar zamanı gelen kartlar. İyi bildikçe aralık uzar: 1 gün, 3 gün, 8 gün, 3 hafta…')),
        h('p', { class: 'small' }, 'Kartı gör, cevabı kafanda söyle, sonra "Cevabı göster". Ne kadar iyi bildiğine göre bir düğmeye bas:'),
        h('ul', { class: 'small' },
          h('li', {}, h('strong', {}, 'Yeniden: '), 'bilemedim. Kart birkaç dakika sonra tekrar gelir.'),
          h('li', {}, h('strong', {}, 'Zor: '), 'zorlanarak hatırladım. Aralık biraz uzar.'),
          h('li', {}, h('strong', {}, 'İyi: '), 'hatırladım. Normal aralık.'),
          h('li', {}, h('strong', {}, 'Kolay: '), 'hiç düşünmeden bildim. Aralık çok uzar.')),
        h('p', { class: 'small muted' }, 'Bir deste ismine dokununca o destenin (alt desteleri dahil) kartları çalışılır. Bir kelime yalnızca ilk geçtiği derste sayılır.')),
      h('details', { class: 'card' },
        h('summary', {}, 'Ayarlar'),
        chipRow('Günlük yeni kart sınırı (her alt deste için ayrı)', 'newPerDay', [[5, '5'], [10, '10'], [20, '20'], [30, '30']]),
        chipRow('Kartın ön yüzü', 'dir', [['en', 'İngilizce → Türkçe'], ['tr', 'Türkçe → İngilizce'], ['both', 'İkisi de']]),
        h('p', { class: 'small muted' }, '"Türkçe → İngilizce" konuşurken kelimeyi hatırlamayı çalıştırır. "İkisi de" her kelime için iki ayrı kart açar.'),
        h('div', { class: 'row' }, h('button', { type: 'button', onclick: () => {
          if (confirm('Bütün kelime kartı ilerlemesi silinsin mi? Bu geri alınamaz.')) { SRS.reset(); deckList(); }
        } }, 'Kart ilerlemesini sıfırla'))));
  }

  // ---------- çalışma ekranı ----------
  function study(deckId) {
    const { s, list } = decks();
    const found = findDeck(list, deckId);
    if (!found) return go('desteler');
    const { deck, title } = found;
    const now = Date.now();
    const c = SRS.counts(deck, s, now);
    const nx = SRS.next(deck, s, now);

    const undoBtn = h('button', { class: 'chip', type: 'button', disabled: !SRS.canUndo(), onclick: () => { SRS.undo(); study(deckId); } }, '↶ Geri al');
    const top = h('div', { class: 'study-top' },
      h('button', { class: 'chip', type: 'button', onclick: () => go('desteler') }, '← Desteler'),
      undoBtn);
    const qCounts = h('div', { class: 'study-counts' },
      h('span', { class: 'c-new' + (nx?.q === 'new' ? ' cur' : '') }, String(c.new)), ' + ',
      h('span', { class: 'c-learn' + (nx?.q === 'learn' ? ' cur' : '') }, String(c.learn)), ' + ',
      h('span', { class: 'c-rev' + (nx?.q === 'review' ? ' cur' : '') }, String(c.review)));

    if (!nx) {
      const due = SRS.nextLearnDue(deck.ids, s);
      const tomorrow = SRS.dueTomorrow(deck.ids, s);
      const limitHit = SRS.limitHit(deck, s);
      if (due) timer = setTimeout(() => study(deckId), Math.max(1000, due - Date.now() - SRS.CFG.learnAheadMin * 60e3 + 500));
      App.fill(main, top,
        h('div', { class: 'card done' },
          h('p', { class: 'big' }, 'Tebrikler! Bu destede şimdilik kart kalmadı. 🎉'),
          due ? h('p', {}, `Öğrenme kartlarından biri ${new Date(due).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} civarında tekrar gelecek. Sayfa açık kalırsa kendiliğinden gelir.`) : null,
          limitHit ? h('p', { class: 'small muted' }, `Bu destenin bugünkü yeni kart sınırına (alt deste başına ${s.srs.settings.newPerDay}) ulaştın. Diğer destelerin sınırı ayrı sayılır. Kalan yeni kartlar yarın gelecek; istersen Ayarlar'dan sınırı artırabilirsin.`) : null,
          h('p', { class: 'small muted' }, `Yarın bu destede yaklaşık ${tomorrow} tekrar kartı var.`),
          h('div', { class: 'row' }, h('button', { class: 'primary', type: 'button', onclick: () => go('desteler') }, 'Destelere dön'))));
      return;
    }

    const id = nx.id;
    const dir = SRS.dirOf(id);
    const prev = s.srs.cards[id];
    const shownAt = Date.now();
    if (dir === 's') return sentenceCard();
    const w = words.map.get(SRS.wordOf(id));
    const front = dir === 'en'
      ? h('div', { class: 'face' }, h('div', { class: 'big-word' }, w.en), listenBtn(w.en))
      : h('div', { class: 'face' }, h('div', { class: 'big-word' }, w.tr));
    const back = h('div', { class: 'back', hidden: true },
      h('hr'),
      h('div', { class: 'face' }, h('div', { class: 'big-word' }, dir === 'en' ? w.tr : w.en), dir === 'tr' ? listenBtn(w.en) : null),
      h('p', { class: 'say' }, `${w.en} · okunuşu: ${w.say}`),
      w.example ? h('div', { class: 'example' },
        h('div', { class: 'text' }, h('div', {}, w.example.en), h('div', { class: 'tr small' }, w.example.tr)),
        listenBtn(w.example.en, 'Örneği dinle')) : null,
      w.note ? h('p', { class: 'small muted' }, w.note) : null,
      prev?.leech ? h('p', { class: 'small bad-msg' }, 'Zor kelime: bu kartı çok kez unuttun. Örnek cümleyi yüksek sesle birkaç kez söyle.') : null,
      h('p', { class: 'small muted' }, (w.lessons || []).map(lid => lessonById.get(lid) ? `Ders ${lessonById.get(lid).number}` : lid).join(', ')));

    const bar = h('div', { class: 'answer-bar' });
    const reveal = h('button', { class: 'primary wide', type: 'button' }, 'Cevabı göster');
    reveal.addEventListener('click', () => {
      back.hidden = false;
      if (dir === 'tr') App.speak(w.en);
      const btn = (ease, text, cls) => h('button', { class: 'ans ' + cls, type: 'button', onclick: () => {
        SRS.answer(id, ease, Date.now() - shownAt, nx.leaf);
        study(deckId);
      } }, h('span', { class: 'ivl' }, SRS.label(prev, ease)), h('span', {}, text));
      App.fill(bar, btn(1, 'Yeniden', 'again'), btn(2, 'Zor', 'hard'), btn(3, 'İyi', 'good'), btn(4, 'Kolay', 'easy'));
    });
    bar.append(reveal);

    App.fill(main, top,
      h('p', { class: 'small muted', style: 'margin:6px 0 0' }, title),
      qCounts,
      h('div', { class: 'card study-card' },
        nx.q === 'new' ? h('span', { class: 'tag' }, 'Yeni kart') : null,
        h('p', { class: 'small muted' }, dir === 'en' ? 'Türkçesi ne?' : 'İngilizcesi ne? Yüksek sesle söyle.'),
        front, back),
      bar);
    if (dir === 'en') App.speak(w.en);

    // Cümle kartı: Türkçe cümle → İngilizcesini yüksek sesle söyle → cevabı aç
    function sentenceCard() {
      const x = sentences.get(SRS.wordOf(id));
      const back = h('div', { class: 'back', hidden: true },
        h('hr'),
        h('div', { class: 'face' }, h('div', { class: 'big-sentence' }, x.en), listenBtn(x.en)),
        h('p', { class: 'small muted' }, 'Söylediğin bununla aynı mıydı? Küçük farklar sorun değil; anlam ve kalıp doğruysa İyi de.'),
        prev?.leech ? h('p', { class: 'small bad-msg' }, 'Bu cümlede çok takıldın. Dinle ve 3 kez yüksek sesle tekrar et.') : null,
        h('p', { class: 'small muted' }, `Ders ${x.lesson.number}`));
      const bar = h('div', { class: 'answer-bar' });
      const reveal = h('button', { class: 'primary wide', type: 'button' }, 'Cevabı göster');
      reveal.addEventListener('click', () => {
        back.hidden = false;
        App.speak(x.en);
        const btn = (ease, text, cls) => h('button', { class: 'ans ' + cls, type: 'button', onclick: () => {
          SRS.answer(id, ease, Date.now() - shownAt, nx.leaf);
          study(deckId);
        } }, h('span', { class: 'ivl' }, SRS.label(prev, ease)), h('span', {}, text));
        App.fill(bar, btn(1, 'Yeniden', 'again'), btn(2, 'Zor', 'hard'), btn(3, 'İyi', 'good'), btn(4, 'Kolay', 'easy'));
      });
      bar.append(reveal);
      App.fill(main, top,
        h('p', { class: 'small muted', style: 'margin:6px 0 0' }, title),
        qCounts,
        h('div', { class: 'card study-card' },
          nx.q === 'new' ? h('span', { class: 'tag' }, 'Yeni cümle') : null,
          h('p', { class: 'small muted' }, 'İngilizcesini aklında ara ve yüksek sesle söyle. Bulamazsan da dene; sonra cevabı aç.'),
          h('div', { class: 'face' }, h('div', { class: 'big-sentence' }, x.tr)),
          back),
        bar);
    }
  }

  // ---------- bütün kelimeler ----------
  function library() {
    const topics = [...new Set(words.list.map(w => w.topic))].sort((a, b) => a.localeCompare(b, 'tr'));
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
      h('h1', {}, 'Kelimeler'),
      tabs('kutuphane'),
      h('p', { class: 'muted small' }, 'Bütün derslerdeki kelimeler. Okunuşlar Türkçe harflerle yazıldı; sesi duymak için 🔊 düğmesine dokun.'),
      search, chips,
      h('div', { class: 'toolbar' }, count, App.hideToggle(list)),
      list);
    paint();
  }

  route();
})();
