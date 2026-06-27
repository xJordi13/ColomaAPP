import Sidebar from './Sidebar';
import { TEAM_CONTACTS } from '../lib/team';

export default function Layout({ children }) {
  return (
    <div className="app-shell-with-sidebar">
      <Sidebar />
      <div className="main-content">
        {children}
        <footer className="app-footer">
          <div className="footer-authors">
            <div className="footer-authors__header">
              <strong>Contactos</strong>
              <p>Equipo responsable del proyecto y referencias para cambios de estructura o funcionalidades.</p>
            </div>
            <ul className="footer-contact-list">
              {TEAM_CONTACTS.map((contact) => (
                <li key={contact.phone}>
                  <span>{contact.name}</span>
                  <strong>{contact.phone}</strong>
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </div>
    </div>
  );
}
