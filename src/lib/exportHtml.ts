/**
 * HTML Report Export Utility
 * Generates self-contained HTML files with embedded CSS for offline viewing.
 * Mirrors the app's dark theme with clean typography.
 */

// ─── Base Styles ────────────────────────────────────────────
const BASE_CSS = `
  :root {
    --bg: #0c0d12;
    --bg-card: #13141b;
    --bg-muted: #1a1b24;
    --border: #2a2b36;
    --fg: #eaeaf0;
    --fg-muted: #8b8d9e;
    --primary: #3b82f6;
    --primary-soft: rgba(59,130,246,0.12);
    --emerald: #10b981;
    --emerald-soft: rgba(16,185,129,0.12);
    --amber: #f59e0b;
    --amber-soft: rgba(245,158,11,0.12);
    --red: #ef4444;
    --red-soft: rgba(239,68,68,0.12);
    --violet: #8b5cf6;
    --violet-soft: rgba(139,92,246,0.12);
    --sky: #0ea5e9;
    --sky-soft: rgba(14,165,233,0.12);
    --radius: 10px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg);
    color: var(--fg);
    line-height: 1.6;
    padding: 40px 24px;
    max-width: 960px;
    margin: 0 auto;
  }
  h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; letter-spacing: -0.5px; }
  h2 { font-size: 20px; font-weight: 600; margin: 32px 0 16px; color: var(--fg); border-bottom: 1px solid var(--border); padding-bottom: 8px; }
  h3 { font-size: 15px; font-weight: 600; margin: 20px 0 10px; color: var(--fg); }
  p { margin-bottom: 10px; color: var(--fg-muted); font-size: 14px; }
  .subtitle { color: var(--fg-muted); font-size: 13px; margin-bottom: 24px; }
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 600; padding: 3px 10px;
    border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .badge-primary { background: var(--primary-soft); color: var(--primary); }
  .badge-emerald { background: var(--emerald-soft); color: var(--emerald); }
  .badge-amber { background: var(--amber-soft); color: var(--amber); }
  .badge-red { background: var(--red-soft); color: var(--red); }
  .badge-violet { background: var(--violet-soft); color: var(--violet); }
  .badge-sky { background: var(--sky-soft); color: var(--sky); }
  .card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 20px; margin-bottom: 16px;
  }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .card-title { font-size: 14px; font-weight: 600; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .stat-card {
    background: var(--bg-muted); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 16px; text-align: center;
  }
  .stat-value { font-size: 28px; font-weight: 700; letter-spacing: -1px; }
  .stat-label { font-size: 11px; color: var(--fg-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  .list { list-style: none; padding: 0; }
  .list li {
    position: relative; padding: 8px 0 8px 18px;
    font-size: 13px; color: var(--fg-muted); border-bottom: 1px solid var(--border);
  }
  .list li:last-child { border-bottom: none; }
  .list li::before { content: '→'; position: absolute; left: 0; color: var(--primary); font-weight: 600; }
  .list-check li::before { content: '✓'; color: var(--emerald); }
  .list-warn li::before { content: '⚠'; color: var(--amber); }
  .list-risk li::before { content: '✕'; color: var(--red); }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
  th { color: var(--fg-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  td { color: var(--fg); }
  .score-bar { height: 8px; border-radius: 4px; background: var(--bg-muted); overflow: hidden; margin-top: 6px; }
  .score-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .divider { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
  .footer { text-align: center; color: var(--fg-muted); font-size: 11px; margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--border); }
  .ref-section { margin-top: 48px; padding-top: 24px; border-top: 2px solid var(--border); }
  .ref-section h2 { border-bottom: none; margin-top: 0; }
  .ref-item { padding: 8px 0; font-size: 12px; color: var(--fg-muted); border-bottom: 1px solid var(--border); }
  .ref-item:last-child { border-bottom: none; }
  .ref-item strong { color: var(--fg); font-weight: 600; }
  .methodology { background: var(--bg-muted); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin: 16px 0; font-size: 12px; }
  .methodology p { font-size: 12px; }
  @media (max-width: 600px) {
    body { padding: 20px 16px; }
    .two-col, .three-col { grid-template-columns: 1fr; }
    .stat-grid { grid-template-columns: 1fr 1fr; }
  }
`;

