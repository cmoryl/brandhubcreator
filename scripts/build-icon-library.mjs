// scripts/build-icon-library.mjs
// One-shot importer: copies curated Iconify JSON packs into public/icon-library/packs/,
// builds a master manifest + per-pack search index with auto-categorization.
// Run: node scripts/build-icon-library.mjs

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'node_modules/@iconify/json/json');
const OUT_PACKS = path.join(ROOT, 'public/icon-library/packs');
const OUT_INDEX = path.join(ROOT, 'public/icon-library/index');
const OUT_MANIFEST = path.join(ROOT, 'public/icon-library/manifest.json');
const OUT_LICENSES = path.join(ROOT, 'public/icon-library/LICENSES.md');

// Pack catalog — order matters for display
const PACKS = [
  // Original 12
  { id: 'ph', name: 'Phosphor', license: 'MIT', author: 'Phosphor Icons', url: 'https://phosphoricons.com', priority: 1 },
  { id: 'lucide', name: 'Lucide', license: 'ISC', author: 'Lucide Contributors', url: 'https://lucide.dev', priority: 1 },
  { id: 'tabler', name: 'Tabler Icons', license: 'MIT', author: 'Paweł Kuna', url: 'https://tabler-icons.io', priority: 1 },
  { id: 'heroicons', name: 'Heroicons', license: 'MIT', author: 'Tailwind Labs', url: 'https://heroicons.com', priority: 1 },
  { id: 'ri', name: 'Remix Icon', license: 'Apache 2.0', author: 'Remix Design', url: 'https://remixicon.com', priority: 1 },
  { id: 'iconoir', name: 'Iconoir', license: 'MIT', author: 'Luca Burgio', url: 'https://iconoir.com', priority: 1 },
  { id: 'material-symbols', name: 'Material Symbols', license: 'Apache 2.0', author: 'Google', url: 'https://fonts.google.com/icons', priority: 1 },
  { id: 'carbon', name: 'Carbon Icons', license: 'Apache 2.0', author: 'IBM', url: 'https://carbondesignsystem.com/guidelines/icons', priority: 1 },
  { id: 'game-icons', name: 'Game Icons', license: 'CC-BY 3.0', author: 'game-icons.net', url: 'https://game-icons.net', priority: 2, multicolor: false },
  { id: 'simple-icons', name: 'Simple Icons', license: 'CC0 1.0', author: 'Simple Icons', url: 'https://simpleicons.org', priority: 1 },
  { id: 'fa6-solid', name: 'Font Awesome Solid', license: 'CC-BY 4.0', author: 'Font Awesome', url: 'https://fontawesome.com', priority: 1 },
  { id: 'fa6-regular', name: 'Font Awesome Regular', license: 'CC-BY 4.0', author: 'Font Awesome', url: 'https://fontawesome.com', priority: 2 },
  { id: 'fa6-brands', name: 'Font Awesome Brands', license: 'CC-BY 4.0', author: 'Font Awesome', url: 'https://fontawesome.com', priority: 2 },
  { id: 'ion', name: 'Ionicons', license: 'MIT', author: 'Ionic', url: 'https://ionic.io/ionicons', priority: 1 },
  // Tier 1
  { id: 'fluent', name: 'Fluent UI', license: 'MIT', author: 'Microsoft', url: 'https://github.com/microsoft/fluentui-system-icons', priority: 1 },
  { id: 'mingcute', name: 'Mingcute', license: 'Apache 2.0', author: 'Mingcute', url: 'https://www.mingcute.com', priority: 1 },
  { id: 'solar', name: 'Solar', license: 'CC-BY 4.0', author: '480 Design', url: 'https://solar-icons.com', priority: 1 },
  { id: 'hugeicons', name: 'Hugeicons', license: 'CC-BY 4.0', author: 'Hugeicons', url: 'https://hugeicons.com', priority: 1 },
  { id: 'radix-icons', name: 'Radix Icons', license: 'MIT', author: 'WorkOS', url: 'https://www.radix-ui.com/icons', priority: 2 },
  { id: 'akar-icons', name: 'Akar Icons', license: 'MIT', author: 'Arturo Wibawa', url: 'https://akaricons.com', priority: 2 },
  { id: 'devicon', name: 'Devicon', license: 'MIT', author: 'Devicon Team', url: 'https://devicon.dev', priority: 2, multicolor: true },
  { id: 'flag', name: 'Country Flags', license: 'MIT', author: 'twitter/twemoji', url: 'https://github.com/lipis/flag-icons', priority: 2, multicolor: true },
  { id: 'twemoji', name: 'Twemoji', license: 'CC-BY 4.0 + MIT', author: 'Twitter', url: 'https://twemoji.twitter.com', priority: 2, multicolor: true },
  { id: 'openmoji', name: 'OpenMoji', license: 'CC-BY-SA 4.0', author: 'OpenMoji Contributors', url: 'https://openmoji.org', priority: 2, multicolor: true },
  { id: 'cryptocurrency', name: 'Cryptocurrency Icons', license: 'CC0 1.0', author: 'Christopher Downer', url: 'https://github.com/atomiclabs/cryptocurrency-icons', priority: 2 },
  { id: 'meteocons', name: 'Meteocons', license: 'MIT', author: 'Bas Milius', url: 'https://bas.dev/work/meteocons', priority: 2, multicolor: true },
  // Tier 2 (extras)
  { id: 'pixelarticons', name: 'Pixelart Icons', license: 'MIT', author: 'Gerrit Halfmann', url: 'https://pixelarticons.com', priority: 3 },
  { id: 'bytesize', name: 'Bytesize', license: 'MIT', author: 'Daniel Bruce', url: 'https://github.com/danklammer/bytesize-icons', priority: 3 },
  { id: 'mdi', name: 'Material Design Icons', license: 'Apache 2.0', author: 'MDI Community', url: 'https://pictogrammers.com/library/mdi', priority: 1 },
];

