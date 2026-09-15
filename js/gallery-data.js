// Puzzle-Bildergalerie. Neues Motiv hinzufuegen: Bild (16:9 Querformat) in
// images/full/<kategorie-ordner>/ und images/thumb/<kategorie-ordner>/ ablegen
// und hier einen weiteren Eintrag ergaenzen.
const PUZZLE_GALLERY = [
  { id: "guinea_pig", title: "Meerschweinchen", category: "Tiere", full: "images/full/tiere/guinea_pig.jpg", thumb: "images/thumb/tiere/guinea_pig.jpg" },
  { id: "rabbit", title: "Hase", category: "Tiere", full: "images/full/tiere/rabbit.jpg", thumb: "images/thumb/tiere/rabbit.jpg" },
  { id: "kitten", title: "Katzenbaby", category: "Tiere", full: "images/full/tiere/kitten.jpg", thumb: "images/thumb/tiere/kitten.jpg" },
  { id: "fox", title: "Fuchs im Wald", category: "Tiere", full: "images/full/tiere/fox.jpg", thumb: "images/thumb/tiere/fox.jpg" },
  { id: "owl", title: "Eule", category: "Tiere", full: "images/full/tiere/owl.jpg", thumb: "images/thumb/tiere/owl.jpg" },
  { id: "horse", title: "Pferd auf der Weide", category: "Tiere", full: "images/full/tiere/horse.jpg", thumb: "images/thumb/tiere/horse.jpg" },
  { id: "panda", title: "Panda", category: "Tiere", full: "images/full/tiere/panda.jpg", thumb: "images/thumb/tiere/panda.jpg" },
  { id: "sunset", title: "Sonnenuntergang", category: "Landschaft", full: "images/full/landschaft/sunset.jpg", thumb: "images/thumb/landschaft/sunset.jpg" },
  { id: "beach", title: "Traumstrand", category: "Landschaft", full: "images/full/landschaft/beach.jpg", thumb: "images/thumb/landschaft/beach.jpg" },
  { id: "mountains", title: "Bergpanorama", category: "Landschaft", full: "images/full/landschaft/mountains.jpg", thumb: "images/thumb/landschaft/mountains.jpg" },
  { id: "autumn_forest", title: "Herbstwald", category: "Landschaft", full: "images/full/landschaft/autumn_forest.jpg", thumb: "images/thumb/landschaft/autumn_forest.jpg" },
  { id: "waterfall", title: "Wasserfall", category: "Landschaft", full: "images/full/landschaft/waterfall.jpg", thumb: "images/thumb/landschaft/waterfall.jpg" },
  { id: "desert", title: "Wuestenduenen", category: "Landschaft", full: "images/full/landschaft/desert.jpg", thumb: "images/thumb/landschaft/desert.jpg" },
  { id: "aurora", title: "Polarlicht", category: "Landschaft", full: "images/full/landschaft/aurora.jpg", thumb: "images/thumb/landschaft/aurora.jpg" },
  { id: "flower_tulips", title: "Tulpenfeld", category: "Blumen", full: "images/full/blumen/flower_tulips.jpg", thumb: "images/thumb/blumen/flower_tulips.jpg" },
  { id: "flower_sunflowers", title: "Sonnenblumenfeld", category: "Blumen", full: "images/full/blumen/flower_sunflowers.jpg", thumb: "images/thumb/blumen/flower_sunflowers.jpg" },
  { id: "flower_roses", title: "Rosengarten", category: "Blumen", full: "images/full/blumen/flower_roses.jpg", thumb: "images/thumb/blumen/flower_roses.jpg" },
  { id: "flower_meadow", title: "Wildblumenwiese", category: "Blumen", full: "images/full/blumen/flower_meadow.jpg", thumb: "images/thumb/blumen/flower_meadow.jpg" },
  { id: "flower_lavender", title: "Lavendelfeld", category: "Blumen", full: "images/full/blumen/flower_lavender.jpg", thumb: "images/thumb/blumen/flower_lavender.jpg" },
  { id: "flower_cherry_blossom", title: "Kirschbluete", category: "Blumen", full: "images/full/blumen/flower_cherry_blossom.jpg", thumb: "images/thumb/blumen/flower_cherry_blossom.jpg" },
  { id: "city_skyline_night", title: "Skyline bei Nacht", category: "Staedte bei Nacht", full: "images/full/staedte-bei-nacht/city_skyline_night.jpg", thumb: "images/thumb/staedte-bei-nacht/city_skyline_night.jpg" },
  { id: "city_street_neon", title: "Neonstrasse", category: "Staedte bei Nacht", full: "images/full/staedte-bei-nacht/city_street_neon.jpg", thumb: "images/thumb/staedte-bei-nacht/city_street_neon.jpg" },
  { id: "city_bridge_night", title: "Bruecke bei Nacht", category: "Staedte bei Nacht", full: "images/full/staedte-bei-nacht/city_bridge_night.jpg", thumb: "images/thumb/staedte-bei-nacht/city_bridge_night.jpg" },
  { id: "space_nebula", title: "Sternennebel", category: "Weltraum", full: "images/full/weltraum/space_nebula.jpg", thumb: "images/thumb/weltraum/space_nebula.jpg" },
  { id: "space_planets", title: "Planeten und Monde", category: "Weltraum", full: "images/full/weltraum/space_planets.jpg", thumb: "images/thumb/weltraum/space_planets.jpg" },
  { id: "space_moon", title: "Erdaufgang ueber dem Mond", category: "Weltraum", full: "images/full/weltraum/space_moon.jpg", thumb: "images/thumb/weltraum/space_moon.jpg" },
  { id: "underwater_reef", title: "Korallenriff", category: "Unterwasserwelt", full: "images/full/unterwasserwelt/underwater_reef.jpg", thumb: "images/thumb/unterwasserwelt/underwater_reef.jpg" },
  { id: "underwater_whale", title: "Buckelwal", category: "Unterwasserwelt", full: "images/full/unterwasserwelt/underwater_whale.jpg", thumb: "images/thumb/unterwasserwelt/underwater_whale.jpg" },
  { id: "winter_forest", title: "Winterwald", category: "Winter", full: "images/full/winter/winter_forest.jpg", thumb: "images/thumb/winter/winter_forest.jpg" },
  { id: "winter_village", title: "Alpendorf im Schnee", category: "Winter", full: "images/full/winter/winter_village.jpg", thumb: "images/thumb/winter/winter_village.jpg" },
];

const PIECE_COUNT_OPTIONS = [50, 100, 250, 500, 600];

// Kategorien mit Anzeige-Reihenfolge und Symbol fuer die Ordner-Kacheln im
// Startbildschirm. Neue Kategorie hinzufuegen: hier ergaenzen, dann Motive
// mit passendem "category"-Wert in PUZZLE_GALLERY eintragen.
const PUZZLE_CATEGORIES = [
  { key: "Tiere", emoji: "🐾" },
  { key: "Landschaft", emoji: "🏞️" },
  { key: "Blumen", emoji: "🌸" },
  { key: "Staedte bei Nacht", emoji: "🌃" },
  { key: "Weltraum", emoji: "🌌" },
  { key: "Unterwasserwelt", emoji: "🐠" },
  { key: "Winter", emoji: "❄️" },
];