// ─── Helpers ────────────────────────────────────────────────
function esc(text: unknown): string {
  const s = String(text ?? '');
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeArr(val: unknown): unknown[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
  return [];
}

function listHtml(items: unknown[], className = ''): string {
  if (!items.length) return '<p style="color:var(--fg-muted);font-size:13px;">No data available</p>';
  return `<ul class="list ${className}">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--emerald)';
  if (score >= 60) return 'var(--amber)';
  return 'var(--red)';
}

function scoreBar(score: number, label?: string): string {
  return `
    <div>
      ${label ? `<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;"><span style="color:var(--fg-muted)">${esc(label)}</span><span style="font-weight:600;color:${scoreColor(score)}">${score}/100</span></div>` : ''}
      <div class="score-bar"><div class="score-fill" style="width:${score}%;background:${scoreColor(score)}"></div></div>
    </div>`;
}

const REPORT_REFERENCES_HTML = `
<div class="ref-section">
  <h2>📋 Methodology & Research Sources</h2>
  <div class="methodology">
    <h3 style="margin-top:0;font-size:14px;">Analysis Methodology</h3>
    <p>This report was generated using AI-powered analysis leveraging structured evaluation frameworks. 
    Scores are calculated on a 0–100 scale using weighted multi-factor assessment across relevant dimensions. 
    All insights should be validated against actual market data and domain expertise before implementation.</p>
  </div>
  <h3>Research References</h3>
  <div class="card" style="font-size:12px;">
    <div class="ref-item"><strong>[1]</strong> Aaker, D. <em>"Building Strong Brands,"</em> Free Press, 2012. Brand equity measurement and competitive positioning frameworks.</div>
    <div class="ref-item"><strong>[2]</strong> Wheeler, A. <em>"Designing Brand Identity,"</em> 6th Ed., Wiley, 2024. Visual identity systems and brand consistency evaluation.</div>
    <div class="ref-item"><strong>[3]</strong> Sharp, B. <em>"How Brands Grow,"</em> Oxford University Press, 2010. Market penetration, mental availability, and distinctive brand assets.</div>
    <div class="ref-item"><strong>[4]</strong> Hofstede Insights. <em>"Cultural Dimensions Framework,"</em> 2024. Cross-cultural analysis dimensions for regional market guidance.</div>
    <div class="ref-item"><strong>[5]</strong> W3C. <em>"Web Content Accessibility Guidelines (WCAG) 2.2,"</em> 2023. Accessibility compliance standards and evaluation criteria.</div>
    <div class="ref-item"><strong>[6]</strong> Google. <em>"Web Vitals,"</em> 2024. Core web performance metrics (LCP, FID, CLS) for digital presence evaluation.</div>
    <div class="ref-item"><strong>[7]</strong> Meyer, E. <em>"The Culture Map,"</em> PublicAffairs, 2016. Cross-cultural business communication and regional adaptation.</div>
    <div class="ref-item"><strong>[8]</strong> Nielsen Norman Group. <em>"UX Research & Usability Guidelines,"</em> 2024. User experience evaluation heuristics.</div>
  </div>
  <h3>Disclaimer</h3>
  <p style="font-size:11px;color:var(--fg-muted);">
    This analysis is generated by AI and is intended as strategic guidance only. Scores and recommendations should be validated 
    against actual market research and domain expertise before implementation. Cultural insights are generalized for broad contexts 
    and may not reflect specific sub-regional or local variations.
  </p>
</div>`;

function wrapDocument(title: string, subtitle: string, bodyHtml: string): string {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <p class="subtitle">${esc(subtitle)} · Exported ${now}</p>
  ${bodyHtml}
  ${REPORT_REFERENCES_HTML}
  <div class="footer">Generated by BrandHub · ${now}</div>
</body>
</html>`;
}

function downloadHtml(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Competitive Analysis Report ────────────────────────────
export function exportCompetitiveAnalysisHtml(
  report: any,
  options: { entityName: string; entityType: string }
) {
  const r = report;
  const exec = r.executiveSummary || {};
  const sw = r.strengthsWeaknesses || {};
  const pos = r.brandPositioning || {};
  const vis = r.visualIdentityAudit || {};
  const dig = r.digitalPresence || {};
  const mkt = r.marketingCollateral || {};
  const perc = r.marketPerception || {};
  const recs = r.recommendations || {};
  const swot = r.swotAnalysis || {};
  const profiles = safeArr(r.competitorProfiles);
  const content = r.contentMessaging || {};
  const trends = r.marketTrends || {};

  let body = '';

  // Score
  body += `<div class="stat-grid">
    <div class="stat-card"><div class="stat-value" style="color:${scoreColor(r.score || 0)}">${r.score || 0}</div><div class="stat-label">Overall Score</div></div>
    <div class="stat-card"><div class="stat-value">${safeArr(r.competitors).length}</div><div class="stat-label">Competitors</div></div>
    ${r.region ? `<div class="stat-card"><div class="stat-value" style="font-size:16px">${esc(r.region)}</div><div class="stat-label">Region</div></div>` : ''}
  </div>`;

  // Executive Summary
  if (exec.overview) {
    body += `<h2>Executive Summary</h2><div class="card"><p>${esc(exec.overview)}</p>`;
    if (safeArr(exec.keyFindings).length) body += `<h3>Key Findings</h3>${listHtml(safeArr(exec.keyFindings), 'list-check')}`;
    if (safeArr(exec.criticalActions).length) body += `<h3>Critical Actions</h3>${listHtml(safeArr(exec.criticalActions), 'list-warn')}`;
    body += '</div>';
  }

  // SWOT
  if (swot.strengths || swot.weaknesses || swot.opportunities || swot.threats) {
    body += `<h2>SWOT Analysis</h2><div class="two-col">
      <div class="card"><h3 style="color:var(--emerald)">Strengths</h3>${listHtml(safeArr(swot.strengths), 'list-check')}</div>
      <div class="card"><h3 style="color:var(--red)">Weaknesses</h3>${listHtml(safeArr(swot.weaknesses), 'list-risk')}</div>
      <div class="card"><h3 style="color:var(--primary)">Opportunities</h3>${listHtml(safeArr(swot.opportunities))}</div>
      <div class="card"><h3 style="color:var(--amber)">Threats</h3>${listHtml(safeArr(swot.threats), 'list-warn')}</div>
    </div>`;
  }

  // Competitor Profiles
  if (profiles.length) {
    body += `<h2>Competitor Profiles</h2>`;
    profiles.forEach((p: any) => {
      body += `<div class="card">
        <div class="card-header"><span class="card-title">${esc(p.name)}</span><span class="badge badge-primary">${esc(p.category || 'Competitor')}</span></div>
        ${p.brandStrength ? scoreBar(p.brandStrength, 'Brand Strength') : ''}
        ${p.summary ? `<p style="margin-top:10px">${esc(p.summary)}</p>` : ''}
        ${safeArr(p.differentiators).length ? `<h3>Differentiators</h3>${listHtml(safeArr(p.differentiators))}` : ''}
        ${safeArr(p.vulnerabilities).length ? `<h3>Vulnerabilities</h3>${listHtml(safeArr(p.vulnerabilities), 'list-warn')}` : ''}
      </div>`;
    });
  }

  // Brand Positioning
  if (pos.currentPositioning || pos.recommendedPositioning) {
    body += `<h2>Brand Positioning</h2><div class="card">
      ${pos.currentPositioning ? `<h3>Current</h3><p>${esc(pos.currentPositioning)}</p>` : ''}
      ${pos.recommendedPositioning ? `<h3>Recommended</h3><p>${esc(pos.recommendedPositioning)}</p>` : ''}
      ${safeArr(pos.differentiationOpportunities).length ? `<h3>Differentiation Opportunities</h3>${listHtml(safeArr(pos.differentiationOpportunities))}` : ''}
    </div>`;
  }

  // Visual Identity
  if (vis.score !== undefined) {
    body += `<h2>Visual Identity</h2><div class="card">
      ${scoreBar(vis.score || 0, 'Visual Score')}
      ${safeArr(vis.strengths).length ? `<h3>Strengths</h3>${listHtml(safeArr(vis.strengths), 'list-check')}` : ''}
      ${safeArr(vis.improvements).length ? `<h3>Improvements</h3>${listHtml(safeArr(vis.improvements), 'list-warn')}` : ''}
    </div>`;
  }

  // Digital Presence
  if (dig.score !== undefined) {
    body += `<h2>Digital Presence</h2><div class="card">
      ${scoreBar(dig.score || 0, 'Digital Score')}
      ${safeArr(dig.strengths).length ? `<h3>Strengths</h3>${listHtml(safeArr(dig.strengths), 'list-check')}` : ''}
      ${safeArr(dig.gaps).length ? `<h3>Gaps</h3>${listHtml(safeArr(dig.gaps), 'list-warn')}` : ''}
    </div>`;
  }

  // Recommendations
  if (recs.immediate || recs.shortTerm || recs.longTerm) {
    body += `<h2>Recommendations</h2><div class="card">
      ${safeArr(recs.immediate).length ? `<h3>🔴 Immediate</h3>${listHtml(safeArr(recs.immediate), 'list-warn')}` : ''}
      ${safeArr(recs.shortTerm).length ? `<h3>🟡 Short-Term</h3>${listHtml(safeArr(recs.shortTerm))}` : ''}
      ${safeArr(recs.longTerm).length ? `<h3>🟢 Long-Term</h3>${listHtml(safeArr(recs.longTerm), 'list-check')}` : ''}
    </div>`;
  }

  // Market Trends
  if (trends.industryTrends || trends.emergingTechnologies) {
    body += `<h2>Market Trends & Innovation</h2><div class="card">
      ${safeArr(trends.industryTrends).length ? `<h3>Industry Trends</h3>${listHtml(safeArr(trends.industryTrends))}` : ''}
      ${safeArr(trends.emergingTechnologies).length ? `<h3>Emerging Technologies</h3>${listHtml(safeArr(trends.emergingTechnologies))}` : ''}
      ${safeArr(trends.disruptionRisks).length ? `<h3>Disruption Risks</h3>${listHtml(safeArr(trends.disruptionRisks), 'list-risk')}` : ''}
    </div>`;
  }

  const html = wrapDocument(
    `Competitive Analysis — ${options.entityName}`,
    `${options.entityType} Report · ${safeArr(r.competitors).join(', ')}`,
    body
  );
  const slug = options.entityName.replace(/\s+/g, '-').toLowerCase();
  downloadHtml(html, `competitive-analysis-${slug}.html`);
}

// ─── Market Analysis Report ─────────────────────────────────
export function exportMarketAnalysisHtml(
  result: any,
  options: { brandName: string; analysisType: string }
) {
  const r = result;
  let body = '';

  // Score + header
  body += `<div class="stat-grid">
    <div class="stat-card"><div class="stat-value" style="color:${scoreColor(r.score || 0)}">${r.score || 0}</div><div class="stat-label">Analysis Score</div></div>
  </div>`;

  if (r.summary) body += `<div class="card"><p style="font-size:15px;color:var(--fg)">${esc(r.summary)}</p></div>`;

  // Market Position
  if (r.marketPosition) {
    const mp = r.marketPosition;
    body += `<h2>Market Position</h2><div class="card">
      ${mp.currentState ? `<p style="color:var(--fg)">${esc(mp.currentState)}</p>` : ''}
      ${safeArr(mp.opportunities).length ? `<h3>Opportunities</h3>${listHtml(safeArr(mp.opportunities), 'list-check')}` : ''}
      ${safeArr(mp.threats).length ? `<h3>Threats</h3>${listHtml(safeArr(mp.threats), 'list-risk')}` : ''}
    </div>`;
  }

  // Competitive Analysis
  if (r.competitiveAnalysis) {
    const ca = r.competitiveAnalysis;
    body += `<h2>Competitive Landscape</h2><div class="card">
      ${safeArr(ca.strengths).length ? `<h3>Strengths</h3>${listHtml(safeArr(ca.strengths), 'list-check')}` : ''}
      ${safeArr(ca.differentiators).length ? `<h3>Differentiators</h3>${listHtml(safeArr(ca.differentiators))}` : ''}
      ${safeArr(ca.competitorInsights).length ? `<h3>Competitor Insights</h3>${listHtml(safeArr(ca.competitorInsights))}` : ''}
    </div>`;
  }

  // Growth Recommendations
  if (r.growthRecommendations) {
    const gr = r.growthRecommendations;
    body += `<h2>Growth Recommendations</h2><div class="card">
      ${safeArr(gr.shortTerm).length ? `<h3>Short-Term</h3>${listHtml(safeArr(gr.shortTerm))}` : ''}
      ${safeArr(gr.longTerm).length ? `<h3>Long-Term</h3>${listHtml(safeArr(gr.longTerm), 'list-check')}` : ''}
      ${safeArr(gr.metrics).length ? `<h3>Key Metrics</h3>${listHtml(safeArr(gr.metrics))}` : ''}
    </div>`;
  }

  // Trend Analysis
  if (r.trendAnalysis) {
    const ta = r.trendAnalysis;
    body += `<h2>Trend Analysis</h2><div class="card">
      ${safeArr(ta.industryTrends).length ? `<h3>Industry Trends</h3>${listHtml(safeArr(ta.industryTrends))}` : ''}
      ${safeArr(ta.emergingOpportunities).length ? `<h3>Emerging Opportunities</h3>${listHtml(safeArr(ta.emergingOpportunities), 'list-check')}` : ''}
      ${safeArr(ta.risksToWatch).length ? `<h3>Risks to Watch</h3>${listHtml(safeArr(ta.risksToWatch), 'list-risk')}` : ''}
    </div>`;
  }

  // Social Sentiment
  if (r.socialSentiment) {
    const ss = r.socialSentiment;
    body += `<h2>Social Sentiment</h2><div class="card">
      ${scoreBar(ss.overallScore || 0, 'Sentiment Score')}
      ${safeArr(ss.platforms).length ? `<table><thead><tr><th>Platform</th><th>Score</th><th>Trend</th></tr></thead><tbody>${safeArr(ss.platforms).map((p: any) => `<tr><td>${esc(p.name)}</td><td>${p.score}/100</td><td>${p.trend === 'up' ? '📈' : p.trend === 'down' ? '📉' : '➡️'} ${esc(p.trend)}</td></tr>`).join('')}</tbody></table>` : ''}
      ${safeArr(ss.keyTopics).length ? `<h3>Key Topics</h3>${listHtml(safeArr(ss.keyTopics))}` : ''}
      ${safeArr(ss.recommendations).length ? `<h3>Recommendations</h3>${listHtml(safeArr(ss.recommendations))}` : ''}
    </div>`;
  }

  // Action Plan
  if (r.actionPlan) {
    const ap = r.actionPlan;
    body += `<h2>Action Plan</h2><div class="card">
      ${safeArr(ap.immediate).length ? `<h3>🔴 Immediate</h3>${listHtml(safeArr(ap.immediate), 'list-warn')}` : ''}
      ${safeArr(ap.quarterly).length ? `<h3>🟡 Quarterly</h3>${listHtml(safeArr(ap.quarterly))}` : ''}
      ${safeArr(ap.annual).length ? `<h3>🟢 Annual</h3>${listHtml(safeArr(ap.annual), 'list-check')}` : ''}
    </div>`;
  }

  const html = wrapDocument(
    `Market Analysis — ${options.brandName}`,
    `${options.analysisType} Report`,
    body
  );
  const slug = options.brandName.replace(/\s+/g, '-').toLowerCase();
  downloadHtml(html, `market-analysis-${slug}.html`);
}

// ─── Brand Intelligence Report ──────────────────────────────
export function exportBrandIntelligenceHtml(
  intelligence: any,
  options: { entityName: string; entityType: string }
) {
  const i = intelligence;
  let body = '';

  // Summary
  if (i.brand_summary) {
    body += `<div class="card"><p style="font-size:15px;color:var(--fg)">${esc(i.brand_summary)}</p></div>`;
  }

  // Stats
  body += `<div class="stat-grid">
    <div class="stat-card"><div class="stat-value">${i.analysis_count || 0}</div><div class="stat-label">Analyses</div></div>
    <div class="stat-card"><div class="stat-value">${safeArr(i.knowledge_entries).length}</div><div class="stat-label">Knowledge Entries</div></div>
    ${i.market_position ? `<div class="stat-card"><div class="stat-value" style="font-size:14px">${esc(i.market_position)}</div><div class="stat-label">Market Position</div></div>` : ''}
    ${i.localization_readiness_score ? `<div class="stat-card">${scoreBar(i.localization_readiness_score, 'Localization Readiness')}</div>` : ''}
  </div>`;

  // Competitive Advantages
  if (safeArr(i.competitive_advantages).length) {
    body += `<h2>Competitive Advantages</h2><div class="card">${listHtml(safeArr(i.competitive_advantages), 'list-check')}</div>`;
  }

  // Growth Recommendations
  if (safeArr(i.growth_recommendations).length) {
    body += `<h2>Growth Recommendations</h2><div class="card">${listHtml(safeArr(i.growth_recommendations))}</div>`;
  }

  // Target Audience
  if (i.target_audience) {
    const ta = i.target_audience as Record<string, unknown>;
    body += `<h2>Target Audience</h2><div class="card">`;
    Object.entries(ta).forEach(([key, val]) => {
      body += `<h3>${esc(key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}</h3>`;
      if (Array.isArray(val)) body += listHtml(val);
      else if (typeof val === 'string') body += `<p>${esc(val)}</p>`;
      else body += `<p>${esc(JSON.stringify(val))}</p>`;
    });
    body += '</div>';
  }

  // Brand Voice
  if (i.brand_voice_profile) {
    const bv = i.brand_voice_profile as Record<string, unknown>;
    body += `<h2>Brand Voice Profile</h2><div class="card">`;
    Object.entries(bv).forEach(([key, val]) => {
      body += `<h3>${esc(key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}</h3>`;
      if (Array.isArray(val)) body += listHtml(val);
      else if (typeof val === 'string') body += `<p>${esc(val)}</p>`;
    });
    body += '</div>';
  }

  // Cultural Insights
  if (i.cultural_insights) {
    const ci = i.cultural_insights as Record<string, unknown>;
    body += `<h2>Cultural Insights</h2><div class="card">`;
    Object.entries(ci).forEach(([key, val]) => {
      body += `<h3>${esc(key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))}</h3>`;
      if (Array.isArray(val)) body += listHtml(val);
      else if (typeof val === 'string') body += `<p>${esc(val)}</p>`;
    });
    body += '</div>';
  }

  // Knowledge Entries
  const entries = safeArr(i.knowledge_entries);
  if (entries.length) {
    body += `<h2>Knowledge Base (${entries.length} entries)</h2>`;
    entries.slice(0, 30).forEach((e: any) => {
      body += `<div class="card">
        <div class="card-header">
          <span class="badge badge-${e.type === 'insight' ? 'amber' : e.type === 'learning' ? 'violet' : 'primary'}">${esc(e.type || 'note')}</span>
          ${e.created_at ? `<span style="font-size:11px;color:var(--fg-muted)">${new Date(e.created_at).toLocaleDateString()}</span>` : ''}
        </div>
        <p>${esc(e.content)}</p>
        ${e.category ? `<span style="font-size:11px;color:var(--fg-muted)">${esc(e.category)}</span>` : ''}
      </div>`;
    });
  }

  const html = wrapDocument(
    `Brand Intelligence — ${options.entityName}`,
    `${options.entityType} Intelligence Report`,
    body
  );
  const slug = options.entityName.replace(/\s+/g, '-').toLowerCase();
  downloadHtml(html, `brand-intelligence-${slug}.html`);
}

// ─── Website Analysis Report ────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  seoHealth: 'SEO Health',
  performance: 'Performance',
  accessibility: 'Accessibility',
  brandConsistency: 'Brand Consistency',
  contentQuality: 'Content Quality',
  technicalFoundation: 'Technical Foundation',
  userExperience: 'User Experience',
  competitivePosition: 'Competitive Position',
};

export function exportWebsiteAnalysisHtml(
  report: any,
  options: { url: string }
) {
  const r = report;
  let body = '';

  // Overall score & grade
  body += `<div class="stat-grid">
    <div class="stat-card"><div class="stat-value" style="color:${scoreColor(r.overallScore || 0)}">${r.overallScore || 0}</div><div class="stat-label">Overall Score</div></div>
    <div class="stat-card"><div class="stat-value">${esc(r.grade || 'N/A')}</div><div class="stat-label">Grade</div></div>
  </div>`;

  if (r.summary) body += `<div class="card"><p style="color:var(--fg)">${esc(r.summary)}</p></div>`;

  // Section breakdown (the main content)
  const sections = r.sections || {};
  const sectionEntries = Object.entries(sections).filter(([, val]) => val && typeof val === 'object');

  if (sectionEntries.length) {
    body += `<h2>Section Breakdown</h2>`;
    body += `<div class="two-col">`;
    sectionEntries.forEach(([key, data]: [string, any]) => {
      const label = SECTION_LABELS[key] || key;
      const score = data.score ?? data.overallScore ?? null;
      const findings = safeArr(data.findings);
      const recommendations = safeArr(data.recommendations);

      body += `<div class="card">
        <div class="card-header">
          <span class="card-title">${esc(label)}</span>
          ${score !== null ? `<span style="font-size:18px;font-weight:700;color:${scoreColor(score)}">${score}/100</span>` : ''}
        </div>
        ${score !== null ? scoreBar(score, label) : ''}
        ${findings.length ? `<div style="margin-top:12px">
          <p style="font-size:11px;font-weight:600;color:var(--fg-muted);margin-bottom:6px;text-transform:uppercase">Findings</p>
          <ul class="list list-check">${findings.slice(0, 10).map((f: any) => `<li>${esc(f)}</li>`).join('')}</ul>
        </div>` : ''}
        ${recommendations.length ? `<div style="margin-top:12px">
          <p style="font-size:11px;font-weight:600;color:var(--fg-muted);margin-bottom:6px;text-transform:uppercase">Recommendations</p>
          <ul class="list list-warn">${recommendations.slice(0, 10).map((r: any) => `<li>${esc(r)}</li>`).join('')}</ul>
        </div>` : ''}
      </div>`;
    });
    body += `</div>`;
  }

  // Top recommendations
  const topRecs = safeArr(r.topRecommendations);
  if (topRecs.length) {
    body += `<h2>Top Recommendations</h2>`;
    body += `<div class="card">${listHtml(topRecs, 'list-warn')}</div>`;
  }

  // Priority actions
  const actions = safeArr(r.priorityActions);
  if (actions.length) {
    body += `<h2>Priority Actions</h2>`;
    body += `<div class="card"><table>
      <thead><tr><th>Action</th><th>Impact</th><th>Effort</th><th>Timeline</th></tr></thead>
      <tbody>${actions.map((a: any) => `<tr>
        <td>${esc(a.action || a.title || '')}</td>
        <td><span class="badge ${a.impact === 'high' ? 'badge-red' : a.impact === 'medium' ? 'badge-amber' : 'badge-emerald'}">${esc(a.impact || '—')}</span></td>
        <td>${esc(a.effort || '—')}</td>
        <td>${esc(a.timeline || '—')}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  }

  // Competitor comparison
  const comps = safeArr(r.competitorComparison);
  if (comps.length) {
    body += `<h2>Competitor Comparison</h2>`;
    comps.forEach((comp: any) => {
      body += `<div class="card">
        <div class="card-header"><span class="card-title">${esc(comp.competitor || 'Competitor')}</span></div>
        <div class="two-col">
          <div>
            <p style="font-size:11px;font-weight:600;color:var(--emerald);margin-bottom:6px;text-transform:uppercase">Strengths</p>
            ${listHtml(safeArr(comp.strengths), 'list-check')}
          </div>
          <div>
            <p style="font-size:11px;font-weight:600;color:var(--red);margin-bottom:6px;text-transform:uppercase">Weaknesses</p>
            ${listHtml(safeArr(comp.weaknesses), 'list-risk')}
          </div>
        </div>
      </div>`;
    });
  }

  // Industry benchmarks
  if (r.industryBenchmarks) {
    const ib = r.industryBenchmarks;
    body += `<h2>Industry Benchmarks</h2><div class="card"><table>
      <thead><tr><th>Metric</th><th>Value</th></tr></thead>
      <tbody>${Object.entries(ib).map(([k, v]) => `<tr><td>${esc(k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' '))}</td><td>${esc(v)}</td></tr>`).join('')}</tbody>
    </table></div>`;
  }

  const html = wrapDocument(
    `Website Analysis`,
    options.url,
    body
  );
  const slug = options.url.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '-');
  downloadHtml(html, `website-analysis-${slug}.html`);
}

