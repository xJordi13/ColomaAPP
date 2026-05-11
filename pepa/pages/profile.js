import Layout from '../components/Layout';
import { useState, useEffect } from 'react';
import { getDefaults } from '../lib/products';

export default function ProfilePage() {
  const defaults = getDefaults('enlatado', 'atun');
  const [intervals, setIntervals] = useState(defaults.intervals);
  const [tref, setTref] = useState(defaults.tref);
  const [z, setZ] = useState(defaults.z);

  useEffect(() => setIntervals(defaults.intervals.map((r, i) => ({ ...r, id: r.id || String(i + 1) }))), []);

  const updateInterval = (id, field, value) => setIntervals(intervals.map(i => i.id === id ? { ...i, [field]: Number(value) } : i));
  const addInterval = () => setIntervals([...intervals, { id: Date.now().toString(), temp: 0, dt: 0 }]);
  const removeInterval = (id) => setIntervals(intervals.filter(i => i.id !== id));

  return (
    <Layout>
      <main className="dashboard-grid">
        <section className="surface-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Perfil térmico</p>
              <h2>Editor de intervalos</h2>
            </div>
            <p className="section-note">Define el perfil de temperatura paso a paso. Estos valores se usan en validación y gráficos.</p>
          </div>

          <div className="grid two">
            <label>T_ref (C)
              <input type="number" step="0.1" value={tref} onChange={(e) => setTref(parseFloat(e.target.value) || 0)} />
            </label>
            <label>Z (C)
              <input type="number" step="0.1" value={z} onChange={(e) => setZ(parseFloat(e.target.value) || 0)} />
            </label>
          </div>

          <p className="small">Intervalos del proceso térmico</p>
          <div id="profile">
            {intervals.map((interval) => (
              <div key={interval.id} className="interval">
                <label>T (C)
                  <input type="number" step="0.1" value={interval.temp} onChange={(e) => updateInterval(interval.id, 'temp', e.target.value)} />
                </label>
                <label>Δt (min)
                  <input type="number" step="0.01" value={interval.dt} onChange={(e) => updateInterval(interval.id, 'dt', e.target.value)} />
                </label>
                <button onClick={() => removeInterval(interval.id)} className="btn ghost" type="button">Quitar</button>
              </div>
            ))}
          </div>
          <div className="row-actions">
            <button onClick={addInterval} className="btn ghost">Agregar intervalo</button>
          </div>

          <p className="small" style={{ marginTop: '1.5rem', color: 'var(--muted)' }}>
            Próximo paso: Ve a <strong>Validación (Gráficos)</strong> para ver los resultados y comparar contra el criterio de diseño.
          </p>
        </section>
      </main>
    </Layout>
  );
}
