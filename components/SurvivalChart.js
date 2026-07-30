function linePath(points, field, xScale, yScale) {
  return points.map((point, index) => `${index ? 'L' : 'M'} ${xScale(point.time)} ${yScale(point[field])}`).join(' ');
}

export default function SurvivalChart({ result }) {
  if (!result.valid) {
    return <div className="empty-state">Completa parámetros válidos para generar la comparación.</div>;
  }

  const steps = 36;
  const maxTime = Math.max(result.fAtColdPoint, result.fAtProcess, 1);
  const startLog = Math.log10(result.initialCount);
  const floorLog = Math.log10(result.finalCount);
  const points = Array.from({ length: steps + 1 }, (_, index) => {
    const time = (maxTime * index) / steps;
    return {
      time,
      hot: Math.max(floorLog, startLog - time / result.dAtProcess),
      cold: Math.max(floorLog, startLog - time / result.dAtColdPoint),
    };
  });
  const xScale = (time) => 64 + (time / maxTime) * 510;
  const yRange = Math.max(1, startLog - floorLog);
  const yScale = (value) => 210 - ((value - floorLog) / yRange) * 140;

  return (
    <div className="chart-surface">
      <div className="chart-heading">
        <div>
          <span className="eyebrow">Modelo log-lineal</span>
          <h2>Disminución teórica de microorganismos</h2>
        </div>
        <div className="legend" aria-label="Leyenda">
          <span><i className="legend-hot" />Zona a T</span>
          <span><i className="legend-cold" />Punto más frío</span>
        </div>
      </div>
      <p className="chart-explanation">
        La zona a T presenta una reducción más rápida; el punto más frío necesita más tiempo para
        alcanzar el mismo número final.
      </p>

      <svg viewBox="0 0 640 260" className="chart-svg" role="img" aria-label="Comparación teórica de supervivencia microbiana">
        <rect width="640" height="260" rx="20" fill="#fbfcfa" />
        {[70, 116, 162, 208].map((y) => <line key={y} x1="64" y1={y} x2="574" y2={y} className="chart-grid-line" />)}
        <line x1="64" y1="210" x2="574" y2="210" className="chart-axis" />
        <line x1="64" y1="56" x2="64" y2="210" className="chart-axis" />
        <path d={linePath(points, 'hot', xScale, yScale)} className="survival-line survival-line--hot" />
        <path d={linePath(points, 'cold', xScale, yScale)} className="survival-line survival-line--cold" />
        <text x="22" y="65" className="chart-axis-label">log₁₀(N)</text>
        <text x="520" y="238" className="chart-axis-label">Tiempo (min)</text>
        <text x="70" y="48" className="chart-value">{startLog.toFixed(1)}</text>
        <text x="70" y="204" className="chart-value">{floorLog.toFixed(1)}</text>
        <text x="560" y={Math.max(72, yScale(points[points.length - 1].hot) - 8)} textAnchor="end" className="chart-label-hot">Zona a T</text>
        <text x="560" y={Math.max(92, yScale(points[points.length - 1].cold) - 8)} textAnchor="end" className="chart-label-cold">Punto frío</text>
      </svg>
      <p className="chart-caption">
        Valores calculados con log₁₀(N)=log₁₀(N₀)−t/D. Es una comparación teórica, no datos experimentales.
      </p>
    </div>
  );
}
