/**
 * Calculation Controller
 * Centralized business logic for thermal sterilization calculations
 */

/**
 * Compute the instantaneous lethality (L) for a given temperature
 * L_i = 10^((T_i - T_ref) / Z)
 */
export function computeL(temp, tref, z) {
  if (!Number.isFinite(z) || z <= 0) {
    return { error: 'Z no puede ser 0' };
  }
  if (!Number.isFinite(temp) || !Number.isFinite(tref)) {
    return { error: 'Valores de temperatura inválidos' };
  }
  
  const exponent = (temp - tref) / z;
  if (!Number.isFinite(exponent) || Math.abs(exponent) > 12) {
    return { error: 'Exponent fuera de rango' };
  }

  const L = Math.pow(10, exponent);
  if (!Number.isFinite(L)) {
    return { error: 'Error en cálculo de L' };
  }

  return { value: L };
}

/**
 * Compute the total F_real (equivalent minutes at reference temperature)
 * Integrates L * dt over all intervals in the profile
 */
export function computeProfileF(intervals, tref, z) {
  if (!Number.isFinite(tref) || !Number.isFinite(z) || z <= 0) {
    return { error: 'Z no puede ser 0' };
  }
  if (!Array.isArray(intervals) || intervals.length === 0) {
    return { error: 'Agrega al menos un intervalo' };
  }

  let f = 0;
  let validIntervals = 0;

  intervals.forEach((row) => {
    const T = parseFloat(row.temp) || 0;
    const dt = parseFloat(row.dt) || 0;

    if (!Number.isFinite(T) || !Number.isFinite(dt) || dt <= 0) return;

    const exponent = (T - tref) / z;
    if (!Number.isFinite(exponent) || Math.abs(exponent) > 12) return;

    const L = Math.pow(10, exponent);
    if (!Number.isFinite(L)) return;

    const contribution = L * dt;
    if (!Number.isFinite(contribution) || contribution > 1e6) return;

    validIntervals += 1;
    f += contribution;
  });

  if (validIntervals === 0) {
    return { error: 'Ingresa valores validos (Delta t > 0)' };
  }

  return { value: f };
}

/**
 * Compute D value (decimal reduction time) at a given delta T
 * D(ΔT) = D_ref * 10^(ΔT/Z)
 */
export function computeDAtDeltaT(DRef, deltaT, z) {
  if (!Number.isFinite(z) || z <= 0) {
    return { error: 'Z no puede ser 0' };
  }
  if (!Number.isFinite(DRef) || DRef <= 0) {
    return { error: 'D_ref debe ser positivo' };
  }
  if (!Number.isFinite(deltaT)) {
    return { error: 'ΔT inválido' };
  }

  const exponent = deltaT / z;
  if (Math.abs(exponent) > 12) {
    return { error: 'Exponent fuera de rango' };
  }

  const D = DRef * Math.pow(10, exponent);
  if (!Number.isFinite(D)) {
    return { error: 'Error en cálculo de D' };
  }

  return { value: D };
}

/**
 * Compute heat transfer parameters
 * Q = m * cp * dT (heat required)
 * A = Q / (U * DTLM) (heat exchange area)
 */
export function computeHeatTransfer(m, cp, dT, u, dtlm) {
  if (!Number.isFinite(m) || !Number.isFinite(cp) || !Number.isFinite(dT)) {
    return { error: 'Parámetros de masa/calor específico inválidos' };
  }

  const Q = m * cp * dT;
  if (!Number.isFinite(Q)) {
    return { error: 'Error en cálculo de Q' };
  }

  if (u === 0 || dtlm === 0) {
    return { Q, error: 'U y DTLM no pueden ser 0' };
  }

  if (!Number.isFinite(u) || !Number.isFinite(dtlm) || u <= 0 || dtlm <= 0) {
    return { Q, error: 'U y DTLM deben ser positivos' };
  }

  const A = Q / (u * dtlm);
  if (!Number.isFinite(A)) {
    return { Q, error: 'Error en cálculo de A' };
  }

  return { Q, A };
}

/**
 * Validate process safety
 * Compares F_real against F_design (= D * n reductions)
 */
export function validateProcess(fReal, d, n) {
  if (!Number.isFinite(fReal) || fReal <= 0) {
    return { status: 'error', message: 'F_real inválido', class: 'fail' };
  }

  const fDesign = d * n;
  if (!Number.isFinite(fDesign) || fDesign <= 0) {
    return { status: 'warning', message: 'Define D y reducciones', class: '' };
  }

  if (fReal >= fDesign) {
    return { status: 'ok', message: 'Proceso seguro (F_real >= F_diseno)', class: 'ok' };
  } else {
    return { status: 'fail', message: 'Ajustar variables (F_real < F_diseno)', class: 'fail' };
  }
}

/**
 * Format a number for display
 * Uses exponential notation for very small values
 */
export function formatResult(value, decimals = 4) {
  if (!Number.isFinite(value)) return '-';
  if (value >= 0.00001) return value.toFixed(decimals);
  return value.toExponential(3);
}
