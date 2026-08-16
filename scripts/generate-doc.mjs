import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, PageBreak, SpacingType,
} = require('/home/runner/workspace/node_modules/.pnpm/docx@9.7.1/node_modules/docx/dist/index.cjs');

// ── helpers ────────────────────────────────────────────────────────────────────

const H1 = (text) => new Paragraph({
  text,
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 160 },
});

const H2 = (text) => new Paragraph({
  text,
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 120 },
});

const H3 = (text) => new Paragraph({
  text,
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 80 },
});

const P = (text, opts = {}) => new Paragraph({
  children: [new TextRun({ text, size: 22, ...opts })],
  spacing: { before: 80, after: 80 },
  alignment: AlignmentType.LEFT,
});

const Bold = (text) => new TextRun({ text, bold: true, size: 22 });
const Normal = (text) => new TextRun({ text, size: 22 });

const MixedPara = (runs, opts = {}) => new Paragraph({
  children: runs,
  spacing: { before: 80, after: 80 },
  ...opts,
});

const Bullet = (text, bold_prefix = '') => new Paragraph({
  children: [
    ...(bold_prefix ? [new TextRun({ text: bold_prefix, bold: true, size: 22 })] : []),
    new TextRun({ text, size: 22 }),
  ],
  bullet: { level: 0 },
  spacing: { before: 40, after: 40 },
});

const Spacer = () => new Paragraph({ text: '', spacing: { before: 80, after: 80 } });

const HRule = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '4472C4' } },
  spacing: { before: 200, after: 200 },
});

const tableRow = (label, value) => new TableRow({
  children: [
    new TableCell({
      children: [new Paragraph({ children: [Bold(label)], spacing: { before: 60, after: 60 } })],
      width: { size: 25, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: 'EBF3FB' },
    }),
    new TableCell({
      children: [new Paragraph({ children: [Normal(value)], spacing: { before: 60, after: 60 } })],
      width: { size: 75, type: WidthType.PERCENTAGE },
    }),
  ],
});

