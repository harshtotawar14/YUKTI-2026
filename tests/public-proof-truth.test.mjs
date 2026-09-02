import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../backend/src/proof/public-summary.cjs',import.meta.url),'utf8');

test('public proof keeps observed demand as real database value',()=>{
  assert.match(source,/observedDemand30d:observedDemand/);
  assert.doesNotMatch(source,/Math\.max\(Number\(.*demand.*\),\s*1\)/i);
});

test('public proof derives cooperative and region from database rows',()=>{
  assert.match(source,/c\.name AS cooperative_name/);
  assert.match(source,/c\.region AS cooperative_region/);
  assert.doesNotMatch(source,/cooperative:\s*['"]YUKTI Community Services Cooperative['"]/);
  assert.doesNotMatch(source,/zone:\s*['"]YUKTI Service Area['"]/);
});

test('public proof separates observed data from forecasting claims',()=>{
  assert.match(source,/dataMeaning:'OBSERVED_DATABASE_DATA_ONLY'/);
  assert.match(source,/forecastStatus:'NO_ML_FORECAST_CLAIM_IN_PUBLIC_PROOF'/);
});
