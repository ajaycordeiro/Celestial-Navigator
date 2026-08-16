/**
 * Astronomical calculation helpers using astronomy-engine (NASA-grade).
 * All calculations are server-side, no external API needed.
 */
import * as Astronomy from "astronomy-engine";

export interface Observer {
  lat: number;
  lon: number;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDayOfYear(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

function makeObserver(lat: number, lon: number) {
  return new Astronomy.Observer(lat, lon, 0);
}

function formatTime(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString();
}

function getAltAz(
  body: Astronomy.Body,
  date: Date,
  observer: Astronomy.Observer
): { altitude: number; azimuth: number } {
  const equatorial = Astronomy.Equator(body, date, observer, true, true);
  const horizontal = Astronomy.Horizon(
    date,
    observer,
    equatorial.ra,
    equatorial.dec,
    "normal"
  );
  return {
    altitude: Math.round(horizontal.altitude * 10) / 10,
    azimuth: Math.round(horizontal.azimuth * 10) / 10,
  };
}

function getRiseSet(
  body: Astronomy.Body,
  date: Date,
  observer: Astronomy.Observer
): { rise: Date | null; set: Date | null } {
  try {
    const noon = new Date(date);
    noon.setHours(12, 0, 0, 0);
    const prevMidnight = new Date(noon);
    prevMidnight.setHours(0, 0, 0, 0);

    const rise = Astronomy.SearchRiseSet(body, observer, 1, prevMidnight, 1);
    const set = Astronomy.SearchRiseSet(body, observer, -1, prevMidnight, 1);
    return {
      rise: rise ? rise.date : null,
      set: set ? set.date : null,
    };
  } catch {
    return { rise: null, set: null };
  }
}

export interface PlanetData {
  name: string;
  type: string;
  altitude: number;
  azimuth: number;
  magnitude: number;
  riseTime: string | null;
  setTime: string | null;
  isVisible: boolean;
  constellation: string;
  distanceAU: number;
  description: string;
}

const PLANET_INFO: Record<
  string,
  { type: string; description: string; body: Astronomy.Body }
> = {
  Mercury: {
    type: "Terrestrial Planet",
    description:
      "The smallest planet, closest to the Sun. Visible near the horizon just after sunset or before sunrise.",
    body: Astronomy.Body.Mercury,
  },
  Venus: {
    type: "Terrestrial Planet",
    description:
      "The brightest planet, often called the Morning or Evening Star. Dazzlingly brilliant due to its thick cloud cover.",
    body: Astronomy.Body.Venus,
  },
  Mars: {
    type: "Terrestrial Planet",
    description:
      "The Red Planet, recognizable by its distinctly reddish hue. Home to the largest volcano in the solar system.",
    body: Astronomy.Body.Mars,
  },
  Jupiter: {
    type: "Gas Giant",
    description:
      "The largest planet, with its famous Great Red Spot storm. Its four Galilean moons are visible with binoculars.",
    body: Astronomy.Body.Jupiter,
  },
  Saturn: {
    type: "Gas Giant",
    description:
      "The ringed jewel of the solar system. Its stunning ring system is visible through even small telescopes.",
    body: Astronomy.Body.Saturn,
  },
  Uranus: {
    type: "Ice Giant",
    description:
      "The sideways planet, tilted 98° on its axis. Faintly visible to the naked eye under dark skies.",
    body: Astronomy.Body.Uranus,
  },
  Neptune: {
    type: "Ice Giant",
    description:
      "The most distant planet, with the strongest winds in the solar system. Requires binoculars or telescope.",
    body: Astronomy.Body.Neptune,
  },
};

const CONSTELLATION_MAP: Partial<Record<Astronomy.Body, () => string>> = {};

function getConstellation(ra: number): string {
  // Very simplified RA→constellation mapping
  const constellations = [
    { ra: 0, name: "Pisces" },
    { ra: 1.75, name: "Aries" },
    { ra: 3.5, name: "Taurus" },
    { ra: 6, name: "Gemini" },
    { ra: 7.5, name: "Cancer" },
    { ra: 9, name: "Leo" },
    { ra: 11.5, name: "Virgo" },
    { ra: 14, name: "Libra" },
    { ra: 15.5, name: "Scorpius" },
    { ra: 17, name: "Sagittarius" },
    { ra: 18.5, name: "Capricornus" },
    { ra: 20, name: "Aquarius" },
    { ra: 21.5, name: "Pisces" },
    { ra: 24, name: "Aries" },
  ];
  for (let i = constellations.length - 1; i >= 0; i--) {
    if (ra >= constellations[i].ra) return constellations[i].name;
  }
  return "Pisces";
}

export function computePlanets(date: Date, lat: number, lon: number): PlanetData[] {
  const observer = makeObserver(lat, lon);
  const planets: PlanetData[] = [];

  for (const [name, info] of Object.entries(PLANET_INFO)) {
    try {
      const { altitude, azimuth } = getAltAz(info.body, date, observer);
      const { rise, set } = getRiseSet(info.body, date, observer);
      const illum = Astronomy.Illumination(info.body, date);
      const equatorial = Astronomy.Equator(info.body, date, observer, true, true);
      const constellation = getConstellation(equatorial.ra);

      // Distance calculation
      let distanceAU = 1;
      try {
        const vec = Astronomy.GeoVector(info.body, date, true);
        distanceAU =
          Math.round(
            Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z) * 100
          ) / 100;
      } catch {
        distanceAU = 0;
      }

      planets.push({
        name,
        type: info.type,
        altitude,
        azimuth,
        magnitude: Math.round(illum.mag * 10) / 10,
        riseTime: formatTime(rise),
        setTime: formatTime(set),
        isVisible: altitude > 5,
        constellation,
        distanceAU,
        description: info.description,
      });
    } catch {
      // Skip if computation fails
    }
  }

  return planets.sort((a, b) => b.altitude - a.altitude);
}

export interface MoonData {
  phase: number;
  phaseName: string;
  illumination: number;
  altitude: number;
  azimuth: number;
  riseTime: string | null;
  setTime: string | null;
  age: number;
  distanceKm: number;
  nextFullMoon: string;
  nextNewMoon: string;
}

function getMoonPhaseName(phase: number): string {
  // phase is 0-1
  const p = phase;
  if (p < 0.03 || p > 0.97) return "New Moon";
  if (p < 0.22) return "Waxing Crescent";
  if (p < 0.28) return "First Quarter";
  if (p < 0.47) return "Waxing Gibbous";
  if (p < 0.53) return "Full Moon";
  if (p < 0.72) return "Waning Gibbous";
  if (p < 0.78) return "Last Quarter";
  return "Waning Crescent";
}

export function computeMoon(date: Date, lat: number, lon: number): MoonData {
  const observer = makeObserver(lat, lon);
  const moonPhase = Astronomy.MoonPhase(date);
  const phase = moonPhase / 360;

  const { altitude, azimuth } = getAltAz(Astronomy.Body.Moon, date, observer);
  const { rise, set } = getRiseSet(Astronomy.Body.Moon, date, observer);
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, date);

