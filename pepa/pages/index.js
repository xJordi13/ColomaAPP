import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ThermalCharts from '../components/ThermalCharts';
import ThermalSimulator from '../components/ThermalSimulator';

const PRODUCT_CATALOG = {
  enlatado: [
    {
      id: 'atun',
      name: 'Atun enlatado',
      defaults: {
        tref: 121.1,
        z: 10,
        d: 0.21,
        n: 12,
        m: 1.2,
        cp: 3.6,
        dT: 35,
        u: 0.85,
        dtlm: 18,
        intervals: [
          { id: '1', temp: 100, dt: 8 },
          { id: '2', temp: 112, dt: 16 },
          { id: '3', temp: 121, dt: 24 },
        ],
      },
    },
    {
      id: 'sardina',
      name: 'Sardina enlatada',
      defaults: {
        tref: 121.1,
        z: 9,
        d: 0.25,
        n: 12,
        m: 0.95,
        cp: 3.5,
        dT: 33,
        u: 0.82,
        dtlm: 16,
        intervals: [
          { id: '1', temp: 98, dt: 7 },
          { id: '2', temp: 110, dt: 15 },
          { id: '3', temp: 120, dt: 22 },
        ],
      },
    },
  ],
};

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getDefaults(type, productId) {
  const products = PRODUCT_CATALOG[type] || [];
  const found = products.find((p) => p.id === productId) || products[0];
  return found?.defaults || {
    tref: 0,
    z: 0,
    d: 0,
    n: 0,
    m: 0,
    cp: 0,
    dT: 0,
    u: 0,
    dtlm: 0,
    intervals: [
      { id: '1', temp: 0, dt: 0 },
      { id: '2', temp: 0, dt: 0 },
      { id: '3', temp: 0, dt: 0 },
    ],
  };
}

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('profesorColoma@gmail.com');
  const [password, setPassword] = useState('12345');
  const [authError, setAuthError] = useState('');
  const [user, setUser] = useState(null);
  const [productType, setProductType] = useState('enlatado');
  const [product, setProduct] = useState('atun');

  const initialDefaults = getDefaults('enlatado', 'atun');
  const [intervals, setIntervals] = useState(initialDefaults.intervals);
  const [temp, setTemp] = useState(0);
  const [tref, setTref] = useState(initialDefaults.tref);
  const [z, setZ] = useState(initialDefaults.z);
  const [d, setD] = useState(initialDefaults.d);
  const [n, setN] = useState(initialDefaults.n);
  const [m, setM] = useState(initialDefaults.m);
  const [cp, setCp] = useState(initialDefaults.cp);
  const [dT, setDT] = useState(initialDefaults.dT);
  const [u, setU] = useState(initialDefaults.u);
  const [dtlm, setDtlm] = useState(initialDefaults.dtlm);
  const [resultL, setResultL] = useState('L = -');
  const [resultFReal, setResultFReal] = useState('F_real = -');
  const [resultFDesign, setResultFDesign] = useState('F_diseno = -');
  const [resultQ, setResultQ] = useState('Q = -');
  const [resultA, setResultA] = useState('A = -');
  const [validation, setValidation] = useState({ text: 'Estado: -', class: '' });

  async function login(e) {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (res.ok) {
      const p = await (await fetch('/api/profile')).json();
      setUser(p);
      router.push('/simulator');
    } else {
      setAuthError('Credenciales invalidas. Verifica tu correo y contraseña.');
    }
  }

  async function logout() {
    await fetch('/api/auth/logout');
    setUser(null);
  }

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/profile');
      if (res.ok) setUser(await res.json());
    })();
  }, []);

  useEffect(() => {
    const products = PRODUCT_CATALOG[productType] || [];
    if (!products.some((p) => p.id === product)) {
      setProduct(products[0]?.id || '');
      return;
    }
    const defaults = getDefaults(productType, product);
    setIntervals(defaults.intervals.map((row, idx) => ({ ...row, id: row.id || String(idx + 1) })));
    setTref(defaults.tref);
    setZ(defaults.z);
    setD(defaults.d);
    setN(defaults.n);
    setM(defaults.m);
    setCp(defaults.cp);
    setDT(defaults.dT);
    setU(defaults.u);
    setDtlm(defaults.dtlm);
    setTemp(defaults.intervals[0]?.temp || 0);
    setResultL('L = -');
  }, [productType, product]);

  const getProfileData = () => {
    if (!Number.isFinite(tref) || !Number.isFinite(z) || z <= 0) {
      return { error: 'Z no puede ser 0' };
    }
    if (intervals.length === 0) {
      return { error: 'Agrega al menos un intervalo' };
    }
    let f = 0;
    let validIntervals = 0;
    intervals.forEach((row) => {
      const T = row.temp;
      const dt = row.dt;
      if (!Number.isFinite(T) || !Number.isFinite(dt) || dt <= 0) return;
      const exponent = (T - tref) / z;
      if (!Number.isFinite(exponent) || Math.abs(exponent) > 12) return;
      const L = Math.pow(10, exponent);
      if (!Number.isFinite(L)) return;
      const contribution = L * dt;
      if (!Number.isFinite(contribution) || contribution > 1e6) return;
      validIntervals += 1;
      f += contribution;
    });
    if (validIntervals === 0) {
      return { error: 'Ingresa valores validos (Delta t > 0)' };
    }
    return { value: f };
  };

  const updateResults = () => {
    const out = getProfileData();
    if (out.error) {
      setResultFReal(`F_real = error (${out.error})`);
      setResultFDesign('F_diseno = -');
      setValidation({ text: `Estado: error (${out.error})`, class: 'fail' });
      return;
    }

    setResultFReal(`F_real = ${out.value.toFixed(4)} min eq`);
    const fDesign = d * n;
    setResultFDesign(`F_diseno = ${Number.isFinite(fDesign) ? fDesign.toFixed(4) : '-'} min eq`);

    if (!Number.isFinite(fDesign) || fDesign <= 0) {
      setValidation({ text: 'Estado: define D y reducciones', class: '' });
      return;
    }
    if (out.value >= fDesign) {
      setValidation({ text: 'Estado: Proceso seguro (F_real >= F_diseno)', class: 'ok' });
    } else {
      setValidation({ text: 'Estado: Ajustar variables (F_real < F_diseno)', class: 'fail' });
    }
  };

  useEffect(() => {
    if (!user) return;
    updateResults();
  }, [user, tref, z, intervals, d, n]);

  const handleCalcL = () => {
    if (!Number.isFinite(z) || z <= 0) {
      setResultL('L = error (Z no puede ser 0)');
      return;
    }
    const L = Math.pow(10, (temp - tref) / z);
    const formattedL = L >= 0.00001 ? L.toFixed(5) : L.toExponential(3);
    setResultL(`L = ${formattedL}`);
  };

  const handleCalcHeat = () => {
    const Q = m * cp * dT;
    setResultQ(`Q = ${Q.toFixed(3)} kW aprox`);
    if (u === 0 || dtlm === 0) {
      setResultA('A = error (U y Delta T_lm no pueden ser 0)');
      return;
    }
    const A = Q / (u * dtlm);
    setResultA(`A = ${A.toFixed(3)} m2 aprox`);
  };

  const addInterval = () => {
    setIntervals([...intervals, { id: Date.now().toString(), temp: 0, dt: 0 }]);
  };

  const removeInterval = (id) => {
    setIntervals(intervals.filter((i) => i.id !== id));
  };

  const updateInterval = (id, field, value) => {
    setIntervals(intervals.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const availableProducts = PRODUCT_CATALOG[productType] || [];
  const selectedProduct = availableProducts.find((p) => p.id === product);
  const productDefaults = getDefaults(productType, product);
  const fDesignValue = d * n;
  const topMetrics = [
    { label: 'Intervalos', value: intervals.length, note: 'perfil térmico activo' },
    { label: 'Producto', value: selectedProduct?.name || 'No definido', note: 'catálogo sugerido' },
    { label: 'F de diseño', value: Number.isFinite(fDesignValue) ? `${fDesignValue.toFixed(2)} min eq` : '—', note: 'meta de seguridad' },
  ];

  if (user) {
    return (
      <div className="app app-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <header className="hero hero-split">
          <section className="hero-copy">
            <p className="eyebrow">Ingenieria de procesos termicos</p>
            <h1>Bienvenido, {user.name}</h1>
            <p className="hero-text">
              Trabaja con una vista clara para validar letalidad, comparar F real contra F de diseño y revisar energía y área de equipo sin perder contexto.
            </p>
            <div className="hero-actions">
              <button onClick={logout} className="btn ghost">Cerrar sesión</button>
              <span className="pill">Sesión activa</span>
              <span className="pill">Perfil térmico listo</span>
            </div>
          </section>

          <aside className="hero-panel">
            <p className="panel-eyebrow">Resumen operativo</p>
            <div className="stat-grid">
              {topMetrics.map((metric) => (
                <article key={metric.label} className="stat-card">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <p>{metric.note}</p>
                </article>
              ))}
            </div>
            <div className="hero-note">
              Producto sugerido
              <strong>{selectedProduct?.name || 'Selecciona un producto'}</strong>
            </div>
          </aside>
        </header>

        <main className="dashboard-grid">
          <ThermalSimulator />

          <section className="surface-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Configuración base</p>
                <h2>Producto a procesar</h2>
              </div>
              <p className="section-note">La selección carga parámetros sugeridos que puedes ajustar sin perder la coherencia del cálculo.</p>
            </div>
            <div className="grid two">
              <label>Tipo de producto
                <select value={productType} onChange={(e) => setProductType(e.target.value)}>
                  <option value="enlatado">Enlatado</option>
                </select>
              </label>
              <label>Producto
                <select value={product} onChange={(e) => setProduct(e.target.value)}>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="summary-grid">
              <div className="summary-chip">
                <span>Tref</span>
                <strong>{productDefaults.tref} °C</strong>
              </div>
              <div className="summary-chip">
                <span>Z</span>
                <strong>{productDefaults.z} °C</strong>
              </div>
              <div className="summary-chip">
                <span>Intervalos</span>
                <strong>{productDefaults.intervals.length}</strong>
              </div>
            </div>
            <p className="small">Al elegir producto se cargan parámetros sugeridos. Puedes modificarlos manualmente.</p>
          </section>

          <section className="surface-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Cálculo 01</p>
                <h2>Letalidad instantánea</h2>
              </div>
              <p className="section-note">Calcula la contribución de temperatura del punto seleccionado con una lectura limpia y rápida.</p>
            </div>
            <div className="grid two">
              <label>T (C)
                <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(toNumber(e.target.value))} />
              </label>
              <label>T_ref (C)
                <input type="number" step="0.1" value={tref} onChange={(e) => setTref(toNumber(e.target.value))} />
              </label>
              <label>Z (C)
                <input type="number" step="0.1" value={z} onChange={(e) => setZ(toNumber(e.target.value))} />
              </label>
            </div>
            <div className="hero-actions">
              <button onClick={handleCalcL} className="btn">Calcular L</button>
            </div>
            <p className="result">{resultL}</p>
            <div className="formula-block">
              <div className="formula-eq">
                <span className="formula-var">L<sub>i</sub></span>
                <span className="formula-operator">=</span>
                <span className="formula-power">
                  <span className="formula-base">10</span>
                  <sup className="formula-exp">(T<sub>i</sub> − T<sub>ref</sub>)/Z</sup>
                </span>
              </div>
            </div>
          </section>

          <section className="surface-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Cálculo 02</p>
                <h2>F real y validación</h2>
              </div>
              <p className="section-note">Introduce el perfil térmico por intervalos y compara el resultado con el criterio de diseño.</p>
            </div>
            <p className="small">Ingresa perfil de temperatura por intervalos (T, Delta t en min)</p>
            <div id="profile">
              {intervals.map((interval) => (
                <div key={interval.id} className="interval">
                  <label>T (C)
                    <input
                      type="number"
                      step="0.1"
                      value={interval.temp}
                      onChange={(e) => updateInterval(interval.id, 'temp', toNumber(e.target.value))}
                    />
                  </label>
                  <label>Delta t (min)
                    <input
                      type="number"
                      step="0.01"
                      value={interval.dt}
                      onChange={(e) => updateInterval(interval.id, 'dt', toNumber(e.target.value))}
                    />
                  </label>
                  <button onClick={() => removeInterval(interval.id)} className="btn ghost" type="button">Quitar</button>
                </div>
              ))}
            </div>
            <div className="row-actions">
              <button onClick={addInterval} className="btn ghost">Agregar intervalo</button>
              <button onClick={updateResults} className="btn">Calcular F real</button>
            </div>
            <div className="grid two">
              <label>D (min para 90%)
                <input type="number" step="0.01" value={d} onChange={(e) => setD(toNumber(e.target.value))} />
              </label>
              <label>Reducciones (n)
                <input type="number" step="1" value={n} onChange={(e) => setN(toNumber(e.target.value))} />
              </label>
            </div>
            <div className="hero-actions">
              <button onClick={updateResults} className="btn">Calcular F de diseno</button>
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
            <ThermalCharts
              intervals={intervals}
              tref={tref}
              z={z}
              d={d}
              n={n}
              m={m}
              cp={cp}
              dT={dT}
              u={u}
              dtlm={dtlm}
              charts={["contributions", "comparison", "temperature"]}
            />
          </section>

          <section className="surface-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Cálculo 03</p>
                <h2>Balance de energía y área</h2>
              </div>
              <p className="section-note">Una vista simple para estimar carga térmica y el área requerida del equipo.</p>
            </div>
            <div className="grid two">
              <label>Flujo masico m_dot (kg/s)
                <input type="number" step="0.01" value={m} onChange={(e) => setM(toNumber(e.target.value))} />
              </label>
              <label>Cp (kJ/kg C)
                <input type="number" step="0.01" value={cp} onChange={(e) => setCp(toNumber(e.target.value))} />
              </label>
              <label>Delta T (C)
                <input type="number" step="0.1" value={dT} onChange={(e) => setDT(toNumber(e.target.value))} />
              </label>
              <label>U (kW/m2 C)
                <input type="number" step="0.01" value={u} onChange={(e) => setU(toNumber(e.target.value))} />
              </label>
              <label>Delta T_lm (C)
                <input type="number" step="0.1" value={dtlm} onChange={(e) => setDtlm(toNumber(e.target.value))} />
              </label>
            </div>
            <div className="hero-actions">
              <button onClick={handleCalcHeat} className="btn">Calcular Q y A</button>
            </div>
            <p className="result">{resultQ}</p>
            <p className="result">{resultA}</p>
            <ThermalCharts
              intervals={intervals}
              tref={tref}
              z={z}
              d={d}
              n={n}
              m={m}
              cp={cp}
              dT={dT}
              u={u}
              dtlm={dtlm}
              charts={["energy"]}
            />
            <div className="formula-block formula-stack">
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
        </main>
      </div>
    )
  }

  return (
    <div className="app app-shell auth-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <main className="login-grid">
        <section className="surface-card auth-story">
          <p className="eyebrow">Ingenieria de procesos termicos</p>
          <h1>Una forma más clara y elegante de validar esterilidad térmica.</h1>
          <p className="hero-text">
            Accede a una experiencia más cuidada para calcular letalidad, revisar F real contra F de diseño y estimar carga térmica con una presentación mucho más legible.
          </p>
          <figure className="auth-image">
            <span className="auth-image-label">Procesos térmicos</span>
            <img src="/images/thermal-hero.png" alt="Validación de esterilidad térmica" />
          </figure>
        </section>

        <section className="surface-card login-card">
          <div className="section-head">
            <div>
              <p className="section-kicker">Acceso</p>
              <h2>Iniciar sesión</h2>
            </div>
            <p className="section-note">Usa las credenciales de prueba para entrar al panel.</p>
          </div>
          <form onSubmit={login} className="auth-form">
            <label>Correo electrónico
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </label>
            <label>Contraseña
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            </label>
            <button className="btn primary" type="submit">Entrar al panel</button>
          </form>
          {authError ? <p className="badge fail">{authError}</p> : null}
          <div className="auth-credentials">
            Demo
            <strong>profesorColoma@gmail.com / 12345</strong>
          </div>
        </section>
      </main>
    </div>
  )
}
