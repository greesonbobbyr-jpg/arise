// No horizontal scroll at the current viewport width.
module.exports = async ({ evalFn }) => {
  const r = await evalFn(`({ w: innerWidth, sw: document.documentElement.scrollWidth })`);
  console.log(r.sw <= r.w ? '  ok   no horizontal overflow at ' + r.w + 'px' : '  FAIL horizontal overflow ' + JSON.stringify(r));
};
