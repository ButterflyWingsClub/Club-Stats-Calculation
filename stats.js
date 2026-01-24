// stats.js

function parseNumber(text) {
  text = text.trim().toLowerCase();
  if (text.endsWith('k')) return Math.round(parseFloat(text) * 1_000);
  if (text.endsWith('m')) return Math.round(parseFloat(text) * 1_000_000);
  return parseInt(text.replace(/[^\d]/g, ''));
}

module.exports = async function runStatsExtractor(page) {

  // ✅ ENTER ALL CLUB URLs HERE
  const clubUrls = [
    "https://v3.g.ladypopular.com/guilds.php?id=3007", 
    "https://v3.g.ladypopular.com/guilds.php?id=636", 
    //"https://v3.g.ladypopular.com/guilds.php?id=4733", 
    //"https://v3.g.ladypopular.com/guilds.php?id=90", 
    // "https://v3.g.ladypopular.com/guilds.php?id=24",
    // "https://v3.g.ladypopular.com/guilds.php?id=3007",
    // add up to 7 (or more)
  ];

  for (const clubUrl of clubUrls) {
    console.log("\n==============================");
    console.log("📊 Processing club:", clubUrl);
    console.log("==============================");

    console.log("📊 Navigating to club page...");
    await page.goto(clubUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(10000);

    // Step 1: Get all member profile URLs (PER CLUB)
    let profileUrls = await page.$$eval(
      '#guildMembersList .overview a',
      links => links
        .map(a => a.href)
        .filter(href => href.startsWith('https://v3.g.ladypopular.com/profile.php?id='))
    );

    console.log(`📋 Found ${profileUrls.length} member profiles.`);

    // ===============================
    // Phase 1A: Club-level inspection
    // ===============================
    try {
      const clubData = await page.evaluate(() => {
        const nameEl = document.querySelector("#guildName");
        const name = nameEl ? nameEl.textContent.trim() : "Unknown";

        const trophyEls = document.querySelectorAll("#guildTrophies li.trophy");
        const trophyNums = [];

        trophyEls.forEach(li => {
          const cls = Array.from(li.classList).find(c => c.startsWith("trophy-"));
          if (cls) {
            const num = parseInt(cls.replace("trophy-", ""), 10);
            if (!isNaN(num)) trophyNums.push(num);
          }
        });

        return { name, trophyNums };
      });

      const uniqueTrophies = new Set(clubData.trophyNums);

      console.log("\n🏰 Club Overview:");
      console.log(`- Name: ${clubData.name}`);
      console.log(`- Total Trophies: ${uniqueTrophies.size}`);

    } catch (err) {
      console.log("⚠️ Error extracting club overview:", err.message);
    }

    // ===============================
    // Step 2: Loop through members
    // ===============================
    for (const profileUrl of profileUrls) {
      try {
        console.log("\n👤 Navigating to profile page:", profileUrl);
        await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(10000);

        const nameSelector = 'p.profile-player-name > span.text-link > strong';
        const playerName = await page.$eval(
          nameSelector,
          el => el.textContent.trim()
        );

        const arenaTabSelector =
          '#profilePage > div:nth-child(1) > div.profile-page-top > div.profile-page-nav.makeupBox.bg-g1.br-m > ul > li:nth-child(2)';
        await page.click(arenaTabSelector);
        await page.waitForTimeout(10000);

        const statSelectors = [
          { name: 'Elegance', selector: 'div:nth-child(1) > div.profile-stat-right > span.stats-value' },
          { name: 'Creativity', selector: 'div:nth-child(2) > div.profile-stat-right > span.stats-value' },
          { name: 'Confidence', selector: 'div:nth-child(3) > div.profile-stat-right > span.stats-value' },
          { name: 'Grace', selector: 'div:nth-child(4) > div.profile-stat-right > span.stats-value' },
          { name: 'Kindness', selector: 'div:nth-child(5) > div.profile-stat-right > span.stats-value' },
          { name: 'Loyalty', selector: 'div:nth-child(6) > div.profile-stat-right > span.stats-value' },
        ];

        console.log(`\n📈 Stats for ${playerName}:`);
        for (const stat of statSelectors) {
          const selector =
            `#profilePage-game > div.profile-page-right > div.makeupBox.profile-main-info.all-info.bg-g2 > div > div.profile-stat-wraper > ${stat.selector}`;
          const value = await page.$eval(selector, el => el.textContent.trim());
          console.log(`- ${stat.name}: ${parseNumber(value)}`);
        }

        console.log(`\n✅ Stats extraction complete for ${playerName}`);

      } catch (err) {
        console.log("⚠️ Error extracting stats for", profileUrl, err.message);
      }

      await page.waitForTimeout(2000);
    }

    console.log("\n🎉 Finished club:", clubUrl);
  }

  console.log("\n🏁 All clubs processed.");
};