  // Next full moon (target longitude 180°)
  const nextFull = Astronomy.SearchMoonPhase(180, date, 30);
  // Next new moon (target longitude 0°)
  const nextNew = Astronomy.SearchMoonPhase(0, date, 30);

  // Moon distance
  const moonVec = Astronomy.GeoMoon(date);
  const moonDistAU = Math.sqrt(
    moonVec.x * moonVec.x + moonVec.y * moonVec.y + moonVec.z * moonVec.z
  );
  const distanceKm = Math.round(moonDistAU * 149597870.7);

  // Age: days since last new moon
  const lastNew = Astronomy.SearchMoonPhase(0, new Date(date.getTime() - 30 * 86400000), 30);
  const age = lastNew
    ? Math.round(((date.getTime() - lastNew.date.getTime()) / 86400000) * 10) / 10
    : 0;

  return {
    phase,
    phaseName: getMoonPhaseName(phase),
    illumination: Math.round(illum.phase_fraction * 1000) / 10,
    altitude,
    azimuth,
    riseTime: formatTime(rise),
    setTime: formatTime(set),
    age,
    distanceKm,
    nextFullMoon: nextFull ? nextFull.date.toISOString() : "",
    nextNewMoon: nextNew ? nextNew.date.toISOString() : "",
  };
}

export interface SkyOverviewData {
  moonPhase: number;
  moonPhaseName: string;
  moonIllumination: number;
  visiblePlanetCount: number;
  visibleDeepSkyCount: number;
  solarNoon: string;
  sunsetTime: string;
  sunriseTime: string;
  astronomicalTwilightEnd: string;
  astronomicalTwilightStart: string;
  locationName: string;
  localTime: string;
}

export function computeSkyOverview(
  date: Date,
  lat: number,
  lon: number
): SkyOverviewData {
  const observer = makeObserver(lat, lon);
  const moonPhase = Astronomy.MoonPhase(date);
  const phase = moonPhase / 360;
  const moonIllum = Astronomy.Illumination(Astronomy.Body.Moon, date);

  // Sun times
  const noon = new Date(date);
  noon.setHours(0, 0, 0, 0);

  let sunriseTime = "";
  let sunsetTime = "";
  let solarNoon = "";
  let astroTwilightEnd = "";
  let astroTwilightStart = "";

  try {
    const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, 1, noon, 1);
    const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, noon, 1);
    sunriseTime = sunrise ? sunrise.date.toISOString() : "";
    sunsetTime = sunset ? sunset.date.toISOString() : "";

    // Solar noon: midpoint of sunrise and sunset
    if (sunrise && sunset) {
      const solarNoonDate = new Date(
        (sunrise.date.getTime() + sunset.date.getTime()) / 2
      );
      solarNoon = solarNoonDate.toISOString();
    }

    // Astronomical twilight: sun at -18° below horizon
    const ASTRO_DIP = -18;
    const astroEnd = Astronomy.SearchAltitude(
      Astronomy.Body.Sun,
      observer,
      -1,
      noon,
      1,
      ASTRO_DIP
    );
    const astroStart = Astronomy.SearchAltitude(
      Astronomy.Body.Sun,
      observer,
      1,
      noon,
      1,
      ASTRO_DIP
    );
    astroTwilightEnd = astroEnd ? astroEnd.date.toISOString() : sunsetTime;
    astroTwilightStart = astroStart ? astroStart.date.toISOString() : sunriseTime;
  } catch {
    // Polar day/night — leave empty
  }

  // Count visible planets (altitude > 5°)
  const planets = computePlanets(date, lat, lon);
  const visiblePlanetCount = planets.filter((p) => p.isVisible).length;

  return {
    moonPhase: Math.round(phase * 1000) / 1000,
    moonPhaseName: getMoonPhaseName(phase),
    moonIllumination: Math.round(moonIllum.phase_fraction * 1000) / 10,
    visiblePlanetCount,
    visibleDeepSkyCount: 12, // Approximate — computed separately in deep sky endpoint
    solarNoon,
    sunsetTime,
    sunriseTime,
    astronomicalTwilightEnd: astroTwilightEnd,
    astronomicalTwilightStart: astroTwilightStart,
    locationName: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
    localTime: date.toISOString(),
  };
}

export interface StarData {
  name: string;
  constellation: string;
  altitude: number;
  azimuth: number;
  magnitude: number;
  spectralType: string;
  distanceLY: number;
  description: string;
  isCircumpolar: boolean;
  riseTime: string | null;
  setTime: string | null;
}

