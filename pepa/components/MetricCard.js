export default function MetricCard({ label, value, unit, note, tone = 'default' }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span>{label}</span>
      <strong>
        {value}
        {unit ? <small>{unit}</small> : null}
      </strong>
      {note ? <p>{note}</p> : null}
    </article>
  );
}
