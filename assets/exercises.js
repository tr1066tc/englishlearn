// Alıştırmalar: her ders için yazıcıdan çıktı alınabilir PDF kağıdı ve cevap anahtarı.
// Dosyalar exercises/<ders-id>-alistirma.pdf ve exercises/<ders-id>-cevaplar.pdf (tools/alistirma.js üretir).
(async () => {
  const { h } = App;
  App.header('exercises');
  const main = document.getElementById('main');
  let lessons;
  try { lessons = await App.loadLessonIndex(); } catch (e) { return App.fail(main, e); }

  const sorted = lessons.slice().sort((a, b) => b.date.localeCompare(a.date) || b.number - a.number);
  const url = (id, kind) => `exercises/${encodeURIComponent(id)}-${kind}.pdf`;

  const cards = sorted.map(l => {
    const sheet = h('a', { class: 'btn', href: url(l.id, 'alistirma'), target: '_blank', rel: 'noopener' }, '📄 Alıştırma kağıdı');
    const key = h('a', { class: 'btn', href: url(l.id, 'cevaplar'), target: '_blank', rel: 'noopener' }, '✓ Cevap anahtarı');
    const card = h('div', { class: 'card' },
      h('div', { class: 'date muted small' }, App.formatDate(l.date)),
      h('div', { style: 'font-weight:700;font-size:1.08rem;margin:2px 0' }, `Ders ${l.number}: ${l.title}`),
      h('div', { class: 'muted small' }, `${l.week}. hafta · ${l.topic}`),
      h('div', { class: 'row' }, h('a', { class: 'btn primary', href: 'practice.html?id=' + encodeURIComponent(l.id) }, '✍ Ekranda çöz')),
      h('div', { class: 'row' }, sheet, key),
      h('a', { class: 'small', href: 'lesson.html?id=' + encodeURIComponent(l.id) }, 'Dersi aç →'));
    // Dosya henüz üretilmediyse düğmeleri kapat
    fetch(url(l.id, 'alistirma'), { method: 'HEAD' }).then(r => {
      if (!r.ok) throw new Error();
    }).catch(() => {
      [sheet, key].forEach(b => { b.removeAttribute('href'); b.classList.add('disabled'); });
      sheet.textContent = 'Kağıt hazırlanıyor';
    });
    return card;
  });

  App.fill(main,
    h('h1', {}, 'Alıştırmalar'),
    h('p', { class: 'muted' }, 'Her ders için iki yol: ekranda çözülen kısa alıştırmalar (eşleştir, cümle sırala, kelimeyi yaz, kendi cümlelerin) ya da yazıcıdan çıktı alıp kalemle çözeceğin kağıt. Kağıdın cevap anahtarı ayrı dosyada.'),
    h('details', { class: 'card' },
      h('summary', {}, 'Kağıtta neler var?'),
      h('ol', {},
        h('li', {}, h('strong', {}, 'Eşleştir: '), 'Türkçe kelimeyi İngilizcesiyle eşleştir.'),
        h('li', {}, h('strong', {}, 'Şık seç: '), 'boşluklu cümleler ve sorular.'),
        h('li', {}, h('strong', {}, 'Yaz: '), 'Türkçesini İngilizce yaz (ilk harf verilir).'),
        h('li', {}, h('strong', {}, 'Cümle sırala: '), 'karışık kelimelerden doğru cümle.'),
        h('li', {}, h('strong', {}, 'Diyaloğu tamamla: '), 'Ali\'nin cevaplarını yaz.'),
        h('li', {}, h('strong', {}, 'Söyle: '), 'her cümleyi 3 kez yüksek sesle söyle, kutuları işaretle.'),
        h('li', {}, h('strong', {}, 'Kendi cümlelerin: '), 'kendi hayatından 5 cümle yaz.')),
      h('p', { class: 'small muted' }, 'Telefondan yazdırma: PDF\'i aç, Paylaş (veya ⋮ menüsü) → Yazdır. A4 kağıt, "Gerçek boyut" seç.')),
    h('div', {}, cards));
})();