// Notable bright stars catalog (J2000 coordinates: RA in hours, Dec in degrees)
const BRIGHT_STARS = [
  { name: "Sirius", ra: 6.7525, dec: -16.7161, mag: -1.46, spectral: "A1V", dist: 8.6, constellation: "Canis Major", desc: "The brightest star in the night sky, also known as the Dog Star. Part of the Winter Triangle asterism." },
  { name: "Canopus", ra: 6.3992, dec: -52.6957, mag: -0.72, spectral: "F0Ib", dist: 310, constellation: "Carina", desc: "The second-brightest star, used historically for navigation in the Southern Hemisphere." },
  { name: "Arcturus", ra: 14.2611, dec: 19.1822, mag: -0.05, spectral: "K0III", dist: 37, constellation: "Boötes", desc: "A giant orange star and the brightest in the northern celestial hemisphere. Part of the Spring Triangle." },
  { name: "Vega", ra: 18.6156, dec: 38.7836, mag: 0.03, spectral: "A0V", dist: 25, constellation: "Lyra", desc: "A brilliant blue-white star and part of the Summer Triangle. Was the North Star 14,000 years ago." },
  { name: "Capella", ra: 5.2781, dec: 45.9981, mag: 0.08, spectral: "G5III", dist: 43, constellation: "Auriga", desc: "A yellow giant actually made of two stars orbiting each other. The sixth-brightest star overall." },
  { name: "Rigel", ra: 5.2423, dec: -8.2017, mag: 0.13, spectral: "B8Iae", dist: 860, constellation: "Orion", desc: "A blue supergiant marking Orion's foot. One of the most luminous stars in the Milky Way." },
  { name: "Procyon", ra: 7.6553, dec: 5.2250, mag: 0.34, spectral: "F5IV", dist: 11.5, constellation: "Canis Minor", desc: "Part of the Winter Triangle. Its name means 'before the dog', rising just before Sirius." },
  { name: "Betelgeuse", ra: 5.9195, dec: 7.4071, mag: 0.42, spectral: "M1Iab", dist: 700, constellation: "Orion", desc: "A red supergiant marking Orion's shoulder. One of the largest stars known — it may go supernova relatively soon." },
  { name: "Altair", ra: 19.8463, dec: 8.8683, mag: 0.76, spectral: "A7V", dist: 16.7, constellation: "Aquila", desc: "Part of the Summer Triangle. It spins so fast it bulges noticeably at the equator." },
  { name: "Aldebaran", ra: 4.5987, dec: 16.5093, mag: 0.86, spectral: "K5III", dist: 65, constellation: "Taurus", desc: "A red giant marking the eye of Taurus the Bull. The name means 'the follower' in Arabic." },
  { name: "Antares", ra: 16.4901, dec: -26.4320, mag: 0.96, spectral: "M1Ib", dist: 550, constellation: "Scorpius", desc: "The Heart of the Scorpion. A red supergiant so large it would extend to the asteroid belt if placed at the Sun." },
  { name: "Spica", ra: 13.4199, dec: -11.1614, mag: 0.97, spectral: "B1V", dist: 250, constellation: "Virgo", desc: "The brightest star in Virgo, a binary system of two close hot blue stars orbiting each other every 4 days." },
  { name: "Pollux", ra: 7.7553, dec: 28.0261, mag: 1.14, spectral: "K0III", dist: 34, constellation: "Gemini", desc: "The brighter of the twin stars in Gemini. Has a confirmed exoplanet orbiting it." },
  { name: "Fomalhaut", ra: 22.9608, dec: -29.6222, mag: 1.16, spectral: "A3V", dist: 25, constellation: "Piscis Austrinus", desc: "The 'Autumn Star', lonely and bright in an otherwise dim region. Has a debris disk that may harbor planets." },
  { name: "Deneb", ra: 20.6905, dec: 45.2803, mag: 1.25, spectral: "A2Ia", dist: 2600, constellation: "Cygnus", desc: "Part of the Summer Triangle. Despite being one of the farthest bright stars, its sheer luminosity keeps it visible." },
  { name: "Regulus", ra: 10.1395, dec: 11.9672, mag: 1.35, spectral: "B7V", dist: 79, constellation: "Leo", desc: "The Heart of the Lion, lies almost exactly on the ecliptic. It spins so fast it's noticeably flattened." },
  { name: "Adhara", ra: 6.9771, dec: -28.9720, mag: 1.50, spectral: "B2II", dist: 430, constellation: "Canis Major", desc: "One of the hottest bright stars visible to the naked eye. Was the brightest star in the sky 4.7 million years ago." },
  { name: "Castor", ra: 7.5766, dec: 31.8883, mag: 1.58, spectral: "A2V", dist: 52, constellation: "Gemini", desc: "The other Gemini twin — actually a system of six stars in three pairs orbiting each other." },
  { name: "Shaula", ra: 17.5601, dec: -37.1038, mag: 1.62, spectral: "B1.5IV", dist: 570, constellation: "Scorpius", desc: "The stinger in the tail of Scorpius. A triple star system that is one of the hottest bright stars." },
  { name: "Bellatrix", ra: 5.4188, dec: 6.3497, mag: 1.64, spectral: "B2III", dist: 240, constellation: "Orion", desc: "The Amazon Star, marking Orion's left shoulder. A massive hot blue-white giant burning through its fuel rapidly." },
  { name: "Elnath", ra: 5.4382, dec: 28.6075, mag: 1.65, spectral: "B7III", dist: 130, constellation: "Taurus", desc: "The tip of the Bull's northern horn. Shared between Taurus and Auriga in older sky atlases." },
  { name: "Miaplacidus", ra: 9.2200, dec: -69.7172, mag: 1.67, spectral: "A2III", dist: 111, constellation: "Carina", desc: "Part of the ancient constellation Argo Navis, the ship of the Argonauts. Best seen from southern latitudes." },
  { name: "Alnilam", ra: 5.6035, dec: -1.2019, mag: 1.70, spectral: "B0Iae", dist: 1340, constellation: "Orion", desc: "The central star of Orion's Belt, a blue supergiant 375,000 times more luminous than the Sun." },
  { name: "Alnitak", ra: 5.6791, dec: -1.9426, mag: 1.74, spectral: "O9.7Ib", dist: 800, constellation: "Orion", desc: "The easternmost star of Orion's Belt. Near the famous Horsehead Nebula and Flame Nebula." },
  { name: "Mintaka", ra: 5.5336, dec: -0.2991, mag: 2.21, spectral: "O9.5II", dist: 900, constellation: "Orion", desc: "The westernmost star of Orion's Belt. Nearly exactly on the celestial equator, it rises due east." },
  { name: "Polaris", ra: 2.5303, dec: 89.2641, mag: 1.98, spectral: "F7Ib", dist: 433, constellation: "Ursa Minor", desc: "The North Star, within 1° of the north celestial pole. It has been used for navigation for millennia." },
  { name: "Dubhe", ra: 11.0621, dec: 61.7511, mag: 1.79, spectral: "K0III", dist: 124, constellation: "Ursa Major", desc: "The leading star of the Big Dipper's bowl, pointing toward Polaris. A circumpolar star from mid-latitudes." },
  { name: "Alkaid", ra: 13.7923, dec: 49.3133, mag: 1.85, spectral: "B3V", dist: 101, constellation: "Ursa Major", desc: "The tip of the Big Dipper's handle. Despite being in Ursa Major, it is not gravitationally bound to the cluster." },

  // ── Ursa Major: complete the Big Dipper bowl & handle ────────────────────────
  { name: "Alioth",   ra: 12.9004, dec: 55.9600, mag: 1.77, spectral: "A0p",   dist: 81,  constellation: "Ursa Major",    desc: "The brightest star in Ursa Major, forming the base of the Dipper's handle. A peculiar A-type giant with variable magnetic activity." },
  { name: "Merak",    ra: 11.0307, dec: 56.3824, mag: 2.37, spectral: "A1V",   dist: 79,  constellation: "Ursa Major",    desc: "The southern pointer of the Big Dipper bowl. Drawing a line from Merak through Dubhe leads straight to Polaris." },
  { name: "Phecda",   ra: 11.8971, dec: 53.6948, mag: 2.44, spectral: "A0V",   dist: 84,  constellation: "Ursa Major",    desc: "The southeastern corner of the Big Dipper's bowl. Part of the Ursa Major Moving Group of co-moving stars." },
  { name: "Megrez",   ra: 12.2568, dec: 57.0326, mag: 3.31, spectral: "A3V",   dist: 81,  constellation: "Ursa Major",    desc: "The faintest star of the Big Dipper, sitting at the junction of the bowl and handle. Its name means 'root of the tail'." },
  { name: "Mizar",    ra: 13.3988, dec: 54.9254, mag: 2.27, spectral: "A2V",   dist: 86,  constellation: "Ursa Major",    desc: "The second star from the end of the Dipper's handle. Has a famous naked-eye companion, Alcor — a traditional eyesight test." },

  // ── Orion: complete the figure ────────────────────────────────────────────────
  { name: "Saiph",    ra: 5.7956,  dec: -9.6697, mag: 2.06, spectral: "B0.5III", dist: 720, constellation: "Orion",   desc: "Orion's right knee, mirroring Rigel on the other side. Despite its similar distance to Rigel it appears much dimmer due to its ultraviolet output." },
  { name: "Meissa",   ra: 5.5833,  dec:  9.9342, mag: 3.39, spectral: "O8III",  dist: 1100, constellation: "Orion",   desc: "Orion's head, a hot blue giant forming a small arc of stars sometimes called the 'Lambda Orionis Ring'." },

  // ── Scorpius: body and tail ───────────────────────────────────────────────────
  { name: "Graffias",  ra: 16.0914, dec: -19.8056, mag: 2.62, spectral: "B1V",    dist: 530, constellation: "Scorpius",  desc: "One of the claws of Scorpius, also called Acrab or Beta Scorpii. A complex multiple-star system at least six components." },
  { name: "Dschubba",  ra: 16.0050, dec: -22.6217, mag: 2.29, spectral: "B0.2IV", dist: 490, constellation: "Scorpius",  desc: "The forehead of the Scorpion, marking the start of the body. It had a dramatic brightening event in 2000." },
  { name: "Sargas",    ra: 17.6220, dec: -42.9979, mag: 1.87, spectral: "F1II",   dist: 300, constellation: "Scorpius",  desc: "The brightest star in the curved tail of Scorpius. Its ancient Babylonian name means 'scorpion' — one of the oldest stellar names." },
  { name: "Lesath",   ra: 17.5122, dec: -37.2958, mag: 2.70, spectral: "B2IV",   dist: 580, constellation: "Scorpius",  desc: "The upper stinger of Scorpius, paired with Shaula. The two make up the 'cat's eyes' at the tip of the scorpion's tail." },

  // ── Canis Major: the body of the dog ─────────────────────────────────────────
  { name: "Mirzam",   ra: 6.3783,  dec: -17.9559, mag: 1.98, spectral: "B1II",   dist: 500, constellation: "Canis Major", desc: "The 'Announcer', rising just before Sirius. A brilliant blue-white supergiant and Beta Canis Majoris prototype variable." },
  { name: "Wezen",    ra: 7.1397,  dec: -26.3932, mag: 1.83, spectral: "F8Ia",   dist: 1600, constellation: "Canis Major", desc: "A yellow supergiant marking the dog's hindquarters. One of the intrinsically most luminous stars visible to the naked eye." },
  { name: "Aludra",   ra: 7.4019,  dec: -29.3030, mag: 2.45, spectral: "B5Ia",   dist: 3200, constellation: "Canis Major", desc: "The tail tip of Canis Major. One of the most intrinsically luminous supergiants in the Milky Way, over 100,000 solar luminosities." },

  // ── Gemini: the twin bodies ───────────────────────────────────────────────────
  { name: "Alhena",   ra: 6.6283,  dec: 16.3994, mag: 1.93, spectral: "A0IV",   dist: 109, constellation: "Gemini",     desc: "The foot of Pollux, the brighter twin. A blue-white subgiant near the ecliptic, often visited by solar-system objects." },
  { name: "Tejat",    ra: 6.3829,  dec: 22.5137, mag: 2.87, spectral: "M3III",  dist: 230, constellation: "Gemini",     desc: "The foot of Castor, a cool red giant also known as Mu Geminorum. One of the brighter red giants in the sky." },
  { name: "Propus",   ra: 6.2481,  dec: 22.5068, mag: 3.31, spectral: "M6III",  dist: 880, constellation: "Gemini",     desc: "A Mira-type variable giant near Castor's foot, also known as Eta Geminorum. Varies noticeably over about 230 days." },

  // ── Cygnus: the Northern Cross ────────────────────────────────────────────────
  { name: "Sadr",      ra: 20.3704, dec: 40.2567, mag: 2.23, spectral: "F8Ib",  dist: 1800, constellation: "Cygnus",    desc: "The heart of the swan, marking the center of the Northern Cross. Surrounded by a beautiful region of nebulosity." },
  { name: "Albireo",   ra: 19.5123, dec: 27.9597, mag: 3.09, spectral: "K2II",  dist: 430,  constellation: "Cygnus",    desc: "The beak of the swan, one of the most celebrated double stars. Through a telescope it displays a stunning gold and blue pair." },
  { name: "Gienah Cygni", ra: 20.7705, dec: 33.9703, mag: 2.46, spectral: "K0III", dist: 72, constellation: "Cygnus",  desc: "The right wing tip of the swan, also called Epsilon Cygni. An orange giant offering a warm hue against the Milky Way." },
  { name: "Rukh",      ra: 19.7496, dec: 45.1306, mag: 2.87, spectral: "B9III", dist: 170,  constellation: "Cygnus",    desc: "The left wing of the swan, also called Delta Cygni. A binary system: a bright blue-white giant with a fainter companion." },

  // ── Leo: the sickle and hindquarters ─────────────────────────────────────────
  { name: "Denebola",  ra: 11.8176, dec: 14.5722, mag: 2.14, spectral: "A3V",   dist: 36,  constellation: "Leo",        desc: "The lion's tail, a young and active star surrounded by a debris disk hinting at a planetary system in formation." },
  { name: "Algieba",   ra: 10.3328, dec: 19.8414, mag: 2.28, spectral: "K1III", dist: 130, constellation: "Leo",        desc: "The mane of Leo, a fine double star of two orange giants orbiting each other over 500 years. Has a confirmed exoplanet." },
  { name: "Zosma",     ra: 11.2352, dec: 20.5237, mag: 2.56, spectral: "A4V",   dist: 58,  constellation: "Leo",        desc: "On the lion's haunches, also called Delta Leonis. A rapidly rotating star that is nearly at the equator of the sky's ecliptic plane." },

  // ── Cassiopeia: the W ─────────────────────────────────────────────────────────
  { name: "Schedar",   ra: 0.6751,  dec: 56.5373, mag: 2.24, spectral: "K0IIIa", dist: 228, constellation: "Cassiopeia", desc: "The brightest star of Cassiopeia, a slightly variable orange giant. Its name means 'breast' in Arabic." },
  { name: "Caph",      ra: 0.1528,  dec: 59.1498, mag: 2.27, spectral: "F2III",  dist: 54,  constellation: "Cassiopeia", desc: "The westernmost star of the Cassiopeia W, also on the 0h hour circle. Used historically as a reference for measuring the sky." },
  { name: "Navi",      ra: 0.9454,  dec: 60.7167, mag: 2.47, spectral: "B0IVe",  dist: 610, constellation: "Cassiopeia", desc: "The central star of the W, a hot Be-type variable. It was informally named 'Navi' by astronaut Gus Grissom as a tribute." },
  { name: "Ruchbah",   ra: 1.4305,  dec: 60.2353, mag: 2.68, spectral: "A5V",   dist: 99,  constellation: "Cassiopeia", desc: "The knee of the seated queen, a well-studied eclipsing binary with a 759-day period caused by a surrounding dust disk." },
  { name: "Segin",     ra: 1.9068,  dec: 63.6700, mag: 3.37, spectral: "B3III", dist: 440, constellation: "Cassiopeia", desc: "The eastern tip of the W, a blue giant and the faintest of the five main Cassiopeia stars. Named in modern times." },

  // ── Sagittarius: the Teapot ───────────────────────────────────────────────────
  { name: "Kaus Australis", ra: 18.4029, dec: -34.3846, mag: 1.79, spectral: "B9III", dist: 143, constellation: "Sagittarius", desc: "The brightest star of Sagittarius, marking the base of the Teapot spout. Its name is Latin-Arabic for 'southern bow'." },
  { name: "Nunki",          ra: 18.9211, dec: -26.2967, mag: 2.05, spectral: "B2.5V", dist: 228, constellation: "Sagittarius", desc: "One of the Teapot's handle stars. The NASA Voyager 2 spacecraft is heading in this general direction and will pass nearby in 300,000 years." },
  { name: "Kaus Media",     ra: 18.3499, dec: -29.8281, mag: 2.70, spectral: "K3III", dist: 350, constellation: "Sagittarius", desc: "The central star of the Archer's bow and middle of the Teapot spout. An orange giant well past the main sequence." },
  { name: "Kaus Borealis",  ra: 18.4667, dec: -25.4219, mag: 2.81, spectral: "K1III", dist: 77,  constellation: "Sagittarius", desc: "The tip of the Archer's bow and top of the Teapot spout. Its name means 'northern bow' in Arabic-Latin." },
  { name: "Ascella",        ra: 19.0432, dec: -29.8808, mag: 2.59, spectral: "A2V",   dist: 89,  constellation: "Sagittarius", desc: "One of the Teapot handle stars, also called Zeta Sagittarii. A binary system of two A-type stars orbiting every 21 years." },

  // ── Perseus ───────────────────────────────────────────────────────────────────
  { name: "Mirfak",    ra: 3.4054,  dec: 49.8612, mag: 1.79, spectral: "F5Ib",  dist: 590, constellation: "Perseus",    desc: "The brightest star in Perseus and the center of the Perseus OB1 association. A luminous yellow supergiant." },
  { name: "Algol",     ra: 3.1360,  dec: 40.9557, mag: 2.09, spectral: "B8V",   dist: 93,  constellation: "Perseus",    desc: "The 'Demon Star', the most famous eclipsing binary. Every 2.87 days, a dimmer companion passes in front and dims it noticeably." },

  // ── Boötes: the kite ─────────────────────────────────────────────────────────
  { name: "Muphrid",   ra: 13.9114, dec: 18.3978, mag: 2.68, spectral: "G0IV",  dist: 37,  constellation: "Boötes",     desc: "Adjacent to Arcturus and part of the Boötes kite, also called Eta Boötis. A slightly evolved yellow-white star with a known companion." },
  { name: "Izar",      ra: 14.7499, dec: 27.0742, mag: 2.70, spectral: "K0II",  dist: 210, constellation: "Boötes",     desc: "One of the finest double stars in the sky, with an orange giant primary and a blue-white companion — nicknamed Pulcherrima ('most beautiful')." },
  { name: "Nekkar",    ra: 15.0325, dec: 40.3906, mag: 3.49, spectral: "G8III", dist: 225, constellation: "Boötes",     desc: "The head of Boötes the Herdsman, completing the top of the kite shape. Slightly evolved with a subgiant companion star." },

  // ── Southern anchors (Centaurus) ──────────────────────────────────────────────
  { name: "Hadar",           ra: 14.0638, dec: -60.3733, mag: 0.61,  spectral: "B1III", dist: 350, constellation: "Centaurus",    desc: "Also called Agena or Beta Centauri, this brilliant blue giant is the 11th brightest star. Forms the Southern Pointer pair with Rigil Kentaurus." },
  { name: "Rigil Kentaurus", ra: 14.6600, dec: -60.8350, mag: -0.27, spectral: "G2V",   dist: 4.4, constellation: "Centaurus",    desc: "Alpha Centauri, the nearest star system to the Sun at just 4.4 light-years. Appears as the 3rd brightest star from Earth." },
  { name: "Menkent",         ra: 14.1113, dec: -36.3700, mag: 2.06,  spectral: "K0III", dist: 61,  constellation: "Centaurus",    desc: "The shoulder of the Centaur, also called Theta Centauri. An orange giant and one of the brighter stars of this vast southern constellation." },
  { name: "Muhlifain",       ra: 12.6920, dec: -48.9597, mag: 2.85,  spectral: "A1IV",  dist: 130, constellation: "Centaurus",    desc: "Also called Gamma Centauri, a close binary system of two nearly identical white stars that appear as one to the naked eye." },

  // ── Aquila additions (for proper eagle body) ──────────────────────────────────
  { name: "Tarazed",  ra: 19.7712, dec: 10.6132, mag: 2.72, spectral: "K3II",  dist: 395, constellation: "Aquila", desc: "The shoulder of the Eagle, also called Gamma Aquilae. An orange bright giant that forms a notable trio with Altair and Alshain." },
  { name: "Alshain",  ra: 19.9217, dec:  6.4076, mag: 3.71, spectral: "G8IV",  dist: 45,  constellation: "Aquila", desc: "Below Altair forming the Eagle's body spine, also called Beta Aquilae. A slightly evolved yellow-white subgiant." },

  // ── Taurus additions (Hyades V-shape) ────────────────────────────────────────
  { name: "Ain",      ra: 4.4770,  dec: 19.1806, mag: 3.53, spectral: "K0III", dist: 155, constellation: "Taurus",  desc: "The northern eye of Taurus the Bull, also called Epsilon Tauri. An orange giant and one of the Hyades star cluster members." },

  // ── Perseus additions ─────────────────────────────────────────────────────────
  { name: "Atik",     ra: 3.9020,  dec: 31.8836, mag: 2.85, spectral: "B1IV",  dist: 750, constellation: "Perseus", desc: "Also called Zeta Persei, it marks the waist of the hero. A blue supergiant among the hottest and most luminous stars of the Perseus OB2 association." },

  // ── Auriga additions (pentagon) ───────────────────────────────────────────────
  { name: "Menkalinan", ra: 5.9921, dec: 44.9475, mag: 1.90, spectral: "A2IV", dist: 82, constellation: "Auriga", desc: "Also called Beta Aurigae, the second-brightest star in Auriga. A double-lined spectroscopic binary system of two nearly identical white giant stars." },
];

