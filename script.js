'use strict';

const PUE = 1.2;          // data-centre overhead (cooling, power conversion)
const ICE_PER_TONNE = 3;  // m² of September Arctic sea ice lost per tonne of CO₂ (Notz & Stroeve, 2016)
const HOURS = { min: 1 / 60, h: 1, d: 24, w: 168, y: 8760 };
// The floe animation spans 0.1 mm² (intact) … 1 km² (almost gone) on a log scale.
const LOG_MIN = -7, LOG_MAX = 6;

const $ = id => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sig3 = new Intl.NumberFormat('en', { maximumSignificantDigits: 3 });
const sig2 = new Intl.NumberFormat('en', { maximumSignificantDigits: 2 });

/* ---------- formatting ---------- */

function fmtArea(m2) {
	if (m2 <= 0) return '0 mm²';
	if (m2 < 1e-4) return sig3.format(m2 * 1e6) + ' mm²';
	if (m2 < 0.01) return sig3.format(m2 * 1e4) + ' cm²';
	if (m2 < 1e6) return sig3.format(m2) + ' m²';
	return sig3.format(m2 / 1e6) + ' km²';
}

function fmtUnits(x, units) {
	let i = 0;
	while (i < units.length - 1 && x >= 1000) { x /= 1000; i++; }
	return sig3.format(x) + ' ' + units[i];
}
const fmtEnergy = wh => fmtUnits(wh, ['Wh', 'kWh', 'MWh', 'GWh', 'TWh']);
const fmtMass = g => fmtUnits(g, ['g', 'kg', 't', 'kt', 'Mt']);
const fmtPower = w => fmtUnits(w, ['W', 'kW', 'MW']);

// Familiar objects to give the area a sense of scale (m²).
const REFS = [
	[2e-7, 'a grain of sand', n => `${n} grains of sand`],
	[2e-6, 'a pinhead', n => `${n} pinheads`],
	[1e-4, 'a fingernail', n => `${n} fingernails`],
	[6e-4, 'a postage stamp', n => `${n} postage stamps`],
	[4.6e-3, 'a credit card', n => `${n} credit cards`],
	[6.24e-2, 'an A4 sheet of paper', n => `${n} A4 sheets of paper`],
	[1.9, 'a door', n => `${n} doors`],
	[3.2, 'a double bed', n => `${n} double beds`],
	[12.5, 'a parking space', n => `${n} parking spaces`],
	[261, 'a tennis court', n => `${n} tennis courts`],
	[7140, 'a football pitch', n => `${n} football pitches`],
	[3.41e6, 'Central Park', n => `${n} × Central Park`],
	[4.15e8, 'the city of Vienna', n => `${n} × the area of Vienna`],
];

function compare(m2) {
	if (m2 <= 0) return '';
	if (m2 < REFS[0][0] * 0.5) return 'Smaller than a grain of sand.';
	let ref = REFS[0];
	for (const r of REFS) if (r[0] <= m2 * 1.25) ref = r;
	const ratio = m2 / ref[0];
	if (ratio < 1.5) return `About the size of ${ref[1]}.`;
	return `About ${ref[2](sig2.format(ratio))}.`;
}

/* ---------- form ---------- */

const devices = {};
for (const g of DEVICES) {
	const og = document.createElement('optgroup');
	og.label = g.group;
	for (const d of g.items) {
		devices[d.id] = d;
		const info = d.w ? fmtPower(d.w) : d.wh ? `${d.wh} Wh each` : '';
		og.append(new Option(info ? `${d.label} · ${info}` : d.label, d.id));
	}
	$('device').append(og);
}

const countries = {};
for (const [label, list] of [['Averages', INTENSITY.regions], ['Countries', INTENSITY.countries]]) {
	const og = document.createElement('optgroup');
	og.label = label;
	for (const c of list) {
		countries[c.iso] = c;
		og.append(new Option(c.name, c.iso));
	}
	$('country').append(og);
}

