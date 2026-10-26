// Device catalogue.
//   w  : electrical power in watts (energy = w × duration)
//   wh : energy per use in watt-hours (no duration)
//   dc : runs in a data centre, so the facility overhead (PUE) is added
// Household values are typical ratings; sources for AI / data-centre items are
// listed in the methodology section of index.html.
// When you change a device, also update the device table in llms.txt.
window.DEVICES = [
	{ group: 'Home', items: [
		{ id: 'led', label: 'LED light bulb', w: 8 },
		{ id: 'bulb', label: 'incandescent light bulb', w: 60 },
		{ id: 'fridge', label: 'fridge (average draw)', w: 35 },
		{ id: 'kettle', label: 'electric kettle', w: 2000 },
		{ id: 'oven', label: 'oven', w: 2150 },
		{ id: 'microwave', label: 'microwave', w: 1000 },
		{ id: 'dishwasher', label: 'dishwasher', w: 1200 },
		{ id: 'washer', label: 'washing machine', w: 500 },
		{ id: 'dryer', label: 'tumble dryer', w: 2500 },
		{ id: 'heater', label: 'electric heater', w: 2000 },
		{ id: 'ac', label: 'air conditioner', w: 1000 },
		{ id: 'fan', label: 'fan', w: 50 },
		{ id: 'ev', label: 'electric car charging', w: 7400 },
	]},
	{ group: 'Screens & computers', items: [
		{ id: 'phone', label: 'smartphone charging', w: 10 },
		{ id: 'laptop', label: 'laptop', w: 50 },
		{ id: 'desktop', label: 'desktop computer', w: 200 },
		{ id: 'gaming', label: 'gaming PC', w: 450 },
		{ id: 'console', label: 'game console', w: 150 },
		{ id: 'tv', label: 'large LED TV', w: 100 },
	]},
	{ group: 'AI & data centres', items: [
		{ id: 'prompt', label: 'chatbot prompt', wh: 0.3, dc: true },
		{ id: 'longprompt', label: 'long-document prompt (~10k tokens)', wh: 2.5, dc: true },
		{ id: 'dgxh100', label: 'NVIDIA DGX H100 (8 GPUs)', w: 10200, dc: true },
		{ id: 'dgxb200', label: 'NVIDIA DGX B200 (8 GPUs)', w: 14300, dc: true },
		{ id: 'nvl72', label: 'NVIDIA GB200 NVL72 rack (72 GPUs)', w: 120000, dc: true },
	]},
	{ group: 'Other', items: [
		{ id: 'custom', label: 'a device using…', w: null },
	]},
];

// Shortcuts shown under the form.
window.PRESETS = [
	{ label: 'One chatbot prompt', d: 'prompt', n: 1, s: 1 },
	{ label: 'A billion prompts', d: 'prompt', n: 1, s: 1e9 },
	{ label: 'An evening of TV', d: 'tv', n: 1, s: 1, t: 3, u: 'h' },
	{ label: 'Charging an EV', d: 'ev', n: 1, s: 1, t: 8, u: 'h' },
	{ label: 'A fridge for a year', d: 'fridge', n: 1, s: 1, t: 1, u: 'y' },
	{ label: 'A GPU rack for a year', d: 'nvl72', n: 1, s: 1, t: 1, u: 'y' },
];
