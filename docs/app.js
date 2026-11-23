(function () {
  const { cleanAndSplit, extractClaims, draftFormats, checkText } = window.RIQ;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let state = { doc: null, drafts: [], active: 0 };

  function load(post) {
    const doc = cleanAndSplit(post);
    const ex = extractClaims(doc);
    const drafts = draftFormats(doc, ex, {}).map(d => ({ ...d, original: d.text }));
    state = { doc, drafts, claims: ex.claims, active: 0 };
    $('stats').textContent = doc.passages.length + ' passages · ' + ex.claims.length + ' contain numbers · ' + doc.wordCount + ' words';
    $('claims').innerHTML = ex.claims.slice(0, 20).map(c => '<li><code>' + c.passage + '</code> ' + esc(c.sentence) + '</li>').join('') || '<li>No numbers found.</li>';
    renderTabs();
    show(0);
  }

  function status(d) { return checkText(d.text, state.doc.passages); }

  function renderTabs() {
    $('tabs').innerHTML = state.drafts.map((d, i) => {
      const r = status(d);
      return '<button class="tab" role="tab" aria-selected="' + (i === state.active) + '" data-i="' + i + '"><span class="dot' + (r.issues.length ? ' bad' : '') + '"></span>' + esc(d.format) + '</button>';
    }).join('');
    [...$('tabs').children].forEach(b => b.onclick = () => show(+b.dataset.i));
  }

  function show(i) {
    state.active = i;
    const d = state.drafts[i];
    $('draft').value = d.text;
    $('draftMeta').textContent = 'Built from passages ' + d.sources.join(', ') + (d.text !== d.original ? ' · edited' : '');
    renderCheck();
    renderTabs();
  }

  function renderCheck() {
    const d = state.drafts[state.active];
    const r = status(d);
    const el = $('check');
    if (r.issues.length) { el.className = 'check bad'; el.innerHTML = '<b>Blocked.</b> ' + r.issues.map(esc).join('; '); }
    else { el.className = 'check ok'; el.innerHTML = '<b>Pass.</b> ' + r.numbersChecked + ' number' + (r.numbersChecked === 1 ? '' : 's') + ' matched to their source sentences.'; }
  }

  $('draft').addEventListener('input', e => {
    const d = state.drafts[state.active];
    d.text = e.target.value;
    $('draftMeta').textContent = 'Built from passages ' + d.sources.join(', ') + (d.text !== d.original ? ' · edited' : '');
    renderCheck();
    renderTabs();
  });

  $('useOwn').onclick = () => {
    const text = $('ownText').value.trim();
    if (text.length < 200) { alert('Paste at least a few paragraphs.'); return; }
    const html = text.split(/\n\s*\n/).map(p => '<p>' + esc(p) + '</p>').join('');
    load({ title: $('ownTitle').value.trim() || 'Your article', subtitle: '', canonical_url: 'https://example.com/your-article', body_html: html });
  };

  fetch('samples.json').then(r => r.json()).then(samples => {
    $('sample').innerHTML = samples.map((s, i) => '<option value="' + i + '">' + esc(s.title) + '</option>').join('');
    $('sample').onchange = () => load(samples[+$('sample').value]);
    load(samples[0]);
  });
})();
