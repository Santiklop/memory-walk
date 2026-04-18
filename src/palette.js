// Locale palettes — each stretch of the journey now maps to a real place.
// The colors drive the procedural scenery in background.js.

const BIOMES = [
  { // 0 - Siberia childhood
    name: 'siberia',
    skyTop:       0xD6E7F7,
    skyBottom:    0xF7FBFF,
    sunColor:     0xFFF4C4,
    sunY:         96,
    far:          0xA6BCD0,
    mid:          0x7B95AF,
    near:         0xD8E3ED,
    grass:        0xECF3FA,
    grassDark:    0xC8D7E6,
    tree:         0x2C4258,
    cloud:        0xF9FDFF,
    water:        0xA9C8DF,
    building:     0xCAB9A6,
    buildingDark: 0x7D6A58,
    roofAccent:   0x8FA9BF,
    flower:       0xFFFFFF,
  },
  { // 1 - St Petersburg university / early family years
    name: 'st_petersburg',
    skyTop:       0xDDE5F2,
    skyBottom:    0xF6D9C9,
    sunColor:     0xFFE7B7,
    sunY:         122,
    far:          0xB9A5C0,
    mid:          0x8E7B93,
    near:         0x90AB88,
    grass:        0x81A06F,
    grassDark:    0x627C55,
    tree:         0x4F5E4E,
    cloud:        0xFFF6EF,
    water:        0x7FA6C3,
    building:     0xE8D5BF,
    buildingDark: 0x8A7282,
    roofAccent:   0xB74D5D,
    flower:       0xF7E4A8,
  },
  { // 2 - Belgium
    name: 'belgium',
    skyTop:       0xCFE4C3,
    skyBottom:    0xF6F0CF,
    sunColor:     0xFFE7A2,
    sunY:         114,
    far:          0x8AA36E,
    mid:          0x5F7F4E,
    near:         0x5A8B49,
    grass:        0x4A8E43,
    grassDark:    0x376734,
    tree:         0x2F5A2D,
    cloud:        0xF8FBF3,
    water:        0x74A9A8,
    building:     0xC3B18A,
    buildingDark: 0x62543F,
    roofAccent:   0x8D5234,
    flower:       0xFFF4B1,
  },
  { // 3 - London
    name: 'london',
    skyTop:       0x9CADC2,
    skyBottom:    0xD9E2EA,
    sunColor:     0xE8EDF2,
    sunY:         138,
    far:          0x6C7E92,
    mid:          0x495A6A,
    near:         0x58704D,
    grass:        0x4A6F43,
    grassDark:    0x36513A,
    tree:         0x344B39,
    cloud:        0xE8EDF2,
    water:        0x6E879C,
    building:     0x6A7684,
    buildingDark: 0x32404C,
    roofAccent:   0xB24E43,
    flower:       0xE7C989,
  },
  { // 4 - Amsterdam and the finale stretch
    name: 'amsterdam',
    skyTop:       0xA8D5F2,
    skyBottom:    0xF4F9FD,
    sunColor:     0xFFE59D,
    sunY:         116,
    far:          0x8AAFC4,
    mid:          0x915C44,
    near:         0x5D9D58,
    grass:        0x4D944C,
    grassDark:    0x3A6F3D,
    tree:         0x3D6B33,
    cloud:        0xFFFFFF,
    water:        0x5DA0C8,
    building:     0xB86E4E,
    buildingDark: 0x5F3326,
    roofAccent:   0xE89A57,
    flower:       0xFF6B73,
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