function guessCountry() {
	try {
		const region = new Intl.Locale(navigator.language).maximize().region;
		if (region === 'US') return 'USA';
		const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(region);
		const hit = INTENSITY.countries.find(c => c.name === name);
		if (hit) return hit.iso;
	} catch (e) { /* fall back to the world average */ }
	return 'WORLD';
}

const FIELDS = { d: 'device', n: 'count', s: 'scale', t: 'duration', u: 'unit', c: 'country', w: 'custom' };

function setField(id, value) {
	const el = $(id);
	if (value == null) return;
	if (el.tagName === 'SELECT' && ![...el.options].some(o => o.value === String(value))) return;
	el.value = value;
}

function applyState(state) {
	for (const [key, id] of Object.entries(FIELDS)) setField(id, state[key]);
	updateVisibility();
	compute();
}

function updateVisibility() {
	const d = devices[$('device').value];
	$('custom-wrap').hidden = d.id !== 'custom';
	$('duration-wrap').hidden = !!d.wh;
}

function num(id) {
	const v = parseFloat($(id).value);
	return Number.isFinite(v) && v > 0 ? v : 0;
}

function compute() {
	const d = devices[$('device').value];
	const quantity = num('count') * Number($('scale').value);
	let wh = d.wh
		? d.wh * quantity
		: (d.id === 'custom' ? num('custom') : d.w) * num('duration') * HOURS[$('unit').value] * quantity;
	if (d.dc) wh *= PUE;
	const c = countries[$('country').value];
	const co2 = wh / 1000 * c.g;                // g
	const area = co2 / 1e6 * ICE_PER_TONNE;     // m²

	$('energy').textContent = fmtEnergy(wh);
	$('co2').textContent = fmtMass(co2);
	$('grid').textContent = `${c.g} g/kWh (${c.year})`;
	$('compare').textContent = compare(area);
	target = area;
	targetL = area > 0 ? Math.log10(area) : LOG_MIN - 1;

	const params = new URLSearchParams();
	params.set('d', d.id);
	params.set('n', $('count').value);
	params.set('s', $('scale').value);
	if (!d.wh) { params.set('t', $('duration').value); params.set('u', $('unit').value); }
	if (d.id === 'custom') params.set('w', $('custom').value);
	params.set('c', c.iso);
	history.replaceState(null, '', '?' + params);
}

for (const p of PRESETS) {
	const b = document.createElement('button');
	b.type = 'button';
	b.textContent = p.label;
	b.addEventListener('click', () => applyState({ t: 1, u: 'h', ...p }));
	$('presets').append(b);
}

$('calc').addEventListener('input', () => { updateVisibility(); compute(); });
$('pue-value').textContent = PUE;
$('data-updated').textContent = `retrieved ${INTENSITY.updated}`;

/* ---------- ice floe ---------- */

const SVGNS = 'http://www.w3.org/2000/svg';
const CX = 500, CY = 268, SQUASH = 0.36, THICK = 14 / SQUASH;
const RINGS = [0, 0.34, 0.58, 0.8, 1];
const SECTORS = [1, 5, 7, 10];
// Melt fraction at which the pieces of each ring break off (outer ring first).
const BREAK = [null, [0.72, 0.88], [0.5, 0.7], [0.05, 0.48]];

function mulberry32(seed) {
	return () => {
		seed = seed + 0x6D2B79F5 | 0;
		let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
const rand = mulberry32(42);

const outline = a => 225 * (1 + 0.07 * Math.sin(3 * a + 1.3) + 0.05 * Math.sin(5 * a + 0.4) + 0.025 * Math.sin(9 * a + 2.1));
function ringR(k, a) {
	if (k === RINGS.length - 1) return outline(a);
	return outline(a) * (RINGS[k] + 0.035 * Math.sin(4 * a + k * 1.7) + 0.02 * Math.sin(11 * a + k));
}
const pt = (r, a) => [r * Math.cos(a), r * Math.sin(a)];

function arc(k, a0, a1) {
	const steps = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 0.07));
	const pts = [];
	for (let i = 0; i <= steps; i++) {
		const a = a0 + (a1 - a0) * i / steps;
		pts.push(pt(ringR(k, a), a));
	}
	return pts;
}

