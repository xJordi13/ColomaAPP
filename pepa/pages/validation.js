import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ThermalCharts from '../components/ThermalCharts';
import { getDefaults } from '../lib/products';
import { computeProfileF, validateProcess } from '../controllers/calcController';

export default function ValidationPage() {
  const defaults = getDefaults('enlatado', 'atun');
  const [intervals, setIntervals] = useState(defaults.intervals);
  const [tref, setTref] = useState(defaults.tref);
  const [z, setZ] = useState(defaults.z);
  const [d, setD] = useState(defaults.d);
  const [n, setN] = useState(defaults.n);
  const [resultFReal, setResultFReal] = useState('F_real = -');
  const [resultFDesign, setResultFDesign] = useState('F_diseno = -');
  const [validation, setValidation] = useState({ text: 'Estado: -', class: '' });

  useEffect(() => {
    setIntervals(defaults.intervals.map((r, i) => ({ ...r, id: r.id || String(i + 1) })));
  }, []);

  const updateResults = () => {
    const result = computeProfileF(intervals, tref, z);
    if (result.error) {
      setResultFReal(`F_real = error (${result.error})`);
      setResultFDesign('F_diseno = -');
      setValidation({ text: `Estado: error (${result.error})`, class: 'fail' });
      return;
    }

    const fRealValue = result.value;
    setResultFReal(`F_real = ${fRealValue.toFixed(4)} min eq`);

    const fDesign = d * n;
    setResultFDesign(`F_diseno = ${Number.isFinite(fDesign) ? fDesign.toFixed(4) : '-'} min eq`);

    const val = validateProcess(fRealValue, d, n);
    setValidation({ text: `Estado: ${val.message}`, class: val.class });
  };

  useEffect(() => {
    updateResults();
  }, [tref, z, intervals, d, n]);

  const updateInterval = (id, field, value) => {
    setIntervals(intervals.map(i => i.id === id ? { ...i, [field]: Number(value) } : i));
  };
  const addInterval = () => {
    setIntervals([...intervals, { id: Date.now().toString(), temp: 0, dt: 0 }]);
  };
  const removeInterval = (id) => {
    setIntervals(intervals.filter(i => i.id !== id));
  };

  return (
    <Layout>
      <main className="dashboard-grid">
        <section className="surface-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Validación</p>
              <h2>F real y validación</h2>
            </div>
            <p className="section-note">Captura el perfil térmico y compara con el criterio de diseño.</p>
          </div>

          <div className="grid two">
            <label>T_ref (C)
              <input type="number" step="0.1" value={tref} onChange={(e) => setTref(parseFloat(e.target.value) || 0)} />
            </label>
            <label>Z (C)
              <input type="number" step="0.1" value={z} onChange={(e) => setZ(parseFloat(e.target.value) || 0)} />
            </label>
            <label>D (min para 90%)
              <input type="number" step="0.01" value={d} onChange={(e) => setD(parseFloat(e.target.value) || 0)} />
            </label>
            <label>Reducciones (n)
              <input type="number" step="1" value={n} onChange={(e) => setN(parseFloat(e.target.value) || 0)} />
            </label>
          </div>

          <p className="small">Perfil de temperatura por intervalos (T, Delta t en min)</p>
          <div id="profile">
            {intervals.map(interval => (
              <div key={interval.id} className="interval">
                <label>T (C)
                  <input type="number" step="0.1" value={interval.temp} onChange={(e) => updateInterval(interval.id, 'temp', parseFloat(e.target.value) || 0)} />
                </label>
                <label>Delta t (min)
                  <input type="number" step="0.01" value={interval.dt} onChange={(e) => updateInterval(interval.id, 'dt', parseFloat(e.target.value) || 0)} />
                </label>
                <button onClick={() => removeInterval(interval.id)} className="btn ghost" type="button">Quitar</button>
              </div>
            ))}
          </div>
          <div className="row-actions">
            <button onClick={addInterval} className="btn ghost">Agregar intervalo</button>
          </div>

          <div className="formula-block">
            <div className="formula-eq">
              <span className="formula-var">F<sub>real</sub></span>
              <span className="formula-operator">=</span>
              <span>∑<sub>i</sub> L<sub>i</sub> · Δt<sub>i</sub></span>
            </div>
            <div className="formula-eq">
              <span className="formula-var">F<sub>diseno</sub></span>
              <span className="formula-operator">=</span>
              <span>D · n</span>
            </div>
          </div>

          <p className="result">{resultFReal}</p>
          <p className="result">{resultFDesign}</p>
          <p className={`badge ${validation.class}`}>{validation.text}</p>
        </section>

        <section className="surface-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Visualización</p>
              <h2>Gráficos de validación</h2>
            </div>
            <p className="section-note">Visualiza y amplía los gráficos por sección.</p>
          </div>
          <ThermalCharts intervals={intervals} tref={tref} z={z} d={d} n={n} charts={["contributions", "comparison", "temperature"]} />
        </section>
      </main>
    </Layout>
  );
}
