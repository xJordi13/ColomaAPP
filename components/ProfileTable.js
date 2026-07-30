import { useProcess } from '../contexts/ProcessContext';

function format(value, digits = 5) {
  if (!Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 0.0001) return value.toExponential(3);
  return value.toLocaleString('es-EC', { maximumFractionDigits: digits });
}

export default function ProfileTable() {
  const {
    profile,
    profileResult,
    updateProfilePoint,
    addProfilePoint,
    removeProfilePoint,
  } = useProcess();

  const rowsById = new Map(profileResult.rows.map((row) => [row.id, row]));

  return (
    <section className="surface-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Perfil medido</p>
          <h2>Tabla tiempo–temperatura</h2>
        </div>
        <p>
          Introduce cada medición. La aplicación obtiene Δt, la letalidad, la contribución de F y su acumulado.
        </p>
      </div>

      <div className="table-note">
        <strong>Criterio de integración:</strong> cada temperatura representa el intervalo hasta la siguiente
        medición. La última fila cierra el perfil y no añade un intervalo nuevo.
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Tiempo<br /><small>min</small></th>
              <th>Temperatura<br /><small>°C</small></th>
              <th>Δt<br /><small>min</small></th>
              <th>Letalidad Lᵢ</th>
              <th>Contribución ΔFᵢ<br /><small>min eq</small></th>
              <th>F acumulado<br /><small>min eq</small></th>
              <th><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {profile.map((point, index) => {
              const calculated = rowsById.get(point.id);
              return (
                <tr key={point.id}>
                  <td><span className="row-index">{index + 1}</span></td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={point.time}
                      onChange={(event) => updateProfilePoint(point.id, 'time', event.target.value)}
                      aria-label={`Tiempo de la medición ${index + 1}`}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      value={point.temperature}
                      onChange={(event) => updateProfilePoint(point.id, 'temperature', event.target.value)}
                      aria-label={`Temperatura de la medición ${index + 1}`}
                    />
                  </td>
                  <td>{calculated?.isClosingPoint ? <span className="muted">Cierre</span> : format(calculated?.deltaTime, 3)}</td>
                  <td className="number-cell">{format(calculated?.lethality, 6)}</td>
                  <td className="number-cell">{calculated?.isClosingPoint ? '—' : format(calculated?.contribution, 6)}</td>
                  <td className="number-cell number-cell--strong">{format(calculated?.cumulativeF, 6)}</td>
                  <td>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => removeProfilePoint(point.id)}
                      disabled={profile.length <= 2}
                      aria-label={`Eliminar medición ${index + 1}`}
                      title="Eliminar fila"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-actions">
        <button type="button" className="btn btn--secondary" onClick={addProfilePoint}>
          + Agregar medición
        </button>
        <span>{profile.length} mediciones · guardado automático</span>
      </div>

      {profileResult.errors?.length ? (
        <div className="validation-message validation-message--error" role="alert">
          <strong>No es posible evaluar el perfil</strong>
          <ul>{profileResult.errors.map((error) => <li key={error}>{error}</li>)}</ul>
        </div>
      ) : null}
    </section>
  );
}
