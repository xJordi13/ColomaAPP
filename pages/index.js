import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { readSession } from '../lib/auth';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('profesorColoma@gmail.com');
  const [password, setPassword] = useState('12345');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function login(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || 'No fue posible iniciar sesión.');
        return;
      }
      await router.replace('/simulator');
    } catch {
      setError('No se pudo conectar con el servidor. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>TermoSim · Calculadora de esterilidad térmica</title>
        <meta
          name="description"
          content="Herramienta didáctica para diseñar y evaluar tratamientos térmicos."
        />
      </Head>
      <main className="login-page">
        <section className="login-intro">
          <div className="login-brand"><span>T</span> TermoSim</div>
          <div>
            <p className="eyebrow">Ingeniería de procesos térmicos</p>
            <h1>Calculadora de esterilidad térmica.</h1>
            <p>
              Calcula reducciones decimales, define el criterio del punto más frío y sigue
              la letalidad de cada medición con una trazabilidad clara.
            </p>
          </div>
          <div className="login-features">
            <span><strong>01</strong> Diseño coherente</span>
            <span><strong>02</strong> Cálculo por medición</span>
            <span><strong>03</strong> Evaluación documentada</span>
          </div>
          <p className="login-disclaimer">
            Herramienta académica. No sustituye la validación de un proceso industrial por
            personal competente.
          </p>
        </section>

        <section className="login-card">
          <div>
            <p className="eyebrow">Acceso protegido</p>
            <h2>Iniciar sesión</h2>
            <p>Tus parámetros y mediciones quedarán guardados en tu proceso.</p>
          </div>
          <form onSubmit={login} className="login-form">
            <label>
              <span>Correo electrónico</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              <span>Contraseña</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button type="submit" className="btn btn--large" disabled={submitting}>
              {submitting ? 'Verificando…' : 'Entrar al proceso'}
            </button>
          </form>
          {error ? <div className="login-error" role="alert">{error}</div> : null}
          <div className="demo-access">
            <span>Acceso de demostración</span>
            <strong>profesorColoma@gmail.com</strong>
            <small>Contraseña: 12345</small>
          </div>
        </section>
      </main>
    </>
  );
}

export function getServerSideProps(context) {
  const session = readSession(context.req);
  if (session) {
    return {
      redirect: {
        destination: '/simulator',
        permanent: false,
      },
    };
  }
  return { props: {} };
}