// Category keyword rules — applied to icon names + tags
// Order matters: first match wins
const CATEGORY_RULES = [
  { cat: 'brands', re: /^(facebook|twitter|x|instagram|youtube|linkedin|tiktok|github|gitlab|google|microsoft|apple|amazon|netflix|spotify|discord|slack|whatsapp|telegram|snapchat|pinterest|reddit|twitch|figma|dropbox|adobe|notion|zoom|airbnb|uber|paypal|stripe|visa|mastercard|bitcoin|ethereum)/ },
  { cat: 'social', re: /(share|like|comment|post|follow|chat|message|emoji|reaction|notification|bell|heart|thumb|star|bookmark|hashtag|@|at-sign)/ },
  { cat: 'communication', re: /(mail|email|envelope|phone|call|chat|message|sms|inbox|send|reply|forward|voice|microphone|headphone|speaker|broadcast|wifi|signal|antenna)/ },
  { cat: 'health', re: /(health|medical|medicine|pill|capsule|hospital|doctor|nurse|stethoscope|syringe|injection|vaccine|bandage|aid|emergency|ambulance|heartbeat|pulse|dna|virus|bacteria|covid|mask|wheelchair|therapy|brain|tooth|dental|eye|ear)/ },
  { cat: 'wellness', re: /(yoga|meditation|spa|fitness|gym|exercise|workout|running|cycling|swim|sport|sleep|rest|mindful|wellness|relax)/ },
  { cat: 'food', re: /(food|restaurant|cafe|coffee|tea|drink|wine|beer|cocktail|pizza|burger|bread|cake|fruit|vegetable|meat|fish|cooking|kitchen|chef|fork|knife|spoon|plate|cup|bottle)/ },
  { cat: 'travel', re: /(travel|plane|airplane|flight|airport|train|bus|car|taxi|ship|boat|cruise|hotel|luggage|suitcase|passport|map|compass|navigation|tour|vacation|trip|destination)/ },
  { cat: 'finance', re: /(money|cash|dollar|euro|pound|yen|coin|wallet|bank|finance|invest|stock|chart|trend|payment|credit|debit|card|atm|tax|budget|account|exchange|currency|crypto|bitcoin|trading)/ },
  { cat: 'business', re: /(business|office|briefcase|meeting|presentation|chart|graph|report|analytics|dashboard|target|goal|strategy|team|partner|deal|contract|sign|document|portfolio|company|enterprise)/ },
  { cat: 'ecommerce', re: /(shop|cart|basket|bag|store|buy|sell|product|order|invoice|receipt|tag|price|discount|sale|gift|deliver|ship|package|barcode|qr-code)/ },
  { cat: 'education', re: /(school|education|learn|teach|student|teacher|book|library|read|study|exam|grade|certificate|diploma|graduation|university|college|course|lesson|pencil|ruler|abacus)/ },
  { cat: 'science', re: /(science|atom|molecule|flask|microscope|telescope|laboratory|experiment|chemistry|physics|biology|math|equation|formula|research|test-tube|beaker)/ },
  { cat: 'nature', re: /(tree|plant|flower|leaf|nature|forest|garden|seed|grow|earth|environment|eco|sustainability|recycle|organic|natural|animal|bird|fish|insect|butterfly|bee|cat|dog|paw|wildlife)/ },
  { cat: 'weather', re: /(weather|sun|moon|cloud|rain|snow|storm|thunder|lightning|wind|fog|mist|temperature|hot|cold|warm|cool|degree|forecast|umbrella|rainbow|sunset|sunrise)/ },
  { cat: 'transport', re: /(car|truck|bus|train|tram|subway|metro|bike|bicycle|motorcycle|scooter|skateboard|wheel|engine|fuel|gas|parking|traffic|road|highway|bridge|tunnel|station)/ },
  { cat: 'tech', re: /(computer|laptop|desktop|monitor|screen|keyboard|mouse|cpu|chip|server|cloud|database|code|terminal|api|bug|robot|ai|machine-learning|vr|ar|3d|gpu|usb|hard-drive|memory)/ },
  { cat: 'devtools', re: /(git|branch|merge|commit|repo|code|terminal|console|api|webhook|deploy|build|compile|debug|test|version|tag|release|fork|pull-request|issue|docker|kubernetes|npm|yarn)/ },
  { cat: 'media', re: /(play|pause|stop|record|video|music|audio|sound|song|album|playlist|camera|photo|image|picture|gallery|film|movie|tv|broadcast|stream|podcast|radio)/ },
  { cat: 'security', re: /(lock|unlock|key|password|shield|secure|protect|guard|safe|vault|fingerprint|face-id|encrypt|firewall|vpn|verify|auth|biometric|crime|police)/ },
  { cat: 'gaming', re: /(game|gaming|controller|joystick|dice|chess|pawn|cards|trophy|achievement|level|score|player|console|playstation|xbox|nintendo|arcade|pixel|sword|axe|bow|arrow-quiver|dagger|wand|wizard|warrior|knight|barbarian|shield|armor|helm|helmet|potion|spell|magic|dragon|goblin|orc|elf|dungeon|quest|meeple|rune|crown|treasure|chest|loot|monster|skull|crossbones|tome|scroll|amulet|gem|crystal|battle|combat|attack|defense|hp|mana|xp|mmo|rpg|nes|snes|gameboy|pacman)/ },
  { cat: 'sports', re: /(ball|football|soccer|basketball|baseball|tennis|golf|hockey|rugby|cricket|olympic|medal|trophy|race|stadium|gym|fitness|sport)/ },
  { cat: 'files', re: /(file|folder|document|pdf|doc|xls|ppt|zip|archive|attachment|upload|download|save|export|import|drive|storage|disk|backup)/ },
  { cat: 'arrows', re: /(arrow|chevron|caret|direction|left|right|up|down|forward|back|next|prev|return|undo|redo|refresh|repeat|rotate|swap|move|drag)/ },
  { cat: 'ui', re: /(menu|burger|grid|list|layout|sidebar|panel|tab|window|modal|popup|tooltip|toast|alert|badge|button|toggle|switch|slider|checkbox|radio|input|form|search|filter|sort|settings|gear|cog|preferences)/ },
  { cat: 'shapes', re: /(circle|square|triangle|rectangle|polygon|star|hexagon|pentagon|diamond|heart|line|dot|shape|abstract|geometric|pattern)/ },
  { cat: 'emoji', re: /(emoji|emoticon|smile|laugh|cry|wink|kiss|hug|wave|clap|pray|thumb|peace|love|wink)/ },
  { cat: 'flags', re: /(flag|country|nation|state)/ },
  { cat: 'crypto', re: /(bitcoin|ethereum|litecoin|crypto|blockchain|nft|wallet|defi|btc|eth)/ },
];

