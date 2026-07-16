// @ts-check
const { test, expect } = require('@playwright/test');
const { freshGame } = require('./helpers');

async function startBattle(page, enemyKey = 'parsewraith', regionIdx = 0) {
  await page.evaluate(({ enemyKey, regionIdx }) => {
    const wf = window.__wf;
    window.startBattle({
      enemyKey,
      region: wf.DATA.regions[regionIdx],
      spawn: null,
      boss: false,
    });
  }, { enemyKey, regionIdx });
}

test('production battle opens with a fixed five-slot image hotbar and rolls disabled', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);

  const state = await page.evaluate(() => {
    const bar = document.getElementById('combatHotbar');
    const slots = bar ? [...bar.querySelectorAll('[data-combat-action]')] : [];
    return {
      exists: !!bar,
      hidden: bar ? bar.classList.contains('hidden') : true,
      actions: slots.map(slot => slot.getAttribute('data-combat-action')),
      imageOnly: slots.every(slot => !!slot.querySelector('svg') && !slot.querySelector('.combat-label')),
      d20: window.__wf.S.settings.d20Combat,
    };
  });

  expect(state.exists).toBe(true);
  expect(state.hidden).toBe(false);
  expect(state.actions).toEqual(['attack', 'skills', 'poultice', 'mana', 'utility']);
  expect(state.imageOnly).toBe(true);
  expect(state.d20).toBe(false);
});

test('an attack is chosen and targeted before its question, then resolves only after feedback', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);

  await page.evaluate(() => window.__wf.selectCombatAction('attack'));
  let state = await page.evaluate(() => ({
    phase: window.__wf.B.phase,
    intent: window.__wf.B.intent,
    cardHidden: document.getElementById('battleBox').classList.contains('hidden'),
  }));
  expect(state.phase).toBe('target');
  expect(state.intent.type).toBe('attack');
  expect(state.intent.rollsEnabled).toBe(false);
  expect(state.cardHidden).toBe(true);

  await page.evaluate(() => {
    const wf = window.__wf;
    for (let i = 0; i < wf.B.foes.length && wf.B.phase === 'target'; i++) wf.chooseCombatTarget('foe', i);
  });
  state = await page.evaluate(() => ({
    phase: window.__wf.B.phase,
    target: window.__wf.B.intent.target,
    question: document.getElementById('qScen').textContent,
    cardHidden: document.getElementById('battleBox').classList.contains('hidden'),
  }));
  expect(state.phase).toBe('q');
  expect(state.target.side).toBe('foe');
  expect(state.question.length).toBeGreaterThan(20);
  expect(state.cardHidden).toBe(false);

  const before = await page.evaluate(() => window.__wf.B.foes[window.__wf.B.intent.target.index].halves);
  await page.evaluate(() => {
    const i = window.__wf.B.opts.findIndex(option => option.ok);
    window.__wf.onAnswer(i);
  });
  state = await page.evaluate(() => ({
    phase: window.__wf.B.phase,
    hp: window.__wf.B.foes[window.__wf.B.intent.target.index].halves,
    pending: window.__wf.B.pendingResolution,
    why: document.getElementById('rbRule').textContent,
    example: document.getElementById('rbExample').textContent,
  }));
  expect(state.phase).toBe('fb');
  expect(state.hp).toBe(before);
  expect(state.pending.correct).toBe(true);
  expect(state.why.length).toBeGreaterThan(10);
  expect(state.example.length).toBeGreaterThan(5);

  await page.evaluate(() => window.__wf.onContinueResolve());
  expect(await page.evaluate(() => window.__wf.B.foes[window.__wf.B.intent.target.index].halves)).toBeLessThan(before);
});

test('a knowledge gate dims and disables battlefield input', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  await page.evaluate(() => {
    const wf = window.__wf;
    wf.selectCombatAction('attack');
    for (let i = 0; i < wf.B.foes.length && wf.B.phase === 'target'; i++) wf.chooseCombatTarget('foe', i);
  });

  const gate = await page.evaluate(() => {
    const canvas = document.getElementById('cv');
    const style = getComputedStyle(canvas);
    return {
      phase: window.__wf.B.phase,
      dimmed: style.filter !== 'none' && style.filter.includes('brightness'),
      pointerEvents: style.pointerEvents,
    };
  });
  expect(gate).toEqual({ phase: 'q', dimmed: true, pointerEvents: 'none' });
});

