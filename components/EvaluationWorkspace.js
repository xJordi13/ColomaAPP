import Link from 'next/link';
import { useProcess } from '../contexts/ProcessContext';
import MetricCard from './MetricCard';
import ProfileTable from './ProfileTable';
import ProcessCharts from './ProcessCharts';

function format(value, digits = 4) {
  if (!Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 0.001) return value.toExponential(3);
  return value.toLocaleString('es-EC', { maximumFractionDigits: digits });
}

export default function EvaluationWorkspace() {
  const { designResult, profileResult, evaluation } = useProcess();
  const ratio = Number.isFinite(evaluation.ratio) ? evaluation.ratio * 100 : NaN;

  return (
    <div className="content-stack">
      <section className="design-context">
        <div>
          <span className="eyebrow">Datos heredados del diseño</span>
          <h2>Un solo proceso, sin volver a escribir parámetros</h2>
        </div>
        <div className="context-values">
          <span>Tref <strong>{format(designResult.referenceTemperature, 1)} °C</strong></span>
          <span>z <strong>{format(designResult.zValue, 1)} °C</strong></span>
          <span>n <strong>{format(designResult.decimalReductions, 2)}</strong></span>
          <span>D punto frío <strong>{format(designResult.dAtColdPoint, 3)} min</strong></span>
        </div>
        <Link href="/simulator" className="text-link">Editar diseño</Link>
      </section>

      <ProfileTable />

      <section className={`evaluation-banner evaluation-banner--${evaluation.status}`} aria-live="polite">
        <div className="evaluation-symbol" aria-hidden="true">
          {evaluation.status === 'compliant' ? '✓' : evaluation.status === 'insufficient' ? '!' : '·'}
        </div>
        <div>
          <span>Resultado de la evaluación</span>
          <h2>{evaluation.label}</h2>
          <p>
            {evaluation.status === 'compliant'
              ? `El proceso supera el criterio en ${format(evaluation.margin, 4)} min equivalentes.`
              : evaluation.status === 'insufficient'
                ? `Faltan ${format(Math.abs(evaluation.margin), 4)} min equivalentes para alcanzar el diseño.`
                : 'Completa un diseño y un perfil válidos para obtener el resultado.'}
          </p>
        </div>
        <div className="evaluation-score">
          <strong>{format(ratio, 1)}%</strong>
          <span>del criterio</span>
        </div>
      </section>

      <section className="metric-grid metric-grid--evaluation">
        <MetricCard label="F real acumulado" value={format(profileResult.fReal, 5)} unit="min eq" tone="accent" />
        <MetricCard label="F de diseño" value={format(designResult.fDesign, 5)} unit="min" note="n · D en punto frío" tone="warning" />
        <MetricCard label="Duración del perfil" value={format(profileResult.totalTime, 2)} unit="min" />
        <MetricCard label="Temperatura máxima" value={format(profileResult.maxTemperature, 1)} unit="°C" />
      </section>

      <ProcessCharts
        rows={profileResult.rows}
        fReal={profileResult.fReal}
        fDesign={designResult.fDesign}
      />

      <div className="next-step-card">
        <div>
          <span>Informe consolidado</span>
          <strong>Revisa los parámetros, el perfil y el dictamen en una sola vista</strong>
        </div>
        <Link href="/dashboard" className="btn">Ver resumen técnico</Link>
      </div>
    </div>
  );
}