// ── document sections ─────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Calibri', size: 22 },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        run: { size: 32, bold: true, color: '1F3864', font: 'Calibri' },
        paragraph: { spacing: { before: 400, after: 160 } },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        run: { size: 26, bold: true, color: '2E74B5', font: 'Calibri' },
        paragraph: { spacing: { before: 300, after: 120 } },
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        run: { size: 24, bold: true, color: '404040', font: 'Calibri' },
        paragraph: { spacing: { before: 200, after: 80 } },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
      },
    },
    children: [

      // ── TITLE PAGE ──────────────────────────────────────────────────────────
      new Paragraph({
        children: [new TextRun({ text: 'StarGazer', bold: true, size: 64, color: '1F3864', font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 1200, after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'A Vibe Coding Project', size: 30, color: '2E74B5', font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Full-Stack Astronomy Web App built with Replit AI Agent', size: 24, color: '666666', font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'August 2026', size: 22, color: '888888', font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 1600 },
      }),
      HRule(),

      // ── 1. PROJECT OVERVIEW ─────────────────────────────────────────────────
      H1('1. Project Overview'),
      P('StarGazer is a real-time astronomy web application I built using Replit AI Agent through a process called "vibe coding" — where you describe what you want in plain language and the AI writes the code. The whole project was done without me writing a single line of code manually.'),
      Spacer(),
      P('The idea was simple: I wanted one place where I can check everything about the night sky from my location — planets, moon, stars, ISS passes, weather conditions, and more. I also wanted it to look professional, not like a basic school project.'),
      Spacer(),
      P('The final application has nine sections:'),
      Spacer(),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          tableRow('Dashboard', 'Landing page with sky summary and quick links to all tools'),
          tableRow('Sky Map', 'Interactive polar projection of the sky above your location'),
          tableRow('Planets', 'Rise, transit, set times, magnitude, and angular size for all planets'),
          tableRow('Moon', 'Phase, illumination %, distance, rise/set times, and next major phases'),
          tableRow('Stars', 'Curated bright-star atlas with altitude, azimuth, spectral type, distance'),
          tableRow('Deep Sky', 'Messier and NGC objects with visibility ratings and observing notes'),
          tableRow('ISS Tracker', 'Next ISS passes with max elevation and duration'),
          tableRow('Conditions', 'Cloud cover, seeing index, transparency, wind, and overall sky verdict'),
          tableRow('Analemma', "Sun's figure-8 path across the sky at a chosen observation hour"),
        ],
      }),
      Spacer(),

      // ── 2. TECH STACK ────────────────────────────────────────────────────────
      H1('2. Tech Stack'),
      P('The AI Agent chose a modern full-stack setup. Everything runs in a pnpm monorepo with shared libraries between the frontend and backend.'),
      Spacer(),
      H2('Frontend'),
      Bullet('React 19 + TypeScript, bundled with Vite', 'Framework: '),
      Bullet('Tailwind CSS + shadcn/ui for the dark-themed UI', 'Styling: '),
      Bullet('Recharts for altitude curves and charts', 'Charts: '),
      Bullet('TanStack Query for data fetching and caching', 'Data: '),
      Bullet('Framer Motion for animations', 'Animation: '),
      Bullet('Wouter for client-side routing', 'Routing: '),
      Spacer(),
      H2('Backend API'),
      Bullet('Node.js with Express-style routing', 'Runtime: '),
      Bullet('astronomy-engine — all celestial calculations run locally, no API key needed', 'Astronomy: '),
      Bullet('Open-Meteo — free weather and atmospheric seeing data', 'Weather: '),
      Bullet('Nominatim (OpenStreetMap) — reverse geocoding for city names from GPS coordinates', 'Geocoding: '),
      Bullet('esbuild for fast production compilation', 'Build: '),
      Spacer(),
      H2('Shared Libraries'),
      Bullet('openapi.yaml — single source of truth for all API endpoints'),
      Bullet('api-zod — Zod validation schemas generated from the spec'),
      Bullet('api-client-react — typed fetch client and TanStack Query hooks'),
      Spacer(),

      // ── 3. DATA SOURCES ─────────────────────────────────────────────────────
      H1('3. Data Sources'),
      P('One thing I liked about this project is that it does not depend on paid APIs. All the data comes from free or open sources:'),
      Spacer(),
      Bullet('astronomy-engine (Don Cross, MIT license): computes planet positions, moon phase, star altitudes, rise/set times, ISS ephemeris, and the analemma entirely client-side using orbital mechanics. No API call needed.', ''),
      Bullet('Open-Meteo (open-source weather API): provides cloud cover, wind speed, humidity, and a seeing index based on atmospheric conditions. Free with no API key.', ''),
      Bullet('Nominatim / OpenStreetMap: reverse geocodes GPS coordinates into human-readable city names. Free, open-source.', ''),
      Bullet('NASA Image and Video Library API: searched for celestial object reference photos. Free, public API.', ''),
      Bullet('tz-lookup: offline timezone lookup from lat/lon coordinates. No API call needed.', ''),
      Spacer(),

      // ── 4. PROMPTS USED ─────────────────────────────────────────────────────
      H1('4. Prompts We Used During Vibe Coding'),
      P('Below are the actual prompts (or close to them) that I typed to the AI Agent during this project. I did not write any code — everything came from describing what I wanted.'),
      Spacer(),

      H2('Initial Build'),
      Bullet('Build me a full-stack astronomy web app called StarGazer. I want it to show real-time sky conditions from my location — planets, moon, bright stars, deep sky objects, ISS passes, weather. Dark theme, professional look.'),
      Bullet('Add a Sky Map tab — an interactive polar projection of the sky showing stars and planets'),
      Bullet('Add an Analemma tab showing the sun\'s figure-8 path across the sky at a specific time each day'),
      Spacer(),

      H2('Refinements and Additions'),
      Bullet('Add layman explanations to the Analemma tab so normal people understand what they are looking at'),
      Bullet('Fix the Analemma time slider — it should show local time in the selected location\'s timezone, not UTC'),
      Bullet('Add a Milky Way tab showing galactic core visibility, altitude curve, 7-night forecast, and compass direction'),
      Bullet('Remove the Milky Way tab completely'),
      Spacer(),

      H2('Bug Fixes and Tweaks'),
      Bullet('The night timeline labels are overlapping when events happen close together. Fix this.'),
      Bullet('The explainer text says "GPS: 33.6577°" instead of a city name. Fix how the location is displayed.'),
      Bullet('Change "on one day of 2026" to "on each day" in the Analemma description'),
      Bullet('Create a README file for the project'),
      Spacer(),

      // ── 5. ITERATIONS ───────────────────────────────────────────────────────
      H1('5. Iterations We Tried'),
      P('Not everything worked perfectly on the first try. Here are the main iterations we went through:'),
      Spacer(),

      H2('Milky Way Tab — Built and Removed'),
      MixedPara([Bold('What happened: '), Normal('I asked the agent to build a full Milky Way visibility tab with altitude curve, 7-night forecast, compass diagram, and shooting window. The agent built it fully — API endpoint, frontend page, all connected. After reviewing it I decided to remove it completely.')]),
      MixedPara([Bold('Why removed: '), Normal('I changed my mind about the feature scope. The agent cleanly removed all traces — the page file, the API route, the nav link, the dashboard card, all the Zod schemas, the OpenAPI spec entries, and the generated TypeScript client code.')]),
      MixedPara([Bold('Learning: '), Normal('Vibe coding makes it easy to try big features quickly and remove them just as fast without any cleanup overhead on my part.')]),
      Spacer(),

      H2('Analemma Local Time Fix'),
      MixedPara([Bold('What happened: '), Normal('The time slider was showing UTC hours, so if I set my location to Phoenix (UTC-7) and dragged to 12:00, it was actually computing the sun position at 12:00 UTC — which is 5 AM local time. Wrong.')]),
      MixedPara([Bold('Fix: '), Normal('The agent added a localHourToUtcHour() helper that converts local time to UTC before passing it to the API. The slider now defaults to the current local hour, and the label shows the correct timezone abbreviation.')]),
      Spacer(),

      H2('Night Timeline Label Overlap'),
      MixedPara([Bold('What happened: '), Normal('I took a screenshot showing two event labels overlapping on the Milky Way night timeline. Events like "Dark" and "Rise" were too close together and their text was stacking on top of each other.')]),
      MixedPara([Bold('Fix: '), Normal('The agent implemented a two-row stagger. Labels at even index positions go on the top row, odd index positions go 24px lower. This guaranteed no two adjacent labels are on the same row, regardless of how close the events are in time.')]),
      Spacer(),

      H2('Location Name Display Bug'),
      MixedPara([Bold('What happened: '), Normal('When I used GPS auto-detect and the reverse geocoding failed (Nominatim not reachable), the fallback was storing coordinates like "33.6577°, -112.07°". The Analemma explainer text was then splitting this on a comma and showing only "33.6577°" — which looked like broken output.')]),
      MixedPara([Bold('Fix: '), Normal('Added a check: if the location name contains the degree symbol (°), show the full string instead of splitting on comma. City names like "Phoenix, AZ" still get split to just "Phoenix".')]),
      Spacer(),

      // ── 6. LEARNINGS ────────────────────────────────────────────────────────
      H1('6. Learnings and Observations'),
      Spacer(),

      H2('What Worked Well'),
      Bullet('The AI Agent planned the full architecture from the start — monorepo, shared type library, generated client. This saved a lot of refactoring later.'),
      Bullet('Describing bugs with a screenshot was much faster than trying to explain them in words. I uploaded a screenshot of the overlapping labels and the agent understood immediately.'),
      Bullet('The agent always checked existing code before writing new code, so it never duplicated logic or created conflicts.'),
      Bullet('When I asked to remove the Milky Way tab, the agent found and deleted every reference across 10+ files in one go. No leftover dead code.'),
      Bullet('The app uses real astronomical calculations — not fake or mocked data. The positions are accurate.'),
      Spacer(),

      H2('What Was Surprising'),
      Bullet('The agent proposed follow-up features I had not thought of — like a camera settings guide for astrophotography and a classic analemma view. It was thinking ahead.'),
      Bullet('Small UI details like the two-row label stagger were solved cleanly without me specifying exactly how to fix it. I just said "labels are overlapping" and it figured out the right solution.'),
      Bullet('The agent explained its choices before making big changes, which helped me stay in control even though I was not writing code.'),
      Spacer(),

      H2('Challenges'),
      Bullet('The screenshot preview does not save location across sessions, so all screenshots showed empty pages. This is a limitation of the preview environment, not the app itself.'),
      Bullet('Installing extra packages (like the docx library for this document) needed some trial and error because the project uses pnpm workspaces with strict settings.'),
      Bullet('Some pages like Planets, Moon, and Stars need a location set before they show data, so the UI looks empty to a new visitor until they set their location.'),
      Spacer(),

      H2('Overall Reflection'),
      P('I think vibe coding is very powerful for someone who has an idea but does not want to spend months learning how to code. The hardest part was describing what I wanted clearly. The agent handled all the technical decisions — which library to use, how to structure the code, how to make the frontend and backend talk to each other.'),
      Spacer(),
      P('The workflow felt like working with a very fast developer who needs good requirements. If I was vague, the result was vague. When I was specific — like showing a screenshot of the bug or writing out the exact sentence I wanted — the result was exactly right.'),
      Spacer(),
      P('The whole project from idea to a published app with README was done in one session. That is impressive.'),

      HRule(),

      // ── FOOTER NOTE ─────────────────────────────────────────────────────────
      new Paragraph({
        children: [new TextRun({ text: 'Built with Replit AI Agent  •  August 2026  •  StarGazer', size: 18, color: '888888', italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
      }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('/home/runner/workspace/StarGazer-Project-Document.docx', buffer);
console.log('Done:', buffer.length, 'bytes');
