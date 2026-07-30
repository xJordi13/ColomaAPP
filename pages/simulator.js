import Head from 'next/head';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import TreatmentDesign from '../components/TreatmentDesign';
import { requirePageAuth } from '../lib/auth';

export default function SimulatorPage({ user }) {
  return (
    <Layout user={user}>
      <Head><title>Diseño del tratamiento · TermoSim</title></Head>
      <main className="page-content">
        <PageHeader
          step="01"
          eyebrow="Diseño del tratamiento térmico"
          title="Define antes de evaluar"
          description="Establece el objetivo microbiológico y calcula el tiempo requerido en la zona a T, el punto más frío y la temperatura de referencia."
        >
          <span className="quality-tag">Trazabilidad de cálculo</span>
        </PageHeader>
        <TreatmentDesign />
      </main>
    </Layout>
  );
}

export const getServerSideProps = requirePageAuth;
