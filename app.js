/* Sprint Planner */
let id = Date.now();
const nieuweSprint = () => ({ doel: '', naam: '', start: '', duur: 2, vel: 40, foc: 80, team: [{ id: id++, naam: 'Teamlid 1', dagen: 10 }], items: [{ id: id++, titel: '', pt: 0, zeker: false }] });
let s = opslag.lees('sprint.v1', null) || nieuweSprint();
const werkdagen = () => s.duur * 5;
function reken() {
  const max = s.team.length * werkdagen(), dagen = s.team.reduce((t, m) => t + (+m.dagen || 0), 0);
  const budget = max ? Math.round(s.vel * (dagen / max) * (s.foc / 80)) : 0;   // velocity is gemeten bij een normale focus (80%)
  const gepland = s.items.reduce((t, i) => t + (+i.pt || 0), 0);
  return { max, dagen, budget, gepland, rest: budget - gepland };
}
function team() {
  $('#team').innerHTML = s.team.map((m, i) => `<div class="it"><i class="mdi mdi-account" style="color:var(--accent)"></i><input data-t="${i}" data-k="naam" value="${esc(m.naam)}" placeholder="Naam">
    <input class="num" type="number" min="0" max="${werkdagen()}" step="0.5" data-t="${i}" data-k="dagen" value="${m.dagen}"><span class="unit">/ ${werkdagen()} d</span>
    <button type="button" class="ib" data-tdel="${i}" title="Verwijderen"><i class="mdi mdi-close"></i></button></div>`).join('');
}
function backlog() {
  const r = reken(); let som = 0;
  $('#backlog').innerHTML = s.items.map((it, i) => { som += +it.pt || 0; const over = som > r.budget && (+it.pt || 0) > 0;
    return `<div class="it ${over ? 'over' : ''}"><span class="nr">${i + 1}</span><input type="checkbox" class="chk" data-i="${i}" data-k="zeker" ${it.zeker ? 'checked' : ''} title="Moet zeker mee">
    <input data-i="${i}" data-k="titel" value="${esc(it.titel)}" placeholder="Omschrijving of ticketnummer">
    <input class="num" type="number" min="0" max="100" data-i="${i}" data-k="pt" value="${it.pt || ''}" placeholder="pt"><span class="unit">pt</span>
    <button type="button" class="ib" data-mv="${i}" ${i ? '' : 'disabled'} title="Omhoog"><i class="mdi mdi-arrow-up"></i></button>
    <button type="button" class="ib" data-idel="${i}" title="Verwijderen"><i class="mdi mdi-close"></i></button></div>`; }).join('');
}
function samenvatting() {
  const r = reken();
  $('#stats').innerHTML = [[r.dagen + ' / ' + r.max, 'Mensdagen'], [r.budget, 'Punten die passen'], [r.gepland, 'Gepland'], [r.rest >= 0 ? r.rest : '+' + -r.rest, r.rest >= 0 ? 'Nog ruimte' : 'Te veel']]
    .map(([w, l]) => `<div class="stat"><b>${w}</b><small>${l}</small></div>`).join('');
  const pct = r.budget ? Math.min(100, Math.round(r.gepland / r.budget * 100)) : 0, over = r.gepland > r.budget;
  const kl = over ? 'var(--bad)' : pct > 90 ? 'var(--warn)' : 'var(--ok)';
  $('#bar').style.width = (over ? 100 : pct) + '%'; $('#bar').style.background = kl; $('#capic').style.color = kl;
  $('#captitel').textContent = over ? `${r.gepland - r.budget} punten te veel gepland` : pct > 90 ? 'Bijna vol' : 'Capaciteit';
  $('#capsub').textContent = `${s.duur} ${s.duur === 1 ? 'week' : 'weken'} · ${s.team.length} ${s.team.length === 1 ? 'teamlid' : 'teamleden'} · focus ${s.foc}%`;
  $('#teamsub').textContent = `Beschikbare werkdagen in deze sprint (max ${werkdagen()})`;
  opslag.schrijf('sprint.v1', s);
}
function velden() {
  $('#doel').value = s.doel; $('#naam').value = s.naam; $('#start').value = s.start; $('#duur').value = s.duur; $('#vel').value = s.vel; $('#foc').value = s.foc;
  $('#duurv').textContent = `${s.duur} ${s.duur === 1 ? 'week' : 'weken'}`; $('#velv').textContent = s.vel; $('#focv').textContent = s.foc + '%';
}
const alles = () => { velden(); team(); backlog(); samenvatting(); };
for (const k of ['doel', 'naam', 'start']) $('#' + k).oninput = (e) => { s[k] = e.target.value; samenvatting(); };
$('#duur').oninput = (e) => { const oud = werkdagen(); s.duur = +e.target.value; s.team.forEach((m) => { if (+m.dagen === oud || +m.dagen > werkdagen()) m.dagen = werkdagen(); }); alles(); };
$('#vel').oninput = (e) => { s.vel = +e.target.value; velden(); backlog(); samenvatting(); };
$('#foc').oninput = (e) => { s.foc = +e.target.value; velden(); backlog(); samenvatting(); };
$('#team').oninput = (e) => { const d = e.target.dataset; if (d.t == null) return; s.team[+d.t][d.k] = d.k === 'dagen' ? Math.min(werkdagen(), Math.max(0, +e.target.value)) : e.target.value; backlog(); samenvatting(); };
$('#team').onclick = (e) => { const b = e.target.closest('[data-tdel]'); if (!b || s.team.length < 2) return; s.team.splice(+b.dataset.tdel, 1); alles(); };
$('#addlid').onclick = () => { s.team.push({ id: id++, naam: `Teamlid ${s.team.length + 1}`, dagen: werkdagen() }); alles(); $$('#team input')[($$('#team input').length - 2)]?.select(); };
$('#backlog').oninput = (e) => { const d = e.target.dataset; if (d.i == null) return; const it = s.items[+d.i];
  if (d.k === 'zeker') it.zeker = e.target.checked; else if (d.k === 'pt') it.pt = Math.max(0, +e.target.value || 0); else it.titel = e.target.value;
  if (d.k === 'pt') { const pos = e.target.selectionStart; backlog(); const el = $(`#backlog [data-i="${d.i}"][data-k="pt"]`); el.focus(); try { el.setSelectionRange(pos, pos); } catch (x) { /* number */ } }
  samenvatting(); };
