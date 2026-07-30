import Sidebar from './Sidebar';
import { TEAM_CONTACTS } from '../lib/team';
import { useProcess } from '../contexts/ProcessContext';

const saveLabels = {
  loading: 'Cargando proceso…',
  saving: 'Guardando cambios…',
  saved: 'Cambios guardados',
  error: 'No se pudo guardar',
};

export default function Layout({ children, user }) {
  const { saveStatus } = useProcess();

  return (
    <div className="app-shell">
      <Sidebar user={user} />
      <div className="main-content">
        <div className={`save-indicator ${saveStatus === 'error' ? 'error' : ''}`} role="status">
          <span aria-hidden="true" />
          {saveLabels[saveStatus]}
        </div>

        {children}

        <footer className="app-footer">
          <div>
            <strong>Uso académico y de diseño preliminar</strong>
            <p>
              Los resultados ayudan a comprender el tratamiento térmico. La liberación de un proceso
              industrial requiere datos microbiológicos validados, instrumentación calibrada y revisión
              por personal competente.
            </p>
          </div>
          <div className="footer-links">
            <a href="https://www.iso.org/standard/65464.html" target="_blank" rel="noreferrer">
              ISO 22000:2018
            </a>
            <a
              href="https://www.fao.org/fao-who-codexalimentarius/codex-texts/codes-of-practice/en/"
              target="_blank"
              rel="noreferrer"
            >
              Codex Alimentarius
            </a>
          </div>
          <details>
            <summary>Equipo responsable</summary>
            <ul>
              {TEAM_CONTACTS.map((contact) => (
                <li key={contact.phone}>{contact.name} · {contact.phone}</li>
              ))}
            </ul>
          </details>
        </footer>
      </div>
    </div>
  );
}
