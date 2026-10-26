# deviceMeltedIce

How much Arctic sea ice is lost because of the electricity you use — from a light bulb to a billion AI prompts.

Live at https://www.mgravey.com/deviceMeltedIce/

## How it works

electricity (kWh) × grid carbon intensity (gCO₂/kWh) × 3 m² of September Arctic sea ice per tonne of CO₂
([Notz & Stroeve, 2016](https://doi.org/10.1126/science.aag2345)).
Data-centre equipment (AI prompts, GPU servers) also gets a PUE overhead of 1.2.
The full methodology and sources are on the page.

## Files

- `index.html`, `style.css`, `script.js` — the static site (no build step, no dependencies)
- `data/devices.js` — device list and the example shortcuts
- `data/intensity.js` — carbon intensity per country, generated from [Ember](https://ember-energy.org/data/yearly-electricity-data/) (CC-BY-4.0)
- `tools/update_intensity.py` — regenerates `data/intensity.js`
- `llms.txt` — method, data, devices and URL parameters for AI assistants ([llmstxt.org](https://llmstxt.org/)); update it when devices or the data change

## Updating the grid data

```sh
python3 tools/update_intensity.py
```

Run it once a year after Ember publishes new data.
