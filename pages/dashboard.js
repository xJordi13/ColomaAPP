import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import MetricCard from '../components/MetricCard';
import { useProcess } from '../contexts/ProcessContext';
import { requirePageAuth } from '../lib/auth';

function format(value, digits = 4) {
  if (!Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 0.001) return value.toExponential(3);
  return value.toLocaleString('es-EC', { maximumFractionDigits: digits });
}

export default function Dashboard({ user }) {
  const { designResult, profileResult, evaluation, resetProcess } = useProcess();

  function printReport() {
    window.print();
  }

  return (
    <Layout user={user}>
      <Head><title>Resumen técnico · TermoSim</title></Head>
      <main className="page-content report-page">
        <PageHeader
          step="03"
          eyebrow="Resumen técnico"
          title="Lectura consolidada del proceso"
          description="Reúne el diseño, el perfil evaluado y el resultado final sin duplicar entradas."
        >
          <button type="button" className="btn btn--secondary print-hidden" onClick={printReport}>
            Imprimir resumen
          </button>
        </PageHeader>

        <section className={`report-verdict report-verdict--${evaluation.status}`}>
          <span>Dictamen didáctico</span>
          <h2>{evaluation.label}</h2>
          <p>
            F real: <strong>{format(profileResult.fReal, 5)} min eq</strong> · F diseño:
            <strong> {format(designResult.fDesign, 5)} min</strong>
          </p>
        </section>

        <section className="surface-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Base de diseño</p>
              <h2>Parámetros microbiológicos</h2>
            </div>
            <Link href="/simulator" className="text-link print-hidden">Editar diseño</Link>
          </div>
          <div className="metric-grid">
            <MetricCard label="Reducciones decimales" value={format(designResult.decimalReductions, 2)} />
            <MetricCard label="Temperatura del proceso" value={format(designResult.processTemperature, 1)} unit="°C" />
            <MetricCard label="Temperatura del punto frío" value={format(designResult.coldPointTemperature, 1)} unit="°C" />
            <MetricCard label="D en punto frío" value={format(designResult.dAtColdPoint, 4)} unit="min" />
            <MetricCard label="F en punto frío" value={format(designResult.fAtColdPoint, 4)} unit="min" tone="warning" />
            <MetricCard label="F a Tref" value={format(designResult.fAtReference, 4)} unit="min eq" />
          </div>
        </section>

        <section className="surface-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Perfil evaluado</p>
              <h2>Resumen de las mediciones</h2>
            </div>
            <Link href="/validation" className="text-link print-hidden">Editar evaluación</Link>
          </div>
          <div className="metric-grid metric-grid--evaluation">
            <MetricCard label="Mediciones" value={profileResult.rows.length || '—'} />
            <MetricCard label="Duración" value={format(profileResult.totalTime, 2)} unit="min" />
            <MetricCard label="Temperatura mínima" value={format(profileResult.minTemperature, 1)} unit="°C" />
            <MetricCard label="Temperatura máxima" value={format(profileResult.maxTemperature, 1)} unit="°C" />
          </div>
        </section>

        <div className="danger-zone print-hidden">
          <div>
            <strong>Reiniciar ejercicio</strong>
            <span>Restaura el ejemplo didáctico de diseño y mediciones.</span>
          </div>
          <button type="button" className="text-button text-button--danger" onClick={resetProcess}>
            Restaurar valores iniciales
          </button>
        </div>
      </main>
    </Layout>
  );
}

export const getServerSideProps = requirePageAuth;