/**
 * Compute rise and set times for a fixed star (RA/Dec) using sidereal time.
 * Returns null times for circumpolar stars (never set) or stars that never rise.
 */
function getStarRiseSet(
  star: { ra: number; dec: number },
  date: Date,
  lat: number,
  lon: number
): { rise: Date | null; set: Date | null; isCircumpolar: boolean } {
  const latRad = lat * Math.PI / 180;
  const decRad = star.dec * Math.PI / 180;
  // Standard atmospheric refraction dip for stars at horizon
  const h0Rad = -0.5667 * Math.PI / 180;

  // Hour angle at rise/set: cos(HA) = (sin(h0) - sin(dec)*sin(lat)) / (cos(dec)*cos(lat))
  const cosHA =
    (Math.sin(h0Rad) - Math.sin(decRad) * Math.sin(latRad)) /
    (Math.cos(decRad) * Math.cos(latRad));

  if (cosHA < -1) {
    // Star never dips below horizon: circumpolar
    return { rise: null, set: null, isCircumpolar: true };
  }
  if (cosHA > 1) {
    // Star never rises above horizon
    return { rise: null, set: null, isCircumpolar: false };
  }

  const HAHours = (Math.acos(cosHA) * 180 / Math.PI) / 15; // degrees → hours

  // Rise and set in Local Sidereal Time
  const riseLST = ((star.ra - HAHours) % 24 + 24) % 24;
  const setLST  = ((star.ra + HAHours) % 24 + 24) % 24;

  // Convert LST to UTC via Greenwich Mean Sidereal Time at midnight
  const midnight = new Date(date);
  midnight.setUTCHours(0, 0, 0, 0);
  const gmst0 = Astronomy.SiderealTime(midnight); // hours

  // LST = GMST + lon/15  →  GMST = LST - lon/15
  const riseGMST = ((riseLST - lon / 15) % 24 + 24) % 24;
  const setGMST  = ((setLST  - lon / 15) % 24 + 24) % 24;

  // GMST advances ~1.00274 sidereal hours per solar hour
  const siderealRate = 1.00274;
  const riseDeltaHours = ((riseGMST - gmst0) % 24 + 24) % 24 / siderealRate;
  const setDeltaHours  = ((setGMST  - gmst0) % 24 + 24) % 24 / siderealRate;

  return {
    rise: new Date(midnight.getTime() + riseDeltaHours * 3_600_000),
    set:  new Date(midnight.getTime() + setDeltaHours  * 3_600_000),
    isCircumpolar: false,
  };
}

