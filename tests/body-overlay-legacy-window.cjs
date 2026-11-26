// Exercise the shipped v183 handler, even after the new app changes.
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const source = execFileSync('git', ['show', 'ed3a6204cb60d545662f050974ed968d0fd831ba:app.js'], { encoding: 'utf8' });
const start = source.indexOf('async()=>{const id=button.dataset.graphDelete');
const end = source.indexOf(';root.querySelectorAll', start);
const handler = source.slice(start, end - 1);
const storageCode = source.slice(source.indexOf('const KEY='), source.indexOf('let metric=')) +
  source.slice(source.indexOf('function validate(data)'), source.indexOf('function merge('));
const record = id => ({ id, at: '2026-11-18T08:00', weight: 80,
  createdAt: '2026-11-18T00:00Z', updatedAt: '2026-11-18T00:00Z' });
async function delayedDelete(addDuringConfirmation) {
  let raw = JSON.stringify({ version: 1, records: [record('a')], baseline: null });
  const context = {
    localStorage: { getItem: () => raw, setItem: (_, value) => { raw = value; } },
    button: { dataset: { graphDelete: 'a' } }, historySelected: new Set(),
    graphSelectedId: '', root: {}, mount() {}, bodyNotice(message) { throw Error(message); },
    async confirmBodyDelete() {
      if (addDuringConfirmation) {
        const otherTab = JSON.parse(raw);
        otherTab.records.push(record('b'));
        raw = JSON.stringify(otherTab);
      }
      return true;
    }
  };
  await vm.runInNewContext(storageCode + '(' + handler + ')()', context);
  return raw;
}
(async () => {
  const withoutAddition = await delayedDelete(false);
  const withAddition = await delayedDelete(true);
  assert.equal(withAddition, withoutAddition);
  assert.deepEqual(JSON.parse(withAddition).records, []);
  console.log('Reproduced: v183 delayed deletion erased an unobserved concurrent v1 addition.');
})();
