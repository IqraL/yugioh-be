export const levels = ["1", "2", "3", "4", "5", "6", "7", "8"];
export const attributes = [
  "dark",
  "earth",
  "fire",
  "light",
  "water",
  "wind",
  "divine",
];
export const types = [
  "Skill Card",
  "Spell Card",
  "Trap Card",

  "Token",

  "Normal Monster",
  "Normal Tuner Monster",
  "Effect Monster",
  "Tuner Monster",
  "Flip Monster",
  "Flip Effect Monster",
  "Spirit Monster",
  "Union Effect Monster",
  "Gemini Monster",
  "Pendulum Effect Monster",
  "Pendulum Normal Monster",
  "Pendulum Effect Ritual Monster",
  "Pendulum Tuner Effect Monster",
  "Ritual Monster",
  "Ritual Effect Monster",
  "Toon Monster",
  "Fusion Monster",
  "Synchro Monster",
  "Synchro Tuner Monster",
  "Synchro Pendulum Effect Monster",
  "XYZ Monster",
  "XYZ Pendulum Effect Monster",
  "Link Monster",
  "Pendulum Flip Effect Monster",
  "Pendulum Effect Fusion Monster",
];
export const monsterRace = [
  "Aqua",
  "Beast",
  "Beast-Warrior",
  "Creator-God",
  "Cyberse",
  "Dinosaur",
  "Divine-Beast",
  "Dragon",
  "Fairy",
  "Fiend",
  "Fish",
  "Insect",
  "Machine",
  "Plant",
  "Psychic",
  "Pyro",
  "Reptile",
  "Rock",
  "Sea Serpent",
  "Spellcaster",
  "Thunder",
  "Warrior",
  "Winged Beast",
  "Wyrm",
  "Zombie",
];

const spellRace = [
  "Normal",
  "Field",
  "Equip",
  "Continuous",
  "Quick-Play",
  "Ritual",
];

export const trapRace = ["Normal", "Continuous", "Counter"];

export const allRaces = [...monsterRace, ...spellRace, ...trapRace];

export const sortingValues = [
  "atk",
  "def",
  "name",
  "type",
  "level",
  "id",
  "new",
];
