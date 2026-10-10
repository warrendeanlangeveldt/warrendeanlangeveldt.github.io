// The live replay on the site: a Claude Code session building the book editor with code-kit and Context
// Graph. The maps are drawn by the plugins' own drawing code (assets/vendor/, copied unchanged by
// scripts/vendor.sh) from the book editor's real files, so they look exactly as they do in Claude Code:
// an SVG in the desktop app, box-drawing text in the terminal. The events replay a script; nothing here
// talks to a server.
import { glowOf, mapRows, mapSvg, neighboursOf, cardOf } from './vendor/code-kit/codemap.mjs';
import { graphGrid, graphLayout, graphSvg } from './vendor/context-graph/graph.mjs';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const h = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const LANES = ['lead', 'core', 'data', 'ai', 'ingest', 'web'];
const color = (lane) => css(`--${lane}`) || css('--dim');

const [STORY, MODULES] = await Promise.all(
  [new URL('./data/st19.json', import.meta.url), new URL('./data/modules.json', import.meta.url)].map((u) => fetch(u).then((r) => r.json())),
);
const MODULE_OF = (path) => {
  // The deepest module whose files list the path.
  let best = null;
  for (const m of MODULES) if (m.files.some((f) => f.path === path) && (!best || m.depth > best.depth)) best = m;
  return best?.id ?? null;
};

// ---- the script --------------------------------------------------------------------------------
// Each event: the agent, its tool call, the file it touches (read, edit or a card written), and what the
// caption says. The web agent builds ST-19, a settings screen where you paste your own API key.
const SCRIPT = [
  { t: 'web', tool: 'Read src/ui/api.ts', file: 'src/ui/api.ts', act: 'read', say: 'The agent building the web pages (the “web” agent) reads the code its new screen will call, all of it, before changing anything.' },
  { t: 'ingest', tool: 'Bash npm test', say: 'Meanwhile the agent that reads uploaded books (the “ingest” agent) runs its tests on its own task.' },
  { t: 'web', tool: 'Read src/server/http.ts', file: 'src/server/http.ts', act: 'read', say: 'The web agent reads the server code too. Context Graph keeps track of what each agent has actually read.' },
  { t: 'web', tool: 'Edit src/server/services.ts', file: 'src/server/services.ts', act: 'edit', say: 'Now it changes services.ts. The file lights up in the web agent’s colour, and its note (its “why”) is now out of date.' },
  { t: 'web', tool: 'Edit src/app/api/settings/api-key/route.ts', file: 'src/app/api/settings/api-key/route.ts', act: 'edit', say: 'It adds the endpoint that saves your key. The key never goes back to the browser, only its last four characters.' },
  { t: 'web', tool: 'Bash ctx card src/server/services.ts', file: 'src/server/services.ts', act: 'card', decision: true, say: 'It rewrites services.ts’s note: what the file is for and what it must keep true. The next agent reads this first.' },
  { t: 'web', tool: 'Edit src/ui/SettingsForm.tsx', file: 'src/ui/SettingsForm.tsx', act: 'edit', refused: 'Context Graph: SettingsForm.tsx was only seen in a search. Read it in full before editing it.', say: 'It tries to change SettingsForm.tsx having only glanced at it in a search. Context Graph refuses: read the file first.' },
  { t: 'web', tool: 'Read src/ui/SettingsForm.tsx', file: 'src/ui/SettingsForm.tsx', act: 'read', say: 'So it reads SettingsForm.tsx properly.' },
  { t: 'web', tool: 'Edit src/ui/SettingsForm.tsx', file: 'src/ui/SettingsForm.tsx', act: 'edit', say: 'The same change, made with the whole file read, is allowed.' },
  { t: 'web', tool: 'Bash npm install zxcvbn', refusedKit: 'code-kit: a new library (zxcvbn) needs approval. Ask the lead, or the person.', ask: 'web wants to install zxcvbn', say: 'The web agent wants a new library. code-kit stops it until someone approves, and asks you above the prompt.' },
  { t: 'lead', tool: 'Bash code-kit requests', approvedNot: true, say: 'It isn’t needed for the task, so the lead tells the agent to do without it. Nothing was installed.' },
  { t: 'web', tool: 'Bash ctx card src/ui/SettingsForm.tsx', file: 'src/ui/SettingsForm.tsx', act: 'card', decision: true, say: 'Its note is updated too. Every file this task touched now explains itself again.' },
  { t: 'web', tool: 'Bash npm run test:e2e  (63 passed)', file: 'e2e/settings.spec.ts', act: 'read', say: 'It runs the browser tests that click through the settings screen. They pass, and the task goes to the lead for review.' },
  { t: 'lead', tool: 'Read src/app/settings/page.tsx', file: 'src/app/settings/page.tsx', act: 'read', review: true, say: 'The lead, which plans and hands out the work, reviews the screen against what the spec asked for.' },
  { t: 'lead', tool: 'code-kit queue merge --delegated', merged: true, say: 'Before merging, code-kit runs every check again against the latest code. It passes, so the lead merges it.' },
];

