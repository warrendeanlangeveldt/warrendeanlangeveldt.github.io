// The live replay on the site: a Claude Code session building the book editor's milestone 5 with
// code-kit and Context Graph, as their band and panes show it. It replays a script drawn from the real
// run; nothing here talks to a server.
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = (tag, attrs = {}, kids = []) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    for (const k of [].concat(kids)) if (k != null) n.append(k);
    return n;
  };
  const h = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const LANES = ['lead', 'core', 'data', 'ai', 'ingest', 'web'];
  const color = (lane) => css(`--${lane}`) || css('--dim');

  // ---- the story maps, from the book editor's real files ----------------------------------------
  const LAYERS = ['contracts', 'domain', 'ports', 'parsers', 'tests'];
  const MAPS = {
    'ST-20': {
      title: 'ST-20 Source locations in every parser', lane: 'ingest',
      files: [
        { id: 'api', path: 'src/contracts/api.ts', layer: 0, card: 'The API shapes routes and screens share; a paragraph now carries where it came from in the original.', req: 'ORIG-1' },
        { id: 'model', path: 'src/domain/model.ts', layer: 1, card: 'The book, its chapters and paragraphs, and each paragraph\'s place in the original file.', req: 'ORIG-1, ORIG-2' },
        { id: 'struct', path: 'src/domain/structure.ts', layer: 1, card: 'Structure edits while a book is structuring; a split or merge keeps each paragraph\'s source location.', req: 'IMP-7, ORIG-2' },
        { id: 'port', path: 'src/application/ports/parser.ts', layer: 2, card: 'The parser port every format implements: blocks of text, each with where it came from.', req: 'ORIG-1' },
        { id: 'pdf', path: 'src/adapters/parsers/pdf.ts', layer: 3, card: 'Reads a PDF by page, dropping page numbers and running heads, and keeps each line\'s box.', req: 'IMP-3, ORIG-2' },
        { id: 'docx', path: 'src/adapters/parsers/docx.ts', layer: 3, card: 'Reads .docx paragraphs with italics and bold as markers, and each one\'s element path.', req: 'IMP-1, ORIG-2' },
        { id: 'epub', path: 'src/adapters/parsers/epub.ts', layer: 3, card: 'Reads an EPUB\'s spine in order; each paragraph keeps its file and element path.', req: 'IMP-3, ORIG-2' },
        { id: 'md', path: 'src/adapters/parsers/markdown.ts', layer: 3, card: 'Markdown and plain text with front matter skipped; each paragraph keeps its line range.', req: 'IMP-2, ORIG-2' },
        { id: 'test', path: 'src/adapters/parsers/original.test.ts', layer: 4, card: 'ORIG-2: every parser\'s paragraphs point back to the right place in each sample manuscript.', req: 'ORIG-2' },
      ],
      edges: [['pdf', 'port'], ['docx', 'port'], ['epub', 'port'], ['md', 'port'], ['port', 'model'], ['struct', 'model'], ['api', 'model'], ['test', 'pdf'], ['test', 'docx'], ['test', 'epub'], ['test', 'md']],
      cards: { api: 'carded', model: 'carded', struct: 'stale', port: 'carded', pdf: 'carded', docx: 'carded', epub: 'carded', md: 'carded', test: 'missing' },
    },
  };

  // ---- the script --------------------------------------------------------------------------------
  // Each event: who acts, the tool call, the file it touches, and what the transcript and caption say.
  const SCRIPT = [
    { t: 'ingest', tool: 'Read src/adapters/parsers/pdf.ts', file: 'pdf', act: 'read', say: 'The ingest lane reads pdf.ts in full before touching it.' },
    { t: 'web', tool: 'Bash npm run test:e2e', say: 'The web lane runs its browser tests on web/st-19.' },
    { t: 'ingest', tool: 'Read src/application/ports/parser.ts', file: 'port', act: 'read', say: 'It reads the port pdf.ts implements: Context Graph tracks what it understood.' },
    { t: 'ingest', tool: 'Edit src/adapters/parsers/pdf.ts', file: 'pdf', act: 'edit', say: 'Now it edits pdf.ts. The file glows in the ingest lane\'s colour.' },
    { t: 'lead', tool: 'Read web/st-19: src/ui/settings-form.tsx', say: 'The lead reviews ST-19 against its requirements.' },
    { t: 'ingest', tool: 'Bash ctx card src/adapters/parsers/pdf.ts', file: 'pdf', act: 'card', decision: 'L:parsers', say: 'It writes pdf.ts\'s card: the why, kept in git for the next agent.' },
    { t: 'ingest', tool: 'Edit src/adapters/parsers/epub.ts', file: 'epub', act: 'edit', unread: true, refused: 'Context Graph: epub.ts was never read in full. Read it, and what it imports, then edit.', say: 'An edit on a file it never read: Context Graph refuses it, with what to read.' },
    { t: 'ingest', tool: 'Read src/adapters/parsers/epub.ts', file: 'epub', act: 'read', fixUnread: true, say: 'It reads epub.ts. The band\'s warning clears.' },
    { t: 'ingest', tool: 'Edit src/adapters/parsers/epub.ts', file: 'epub', act: 'edit', say: 'The same edit, now with understanding, goes through.' },
    { t: 'web', tool: 'Bash npm install pdfjs-dist', refusedKit: 'code-kit: a new dependency (pdfjs-dist) needs approval. Ask the lead, or the person.', ask: 'web wants to install pdfjs-dist', say: 'A new dependency: code-kit holds the call and asks you in the band.' },
    { t: 'lead', tool: 'code-kit approve dep-pdfjs-dist --delegated', approved: true, say: 'It\'s within the project\'s delegated rules, so the lead approves it, on the record.' },
    { t: 'lead', tool: 'code-kit queue add web/st-19', loopNow: ['merge', 'web/st-19'], loopNext: ['dispatch', 'ST-23'], say: 'ST-19 passed review and joins the merge queue.' },
    { t: 'ingest', tool: 'Write src/adapters/parsers/original.test.ts', file: 'test', act: 'edit', say: 'The test that names ORIG-2, so the trail is complete.' },
    { t: 'ingest', tool: 'Bash ctx card src/adapters/parsers/original.test.ts', file: 'test', act: 'card', decision: 'L:domain', say: 'Carded. Every file this story touched now has its why.' },
    { t: 'lead', tool: 'code-kit queue merge --delegated', merged: 'web/st-19', loopNow: ['dispatch', 'ST-23'], loopNext: ['review', 'ST-20'], say: 'Verified against main as it is now, then merged. Its worktree is cleaned up.' },
    { t: 'web', tool: 'Read src/domain/model.ts', file: 'model', act: 'read', newStory: 'ST-23 The original panel · web/st-23', say: 'The loop dispatches ST-23. The web lane starts by reading the model.' },
    { t: 'ingest', tool: 'Bash npm test  (652 passed)', done: true, say: 'ST-20 is finished and waits for review. The loop takes it next.' },
  ];

  function freshState() {
    return {
      lanes: {
        lead: { st: 'orch', label: 'orchestrating', story: 'ST-24 Required contract fields · waits on ST-23', tool: 'reviewing web/st-19', age: 4, tok: '4.5M' },
        core: { st: 'blocked', label: 'blocked', story: 'ST-22 Original use cases · waits on ST-20', tool: '', age: 0, tok: '1.1M' },
        data: { st: 'idle', label: 'idle', story: '3 stories merged', tool: '', age: 0, tok: '640k' },
        ai: { st: 'idle', label: 'idle', story: '2 stories merged', tool: '', age: 0, tok: '820k' },
        ingest: { st: 'working', label: 'building', story: 'ST-20 Source locations · ingest/st-20', tool: 'Bash npm test', age: 6, tok: '96k' },
        web: { st: 'review', label: 'in review', story: 'ST-19 Settings: your own key · web/st-19', tool: 'Bash npm run test:e2e', age: 41, tok: '148k' },
      },
      unread: 0,
      merged: 0,
      cards: { ...MAPS['ST-20'].cards },
      touching: {},
      decisions: [],
      ask: null,
      loop: { done: [['merge', 'core/st-18'], ['review', 'ST-17'], ['dispatch', 'ST-19']], now: ['review', 'ST-19'], next: ['merge', 'web/st-19'] },
      transcript: [
        ['u', 'Build milestone 5: my own API key in settings, and the original page beside the split.'],
        ['p', 'Specced as ORIG-1 to ORIG-5 and KEY-1 to KEY-3. Dispatching ST-17, ST-19 and ST-20.'],
        ['t', 'Agent(Review web/st-19 for ST-19)', 'Backgrounded agent · reviewer'],
        ['m', 'The code-kit plugin sent a message: Merge core/st-18, next in the merge queue.'],
        ['t', 'Bash code-kit queue merge --delegated', 'Merged core/st-18 into main: verify passed on 14 file(s).'],
        ['p', 'core/st-18 is merged. ST-19 is back from the web lane; reviewing it now.'],
      ],
      say: 'Milestone 5 is under way: four lanes, one lead, the loop on.',
    };
  }

  function apply(S, ev) {
    const L = S.lanes[ev.t];
    if (ev.tool) { L.tool = ev.tool; L.age = 0; }
    if (ev.file) {
      if (ev.act === 'card') { S.cards[ev.file] = 'carded'; delete S.touching[ev.file]; }
      else S.touching[ev.file] = { lane: ev.t, verb: ev.act };
      if (ev.act === 'edit' && S.cards[ev.file] === 'carded' && !ev.refused) S.cards[ev.file] = 'stale';
    }
    if (ev.unread) S.unread += 1;
    if (ev.fixUnread) S.unread = Math.max(0, S.unread - 1);
    if (ev.refused) { S.transcript.push(['t', `Edit ${MAPS['ST-20'].files.find((f) => f.id === ev.file).path}`]); S.transcript.push(['no', ev.refused]); delete S.touching[ev.file]; }
    if (ev.refusedKit) { S.transcript.push(['t', ev.tool]); S.transcript.push(['no', ev.refusedKit]); S.ask = { text: ev.ask, since: 0 }; }
    if (ev.approved) { S.ask = null; S.transcript.push(['t', ev.tool, 'Approved dep-pdfjs-dist for the web lane, within the delegated rules.']); }
    if (ev.decision) S.decisions.push({ module: ev.decision, at: performance.now() });
    if (ev.loopNow) { S.loop.done = [...S.loop.done, S.loop.now].slice(-3); S.loop.now = ev.loopNow; S.loop.next = ev.loopNext; }
    if (ev.merged) {
      S.merged += 1;
      S.lanes.web = { ...S.lanes.web, st: 'working', label: 'building' };
      S.transcript.push(['t', ev.tool, 'Merged web/st-19 into main: verify passed on 9 file(s). Removed its worktree.']);
    }
    if (ev.newStory) S.lanes.web.story = ev.newStory;
    if (ev.done) { S.lanes.ingest = { ...S.lanes.ingest, st: 'review', label: 'in review' }; S.lanes.core.story = 'ST-22 Original use cases · ready once ST-20 merges'; }
    if (ev.say) S.say = ev.say;
    S.transcript = S.transcript.slice(-10);
  }

  // ---- drawing -----------------------------------------------------------------------------------
  function sprite(c, working, lead) {
    const rows = working
      ? ['..XXXX..', '..XXXX..', 'X..XX..X', '.XXXXXX.', '...XX...', '..XXXX..', '..X..X..', '.XX..XX.']
      : ['..XXXX..', '..XXXX..', '...XX...', '.XXXXXX.', 'X.XXXX.X', '..XXXX..', '..X..X..', '..X..X..'];
    const s = svg('svg', { width: 22, height: 22, viewBox: '0 0 8 8', 'shape-rendering': 'crispEdges', 'aria-hidden': 'true' });
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === 'X') s.append(svg('rect', { x, y, width: 1, height: 1, fill: c })); }));
    if (lead) [1, 3, 4, 6].forEach((x) => s.append(svg('rect', { x, y: -0.01, width: 1, height: 0.6, fill: css('--amber') })));
    return s;
  }

  function drawBand(el, S) {
    el.replaceChildren();
    const row = (k, v, cls = '') => {
      const r = h('div', 'r'); r.append(h('span', 'k', k));
      const vv = h('span', `v ${cls}`); vv.append(...[].concat(v)); r.append(vv); el.append(r); return vv;
    };
    row('goal', `Milestone 5 · the original beside the split · ${2 + S.merged} of 6 stories done`);
    const now = row('now', `lead ${S.loop.now[0]}ing ${S.loop.now[1]} · loop on  `);
    now.append(h('span', 'btnk', '[1 Pause]'));
    row('next', `${S.loop.next[0][0].toUpperCase()}${S.loop.next[0].slice(1)} ${S.loop.next[1]}`);
    const agents = h('div');
    let first = true;
    for (const lane of LANES.slice(1)) {
      const L = S.lanes[lane];
      if (!L.tool || L.st === 'idle' || L.st === 'blocked') continue;
      const r = h('div', 'r');
      r.append(h('span', 'k', first ? 'agents' : ''));
      first = false;
      const a = h('span', 'ag');
      const d = h('span'); d.append(h('span', `dot${L.age < 2 && !reduced ? ' pulse' : ''}`)); d.style.color = color(lane);
      a.append(d, h('span', '', lane), h('span', 't', L.tool), h('span', 'a', `${L.age}s`));
      r.append(a);
      agents.append(r);
    }
    el.append(agents);
    if (S.unread) row('context', `ingest edited ${S.unread} file without understanding it`, 'ctxl');
    if (S.ask) { const v = row('you', `${S.ask.text} · 1:${String(59 - S.ask.since).padStart(2, '0')}  `, 'you'); v.append(h('span', 'btnk', '[2 Approve] [3 Refuse]')); }
  }

  function drawTranscript(el, S) {
    el.replaceChildren();
    for (const [kind, a, b] of S.transcript) {
      if (kind === 't') { const d = h('div', 't'); d.append(h('b', '', '● '), a); el.append(d); if (b) el.append(h('div', '', `  ⎿ ${b}`)); }
      else if (kind === 'no') el.append(h('div', 'no', `  ⎿ ✗ ${a}`));
      else if (kind === 'm') el.append(h('div', 'm', a));
      else if (kind === 'u') el.append(h('div', 'u', `> ${a}`));
      else el.append(h('div', 't', a));
    }
  }

  function drawCounts(el, S) {
    el.replaceChildren();
    const n = (st) => Object.values(S.lanes).filter((l) => l.st === st).length;
    const add = (label, v, c) => { const s = h('span', 'cnt'); const b = h('b', '', String(v)); if (c) b.style.color = css(c); s.append(b, ` ${label}`); el.append(s); };
    add('building', n('working'), '--ok'); add('in review', n('review'), '--kit-soft'); add('blocked', n('blocked'), '--bad'); add('merged', 19 + S.merged); add('idle', n('idle'));
    el.append(h('span', 'cnt', 'plan 10%'));
  }

  function drawLanes(el, S, ui) {
    const card = h('div', 'loopcard');
    const top = h('div', 'top'); top.append(h('b', '', 'loop'), h('span', 's-working', 'acts while the lead is idle'));
    const chips = h('div', 'chips');
    for (const d of S.loop.done) chips.append(h('span', 'chip', `${d[0]} ${d[1]}`));
    chips.append(h('span', 'chip now', `now: ${S.loop.now[0]} ${S.loop.now[1]}`), h('span', 'chip next', `next: ${S.loop.next[0]} ${S.loop.next[1]}`));
    card.append(top, chips);
    el.append(card);
    const list = h('div', 'lanes');
    for (const lane of LANES) {
      const L = S.lanes[lane];
      const r = h('div', `lane${ui.selected === lane ? ' sel' : ''}`);
      r.tabIndex = 0;
      r.addEventListener('click', () => { ui.selected = lane; ui.redraw(); });
      r.append(sprite(color(lane), L.st === 'working' || L.st === 'orch', lane === 'lead'));
      const n = h('span', 'n', lane); n.style.color = color(lane); r.append(n);
      r.append(h('span', `pill s-${L.st}`, L.label));
      const w = h('span', 'w'); const st = h('span', 's', L.story);
      if (lane === 'ingest' && S.unread) { st.append(' '); st.append(h('span', 'chip warn', `${S.unread} edited unread`)); }
      w.append(st); if (L.tool && L.st !== 'idle' && L.st !== 'blocked') w.append(h('span', 'tl', `${L.tool} · ${L.age}s`));
      r.append(w, h('span', 'tok', L.tok));
      list.append(r);
      if (ui.selected === lane && lane === 'ingest') {
        const cards = h('div', 'cards');
        const sc = (id, title, state, meta, progress) => {
          const c = h('div', `scard ${state}`);
          const hd = h('div', 'h'); hd.append(h('b', '', id), h('span', `pill s-${state === 'done' ? 'idle' : state}`, { done: 'merged', working: 'building', review: 'in review', blocked: 'blocked' }[state]));
          c.append(hd, h('span', '', title), h('span', 'm', meta));
          if (progress != null) { const b = h('div', 'bar2'); const f = h('span'); f.style.width = `${Math.round(progress * 100)}%`; f.style.background = color(lane); b.append(f); c.append(b); }
          cards.append(c);
        };
        sc('ST-4', 'docx, md and txt readers', 'done', 'IMP-1 IMP-2 · 31 tests');
        sc('ST-5', 'EPUB and PDF readers', 'done', 'IMP-3 · 27 tests');
        sc('ST-13', 'Word and Markdown export', 'done', 'EXP-1 to EXP-4 · 22 tests');
        const carded = Object.values(S.cards).filter((c) => c === 'carded').length / Object.keys(S.cards).length;
        sc('ST-20', 'Source locations in every parser', S.lanes.ingest.st === 'review' ? 'review' : 'working', 'ORIG-1 ORIG-2 · ingest/st-20', carded);
        list.append(cards);
      }
    }
    el.append(list);
  }

  function drawMap(el, S, ui, { width = 760 } = {}) {
    const m = MAPS['ST-20'];
    const colW = width / LAYERS.length, nodeW = Math.min(150, colW - 16), nodeH = 42;
    const byLayer = LAYERS.map((_, i) => m.files.filter((f) => f.layer === i));
    const H = Math.max(...byLayer.map((c) => c.length)) * 60 + 44;
    const pos = {};
    byLayer.forEach((col, i) => col.forEach((f, j) => { const top = (H - 30 - col.length * 60) / 2 + 30; pos[f.id] = { x: i * colW + (colW - nodeW) / 2, y: top + j * 60 }; }));
    const s = svg('svg', { width: '100%', viewBox: `0 0 ${width} ${H}`, style: `max-width:${width * 1.5}px`, role: 'img', 'aria-label': `Code map of ${m.title}` });
    LAYERS.forEach((name, i) => s.append(svg('text', { x: i * colW + colW / 2, y: 14, 'text-anchor': 'middle', fill: css('--dim'), 'font-size': 10.5 }, name)));
    for (const [a, b] of m.edges) {
      const p = pos[a], q = pos[b];
      const fromRight = p.x > q.x;
      const x1 = fromRight ? p.x : p.x + nodeW, y1 = p.y + nodeH / 2, x2 = fromRight ? q.x + nodeW : q.x, y2 = q.y + nodeH / 2, mx = (x1 + x2) / 2;
      const live = S.touching[a] || S.touching[b];
      s.append(svg('path', { d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`, fill: 'none', stroke: live ? color((S.touching[a] ?? S.touching[b]).lane) : css('--rule-2'), 'stroke-width': live ? 1.7 : 1 }));
    }
    for (const f of m.files) {
      const p = pos[f.id], st = S.cards[f.id], act = S.touching[f.id];
      const g = svg('g', { tabindex: 0, role: 'button', 'aria-label': f.path, style: 'cursor:pointer' });
      g.addEventListener('click', () => { ui.file = f.id; ui.redraw(); });
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ui.file = f.id; ui.redraw(); } });
      if (act) g.append(svg('rect', { x: p.x - 5, y: p.y - 5, width: nodeW + 10, height: nodeH + 10, rx: 8, fill: color(act.lane), opacity: act.verb === 'edit' ? 0.42 : 0.24, class: reduced ? '' : 'pulse' }));
      const stroke = ui.file === f.id ? css('--kit-soft') : st === 'carded' ? css('--ok') : st === 'stale' ? css('--warn') : css('--rule-2');
      g.append(svg('rect', { x: p.x, y: p.y, width: nodeW, height: nodeH, rx: 5, fill: ui.file === f.id ? '#17324a' : css('--ink-2'), stroke, 'stroke-dasharray': st === 'missing' ? '4 3' : st === 'stale' ? '6 2' : 'none' }));
      g.append(svg('text', { x: p.x + 9, y: p.y + 17, fill: css('--fg'), 'font-size': 11.5 }, f.path.split('/').pop()));
      const sub = act ? `${act.lane} ${act.verb === 'edit' ? 'editing' : 'reading'}` : st === 'carded' ? '✓ has its why' : st === 'stale' ? 'why out of date' : 'no why yet';
      g.append(svg('text', { x: p.x + 9, y: p.y + 32, fill: act ? color(act.lane) : st === 'carded' ? css('--ok') : css('--warn'), 'font-size': 10 }, sub));
      s.append(g);
    }
    const box = h('div', 'svgbox'); box.append(s); el.append(box);
    const f = m.files.find((x) => x.id === ui.file) ?? m.files[4];
    const why = h('div', 'why');
    why.append(h('span', 'p', f.path), h('span', 'c', f.card), h('span', 'r', `requirements ${f.req}`));
    el.append(why);
  }

  const MODULES = [
    { id: 'L:contracts', x: 90, y: 58, rules: 2, files: 4, carded: 4 },
    { id: 'L:domain', x: 270, y: 58, rules: 3, proposed: 1, files: 14, carded: 13 },
    { id: 'L:application', x: 450, y: 58, rules: 2, files: 11, carded: 11, overridden: 'hex.dto-boundary overridden 3×' },
    { id: 'L:ports', x: 450, y: 168, rules: 1, proposed: 1, files: 6, carded: 6 },
    { id: 'L:parsers', x: 270, y: 278, rules: 1, files: 9, carded: 8 },
    { id: 'L:db', x: 450, y: 278, rules: 1, files: 8, carded: 8 },
    { id: 'L:ai', x: 630, y: 278, rules: 2, files: 6, carded: 6 },
    { id: 'L:server', x: 630, y: 168, rules: 1, files: 7, carded: 7 },
    { id: 'L:ui', x: 630, y: 58, rules: 1, proposed: 1, files: 22, carded: 21 },
  ];
  const MOD_EDGES = [['L:domain', 'L:contracts'], ['L:application', 'L:domain'], ['L:ports', 'L:application'], ['L:parsers', 'L:ports'], ['L:db', 'L:ports'], ['L:ai', 'L:ports'], ['L:server', 'L:application'], ['L:ui', 'L:contracts'], ['L:server', 'L:db'], ['L:server', 'L:ai']];

  function drawGraph(el, S) {
    const W = 720, H = 340;
    const s = svg('svg', { width: '100%', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': "Context Graph's modules for the book editor" });
    const at = Object.fromEntries(MODULES.map((m) => [m.id, m]));
    for (const [a, b] of MOD_EDGES) s.append(svg('line', { x1: at[a].x, y1: at[a].y, x2: at[b].x, y2: at[b].y, stroke: css('--rule-2') }));
    const now = performance.now();
    for (const m of MODULES) {
      const r = 27;
      if (S.decisions.some((d) => d.module === m.id && now - d.at < 3600)) s.append(svg('circle', { cx: m.x, cy: m.y, r: r + 10, fill: 'none', stroke: css('--ctx-soft'), 'stroke-width': 2, class: reduced ? '' : 'pulse' }));
      s.append(svg('circle', { cx: m.x, cy: m.y, r, fill: css('--ink-2'), stroke: m.overridden ? css('--bad') : css('--rule-2'), 'stroke-width': m.overridden ? 2 : 1 }));
      const share = m.carded / m.files, ang = share * Math.PI * 2 - 0.0001;
      s.append(svg('path', { d: `M${m.x},${m.y - r} A${r},${r} 0 ${ang > Math.PI ? 1 : 0} 1 ${m.x + r * Math.sin(ang)},${m.y - r * Math.cos(ang)}`, fill: 'none', stroke: css('--ctx'), 'stroke-width': 3.2, 'stroke-linecap': 'round' }));
      s.append(svg('text', { x: m.x, y: m.y + 4, 'text-anchor': 'middle', fill: css('--fg'), 'font-size': 10.5 }, m.id.slice(2)));
      s.append(svg('text', { x: m.x, y: m.y + r + 15, 'text-anchor': 'middle', fill: css('--dim'), 'font-size': 10 }, `${m.rules} rule${m.rules > 1 ? 's' : ''}${m.proposed ? ` +${m.proposed}?` : ''} · ${m.carded}/${m.files}`));
      if (m.overridden) s.append(svg('text', { x: m.x, y: m.y + r + 28, 'text-anchor': 'middle', fill: css('--bad'), 'font-size': 10 }, m.overridden));
    }
    const box = h('div', 'svgbox'); box.append(s); el.append(box);
  }

  // ---- the full window ---------------------------------------------------------------------------
  function mountHarness(root) {
    const term = h('div', 'term');
    const bar = h('div', 'bar'); bar.append(h('i'), h('i'), h('i'), h('span', '', 'claude — book-editor — lead/st-24'));
    const cols = h('div', 'cols');
    const left = h('div', 'left');
    const transcript = h('div', 'transcript');
    const band = h('div', 'band'); band.setAttribute('aria-live', 'off');
    const promptBox = h('div');
    const prompt = h('div', 'prompt', '> ');
    promptBox.append(prompt, h('div', 'status', 'auto mode · Opus 5.5 · 6 agents · code-kit · Context Graph'));
    left.append(transcript, band, promptBox);
    const pane = h('div', 'pane');
    const head = h('div', 'head');
    const tabs = h('div', 'tabs'); tabs.setAttribute('role', 'tablist');
    const body = h('div', 'body');
    const TABS = [['lanes', 'Lanes'], ['map', 'Code map'], ['graph', 'Graph']];
    const ui = { tab: root.dataset.tab ?? 'lanes', selected: 'ingest', file: 'pdf', redraw: () => draw() };
    for (const [id, label] of TABS) {
      const b = h('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.tab = id;
      b.append(h('span', 'hk', String(TABS.findIndex((t) => t[0] === id) + 1)), label);
      b.addEventListener('click', () => { ui.tab = id; draw(); });
      tabs.append(b);
    }
    pane.append(head, tabs, body);
    cols.append(left, pane);
    term.append(bar, cols);
    root.append(term);

    let S = freshState();
    let step = 0;
    for (; step < 3; step++) apply(S, SCRIPT[step]);
    const caption = root.dataset.caption ? document.querySelector(root.dataset.caption) : null;
    function draw() {
      drawTranscript(transcript, S); drawBand(band, S); drawCounts(head, S);
      tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === ui.tab)));
      body.replaceChildren();
      if (ui.tab === 'lanes') drawLanes(body, S, ui);
      else if (ui.tab === 'map') drawMap(body, S, ui);
      else drawGraph(body, S);
      if (caption) caption.textContent = S.say;
    }
    draw();
    let ticks = 0;
    let timer = null;
    const tick = () => {
      ticks += 1;
      for (const L of Object.values(S.lanes)) if (L.tool) L.age += 1;
      if (S.ask) S.ask.since += 1;
      if (ticks % 3 === 0) {
        if (step >= SCRIPT.length) { S = freshState(); step = 0; }
        apply(S, SCRIPT[step]);
        // The tab follows the action, unless the visitor picked one.
        if (!ui.picked) ui.tab = SCRIPT[step].file ? 'map' : SCRIPT[step].decision ? 'graph' : 'lanes';
        step += 1;
      }
      draw();
    };
    tabs.addEventListener('click', () => { ui.picked = true; });
    const play = (on) => { clearInterval(timer); timer = on ? setInterval(tick, 1000) : null; };
    const toggle = root.dataset.toggle ? document.querySelector(root.dataset.toggle) : null;
    if (toggle) toggle.addEventListener('click', () => { const on = !timer; play(on); toggle.textContent = on ? 'Pause' : 'Play'; });
    // Only while it's on screen; never under reduced motion until asked.
    if (!reduced) {
      new IntersectionObserver(([e]) => play(e.isIntersecting)).observe(root);
    } else if (toggle) toggle.textContent = 'Play';
  }

  // ---- standalone panels -------------------------------------------------------------------------
  function mountLoop(root, drawFn) {
    let S = freshState();
    let step = 0;
    const ui = { file: 'pdf', redraw: () => { root.replaceChildren(); drawFn(root, S, ui); } };
    ui.redraw();
    if (reduced) return;
    let timer = null;
    const tick = () => {
      if (step >= SCRIPT.length) { S = freshState(); step = 0; }
      apply(S, SCRIPT[step++]);
      ui.redraw();
    };
    new IntersectionObserver(([e]) => { clearInterval(timer); if (e.isIntersecting) timer = setInterval(tick, 1800); }).observe(root);
  }

  for (const el of document.querySelectorAll('[data-harness]')) mountHarness(el);
  for (const el of document.querySelectorAll('[data-codemap]')) mountLoop(el, drawMap);
  for (const el of document.querySelectorAll('[data-graph]')) mountLoop(el, (e, S) => drawGraph(e, S));

  // The hero window lies back, then sits up as it scrolls into view.
  for (const stage of document.querySelectorAll('.stage')) {
    if (reduced) { stage.classList.add('flat'); continue; }
    new IntersectionObserver(([e]) => stage.classList.toggle('flat', e.intersectionRatio > 0.55), { threshold: [0, 0.55, 1] }).observe(stage);
  }

  // Copy buttons.
  for (const b of document.querySelectorAll('[data-copy]')) {
    b.addEventListener('click', () => {
      const text = document.querySelector(b.dataset.copy)?.innerText.replace(/^› /gm, '') ?? '';
      navigator.clipboard?.writeText(text).then(() => { b.textContent = 'Copied'; setTimeout(() => (b.textContent = 'Copy'), 1600); }).catch(() => {
        const range = document.createRange(); range.selectNodeContents(document.querySelector(b.dataset.copy)); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      });
    });
  }
})();
