function format(value, digits = 3) {
  if (!Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 0.001) return value.toExponential(2);
  return value.toLocaleString('es-EC', { maximumFractionDigits: digits });
}

export default function ProcessCharts({ rows, fReal, fDesign }) {
  const validRows = Array.isArray(rows) ? rows : [];
  if (validRows.length < 2) {
    return <div className="empty-state">Corrige la tabla para visualizar el tratamiento.</div>;
  }

  const contributions = validRows.filter((row) => !row.isClosingPoint);
  const maxContribution = Math.max(1e-12, ...contributions.map((row) => row.contribution));
  const barWidth = Math.max(5, Math.min(34, 470 / Math.max(1, contributions.length) - 5));
  const maxCompare = Math.max(1e-12, fReal, fDesign);

  return (
    <section className="visual-grid">
      <article className="chart-surface">
        <div className="chart-heading">
          <div>
            <span className="eyebrow">Aporte por medición</span>
            <h2>Contribución de F por intervalo</h2>
          </div>
        </div>
        <svg viewBox="0 0 640 250" className="chart-svg" role="img" aria-label="Contribución F por intervalo">
          <rect width="640" height="250" rx="20" fill="#fbfcfa" />
          {[72, 114, 156, 198].map((lineY) => <line key={lineY} x1="56" y1={lineY} x2="576" y2={lineY} className="chart-grid-line" />)}
          <line x1="56" y1="198" x2="576" y2="198" className="chart-axis" />
          {contributions.map((row, index) => {
            const center = 70 + (index / Math.max(1, contributions.length - 1)) * 490;
            const height = Math.max(2, (row.contribution / maxContribution) * 126);
            return (
              <g key={row.id}>
                <rect x={center - barWidth / 2} y={198 - height} width={barWidth} height={height} rx="4" className="contribution-bar">
                  <title>{row.time}–{row.time + row.deltaTime} min · ΔF {format(row.contribution, 6)}</title>
                </rect>
                <text x={center} y="218" textAnchor="middle" className="chart-tick">{index + 1}</text>
              </g>
            );
          })}
          <text x="18" y="62" className="chart-axis-label">ΔF</text>
          <text x="478" y="230" className="chart-axis-label">Número de intervalo</text>
        </svg>
      </article>

      <article className="comparison-card">
        <div className="chart-heading">
          <div>
            <span className="eyebrow">Criterio del diseño</span>
            <h2>F real frente a F de diseño</h2>
          </div>
        </div>
        <div className="comparison-row">
          <span>F real</span>
          <div><i style={{ width: `${Math.min(100, (fReal / maxCompare) * 100)}%` }} /></div>
          <strong>{format(fReal, 5)} min eq</strong>
        </div>
        <div className="comparison-row comparison-row--design">
          <span>F diseño</span>
          <div><i style={{ width: `${Math.min(100, (fDesign / maxCompare) * 100)}%` }} /></div>
          <strong>{format(fDesign, 5)} min</strong>
        </div>
      </article>
    </section>
  );
}
