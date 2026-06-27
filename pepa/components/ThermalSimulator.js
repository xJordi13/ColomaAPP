import { useState } from 'react';
import { toNumber } from '../lib/number';

const DEFAULT_INPUTS = {
  N0: 1000000,
  Nf: 1,
  T: 115,
  Tref: 121,
  deltaT: 5,
  DT: 1.5,
  z: 10,
};

function buildSimulation(inputs) {
  const N0 = Number(inputs.N0);
  const Nf = Number(inputs.Nf);
  const T = Number(inputs.T);
  const Tref = Number(inputs.Tref);
  const deltaT = Number(inputs.deltaT);
  const DT = Number(inputs.DT);
  const z = Number(inputs.z);

  const validCoreInputs = N0 > 0 && Nf > 0 && DT > 0 && z > 0;
  const n = validCoreInputs ? Math.log10(N0 / Nf) : NaN;
  const Dcaliente = DT;
  const Dfria = validCoreInputs ? DT * Math.pow(10, deltaT / z) : NaN;
  const tiempoCaliente = Number.isFinite(n) ? n * Dcaliente : NaN;
  const tiempoFria = Number.isFinite(n) && Number.isFinite(Dfria) ? n * Dfria : NaN;
  const Fcaliente = Number.isFinite(tiempoCaliente) && Number.isFinite(z) && z > 0
    ? tiempoCaliente * Math.pow(10, (T - Tref) / z)
    : NaN;
  const Ffria = Number.isFinite(tiempoFria) && Number.isFinite(z) && z > 0
    ? tiempoFria * Math.pow(10, ((T - deltaT) - Tref) / z)
    : NaN;

  const steps = 30;
  const maxTime = Number.isFinite(tiempoFria) && tiempoFria > 0 ? tiempoFria : 1;
  const chartPoints = [];

  if (Number.isFinite(N0) && N0 > 0 && Number.isFinite(Dcaliente) && Dcaliente > 0 && Number.isFinite(Dfria) && Dfria > 0) {
    for (let index = 0; index <= steps; index += 1) {
      const t = (maxTime / steps) * index;
      chartPoints.push({
        t,
        caliente: Math.log10(N0) - (t / Dcaliente),
        fria: Math.log10(N0) - (t / Dfria),
      });
    }
  }

  return {
    N0,
    Nf,
    T,
    Tref,
    deltaT,
    DT,
    z,
    n,
    Dcaliente,
    Dfria,
    tiempoCaliente,
    tiempoFria,
    Fcaliente,
    Ffria,
    chartPoints,
    isValid: Number.isFinite(n) && Number.isFinite(Dfria) && Number.isFinite(Fcaliente) && Number.isFinite(Ffria),
  };
}

function formatValue(value, digits = 2) {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(digits);
}

