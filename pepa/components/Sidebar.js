import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

function useShortcuts() {
  const router = useRouter();
  useEffect(() => {
    function onKey(e) {
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        router.push('/simulator');
      }
      if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        router.push('/validation');
      }
      if (e.key === 'e' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        router.push('/energy');
      }
      if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        router.push('/profile');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);
}

export default function Sidebar() {
  useShortcuts();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <h3>TermoSim</h3>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li><Link href="/simulator">Simulador</Link></li>
          <li><Link href="/profile">Perfil/Intervalos</Link></li>
          <li><Link href="/validation">Validación (Gráficos)</Link></li>
          <li><Link href="/energy">Balance energía</Link></li>
          <li><Link href="/dashboard">Resumen</Link></li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <small>Atajos: Ctrl/Cmd+S Sim, Ctrl/Cmd+V Val, Ctrl/Cmd+E Energ, Ctrl/Cmd+P Perfil</small>
      </div>
    </aside>
  );
}