const pieces = [];
function buildFloe() {
	const sides = $('floe-sides'), tops = $('floe-tops');
	for (let k = 0; k < SECTORS.length; k++) {
		const n = SECTORS[k];
		const start = rand() * Math.PI * 2;
		const cuts = [];
		for (let i = 0; i < n; i++) {
			cuts.push({
				a: start + (i + (rand() - 0.5) * 0.5) * 2 * Math.PI / n,
				bend: (rand() - 0.5) * 0.25,
			});
		}
		const ringPieces = [];
		for (let i = 0; i < n; i++) {
			let pts;
			if (k === 0) {
				pts = arc(1, 0, Math.PI * 2);
			} else {
				const c0 = cuts[i], c1 = cuts[(i + 1) % n];
				const a0 = c0.a, a1 = c1.a + (i === n - 1 ? Math.PI * 2 : 0);
				const mid = (c, a) => pt((ringR(k, a) + ringR(k + 1, a)) / 2, a + c.bend / (k + 1));
				pts = [...arc(k + 1, a0, a1), mid(c1, a1), ...arc(k, a1, a0), mid(c0, a0)];
			}
			const d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
			const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
			const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
			const side = document.createElementNS(SVGNS, 'path');
			side.setAttribute('d', d);
			side.setAttribute('fill', k === 0 ? '#7fb3cc' : '#8dbfd6');
			const top = document.createElementNS(SVGNS, 'path');
			top.setAttribute('d', d);
			top.setAttribute('fill', 'url(#g-ice)');
			top.setAttribute('stroke', '#a9d3e6');
			top.setAttribute('stroke-width', '1.2');
			top.setAttribute('vector-effect', 'non-scaling-stroke');
			sides.append(side);
			tops.append(top);
			const piece = {
				ring: k, side, top, cx, cy,
				dir: Math.atan2(cy, cx),
				drift: 110 + rand() * 170,
				spin: (rand() - 0.5) * 70,
				phase: rand() * 6.28,
				pos: 0,
			};
			ringPieces.push(piece);
			pieces.push(piece);
		}
		// Spread the break-off thresholds of this ring over its range, in random order.
		if (BREAK[k]) {
			const [lo, hi] = BREAK[k];
			ringPieces.sort(() => rand() - 0.5).forEach((p, i) => {
				p.threshold = lo + (i + rand() * 0.8) / ringPieces.length * (hi - lo);
			});
		}
	}
}

const ripples = [];
function spawnRipple(scale) {
	const a = rand() * Math.PI * 2;
	const r = outline(a) * scale * 1.02;
	const el = document.createElementNS(SVGNS, 'ellipse');
	el.setAttribute('class', 'ripple');
	el.setAttribute('cx', (CX + r * Math.cos(a)).toFixed(1));
	el.setAttribute('cy', (CY + (r * Math.sin(a) + THICK) * SQUASH).toFixed(1));
	$('ripples').append(el);
	ripples.push({ el, age: 0 });
}

/* ---------- animation loop ---------- */

