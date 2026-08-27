"use client";

import { useState } from "react";

export default function ApiPricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const checkIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  const dashIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d1d1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );

  return (
    <div className="pricing-page">
      <style>{`
        .pricing-page {
          padding: 48px 36px;
          background: #101415;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Hanken Grotesk', sans-serif;
          color: #ffffff;
        }

        .pr-header {
          text-align: center;
          max-width: 650px;
          margin-bottom: 36px;
        }

        .pr-title {
          font-size: 40px;
          font-weight: 700;
          letter-spacing: -.02em;
          color: #ffffff;
          margin-bottom: 12px;
        }

        .pr-sub {
          font-size: 15px;
          color: rgba(255,255,255,0.65);
          line-height: 1.6;
        }

        /* ── Toggle ── */
        .pr-toggle-wrap {
          background: rgba(32,37,34,0.9);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 4px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 40px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .pr-tgl-btn {
          padding: 8px 24px;
          border-radius: 12px;
          border: none;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pr-tgl-btn.active {
          background: #f45b0b;
          color: #fff;
          box-shadow: 0 7px 18px rgba(244,91,11,0.22);
        }
        .pr-save-badge {
          font-size: 10px;
          font-weight: 800;
          color: #ff6415;
          background: rgba(255,100,21,0.15);
          padding: 2px 8px;
          border-radius: 6px;
          margin-left: 8px;
        }

        /* ── Grid ── */
        .pr-grid {
          display: grid;
          grid-template-columns: repeat(3, 320px);
          gap: 24px;
          align-items: stretch;
          width: 100%;
          justify-content: center;
        }

        .pr-card {
           background: rgba(32,37,34,0.85);
           border-radius: 24px;
           padding: 36px 28px;
           display: flex;
           flex-direction: column;
           border: 1px solid rgba(255,255,255,0.1);
           position: relative;
           transition: all 0.3s ease;
           backdrop-filter: blur(24px);
           color: #ffffff;
           box-shadow: 0 12px 35px rgba(0,0,0,0.35);
        }

        .pr-card.popular {
          background: rgba(32,37,34,0.98);
          border: 2px solid #ff6415;
          transform: translateY(-8px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.6), 0 0 25px rgba(255,100,21,0.15);
        }

        .pr-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #f45b0b;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 8px;
          letter-spacing: 0.05em;
          white-space: nowrap;
          box-shadow: 0 7px 18px rgba(244,91,11,0.22);
        }

        .pr-card-h {
          margin-bottom: 8px;
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
        }

        .pr-card-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          margin-bottom: 24px;
        }

        .pr-price-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 4px;
        }

        .pr-curr { font-size: 20px; font-weight: 600; vertical-align: super; color: #ff6415; }
        .pr-amount { font-size: 44px; font-weight: 800; letter-spacing: -1px; color: #ffffff; }
        .pr-period { font-size: 14px; color: rgba(255,255,255,0.6); }

        .pr-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 28px 0;
        }
        .pr-card.popular .pr-divider {
          background: rgba(255,255,255,0.12);
        }

        .pr-features {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 36px;
        }

        .pr-feat {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.85);
        }
        .pr-feat.disabled {
          opacity: 0.35;
        }

        .pr-btn {
          width: 100%;
          padding: 12px;
          border-radius: 16px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
          color: #ffffff;
        }
        .pr-btn:hover {
          background: rgba(255,255,255,0.14);
          border-color: #ff6415;
        }
        .pr-card.popular .pr-btn {
          background: #f45b0b;
          color: #ffffff;
          border: none;
          box-shadow: 0 7px 18px rgba(244,91,11,0.22);
        }
        .pr-card.popular .pr-btn:hover {
          background: #ff6817;
        }
`}</style>

      <header className="pr-header">
        <h1 className="pr-title">Tactical API, Priced for Your Mission</h1>
        <p className="pr-sub">
          Integrate Trinetra&apos;s UAV intelligence directly into your systems. Real-time telemetry, mission logs, and FLIR data — all via REST API.
        </p>
      </header>

      <div className="pr-toggle-wrap">
        <button
          className={`pr-tgl-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </button>
        <button
          className={`pr-tgl-btn ${billingCycle === 'annual' ? 'active' : ''}`}
          onClick={() => setBillingCycle('annual')}
        >
          Annual <span className="pr-save-badge">SAVE 20%</span>
        </button>
      </div>

      <div className="pr-grid">
        {/* Free Plan */}
        <div className="pr-card">
          <h3 className="pr-card-h">Free</h3>
          <p className="pr-card-sub">For hobbyists & early exploration</p>
          <div className="pr-price-row">
            <span className="pr-curr">₹</span>
            <span className="pr-amount">0</span>
          </div>
          <div className="pr-divider" />
          <div className="pr-features">
            <div className="pr-feat">{checkIcon} 100 API calls / month</div>
            <div className="pr-feat">{checkIcon} UAV telemetry endpoints</div>
            <div className="pr-feat">{checkIcon} Basic mission logs</div>
            <div className="pr-feat">{checkIcon} Community support</div>
            <div className="pr-feat disabled">{dashIcon} Thermal FLIR access</div>
            <div className="pr-feat disabled">{dashIcon} Multispectral analysis</div>
            <div className="pr-feat disabled">{dashIcon} Custom webhooks</div>
            <div className="pr-feat disabled">{dashIcon} SLA guarantee</div>
          </div>
          <button className="pr-btn">Get Started Free</button>
        </div>

        {/* Pro Plan */}
        <div className="pr-card popular">
          <div className="pr-badge">MOST POPULAR</div>
          <h3 className="pr-card-h">Pro</h3>
          <p className="pr-card-sub">For tactical teams & active missions</p>
          <div className="pr-price-row">
            <span className="pr-curr">₹</span>
            <span className="pr-amount">49.99</span>
            <span className="pr-period">/mo</span>
          </div>
          <p className="pr-card-sub" style={{ marginBottom: 0, marginTop: 4 }}>per month</p>
          <div className="pr-divider" />
          <div className="pr-features">
            <div className="pr-feat">{checkIcon} 50,000 API calls / month</div>
            <div className="pr-feat">{checkIcon} UAV telemetry endpoints</div>
            <div className="pr-feat">{checkIcon} Full mission logs & history</div>
            <div className="pr-feat">{checkIcon} Priority support (24h SLA)</div>
            <div className="pr-feat">{checkIcon} Thermal FLIR access</div>
            <div className="pr-feat">{checkIcon} Multispectral analysis</div>
            <div className="pr-feat disabled" style={{ opacity: 0.1 }}>{dashIcon} Custom webhooks</div>
            <div className="pr-feat disabled" style={{ opacity: 0.1 }}>{dashIcon} Dedicated infra SLA</div>
          </div>
          <button className="pr-btn">Activate Pro →</button>
        </div>

        {/* Custom Plan */}
        <div className="pr-card">
          <h3 className="pr-card-h">Custom</h3>
          <p className="pr-card-sub">For defence orgs & enterprise ops</p>
          <div className="pr-price-row">
            <span className="pr-amount">Custom</span>
          </div>
          <div className="pr-divider" />
          <div className="pr-features">
            <div className="pr-feat">{checkIcon} Unlimited API calls</div>
            <div className="pr-feat">{checkIcon} UAV telemetry endpoints</div>
            <div className="pr-feat">{checkIcon} Full mission logs & history</div>
            <div className="pr-feat">{checkIcon} Dedicated account manager</div>
            <div className="pr-feat">{checkIcon} Thermal FLIR access</div>
            <div className="pr-feat">{checkIcon} Multispectral analysis</div>
            <div className="pr-feat">{checkIcon} Custom webhooks & integrations</div>
            <div className="pr-feat">{checkIcon} 99.99% uptime SLA</div>
          </div>
          <button className="pr-btn">Contact Sales →</button>
        </div>
      </div>
    </div>
  );
}