function renderLine(points, field, stroke, minValue, range, maxTime) {
  if (!points.length) return null;

  return points.map((point, index) => {
    const nextPoint = points[index + 1];
    if (!nextPoint) return null;

    const x1 = 52 + (point.t / Math.max(1, maxTime)) * 540;
    const y1 = 220 - (((point[field] - minValue) / Math.max(1, range)) * 140);
    const x2 = 52 + (nextPoint.t / Math.max(1, maxTime)) * 540;
    const y2 = 220 - (((nextPoint[field] - minValue) / Math.max(1, range)) * 140);

    return (
      <line
        key={`${field}-${index}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    );
  });
}

export default function ThermalSimulator() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [simulation, setSimulation] = useState(() => buildSimulation(DEFAULT_INPUTS));

  const updateField = (field, value) => {
    setInputs((current) => ({
      ...current,
      [field]: toNumber(value),
    }));
  };

  const handleSimulate = () => {
    setSimulation(buildSimulation(inputs));
  };

  const values = simulation.chartPoints.flatMap((point) => [point.caliente, point.fria]).filter(Number.isFinite);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 1;
  const range = Math.max(1, maxValue - minValue);
  const maxTime = Number.isFinite(simulation.tiempoFria) && simulation.tiempoFria > 0 ? simulation.tiempoFria : 1;

  return (
    <section className="surface-card">
      <div className="section-head">
        <div>
          <p className="section-kicker">Simulador inicial</p>
          <h2>Letalidad térmica con zona fría</h2>
        </div>
        <p className="section-note">Esto va primero: primero ves el escenario completo y luego el desglose por intervalos.</p>
      </div>

      <div className="grid two">
        <label>N₀
          <input type="number" value={inputs.N0} onChange={(event) => updateField('N0', event.target.value)} />
        </label>
        <label>N final
          <input type="number" value={inputs.Nf} onChange={(event) => updateField('Nf', event.target.value)} />
        </label>
        <label>Temperatura del proceso T (°C)
          <input type="number" step="0.1" value={inputs.T} onChange={(event) => updateField('T', event.target.value)} />
        </label>
        <label>Temperatura de referencia Tref (°C)
          <input type="number" step="0.1" value={inputs.Tref} onChange={(event) => updateField('Tref', event.target.value)} />
        </label>
        <label>ΔT zona fría (°C)
          <input type="number" step="0.1" value={inputs.deltaT} onChange={(event) => updateField('deltaT', event.target.value)} />
        </label>
        <label>Valor D medido a T (min)
          <input type="number" step="0.01" value={inputs.DT} onChange={(event) => updateField('DT', event.target.value)} />
        </label>
        <label>Valor z (°C)
          <input type="number" step="0.1" value={inputs.z} onChange={(event) => updateField('z', event.target.value)} />
        </label>
      </div>

      <div className="hero-actions">
        <button type="button" onClick={handleSimulate} className="btn">Simular proceso</button>
      </div>

      <div className="summary-grid">
        <div className="summary-chip">
          <span>Reducciones n</span>
          <strong>{formatValue(simulation.n, 2)}</strong>
        </div>
        <div className="summary-chip">
          <span>D caliente</span>
          <strong>{formatValue(simulation.Dcaliente, 3)} min</strong>
        </div>
        <div className="summary-chip">
          <span>D fría</span>
          <strong>{formatValue(simulation.Dfria, 3)} min</strong>
        </div>
        <div className="summary-chip">
          <span>Tiempo caliente</span>
          <strong>{formatValue(simulation.tiempoCaliente, 2)} min</strong>
        </div>
        <div className="summary-chip">
          <span>Tiempo frío</span>
          <strong>{formatValue(simulation.tiempoFria, 2)} min</strong>
        </div>
        <div className="summary-chip">
          <span>F caliente</span>
          <strong>{Number.isFinite(simulation.Fcaliente) ? `${formatValue(simulation.Fcaliente, 2)} min eq` : '—'}</strong>
        </div>
        <div className="summary-chip">
          <span>F fría</span>
          <strong>{Number.isFinite(simulation.Ffria) ? `${formatValue(simulation.Ffria, 2)} min eq` : '—'}</strong>
        </div>
      </div>

      <div className="formula-block formula-stack">
        <div className="formula-eq">
          <span className="formula-var">n</span>
          <span className="formula-operator">=</span>
          <span>log<sub>10</sub>(N₀ / N<sub>f</sub>)</span>
        </div>
        <div className="formula-eq">
          <span className="formula-var">D frío</span>
          <span className="formula-operator">=</span>
          <span>D<sub>T</sub> · 10<sup>ΔT / z</sup></span>
        </div>
        <div className="formula-eq">
          <span className="formula-var">F</span>
          <span className="formula-operator">=</span>
          <span>t · 10<sup>(T - Tref) / z</sup></span>
        </div>
      </div>

      <p className={`badge ${simulation.isValid ? 'ok' : 'fail'}`}>
        {simulation.isValid ? 'Simulación lista' : 'Revisa N₀, N final, D y z para obtener resultados válidos'}
      </p>

      <div className="chart-card">
        <div className="chart-panel__header">
          <p className="chart-panel__title">Curvas de sobrevivencia</p>
          <p className="chart-panel__desc">Comparación entre la zona caliente y la zona fría sobre la misma escala temporal.</p>
        </div>

        {simulation.chartPoints.length > 1 ? (
          <svg viewBox="0 0 640 280" className="chart-svg" role="img" aria-label="Curvas de sobrevivencia térmica">
            <rect x="0" y="0" width="640" height="280" rx="22" fill="#fffaf4" />
            {[64, 112, 160, 208].map((lineY) => (
              <line key={lineY} x1="52" y1={lineY} x2="592" y2={lineY} className="chart-grid-line" />
            ))}
            <line x1="52" y1="220" x2="592" y2="220" className="chart-axis" />
            <line x1="52" y1="52" x2="52" y2="220" className="chart-axis" />

            {renderLine(simulation.chartPoints, 'caliente', '#c2410c', minValue, range, maxTime)}
            {renderLine(simulation.chartPoints, 'fria', '#0f766e', minValue, range, maxTime)}

            {simulation.chartPoints.map((point, index) => {
              const x = 52 + (point.t / Math.max(1, maxTime)) * 540;
              const yHot = 220 - (((point.caliente - minValue) / Math.max(1, range)) * 140);
              const yCold = 220 - (((point.fria - minValue) / Math.max(1, range)) * 140);

              return (
                <g key={`points-${index}`}>
                  <circle cx={x} cy={yHot} r="3.5" fill="#c2410c" />
                  <circle cx={x} cy={yCold} r="3.5" fill="#0f766e" opacity="0.65" />
                </g>
              );
            })}

            <text x="22" y="60" className="chart-axis-label">log₁₀ N</text>
            <text x="560" y="246" textAnchor="end" className="chart-axis-label">Tiempo (min)</text>
            <text x="566" y="96" textAnchor="end" className="chart-value">Zona caliente</text>
            <text x="566" y="120" textAnchor="end" className="chart-value">Zona fría</text>
          </svg>
        ) : (
          <p className="small">No hay datos válidos para dibujar la curva.</p>
        )}
      </div>
    </section>
  );
}