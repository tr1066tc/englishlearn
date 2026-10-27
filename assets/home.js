// Ana sayfa: dersler gün gün, en yenisi en üstte. Altında tekrar testleri.
(async () => {
  const { h } = App;
  App.header('home');
  const main = document.getElementById('main');
  let lessons, reviews;
  try {
    [lessons, reviews] = await Promise.all([App.loadLessonIndex(), App.loadReviewIndex().catch(() => [])]);
  } catch (e) { return App.fail(main, e); }

  const st = App.readState().progress;
  const testTags = p => Object.entries(p?.tests || {}).map(([name, t]) =>
    h('span', { class: 'tag' }, `${App.testLabel(name)}: ${t.best}/${t.total}`));

  const sorted = lessons.slice().sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number);
  const lessonCards = sorted.map(l => {
    const p = st['lesson:' + l.id];
    return h('a', { class: 'card lesson-link', href: 'lesson.html?id=' + encodeURIComponent(l.id) },
      h('div', { class: 'date' }, App.formatDate(l.date)),
      h('div', { class: 'title' }, `Ders ${l.number}: ${l.title}`),
      h('div', { class: 'muted small' }, `${l.week}. hafta · ${l.topic}`),
      h('div', { class: 'meta' },
        p?.completed ? h('span', { class: 'tag done' }, '✓ Tamamlandı') : p?.lastVisit ? h('span', { class: 'tag' }, 'Başlandı') : h('span', { class: 'tag' }, 'Yeni'),
        testTags(p)));
  });

  const reviewCards = reviews.slice().sort((a, b) => b.date.localeCompare(a.date)).map(r => {
    const p = st['review:' + r.id];
    return h('a', { class: 'card lesson-link', href: 'review.html?id=' + encodeURIComponent(r.id) },
      h('div', { class: 'date' }, App.formatDate(r.date)),
      h('div', { class: 'title' }, r.title),
      h('div', { class: 'meta' }, p?.completed ? h('span', { class: 'tag done' }, '✓ Yapıldı') : null, testTags(p)));
  });

  App.fill(main,
    h('h1', {}, 'Dersler'),
    h('p', { class: 'muted' }, 'Her akşam 20:30–22:00 arası, yaklaşık 30 dakika. Geçmiş derslere istediğin zaman dönüp tekrar edebilirsin.'),
    h('details', { class: 'card' },
      h('summary', {}, 'Bir ders nasıl çalışılır?'),
      h('ol', {},
        h('li', {}, h('strong', {}, 'Isınma (5 dk): '), 'önceki derslerden birkaç soru; dinle, söyle, cevabı aç.'),
        h('li', {}, h('strong', {}, 'Kelimeler: '), 'dinle, sonra "Türkçeyi gizle" ile kendini dene.'),
        h('li', {}, h('strong', {}, 'Kalıplar: '), 'kısa notu oku, cümleleri dinleyip yüksek sesle söyle.'),
        h('li', {}, h('strong', {}, 'Diyalog: '), '"Oku ve dinle" ile başla, sonra "Tekrar et" ile her cümleyi 3 kez söyle.'),
        h('li', {}, h('strong', {}, 'Okuma: '), 'önce dinle, sonra oku; sonunda metni kendi ağzından yaz.'),
        h('li', {}, h('strong', {}, 'Test ve alıştırma: '), 'kelime ve diyalog testi, sonra "Ekranda alıştırma çöz".')),
      h('p', { class: 'small muted' }, "Yazdıklarını ve sonuçlarını İlerleme sayfasından kopyalayıp Claude'a yapıştırırsan, bir sonraki ders senin hatalarına göre hazırlanır."),
      h('p', { class: 'small muted' }, 'Çok yorgun bir akşamda sadece diyaloğu "Tekrar et" modunda yapmak bile yeter. Sıfır gün yok.')),
    h('h2', {}, 'Ders listesi'),
    lessonCards.length ? h('div', {}, lessonCards) : h('p', { class: 'muted' }, 'Henüz ders yok.'),
    h('h2', {}, 'Tekrar'),
    h('a', { class: 'card lesson-link', href: 'review.html' },
      h('div', { class: 'title' }, 'Karışık tekrar'),
      h('div', { class: 'muted small' }, 'Bütün derslerden rastgele kelime ve cümleler. Her açışta farklı.')),
    h('div', {}, reviewCards));
})();
