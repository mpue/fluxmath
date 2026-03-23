/**
 * Scans src/topics/ for registerTopic() calls, extracts topic IDs,
 * and writes a sitemap.xml into dist/.
 */
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://fluxmath.de';
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

function findTopicIds(dir) {
  const ids = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      ids.push(...findTopicIds(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const regex = /registerTopic\(\s*\{[^}]*id\s*:\s*['"]([^'"]+)['"]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        ids.push(match[1]);
      }
    }
  }
  return ids;
}

function buildSitemap(topicIds) {
  const today = new Date().toISOString().split('T')[0];
  const urls = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    ...topicIds.map(id => ({
      loc: `/topic/${id}`,
      changefreq: 'monthly',
      priority: '0.8',
    })),
  ];

  const entries = urls
    .map(
      u => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

// --- main ---
const topicsDir = path.resolve(__dirname, '..', 'src', 'topics');
const ids = findTopicIds(topicsDir);
console.log(`Found ${ids.length} topic(s): ${ids.join(', ')}`);

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

const xml = buildSitemap(ids);
fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), xml, 'utf-8');
console.log('sitemap.xml written to dist/');
