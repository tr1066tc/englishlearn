// Aralıklı tekrar (Anki benzeri kelime kartları).
// Varsayılanlar Anki'nin kendi varsayılanlarıdır (ankitects/anki: rslib/src/deckconfig/mod.rs,
// rslib/src/scheduler/states/review.rs ve steps.rs): öğrenme adımları 1 dk ve 10 dk, yeniden öğrenme 10 dk,
// mezuniyet 1 gün (Kolay: 4 gün), başlangıç kolaylığı %250, Zor ×1,2, Kolay bonusu ×1,3, günde 20 yeni / 200 tekrar.
// Kart durumları App deposunda (localStorage) "srs" altında tutulur.
const SRS = (() => {
  const CFG = {
    learnSteps: [1, 10],      // dakika
    relearnSteps: [10],       // dakika
    gradGood: 1,              // gün
    gradEasy: 4,              // gün
    startEase: 2.5,
    minEase: 1.3,
    hardMul: 1.2,
    easyMul: 1.3,
    lapseMul: 0,              // unutulan kartın yeni aralığı = eski aralık × 0 (en az 1 gün)
    minLapseIvl: 1,
    maxIvl: 36500,
    learnAheadMin: 20,        // başka kart kalmadıysa 20 dk içinde gelecek öğrenme kartı öne alınır
    dayStartHour: 4,          // yeni gün sabah 04:00'te başlar
    leechLapses: 8,           // 8 kez unutulan kart "zor kelime" olarak işaretlenir
  };
  const DEFAULTS = { newPerDay: 20, revPerDay: 200, dir: 'en' };
  const MIN = 60e3;
  const pad = n => String(n).padStart(2, '0');

  // ---------- gün ----------
  function day(now = Date.now()) {
    const d = new Date(now - CFG.dayStartHour * 3600e3);
    return {
      num: Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5),
      id: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    };
  }

  // ---------- depolama ----------
  function load() {
    const s = App.readState();
    s.srs ||= {};
    s.srs.cards ||= {};
    s.srs.days ||= {};
    s.srs.settings = { ...DEFAULTS, ...(s.srs.settings || {}) };
    s.srs.collapsed ||= {};
    return s;
  }
  const save = s => App.writeState(s);
  // newBy: bugün hangi alt destede kaç yeni kart açıldı. Sınır Anki gibi her alt deste için ayrı sayılır.
  function todayStats(s, now = Date.now()) {
    const id = day(now).id;
    const t = s.srs.days[id] ||= { new: 0, rev: 0, learn: 0, n: 0, ms: 0 };
    t.newBy ||= {};
    return t;
  }
  // Bir alt destenin bugün için kalan yeni kart hakkı
  function newLeft(s, leafId, now = Date.now()) {
    return Math.max(0, s.srs.settings.newPerDay - (todayStats(s, now).newBy[leafId] || 0));
  }
  // Üst destenin alt desteleri; alt destenin kendisi
  const leaves = deck => deck.subs || [deck];

  // ---------- desteler ----------
  // Her kelime ilk geçtiği dersin, o dersteki ilk grubunun destesinde yer alır (aynı kelime iki destede sayılmaz).
  function buildDecks(lessons, words, dir) {
    const dirs = dir === 'both' ? ['en', 'tr'] : [dir];
    const home = new Map();
    const sorted = lessons.slice().sort((a, b) => a.date.localeCompare(b.date) || a.number - b.number);
    for (const l of sorted) {
      for (const g of l.words?.groups || []) {
        for (const k of g.words) {
          const key = k.toLowerCase();
          if (!home.has(key) && words.map.has(key)) home.set(key, { l, g });
        }
      }
    }
    return sorted.map(l => {
      const subs = (l.words?.groups || []).map(g => {
        const keys = g.words.map(k => k.toLowerCase()).filter(k => home.get(k)?.l === l && home.get(k)?.g === g);
        // Anki gibi önce bir yöndeki bütün kartlar, sonra diğer yön
        const ids = dirs.flatMap(d => keys.map(k => `${d}:${k}`));
        return { id: `${l.id}/${g.name}`, name: g.name, lesson: l, ids };
      }).filter(sd => sd.ids.length);
      return { id: l.id, name: `Ders ${l.number}: ${l.title}`, lesson: l, subs, ids: subs.flatMap(sd => sd.ids) };
    }).filter(d => d.ids.length);
  }
  const wordOf = id => id.slice(id.indexOf(':') + 1);
  const dirOf = id => id.slice(0, id.indexOf(':'));

  // ---------- sayılar: yeni / öğrenme / tekrar ----------
  // Üst destenin sayıları alt destelerin toplamıdır (AnkiDroid'deki gibi).
  function counts(deck, s, now = Date.now()) {
    const today = day(now).num;
    let nw = 0, lrn = 0, rev = 0, fresh = 0;
    for (const leaf of leaves(deck)) {
      let leafNew = 0;
      for (const id of leaf.ids) {
        const c = s.srs.cards[id];
        if (!c) leafNew++;
        else if (c.t === 'learn' || c.t === 'relearn') { if (c.due <= now + CFG.learnAheadMin * MIN) lrn++; }
        else if (c.dueDay <= today) rev++;
      }
      fresh += leafNew;
      nw += Math.min(leafNew, newLeft(s, leaf.id, now));
    }
    const t = todayStats(s, now), set = s.srs.settings;
    return {
      new: nw,
      learn: lrn,
      review: Math.min(rev, Math.max(0, set.revPerDay - t.rev)),
      newTotal: fresh,
    };
  }

  // Sıradaki kart: önce zamanı gelen öğrenme kartları, sonra tekrar, sonra yeni (alt deste sırasıyla,
  // her alt destenin kendi sınırıyla), en son 20 dk içinde gelecek öğrenme kartları.
  function next(deck, s, now = Date.now()) {
    const today = day(now).num;
    const cards = s.srs.cards;
    const t = todayStats(s, now), set = s.srs.settings;
    const ids = deck.ids;
    const learning = ids.filter(id => cards[id] && (cards[id].t === 'learn' || cards[id].t === 'relearn'))
      .sort((a, b) => cards[a].due - cards[b].due);
    if (learning.length && cards[learning[0]].due <= now) return { id: learning[0], q: 'learn' };
    if (t.rev < set.revPerDay) {
      const due = ids.filter(id => cards[id]?.t === 'review' && cards[id].dueDay <= today)
        .sort((a, b) => cards[a].dueDay - cards[b].dueDay);
      if (due.length) return { id: due[0], q: 'review' };
    }
    for (const leaf of leaves(deck)) {
      if (newLeft(s, leaf.id, now) <= 0) continue;
      const fresh = leaf.ids.find(id => !cards[id]);
      if (fresh) return { id: fresh, q: 'new', leaf: leaf.id };
    }
    if (learning.length && cards[learning[0]].due <= now + CFG.learnAheadMin * MIN) return { id: learning[0], q: 'learn' };
    return null;
  }
  // Yeni kartı olup bugünkü sınırı dolan alt deste var mı
  function limitHit(deck, s, now = Date.now()) {
    return leaves(deck).some(leaf => leaf.ids.some(id => !s.srs.cards[id]) && newLeft(s, leaf.id, now) === 0);
  }
  // Destede daha sonra gelecek öğrenme kartı varsa ne zaman
  function nextLearnDue(ids, s) {
    const dues = ids.map(id => s.srs.cards[id]).filter(c => c && (c.t === 'learn' || c.t === 'relearn')).map(c => c.due);
    return dues.length ? Math.min(...dues) : null;
  }
  function dueTomorrow(ids, s, now = Date.now()) {
    const tomorrow = day(now).num + 1;
    return ids.filter(id => s.srs.cards[id]?.t === 'review' && s.srs.cards[id].dueDay <= tomorrow).length;
  }

  // ---------- zamanlama ----------
  function fuzz(ivl) {
    if (ivl < 3) return ivl;
    const delta = Math.max(1, Math.round(ivl * (ivl < 7 ? 0.15 : ivl < 20 ? 0.1 : 0.05)));
    return ivl - delta + Math.floor(Math.random() * (2 * delta + 1));
  }
  const clampIvl = n => Math.min(CFG.maxIvl, Math.max(1, Math.round(n)));

  // Kartın verilen cevaptan sonraki hâli. prev yoksa kart yenidir. ease: 1 Yeniden, 2 Zor, 3 İyi, 4 Kolay
  function schedule(prev, ease, now = Date.now(), useFuzz = true) {
    const today = day(now).num;
    const c = prev ? { ...prev } : { t: 'new', step: 0, ease: CFG.startEase, ivl: 0, reps: 0, lapses: 0 };
    c.reps = (c.reps || 0) + 1;
    c.last = now;

    const toReview = ivl => {
      const out = { ...c, t: 'review', step: 0, ivl: clampIvl(ivl), dueDay: 0 };
      delete out.due;
      out.dueDay = today + out.ivl;
      return out;
    };

    if (c.t !== 'review') {
      const relearn = c.t === 'relearn';
      const steps = relearn ? CFG.relearnSteps : CFG.learnSteps;
      const idx = c.t === 'new' ? 0 : Math.min(c.step || 0, steps.length - 1);
      const stay = (step, mins) => ({ ...c, t: relearn ? 'relearn' : 'learn', step, due: now + mins * MIN });
      if (ease === 1) return stay(0, steps[0]);
      if (ease === 2) {
        const mins = idx > 0 ? steps[idx]
          : steps.length > 1 ? (steps[0] + steps[1]) / 2
          : Math.min(steps[0] * 1.5, steps[0] + 1440);
        return stay(idx, mins);
      }
      if (ease === 3 && idx + 1 < steps.length) return stay(idx + 1, steps[idx + 1]);
      // mezun oldu
      if (relearn) return toReview(Math.max(CFG.minLapseIvl, c.ivl || 1) + (ease === 4 ? 1 : 0));
      return toReview(ease === 4 ? CFG.gradEasy : CFG.gradGood);
    }

    // tekrar kartı
    const late = Math.max(0, today - c.dueDay);
    const cur = Math.max(c.ivl, 1);
    if (ease === 1) {
      c.lapses = (c.lapses || 0) + 1;
      c.ease = Math.max(CFG.minEase, c.ease - 0.2);
      c.ivl = Math.max(CFG.minLapseIvl, Math.round(cur * CFG.lapseMul));
      if (c.lapses >= CFG.leechLapses) c.leech = true;
      return { ...c, t: 'relearn', step: 0, due: now + CFG.relearnSteps[0] * MIN };
    }
    const hard = Math.max(clampIvl(cur * CFG.hardMul), c.ivl + 1);
    const good = Math.max(clampIvl((cur + late / 2) * c.ease), hard + 1);
    const easy = Math.max(clampIvl((cur + late) * c.ease * CFG.easyMul), good + 1);
    const ivl = { 2: hard, 3: good, 4: easy }[ease];
    if (ease === 2) c.ease = Math.max(CFG.minEase, c.ease - 0.15);
    if (ease === 4) c.ease = c.ease + 0.15;
    return toReview(useFuzz ? fuzz(ivl) : ivl);
  }

  // Düğmelerin üstündeki süre: "1 dk", "10 dk", "1 g", "3 ay"
  function label(prev, ease, now = Date.now()) {
    const c = schedule(prev, ease, now, false);
    if (c.t !== 'review') {
      const m = Math.round((c.due - now) / MIN);
      return m < 60 ? `${m} dk` : `${Math.round(m / 60)} sa`;
    }
    const d = c.ivl;
    if (d < 30) return `${d} g`;
    if (d < 365) return `${(d / 30).toFixed(d < 300 ? 1 : 0).replace('.0', '').replace('.', ',')} ay`;
    return `${(d / 365).toFixed(1).replace('.0', '').replace('.', ',')} yıl`;
  }

  // Cevabı kaydeder; tek adımlık geri alma bilgisini saklar.
  function answer(id, ease, elapsedMs, leafId, now = Date.now()) {
    const s = load();
    const prev = s.srs.cards[id];
    const t = todayStats(s, now);
    s.srs.undo = { id, prev: prev || null, day: day(now).id, stats: { ...t, newBy: { ...t.newBy } } };
    s.srs.cards[id] = schedule(prev, ease, now);
    if (!prev) { t.new++; t.newBy[leafId] = (t.newBy[leafId] || 0) + 1; }
    else if (prev.t === 'review') t.rev++;
    else t.learn++;
    t.n++;
    t.ms += Math.min(elapsedMs || 0, 60e3);
    save(s);
    if (ease === 1) App.updateState(st => { const w = wordOf(id); st.missed[w] = (st.missed[w] || 0) + 1; });
    return s.srs.cards[id];
  }
  function canUndo() { return !!load().srs.undo; }
  function undo() {
    const s = load();
    const u = s.srs.undo;
    if (!u) return null;
    if (u.prev) s.srs.cards[u.id] = u.prev; else delete s.srs.cards[u.id];
    s.srs.days[u.day] = u.stats;
    delete s.srs.undo;
    save(s);
    return u.id;
  }

  function setSetting(key, value) {
    const s = load();
    s.srs.settings[key] = value;
    save(s);
  }
  function toggleCollapsed(deckId) {
    const s = load();
    s.srs.collapsed[deckId] = !s.srs.collapsed[deckId];
    save(s);
    return s.srs.collapsed[deckId];
  }
  function reset() {
    App.updateState(st => { delete st.srs; });
  }

  // İlerleme sayfası için özet
  function summary(now = Date.now()) {
    const s = load();
    const cards = Object.entries(s.srs.cards);
    const today = day(now).num;
    const t = todayStats(s, now);
    return {
      seen: cards.length,
      learning: cards.filter(([, c]) => c.t !== 'review').length,
      young: cards.filter(([, c]) => c.t === 'review' && c.ivl < 21).length,
      mature: cards.filter(([, c]) => c.t === 'review' && c.ivl >= 21).length,
      dueToday: cards.filter(([, c]) => c.t === 'review' && c.dueDay <= today).length,
      today: t,
      hard: cards.filter(([, c]) => (c.lapses || 0) >= 2 || c.leech)
        .sort((a, b) => (b[1].lapses || 0) - (a[1].lapses || 0))
        .map(([id, c]) => ({ word: wordOf(id), dir: dirOf(id), lapses: c.lapses || 0, leech: !!c.leech })),
      settings: s.srs.settings,
    };
  }

  return { CFG, day, load, todayStats, newLeft, limitHit, buildDecks, wordOf, dirOf, counts, next, nextLearnDue, dueTomorrow, schedule, label, answer, canUndo, undo, setSetting, toggleCollapsed, reset, summary };
})();
