'use client';

export function ExecutiveHero({ eyebrow, title, subtitle, actions, children }) {
  return (
    <section className="executive-hero">
      <div className="executive-hero__content">
        {eyebrow && <div className="executive-eyebrow">{eyebrow}</div>}
        <h1 className="executive-title">{title}</h1>
        {subtitle && <p className="executive-subtitle">{subtitle}</p>}
        {children}
      </div>
      {actions ? <div className="executive-actions">{actions}</div> : null}
    </section>
  );
}

export function ExecutiveSection({ title, subtitle, action, children }) {
  return (
    <section className="executive-section">
      {(title || action) && (
        <div className="executive-section__header">
          <div>
            {title && <h2 className="section-title">{title}</h2>}
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}

export function MetricGrid({ items = [] }) {
  return (
    <div className="kpi-grid">
      {items.map((item) => (
        <div key={item.label} className="kpi-card glass">
          {item.icon ? <div className="kpi-icon" style={{ background: item.iconBg || 'var(--surface-2)' }}>{item.icon}</div> : null}
          <div className="kpi-value">{item.value}</div>
          <div className="kpi-label">{item.label}</div>
          {item.meta ? <div className={`kpi-change ${item.metaTone || ''}`}>{item.meta}</div> : null}
        </div>
      ))}
    </div>
  );
}
