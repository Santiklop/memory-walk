// Milestones along Katya's life timeline.
// x = world x-coordinate where the trigger zone sits.
// growTo = character form to transition to when she reaches this milestone.
//          If she walks back past a milestone, she reverts to the form set by
//          the previous milestone (handled in MainScene._computeFormAt).
// biome index controls the locale:
//   0 Siberia, 1 St Petersburg, 2 Belgium, 3 London, 4 Amsterdam
//
// photos[]: ordered list of texture keys to cycle through. Where a "-0"
// indexed photo exists for a milestone (Anna-0, Coty-0, New apart-0,
// age0), it is the first entry so the frame opens on that one.

const MILESTONES = [
  { id: 1,  x: 700,   year: 'Age 0',    title: 'Katya enters the world',      biome: 0, accent: '#FFB8D9', cradle: true,
    photos: ['photo_age0'] },
  { id: 2,  x: 1500,  year: 'Age 7',    title: 'First day of school',         biome: 0, accent: '#FFD86B', airplane: true, growTo: 'child',
    photos: ['photo_age7', 'photo_age7_2'] },
  { id: 3,  x: 2400,  year: 'Age 17',   title: 'School graduation',           biome: 0, accent: '#FFB86B', growTo: 'teen',
    photos: ['photo_school_grad_1', 'photo_school_grad_2', 'photo_school_grad_3'] },
  { id: 4,  x: 3300,  year: 'Age 17',   title: 'First year at university',    biome: 1, accent: '#F9A8D4',
    photos: ['photo_uni_1', 'photo_uni_2', 'photo_uni_3', 'photo_uni_4', 'photo_uni_5'] },
  { id: 5,  x: 4200,  year: 'Age 17',   title: 'Meets her future husband',    biome: 1, accent: '#FF6B9D', hearts: true, growTo: 'adult',
    photos: ['photo_husband_1', 'photo_husband_2', 'photo_husband_3'] },
  { id: 6,  x: 5100,  year: 'Age 21',   title: 'University graduation',       biome: 1, accent: '#C4B5FD', growTo: 'adult_grad',
    photos: ['photo_uni_grad_1', 'photo_uni_grad_2', 'photo_uni_grad_3', 'photo_uni_grad_4', 'photo_uni_grad_5'] },
  { id: 7,  x: 6000,  year: 'Age 21',   title: 'First job post-uni',          biome: 1, accent: '#7DD3FC', growTo: 'office',
    photos: ['photo_after_uni_1', 'photo_after_uni_2', 'photo_after_uni_3'] },
  { id: 8,  x: 6900,  year: 'Age 24',   title: 'Wedding day',                 biome: 1, accent: '#FFC6D9', petals: true, growTo: 'wedding',
    photos: ['photo_wedding_1', 'photo_wedding_2', 'photo_wedding_3', 'photo_wedding_4', 'photo_wedding_5', 'photo_wedding_6', 'photo_wedding_7', 'photo_wedding_8', 'photo_wedding_9', 'photo_wedding_10'] },
  { id: 9,  x: 7800,  year: 'Age 26',   title: 'Our daughter Anna is born',   biome: 1, accent: '#FFE6A7', glow: true, growTo: 'withBaby',
    photos: ['photo_anna_0', 'photo_anna_1', 'photo_anna_2', 'photo_anna_3', 'photo_anna_4', 'photo_anna_5', 'photo_anna_6'] },
  { id: 10, x: 8700,  year: 'Age 27',   title: 'Hello Belgium!',              biome: 2, accent: '#FDE68A', waffles: true,
    photos: ['photo_belgium_1', 'photo_belgium_2', 'photo_belgium_3', 'photo_belgium_4', 'photo_belgium_5', 'photo_belgium_6', 'photo_belgium_7'] },
  { id: 11, x: 9600,  year: 'Age 29',   title: 'Hello London!',               biome: 3, accent: '#FCA5A5', growTo: 'london',
    photos: ['photo_london_1', 'photo_london_2', 'photo_london_3', 'photo_london_4', 'photo_london_5', 'photo_london_6', 'photo_london_7', 'photo_london_8', 'photo_london_9'] },
  { id: 12, x: 10500, year: 'Age 30',   title: 'Job at Vodafone',             biome: 3, accent: '#EF4444', bus: true,
    photos: ['photo_vodafone_1', 'photo_vodafone_2', 'photo_vodafone_3', 'photo_vodafone_4', 'photo_vodafone_5', 'photo_vodafone_6', 'photo_vodafone_7', 'photo_vodafone_8'] },
  { id: 13, x: 11400, year: 'Age 31',   title: 'Hello Amsterdam!',            biome: 4, accent: '#FB923C', growTo: 'amsterdam',
    photos: ['photo_amsterdam_1', 'photo_amsterdam_2', 'photo_amsterdam_3', 'photo_amsterdam_4', 'photo_amsterdam_5', 'photo_amsterdam_6', 'photo_amsterdam_7', 'photo_amsterdam_8'] },
  { id: 14, x: 12300, year: 'Age 32',   title: 'Job at Coty',                 biome: 4, accent: '#A78BFA', growTo: 'office',
    photos: ['photo_coty_0', 'photo_coty_1', 'photo_coty_2', 'photo_coty_3', 'photo_coty_4'] },
  { id: 15, x: 13200, year: 'Age 35',   title: 'First apartment',             biome: 4, accent: '#86EFAC', keys: true, growTo: 'pink_dress',
    photos: ['photo_new_apart_0', 'photo_new_apart_1', 'photo_new_apart_2', 'photo_new_apart_3', 'photo_new_apart_4', 'photo_new_apart_5', 'photo_new_apart_6', 'photo_new_apart_7', 'photo_new_apart_8', 'photo_new_apart_9', 'photo_new_apart_10', 'photo_new_apart_11'] },
  { id: 16, x: 14200, year: 'Age 38',   title: 'Today!!!',                    biome: 4, accent: '#FFD86B', fireworks: true,
    photos: ['photo_today_1', 'photo_today_2'] },
];

const WORLD = {
  width: 15600,
  height: 640,
  groundY: 560,
  viewW: 1024,
  viewH: 640,
};