// ─── Brand Cohesion Audit Report ────────────────────────────
export function exportBrandAuditHtml(
  audit: any,
  options: { brandName: string }
) {
  const r = audit;
  let body = '';

  // Overall Score
  body += `<div class="stat-grid">
    <div class="stat-card"><div class="stat-value" style="color:${scoreColor(r.overallScore || 0)}">${r.overallScore || 0}</div><div class="stat-label">Cohesion Score</div></div>
  </div>`;

  // Summary
  if (r.summary) body += `<div class="card"><p style="font-size:15px;color:var(--fg)">${esc(r.summary)}</p></div>`;

  // Strengths & Weaknesses
  if (safeArr(r.strengths).length || safeArr(r.weaknesses).length) {
    body += `<h2>Strengths & Weaknesses</h2><div class="two-col">
      <div class="card"><h3 style="color:var(--emerald)">Strengths</h3>${listHtml(safeArr(r.strengths), 'list-check')}</div>
      <div class="card"><h3 style="color:var(--red)">Areas for Improvement</h3>${listHtml(safeArr(r.weaknesses), 'list-risk')}</div>
    </div>`;
  }

  // Category Breakdown
  const categories = safeArr(r.categories);
  if (categories.length) {
    body += `<h2>Category Breakdown</h2>`;
    categories.forEach((cat: any) => {
      body += `<div class="card">
        <div class="card-header"><span class="card-title">${esc(cat.name)}</span><span style="font-size:18px;font-weight:700;color:${scoreColor(cat.score || 0)}">${cat.score || 0}/100</span></div>
        ${scoreBar(cat.score || 0, cat.name)}
        ${safeArr(cat.findings).length ? `<div style="margin-top:12px"><p style="font-size:11px;font-weight:600;color:var(--fg-muted);text-transform:uppercase;margin-bottom:6px">Findings</p>${listHtml(safeArr(cat.findings))}</div>` : ''}
        ${safeArr(cat.recommendations).length ? `<div style="margin-top:12px"><p style="font-size:11px;font-weight:600;color:var(--fg-muted);text-transform:uppercase;margin-bottom:6px">Recommendations</p>${listHtml(safeArr(cat.recommendations), 'list-warn')}</div>` : ''}
      </div>`;
    });
  }

  // Bias & Inclusivity Review
  const bias = r.biasReview;
  if (bias) {
    body += `<h2>Bias & Inclusivity Review</h2>`;
    body += `<div class="stat-grid">
      <div class="stat-card"><div class="stat-value" style="color:${scoreColor(bias.score || 0)}">${bias.score || 0}</div><div class="stat-label">Inclusivity Score</div></div>
    </div>`;

    const dims = [
      { key: 'languageInclusivity', label: 'Language Inclusivity' },
      { key: 'visualRepresentation', label: 'Visual Representation' },
      { key: 'culturalSensitivity', label: 'Cultural Sensitivity' },
      { key: 'accessibilityConsiderations', label: 'Accessibility' },
      { key: 'regulatoryCompliance', label: 'EAA Regulatory Compliance' },
    ];

    dims.forEach(dim => {
      const sub = bias[dim.key];
      if (!sub) return;
      body += `<div class="card">
        <div class="card-header"><span class="card-title">${esc(dim.label)}</span><span style="font-size:16px;font-weight:700;color:${scoreColor(sub.score || 0)}">${sub.score || 0}/100</span></div>
        ${scoreBar(sub.score || 0, dim.label)}
        ${safeArr(sub.findings).length ? `<div style="margin-top:10px"><p style="font-size:11px;font-weight:600;color:var(--fg-muted);text-transform:uppercase;margin-bottom:6px">Findings</p>${listHtml(safeArr(sub.findings))}</div>` : ''}
        ${safeArr(sub.recommendations).length ? `<div style="margin-top:10px"><p style="font-size:11px;font-weight:600;color:var(--fg-muted);text-transform:uppercase;margin-bottom:6px">Recommendations</p>${listHtml(safeArr(sub.recommendations), 'list-warn')}</div>` : ''}
      </div>`;
    });

    if (safeArr(bias.overallFindings).length) {
      body += `<div class="card"><h3 style="color:var(--violet)">Key Bias Findings</h3>${listHtml(safeArr(bias.overallFindings), 'list-warn')}</div>`;
    }
    if (safeArr(bias.overallRecommendations).length) {
      body += `<div class="card"><h3>Overall Recommendations</h3>${listHtml(safeArr(bias.overallRecommendations), 'list-check')}</div>`;
    }
  }

  // Action Items
  if (safeArr(r.actionItems).length) {
    body += `<h2>Priority Action Items</h2><div class="card"><ol style="padding-left:20px">`;
    safeArr(r.actionItems).forEach((item: any, i: number) => {
      body += `<li style="padding:6px 0;font-size:13px;color:var(--fg-muted);border-bottom:1px solid var(--border)">${esc(item)}</li>`;
    });
    body += `</ol></div>`;
  }

  const html = wrapDocument(
    `Brand Cohesion Audit — ${options.brandName}`,
    'AI-Powered Brand Analysis',
    body
  );
  const slug = options.brandName.replace(/\s+/g, '-').toLowerCase();
  downloadHtml(html, `brand-audit-${slug}.html`);
}