export function computeStars(date: Date, lat: number, lon: number): StarData[] {
  const observer = makeObserver(lat, lon);
  const stars: StarData[] = [];

  for (const star of BRIGHT_STARS) {
    try {
      // Convert star RA/Dec to altitude/azimuth
      const horizontal = Astronomy.Horizon(date, observer, star.ra, star.dec, "normal");
      const altitude = Math.round(horizontal.altitude * 10) / 10;
      const azimuth = Math.round(horizontal.azimuth * 10) / 10;

      // Compute accurate rise/set using sidereal time
      const { rise, set, isCircumpolar } = getStarRiseSet(star, date, lat, lon);

      const riseTime = formatTime(rise);
      const setTime  = formatTime(set);

      stars.push({
        name: star.name,
        constellation: star.constellation,
        altitude,
        azimuth,
        magnitude: star.mag,
        spectralType: star.spectral,
        distanceLY: star.dist,
        description: star.desc,
        isCircumpolar,
        riseTime,
        setTime,
      });
    } catch {
      // skip
    }
  }

  return stars.sort((a, b) => b.altitude - a.altitude);
}

export interface DeepSkyObjectData {
  id: string;
  name: string;
  type: string;
  constellation: string;
  magnitude: number;
  altitude: number;
  azimuth: number;
  riseTime: string | null;
  setTime: string | null;
  isVisible: boolean;
  description: string;
  distanceLY: number;
  angularSize: string;
}

