// Milestones along Katya's life timeline.
// x = world x-coordinate where the trigger zone sits.
// biome index controls palette + scenery swap.
// photo placeholder dimensions are standard for now.

const MILESTONES = [
  { id: 1,  x: 1400,  year: 'Age 7',    title: 'First day of school',       biome: 0, accent: '#FFD86B' },
  { id: 2,  x: 2200,  year: 'Age 17',   title: 'School graduation',          biome: 0, accent: '#FFB86B', growth: true },
  { id: 3,  x: 3000,  year: 'Age 18',   title: 'First year at university',   biome: 1, accent: '#F9A8D4' },
  { id: 4,  x: 3800,  year: 'Age 20',   title: 'Meets her future husband',   biome: 1, accent: '#FF6B9D', hearts: true },
  { id: 5,  x: 4600,  year: 'Age 22',   title: 'University graduation',      biome: 1, accent: '#C4B5FD' },
  { id: 6,  x: 5400,  year: 'Age 23',   title: 'First job',                  biome: 2, accent: '#7DD3FC' },
  { id: 7,  x: 6200,  year: 'Age 25',   title: 'Wedding day',                biome: 2, accent: '#FFC6D9', petals: true },
  { id: 8,  x: 7000,  year: 'Age 27',   title: 'Our daughter is born',       biome: 2, accent: '#FFE6A7', glow: true },
  { id: 9,  x: 7800,  year: 'Age 29',   title: 'Moves to Belgium',           biome: 3, accent: '#FDE68A' },
  { id: 10, x: 8600,  year: 'Age 31',   title: 'Moves to London',            biome: 3, accent: '#FCA5A5' },
  { id: 11, x: 9400,  year: 'Age 32',   title: 'Starts at Vodafone',         biome: 3, accent: '#EF4444' },
  { id: 12, x: 10200, year: 'Age 34',   title: 'Moves to Amsterdam',         biome: 4, accent: '#FB923C' },
  { id: 13, x: 11000, year: 'Age 35',   title: 'Starts at Coty',             biome: 4, accent: '#A78BFA' },
  { id: 14, x: 11800, year: 'Age 37',   title: 'First apartment',            biome: 4, accent: '#86EFAC', keys: true },
  { id: 15, x: 12700, year: 'Age 38',   title: 'Happy Birthday, Katya',      biome: 5, accent: '#FFD86B', fireworks: true },
];

const WORLD = {
  width: 14200,
  height: 640,
  groundY: 560,
  viewW: 1024,
  viewH: 640,
};
