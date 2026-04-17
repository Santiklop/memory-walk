// Biome palettes — smooth palette shifts along the level create a Rayman-like painterly feel.
// Each biome defines sky gradient (top/bottom), mountains (far/mid), hills (near), tree, grass, accent.

const BIOMES = [
  { // 0 - childhood morning: soft dawn, dewy grass
    name: 'childhood',
    skyTop:     0xFFE5C2,
    skyBottom:  0xFFC1A0,
    sunColor:   0xFFE9B0,
    sunY:       120,
    far:        0xB8A4D4,
    mid:        0x7A94B8,
    near:       0x6AA070,
    grass:      0x4F8A54,
    grassDark:  0x3D6E43,
    tree:       0x2E6A3A,
    cloud:      0xFFFFFF,
  },
  { // 1 - late teens / university: warm honey afternoon
    name: 'university',
    skyTop:     0xFFD89C,
    skyBottom:  0xFFB58A,
    sunColor:   0xFFE09C,
    sunY:       130,
    far:        0xC9A990,
    mid:        0xA08066,
    near:       0x8BA860,
    grass:      0x6B9C4A,
    grassDark:  0x507A36,
    tree:       0x4E7A2E,
    cloud:      0xFFF4E0,
  },
  { // 2 - career & wedding: rose-gold hour, romantic
    name: 'love',
    skyTop:     0xFFC6D9,
    skyBottom:  0xFFA08E,
    sunColor:   0xFFE1C2,
    sunY:       110,
    far:        0xD7A2B8,
    mid:        0xB47D92,
    near:       0xA8C27D,
    grass:      0x8BAE60,
    grassDark:  0x6C8A47,
    tree:       0x5C8546,
    cloud:      0xFFE6EE,
  },
  { // 3 - Belgium / London: grey-blue overcast, mysterious
    name: 'europe',
    skyTop:     0xA7B6C9,
    skyBottom:  0xCFD8E3,
    sunColor:   0xE3E9F2,
    sunY:       140,
    far:        0x6C7F94,
    mid:        0x536578,
    near:       0x556B3D,
    grass:      0x4A6D3F,
    grassDark:  0x395430,
    tree:       0x355024,
    cloud:      0xDFE4EC,
  },
  { // 4 - Amsterdam: canals, tulips, bright
    name: 'amsterdam',
    skyTop:     0xB5DDF5,
    skyBottom:  0xE8F4FB,
    sunColor:   0xFFEEA8,
    sunY:       120,
    far:        0x8FAFC9,
    mid:        0xA0704E,
    near:       0x5F9E56,
    grass:      0x4F8E46,
    grassDark:  0x3C6D38,
    tree:       0x3A6A28,
    cloud:      0xFFFFFF,
  },
  { // 5 - finale sunset: golden hour celebration
    name: 'finale',
    skyTop:     0xFFB96B,
    skyBottom:  0xFF7E87,
    sunColor:   0xFFF1A8,
    sunY:       110,
    far:        0x8C5A8A,
    mid:        0x6D3A67,
    near:       0x7C8F5A,
    grass:      0x5E7A3D,
    grassDark:  0x4A5F30,
    tree:       0x3F5426,
    cloud:      0xFFD5A8,
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
