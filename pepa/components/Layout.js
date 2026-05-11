import Link from 'next/link';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="app-shell-with-sidebar">
      <Sidebar />
      <div className="main-content">
        {children}
        <footer className="app-footer">
          <div className="footer-authors">
            <strong>Contactos</strong>
            <ul>
              <li>Ing. Jordi Palma: 0996802794</li>
              <li>Ing. Andres Castro: 0978629359</li>
              <li>Ing. Cristopher Perez: 0981623631</li>
              <li>Ing. Jeremy Perez: 0986739453</li>
            </ul>
          </div>
        </footer>
      </div>
    </div>
  );
}
