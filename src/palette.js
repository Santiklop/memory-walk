// Biome palettes. Each locale carries a distinct time-of-day + atmosphere
// so the journey visually reads as "different places" rather than one
// re-tinted world. Extra fields (silhouetteFar/Mid, atmospheric, buildingAlt*,
// particle) drive aerial perspective and the ambient particle system.

const BIOMES = [
  { // 0 - Siberia: crisp morning, snow everywhere
    name: 'siberia',
    skyTop:        0xC8D6E4,  // pale cold blue
    skyBottom:     0xFFE5D0,  // warm low horizon
    sunColor:      0xFFECB8,
    sunY:          108,
    atmospheric:   0xE0ECF5,
    silhouetteFar: 0xA8BCCE,  // distant snowy mountains
    silhouetteMid: 0x7C8FA2,
    far:           0xA8BCCE,
    mid:           0x7C8FA2,
    near:          0xDCE6F0,
    grass:         0xEAF0F5,
    grassDark:     0xC8D5E0,
    tree:          0x2C4A3A,
    cloud:         0xFCFDFE,
    water:         0xA9C8DF,
    building:      0x5D3E2A,
    buildingDark:  0x3D2818,
    buildingTrim:  0xC4A078,
    roofAccent:    0xFFFFFF,  // snow-covered roofs
    domeGold:      0xD4A660,
    flower:        0xFFFFFF,
    particle:      0xFFFFFF,  // snowflakes
    particleType:  'snow',
  },
  { // 1 - St Petersburg: golden hour, imperial
    name: 'st_petersburg',
    skyTop:        0xCE9DB4,  // warm lavender
    skyBottom:     0xFFCFA8,  // peach gold
    sunColor:      0xFFE8B8,
    sunY:          124,
    atmospheric:   0xFFE0C0,
    silhouetteFar: 0x9F7F97,
    silhouetteMid: 0x6F5B6A,
    far:           0x9F7F97,
    mid:           0x6F5B6A,
    near:          0x88A070,
    grass:         0x7D9868,
    grassDark:     0x5C7250,
    tree:          0x4C6244,
    cloud:         0xFFE2CD,
    water:         0x6B8DA8,
    building:      0xECCAB3,  // Winter Palace pink
    buildingDark:  0x8C6D5F,
    buildingAlt1:  0xE8DCB8,  // pale yellow baroque
    buildingAlt2:  0xC9C6E2,  // pale blue
    buildingAlt3:  0xDDBBA0,  // warm sand
    buildingTrim:  0xF8EED8,
    roofAccent:    0x7B5D4C,
    domeGold:      0xE5C26E,
    flower:        0xF3D880,
    particle:      0xD4A560,  // drifting amber leaves
    particleType:  'leaves',
  },
  { // 2 - Belgium: overcast noon, medieval town
    name: 'belgium',
    skyTop:        0xCED4DA,
    skyBottom:     0xECE5D3,
    sunColor:      0xF5F1E8,
    sunY:          140,
    atmospheric:   0xDCE2DC,
    silhouetteFar: 0x7A8C75,
    silhouetteMid: 0x566A54,
    far:           0x7A8C75,
    mid:           0x5E6F58,
    near:          0x5A8B49,
    grass:         0x4A8E43,
    grassDark:     0x376734,
    tree:          0x2F5A2D,
    cloud:         0xE8E8E2,
    water:         0x6F9898,
    building:      0x8F4A36,  // warm brick red
    buildingDark:  0x5A2E1E,
    buildingAlt1:  0xA0603E,  // lighter brick
    buildingAlt2:  0x6E3825,  // darker brick
    buildingAlt3:  0xC08A5A,  // tan stone
    buildingTrim:  0xEADBB8,  // cream stone
    roofAccent:    0x3D4A52,  // dark slate
    domeGold:      0xBF8D3E,
    flower:        0xF4D770,
    particle:      0xE8E8E8,  // gentle mist
    particleType:  'mist',
  },
  { // 3 - London: grey afternoon, drizzle
    name: 'london',
    skyTop:        0x7F8C9A,
    skyBottom:     0xB5BEC8,
    sunColor:      0xBCC2CC,  // pale, barely breaks through clouds
    sunY:          150,
    atmospheric:   0xB0BBC5,
    silhouetteFar: 0x4E5C6A,  // modern skyline
    silhouetteMid: 0x3D4854,
    far:           0x4E5C6A,
    mid:           0x3D4854,
    near:          0x4E6A45,
    grass:         0x496A42,
    grassDark:     0x364F38,
    tree:          0x304534,
    cloud:         0xC5CAD4,
    water:         0x5A6D80,
    building:      0x7C3F30,  // red brick
    buildingDark:  0x2C1E18,
    buildingAlt1:  0x5A3E34,  // weathered brick
    buildingAlt2:  0x8D4A3A,
    buildingTrim:  0xC5B89A,
    roofAccent:    0x252A32,
    glassBuilding: 0x566470,  // glass tower
    redBus:        0xC83327,  // signature red accent
    domeGold:      0xB88D4A,
    flower:        0xD8B078,
    particle:      0xC5D0DC,  // rain streaks
    particleType:  'rain',
  },
  { // 4 - Amsterdam: bright midday, canals + tulips
    name: 'amsterdam',
    skyTop:        0x92C4DE,
    skyBottom:     0xE8F4FB,
    sunColor:      0xFFF1A8,
    sunY:          118,
    atmospheric:   0xC8DCE8,
    silhouetteFar: 0x9BB2BF,
    silhouetteMid: 0x7D94A2,
    far:           0x9BB2BF,
    mid:           0x7D94A2,
    near:          0x5D9D58,
    grass:         0x4D944C,
    grassDark:     0x3A6F3D,
    tree:          0x3D6B33,
    cloud:         0xFBFDFF,
    water:         0x4E9FC0,  // bright canal
    building:      0xB06E4A,  // terracotta
    buildingDark:  0x5A3422,
    buildingAlt1:  0x8F4A30,
    buildingAlt2:  0xCB8568,
    buildingAlt3:  0xDC9A6B,
    buildingAlt4:  0x7A3E28,
    buildingTrim:  0xF5E8D0,
    roofAccent:    0x5A3422,
    domeGold:      0xCFA150,
    flower:        0xE6383C,  // tulip red
    particle:      0xFF8A3D,  // drifting tulip petals
    particleType:  'petals',
  },
];

function lerpColor(c1, c2, t) {
  const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return (r << 16) | (g << 8) | b;
}

function toCssColor(c) {
  return '#' + c.toString(16).padStart(6, '0');
}
