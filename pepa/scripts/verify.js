// Simple verification script for thermal lethality formulas
// Run from project root: node scripts/verify.js

function format(v, d = 4) { return Number.isFinite(v) ? v.toFixed(d) : 'NaN'; }

function computeExample(inputs) {
  const { N0, Nf, T, Tref, deltaT, DT, z } = inputs;
  const n = Math.log10(N0 / Nf);
  const D_caliente = DT; // D measured at process T
  const D_fria = DT * Math.pow(10, deltaT / z); // D at (T - deltaT)

  const tiempo_caliente = n * D_caliente;
  const tiempo_fria = n * D_fria;

  const F_caliente = tiempo_caliente * Math.pow(10, (T - Tref) / z);
  const F_fria = tiempo_fria * Math.pow(10, ((T - deltaT) - Tref) / z);

  // Stepwise (small dt) approximation of F_real by integrating L(t)*dt
  // For two-zone simplified model we assume whole process at T (hot) and T-deltaT (cold)
  const F_step_hot = tiempo_caliente * Math.pow(10, (T - Tref) / z);
  const F_step_cold = tiempo_fria * Math.pow(10, ((T - deltaT) - Tref) / z);

  return {
    n,
    D_caliente,
    D_fria,
    tiempo_caliente,
    tiempo_fria,
    F_caliente,
    F_fria,
    F_step_hot,
    F_step_cold,
    F_total_simple: F_caliente + F_fria,
  };
}

// Example inputs from your HTML file
const example = {
  N0: 1000000,
  Nf: 1,
  T: 115,
  Tref: 121,
  deltaT: 5,
  DT: 1.5,
  z: 10,
};

const res = computeExample(example);

console.log('Inputs:', example);
console.log('n (reducciones):', format(res.n, 4));
console.log('D caliente (DT):', format(res.D_caliente, 4));
console.log('D fría (DT * 10^(ΔT/z)):', format(res.D_fria, 6));
console.log('Tiempo caliente (n*D):', format(res.tiempo_caliente, 4), 'min');
console.log('Tiempo fría (n*D_fría):', format(res.tiempo_fria, 4), 'min');
console.log('F caliente (t_hot * 10^{(T-Tref)/z}):', format(res.F_caliente, 6));
console.log('F fría (t_cold * 10^{(T-ΔT-Tref)/z}):', format(res.F_fria, 6));
console.log('Suma simple F_total:', format(res.F_total_simple, 6));

// Quick check using per-interval approach: split times into many small dt and sum Li*dt
function integrateTwoZone(example) {
  const { N0, Nf, T, Tref, deltaT, DT, z } = example;
  const n = Math.log10(N0 / Nf);
  const D_hot = DT;
  const D_cold = DT * Math.pow(10, deltaT / z);
  const t_hot = n * D_hot;
  const t_cold = n * D_cold;
  const steps = 10000;
  let sum = 0;
  // assume first runs hot then cold
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * (t_hot + t_cold);
    const dt = (t_hot + t_cold) / steps;
    const temp = t <= t_hot ? T : (T - deltaT);
    const Li = Math.pow(10, (temp - Tref) / z);
    sum += Li * dt;
  }
  return sum;
}

const integrated = integrateTwoZone(example);
console.log('Integración numérica (hot then cold):', format(integrated, 6));

// Final note
console.log('\nInterpretación:');
console.log('- L_i = 10^{(T_i - Tref)/z}');
console.log('- Contribución por intervalo = L_i * Δt_i');
console.log('- F_real = Σ L_i * Δt_i');
console.log('- F_design = D * n (D at design T or Tref)');

process.exit(0);
