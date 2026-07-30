export default function PageHeader({ step, eyebrow, title, description, children }) {
  return (
    <header className="page-header">
      <div className="page-header__step">{step}</div>
      <div className="page-header__copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children ? <div className="page-header__aside">{children}</div> : null}
    </header>
  );
}
