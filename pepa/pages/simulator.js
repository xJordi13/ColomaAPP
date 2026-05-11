import ThermalSimulator from '../components/ThermalSimulator';
import Layout from '../components/Layout';

export default function SimulatorPage() {
  return (
    <Layout>
      <main className="dashboard-grid">
        <ThermalSimulator />
      </main>
    </Layout>
  );
}