test('the target confirmed before recall cannot change while the gate is open', async ({ page }) => {
  await freshGame(page, 'c');
  await page.evaluate(() => {
    const wf = window.__wf;
    wf.S.hero = { rig: 'heroMag', cls: 'caster' };
    window.startBattle({
      enemyKey: 'parsewraith',
      region: wf.DATA.regions[0],
      spawn: null,
      boss: false,
      eaWave: [{ n: 'First Target', s: 'zombie' }, { n: 'Second Target', s: 'zombie' }],
    });
    wf.selectCombatAction('attack');
    wf.chooseCombatTarget('foe', 0);
  });
  const before = await page.evaluate(() => window.__wf.B.foes.map(foe => foe.halves));

  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => ({ live: window.__wf.B.target, confirmed: window.__wf.B.intent.target.index })))
    .toEqual({ live: 0, confirmed: 0 });

  const after = await page.evaluate(() => {
    const wf = window.__wf;
    wf.onAnswer(wf.B.opts.findIndex(option => option.ok));
    wf.onContinueResolve();
    return wf.B.foes.map(foe => foe.halves);
  });
  expect(after[0]).toBeLessThan(before[0]);
  expect(after[1]).toBe(before[1]);
});

test('switching the active combatant while a tray is open refreshes that tray', async ({ page }) => {
  await freshGame(page, 'c');
  const state = await page.evaluate(() => {
    const wf = window.__wf;
    const companion = wf.DATA.companions.find(candidate => candidate.cert === 'c');
    wf.S.companions = [companion.id];
    window.startBattle({ enemyKey: 'parsewraith', region: wf.DATA.regions[0], spawn: null, boss: false });
    wf.selectCombatAction('skills');
    const switched = wf.setActiveCombatant(1);
    return {
      switched,
      active: wf.B.active,
      phase: wf.B.phase,
      hotbar: wf.B.intent && wf.B.intent.hotbar,
      trayNames: wf.B.trayItems.map(item => item.name),
      expectedAbility: companion.ability,
    };
  });
  expect(state.switched).toBe(true);
  expect(state.active).toBe(1);
  expect(state.phase).toBe('tray');
  expect(state.hotbar).toBe('skills');
  expect(state.trayNames.length).toBeGreaterThan(0);
  expect(state.trayNames).toContain(state.expectedAbility);
});

test('a hint can forfeit recall credit without weakening correct attack damage', async ({ page }) => {
  await freshGame(page, 'c');
  const damage = await page.evaluate(() => {
    const wf = window.__wf;
    const concept = wf.ALLCONCEPTS.c[0];
    return {
      normal: wf.attackDamage(4, 'c', concept, { rowMult: 1, hinted: false }),
      hinted: wf.attackDamage(4, 'c', concept, { rowMult: 1, hinted: true }),
    };
  });
  expect(damage.hinted).toBe(damage.normal);
});

test('a failed poultice question consumes nothing and performs no healing', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  await page.evaluate(() => {
    const wf = window.__wf;
    wf.S.consume.tonic = 2;
    wf.B.party[0].halves = Math.max(1, wf.B.party[0].max - 3);
    wf.updateBattleHUD();
  });

  const gateReady = await page.evaluate(() => {
    window.__wf.selectCombatAction('poultice');
    return window.__wf.chooseCombatTarget('party', 0) && window.__wf.B.phase === 'q';
  });
  expect(gateReady).toBe(true);
  const before = await page.evaluate(() => ({
    hp: window.__wf.B.party[0].halves,
    tonic: window.__wf.S.consume.tonic,
  }));
  const resolution = await page.evaluate(() => {
    const i = window.__wf.B.opts.findIndex(option => !option.ok);
    window.__wf.onAnswer(i);
    window.__wf.onContinueResolve();
    return {
      hp: window.__wf.B.party[0].halves,
      tonic: window.__wf.S.consume.tonic,
      callout: document.getElementById('combatThreat').textContent,
    };
  });
  expect({ hp: resolution.hp, tonic: resolution.tonic }).toEqual(before);
  expect(resolution.callout).toBe('NOPE!');
});