// Messier catalog (selected famous objects) — RA in hours, Dec in degrees
const MESSIER_CATALOG = [
  { id: "M1", name: "Crab Nebula", type: "Supernova Remnant", constellation: "Taurus", ra: 5.5755, dec: 22.0145, mag: 8.4, dist: 6500, size: "7×5 arcmin", desc: "The remnant of a supernova observed in 1054 AD. At its center lies a pulsar spinning 30 times per second." },
  { id: "M8", name: "Lagoon Nebula", type: "Emission Nebula", constellation: "Sagittarius", ra: 18.0647, dec: -24.3833, mag: 6.0, dist: 4100, size: "90×40 arcmin", desc: "A stunning cloud of glowing gas and dust where new stars are born. Visible to the naked eye as a hazy patch." },
  { id: "M13", name: "Hercules Cluster", type: "Globular Cluster", constellation: "Hercules", ra: 16.6947, dec: 36.4608, mag: 5.8, dist: 22200, size: "20 arcmin", desc: "The great globular cluster in Hercules, containing about 300,000 stars. The target of the 1974 Arecibo message." },
  { id: "M27", name: "Dumbbell Nebula", type: "Planetary Nebula", constellation: "Vulpecula", ra: 19.9936, dec: 22.7214, mag: 7.5, dist: 1360, size: "8×5.7 arcmin", desc: "The first planetary nebula ever discovered. The expelled outer layers of a dying star glow in striking shapes." },
  { id: "M31", name: "Andromeda Galaxy", type: "Spiral Galaxy", constellation: "Andromeda", ra: 0.7122, dec: 41.2689, mag: 3.44, dist: 2537000, size: "3.2°×1°", desc: "Our nearest large galactic neighbor, containing over a trillion stars. On a collision course with the Milky Way in 4.5 billion years." },
  { id: "M33", name: "Triangulum Galaxy", type: "Spiral Galaxy", constellation: "Triangulum", ra: 1.5642, dec: 30.6600, mag: 5.72, dist: 2730000, size: "70×40 arcmin", desc: "The third-largest galaxy in the Local Group. The most distant object visible to the naked eye under excellent conditions." },
  { id: "M42", name: "Orion Nebula", type: "Emission Nebula", constellation: "Orion", ra: 5.5883, dec: -5.3911, mag: 4.0, dist: 1344, size: "65×60 arcmin", desc: "One of the most studied objects in the sky — a stellar nursery visible to the naked eye. The Trapezium cluster lies within." },
  { id: "M44", name: "Beehive Cluster", type: "Open Cluster", constellation: "Cancer", ra: 8.6672, dec: 19.6675, mag: 3.7, dist: 577, size: "95 arcmin", desc: "One of the nearest open clusters to Earth. Known since antiquity as Praesepe (the Manger) or the Beehive." },
  { id: "M45", name: "Pleiades", type: "Open Cluster", constellation: "Taurus", ra: 3.7875, dec: 24.1167, mag: 1.6, dist: 444, size: "110 arcmin", desc: "The Seven Sisters, one of the most famous and brightest clusters in the sky. Mentioned in the Bible, Homer's Odyssey, and the Iliad." },
  { id: "M51", name: "Whirlpool Galaxy", type: "Spiral Galaxy", constellation: "Canes Venatici", ra: 13.4997, dec: 47.1952, mag: 8.4, dist: 23160000, size: "11×7 arcmin", desc: "A stunning face-on spiral galaxy actively interacting with its smaller companion NGC 5195. The first galaxy where spiral structure was recorded." },
  { id: "M57", name: "Ring Nebula", type: "Planetary Nebula", constellation: "Lyra", ra: 18.8928, dec: 33.0289, mag: 8.8, dist: 2300, size: "1.5×1 arcmin", desc: "A perfect smoke-ring of glowing gas surrounding a dying star's white dwarf core. A classic telescope showpiece." },
  { id: "M64", name: "Black Eye Galaxy", type: "Spiral Galaxy", constellation: "Coma Berenices", ra: 12.9456, dec: 21.6825, mag: 8.52, dist: 17000000, size: "10×5 arcmin", desc: "Named for the dark band of dust in front of a bright nucleus. Has an unusual inner disk rotating opposite to the outer disk." },
  { id: "M78", name: "Orion Reflection Nebula", type: "Reflection Nebula", constellation: "Orion", ra: 5.7797, dec: 0.0781, mag: 8.3, dist: 1600, size: "8×6 arcmin", desc: "The brightest reflection nebula in the sky, shining by the light of embedded stars. Part of the vast Orion Molecular Cloud." },
  { id: "M81", name: "Bode's Galaxy", type: "Spiral Galaxy", constellation: "Ursa Major", ra: 9.9256, dec: 69.0653, mag: 6.94, dist: 11740000, size: "26×14 arcmin", desc: "One of the brightest galaxies in the sky. Together with M82, they form a famous pair — both visible in the same binocular field." },
  { id: "M82", name: "Cigar Galaxy", type: "Irregular Galaxy", constellation: "Ursa Major", ra: 9.9275, dec: 69.6797, mag: 8.41, dist: 11400000, size: "11×4.3 arcmin", desc: "A starburst galaxy undergoing violent star formation, driven by gravitational interaction with M81. Has a powerful galactic wind." },
  { id: "M97", name: "Owl Nebula", type: "Planetary Nebula", constellation: "Ursa Major", ra: 11.2456, dec: 55.0189, mag: 9.9, dist: 2030, size: "3.4 arcmin", desc: "Named for its two dark patches resembling owl eyes. A perfectly round planetary nebula near the Big Dipper." },
  { id: "M101", name: "Pinwheel Galaxy", type: "Spiral Galaxy", constellation: "Ursa Major", ra: 14.0533, dec: 54.3492, mag: 7.86, dist: 20900000, size: "28.8×26.9 arcmin", desc: "A nearly perfect face-on spiral with asymmetric arms loaded with star-forming regions. Hosted supernovae in 2011 and 2023." },
  { id: "M104", name: "Sombrero Galaxy", type: "Spiral Galaxy", constellation: "Virgo", ra: 12.6661, dec: -11.6231, mag: 8.98, dist: 28000000, size: "8.7×3.5 arcmin", desc: "Named for its resemblance to a Mexican hat. Has a massive central bulge and a prominent dark dust lane cutting across it." },
  { id: "M35", name: "M35 Open Cluster", type: "Open Cluster", constellation: "Gemini", ra: 6.1483, dec: 24.3333, mag: 5.1, dist: 2800, size: "28 arcmin", desc: "A rich open cluster near the feet of Gemini. A smaller, more distant cluster NGC 2158 appears nearby in the same field." },
  { id: "M6", name: "Butterfly Cluster", type: "Open Cluster", constellation: "Scorpius", ra: 17.6694, dec: -32.2500, mag: 4.2, dist: 1600, size: "25 arcmin", desc: "Named for its butterfly-like shape. Its brightest star BM Scorpii is an orange supergiant that stands out from the rest." },
  { id: "M7", name: "Ptolemy's Cluster", type: "Open Cluster", constellation: "Scorpius", ra: 17.8978, dec: -34.8333, mag: 3.3, dist: 980, size: "80 arcmin", desc: "One of the most ancient recorded celestial objects. Ptolemy noted it in 130 AD. Easily visible to the naked eye near Scorpius's tail." },
  { id: "M11", name: "Wild Duck Cluster", type: "Open Cluster", constellation: "Scutum", ra: 18.8511, dec: -6.2667, mag: 5.8, dist: 6200, size: "14 arcmin", desc: "One of the richest and most compact open clusters known, containing about 2900 stars within a tight area." },
  { id: "M17", name: "Omega Nebula", type: "Emission Nebula", constellation: "Sagittarius", ra: 18.3461, dec: -16.1792, mag: 6.0, dist: 5500, size: "46×37 arcmin", desc: "Also known as the Swan Nebula. One of the brightest and most massive star-forming regions in the Milky Way." },
  { id: "M20", name: "Trifid Nebula", type: "Emission/Reflection Nebula", constellation: "Sagittarius", ra: 18.0436, dec: -22.9717, mag: 6.3, dist: 5200, size: "28×28 arcmin", desc: "Uniquely split into three lobes by dark dust lanes. Contains both emission (pink) and reflection (blue) regions side by side." },
  { id: "M22", name: "Sagittarius Cluster", type: "Globular Cluster", constellation: "Sagittarius", ra: 18.6069, dec: -23.9044, mag: 5.1, dist: 10400, size: "32 arcmin", desc: "One of the nearest globular clusters to Earth and one of the finest in the sky. A black hole may lurk at its center." },
  { id: "M3", name: "M3 Globular Cluster", type: "Globular Cluster", constellation: "Canes Venatici", ra: 13.7028, dec: 28.3775, mag: 6.2, dist: 33900, size: "18 arcmin", desc: "One of the largest and brightest globular clusters in the sky, containing about 500,000 stars. Often considered the best globular in the northern sky." },
  { id: "M5", name: "M5 Globular Cluster", type: "Globular Cluster", constellation: "Serpens", ra: 15.3094, dec: 2.0808, mag: 5.65, dist: 24500, size: "20 arcmin", desc: "One of the oldest globular clusters known at 13 billion years. Among the largest — its tidal radius spans 200 light-years." },
  { id: "M10", name: "M10 Globular Cluster", type: "Globular Cluster", constellation: "Ophiuchus", ra: 16.9522, dec: -4.1003, mag: 6.6, dist: 14300, size: "20 arcmin", desc: "A bright globular cluster with a notably dense core. Shares the same field as M12 in binoculars." },
  { id: "M36", name: "Pinwheel Cluster", type: "Open Cluster", constellation: "Auriga", ra: 5.6022, dec: 34.1333, mag: 6.3, dist: 4100, size: "12 arcmin", desc: "One of three bright Messier open clusters in Auriga. Young and relatively loose, with about 60 stars." },
  { id: "M37", name: "M37 Open Cluster", type: "Open Cluster", constellation: "Auriga", ra: 5.8728, dec: 32.5500, mag: 5.6, dist: 4500, size: "24 arcmin", desc: "The largest and richest of the three Auriga clusters, containing about 500 stars including a red giant at its center." },
];