function freshState() {
  const cards = Object.fromEntries(STORY.files.map((f) => [f.path, cardOf(f)?.state ?? 'missing']));
  return {
    now: 0,
    lanes: {
      lead: { st: 'orch', label: 'orchestrating', story: 'ST-24 Make the new contract fields required · waits on ST-23', tool: 'waiting for ST-19', age: 9, tok: '4.5M' },
      core: { st: 'blocked', label: 'blocked', story: 'ST-22 Original use cases · waits on ST-20', tool: '', age: 0, tok: '1.1M' },
      data: { st: 'idle', label: 'idle', story: '3 stories merged', tool: '', age: 0, tok: '640k' },
      ai: { st: 'idle', label: 'idle', story: '2 stories merged', tool: '', age: 0, tok: '820k' },
      ingest: { st: 'working', label: 'building', story: 'ST-20 Source locations in every parser · ingest/st-20', tool: 'Read src/adapters/parsers/pdf.ts', age: 6, tok: '96k' },
      web: { st: 'working', label: 'building', story: 'ST-19 Settings: your own key · web/st-19', tool: 'Read src/ui/api.ts', age: 2, tok: '148k' },
    },
    cards,
    touches: [],
    decisionsAt: {},
    unread: 0,
    merged: 0,
    ask: null,
    loop: { done: [['merge', 'core/st-18'], ['review', 'ST-17'], ['dispatch', 'ST-19 ST-20']], now: ['wait', 'lanes building'], next: ['review', 'ST-19'] },
    transcript: [
      ['u', 'Next milestone: let me paste my own API key in settings, and show the original page beside the paragraph split.'],
      ['p', 'Written up as requirements ORIG-1 to ORIG-5 and KEY-1 to KEY-3. Handing out ST-19 (web) and ST-20 (ingest).'],
      ['t', 'Agent(Build ST-19 Settings: your own key)', 'Backgrounded agent · web-engineer'],
      ['t', 'Agent(Build ST-20 Source locations in every parser)', 'Backgrounded agent · ingest-engineer'],
      ['p', 'Both are building. I’ll review each as it comes back.'],
    ],
    say: 'A lead agent and several specialist agents are building a book editor. Watch what each one does.',
  };
}

function apply(S, ev) {
  S.now += 3000;
  const L = S.lanes[ev.t];
  if (ev.tool) { L.tool = ev.tool; L.age = 0; }
  if (ev.file && !ev.refused) {
    if (ev.act === 'card') S.cards[ev.file] = 'current';
    else S.touches.push({ path: ev.file, verb: ev.act === 'edit' ? 'edit' : 'read', lane: ev.t, at: S.now });
    if (ev.act === 'edit') S.cards[ev.file] = 'stale';
  }
  if (ev.refused) { S.unread += 1; S.transcript.push(['t', ev.tool]); S.transcript.push(['no', ev.refused]); }
  if (ev.act === 'read' && S.unread) S.unread = 0;
  if (ev.decision) { const m = MODULE_OF(ev.file); if (m) S.decisionsAt[m] = S.now; }
  if (ev.refusedKit) { S.transcript.push(['t', ev.tool]); S.transcript.push(['no', ev.refusedKit]); S.ask = { text: ev.ask, since: 0 }; }
  if (ev.approvedNot) { S.ask = null; S.transcript.push(['p', 'zxcvbn isn’t in the spec for ST-19. Do without it; a strength check isn’t a requirement.']); }
  if (ev.review) { S.lanes.web = { ...S.lanes.web, st: 'review', label: 'in review' }; S.loop = { ...S.loop, done: [...S.loop.done.slice(-2), S.loop.now], now: ['review', 'ST-19'], next: ['merge', 'web/st-19'] }; }
  if (ev.merged) {
    S.merged += 1;
    S.lanes.web = { ...S.lanes.web, st: 'idle', label: 'idle', story: '5 stories merged' };
    S.loop = { done: [...S.loop.done.slice(-2), S.loop.now], now: ['merge', 'web/st-19'], next: ['dispatch', 'ST-23'] };
    S.transcript.push(['t', ev.tool, 'Merged web/st-19 into main: every check passed on 12 files.']);
  }
  S.say = ev.say;
  S.transcript = S.transcript.slice(-9);
}