let target = 0, targetL = LOG_MIN - 1, curL = LOG_MIN - 1, last = 0, shownText = '', shownHeat = '';
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function frame(now) {
	const t = now / 1000;
	const dt = Math.min(0.1, last ? t - last : 0);
	last = t;

	// Ease the (log) area towards its target, never slower than 0.35 decade per second.
	const diff = targetL - curL;
	if (reducedMotion || Math.abs(diff) < 1e-3) curL = targetL;
	else curL += Math.sign(diff) * Math.min(Math.abs(diff), Math.max(Math.abs(diff) * (1 - Math.exp(-0.9 * dt)), 0.35 * dt));
	const f = Math.min(1, Math.max(0, (curL - LOG_MIN) / (LOG_MAX - LOG_MIN)));

	const text = curL === targetL ? fmtArea(target) : fmtArea(curL < LOG_MIN - 0.99 ? 0 : 10 ** curL);
	if (text !== shownText) $('area').textContent = shownText = text;
	const heat = f.toFixed(3);
	if (heat !== shownHeat) document.documentElement.style.setProperty('--heat', shownHeat = heat);

	const scale = 1 - 0.1 * f;
	const coreScale = 1 - 0.45 * smooth(0.88, 1, f);
	const bob = reducedMotion ? 0 : Math.sin(t * 1.1) * 2.5;
	$('floe').setAttribute('transform', `translate(${CX} ${(CY + bob).toFixed(2)}) scale(${scale.toFixed(4)} ${(scale * SQUASH).toFixed(4)})`);

	let reach = RINGS[1] * coreScale, melting = Math.abs(targetL - curL) > 0.02;
	for (const p of pieces) {
		let s = 1, tx = 0, ty = 0, rot = 0, op = 1;
		if (p.ring === 0) {
			s = coreScale;
		} else {
			const goal = f > p.threshold ? 1 : 0;
			if (reducedMotion) p.pos = goal;
			else if (goal > p.pos) p.pos = Math.min(1, p.pos + dt / 5);
			else if (goal < p.pos) p.pos = Math.max(0, p.pos - dt / 1.2);
			if (p.pos > 0 && p.pos < 1) melting = true;
			if (p.pos < 0.5) reach = Math.max(reach, RINGS[p.ring + 1]);
			const e = 1 - (1 - p.pos) ** 3;
			tx = Math.cos(p.dir) * p.drift * e;
			ty = Math.sin(p.dir) * p.drift * e + Math.sin(t * 1.3 + p.phase) * 6 * p.pos;
			rot = p.spin * e;
			s = 1 - 0.5 * e;
			op = 1 - smooth(0.45, 1, p.pos);
		}
		const tr = `translate(${(tx + p.cx).toFixed(1)} ${(ty + p.cy).toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${s.toFixed(3)}) translate(${-p.cx.toFixed(1)} ${-p.cy.toFixed(1)})`;
		p.top.setAttribute('transform', tr);
		p.side.setAttribute('transform', `translate(0 ${THICK}) ` + tr);
		p.top.setAttribute('opacity', op.toFixed(3));
		p.side.setAttribute('opacity', op.toFixed(3));
	}

	const shadow = $('floe-shadow');
	shadow.setAttribute('rx', (232 * scale * reach).toFixed(1));
	shadow.setAttribute('ry', (232 * scale * reach * SQUASH + 4).toFixed(1));
	shadow.setAttribute('cy', (CY + 16 + bob).toFixed(1));

	$('penguin-pos').setAttribute('transform', `translate(${CX} ${(CY + bob).toFixed(2)})`);
	const penguin = $('penguin');
	penguin.classList.toggle('sad', f > 0.25);
	penguin.classList.toggle('shiver', f > 0.9);

	if (!reducedMotion && dt > 0 && rand() < dt * (melting ? 7 : 0.7)) spawnRipple(scale * reach);
	for (let i = ripples.length - 1; i >= 0; i--) {
		const r = ripples[i];
		r.age += dt / 1.8;
		if (r.age >= 1) { r.el.remove(); ripples.splice(i, 1); continue; }
		const rx = 3 + 26 * r.age;
		r.el.setAttribute('rx', rx.toFixed(1));
		r.el.setAttribute('ry', (rx * 0.32).toFixed(1));
		r.el.setAttribute('opacity', (0.55 * (1 - r.age)).toFixed(3));
	}

	requestAnimationFrame(frame);
}

/* ---------- start ---------- */

buildFloe();
const params = Object.fromEntries(new URLSearchParams(location.search));
applyState(params.d ? params : { d: 'prompt', n: 1, s: 1e6, c: guessCountry() });
requestAnimationFrame(frame);