export function computeDeepSkyObjects(
  date: Date,
  lat: number,
  lon: number
): DeepSkyObjectData[] {
  const observer = makeObserver(lat, lon);
  const objects: DeepSkyObjectData[] = [];

  for (const obj of MESSIER_CATALOG) {
    try {
      const horizontal = Astronomy.Horizon(date, observer, obj.ra, obj.dec, "normal");
      const altitude = Math.round(horizontal.altitude * 10) / 10;
      const azimuth = Math.round(horizontal.azimuth * 10) / 10;

      objects.push({
        id: obj.id,
        name: obj.name,
        type: obj.type,
        constellation: obj.constellation,
        magnitude: obj.mag,
        altitude,
        azimuth,
        riseTime: null,
        setTime: null,
        isVisible: altitude > 10,
        description: obj.desc,
        distanceLY: obj.dist,
        angularSize: obj.size,
      });
    } catch {
      // skip
    }
  }

  return objects.sort((a, b) => b.altitude - a.altitude);
}

export interface CelestialEventData {
  name: string;
  date: string;
  peak: string;
  type: string;
  description: string;
  visibility: string;
}

export function computeCelestialEvents(
  date: Date,
  _lat: number,
  _lon: number,
  days: number = 90
): CelestialEventData[] {
  const events: CelestialEventData[] = [];
  const now = date.getTime();
  const end = now + days * 24 * 3600 * 1000;

  // Planned celestial events 2025-2026
  const STATIC_EVENTS: Array<{
    name: string;
    dateStr: string;
    peakStr: string;
    type: string;
    description: string;
    visibility: string;
  }> = [
    {
      name: "Perseids Meteor Shower",
      dateStr: "2025-08-11",
      peakStr: "2025-08-12",
      type: "Meteor Shower",
      description: "One of the best annual meteor showers, producing up to 100 meteors per hour at peak. Swift, bright meteors with persistent trains streak from the direction of Perseus.",
      visibility: "Northern Hemisphere favored. Best viewed after midnight in dark skies.",
    },
    {
      name: "Total Lunar Eclipse",
      dateStr: "2025-09-07",
      peakStr: "2025-09-07",
      type: "Eclipse",
      description: "The Moon passes through Earth's umbral shadow, turning a deep red-orange 'Blood Moon' color. Totality lasts about 1 hour 22 minutes.",
      visibility: "Visible from Europe, Africa, Asia, and Eastern South America.",
    },
    {
      name: "Orionids Meteor Shower",
      dateStr: "2025-10-20",
      peakStr: "2025-10-21",
      type: "Meteor Shower",
      description: "Debris from Halley's Comet burns up in Earth's atmosphere. Produces 10-20 fast meteors per hour, some leaving glowing trains.",
      visibility: "Best viewed from both hemispheres after midnight.",
    },
    {
      name: "Leonids Meteor Shower",
      dateStr: "2025-11-17",
      peakStr: "2025-11-18",
      type: "Meteor Shower",
      description: "Produced by Comet Tempel-Tuttle. Usually 10-15 meteors/hr but occasionally produces magnificent storms every 33 years.",
      visibility: "Best from Northern Hemisphere after midnight. Radiant in Leo.",
    },
    {
      name: "Geminids Meteor Shower",
      dateStr: "2025-12-13",
      peakStr: "2025-12-14",
      type: "Meteor Shower",
      description: "The king of meteor showers — up to 120 multicolored meteors per hour. Unusually, it originates from asteroid 3200 Phaethon rather than a comet.",
      visibility: "Excellent from both hemispheres. Active all night.",
    },
    {
      name: "Jupiter at Opposition",
      dateStr: "2025-12-06",
      peakStr: "2025-12-06",
      type: "Opposition",
      description: "Jupiter reaches opposition, rising at sunset and visible all night. At its closest to Earth, appearing larger and brighter than at any other time.",
      visibility: "Visible worldwide all night. Excellent for telescope viewing.",
    },
    {
      name: "Saturn at Opposition",
      dateStr: "2025-09-21",
      peakStr: "2025-09-21",
      type: "Opposition",
      description: "Saturn is at its closest approach to Earth and fully illuminated by the Sun. Perfect time to see its rings tilted at 22° — the best view since 2017.",
      visibility: "Visible worldwide all night. Best for southern observers.",
    },
    {
      name: "Quadrantids Meteor Shower",
      dateStr: "2026-01-02",
      peakStr: "2026-01-03",
      type: "Meteor Shower",
      description: "Short but intense peak of up to 120 meteors per hour. Unusually brief — the peak lasts only 6 hours. Originates from minor planet 2003 EH1.",
      visibility: "Best from Northern Hemisphere. Active January 1-5.",
    },
    {
      name: "Mercury Greatest Elongation East",
      dateStr: "2025-09-22",
      peakStr: "2025-09-22",
      type: "Conjunction",
      description: "Mercury reaches its greatest angular distance from the Sun, making it easiest to spot in the evening sky just after sunset.",
      visibility: "Look low on the western horizon 30-45 minutes after sunset.",
    },
    {
      name: "Venus-Jupiter Conjunction",
      dateStr: "2025-08-23",
      peakStr: "2025-08-23",
      type: "Conjunction",
      description: "Venus and Jupiter appear less than 0.3° apart in the morning sky — both fitting within the same binocular field. A spectacular pairing.",
      visibility: "Visible before sunrise in the eastern sky worldwide.",
    },
    {
      name: "Taurids Meteor Shower",
      dateStr: "2025-11-04",
      peakStr: "2025-11-04",
      type: "Meteor Shower",
      description: "A slow, long-duration shower known for producing bright fireballs. Two branches (north and south) are active simultaneously.",
      visibility: "Best viewed from Northern Hemisphere after midnight.",
    },
    {
      name: "Ursids Meteor Shower",
      dateStr: "2025-12-21",
      peakStr: "2025-12-22",
      type: "Meteor Shower",
      description: "A modest shower (10 meteors/hr) coinciding with the winter solstice. Associated with Comet Tuttle. Circumpolar from high northern latitudes.",
      visibility: "Northern Hemisphere only. All night viewing.",
    },
  ];

  for (const ev of STATIC_EVENTS) {
    const evDate = new Date(ev.peakStr).getTime();
    if (evDate >= now && evDate <= end) {
      events.push({
        name: ev.name,
        date: new Date(ev.dateStr).toISOString(),
        peak: new Date(ev.peakStr).toISOString(),
        type: ev.type,
        description: ev.description,
        visibility: ev.visibility,
      });
    }
  }

  return events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export interface AnalemmaPoint {
  date: string;
  dayOfYear: number;
  month: number;
  altitude: number;
  azimuth: number;
  declination: number;
  isAboveHorizon: boolean;
  isToday: boolean;
}

export interface AnalemmaResult {
  points: AnalemmaPoint[];
  observationHour: number;
  year: number;
}

export function computeAnalemma(
  lat: number,
  lon: number,
  hourUTC: number,
  year: number
): AnalemmaResult {
  const observer = makeObserver(lat, lon);
  const now = new Date();
  const todayY = now.getUTCFullYear();
  const todayM = now.getUTCMonth();
  const todayD = now.getUTCDate();

  const daysInYear = isLeapYear(year) ? 366 : 365;
  const points: AnalemmaPoint[] = [];

  for (let d = 1; d <= daysInYear; d++) {
    // Build a UTC date at the requested hour for this day-of-year
    const date = new Date(Date.UTC(year, 0, d, hourUTC, 0, 0, 0));
    const month = date.getUTCMonth();

    const equ = Astronomy.Equator(Astronomy.Body.Sun, date, observer, true, true);
    const hor = Astronomy.Horizon(date, observer, equ.ra, equ.dec, "normal");

    const isToday =
      year === todayY &&
      date.getUTCMonth() === todayM &&
      date.getUTCDate() === todayD;

    points.push({
      date: date.toISOString().split("T")[0],
      dayOfYear: d,
      month,
      altitude: Math.round(hor.altitude * 10) / 10,
      azimuth: Math.round(hor.azimuth * 10) / 10,
      declination: Math.round(equ.dec * 10) / 10,
      isAboveHorizon: hor.altitude > 0,
      isToday,
    });
  }

  return { points, observationHour: hourUTC, year };
}
