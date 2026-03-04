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

const metrics = [
  { value: '<10s', label: 'from paste to map' },
  { value: '3 views', label: 'board, tree, raw' },
  { value: 'Local', label: 'storage by default' },
];

const HomePage = () => (
  <div className="mx-auto min-h-screen max-w-[1180px] px-[1.15rem] pb-12 pt-5 text-[#141224]">
    <header className="flex items-center justify-between gap-4 pb-1 pt-2 max-[900px]:flex-col max-[900px]:items-start">
      <div className="flex items-center gap-[0.65rem]">
        <div className="text-[1.35rem] font-bold uppercase tracking-[0.05em]">PlayJSON</div>
        <span className="rounded-full border border-[rgba(45,35,62,0.18)] bg-[rgba(255,255,255,0.64)] px-[0.62rem] py-[0.24rem] text-[0.74rem] uppercase tracking-[0.1em]">
          Visual JSON Builder
        </span>
      </div>
    </header>

    <main className="mt-[1.4rem] grid gap-[1.05rem]">
      <section className="grid grid-cols-1 gap-0">
        <div className="animate-rise rounded-[32px] p-[clamp(1.35rem,3vw,2.65rem)] shadow-[0_24px_50px_rgba(70,28,47,0.2)] [background:radial-gradient(circle_at_14%_14%,rgba(255,255,255,0.52),transparent_44%),radial-gradient(circle_at_78%_82%,rgba(255,237,172,0.26),transparent_42%),linear-gradient(135deg,#ffe0be_0%,#ff8e85_44%,#de4d4f_100%)]">
          <p className="m-0 text-[0.74rem] uppercase tracking-[0.19em] text-[rgba(53,14,30,0.84)]">
            For API and platform teams
          </p>
          <h1 className="m-[0.5rem_0] max-w-[13ch] text-[clamp(2rem,6vw,4.4rem)] leading-[0.95] tracking-[-0.02em] [font-family:'Fraunces',Georgia,serif]">
            Design JSON systems that stay understandable at scale.
          </h1>
          <p className="m-0 max-w-[52ch] text-[1.04rem] leading-[1.48] text-[#412129]">
            PlayJSON turns deeply nested payloads into an editable map so you can structure data
            faster, review changes clearly, and avoid schema drift.
          </p>
          <div
            className="mt-4 grid max-w-[610px] grid-cols-1 gap-[0.55rem] min-[900px]:grid-cols-3"
            aria-label="Key metrics"
          >
            {metrics.map((metric) => (
              <div
                className="rounded-2xl border border-[rgba(86,28,38,0.26)] bg-[rgba(255,255,255,0.25)] px-[0.7rem] py-[0.6rem] backdrop-blur-[2px]"
                key={metric.label}
              >
                <p className="m-0 text-[1.1rem] font-bold text-[#2a1018]">{metric.value}</p>
                <span className="mt-[0.2rem] block text-[0.78rem] uppercase tracking-[0.08em] text-[rgba(43,18,27,0.82)]">
                  {metric.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-[1.1rem] flex flex-wrap gap-[0.65rem]">
            <Link
              to="/workspace"
              className="inline-block cursor-pointer rounded-full border border-transparent bg-[#1a1628] px-[1.07rem] py-[0.66rem] font-semibold text-[#fff7f7] no-underline shadow-[0_8px_20px_rgba(19,16,32,0.2)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-px hover:bg-[#120f20] hover:shadow-[0_12px_26px_rgba(19,16,32,0.26)]"
            >
              Start Building
            </Link>
          </div>
        </div>
      </section>

      <section
        className="grid grid-cols-1 gap-[0.85rem] [content-visibility:auto] [contain-intrinsic-size:320px] min-[900px]:grid-cols-3"
        id="capabilities"
        aria-label="Key capabilities"
      >
        {capabilities.map((item) => (
          <article
            className="animate-rise rounded-3xl border border-[rgba(31,25,46,0.14)] bg-[rgba(255,255,255,0.78)] px-[1.05rem] py-4 shadow-[0_16px_38px_rgba(32,25,30,0.08)]"
            key={item.title}
          >
            <h2 className="m-0 text-[1.1rem] tracking-[0.01em] text-[#1f1a2d]">{item.title}</h2>
            <p className="m-[0.5rem_0_0] leading-[1.43] text-[#5a576b]">{item.detail}</p>
          </article>
        ))}
      </section>

      <section
        className="rounded-[26px] border border-[rgba(55,44,81,0.16)] bg-[rgba(248,247,255,0.74)] p-[1.1rem]"
        aria-label="Workflow"
      >
        <h2 className="m-0 text-[1.2rem]">From raw payload to production-ready model</h2>
        <div className="mt-3 grid grid-cols-1 gap-[0.7rem] [content-visibility:auto] [contain-intrinsic-size:340px] min-[900px]:grid-cols-3">
          {workflow.map((item) => (
            <article
              key={item.step}
              className="animate-rise rounded-[18px] border border-[rgba(54,46,76,0.14)] bg-[rgba(255,255,255,0.86)] p-[0.8rem]"
            >
              <p className="m-0 text-[1.4rem] text-[#5f4273] [font-family:'Fraunces',Georgia,serif]">
                {item.step}
              </p>
              <h3 className="m-[0.14rem_0_0] text-base">{item.title}</h3>
              <p className="m-[0.4rem_0_0] text-[#5a576b]">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  </div>
);

export default HomePage;
