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
    "https://v3.g.ladypopular.com/guilds.php?id=2695",
    "https://v3.g.ladypopular.com/guilds.php?id=636",
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
      '#guildMembersList ul.members a[href*="lady_id="]',
      links => links.map(a => a.href)
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
        
        await page.waitForSelector('.lady-name-wrapper .lady-name');
        const playerName = await page.locator('.lady-name-wrapper .lady-name').innerText();

        await page.locator('.profile-tab.about').click();
        await page.waitForSelector('.stats');

        console.log(`\n📈 Stats for ${playerName}:`);
        const stats = await page.$$eval('.about-stat-item', items =>
          items.map(item => ({
            name: item.querySelector('.item-label').textContent.trim(),
            value: item.querySelector('.item-value').textContent.trim()
          }))
        );
        
        for (const stat of stats) {
          console.log(`- ${stat.name}: ${stat.value}`);
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
