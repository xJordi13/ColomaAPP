import Head from 'next/head';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import EvaluationWorkspace from '../components/EvaluationWorkspace';
import { requirePageAuth } from '../lib/auth';

export default function ValidationPage({ user }) {
  return (
    <Layout user={user}>
      <Head><title>Evaluación del tratamiento · TermoSim</title></Head>
      <main className="page-content">
        <PageHeader
          step="02"
          eyebrow="Evaluación del tratamiento térmico"
          title="Convierte mediciones en evidencia"
          description="Registra tiempo y temperatura; TermoSim calcula la letalidad, la contribución por intervalo, F acumulado y el cumplimiento del diseño."
        >
          <span className="quality-tag">Datos guardados</span>
        </PageHeader>
        <EvaluationWorkspace />
      </main>
    </Layout>
  );
}

export const getServerSideProps = requirePageAuth;
