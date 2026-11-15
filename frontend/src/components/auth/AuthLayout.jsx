import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Check,
  ClipboardList,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import "./auth.css";

const highlights = [
  { icon: Boxes, title: "Kelola Stok", detail: "Tertata rapi" },
  { icon: ShoppingBag, title: "Penjualan", detail: "Lebih efisien" },
  { icon: BarChart3, title: "Laporan", detail: "Mudah dipantau" },
];

function AuthLayout({ children, title, description }) {
  return (
    <main className="auth-page">
      <div className="auth-ambient auth-ambient-one" aria-hidden="true" />
      <div className="auth-ambient auth-ambient-two" aria-hidden="true" />

      <div className="auth-shell">
        <section
          className="auth-brand-panel"
          aria-label="Tentang Sistem Stok Penjualan"
        >
          <div className="auth-brand-grid" aria-hidden="true" />
          <div className="auth-orb auth-orb-one" aria-hidden="true" />
          <div className="auth-orb auth-orb-two" aria-hidden="true" />

          <div className="auth-brand-content">
            <div className="auth-brand-header">
              <div className="auth-logo-mark">
                <Boxes size={25} strokeWidth={1.9} />
              </div>
              <div className="auth-logo-copy">
                <strong>Sistem Stok Penjualan</strong>
                <span>Management System</span>
              </div>
            </div>

            <div className="auth-brand-intro">
              <span className="auth-hero-eyebrow">
                <Sparkles size={13} /> SOLUSI BISNIS MODERN
              </span>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>

            <div
              className="auth-illustration"
              aria-label="Ilustrasi ringkasan sistem stok dan penjualan"
            >
              <div className="auth-preview-card">
                <div className="auth-preview-topline">
                  <div className="auth-preview-avatar">
                    <Activity size={18} />
                  </div>
                  <div className="auth-preview-heading">
                    <span>Ringkasan Operasional</span>
                    <small>Preview tampilan dashboard</small>
                  </div>
                  <span className="auth-preview-trend">
                    <TrendingUp size={15} />
                  </span>
                </div>
                <div className="auth-chart-caption">
                  <span>Aktivitas bisnis</span>
                  <span>
                    <ArrowUpRight size={13} /> Terpantau
                  </span>
                </div>
                <div className="auth-chart-area" aria-hidden="true">
                  <div className="auth-chart-lines" />
                  <svg
                    viewBox="0 0 430 108"
                    preserveAspectRatio="none"
                    role="presentation"
                    focusable="false"
                  >
                    <defs>
                      <linearGradient
                        id="auth-chart-fill"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity=".25"
                        />
                        <stop
                          offset="100%"
                          stopColor="#3b82f6"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 89 C32 82 40 62 70 71 S116 90 146 57 S188 67 216 42 S267 65 297 32 S349 48 382 18 S417 24 430 9 L430 108 L0 108 Z"
                      fill="url(#auth-chart-fill)"
                    />
                    <path
                      d="M0 89 C32 82 40 62 70 71 S116 90 146 57 S188 67 216 42 S267 65 297 32 S349 48 382 18 S417 24 430 9"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="auth-preview-pills">
                  <span>
                    <span className="auth-pill-dot" /> Stok
                  </span>
                  <span>
                    <span className="auth-pill-dot" /> Transaksi
                  </span>
                  <span>
                    <span className="auth-pill-dot" /> Laporan
                  </span>
                </div>
              </div>

              <div className="auth-float auth-float-stock" aria-hidden="true">
                <span className="auth-float-icon">
                  <PackageCheck size={19} />
                </span>
                <span>
                  <strong>Stok produk</strong>
                  <small>
                    <Check size={12} /> Terkelola
                  </small>
                </span>
              </div>
              <div className="auth-float auth-float-sales" aria-hidden="true">
                <span className="auth-float-icon">
                  <ClipboardList size={19} />
                </span>
                <span>
                  <strong>Data penjualan</strong>
                  <small>
                    <Check size={12} /> Tercatat
                  </small>
                </span>
              </div>
            </div>

            <div className="auth-features">
              {highlights.map(({ icon: Icon, title: featureTitle, detail }) => (
                <div className="auth-feature" key={featureTitle}>
                  <span className="auth-feature-icon">
                    <Icon size={19} strokeWidth={1.9} />
                  </span>
                  <strong>{featureTitle}</strong>
                  <small>{detail}</small>
                </div>
              ))}
            </div>

            <div className="auth-brand-bottom">
              <ShieldCheck size={15} /> Akses sesuai peran pengguna
            </div>
          </div>
        </section>

        <section className="auth-form-panel" aria-label="Form autentikasi">
          <div className="auth-mobile-brand">
            <span className="auth-mobile-logo">
              <Boxes size={22} />
            </span>
            <span>
              <strong>Sistem Stok Penjualan</strong>
              <small>Management System</small>
            </span>
          </div>
          <div className="auth-form-content">{children}</div>
          <p className="auth-form-footer">
            <ShieldCheck size={14} /> Dibuat untuk operasional yang lebih
            terorganisir
          </p>
        </section>
      </div>
    </main>
  );
}

export default AuthLayout;
