const DEFAULT_DESIGN = Object.freeze({
  initialCount: 1000000,
  finalCount: 1,
  processTemperature: 115,
  referenceTemperature: 121.1,
  coldPointDelta: 5,
  dReference: 0.368,
  zValue: 10,
});

const DEFAULT_PROFILE = Object.freeze([
  { id: 'p-0', time: 0, temperature: 100 },
  { id: 'p-1', time: 2, temperature: 104 },
  { id: 'p-2', time: 4, temperature: 112 },
  { id: 'p-3', time: 6, temperature: 118 },
  { id: 'p-4', time: 8, temperature: 121 },
  { id: 'p-5', time: 10, temperature: 121 },
  { id: 'p-6', time: 12, temperature: 116 },
  { id: 'p-7', time: 14, temperature: 98 },
]);

function finite(value) {
  if (value === '' || value === null || value === undefined) return NaN;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function round(value, digits = 8) {
  if (!Number.isFinite(value)) return value;
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function validateDesign(input) {
  const values = {
    initialCount: finite(input.initialCount),
    finalCount: finite(input.finalCount),
    processTemperature: finite(input.processTemperature),
    referenceTemperature: finite(input.referenceTemperature),
    coldPointDelta: finite(input.coldPointDelta),
    dReference: finite(input.dReference),
    zValue: finite(input.zValue),
  };

  const errors = [];
  if (!(values.initialCount > 0)) errors.push('N₀ debe ser mayor que cero.');
  if (!(values.finalCount > 0)) errors.push('N final debe ser mayor que cero.');
  if (values.initialCount <= values.finalCount) errors.push('N₀ debe ser mayor que N final.');
  if (!(values.dReference > 0)) errors.push('D de referencia debe ser mayor que cero.');
  if (!(values.zValue > 0)) errors.push('z debe ser mayor que cero.');
  if (!(values.coldPointDelta >= 0)) errors.push('La diferencia del punto frío no puede ser negativa.');
  if (!Number.isFinite(values.processTemperature) || !Number.isFinite(values.referenceTemperature)) {
    errors.push('Las temperaturas deben ser valores numéricos.');
  }

  return { values, errors };
}

function calculateDesign(input) {
  const { values, errors } = validateDesign(input);
  if (errors.length) return { ...values, errors, valid: false };

  const {
    initialCount,
    finalCount,
    processTemperature,
    referenceTemperature,
    coldPointDelta,
    dReference,
    zValue,
  } = values;

  const coldPointTemperature = processTemperature - coldPointDelta;
  const decimalReductions = Math.log10(initialCount / finalCount);
  const dAtProcess = dReference * 10 ** ((referenceTemperature - processTemperature) / zValue);
  const dAtColdPoint = dReference * 10 ** ((referenceTemperature - coldPointTemperature) / zValue);
  const fAtProcess = decimalReductions * dAtProcess;
  const fAtColdPoint = decimalReductions * dAtColdPoint;
  const fAtReference = decimalReductions * dReference;

  const outputs = [
    decimalReductions,
    coldPointTemperature,
    dAtProcess,
    dAtColdPoint,
    fAtProcess,
    fAtColdPoint,
    fAtReference,
  ];
  if (outputs.some((value) => !Number.isFinite(value) || Math.abs(value) > 1e12)) {
    return { ...values, errors: ['Los parámetros producen resultados fuera de rango.'], valid: false };
  }

  return {
    ...values,
    valid: true,
    errors: [],
    coldPointTemperature: round(coldPointTemperature),
    decimalReductions: round(decimalReductions),
    dAtProcess: round(dAtProcess),
    dAtColdPoint: round(dAtColdPoint),
    fAtProcess: round(fAtProcess),
    fAtColdPoint: round(fAtColdPoint),
    fAtReference: round(fAtReference),
    fDesign: round(fAtColdPoint),
  };
}

function calculateProfile(points, referenceTemperature, zValue) {
  const tref = finite(referenceTemperature);
  const z = finite(zValue);
  const errors = [];

  if (!Array.isArray(points) || points.length < 2) {
    return { rows: [], fReal: 0, valid: false, errors: ['Ingresa al menos dos mediciones.'] };
  }
  if (!Number.isFinite(tref)) errors.push('La temperatura de referencia no es válida.');
  if (!(z > 0)) errors.push('El valor z debe ser mayor que cero.');

  const normalized = points.map((point, index) => ({
    id: String(point.id || `p-${index}`),
    time: finite(point.time),
    temperature: finite(point.temperature),
  }));

  normalized.forEach((point, index) => {
    if (!Number.isFinite(point.time) || point.time < 0) {
      errors.push(`Fila ${index + 1}: el tiempo debe ser mayor o igual que cero.`);
    }
    if (!Number.isFinite(point.temperature)) {
      errors.push(`Fila ${index + 1}: la temperatura no es válida.`);
    }
    if (index > 0 && point.time <= normalized[index - 1].time) {
      errors.push(`Fila ${index + 1}: el tiempo debe ser mayor que el anterior.`);
    }
  });

  if (errors.length) return { rows: [], fReal: 0, valid: false, errors };

  let cumulativeF = 0;
  const rows = normalized.map((point, index) => {
    const next = normalized[index + 1];
    const deltaTime = next ? next.time - point.time : 0;
    const exponent = (point.temperature - tref) / z;
    const lethality = 10 ** exponent;
    const contribution = lethality * deltaTime;

    if (![lethality, contribution].every(Number.isFinite) || Math.abs(exponent) > 40) {
      errors.push(`Fila ${index + 1}: el cálculo está fuera del rango permitido.`);
    }

    cumulativeF += Number.isFinite(contribution) ? contribution : 0;
    return {
      ...point,
      deltaTime: round(deltaTime),
      lethality: round(lethality, 12),
      contribution: round(contribution, 12),
      cumulativeF: round(cumulativeF, 12),
      isClosingPoint: !next,
    };
  });

  return {
    rows,
    fReal: round(cumulativeF, 12),
    valid: errors.length === 0,
    errors,
    totalTime: round(normalized[normalized.length - 1].time - normalized[0].time),
    maxTemperature: Math.max(...normalized.map((point) => point.temperature)),
    minTemperature: Math.min(...normalized.map((point) => point.temperature)),
  };
}

function evaluateTreatment(fReal, fDesign) {
  const real = finite(fReal);
  const design = finite(fDesign);
  if (!(design > 0) || !(real >= 0)) {
    return { status: 'pending', label: 'Evaluación pendiente', margin: NaN, ratio: NaN };
  }

  const margin = real - design;
  const ratio = real / design;
  if (real >= design) {
    return {
      status: 'compliant',
      label: 'El perfil alcanza el criterio de diseño',
      margin: round(margin),
      ratio: round(ratio),
    };
  }

  return {
    status: 'insufficient',
    label: 'El perfil no alcanza el criterio de diseño',
    margin: round(margin),
    ratio: round(ratio),
  };
}

function sanitizeDesign(input = {}) {
  return Object.fromEntries(
    Object.keys(DEFAULT_DESIGN).map((key) => {
      const value = finite(input[key]);
      return [key, Number.isFinite(value) ? value : DEFAULT_DESIGN[key]];
    })
  );
}

function sanitizeProfile(input) {
  if (!Array.isArray(input) || input.length < 2 || input.length > 200) {
    return DEFAULT_PROFILE.map((point) => ({ ...point }));
  }
  return input.map((point, index) => ({
    id: String(point.id || `p-${index}`).slice(0, 64),
    time: finite(point.time),
    temperature: finite(point.temperature),
  }));
}

module.exports = {
  DEFAULT_DESIGN,
  DEFAULT_PROFILE,
  calculateDesign,
  calculateProfile,
  evaluateTreatment,
  sanitizeDesign,
  sanitizeProfile,
  validateDesign,
};