test('enemy attacks announce a five-second comic defense beat before asking', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  await page.evaluate(() => window.__wf.startDefense());

  let state = await page.evaluate(() => ({
    phase: window.__wf.B.phase,
    callout: document.getElementById('combatThreat').textContent,
    visible: !document.getElementById('combatThreat').classList.contains('hidden'),
    cardHidden: document.getElementById('battleBox').classList.contains('hidden'),
  }));
  expect(state.phase).toBe('threat');
  expect(state.callout).toMatch(/^Defend .+ from .+'s .+!$/);
  expect(state.visible).toBe(true);
  expect(state.cardHidden).toBe(true);

  await page.waitForTimeout(5100);
  state = await page.evaluate(() => ({
    phase: window.__wf.B.phase,
    calloutHidden: document.getElementById('combatThreat').classList.contains('hidden'),
    cardHidden: document.getElementById('battleBox').classList.contains('hidden'),
  }));
  expect(state).toEqual({ phase: 'q', calloutHidden: true, cardHidden: false });
});

test('the d20 setting is snapshotted per action and uses a battlefield die outside the question', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  await page.evaluate(() => {
    const wf = window.__wf;
    wf.S.settings.d20Combat = true;
    wf.selectCombatAction('attack');
    wf.S.settings.d20Combat = false;
    for (let i = 0; i < wf.B.foes.length && wf.B.phase === 'target'; i++) wf.chooseCombatTarget('foe', i);
    if (wf.B.phase !== 'q') throw new Error('No reachable target entered the question gate');
    wf.onAnswer(wf.B.opts.findIndex(option => option.ok));
    wf.onContinueResolve();
  });
  const state = await page.evaluate(() => ({
    phase: window.__wf.B.phase,
    snapshotted: window.__wf.B.intent.rollsEnabled,
    dieVisible: !document.getElementById('combatDieScene').classList.contains('hidden'),
    dieOutsideQuestion: !document.getElementById('battleBox').contains(document.getElementById('combatD20')),
    settingRow: document.body.textContent.includes('Optional d20 rolls'),
  }));
  expect(state).toEqual({ phase: 'roll', snapshotted: true, dieVisible: true, dieOutsideQuestion: true, settingRow: true });
  expect(await page.evaluate(() => window.__wf.settingsRows().includes('Optional d20 rolls'))).toBe(true);
});

test('mana belongs to each party member and a draught is spent only after a correct answer', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page);
  const state = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    wf.S.consume.draught = 2;
    const target = B.party.length > 1 ? 1 : 0;
    B.party[target].mana = 0;
    wf.setActiveCombatant(0);
    wf.selectCombatAction('mana');
    wf.chooseCombatTarget('party', target);
    wf.onAnswer(B.opts.findIndex(option => option.ok));
    const gated = { mana: B.party[target].mana, draughts: wf.S.consume.draught };
    wf.onContinueResolve();
    return {
      target,
      everyoneHasMana: B.party.every(member => Number.isFinite(member.mana) && Number.isFinite(member.manaMax)),
      gated,
      resolved: { mana: B.party[target].mana, draughts: wf.S.consume.draught },
    };
  });
  expect(state.everyoneHasMana).toBe(true);
  expect(state.gated).toEqual({ mana: 0, draughts: 2 });
  expect(state.resolved.mana).toBeGreaterThan(0);
  expect(state.resolved.draughts).toBe(1);
});

