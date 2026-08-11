/**
 * Constellation stick-figure lines expressed as pairs of star names.
 * Names must match the `name` field in the bright-star API catalog.
 * Lines where either star is absent from the catalog are silently skipped.
 *
 * Stick-figure shapes follow the traditional patterns popularised by
 * H.A. Rey and standard star-atlas conventions.
 */

export interface ConstellationLine {
  /** Star A name (must match API catalog) */
  a: string;
  /** Star B name (must match API catalog) */
  b: string;
  /** IAU three-letter abbreviation */
  abbr: string;
  /** Full constellation name */
  name: string;
}

export const CONSTELLATION_LINES: ConstellationLine[] = [

  // ── Orion ────────────────────────────────────────────────────────────────────
  // Head → shoulders
  { a: 'Meissa',     b: 'Betelgeuse', abbr: 'Ori', name: 'Orion' },
  { a: 'Meissa',     b: 'Bellatrix',  abbr: 'Ori', name: 'Orion' },
  // Shoulders across
  { a: 'Betelgeuse', b: 'Bellatrix',  abbr: 'Ori', name: 'Orion' },
  // Left side down to belt
  { a: 'Betelgeuse', b: 'Alnitak',    abbr: 'Ori', name: 'Orion' },
  // Right side down to belt
  { a: 'Bellatrix',  b: 'Mintaka',    abbr: 'Ori', name: 'Orion' },
  // Belt (Alnitak – Alnilam – Mintaka)
  { a: 'Alnitak',    b: 'Alnilam',    abbr: 'Ori', name: 'Orion' },
  { a: 'Alnilam',    b: 'Mintaka',    abbr: 'Ori', name: 'Orion' },
  // Belt to feet
  { a: 'Alnitak',    b: 'Saiph',      abbr: 'Ori', name: 'Orion' },
  { a: 'Mintaka',    b: 'Rigel',      abbr: 'Ori', name: 'Orion' },

  // ── Ursa Major (Big Dipper) ──────────────────────────────────────────────────
  // Bowl (Dubhe – Merak – Phecda – Megrez – Dubhe)
  { a: 'Dubhe',  b: 'Merak',   abbr: 'UMa', name: 'Ursa Major' },
  { a: 'Merak',  b: 'Phecda',  abbr: 'UMa', name: 'Ursa Major' },
  { a: 'Phecda', b: 'Megrez',  abbr: 'UMa', name: 'Ursa Major' },
  { a: 'Megrez', b: 'Dubhe',   abbr: 'UMa', name: 'Ursa Major' },
  // Handle (Megrez – Alioth – Mizar – Alkaid)
  { a: 'Megrez', b: 'Alioth',  abbr: 'UMa', name: 'Ursa Major' },
  { a: 'Alioth', b: 'Mizar',   abbr: 'UMa', name: 'Ursa Major' },
  { a: 'Mizar',  b: 'Alkaid',  abbr: 'UMa', name: 'Ursa Major' },

  // ── Cassiopeia (W shape) ─────────────────────────────────────────────────────
  { a: 'Caph',    b: 'Schedar',  abbr: 'Cas', name: 'Cassiopeia' },
  { a: 'Schedar', b: 'Navi',     abbr: 'Cas', name: 'Cassiopeia' },
  { a: 'Navi',    b: 'Ruchbah',  abbr: 'Cas', name: 'Cassiopeia' },
  { a: 'Ruchbah', b: 'Segin',    abbr: 'Cas', name: 'Cassiopeia' },

  // ── Perseus ────────────────────────────────────────────────────────────────────
  // Chain: Algol – Atik – Mirfak
  { a: 'Algol',  b: 'Atik',    abbr: 'Per', name: 'Perseus' },
  { a: 'Atik',   b: 'Mirfak',  abbr: 'Per', name: 'Perseus' },
  // Mirfak toward Capella (connection to Auriga)
  { a: 'Mirfak', b: 'Capella', abbr: 'Per', name: 'Perseus' },

  // ── Auriga (pentagon) ────────────────────────────────────────────────────────
  // Capella – Menkalinan – Elnath – Capella triangle
  { a: 'Capella',     b: 'Menkalinan', abbr: 'Aur', name: 'Auriga' },
  { a: 'Menkalinan',  b: 'Elnath',     abbr: 'Aur', name: 'Auriga' },
  { a: 'Capella',     b: 'Elnath',     abbr: 'Aur', name: 'Auriga' },

  // ── Taurus (bull's head V + horn) ────────────────────────────────────────────
  // Hyades V: Aldebaran at the eye angle, Ain on one branch, Elnath at the horn
  { a: 'Aldebaran', b: 'Ain',    abbr: 'Tau', name: 'Taurus' },
  { a: 'Ain',       b: 'Elnath', abbr: 'Tau', name: 'Taurus' },
  { a: 'Aldebaran', b: 'Elnath', abbr: 'Tau', name: 'Taurus' },

  // ── Gemini (twin bodies) ─────────────────────────────────────────────────────
  // Heads across
  { a: 'Castor', b: 'Pollux',  abbr: 'Gem', name: 'Gemini' },
  // Castor body (Castor → Tejat → Propus)
  { a: 'Castor', b: 'Tejat',   abbr: 'Gem', name: 'Gemini' },
  { a: 'Tejat',  b: 'Propus',  abbr: 'Gem', name: 'Gemini' },
  // Pollux body (Pollux → Alhena at foot)
  { a: 'Pollux', b: 'Alhena',  abbr: 'Gem', name: 'Gemini' },

  // ── Canis Major (the Great Dog) ───────────────────────────────────────────────
  // Nose/chest: Mirzam → Sirius
  { a: 'Mirzam', b: 'Sirius',  abbr: 'CMa', name: 'Canis Major' },
  // Back: Sirius → Wezen (hip)
  { a: 'Sirius', b: 'Wezen',   abbr: 'CMa', name: 'Canis Major' },
  // Hindleg: Wezen → Adhara
  { a: 'Wezen',  b: 'Adhara',  abbr: 'CMa', name: 'Canis Major' },
  // Tail: Wezen → Aludra
  { a: 'Wezen',  b: 'Aludra',  abbr: 'CMa', name: 'Canis Major' },

  // ── Leo (the Lion) ────────────────────────────────────────────────────────────
  // Sickle: Regulus → Algieba (neck/mane)
  { a: 'Regulus',  b: 'Algieba',  abbr: 'Leo', name: 'Leo' },
  // Back: Algieba → Zosma (haunches)
  { a: 'Algieba',  b: 'Zosma',    abbr: 'Leo', name: 'Leo' },
  // Tail: Zosma → Denebola
  { a: 'Zosma',    b: 'Denebola', abbr: 'Leo', name: 'Leo' },

  // ── Cygnus (Northern Cross) ───────────────────────────────────────────────────
  // Vertical beam: Albireo (beak) → Sadr (center) → Deneb (tail)
  { a: 'Albireo',      b: 'Sadr',  abbr: 'Cyg', name: 'Cygnus' },
  { a: 'Sadr',         b: 'Deneb', abbr: 'Cyg', name: 'Cygnus' },
  // Horizontal beam: Gienah Cygni ← Sadr → Rukh
  { a: 'Gienah Cygni', b: 'Sadr',  abbr: 'Cyg', name: 'Cygnus' },
  { a: 'Sadr',         b: 'Rukh',  abbr: 'Cyg', name: 'Cygnus' },

  // ── Aquila (the Eagle) ────────────────────────────────────────────────────────
  // Body spine: Tarazed (above) – Altair (heart) – Alshain (below)
  { a: 'Tarazed', b: 'Altair',  abbr: 'Aql', name: 'Aquila' },
  { a: 'Altair',  b: 'Alshain', abbr: 'Aql', name: 'Aquila' },

  // ── Scorpius ─────────────────────────────────────────────────────────────────
  // Claws/head: Graffias → Dschubba
  { a: 'Graffias', b: 'Dschubba', abbr: 'Sco', name: 'Scorpius' },
  // Body: Dschubba → Antares (heart)
  { a: 'Dschubba', b: 'Antares',  abbr: 'Sco', name: 'Scorpius' },
  // Tail: Antares → Sargas → Lesath → Shaula (stinger)
  { a: 'Antares',  b: 'Sargas',   abbr: 'Sco', name: 'Scorpius' },
  { a: 'Sargas',   b: 'Lesath',   abbr: 'Sco', name: 'Scorpius' },
  { a: 'Lesath',   b: 'Shaula',   abbr: 'Sco', name: 'Scorpius' },

  // ── Sagittarius (Teapot) ──────────────────────────────────────────────────────
  // Spout: Kaus Australis → Kaus Media → Kaus Borealis
  { a: 'Kaus Australis', b: 'Kaus Media',    abbr: 'Sgr', name: 'Sagittarius' },
  { a: 'Kaus Media',     b: 'Kaus Borealis', abbr: 'Sgr', name: 'Sagittarius' },
  // Lid: Kaus Borealis → Nunki
  { a: 'Kaus Borealis',  b: 'Nunki',         abbr: 'Sgr', name: 'Sagittarius' },
  // Handle: Nunki → Ascella
  { a: 'Nunki',          b: 'Ascella',        abbr: 'Sgr', name: 'Sagittarius' },
  // Base: Ascella → Kaus Australis (close the teapot)
  { a: 'Ascella',        b: 'Kaus Australis', abbr: 'Sgr', name: 'Sagittarius' },

  // ── Boötes (the Kite) ────────────────────────────────────────────────────────
  // Base pair: Arcturus – Muphrid
  { a: 'Arcturus', b: 'Muphrid', abbr: 'Boo', name: 'Boötes' },
  // Right side: Arcturus → Izar
  { a: 'Arcturus', b: 'Izar',    abbr: 'Boo', name: 'Boötes' },
  // Top: Izar → Nekkar
  { a: 'Izar',     b: 'Nekkar',  abbr: 'Boo', name: 'Boötes' },

  // ── Centaurus ─────────────────────────────────────────────────────────────────
  // Upper body: Menkent → Hadar (shoulder to foreleg)
  { a: 'Menkent',          b: 'Hadar',           abbr: 'Cen', name: 'Centaurus' },
  // Southern Pointers: Hadar → Rigil Kentaurus
  { a: 'Hadar',            b: 'Rigil Kentaurus',  abbr: 'Cen', name: 'Centaurus' },
  // Rear body: Muhlifain → Hadar
  { a: 'Muhlifain',        b: 'Hadar',            abbr: 'Cen', name: 'Centaurus' },
];

/** Unique constellation names present in the line list */
export const CONSTELLATION_NAMES = [...new Set(CONSTELLATION_LINES.map((l) => l.name))];
