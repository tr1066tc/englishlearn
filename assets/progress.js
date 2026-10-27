// İlerleme sayfası: bu telefonda kaydedilen ilerlemeyi gösterir ve Claude'a yapıştırmak için özet üretir.
(async () => {
  const { h } = App;
  App.header('progress');
  const main = document.getElementById('main');
  let lessons, reviews;
  try {
    [lessons, reviews] = await Promise.all([App.loadLessonIndex(), App.loadReviewIndex().catch(() => [])]);
  } catch (e) { return App.fail(main, e); }

  const s = App.readState();
  const P = s.progress;
  const testName = App.testLabel;
  const day = iso => iso ? new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : '';

  const doneLessons = lessons.filter(l => P['lesson:' + l.id]?.completed);
  const missed = Object.entries(s.missed).sort((a, b) => b[1] - a[1]);

  const rows = [...lessons.map(l => ({ key: 'lesson:' + l.id, label: `Ders ${l.number}: ${l.title}`, date: l.date })),
    ...reviews.map(r => ({ key: 'review:' + r.id, label: r.title, date: r.date }))]
    .sort((a, b) => a.date.localeCompare(b.date));

  const k = SRS.summary();
  const dirName = d => d === 'tr' ? 'Tür→İng' : 'İng→Tür';

  function summary() {
    const lines = [`İlerleme özeti (${new Date().toLocaleDateString('tr-TR')})`, ''];
    for (const r of rows) {
      const p = P[r.key];
      const tests = Object.entries(p?.tests || {}).map(([n, t]) => `${testName(n)} son ${t.score}/${t.total}, en iyi ${t.best}/${t.total}, ${t.tries} deneme`).join('; ');
      lines.push(`- ${r.date} ${r.label}: ${p?.completed ? 'tamamlandı (' + day(p.completedAt) + ')' : p?.lastVisit ? 'başlandı' : 'açılmadı'}${tests ? ' — ' + tests : ''}`);
    }
    lines.push('', `Kelime kartları: ${k.seen} kart görüldü (${k.learning} öğreniliyor, ${k.young} genç, ${k.mature} olgun = 21+ gün). Bugün ${k.today.n} kart çalışıldı, ${k.dueToday} tekrar kartının sırası geldi.`);
    if (k.hard.length) lines.push('Kartlarda çok unutulanlar: ' + k.hard.slice(0, 15).map(x => `${x.word} (${dirName(x.dir)}, ${x.lapses} kez)`).join(', '));
    const writing = App.readState().writing || {};
    const wkeys = Object.keys(writing).sort();
    if (wkeys.length) {
      lines.push('', 'Yazdıkların (Claude düzeltsin):');
      for (const k of wkeys) {
        const [lid, kind] = k.split(':');
        const l = lessons.find(x => x.id === lid);
        lines.push(`[${l ? 'Ders ' + l.number : lid} ${kind === 'okuma' ? 'okuma paragrafı' : 'kendi cümlelerim'}]`, writing[k].trim());
      }
    }
    lines.push('', 'En çok yanlış yapılanlar:');
    lines.push(...(missed.length ? missed.slice(0, 25).map(([t, n]) => `- ${t} (${n})`) : ['- yok']));
    return lines.join('\n');
  }

  const text = h('textarea', { readonly: true, 'aria-label': 'İlerleme özeti' });
  text.value = summary();
  const copyBtn = h('button', { class: 'primary', type: 'button' }, 'Özeti kopyala');
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text.value); }
    catch { text.select(); document.execCommand?.('copy'); }
    copyBtn.textContent = '✓ Kopyalandı';
    setTimeout(() => { copyBtn.textContent = 'Özeti kopyala'; }, 2000);
  });

  App.fill(main,
    h('h1', {}, 'İlerleme'),
    h('p', { class: 'muted small' }, 'İlerleme bu telefonun tarayıcısında saklanır. Başka cihazda görünmez.'),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', {}, `${doneLessons.length} / ${lessons.length}`), 'ders tamamlandı'),
      h('div', { class: 'stat' }, h('b', {}, String(Object.values(P).reduce((n, p) => n + Object.values(p.tests || {}).reduce((m, t) => m + (t.tries || 0), 0), 0))), 'test çözüldü'),
      h('div', { class: 'stat' }, h('b', {}, String(missed.length)), 'takılınan kelime/cümle'),
      h('div', { class: 'stat' }, h('b', {}, String(k.seen)), 'kelime kartı görüldü'),
      h('div', { class: 'stat' }, h('b', {}, String(k.mature)), 'olgun kart (21+ gün)')),
    h('h2', {}, 'Dersler ve testler'),
    h('div', {}, rows.map(r => {
      const p = P[r.key];
      const href = r.key.startsWith('lesson:') ? 'lesson.html?id=' + encodeURIComponent(r.key.slice(7)) : 'review.html?id=' + encodeURIComponent(r.key.slice(7));
      return h('a', { class: 'card lesson-link', href },
        h('div', { class: 'date' }, App.formatDate(r.date, false)),
        h('div', { class: 'title' }, r.label),
        h('div', { class: 'meta' },
          p?.completed ? h('span', { class: 'tag done' }, '✓ ' + day(p.completedAt)) : h('span', { class: 'tag' }, p?.lastVisit ? 'Başlandı' : 'Açılmadı'),
          Object.entries(p?.tests || {}).map(([n, t]) => h('span', { class: 'tag' }, `${testName(n)}: ${t.score}/${t.total} (en iyi ${t.best})`))));
    })),
    h('h2', {}, 'En çok takıldıkların'),
    missed.length
      ? h('div', { class: 'card' }, missed.slice(0, 15).map(([t, n]) => h('div', { class: 'item' }, h('div', { class: 'text en' }, t), h('span', { class: 'tag' }, n + ' kez'), App.listenBtn(t))))
      : h('p', { class: 'muted' }, 'Henüz yok. Testleri çözdükçe burada görünecek.'),
    h('h2', {}, "Claude'a gönder"),
    h('p', { class: 'small muted' }, "Bu özeti kopyalayıp Claude'a yapıştırırsan tekrar testleri senin zayıf noktalarına göre hazırlanır."),
    text,
    h('div', { class: 'row' }, copyBtn,
      h('button', { type: 'button', onclick: () => {
        if (confirm('Bu telefondaki bütün ilerleme silinsin mi? Bu geri alınamaz.')) {
          App.updateState(st => { st.progress = {}; st.missed = {}; });
          location.reload();
        }
      } }, 'İlerlemeyi sıfırla')));
})();
