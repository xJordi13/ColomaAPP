import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import ThermalCharts from '../components/ThermalCharts'
import ThermalSimulator from '../components/ThermalSimulator'
import Layout from '../components/Layout'
import { 
  computeL, 
  computeProfileF, 
  computeHeatTransfer, 
  validateProcess,
  formatResult 
} from '../controllers/calcController'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [intervals, setIntervals] = useState([
    { id: '1', temp: 0, dt: 0 },
    { id: '2', temp: 0, dt: 0 },
    { id: '3', temp: 0, dt: 0 },
  ])
  const [tref, setTref] = useState(0)
  const [z, setZ] = useState(0)
  const [temp, setTemp] = useState(0)
  const [d, setD] = useState(0)
  const [n, setN] = useState(0)
  const [m, setM] = useState(0)
  const [cp, setCp] = useState(0)
  const [dT, setDT] = useState(0)
  const [u, setU] = useState(0)
  const [dtlm, setDtlm] = useState(0)
  const [resultL, setResultL] = useState('L = -')
  const [resultFReal, setResultFReal] = useState('F_real = -')
  const [resultFDesign, setResultFDesign] = useState('F_diseno = -')
  const [resultQ, setResultQ] = useState('Q = -')
  const [resultA, setResultA] = useState('A = -')
  const [validation, setValidation] = useState({ text: 'Estado: -', class: '' })

  if (status === 'loading') return <p>Cargando...</p>
  if (status === 'unauthenticated') {
    router.push('/')
    return null
  }

  const allNumericInputsAreZero = () => {
    return tref === 0 && z === 0 && temp === 0 && d === 0 && n === 0 && m === 0 && cp === 0 && dT === 0 && u === 0 && dtlm === 0 && intervals.every(i => i.temp === 0 && i.dt === 0)
  }

  const updateResults = () => {
    const result = computeProfileF(intervals, tref, z)
    if (result.error) {
      if (allNumericInputsAreZero()) {
        setResultFReal('F_real = -')
        setResultFDesign('F_diseno = -')
        setValidation({ text: 'Estado: -', class: '' })
        return
      }
      setResultFReal(`F_real = error (${result.error})`)
      setResultFDesign('F_diseno = -')
      setValidation({ text: `Estado: error (${result.error})`, class: 'fail' })
      return
    }
    
    const fRealValue = result.value
    setResultFReal(`F_real = ${fRealValue.toFixed(4)} min eq`)
    
    const fDesign = d * n
    setResultFDesign(`F_diseno = ${Number.isFinite(fDesign) ? fDesign.toFixed(4) : '-'} min eq`)

    const validation = validateProcess(fRealValue, d, n)
    setValidation({ text: `Estado: ${validation.message}`, class: validation.class })
  }

  useEffect(() => {
    updateResults()
  }, [tref, z, intervals, d, n])

  const handleCalcL = () => {
    const result = computeL(temp, tref, z)
    if (result.error) {
      setResultL(`L = error (${result.error})`)
      return
    }
    const formattedL = formatResult(result.value, 5)
    setResultL(`L = ${formattedL}`)
  }

  const handleCalcHeat = () => {
    const result = computeHeatTransfer(m, cp, dT, u, dtlm)
    if (result.error) {
      setResultQ(`Q = ${result.Q ? result.Q.toFixed(3) : '-'} kW aprox`)
      setResultA(`A = error (${result.error})`)
      return
    }
    setResultQ(`Q = ${result.Q.toFixed(3)} kW aprox`)
    setResultA(`A = ${result.A.toFixed(3)} m2 aprox`)
  }

  const addInterval = () => {
    setIntervals([...intervals, { id: Date.now().toString(), temp: 0, dt: 0 }])
    updateResults()
  }

  const removeInterval = (id) => {
    setIntervals(intervals.filter(i => i.id !== id))
    updateResults()
  }

  const updateInterval = (id, field, value) => {
    setIntervals(intervals.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const topMetrics = [
    { label: 'Intervalos', value: intervals.length, note: 'perfil térmico activo' },
    { label: 'F real', value: resultFReal.replace('F_real = ', '') || '-', note: 'resultado actual' },
    { label: 'F diseño', value: resultFDesign.replace('F_diseno = ', '') || '-', note: 'meta de seguridad' },
  ]

  return (
    <Layout>
      <div className="app app-shell">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />

        <header className="hero hero-split">
          <section className="hero-copy">
            <p className="eyebrow">Ingenieria de procesos termicos</p>
            <h1>Bienvenido, {session?.user?.name}</h1>
            <p className="hero-text">
              Este panel reúne los cálculos principales en una vista más clara, tranquila y profesional para trabajar sin ruido visual.
            </p>
            <div className="hero-actions">
              <button onClick={() => signOut({ redirect: '/' })} className="btn ghost">Cerrar sesión</button>
              <span className="pill">Acceso seguro</span>
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
          </aside>
        </header>

        <main className="dashboard-grid">
          <ThermalSimulator />

          <section className="surface-card">
            <div className="section-head">
              <div>
                <p className="section-kicker">Cálculo 01</p>
                <h2>Letalidad instantánea</h2>
              </div>
              <p className="section-note">Ajusta T, Tref y Z para obtener una lectura rápida y fácil de comparar.</p>
            </div>
            <div className="grid two">
              <label>T (C)
                <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(parseFloat(e.target.value) || 0)} />
              </label>
              <label>T_ref (C)
                <input type="number" step="0.1" value={tref} onChange={(e) => setTref(parseFloat(e.target.value) || 0)} />
              </label>
              <label>Z (C)
                <input type="number" step="0.1" value={z} onChange={(e) => setZ(parseFloat(e.target.value) || 0)} />
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
              <p className="section-note">Captura el perfil térmico por intervalos y compara el proceso con el criterio de diseño.</p>
            </div>
            <p className="small">Ingresa perfil de temperatura por intervalos (T, Delta t en min)</p>
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
              <button onClick={updateResults} className="btn">Calcular F real</button>
            </div>
            <div className="grid two">
              <label>D (min para 90%)
                <input type="number" step="0.01" value={d} onChange={(e) => setD(parseFloat(e.target.value) || 0)} />
              </label>
              <label>Reducciones (n)
                <input type="number" step="1" value={n} onChange={(e) => setN(parseFloat(e.target.value) || 0)} />
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
              <p className="section-note">Una lectura más limpia para estimar carga térmica y área requerida sin saturar la pantalla.</p>
            </div>
            <div className="grid two">
              <label>Flujo masico m_dot (kg/s)
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
        </main>
      </div>
    </Layout>
  )
}