// ─── Bias & Inclusivity Awareness Report ────────────────────
export function exportBiasAwarenessHtml(
  scan: any,
  options: { entityName: string; entityType: string }
) {
  let body = '';

  // Dimension scores
  const dims = [
    { key: 'inclusion_score', label: 'Inclusion' },
    { key: 'language_score', label: 'Language' },
    { key: 'visual_score', label: 'Visual Representation' },
    { key: 'accessibility_score', label: 'Accessibility' },
    { key: 'ai_governance_score', label: 'AI Governance' },
  ];

  body += `<div class="stat-grid">`;
  dims.forEach(d => {
    const score = Number(scan[d.key]) || 0;
    body += `<div class="stat-card"><div class="stat-value" style="color:${scoreColor(score)}">${score}</div><div class="stat-label">${esc(d.label)}</div></div>`;
  });
  body += `</div>`;

  // Score bars
  body += `<div class="card">`;
  dims.forEach(d => {
    const score = Number(scan[d.key]) || 0;
    body += scoreBar(score, d.label);
    body += `<div style="margin-bottom:12px"></div>`;
  });
  body += `</div>`;

  // Detailed analyses
  const analyses = [
    { key: 'language_analysis', label: 'Language & Messaging Analysis' },
    { key: 'visual_analysis', label: 'Visual Representation Analysis' },
    { key: 'accessibility_analysis', label: 'Accessibility Analysis' },
    { key: 'ai_governance_analysis', label: 'AI Governance Analysis' },
  ];

  analyses.forEach(a => {
    const data = scan[a.key];
    if (!data || typeof data !== 'object') return;
    body += `<h2>${esc(a.label)}</h2><div class="card">`;
    Object.entries(data as Record<string, unknown>).forEach(([key, val]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (Array.isArray(val) && val.length) {
        body += `<h3>${esc(label)}</h3>${listHtml(val, key.includes('strength') || key.includes('safeguard') ? 'list-check' : key.includes('risk') || key.includes('gap') || key.includes('issue') ? 'list-risk' : '')}`;
      } else if (typeof val === 'string') {
        body += `<h3>${esc(label)}</h3><p>${esc(val)}</p>`;
      }
    });
    body += `</div>`;
  });

  // Advanced modules
  const modules = [
    { key: 'pie_module', label: 'PI&E "Who Else?" Framework' },
    { key: 'wfa_module', label: 'WFA Bias Litmus Test' },
    { key: 'policy_as_code_module', label: 'Policy-as-Code Disparate Impact' },
    { key: 'inclusive_imagery_module', label: 'Inclusive Imagery Assessment' },
    { key: 'inclusion_checklist_module', label: '2026 Master Inclusion Checklist' },
  ];

  modules.forEach(m => {
    const data = scan[m.key];
    if (!data || typeof data !== 'object') return;
    body += `<h2>${esc(m.label)}</h2><div class="card">`;
    if (data.overall_score !== undefined) body += scoreBar(data.overall_score, 'Module Score');
    if (data.imagery_inclusion_score !== undefined) body += scoreBar(data.imagery_inclusion_score, 'Imagery Score');
    if (data.score !== undefined) body += scoreBar(data.score, 'Checklist Score');

    Object.entries(data as Record<string, unknown>).forEach(([key, val]) => {
      if (['overall_score', 'imagery_inclusion_score', 'score'].includes(key)) return;
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (Array.isArray(val) && val.length) {
        body += `<h3>${esc(label)}</h3>${listHtml(val.map((v: any) => typeof v === 'object' ? (v.area || v.recommendation || v.action || JSON.stringify(v)) : v), key.includes('go_') ? 'list-check' : key.includes('stop_') ? 'list-risk' : '')}`;
      } else if (typeof val === 'object' && val !== null) {
        body += `<h3>${esc(label)}</h3>`;
        Object.entries(val as Record<string, unknown>).forEach(([sk, sv]) => {
          const sl = sk.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          if (typeof sv === 'object' && sv !== null) {
            const subObj = sv as Record<string, unknown>;
            if (subObj.score !== undefined) body += scoreBar(Number(subObj.score), sl);
            const subArr = Object.entries(subObj).filter(([k, v]) => Array.isArray(v) && (v as unknown[]).length > 0);
            subArr.forEach(([k, v]) => {
              body += `<p style="font-size:11px;font-weight:600;color:var(--fg-muted);margin:8px 0 4px;text-transform:uppercase">${esc(k.replace(/_/g, ' '))}</p>${listHtml(v as unknown[])}`;
            });
          } else if (typeof sv === 'string') {
            body += `<p style="margin:4px 0"><span style="color:var(--fg-muted);font-size:12px">${esc(sl)}:</span> ${esc(sv)}</p>`;
          }
        });
      } else if (typeof val === 'string') {
        body += `<p style="margin:4px 0"><span style="color:var(--fg-muted);font-size:12px">${esc(label)}:</span> ${esc(val)}</p>`;
      }
    });
    body += `</div>`;
  });

  // Findings
  const findings = Array.isArray(scan.findings) ? scan.findings : [];
  if (findings.length) {
    body += `<h2>Findings (${findings.length})</h2><div class="card"><table>
      <thead><tr><th>Dimension</th><th>Severity</th><th>Title</th><th>Description</th></tr></thead>
      <tbody>${findings.slice(0, 25).map((f: any) => `<tr>
        <td>${esc(f.dimension || '')}</td>
        <td><span class="badge ${f.severity === 'critical' || f.severity === 'high' ? 'badge-red' : f.severity === 'medium' ? 'badge-amber' : 'badge-emerald'}">${esc(f.severity || '')}</span></td>
        <td style="font-weight:600">${esc(f.title || '')}</td>
        <td>${esc(f.description || f.message || '')}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  }

  // Recommendations
  const recs = Array.isArray(scan.recommendations) ? scan.recommendations : [];
  if (recs.length) {
    body += `<h2>Recommendations</h2><div class="card"><table>
      <thead><tr><th>Priority</th><th>Dimension</th><th>Action</th><th>Impact</th></tr></thead>
      <tbody>${recs.slice(0, 15).map((r: any) => `<tr>
        <td><span class="badge ${r.priority === 'immediate' ? 'badge-red' : r.priority === 'short_term' ? 'badge-amber' : 'badge-emerald'}">${esc(r.priority || '')}</span></td>
        <td>${esc(r.dimension || '')}</td>
        <td>${esc(r.action || r.message || r.recommendation || '')}</td>
        <td>${esc(r.impact || '')}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  }

  // Persona Coverage
  if (scan.persona_coverage && typeof scan.persona_coverage === 'object') {
    const pc = scan.persona_coverage as Record<string, unknown>;
    body += `<h2>Persona Coverage</h2><div class="card">`;
    if (pc.coverage_percentage !== undefined) body += scoreBar(Number(pc.coverage_percentage), 'Overall Coverage');
    const spectrums = ['mobility', 'vision', 'hearing', 'speech', 'cognitive'];
    body += `<table style="margin-top:12px"><thead><tr><th>Spectrum</th><th>Permanent</th><th>Temporary</th><th>Situational</th></tr></thead><tbody>`;
    spectrums.forEach(s => {
      const sp = pc[s] as Record<string, boolean> | undefined;
      if (!sp) return;
      body += `<tr><td style="text-transform:capitalize;font-weight:600">${s}</td>
        <td>${sp.permanent ? '✅' : '❌'}</td>
        <td>${sp.temporary ? '✅' : '❌'}</td>
        <td>${sp.situational ? '✅' : '❌'}</td>
      </tr>`;
    });
    body += `</tbody></table></div>`;
  }

  const html = wrapDocument(
    `Bias & Inclusivity Report — ${options.entityName}`,
    `${options.entityType} Awareness Scan`,
    body
  );
  const slug = options.entityName.replace(/\s+/g, '-').toLowerCase();
  downloadHtml(html, `bias-awareness-${slug}.html`);
}
