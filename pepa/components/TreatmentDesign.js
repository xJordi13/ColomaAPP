import Link from 'next/link';
import { useProcess } from '../contexts/ProcessContext';
import MetricCard from './MetricCard';
import SurvivalChart from './SurvivalChart';

const fields = [
  { key: 'initialCount', label: 'Población inicial N₀', unit: 'microorganismos', min: 0, step: 1 },
  { key: 'finalCount', label: 'Población final Nf', unit: 'microorganismos', min: 0, step: 1 },
  { key: 'processTemperature', label: 'Temperatura del proceso T', unit: '°C', step: 0.1 },
  { key: 'referenceTemperature', label: 'Temperatura de referencia Tref', unit: '°C', step: 0.1 },
  { key: 'coldPointDelta', label: 'Diferencia hasta el punto más frío ΔT', unit: '°C', min: 0, step: 0.1 },
  { key: 'dReference', label: 'D de referencia Dref', unit: 'min', min: 0, step: 0.001 },
  { key: 'zValue', label: 'Valor z', unit: '°C', min: 0, step: 0.1 },
];

function format(value, digits = 3) {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(3);
  return value.toLocaleString('es-EC', { maximumFractionDigits: digits });
}

export default function TreatmentDesign() {
  const { design, designResult, updateDesign } = useProcess();

  return (
    <div className="content-stack">
      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Parámetros de diseño</p>
            <h2>Define el objetivo microbiológico</h2>
          </div>
          <p>Todos los resultados se actualizan con el mismo conjunto de parámetros y se guardan automáticamente.</p>
        </div>

        <div className="input-grid">
          {fields.map((field) => (
            <label key={field.key} className="field">
              <span>{field.label}</span>
              <div className="input-with-unit">
                <input
                  type="number"
                  value={design[field.key]}
                  min={field.min}
                  step={field.step}
                  onChange={(event) => updateDesign(field.key, event.target.value)}
                  aria-describedby={`${field.key}-unit`}
                />
                <small id={`${field.key}-unit`}>{field.unit}</small>
              </div>
            </label>
          ))}
        </div>

        {designResult.errors?.length ? (
          <div className="validation-message validation-message--error" role="alert">
            <strong>Revisa el diseño</strong>
            <ul>{designResult.errors.map((error) => <li key={error}>{error}</li>)}</ul>
          </div>
        ) : (
          <div className="validation-message validation-message--ok">
            <strong>Diseño consistente</strong>
            <span>Temperatura calculada en el punto más frío: {format(designResult.coldPointTemperature, 2)} °C</span>
          </div>
        )}
      </section>

      <section className="surface-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Resultados de diseño</p>
            <h2>Magnitudes calculadas</h2>
          </div>
          <p>La notación distingue valores a T, en el punto más frío y a la temperatura de referencia.</p>
        </div>

        <div className="metric-grid">
          <MetricCard label="Número de reducciones decimales" value={format(designResult.decimalReductions, 2)} note="n = log₁₀(N₀/Nf)" tone="accent" />
          <MetricCard label="D a la temperatura T" value={format(designResult.dAtProcess)} unit="min" note="Dₜ" />
          <MetricCard label="D en el punto más frío" value={format(designResult.dAtColdPoint)} unit="min" note="Dpf" />
          <MetricCard label="F a la temperatura T" value={format(designResult.fAtProcess)} unit="min" note="Fₜ = n · Dₜ" />
          <MetricCard label="F en el punto más frío" value={format(designResult.fAtColdPoint)} unit="min" note="Criterio F de diseño" tone="warning" />
          <MetricCard label="F a temperatura de referencia" value={format(designResult.fAtReference)} unit="min eq" note="Fref = n · Dref" />
        </div>
      </section>

      <section className="formula-section">
        <div>
          <p className="eyebrow">Trazabilidad matemática</p>
          <h2>Fórmulas generales</h2>
          <p>Cada variable mostrada arriba puede rastrearse hasta estas relaciones.</p>
        </div>
        <div className="formula-grid">
          <div><strong>n</strong><span>= log₁₀(N₀ / Nf)</span></div>
          <div><strong>Dₜ</strong><span>= Dref · 10<sup>(Tref − T) / z</sup></span></div>
          <div><strong>Fₜ</strong><span>= Fref · 10<sup>(Tref − T) / z</sup></span></div>
              <div><strong>F<sub>T</sub></strong><span>= n · D<sub>T</sub></span></div>
        </div>
      </section>

      <SurvivalChart result={designResult} />

      <div className="next-step-card">
        <div>
          <span>Paso siguiente</span>
          <strong>Evalúa un perfil real de tiempo y temperatura</strong>
        </div>
        <Link href="/validation" className="btn">Ir a evaluación</Link>
      </div>
    </div>
  );
}
