import assert from 'node:assert/strict';
import {renderSVG,styles} from '../examples/scenes.mjs';
const ids=styles.map(s=>s[0]);assert.equal(new Set(ids).size,ids.length);
let checked=0;
for(const id of ids)for(const t of [0,.1,1.4,3,7.99,8]) {
  const svg=renderSVG(id,t);
  assert.equal(svg,renderSVG(id,t),`${id} must be deterministic at ${t}`);
  assert(!svg.includes('NaN')&&!svg.includes('Infinity'));
  assert(svg.includes('viewBox="0 0 960 540"'));
  checked++;
}
assert.throws(()=>renderSVG('unknown',0));
assert.throws(()=>renderSVG(ids[0],NaN));
assert.throws(()=>renderSVG(ids[0],Infinity));
assert.equal(renderSVG(ids[0],-1),renderSVG(ids[0],0));
assert.equal(renderSVG(ids[0],9),renderSVG(ids[0],8));
console.log(`PASS: ${ids.length} distinct styles; ${checked} deterministic boundary samples; invalid input and time clamping.`);
