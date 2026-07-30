import Link from 'next/link';
import { useRouter } from 'next/router';

const navigation = [
  { href: '/simulator', step: '01', label: 'Diseño del tratamiento' },
  { href: '/validation', step: '02', label: 'Evaluación del tratamiento' },
  { href: '/dashboard', step: '03', label: 'Resumen técnico' },
];

export default function Sidebar({ user }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/');
  }

  return (
    <aside className="app-sidebar" aria-label="Navegación principal">
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">T</span>
        <div>
          <strong>TermoSim</strong>
          <small>Validación térmica didáctica</small>
        </div>
      </div>

      <div className="workflow-label">Flujo de trabajo</div>
      <nav className="sidebar-nav">
        {navigation.map((item) => {
          const active = router.pathname === item.href;
          return (
            <Link
              href={item.href}
              key={item.href}
              className={active ? 'active' : ''}
              aria-current={active ? 'page' : undefined}
            >
              <span>{item.step}</span>
              <strong>{item.label}</strong>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <span>{(user?.email || 'U').slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user?.email || 'Usuario'}</strong>
            <small>Sesión protegida</small>
          </div>
        </div>
        <button type="button" className="text-button" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
