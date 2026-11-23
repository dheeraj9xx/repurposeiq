// RepurposeIQ core logic. Each function body is pasted into an n8n Code node.
// No AI model: extractive templates + claim preservation check.

function cleanAndSplit(post) {
  const html = post.body_html || '';
  const text = html
    .replace(/<(script|style|figure|figcaption)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|h[1-6]|li|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;|&quot;/g, '"').replace(/&#8212;|&mdash;/g, ', ')
    .replace(/&#8211;|&ndash;/g, ' to ').replace(/&#\d+;/g, ' ')
    .replace(/[ \t]+/g, ' ');
  const paras = text.split('\n').map(s => s.trim()).filter(s => s.length > 40);
  const passages = [];
  if (post.title) passages.push({ id: 'T', para: 0, text: post.title.trim() });
  if (post.subtitle) passages.push({ id: 'P00', para: 0, text: post.subtitle.trim() });
  paras.forEach((p, pi) => {
    const sents = p.split(/(?<=[.!?]["')\]]?)\s+(?=[A-Z0-9"'(])/);
    sents.map(s => s.trim()).filter(s => s.length > 25 && !/https?:\/\/|^Sources?:/i.test(s)).forEach(s => {
      passages.push({ id: 'P' + String(passages.length + 1).padStart(2, '0'), para: pi + 1, text: s });
    });
  });
  return {
    title: post.title, subtitle: post.subtitle || '', url: post.canonical_url,
    published: post.post_date, wordCount: text.split(/\s+/).filter(Boolean).length,
    passages,
  };
}

const NUM_RE = /(?:[$₹€£]\s?)?\d[\d,]*(?:\.\d+)?\s?(?:%|x|million|billion|thousand|k|M|B)?/gi;

function extractClaims(doc) {
  const claims = [];
  for (const p of doc.passages) {
    const nums = (p.text.match(NUM_RE) || []).map(n => n.trim()).filter(n => /\d/.test(n) && !/^(19|20)\d{2}$/.test(n.replace(/,/g, '')));
    if (nums.length) claims.push({ passage: p.id, numbers: nums, sentence: p.text });
  }
  // score passages: claims, named sources, contrast words, position
  const scored = doc.passages.filter(p => p.id !== 'T').map((p, i) => {
    let s = 0;
    if (claims.find(c => c.passage === p.id)) s += 3;
    if (/\b(study|report|analy[sz]ed|data|found|survey|research|according)\b/i.test(p.text)) s += 2;
    if (/\b(but|instead|not|stopped|never|only|now)\b/i.test(p.text)) s += 1;
    if (i < 4) s += 1;
    if (p.text.length > 260) s -= 1;
    if (p.text.length < 70) s -= 2;
    if (p.id === 'P00') s += 2;
    return { ...p, score: s };
  }).sort((a, b) => b.score - a.score);
  return { claims, ranked: scored };
}

function draftFormats(doc, ex, opts) {
  const top = ex.ranked.slice(0, 8);
  const byId = id => doc.passages.find(p => p.id === id);
  const keyClaim = ex.ranked.find(p => ex.claims.find(c => c.passage === p.id)) || top[0];
  const takeaways = top.filter(p => p.id !== keyClaim.id).slice(0, 4);
  const cta = opts.cta || doc.url;
  const src = list => list.map(p => p.id);
  const drafts = [];
  drafts.push({ format: 'LinkedIn post', sources: src([keyClaim, ...takeaways.slice(0, 3)]), text:
    `${doc.title}\n\n${keyClaim.text}\n\n` + takeaways.slice(0, 3).map(t => `• ${t.text}`).join('\n') +
    `\n\nFull breakdown: ${cta}` });
  drafts.push({ format: 'X thread', sources: src([keyClaim, ...takeaways]), text:
    [`1/ ${doc.title}`, `2/ ${keyClaim.text}`, ...takeaways.slice(0, 3).map((t, i) => `${i + 3}/ ${t.text}`), `${takeaways.slice(0, 3).length + 3}/ Read it here: ${cta}`].join('\n\n') });
  drafts.push({ format: 'Newsletter teaser', sources: src([keyClaim]), text:
    `${doc.subtitle || keyClaim.text}\n\nThe detail worth your two minutes: ${keyClaim.text}\n\nRead the issue: ${cta}` });
  drafts.push({ format: 'Carousel outline (6 slides)', sources: src([keyClaim, ...takeaways]), text:
    [`Slide 1 (hook): ${doc.title}`, `Slide 2 (the evidence): ${keyClaim.text}`, ...takeaways.slice(0, 3).map((t, i) => `Slide ${i + 3}: ${t.text}`), `Slide 6 (CTA): Full issue at ${cta}`].join('\n') });
  drafts.push({ format: 'Short video script (45s)', sources: src([keyClaim, takeaways[0]]), text:
    `[0-3s HOOK] ${doc.title}\n[3-15s] ${keyClaim.text}\n[15-35s] ${takeaways[0] ? takeaways[0].text : ''}\n[35-45s CTA] Link in the caption.` });
  drafts.push({ format: 'Sales follow-up email', sources: src([keyClaim, takeaways[0]]), text:
    `Subject: ${doc.title}\n\nHi {{first_name}},\n\nThought this was relevant to what we discussed: ${keyClaim.text}\n\n${takeaways[0] ? takeaways[0].text : ''}\n\nWorth 15 minutes to look at how this applies to you?\n\n${cta}` });
  drafts.push({ format: 'Quote cards (3)', sources: src([keyClaim, ...takeaways.slice(0, 2)]), text:
    [keyClaim, ...takeaways.slice(0, 2)].map((p, i) => `Card ${i + 1}: "${p.text}"`).join('\n') });
  return drafts.map(d => ({ ...d, status: 'Needs review', chars: d.text.length, sourceText: d.sources.map(id => byId(id)?.text) }));
}

const TEMPLATE_RE = /https?:\/\/\S+|\{\{[^}]+\}\}|\[\d+-\d+s[^\]]*\]|^\d+\/|Slide \d+|Card \d+|\(\d+ slides\)|\(\d+s\)|\(3\)|Worth 15 minutes/gm;
function words(x) { return x.toLowerCase().replace(/[^a-z0-9%.,$ ]/g, ' ').split(/\s+/).filter(Boolean); }
function checkText(text, passages) {
  const clean = text.replace(TEMPLATE_RE, ' ');
  const nums = (clean.match(NUM_RE) || []).map(n => n.trim()).filter(n => /\d/.test(n));
  const issues = [];
  const lines = clean.split(/\n+|(?<=[.!?])\s+/).map(l => l.replace(/^[^:\n]{0,60}:\s+/, '').replace(/^[•"\s]+|["\s]+$/g, ''));
  for (const n of [...new Set(nums)]) {
    const homes = passages.filter(p => p.text.includes(n));
    if (!homes.length) { issues.push('"' + n + '" is not in the source'); continue; }
    const line = lines.find(l => l.includes(n)) || '';
    const lw = new Set(words(line));
    const lwa = [...lw];
    const best = Math.max(...homes.map(h => { const hw = new Set(words(h.text)); return lwa.filter(w => hw.has(w)).length / Math.max(1, lwa.length); }));
    if (best < 0.85) issues.push('"' + n + '" appears with different wording than its source sentence');
  }
  return { numbersChecked: [...new Set(nums)].length, issues };
}
function claimCheck(doc, drafts) {
  let flagged = 0;
  const checked = drafts.map(d => {
    const r = checkText(d.text, doc.passages);
    if (r.issues.length) flagged++;
    return { ...d, ...r, claimCheck: r.issues.length ? 'FLAGGED' : 'PASS' };
  });
  return { drafts: checked, summary: { drafts: checked.length, numbersChecked: checked.reduce((a, d) => a + d.numbersChecked, 0), flagged } };
}

window.RIQ = { cleanAndSplit, extractClaims, draftFormats, claimCheck, checkText };
