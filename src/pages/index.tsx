import { Link } from '@tanstack/react-router';

const capabilities = [
  {
    title: 'Model Whole Payloads',
    detail: 'Create nested structures as linked blocks and keep relationships readable.',
  },
  {
    title: 'Pinpoint Any Field Fast',
    detail: 'Search keys, values, and titles in one place, then jump directly to the node.',
  },
  {
    title: 'Ship With Confidence',
    detail: 'Format, validate, and export clean JSON snapshots without leaving the board.',
  },
];

const workflow = [
  { step: '01', title: 'Drop in raw JSON', detail: 'Paste any payload and auto-expand nested objects.' },
  { step: '02', title: 'Link reusable blocks', detail: 'Connect references visually instead of duplicating data.' },
  { step: '03', title: 'Export final model', detail: 'Download the resolved structure when it is ready to ship.' },
];

const HomePage = () => (
  <div className="home-page">
    <header className="topbar">
      <div className="brand-wrap">
        <div className="brand">PlayJSON</div>
        <span className="brand-chip">Visual JSON Builder</span>
      </div>
      <Link to="/workspace" className="nav-link-button ghost">
        Launch App
      </Link>
    </header>

    <main className="home-main">
      <section className="hero-grid">
        <div className="hero">
          <p className="eyebrow">For API and platform teams</p>
          <h1>Design JSON systems that stay understandable at scale.</h1>
          <p className="lead">
            PlayJSON turns deeply nested payloads into an editable map so you can structure data
            faster, review changes clearly, and avoid schema drift.
          </p>
          <div className="hero-actions">
            <Link to="/workspace" className="nav-link-button">
              Start Building
            </Link>
            <a href="#capabilities" className="nav-link-button ghost">
              Explore Features
            </a>
          </div>
        </div>

        <aside className="hero-panel" aria-label="Product summary">
          <p className="panel-kicker">What you get</p>
          <ul>
            <li>Board, tree, and raw editing in one workspace</li>
            <li>Reference linking with keyboard-first flow</li>
            <li>Local-first storage and exportable JSON state</li>
          </ul>
        </aside>
      </section>

      <section className="capabilities" id="capabilities" aria-label="Key capabilities">
        {capabilities.map((item) => (
          <article className="feature-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="workflow" aria-label="Workflow">
        <h2>From raw payload to production-ready model</h2>
        <div className="workflow-grid">
          {workflow.map((item) => (
            <article key={item.step} className="workflow-step">
              <p className="step-number">{item.step}</p>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta" aria-label="Call to action">
        <p>Stop wrestling with unreadable payloads.</p>
        <Link to="/workspace" className="nav-link-button">
          Open PlayJSON Workspace
        </Link>
      </section>
    </main>
  </div>
);

export default HomePage;
