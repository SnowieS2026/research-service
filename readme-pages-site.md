<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bryan's Research — How It Works</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0d1117;
      color: #e6edf3;
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .container {
      max-width: 640px;
      width: 100%;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .badge {
      display: inline-block;
      background: #1f6feb22;
      color: #58a6ff;
      border: 1px solid #1f6feb44;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #8b949e;
      font-size: 1rem;
    }

    .steps {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .step {
      display: flex;
      gap: 1.25rem;
      align-items: flex-start;
    }

    .step-number {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      background: #1f6feb;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .step-content h2 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .step-content p {
      color: #8b949e;
      font-size: 0.9rem;
    }

    .tiers {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }

    .tiers-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #8b949e;
      margin-bottom: 1rem;
    }

    .tier {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #30363d;
    }

    .tier:last-child {
      border-bottom: none;
    }

    .tier-name {
      font-weight: 600;
    }

    .tier-desc {
      color: #8b949e;
      font-size: 0.85rem;
    }

    .tier-price {
      font-weight: 700;
      font-size: 1rem;
      color: #58a6ff;
    }

    .payment {
      text-align: center;
      color: #8b949e;
      font-size: 0.85rem;
      margin-bottom: 2rem;
    }

    .payment strong {
      color: #e6edf3;
    }

    .cta {
      text-align: center;
    }

    .cta a {
      display: inline-block;
      background: #238636;
      color: #fff;
      padding: 12px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1rem;
      transition: background 0.2s;
    }

    .cta a:hover {
      background: #2ea043;
    }

    .cta p {
      margin-top: 0.75rem;
      color: #8b949e;
      font-size: 0.8rem;
    }

    .footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 1.5rem;
      border-top: 1px solid #30363d;
      color: #8b949e;
      font-size: 0.8rem;
    }

    @media (max-width: 480px) {
      h1 { font-size: 1.5rem; }
      .tier { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
      .tier-price { font-size: 0.9rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">Research Service</div>
      <h1>Bryan's Research</h1>
      <p class="subtitle">Human-led market &amp; competitor intelligence — delivered in 24 hours</p>
    </header>

    <div class="steps">
      <div class="step">
        <div class="step-number">1</div>
        <div class="step-content">
          <h2>Pick a tier</h2>
          <p>Three options from £35 to £195. Choose based on depth and scope — or describe your need and I'll recommend the right fit.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-number">2</div>
        <div class="step-content">
          <h2>Fill the brief</h2>
          <p>Complete the intake form with your topic, goal, and deadline. I review every submission personally.</p>
        </div>
      </div>
      <div class="step">
        <div class="step-number">3</div>
        <div class="step-content">
          <h2>Receive your report</h2>
          <p>Structured findings delivered to your email within 24 hours. No filler — just synthesised intelligence from public sources.</p>
        </div>
      </div>
    </div>

    <div class="tiers">
      <div class="tiers-title">Pricing Tiers</div>
      <div class="tier">
        <div>
          <div class="tier-name">⚡ Kickstart — £35</div>
          <div class="tier-desc">Single question, 500-word synthesis, 24h</div>
        </div>
        <div class="tier-price">£35</div>
      </div>
      <div class="tier">
        <div>
          <div class="tier-name">📊 Standard — £95</div>
          <div class="tier-desc">Full brief, 5+ sources, structured report, 24-48h</div>
        </div>
        <div class="tier-price">£95</div>
      </div>
      <div class="tier">
        <div>
          <div class="tier-name">🎯 Deep Dive — £195</div>
          <div class="tier-desc">Industry vertical, 15+ sources, actionable recommendations, up to 1 week</div>
        </div>
        <div class="tier-price">£195</div>
      </div>
    </div>

    <div class="payment">
      Payment via <strong>Wise</strong> or <strong>PayPal</strong> — details sent with the proposal.<br>
      No payment taken until you've approved the scope.
    </div>

    <div class="cta">
      <a href="https://docs.google.com/forms/d/e/1FAIpQLSeg5j36Q-x2TrHVWpfz5iIrMAB2J-GUKDUT-QB--ECKAb4VDg/viewform?usp=publish-editor" target="_blank">Start Your Research Request →</a>
      <p>Or <a href="https://www.linkedin.com/in/bryan-small-49689722b/" target="_blank" style="color: #58a6ff; text-decoration: underline;">DM me directly on LinkedIn</a></p>
    </div>

    <div class="footer">
      What I research: markets, competitors, customer sentiment, industry trends, regulatory landscapes.<br>
      What I don't: access private databases, contact individuals, or make predictions without sourcing.
    </div>
  </div>
</body>
</html>

