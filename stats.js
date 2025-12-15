// stats.js

function parseNumber(text) {
  text = text.trim().toLowerCase();
  if (text.endsWith('k')) return Math.round(parseFloat(text) * 1_000);
  if (text.endsWith('m')) return Math.round(parseFloat(text) * 1_000_000);
  return parseInt(text.replace(/[^\d]/g, ''));
}

module.exports = async function runStatsExtractor(page) {
  const profileUrl = process.env.LP_PROFILE_URL;

  // Step 1: Go to ranking page
  console.log("📊 Navigating to ranking page...");
  await page.goto('https://v3.g.ladypopular.com/ranking/players.php', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10000); // wait 10s

  // Extract XP and level
  const xp = await page.$eval('#league-ranking-container > div > div > span:nth-child(4)', el =>
    el.textContent.trim()
  );
  const level = await page.$eval('#league-ranking-container > div > div > span:nth-child(3)', el =>
    el.textContent.trim()
  );

  // Extract top bar currencies
  const dollars = await page.$eval('#player-dollars', el => el.textContent.trim());
  const emeralds = await page.$eval('#player-emeralds', el => el.textContent.trim());
  const diamonds = await page.$eval('#player-credits', el => el.textContent.trim());

  console.log("📊 Ranking Info:");
  console.log(`- Level: ${parseNumber(level)}`);
  console.log(`- XP: ${parseNumber(xp)}`);
  console.log(`- Dollars: ${parseNumber(dollars)}`);
  console.log(`- Emeralds: ${parseNumber(emeralds)}`);
  console.log(`- Diamonds: ${parseNumber(diamonds)}`);

  // Step 2: Navigate to profile
  console.log("\n👤 Navigating to profile page...");
  await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10000); // wait 10s

  // Click the 2nd tab in profile nav (Arena stats tab)
  const arenaTabSelector = '#profilePage > div:nth-child(1) > div.profile-page-top > div.profile-page-nav.makeupBox.bg-g1.br-m > ul > li:nth-child(2)';
  await page.click(arenaTabSelector);
  await page.waitForTimeout(10000); // wait 10s

  // Extract duel info
  const fashionArena = await page.$eval(
    '#profilePage-game > div.profile-page-right > div.makeupBox.profile-main-info.all-info.bg-g2 > div > div.profile-main-info_right > ul > li:nth-child(1) > div:nth-child(2)',
    el => el.textContent.trim()
  );
  const beautyPageant = await page.$eval(
    '#profilePage-game > div.profile-page-right > div.makeupBox.profile-main-info.all-info.bg-g2 > div > div.profile-main-info_right > ul > li:nth-child(2) > div:nth-child(2)',
    el => el.textContent.trim()
  );

  console.log("\n🏆 Duel Stats:");
  console.log(`- Fashion Arena: ${fashionArena}`);
  console.log(`- Beauty Pageant: ${beautyPageant}`);

  // Extract stats
  const statSelectors = [
    { name: 'Elegance', selector: 'div:nth-child(1) > div.profile-stat-right > span.stats-value' },
    { name: 'Creativity', selector: 'div:nth-child(2) > div.profile-stat-right > span.stats-value' },
    { name: 'Confidence', selector: 'div:nth-child(3) > div.profile-stat-right > span.stats-value' },
    { name: 'Grace', selector: 'div:nth-child(4) > div.profile-stat-right > span.stats-value' },
    { name: 'Kindness', selector: 'div:nth-child(5) > div.profile-stat-right > span.stats-value' },
    { name: 'Loyalty', selector: 'div:nth-child(6) > div.profile-stat-right > span.stats-value' },
  ];

  console.log("\n📈 Stats:");
  for (const stat of statSelectors) {
    const selector = `#profilePage-game > div.profile-page-right > div.makeupBox.profile-main-info.all-info.bg-g2 > div > div.profile-stat-wraper > ${stat.selector}`;
    const value = await page.$eval(selector, el => el.textContent.trim());
    console.log(`- ${stat.name}: ${parseNumber(value)}`);
  }

  console.log("\n✅ Stats extraction complete.");
};