test('connected hits keep the rigged strike and add target-aware blood for organic foes', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page, 'scopecreep');
  const animation = await page.evaluate(() => {
    const wf = window.__wf;
    wf.selectCombatAction('attack');
    for (let i = 0; i < wf.B.foes.length && wf.B.phase === 'target'; i++) wf.chooseCombatTarget('foe', i);
    wf.onAnswer(wf.B.opts.findIndex(option => option.ok));
    wf.onContinueResolve();
    return wf.B.fx.seq.kind;
  });
  expect(animation).not.toBe('fizzle');
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__wf.FXQ.blood.length)).toBeGreaterThan(0);
});

test('ability affordability is visible before selection, the tray dismisses, and recall stays in the region pool', async ({ page }) => {
  await freshGame(page, 'c');
  await page.evaluate(() => {
    const wf = window.__wf;
    wf.S.level = 10;
    wf.S.hero = { rig: 'heroMag', cls: 'caster' };
    window.startBattle({ enemyKey: 'scopecreep', region: wf.DATA.regions[0], spawn: null, boss: false });
    wf.B.party[0].mana = 0;
    wf.setActiveCombatant(0);
    wf.selectCombatAction('skills');
  });
  const affordability = await page.evaluate(() => {
    const wf = window.__wf;
    return wf.B.trayItems.filter(item => item.cost > 0).map((item, index) => ({
      locked: item.disabled,
      domLocked: document.querySelectorAll('#combatAbilityTray button')[wf.B.trayItems.indexOf(item)].disabled,
    }));
  });
  expect(affordability.length).toBeGreaterThan(0);
  expect(affordability.every(item => item.locked && item.domLocked)).toBe(true);

  await page.evaluate(() => window.__wf.selectCombatAction('skills'));
  expect(await page.evaluate(() => window.__wf.B.phase)).toBe('act');

  const regionDriven = await page.evaluate(() => {
    const wf = window.__wf, B = wf.B;
    B.party[0].mana = B.party[0].manaMax;
    wf.selectCombatAction('skills');
    const special = B.trayItems.findIndex(item => wf.skillIsSpecial(item.sk));
    wf.chooseCombatTrayItem(special >= 0 ? special : 0);
    for (let i = 0; i < B.foes.length && B.phase === 'target'; i++) wf.chooseCombatTarget('foe', i);
    return { concept: B.q.concept, pool: wf.regionPool(B.cert, B.region), depth: B.sel.depth };
  });
  expect(regionDriven.pool).toContain(regionDriven.concept);
  expect(['std', 'deep']).toContain(regionDriven.depth);
});

test('examination combat seals prohibited item slots with crossed chains', async ({ page }) => {
  await freshGame(page, 'c');
  const state = await page.evaluate(() => {
    window.startGauntlet('c');
    const sealed = [...document.querySelectorAll('#combatHotbar .sealed')];
    return { count: sealed.length, allDisabled: sealed.every(button => button.disabled), chains: sealed.every(button => !!button.querySelector('.combat-seal')) };
  });
  expect(state).toEqual({ count: 3, allDisabled: true, chains: true });
});

test('construct hits use alternate particles instead of blood', async ({ page }) => {
  await freshGame(page, 'c');
  await startBattle(page, 'mutegolem');
  await page.evaluate(() => {
    const wf = window.__wf;
    wf.selectCombatAction('attack');
    for (let i = 0; i < wf.B.foes.length && wf.B.phase === 'target'; i++) wf.chooseCombatTarget('foe', i);
    wf.onAnswer(wf.B.opts.findIndex(option => option.ok));
    wf.onContinueResolve();
  });
  await page.waitForTimeout(1500);
  const effects = await page.evaluate(() => ({ blood: window.__wf.FXQ.blood.length, particles: window.__wf.FXQ.parts.length }));
  expect(effects.blood).toBe(0);
  expect(effects.particles).toBeGreaterThan(0);
});

test('the retired prototype query boots the production game with no evaluator', async ({ page }) => {
  await page.goto('/index.html?prototype=hotbar');
  await page.waitForFunction(() => !!window.__wf && !!window.__wf.S);
  expect(await page.locator('#title').isVisible()).toBe(true);
  expect(await page.locator('#combatPrototype').count()).toBe(0);
});