function categorize(name, tags = []) {
  const haystack = (name + ' ' + tags.join(' ')).toLowerCase();
  for (const { cat, re } of CATEGORY_RULES) {
    if (re.test(haystack)) return cat;
  }
  return 'misc';
}

function autoTags(name) {
  // Split on dash/underscore/case boundaries
  const parts = name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .split(/[-_/]/)
    .filter((p) => p.length > 1);
  return Array.from(new Set(parts));
}

async function main() {
  await fs.mkdir(OUT_PACKS, { recursive: true });
  await fs.mkdir(OUT_INDEX, { recursive: true });

  const manifest = { packs: [], generatedAt: new Date().toISOString() };
  const licenseLines = ['# Bundled Icon Library — Third-Party Licenses\n', `Generated ${new Date().toISOString()}\n`];

  let grandTotal = 0;

  for (const pack of PACKS) {
    const srcPath = path.join(SRC, `${pack.id}.json`);
    try {
      await fs.access(srcPath);
    } catch {
      console.warn(`[skip] ${pack.id} not found`);
      continue;
    }

    const raw = await fs.readFile(srcPath, 'utf-8');
    const data = JSON.parse(raw);
    const names = Object.keys(data.icons);

    // Copy raw JSON to public for runtime SVG materialization
    await fs.writeFile(path.join(OUT_PACKS, `${pack.id}.json`), raw);

    // Build search index: name + auto-tags + category
    const index = names.map((name) => {
      const tags = autoTags(name);
      const category = categorize(name, tags);
      return { n: name, c: category, t: tags };
    });

    // Category counts
    const catCounts = {};
    for (const item of index) catCounts[item.c] = (catCounts[item.c] || 0) + 1;

    await fs.writeFile(path.join(OUT_INDEX, `${pack.id}.json`), JSON.stringify(index));

    manifest.packs.push({
      id: pack.id,
      name: pack.name,
      license: pack.license,
      author: pack.author,
      url: pack.url,
      priority: pack.priority,
      multicolor: pack.multicolor ?? false,
      count: names.length,
      categories: catCounts,
      defaultViewBox: `0 0 ${data.width || 24} ${data.height || 24}`,
    });

    licenseLines.push(`## ${pack.name} (${pack.id})\n`);
    licenseLines.push(`- **Author:** ${pack.author}`);
    licenseLines.push(`- **License:** ${pack.license}`);
    licenseLines.push(`- **Source:** ${pack.url}`);
    licenseLines.push(`- **Icons bundled:** ${names.length}\n`);

    grandTotal += names.length;
    console.log(`✓ ${pack.id.padEnd(22)} ${String(names.length).padStart(6)} icons`);
  }

  manifest.totalIcons = grandTotal;
  await fs.writeFile(OUT_MANIFEST, JSON.stringify(manifest, null, 2));
  await fs.writeFile(OUT_LICENSES, licenseLines.join('\n'));

  console.log(`\n✅ Built ${grandTotal} icons across ${manifest.packs.length} packs`);
  console.log(`   Manifest: ${OUT_MANIFEST}`);
  console.log(`   Licenses: ${OUT_LICENSES}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