$('#backlog').onclick = (e) => { const b = e.target.closest('[data-idel],[data-mv]'); if (!b) return;
  if (b.dataset.mv) { const i = +b.dataset.mv; [s.items[i - 1], s.items[i]] = [s.items[i], s.items[i - 1]]; }
  else { s.items.splice(+b.dataset.idel, 1); if (!s.items.length) s.items.push({ id: id++, titel: '', pt: 0, zeker: false }); }
  backlog(); samenvatting(); };
$('#additem').onclick = () => { s.items.push({ id: id++, titel: '', pt: 0, zeker: false }); backlog(); samenvatting(); $$('#backlog [data-k="titel"]').pop().focus(); };
function tekst(md) {
  const r = reken(), b = md ? '**' : '', l = md ? '- ' : '  - ';
  const items = s.items.filter((i) => i.titel || i.pt);
  return [md ? `## ${s.naam || 'Sprint'}` : (s.naam || 'Sprint'), s.doel ? `${b}Sprintdoel:${b} ${s.doel}` : null, s.start ? `${b}Start:${b} ${new Date(s.start).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })} (${s.duur} ${s.duur === 1 ? 'week' : 'weken'})` : null,
    `${b}Capaciteit:${b} ${r.dagen} mensdagen · ${r.budget} punten (velocity ${s.vel}, focus ${s.foc}%)`, `${b}Gepland:${b} ${r.gepland} punten${r.rest < 0 ? ` (${-r.rest} te veel!)` : ` (${r.rest} ruimte)`}`, '',
    `${b}Team${b}`, ...s.team.map((m) => `${l}${m.naam}: ${m.dagen} ${+m.dagen === 1 ? 'dag' : 'dagen'}`), '',
    `${b}Backlog${b}`, ...items.map((i) => `${md ? (i.zeker ? '- [x] ' : '- [ ] ') : l}${i.titel || '(zonder titel)'} · ${i.pt || 0} pt${i.zeker && !md ? ' (moet mee)' : ''}`)]
    .filter((x) => x !== null).join('\n').replace(/\n{3,}/g, '\n\n');
}
$('#copytxt').onclick = () => kopieer(tekst(false), 'Samenvatting gekopieerd');
$('#copymd').onclick = () => kopieer(tekst(true), 'Markdown gekopieerd');
$('#nieuw').onclick = () => { if (!confirm('Nieuwe sprint beginnen? Team, velocity en focus blijven, de backlog wordt leeggemaakt.')) return; const oud = s; s = nieuweSprint(); s.team = oud.team; s.vel = oud.vel; s.foc = oud.foc; s.duur = oud.duur; alles(); };
alles();
