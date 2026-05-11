import Layout from '../components/Layout';
import ThermalCharts from '../components/ThermalCharts';
import { getDefaults } from '../lib/products';
import { useState, useEffect } from 'react';
import { computeHeatTransfer } from '../controllers/calcController';

export default function EnergyPage() {
  const defaults = getDefaults('enlatado', 'atun');
  const [intervals, setIntervals] = useState(defaults.intervals);
  const [tref, setTref] = useState(defaults.tref);
  const [z, setZ] = useState(defaults.z);
  const [m, setM] = useState(defaults.m);
  const [cp, setCp] = useState(defaults.cp);
  const [dT, setDT] = useState(defaults.dT);
  const [u, setU] = useState(defaults.u);
  const [dtlm, setDtlm] = useState(defaults.dtlm);
  const [resultQ, setResultQ] = useState('Q = -');
  const [resultA, setResultA] = useState('A = -');

  useEffect(() => {
    setIntervals(defaults.intervals.map((r, i) => ({ ...r, id: r.id || String(i + 1) })));
  }, []);

  const handleCalcHeat = () => {
    const result = computeHeatTransfer(m, cp, dT, u, dtlm);
    if (result.error) {
      setResultQ(`Q = ${result.Q ? result.Q.toFixed(3) : '-'} kW aprox`);
      setResultA(`A = error (${result.error})`);
      return;
    }
    setResultQ(`Q = ${result.Q.toFixed(3)} kW aprox`);
    setResultA(`A = ${result.A.toFixed(3)} m2 aprox`);
  };

  return (
    <Layout>
      <main className="dashboard-grid">
        <section className="surface-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Balance de energía</p>
              <h2>Cálculo de carga térmica y área</h2>
            </div>
            <p className="section-note">Estima la carga térmica requerida y el área de transferencia necesaria.</p>
          </div>

          <div className="grid two">
            <label>Flujo másico m_dot (kg/s)
              <input type="number" step="0.01" value={m} onChange={(e) => setM(parseFloat(e.target.value) || 0)} />
            </label>
            <label>Cp (kJ/kg C)
              <input type="number" step="0.01" value={cp} onChange={(e) => setCp(parseFloat(e.target.value) || 0)} />
            </label>
            <label>Delta T (C)
              <input type="number" step="0.1" value={dT} onChange={(e) => setDT(parseFloat(e.target.value) || 0)} />
            </label>
            <label>U (kW/m2 C)
              <input type="number" step="0.01" value={u} onChange={(e) => setU(parseFloat(e.target.value) || 0)} />
            </label>
            <label>Delta T_lm (C)
              <input type="number" step="0.1" value={dtlm} onChange={(e) => setDtlm(parseFloat(e.target.value) || 0)} />
            </label>
          </div>

          <div className="hero-actions">
            <button onClick={handleCalcHeat} className="btn">Calcular Q y A</button>
          </div>

          <p className="result">{resultQ}</p>
          <p className="result">{resultA}</p>

          <div className="formula-block">
            <div className="formula-eq">
              <span className="formula-var">Q</span>
              <span className="formula-operator">=</span>
              <span>m<sub>dot</sub> · C<sub>p</sub> · ΔT</span>
            </div>
            <div className="formula-eq">
              <span className="formula-var">A</span>
              <span className="formula-operator">=</span>
              <span className="fraction">
                <span className="fraction-top">Q</span>
                <span className="fraction-line"></span>
                <span className="fraction-bottom">U · ΔT<sub>lm</sub></span>
              </span>
            </div>
          </div>
        </section>

        <section className="surface-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Visualización</p>
              <h2>Gráficos de energía</h2>
            </div>
            <p className="section-note">Representación gráfica del balance energético.</p>
          </div>
          <ThermalCharts 
            intervals={intervals} 
            tref={tref} 
            z={z} 
            d={0} 
            n={0} 
            m={m} 
            cp={cp} 
            dT={dT} 
            u={u} 
            dtlm={dtlm} 
            charts={["energy"]} 
          />
        </section>
      </main>
    </Layout>
  );
}
