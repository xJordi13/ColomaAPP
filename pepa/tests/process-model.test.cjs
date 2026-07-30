const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_DESIGN,
  calculateDesign,
  calculateProfile,
  evaluateTreatment,
} = require('../lib/processModel.cjs');

test('calcula D con el signo Tref - T', () => {
  const result = calculateDesign(DEFAULT_DESIGN);
  assert.equal(result.valid, true);
  assert.ok(result.dAtProcess > result.dReference);
  assert.ok(result.dAtColdPoint > result.dAtProcess);
  assert.ok(Math.abs(result.dAtProcess - 1.4983) < 0.01);
});

test('deriva F de diseño desde el punto más frío', () => {
  const result = calculateDesign(DEFAULT_DESIGN);
  assert.equal(result.fDesign, result.fAtColdPoint);
  assert.ok(Math.abs(result.fAtColdPoint - result.decimalReductions * result.dAtColdPoint) < 1e-6);
  assert.ok(Math.abs(result.fAtReference - result.decimalReductions * result.dReference) < 1e-6);
});

test('calcula letalidad, contribución y F acumulado por intervalo', () => {
  const profile = calculateProfile(
    [
      { id: 'a', time: 0, temperature: 121.1 },
      { id: 'b', time: 2, temperature: 111.1 },
      { id: 'c', time: 4, temperature: 121.1 },
    ],
    121.1,
    10
  );

  assert.equal(profile.valid, true);
  assert.equal(profile.rows[0].lethality, 1);
  assert.equal(profile.rows[0].contribution, 2);
  assert.equal(profile.rows[1].lethality, 0.1);
  assert.equal(profile.rows[1].contribution, 0.2);
  assert.equal(profile.rows[2].contribution, 0);
  assert.ok(Math.abs(profile.fReal - 2.2) < 1e-10);
});

test('rechaza tiempos repetidos o desordenados', () => {
  const profile = calculateProfile(
    [
      { id: 'a', time: 0, temperature: 100 },
      { id: 'b', time: 0, temperature: 110 },
    ],
    121.1,
    10
  );
  assert.equal(profile.valid, false);
  assert.match(profile.errors.join(' '), /mayor que el anterior/);
});

test('evalúa cumplimiento e insuficiencia sin invertir el criterio', () => {
  assert.equal(evaluateTreatment(12, 10).status, 'compliant');
  assert.equal(evaluateTreatment(8, 10).status, 'insufficient');
});