// The story's map as the plugin reads it, with the cards as they stand in the replay.
const storyNow = (S) => ({
  ...STORY,
  files: STORY.files.map((f) => ({ ...f, adapters: { 'context-graph': { card: { state: S.cards[f.path], text: cardOf(f)?.text ?? '' } } } })),
});
const modulesNow = (S) =>
  MODULES.map((m) => ({ ...m, files: m.files.map((f) => (S.cards[f.path] ? { ...f, card: S.cards[f.path] } : f)) }));

// ---- drawing -----------------------------------------------------------------------------------
function sprite(c, working, lead) {
  const NS = 'http://www.w3.org/2000/svg';
  const rows = working
    ? ['..XXXX..', '..XXXX..', 'X..XX..X', '.XXXXXX.', '...XX...', '..XXXX..', '..X..X..', '.XX..XX.']
    : ['..XXXX..', '..XXXX..', '...XX...', '.XXXXXX.', 'X.XXXX.X', '..XXXX..', '..X..X..', '..X..X..'];
  const s = document.createElementNS(NS, 'svg');
  for (const [k, v] of Object.entries({ width: 22, height: 22, viewBox: '0 0 8 8', 'shape-rendering': 'crispEdges', 'aria-hidden': 'true' })) s.setAttribute(k, v);
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch !== 'X') return;
    const rect = document.createElementNS(NS, 'rect');
    for (const [k, v] of Object.entries({ x, y, width: 1, height: 1, fill: c })) rect.setAttribute(k, v);
    s.append(rect);
  }));
  if (lead) [1, 3, 4, 6].forEach((x) => { const r = document.createElementNS(NS, 'rect'); for (const [k, v] of Object.entries({ x, y: 0, width: 1, height: 0.6, fill: css('--amber') })) r.setAttribute(k, v); s.append(r); });
  return s;
}

function drawBand(el, S) {
  el.replaceChildren();
  const row = (k, v, cls = '') => { const r = h('div', 'r'); r.append(h('span', 'k', k)); const vv = h('span', `v ${cls}`); vv.append(...[].concat(v)); r.append(vv); el.append(r); return vv; };
  row('goal', `Milestone 5: your own key, and the original beside the split · ${2 + S.merged} of 9 stories done`);
  const now = row('now', `lead ${S.loop.now[0] === 'wait' ? 'waiting: lanes building' : `${S.loop.now[0]} ${S.loop.now[1]}`} · loop on  `);
  now.append(h('span', 'btnk', '[1 Pause]'));
  row('next', `${S.loop.next[0][0].toUpperCase()}${S.loop.next[0].slice(1)} ${S.loop.next[1]}`);
  let first = true;
  for (const lane of LANES) {
    const L = S.lanes[lane];
    if (lane === 'lead' || !L.tool || L.st === 'idle' || L.st === 'blocked') continue;
    const r = h('div', 'r'); r.append(h('span', 'k', first ? 'agents' : '')); first = false;
    const a = h('span', 'ag');
    const d = h('span'); d.append(h('span', `dot${L.age < 2 && !reduced ? ' pulse' : ''}`)); d.style.color = color(lane);
    a.append(d, h('span', '', lane), h('span', 't', L.tool), h('span', 'a', `${L.age}s`));
    r.append(a); el.append(r);
  }
  if (S.unread) row('context', `web edited ${S.unread} file without reading it first`, 'ctxl');
  if (S.ask) { const v = row('you', `${S.ask.text} · 1:${String(59 - S.ask.since).padStart(2, '0')}  `, 'you'); v.append(h('span', 'btnk', '[2 Approve] [3 Refuse]')); }
}

