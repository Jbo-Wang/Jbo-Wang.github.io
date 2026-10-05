const burgundy = {
  id: 'burgundy',
  robot: '#663a48',
  face: '#874b5e',
  side: '#b99da5',
  edge: '#ffffff',
  accent: '#873c55',
  metalness: 0.18,
  roughness: 0.5,
};

const palettes = [
  { id: 'graphite', name: 'Graphite', robot: '#34383d', face: '#43484e', side: '#92989f', edge: '#ffffff', accent: '#424b55', metalness: 0.2, roughness: 0.52 },
  { id: 'petrol', name: 'Petrol', robot: '#31545a', face: '#47727a', side: '#a8bfc2', edge: '#ffffff', accent: '#2b656e', metalness: 0.25, roughness: 0.44 },
  { ...burgundy, name: 'Burgundy' },
];

export function mountPalettePicker(apply, { visible = false } = {}) {
  let saved;
  try { saved = localStorage.getItem('homepage-scene-palette'); } catch {}
  const initial = palettes.find(palette => palette.id === saved) || palettes[2];
  if (!visible) {
    apply(initial);
    return;
  }
  const panel = document.createElement('aside');
  panel.className = 'scene-palettes';
  panel.setAttribute('aria-label', 'Scene palette');
  const name = document.createElement('output');
  name.setAttribute('aria-live', 'polite');
  const choices = document.createElement('div');
  choices.className = 'scene-palette-choices';
  function select(palette, persist = true) {
    apply(palette);
    name.textContent = palette.name;
    for (const button of choices.children) button.setAttribute('aria-pressed', String(button.dataset.palette === palette.id));
    if (persist) try { localStorage.setItem('homepage-scene-palette', palette.id); } catch {}
  }
  for (const palette of palettes) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.palette = palette.id;
    button.style.setProperty('--swatch', palette.face);
    button.title = palette.name;
    button.setAttribute('aria-label', palette.name);
    button.addEventListener('click', () => select(palette));
    choices.append(button);
  }
  panel.append(name, choices);
  document.body.append(panel);
  select(initial, false);
}
