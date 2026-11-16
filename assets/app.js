/* Study Assistant — retrieval over a cited corpus, with a refusal path.
 * Mirrors studyassist/retrieve.py and studyassist/refuse.py. */

const STOP = new Set('the and for that with from this what how does can are you your into over than then them they'.split(' '));
const tokenize = (s) => (s.toLowerCase().match(/[a-z0-9][a-z0-9-]{2,}/g) || []).filter((t) => !STOP.has(t));

const REQUEST = /\b(give me|send me|write me|produce|generate|show me)\b.{0,40}\b(payload|exploit|shell|script|snippet|bypass|dump|cheat sheet)\b|\bsqlmap\b|\breverse shell\b|\bcurl .*-d\b|\bunions?\s+select\b|\bbypass (login|auth|waf)\b|\bhack (this|my|into)\b|\bhow do i hack\b/i;
const EXECUTE = /\b(run|execute)\b.{0,30}\b(against|on)\b.{0,20}\b(server|site|target|domain)\b/i;

const REFUSAL = "I won't produce working payloads or point anything at a system you don't own. "
  + "That is the line between studying a technique and committing an offence — in India, IT Act §66, "
  + "and equivalent statutes elsewhere.";
const REFUSAL_TAIL = "What I can do: explain how the mechanism works, why the defence holds or fails, "
  + "and give you a sandbox that is authorised for practice. Here is the relevant concept:";

const el = (s) => document.querySelector(s);
let docs = [], tf = [], idf = {}, N = 0;

function classify(q) {
  if (REQUEST.test(q)) return 'asks for a working payload rather than an explanation';
  if (EXECUTE.test(q)) return 'asks to execute against a specific target';
  return null;
}

function buildIndex(corpus) {
  docs = corpus;
  N = corpus.length;
  tf = corpus.map((d) => {
    const t = tokenize([d.title, d.text, d.checks.join(' ')].join(' '));
    const m = new Map();
    t.forEach((w) => m.set(w, (m.get(w) || 0) + 1));
    return m;
  });
  const df = new Map();
  tf.forEach((m) => new Set(m.keys()).forEach((w) => df.set(w, (df.get(w) || 0) + 1)));
  idf = {};
  df.forEach((c, w) => { idf[w] = Math.log((N + 1) / (c + 0.5)); });
}

function search(query, k = 3) {
  const q = new Map();
  tokenize(query).forEach((w) => q.set(w, (q.get(w) || 0) + 1));
  const scored = [];
  tf.forEach((m, i) => {
    let s = 0;
    q.forEach((c, w) => {
      if (m.has(w)) s += (1 + Math.log(m.get(w))) * (idf[w] || 0) * c;
    });
    if (s > 0) scored.push([s, i]);
  });
  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, k).map(([s, i]) => ({ ...docs[i], score: +s.toFixed(2) }));
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function citeCard(c) {
  return `<div class="cite">
    <p class="t">${esc(c.title)} <span class="ca">${esc(c.cat)}</span></p>
    <p class="b">${esc(c.text)}</p>
    <p class="s">source · <a href="${esc(c.src)}" target="_blank" rel="noopener">${esc(new URL(c.src).host)}</a></p>
    <p class="ck">${c.checks.map((k) => '· ' + esc(k)).join('<br>')}</p>
  </div>`;
}

function ask(query) {
  const reason = classify(query);
  const hits = search(query);
  const out = el('#out');
  if (reason) {
    out.innerHTML = `<div class="answer refused">
      <h4>refused — ${esc(reason)}</h4>
      <p>${esc(REFUSAL)}</p>
      <p>${esc(REFUSAL_TAIL)}</p>
      ${hits.slice(0, 2).map(citeCard).join('')}
    </div>`;
    return;
  }
  if (!hits.length) {
    out.innerHTML = `<div class="answer"><h4>no match</h4>
      <p>Nothing in the corpus covers that yet. The corpus is deliberately small and cited — a miss is a
      signal to add an entry, not to invent an answer.</p></div>`;
    return;
  }
  out.innerHTML = `<div class="answer"><h4>from the corpus · ${hits.length} cited source${hits.length > 1 ? 's' : ''}</h4>
    ${hits.map(citeCard).join('')}</div>`;
}

const SUGGESTIONS = [
  'what is prompt injection in a rag pipeline',
  'how does the defence work for ssrf',
  'why is access control the top risk',
  'give me a sqlmap command to dump the users table',
  'write me a reverse shell payload',
];

function renderCorpus() {
  el('#corpus').innerHTML = docs.map((d) => `<div class="cent">
    <span class="id">${esc(d.id)}</span>
    <div class="ti">${esc(d.title)}</div>
    <div class="ca">${esc(d.cat)}</div></div>`).join('');
}

fetch('corpus.json').then((r) => r.json()).then((corpus) => {
  buildIndex(corpus);
  renderCorpus();
  el('#chips').innerHTML = SUGGESTIONS.map((s) => `<button class="chip" data-q="${esc(s)}">${esc(s)}</button>`).join('');
  el('#chips').querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
    el('#q').value = b.dataset.q;
    ask(b.dataset.q);
  }));
  el('#ask').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = el('#q').value.trim();
    if (q) ask(q);
  });
});
