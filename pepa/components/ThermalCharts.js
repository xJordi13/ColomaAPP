import { useState, useEffect, useRef } from 'react';

const SVG_WIDTH = 640;
const SVG_HEIGHT = 240;

function formatValue(value) {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function getContribution(row, tref, z) {
  const temp = Number(row.temp);
  const dt = Number(row.dt);

  if (!Number.isFinite(temp) || !Number.isFinite(dt) || dt <= 0 || !Number.isFinite(tref) || !Number.isFinite(z) || z <= 0) {
    return 0;
  }

  const exponent = (temp - tref) / z;
  if (!Number.isFinite(exponent) || Math.abs(exponent) > 12) {
    return 0;
  }

  const lethalRate = Math.pow(10, exponent);
  const contribution = lethalRate * dt;
  return Number.isFinite(contribution) && contribution > 0 ? contribution : 0;
}

function getTemperatureSeries(intervals = []) {
  let timeCursor = 0;

  return intervals.reduce((accumulator, row, index) => {
    const temp = Number(row.temp);
    const dt = Number(row.dt);

    if (!Number.isFinite(temp) || !Number.isFinite(dt) || dt <= 0) {
      return accumulator;
    }

    accumulator.push({ time: timeCursor, temp, label: `I${index + 1}` });
    timeCursor += dt;
    accumulator.push({ time: timeCursor, temp, label: `I${index + 1}` });
    return accumulator;
  }, []);
}

export default function ThermalCharts({ intervals = [], tref = 0, z = 0, d = 0, n = 0, m = 0, cp = 0, dT = 0, u = 0, dtlm = 0, charts = ['contributions', 'comparison', 'temperature', 'energy'] }) {
  const [selectedChart, setSelectedChart] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (selectedChart && modalRef.current) {
      setTimeout(() => {
        modalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    }
  }, [selectedChart]);

  const series = intervals
    .map((interval, index) => {
      const contribution = getContribution(interval, tref, z);
      return {
        label: `I${index + 1}`,
        contribution,
      };
    })
    .filter((item) => item.contribution > 0);

  const fReal = series.reduce((sum, item) => sum + item.contribution, 0);
  const fDesign = Number.isFinite(d) && Number.isFinite(n) ? d * n : 0;
  const maxContribution = Math.max(1, ...series.map((item) => item.contribution), fReal, fDesign);
  const comparisonMax = Math.max(1, fReal, fDesign);
  const isSafe = fDesign > 0 && fReal >= fDesign;
  const fillRatio = fDesign > 0 ? Math.min(100, Math.max(0, (fReal / fDesign) * 100)) : 0;
  const temperatureSeries = getTemperatureSeries(intervals);
  const minTemp = temperatureSeries.length > 0 ? Math.min(...temperatureSeries.map((point) => point.temp)) : 0;
  const maxTemp = temperatureSeries.length > 0 ? Math.max(...temperatureSeries.map((point) => point.temp)) : 0;
  const totalTime = temperatureSeries.length > 0 ? Math.max(...temperatureSeries.map((point) => point.time)) : 0;
  const tempRange = Math.max(1, maxTemp - minTemp);
  const qValue = Number.isFinite(m) && Number.isFinite(cp) && Number.isFinite(dT) ? m * cp * dT : 0;
  const aValue = Number.isFinite(qValue) && Number.isFinite(u) && Number.isFinite(dtlm) && u !== 0 && dtlm !== 0 ? qValue / (u * dtlm) : 0;
  const energyMax = Math.max(1, qValue, aValue);

  const columnWidth = series.length > 0 ? 440 / series.length : 0;

  const renderContributionChart = (sizeClass = '', gradientKey = 'contrib') => {
    const barGradientId = `chartBarGradient-${gradientKey}`;
    const lineGradientId = `chartLineGradient-${gradientKey}`;

    return (
    <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className={`chart-svg ${sizeClass}`.trim()} role="img" aria-label="Contribución por intervalo">
      <defs>
        <linearGradient id={barGradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1f9d8b" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#0f766e" stopOpacity="0.88" />
        </linearGradient>
        <linearGradient id={lineGradientId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#18a79c" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} rx="22" fill="#fffaf4" />

      {[56, 108, 160].map((lineY) => (
        <line key={lineY} x1="52" y1={lineY} x2="592" y2={lineY} className="chart-grid-line" />
      ))}

      <line x1="52" y1="184" x2="592" y2="184" className="chart-axis" />

      {series.length > 0 ? (
        series.map((item, index) => {
          const barHeight = Math.max(14, (item.contribution / maxContribution) * 112);
          const x = 66 + index * columnWidth;
          const barY = 184 - barHeight;
          return (
            <g key={item.label}>
              <rect x={x} y={barY} width={Math.max(30, columnWidth - 26)} height={barHeight} rx="14" fill={`url(#${barGradientId})`} />
              <text x={x + Math.max(15, (columnWidth - 26) / 2)} y="208" textAnchor="middle" className="chart-label">{item.label}</text>
              <text x={x + Math.max(15, (columnWidth - 26) / 2)} y={Math.max(46, barY - 10)} textAnchor="middle" className="chart-value">{formatValue(item.contribution)}</text>
            </g>
          );
        })
      ) : (
        <text x="320" y="122" textAnchor="middle" className="chart-empty">Ingresa intervalos con Delta t mayor que 0</text>
      )}

      <text x="22" y="60" className="chart-axis-label">min eq</text>
    </svg>
    );
  };

  const renderComparisonChart = (sizeClass = '', gradientKey = 'comparison') => {
    const lineGradientId = `chartLineGradient-${gradientKey}`;

    return (
    <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className={`chart-svg ${sizeClass}`.trim()} role="img" aria-label="Comparación entre F real y F diseño">
      <defs>
        <linearGradient id={lineGradientId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#18a79c" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} rx="22" fill="#fffaf4" />
      <text x="52" y="56" className="chart-axis-label">Escala comparativa</text>

      <line x1="52" y1="96" x2="592" y2="96" className="chart-grid-line" />
      <line x1="52" y1="162" x2="592" y2="162" className="chart-grid-line" />

      <text x="52" y="106" className="chart-row-label">F real</text>
      <rect x="132" y="80" width="440" height="30" rx="15" fill="rgba(15,118,110,0.1)" />
      <rect x="132" y="80" width={`${Math.max(0, Math.min(440, (fReal / comparisonMax) * 440))}`} height="30" rx="15" fill={`url(#${lineGradientId})`} />
      <text x="586" y="102" textAnchor="end" className="chart-value">{formatValue(fReal)} min eq</text>

      <text x="52" y="172" className="chart-row-label">F diseño</text>
      <rect x="132" y="146" width="440" height="30" rx="15" fill="rgba(15,118,110,0.08)" />
      <rect x="132" y="146" width={`${Math.max(0, Math.min(440, (fDesign / comparisonMax) * 440))}`} height="30" rx="15" fill={isSafe ? 'rgba(31,122,77,0.88)' : 'rgba(161,98,7,0.9)'} />
      <text x="586" y="168" textAnchor="end" className="chart-value">{formatValue(fDesign)} min eq</text>
    </svg>
    );
  };

  const renderTemperatureChart = (sizeClass = '', gradientKey = 'temperature') => {
    const lineGradientId = `chartLineGradient-${gradientKey}`;

    return (
    <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className={`chart-svg ${sizeClass}`.trim()} role="img" aria-label="Curva de temperatura contra tiempo">
      <defs>
        <linearGradient id={lineGradientId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#18a79c" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} rx="22" fill="#fffaf4" />
      <text x="52" y="56" className="chart-axis-label">Perfil térmico</text>

      {[56, 108, 160].map((lineY) => (
        <line key={lineY} x1="52" y1={lineY} x2="592" y2={lineY} className="chart-grid-line" />
      ))}

      <line x1="52" y1="184" x2="592" y2="184" className="chart-axis" />
      <line x1="52" y1="52" x2="52" y2="184" className="chart-axis" />

      {temperatureSeries.length > 1 ? (
        <>
          {temperatureSeries.map((point, index) => {
            const x = 52 + (point.time / Math.max(1, totalTime)) * 540;
            const y = 184 - ((point.temp - minTemp) / tempRange) * 112;
            const nextPoint = temperatureSeries[index + 1];
            return (
              <g key={`${point.label}-${index}`}>
                {nextPoint ? (
                  <line
                    x1={x}
                    y1={y}
                    x2={52 + (nextPoint.time / Math.max(1, totalTime)) * 540}
                    y2={184 - ((nextPoint.temp - minTemp) / tempRange) * 112}
                    className="chart-temperature-line"
                      stroke={`url(#${lineGradientId})`}
                  />
                ) : null}
                <circle cx={x} cy={y} r="4.5" className="chart-temperature-point" />
              </g>
            );
          })}

          <text x="586" y="102" textAnchor="end" className="chart-value">{formatValue(maxTemp)}°C</text>
          <text x="586" y="168" textAnchor="end" className="chart-value">{formatValue(minTemp)}°C</text>
          <text x="22" y="60" className="chart-axis-label">°C</text>
          <text x="560" y="210" textAnchor="end" className="chart-axis-label">tiempo acumulado</text>
        </>
      ) : (
        <text x="320" y="122" textAnchor="middle" className="chart-empty">Agrega intervalos para ver la curva térmica</text>
      )}
    </svg>
    );
  };

  const renderEnergyChart = (sizeClass = '', gradientKey = 'energy') => {
    const energyGradientId = `chartEnergyGradient-${gradientKey}`;

    return (
      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className={`chart-svg ${sizeClass}`.trim()} role="img" aria-label="Balance de energía y área">
        <defs>
          <linearGradient id={energyGradientId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#18a79c" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} rx="22" fill="#fffaf4" />
        <text x="52" y="56" className="chart-axis-label">Balance térmico</text>

        <line x1="52" y1="96" x2="592" y2="96" className="chart-grid-line" />
        <line x1="52" y1="162" x2="592" y2="162" className="chart-grid-line" />

        <text x="52" y="106" className="chart-row-label">Q</text>
        <rect x="132" y="80" width="440" height="30" rx="15" fill="rgba(15,118,110,0.08)" />
        <rect x="132" y="80" width={`${Math.max(0, Math.min(440, (qValue / energyMax) * 440))}`} height="30" rx="15" fill={`url(#${energyGradientId})`} />
        <text x="586" y="102" textAnchor="end" className="chart-value">{qValue > 0 ? `${formatValue(qValue)} kW aprox` : '—'}</text>

        <text x="52" y="172" className="chart-row-label">A</text>
        <rect x="132" y="146" width="440" height="30" rx="15" fill="rgba(15,118,110,0.08)" />
        <rect x="132" y="146" width={`${Math.max(0, Math.min(440, (aValue / energyMax) * 440))}`} height="30" rx="15" fill="rgba(31,122,77,0.88)" />
        <text x="586" y="168" textAnchor="end" className="chart-value">{aValue > 0 ? `${formatValue(aValue)} m2 aprox` : '—'}</text>
      </svg>
    );
  };

  const chartDetails = {
    contributions: {
      title: 'Contribución por intervalo',
      description: 'Muestra la contribución de cada intervalo sobre el F real.',
      chart: renderContributionChart('chart-svg--large', 'contrib-large'),
      summary: [
        { label: 'F real', value: fReal > 0 ? `${formatValue(fReal)} min eq` : '—' },
        { label: 'Intervalos válidos', value: series.length },
        { label: 'Pico individual', value: series.length > 0 ? `${formatValue(Math.max(...series.map((item) => item.contribution)))} min eq` : '—' },
      ],
    },
    comparison: {
      title: 'F real vs F diseño',
      description: 'Compara el valor obtenido frente al criterio de seguridad.',
      chart: renderComparisonChart('chart-svg--large', 'comparison-large'),
      summary: [
        { label: 'Relación', value: fDesign > 0 ? `${fillRatio.toFixed(0)}%` : '—' },
        { label: 'Estado', value: fDesign > 0 ? (isSafe ? 'Seguro' : 'Ajustar') : 'Pendiente' },
        { label: 'F diseño', value: fDesign > 0 ? `${formatValue(fDesign)} min eq` : '—' },
      ],
    },
    temperature: {
      title: 'Temperatura vs tiempo',
      description: 'Curva escalonada del perfil térmico acumulado.',
      chart: renderTemperatureChart('chart-svg--large', 'temperature-large'),
      summary: [
        { label: 'Tiempo total', value: totalTime > 0 ? `${formatValue(totalTime)} min` : '—' },
        { label: 'Temperatura máx.', value: temperatureSeries.length > 0 ? `${formatValue(maxTemp)} °C` : '—' },
        { label: 'Temperatura mín.', value: temperatureSeries.length > 0 ? `${formatValue(minTemp)} °C` : '—' },
      ],
    },
    energy: {
      title: 'Balance de energía y área',
      description: 'Relaciona la carga térmica estimada con el área requerida del equipo.',
      chart: renderEnergyChart('chart-svg--large', 'energy-large'),
      summary: [
        { label: 'Q', value: qValue > 0 ? `${formatValue(qValue)} kW aprox` : '—' },
        { label: 'A', value: aValue > 0 ? `${formatValue(aValue)} m2 aprox` : '—' },
        { label: 'Datos activos', value: qValue > 0 || aValue > 0 ? 'Sí' : 'Pendiente' },
      ],
    },
  };

  return (
    <section className="chart-card">
      <div className="section-head chart-head">
        <div>
          <p className="section-kicker">Visualización</p>
          <h2>Respuesta térmica</h2>
        </div>
        <p className="section-note">Gráficos compactos y responsivos generados desde tus intervalos, sin desbordar el layout.</p>
      </div>

      <div className="chart-panels">
        {Object.entries(chartDetails)
          .filter(([chartKey]) => charts.includes(chartKey))
          .map(([chartKey, chart]) => (
          <article key={chartKey} className="chart-panel chart-panel--interactive">
            <div className="chart-panel__header">
              <p className="chart-panel__title">{chart.title}</p>
              <p className="chart-panel__desc">{chart.description}</p>
            </div>

            <div className="chart-figure chart-figure--interactive">
              {chartKey === 'contributions' ? renderContributionChart('' , 'contrib-inline') : null}
              {chartKey === 'comparison' ? renderComparisonChart('', 'comparison-inline') : null}
              {chartKey === 'temperature' ? renderTemperatureChart('', 'temperature-inline') : null}

              <button type="button" className="chart-zoom-button" onClick={() => setSelectedChart(chartKey)} aria-label={`Abrir ${chart.title} en grande`}>
                Ver grande
              </button>
            </div>

            <div className="chart-summary">
              {chart.summary.map((item) => (
                <div key={item.label} className="summary-chip">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {selectedChart ? (
        <div className="chart-modal" ref={modalRef} role="presentation" onClick={() => setSelectedChart(null)}>
          <section className="chart-modal__card" role="dialog" aria-modal="true" aria-labelledby="chart-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="chart-modal__head">
              <div>
                <p className="section-kicker">Vista ampliada</p>
                <h2 id="chart-modal-title">{chartDetails[selectedChart].title}</h2>
                <p className="section-note">{chartDetails[selectedChart].description}</p>
              </div>
              <button type="button" className="chart-modal__close" onClick={() => setSelectedChart(null)} aria-label="Cerrar vista ampliada">
                Cerrar
              </button>
            </div>

            <div className="chart-modal__figure">
              {selectedChart === 'contributions' ? renderContributionChart('chart-svg--large', 'contrib-modal') : null}
              {selectedChart === 'comparison' ? renderComparisonChart('chart-svg--large', 'comparison-modal') : null}
              {selectedChart === 'temperature' ? renderTemperatureChart('chart-svg--large', 'temperature-modal') : null}
              {selectedChart === 'energy' ? renderEnergyChart('chart-svg--large', 'energy-modal') : null}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}