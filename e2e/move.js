// Moving to a new phone or address: a fresh install imports a backup from the first screen and skips setup.
// run: node e2e/cdp.js "http://127.0.0.1:8765/index.html" "" 390 e2e/move.js
const path = require('path');
module.exports = async (ctx) => {
  const { evalFn, shot, sleep } = ctx;
  const { check, txt, has, st, done, SHOTS } = require('./lib')(ctx);
  check('a fresh install opens on setup, offering to import a backup', (await has('.setup')) && /Have a backup\? Import it/.test(await txt('#su-import')) && (await has('#su-file')));
  check('the old-address notice only shows on the old address', !(await has('#moved-card')));
  await shot(path.join(SHOTS, 'move-1-setup.png'));
  // a backup from the old address: two workouts, her name and character
  const backup = { app: 'arise', version: 1, exportedAt: new Date().toISOString(), data: {
    profile: { name: 'Mover', sex: 'f', bodyweight: 140, units: 'lb', age: 28, weeklyTarget: 4, setupDone: true },
    sessions: [1, 3].map(d => ({ id: 'mv' + d, date: Date.now() - d * 86400000, endedAt: Date.now() - d * 86400000 + 3600000, name: 'Lower', entries: [{ exId: 'bb_squat', sets: [{ w: 135, r: 5 }, { w: 145, r: 5 }] }] })),
    routines: [], game: { xp: 300 } } };
  await evalFn(`(() => {
    const dt = new DataTransfer(); dt.items.add(new File([${JSON.stringify(JSON.stringify(backup))}], 'arise-backup.json', { type: 'application/json' }));
    const input = document.querySelector('#su-file'); input.files = dt.files; input.dispatchEvent(new Event('change'));
  })()`);
  for (let i = 0; i < 20 && (await has('.setup')); i++) await sleep(150);
  const s = await st();
  check('importing skips setup and brings the whole log', !(await has('.setup')) && s.sessions.length === 2 && s.profile.name === 'Mover' && s.profile.sex === 'f' && s.profile.setupDone === true, { sessions: s.sessions.length, name: s.profile.name });
  check('home shows the moved log', /2 workouts/.test(await txt('.top .kicker')) && /Mover/.test(await txt('#screen')));
  await shot(path.join(SHOTS, 'move-2-imported.png'));
  done('move');
};