function drawTranscript(el, S) {
  el.replaceChildren();
  for (const [kind, a, b] of S.transcript) {
    if (kind === 't') { const d = h('div', 't'); d.append(h('b', '', '● '), a); el.append(d); if (b) el.append(h('div', '', `  ⎿ ${b}`)); }
    else if (kind === 'no') el.append(h('div', 'no', `  ⎿ ✗ ${a}`));
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

// The state words as the terminal colours them (no boxes around them: the terminal draws plain text).
const STATE_CLASS = { working: 's-working', review: 's-review', blocked: 's-blocked', idle: 's-idle', orch: 's-orch' };
function drawLanes(el, S, ui) {
  const card = h('div', 'loopcard');
  const top = h('div', 'top'); top.append(h('b', '', 'loop'), h('span', 's-working', 'acts while the lead is idle'));
  const chips = h('div', 'chips');
  for (const d of S.loop.done) chips.append(h('span', 'chip', `${d[0]} ${d[1]}`));
  chips.append(h('span', 'chip next', `next: ${S.loop.next[0]} ${S.loop.next[1]}`));
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
    r.append(h('span', `st ${STATE_CLASS[L.st]}`, L.label));
    const w = h('span', 'w'); const st = h('span', 's', L.story);
    if (lane === 'web' && S.unread) { st.append(' '); st.append(h('span', 'chip warn', `${S.unread} edited unread`)); }
    w.append(st); if (L.tool && L.st !== 'idle' && L.st !== 'blocked') w.append(h('span', 'tl', `${L.tool} · ${L.age}s`));
    r.append(w, h('span', 'tok', L.tok));
    list.append(r);
  }
  el.append(list);
}

// The terminal drawing: the plugin's runs, as coloured text, styled as the mod styles each run.
const shade = (hex, share) => {
  const n = Number.parseInt(String(hex).replace('#', ''), 16);
  const c = (v) => Math.round(((n >> v) & 0xff) * share + 14 * (1 - share));
  return `#${[16, 8, 0].map((v) => c(v).toString(16).padStart(2, '0')).join('')}`;
};
const RUN_CSS = {
  // No bold here: a browser's bold box-drawing characters are wider than its regular ones, where a
  // terminal's are not. Colour carries the emphasis instead.
  dim: 'color:var(--dim)', node: '', selected: 'color:#5fd7ff', ok: 'color:var(--ok)', warn: 'color:var(--warn)',
};
function runCss(r) {
  const tint = r.lane ? color(r.lane) : null;
  if (tint && (r.style === 'fill-read' || r.style === 'fill-edit'))
    return `background:${shade(tint, r.style === 'fill-edit' ? 0.45 : 0.28)};color:#fff`;
  if (tint && (r.style === 'reading' || r.style === 'editing')) return `color:${tint}`;
  return RUN_CSS[r.style] ?? '';
}
function preOf(rows) {
  const pre = h('pre', 'tdraw');
  for (const runs of rows) {
    for (const r of runs) { const s = h('span', '', r.text); const st = runCss(r); if (st) s.setAttribute('style', st); pre.append(s); }
    pre.append('\n');
  }
  return pre;
}
function svgBox(markup) {
  const box = h('div', 'svgbox');
  box.innerHTML = markup.replace(/<svg ([^>]*?)width="(\d+)" height="(\d+)"/, (m, rest, w) => `<svg ${rest}width="100%" style="max-width:${Math.round(w * 1.25)}px"`);
  return box;
}

function surfaceSwitch(ui, redraw) {
  const bar = h('div', 'surface');
  bar.append(h('span', '', 'Drawn as in'));
  for (const [id, label] of [['desktop', 'the desktop app'], ['terminal', 'the terminal']]) {
    const b = h('button', '', label); b.type = 'button'; b.setAttribute('aria-pressed', String(ui.surface === id));
    b.addEventListener('click', () => { ui.surface = id; redraw(); });
    bar.append(b);
  }
  return bar;
}

function drawMap(el, S, ui) {
  const map = storyNow(S);
  const glow = glowOf(S.touches, S.now, 7000);
  const files = map.files.map((f) => f.path);
  const selected = files.includes(ui.file) ? ui.file : files[0];
  el.append(surfaceSwitch(ui, ui.redraw));
  const tints = Object.fromEntries(LANES.map((l) => [l, color(l)]));
  if (ui.surface === 'terminal') el.append(preOf(mapRows(map, { glow, selected, width: 96 })));
  else el.append(svgBox(mapSvg(map, { glow, selected, tints, width: 110 })));
  const f = map.files.find((x) => x.path === selected);
  const card = cardOf(f);
  const near = neighboursOf(map, selected);
  const why = h('div', 'why');
  why.append(h('span', 'p', selected), h('span', 'r', `${f.layer} · ${f.lane} lane`));
  why.append(h('span', 'c', card?.state === 'missing' ? 'No why written yet.' : card?.text ?? ''));
  if (card?.state === 'stale') why.append(h('span', 'r', 'The file changed since its why was written.'));
  if (near.imports.length) why.append(h('span', 'r', `uses ${near.imports.map((p) => p.split('/').pop()).join(', ')}`));
  const keys = h('div', 'mapkeys');
  const at = files.indexOf(selected);
  for (const [label, step] of [['j  next file', 1], ['k  previous', -1]]) {
    const b = h('button', '', label); b.type = 'button';
    b.addEventListener('click', () => { ui.file = files[(at + step + files.length) % files.length]; ui.redraw(); });
    keys.append(b);
  }
  el.append(why, keys);
}

function drawGraph(el, S, ui) {
  const map = modulesNow(S);
  const pulsing = new Set(Object.entries(S.decisionsAt).filter(([, at]) => S.now - at < 6000).map(([id]) => id));
  const layout = graphLayout(map, { width: 96 });
  el.append(surfaceSwitch(ui, ui.redraw));
  if (ui.surface === 'terminal') {
    const rows = graphGrid(map, layout, { pulsing, beat: ui.beat ?? 0 });
    // The graph's runs are [text, style], with the mod's own Text styles.
    const pre = h('pre', 'tdraw');
    for (const runs of rows) {
      for (const [text, st] of runs) {
        const s = h('span', '', text);
        const parts = [];
        if (st?.dimColor) parts.push('color:var(--dim)');
        if (st?.color) parts.push(`color:${{ cyan: '#5fd7ff', blue: '#8fb8ff', red: 'var(--bad)' }[st.color] ?? st.color}`);
        if (parts.length) s.setAttribute('style', parts.join(';'));
        pre.append(s);
      }
      pre.append('\n');
    }
    el.append(pre);
  } else el.append(svgBox(graphSvg(map, layout, { pulsing })));
}

// ---- the full window ---------------------------------------------------------------------------
function mountHarness(root) {
  const term = h('div', 'term');
  const bar = h('div', 'bar'); bar.append(h('i'), h('i'), h('i'), h('span', '', 'claude — book-editor — lead/st-24'));
  const cols = h('div', 'cols');
  const left = h('div', 'left');
  const transcript = h('div', 'transcript');
  const band = h('div', 'band');
  const promptBox = h('div');
  promptBox.append(h('div', 'prompt', '> '), h('div', 'status', 'auto mode · 3 agents at work · code-kit · Context Graph'));
  left.append(transcript, band, promptBox);
  const pane = h('div', 'pane');
  const head = h('div', 'head');
  const tabs = h('div', 'tabs'); tabs.setAttribute('role', 'tablist');
  const body = h('div', 'body');
  const TABS = [['lanes', 'Lanes'], ['map', 'Code map'], ['graph', 'Graph']];
  const ui = { tab: 'lanes', selected: 'web', file: null, surface: 'desktop', picked: false, redraw: () => draw() };
  for (const [id, label] of TABS) {
    const b = h('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.dataset.tab = id;
    b.append(h('span', 'hk', String(TABS.findIndex((t) => t[0] === id) + 1)), label);
    b.addEventListener('click', () => { ui.tab = id; ui.picked = true; draw(); });
    tabs.append(b);
  }
  pane.append(head, tabs, body);
  cols.append(left, pane);
  term.append(bar, cols);
  root.append(term);

  let S = freshState();
  let step = 0;
  const caption = root.dataset.caption ? document.querySelector(root.dataset.caption) : null;
  function draw() {
    drawTranscript(transcript, S); drawBand(band, S); drawCounts(head, S);
    tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === ui.tab)));
    body.replaceChildren();
    if (ui.tab === 'lanes') drawLanes(body, S, ui);
    else if (ui.tab === 'map') drawMap(body, S, ui);
    else drawGraph(body, S, ui);
    if (caption) caption.textContent = S.say;
  }
  draw();
  let ticks = 0;
  let timer = null;
  const tick = () => {
    ticks += 1;
    ui.beat = ticks;
    for (const L of Object.values(S.lanes)) if (L.tool) L.age += 1;
    if (S.ask) S.ask.since += 1;
    if (ticks % 4 === 0) {
      if (step >= SCRIPT.length) { S = freshState(); step = 0; }
      const ev = SCRIPT[step];
      apply(S, ev);
      if (ev.file) ui.file = ev.file;
      // The tab follows the action, unless the visitor picked one.
      if (!ui.picked) ui.tab = ev.decision ? 'graph' : ev.file ? 'map' : 'lanes';
      step += 1;
    }
    draw();
  };
  const play = (on) => { clearInterval(timer); timer = on ? setInterval(tick, 1000) : null; };
  const toggle = root.dataset.toggle ? document.querySelector(root.dataset.toggle) : null;
  if (toggle) toggle.addEventListener('click', () => { const on = !timer; play(on); toggle.textContent = on ? 'Pause' : 'Play'; });
  if (!reduced) new IntersectionObserver(([e]) => play(e.isIntersecting)).observe(root);
  else if (toggle) toggle.textContent = 'Play';
}

