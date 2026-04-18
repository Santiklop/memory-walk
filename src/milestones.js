// Milestones along Katya's life timeline.
// x = world x-coordinate where the trigger zone sits.
// growTo = character form to transition to when she reaches this milestone.
//          If she walks back past a milestone, she reverts to the form set by
//          the previous milestone (handled in MainScene._computeFormAt).
// biome index controls the locale:
//   0 Siberia, 1 St Petersburg, 2 Belgium, 3 London, 4 Amsterdam

const MILESTONES = [
  { id: 1,  x: 700,   year: 'Age 0',    title: 'Katya enters the world',      biome: 0, accent: '#FFB8D9', cradle: true },
  { id: 2,  x: 1500,  year: 'Age 7',    title: 'First day of school',         biome: 0, accent: '#FFD86B', airplane: true, growTo: 'child' },
  { id: 3,  x: 2400,  year: 'Age 17',   title: 'School graduation',           biome: 0, accent: '#FFB86B', growTo: 'teen' },
  { id: 4,  x: 3300,  year: 'Age 17',   title: 'First year at university',    biome: 1, accent: '#F9A8D4' },
  { id: 5,  x: 4200,  year: 'Age 17',   title: 'Meets her future husband',    biome: 1, accent: '#FF6B9D', hearts: true, growTo: 'adult' },
  { id: 6,  x: 5100,  year: 'Age 21',   title: 'University graduation',       biome: 1, accent: '#C4B5FD', growTo: 'adult_grad' },
  { id: 7,  x: 6000,  year: 'Age 21',   title: 'First job post-uni',          biome: 1, accent: '#7DD3FC', growTo: 'office' },
  { id: 8,  x: 6900,  year: 'Age 24',   title: 'Wedding day',                 biome: 1, accent: '#FFC6D9', petals: true, growTo: 'wedding' },
  { id: 9,  x: 7800,  year: 'Age 26',   title: 'Our daughter Anna is born',   biome: 1, accent: '#FFE6A7', glow: true, growTo: 'withBaby' },
  { id: 10, x: 8700,  year: 'Age 27',   title: 'Hello Belgium!',              biome: 2, accent: '#FDE68A', waffles: true },
  { id: 11, x: 9600,  year: 'Age 29',   title: 'Hello London!',               biome: 3, accent: '#FCA5A5', growTo: 'london' },
  { id: 12, x: 10500, year: 'Age 30',   title: 'Job at Vodafone',             biome: 3, accent: '#EF4444', bus: true },
  { id: 13, x: 11400, year: 'Age 31',   title: 'Hello Amsterdam!',            biome: 4, accent: '#FB923C', growTo: 'amsterdam' },
  { id: 14, x: 12300, year: 'Age 32',   title: 'Job at Coty',                 biome: 4, accent: '#A78BFA', growTo: 'office' },
  { id: 15, x: 13200, year: 'Age 35',   title: 'First apartment',             biome: 4, accent: '#86EFAC', keys: true, growTo: 'pink_dress' },
  { id: 16, x: 14200, year: 'Age 38',   title: 'Today!!!',                    biome: 4, accent: '#FFD86B', fireworks: true },
];

const WORLD = {
  width: 15600,
  height: 640,
  groundY: 560,
  viewW: 1024,
  viewH: 640,
};
