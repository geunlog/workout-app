async function openBaseChoices(page) {
  const entry=page.locator('#btnBasePlan');
  if(await entry.count() && !await page.locator('#btnBaseAi').isVisible())await entry.click();
}

async function openWeekFromWorkout(page) {
  await page.locator('#modeToggle button').filter({hasText:/^운동$/}).click();
  await page.locator('#btnRoutineEdit').click();
  await page.locator('#btnAiMenu').click();
  await page.locator('#btnWeekAiFromDay').click();
}

module.exports={openBaseChoices,openWeekFromWorkout};