// ---- standalone drawings -----------------------------------------------------------------------
function mountLoop(root, drawFn, surface = 'desktop') {
  let S = freshState();
  let step = 0;
  const ui = { file: null, surface, beat: 0, redraw: () => { root.replaceChildren(); drawFn(root, S, ui); } };
  ui.redraw();
  if (reduced) return;
  let timer = null;
  let ticks = 0;
  const tick = () => {
    ticks += 1;
    ui.beat = ticks;
    if (ticks % 2 === 0) {
      if (step >= SCRIPT.length) { S = freshState(); step = 0; }
      const ev = SCRIPT[step++];
      apply(S, ev);
      if (ev.file) ui.file = ev.file;
    }
    ui.redraw();
  };
  new IntersectionObserver(([e]) => { clearInterval(timer); if (e.isIntersecting) timer = setInterval(tick, 1000); }).observe(root);
}

for (const el of document.querySelectorAll('[data-harness]')) mountHarness(el);
for (const el of document.querySelectorAll('[data-codemap]')) mountLoop(el, drawMap, el.dataset.surface);
for (const el of document.querySelectorAll('[data-graph]')) mountLoop(el, drawGraph, el.dataset.surface);

// The hero window lies back, then sits up as it scrolls into view.
for (const stage of document.querySelectorAll('.stage')) {
  if (reduced) { stage.classList.add('flat'); continue; }
  new IntersectionObserver(([e]) => stage.classList.toggle('flat', e.intersectionRatio > 0.55), { threshold: [0, 0.55, 1] }).observe(stage);
}

// Copy buttons.
for (const b of document.querySelectorAll('[data-copy]')) {
  b.addEventListener('click', () => {
    const target = document.querySelector(b.dataset.copy);
    const text = [...target.childNodes].filter((n) => n !== b).map((n) => n.textContent).join('').replace(/^› /gm, '');
    navigator.clipboard?.writeText(text).then(() => { b.textContent = 'Copied'; setTimeout(() => (b.textContent = 'Copy'), 1600); }).catch(() => {
      const range = document.createRange(); range.selectNodeContents(target); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
    });
  });
}
