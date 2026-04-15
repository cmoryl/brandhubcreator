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

function safeObj(val: unknown): Record<string, unknown> {
  if (val && typeof val === 'object' && !Array.isArray(val)) return val as Record<string, unknown>;
  return {};
}

function renderKeyValueSection(obj: Record<string, unknown>, title: string): string {
  const entries = Object.entries(obj).filter(([, v]) => v != null && v !== '');
  if (!entries.length) return '';
  let html = `<h2>${esc(title)}</h2><div class="card">`;
  entries.forEach(([key, val]) => {
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    html += `<h3>${esc(label)}</h3>`;
    if (Array.isArray(val)) html += listHtml(val);
    else if (typeof val === 'object' && val !== null) {
      Object.entries(val as Record<string, unknown>).forEach(([k2, v2]) => {
        const l2 = k2.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        html += `<p><strong style="color:var(--fg)">${esc(l2)}:</strong> ${esc(Array.isArray(v2) ? v2.join(', ') : String(v2 ?? ''))}</p>`;
      });
    } else html += `<p>${esc(String(val))}</p>`;
  });
  html += '</div>';
  return html;
}

function buildBrandIntelligenceBody(intelligence: any): string {
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
    ${i.feedback_score ? `<div class="stat-card">${scoreBar(i.feedback_score, 'Feedback Score')}</div>` : ''}
  </div>`;

  // Competitive Advantages
  if (safeArr(i.competitive_advantages).length) {
    body += `<h2>Competitive Advantages</h2><div class="card">${listHtml(safeArr(i.competitive_advantages), 'list-check')}</div>`;
  }

  // Growth Recommendations
  const recs = safeArr(i.growth_recommendations);
  if (recs.length) {
    body += `<h2>Growth Recommendations</h2>`;
    recs.forEach((rec: any, idx: number) => {
      if (typeof rec === 'object' && rec !== null) {
        const r = rec as Record<string, unknown>;
        body += `<div class="card">
          <div class="card-header">
            <span class="card-title">${esc(r.title || r.recommendation || `Recommendation ${idx + 1}`)}</span>
            ${r.priority ? `<span class="badge badge-${r.priority === 'high' ? 'red' : r.priority === 'medium' ? 'amber' : 'primary'}">${esc(String(r.priority))}</span>` : ''}
          </div>
          ${r.description ? `<p>${esc(String(r.description))}</p>` : ''}
          ${r.rationale ? `<p><strong style="color:var(--fg)">Rationale:</strong> ${esc(String(r.rationale))}</p>` : ''}
          ${r.impact ? `<p><strong style="color:var(--fg)">Expected Impact:</strong> ${esc(String(r.impact))}</p>` : ''}
          ${r.timeline ? `<p><strong style="color:var(--fg)">Timeline:</strong> ${esc(String(r.timeline))}</p>` : ''}
          ${Array.isArray(r.action_items) ? `<p><strong style="color:var(--fg)">Action Items:</strong></p>${listHtml(r.action_items)}` : ''}
        </div>`;
      } else {
        body += `<div class="card"><p>${esc(String(rec))}</p></div>`;
      }
    });
  }

  // Target Audience
  if (i.target_audience) {
    body += renderKeyValueSection(safeObj(i.target_audience), 'Target Audience');
  }

  // Brand Voice
  if (i.brand_voice_profile) {
    body += renderKeyValueSection(safeObj(i.brand_voice_profile), 'Brand Voice Profile');
  }

  // Competitive Landscape
  const landscape = safeObj(i.competitive_landscape);
  if (Object.keys(landscape).length) {
    body += `<h2>Competitive Landscape</h2><div class="card">`;
    const competitors = safeArr(landscape.competitors || landscape.key_competitors);
    if (competitors.length) {
      body += `<table><thead><tr><th>Competitor</th><th>Strengths</th><th>Weaknesses</th></tr></thead><tbody>`;
      competitors.forEach((c: any) => {
        if (typeof c === 'object' && c !== null) {
          const comp = c as Record<string, unknown>;
          body += `<tr>
            <td style="font-weight:600">${esc(comp.name || comp.competitor || '')}</td>
            <td>${esc(Array.isArray(comp.strengths) ? comp.strengths.join(', ') : String(comp.strengths || '—'))}</td>
            <td>${esc(Array.isArray(comp.weaknesses) ? comp.weaknesses.join(', ') : String(comp.weaknesses || '—'))}</td>
          </tr>`;
        } else {
          body += `<tr><td colspan="3">${esc(String(c))}</td></tr>`;
        }
      });
      body += `</tbody></table>`;
    }
    const threats = safeArr(landscape.threats);
    const opportunities = safeArr(landscape.opportunities);
    if (threats.length || opportunities.length) {
      body += `<div class="two-col">`;
      if (opportunities.length) body += `<div><h3>Opportunities</h3>${listHtml(opportunities, 'list-check')}</div>`;
      if (threats.length) body += `<div><h3>Threats</h3>${listHtml(threats, 'list-warn')}</div>`;
      body += `</div>`;
    }
    // Render remaining keys
    const skip = new Set(['competitors', 'key_competitors', 'threats', 'opportunities']);
    Object.entries(landscape).filter(([k]) => !skip.has(k)).forEach(([key, val]) => {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      body += `<h3>${esc(label)}</h3>`;
      if (Array.isArray(val)) body += listHtml(val);
      else if (typeof val === 'string') body += `<p>${esc(val)}</p>`;
      else body += `<p>${esc(JSON.stringify(val))}</p>`;
    });
    body += '</div>';
  }

  // Cultural Insights
  if (i.cultural_insights) {
    body += renderKeyValueSection(safeObj(i.cultural_insights), 'Cultural Insights');
  }

  // GlobalLink Recommendations
  const glRecs = safeArr(i.globallink_recommendations);
  if (glRecs.length) {
    body += `<h2>GlobalLink Recommendations</h2>`;
    glRecs.forEach((rec: any) => {
      if (typeof rec === 'object' && rec !== null) {
        const r = rec as Record<string, unknown>;
        body += `<div class="card">
          <div class="card-header">
            <span class="card-title">${esc(r.title || r.recommendation || r.region || '')}</span>
            ${r.priority ? `<span class="badge badge-${r.priority === 'high' ? 'red' : 'amber'}">${esc(String(r.priority))}</span>` : ''}
          </div>
          ${r.description ? `<p>${esc(String(r.description))}</p>` : ''}
          ${r.rationale ? `<p>${esc(String(r.rationale))}</p>` : ''}
          ${r.region ? `<p><strong style="color:var(--fg)">Region:</strong> ${esc(String(r.region))}</p>` : ''}
          ${Array.isArray(r.actions) ? listHtml(r.actions) : ''}
        </div>`;
      } else {
        body += `<div class="card"><p>${esc(String(rec))}</p></div>`;
      }
    });
  }

  // Regional Adaptations
  const regAdapt = safeArr(i.regional_adaptations);
  if (regAdapt.length) {
    body += `<h2>Regional Adaptations</h2>`;
    regAdapt.forEach((ra: any) => {
      if (typeof ra === 'object' && ra !== null) {
        const r = ra as Record<string, unknown>;
        body += `<div class="card">
          <div class="card-header"><span class="card-title">${esc(r.region || r.market || r.name || '')}</span></div>
          ${r.description ? `<p>${esc(String(r.description))}</p>` : ''}
          ${r.adaptations ? `<p>${esc(Array.isArray(r.adaptations) ? r.adaptations.join(', ') : String(r.adaptations))}</p>` : ''}
          ${r.status ? `<p><strong style="color:var(--fg)">Status:</strong> ${esc(String(r.status))}</p>` : ''}
        </div>`;
      } else {
        body += `<div class="card"><p>${esc(String(ra))}</p></div>`;
      }
    });
  }

  // Bias Awareness Profile
  const bias = safeObj(i.bias_awareness_profile);
  if (Object.keys(bias).length) {
    body += renderKeyValueSection(bias, 'Bias & Inclusivity Profile');
  }

  // Learning Context
  const learning = safeObj(i.learning_context);
  if (Object.keys(learning).length) {
    body += renderKeyValueSection(learning, 'Learning Context');
  }

  // Knowledge Entries
  const entries = safeArr(i.knowledge_entries);
  if (entries.length) {
    body += `<h2>Knowledge Base (${entries.length} entries)</h2>`;
    entries.slice(0, 50).forEach((e: any) => {
      body += `<div class="card">
        <div class="card-header">
          <span class="badge badge-${e.type === 'insight' ? 'amber' : e.type === 'learning' ? 'violet' : 'primary'}">${esc(e.type || 'note')}</span>
          ${e.created_at ? `<span style="font-size:11px;color:var(--fg-muted)">${new Date(e.created_at).toLocaleDateString()}</span>` : ''}
        </div>
        <p>${esc(e.content)}</p>
        ${e.category ? `<span style="font-size:11px;color:var(--fg-muted)">${esc(e.category)}</span>` : ''}
        ${e.source ? `<span style="font-size:11px;color:var(--fg-muted);margin-left:8px">Source: ${esc(e.source)}</span>` : ''}
      </div>`;
    });
  }

  // Analysis History
  const history = safeArr(i.analysis_history);
  if (history.length) {
    body += `<h2>Analysis History</h2><table><thead><tr><th>Date</th><th>Type</th><th>Summary</th></tr></thead><tbody>`;
    history.slice(0, 20).forEach((h: any) => {
      if (typeof h === 'object' && h !== null) {
        const entry = h as Record<string, unknown>;
        body += `<tr>
          <td>${entry.date || entry.analyzed_at ? new Date(String(entry.date || entry.analyzed_at)).toLocaleDateString() : '—'}</td>
          <td>${esc(entry.type || entry.analysis_type || '—')}</td>
          <td>${esc(entry.summary || entry.result || '—')}</td>
        </tr>`;
      }
    });
    body += `</tbody></table>`;
  }

  return body;
}

function buildVisibilityAuditBody(audit: any): string {
  if (!audit || audit.status !== 'completed') return '';
  let body = '';

  body += `<h2>Visibility Gap Analysis</h2>`;

  // Scores
  body += `<div class="stat-grid">
    <div class="stat-card">${scoreBar(audit.overall_visibility_score ?? 0, 'Overall Visibility')}</div>
    <div class="stat-card">${scoreBar(audit.search_visibility_score ?? 0, 'Search')}</div>
    <div class="stat-card">${scoreBar(audit.ai_platform_score ?? 0, 'AI Platforms')}</div>
    <div class="stat-card">${scoreBar(audit.social_media_score ?? 0, 'Social / Media')}</div>
  </div>`;

  // Search Analysis
  const search = safeObj(audit.search_analysis);
  if (Object.keys(search).length) {
    body += `<h3>Search Visibility</h3><div class="card">`;
    if (search.seo_health) body += `<p style="color:var(--fg)">${esc(String(search.seo_health))}</p>`;
    const kwGaps = safeArr(search.keyword_gaps);
    if (kwGaps.length) {
      body += `<h4 style="margin-top:12px">Keyword Gaps</h4><table><thead><tr><th>Keyword</th><th>Difficulty</th><th>Impact</th><th>Recommendation</th></tr></thead><tbody>`;
      kwGaps.forEach((kw: any) => {
        body += `<tr><td>${esc(kw.keyword || '')}</td><td>${esc(kw.difficulty || '')}</td><td>${esc(kw.potential_impact || '')}</td><td>${esc(kw.recommendation || '')}</td></tr>`;
      });
      body += `</tbody></table>`;
    }
    const contentGaps = safeArr(search.content_gaps);
    if (contentGaps.length) {
      body += `<h4 style="margin-top:12px">Content Gaps</h4>`;
      body += listHtml(contentGaps.map((c: any) => `${c.topic || ''} (${c.content_type || ''}) — Priority: ${c.priority || ''}`));
    }
    if (safeArr(search.strengths).length) {
      body += `<h4 style="margin-top:12px">Strengths</h4>${listHtml(safeArr(search.strengths), 'list-check')}`;
    }
    if (safeArr(search.technical_issues).length) {
      body += `<h4 style="margin-top:12px">Technical Issues</h4>${listHtml(safeArr(search.technical_issues), 'list-warn')}`;
    }
    body += `</div>`;
  }

  // AI Platform Analysis
  const ai = safeObj(audit.ai_platform_analysis);
  if (Object.keys(ai).length) {
    body += `<h3>AI Platform Presence</h3><div class="card">`;
    if (ai.overall_readiness) body += `<p style="color:var(--fg)">${esc(String(ai.overall_readiness))}</p>`;
    const platforms = safeArr(ai.platforms);
    if (platforms.length) {
      body += `<table><thead><tr><th>Platform</th><th>Presence</th><th>Issues</th><th>Improvements</th></tr></thead><tbody>`;
      platforms.forEach((p: any) => {
        body += `<tr><td>${esc(p.platform || '')}</td><td><span class="badge badge-${p.presence_level === 'strong' ? 'emerald' : p.presence_level === 'moderate' ? 'amber' : 'red'}">${esc(p.presence_level || '')}</span></td><td>${esc(safeArr(p.issues).join(', ') || '—')}</td><td>${esc(safeArr(p.improvements).join(', ') || '—')}</td></tr>`;
      });
      body += `</tbody></table>`;
    }
    if (ai.knowledge_graph_status) body += `<p style="margin-top:8px"><strong style="color:var(--fg)">Knowledge Graph:</strong> ${esc(String(ai.knowledge_graph_status))}</p>`;
    const sdGaps = safeArr(ai.structured_data_gaps);
    if (sdGaps.length) body += `<h4 style="margin-top:12px">Structured Data Gaps</h4>${listHtml(sdGaps, 'list-warn')}`;
    body += `</div>`;
  }

  // Social/Media Analysis
  const social = safeObj(audit.social_media_analysis);
  if (Object.keys(social).length) {
    body += `<h3>Social & Media Visibility</h3><div class="card">`;
    if (social.coverage_assessment) body += `<p style="color:var(--fg)">${esc(String(social.coverage_assessment))}</p>`;
    const platGaps = safeArr(social.platform_gaps);
    if (platGaps.length) {
      body += `<table><thead><tr><th>Platform</th><th>Status</th><th>Opportunity</th><th>Priority</th></tr></thead><tbody>`;
      platGaps.forEach((g: any) => {
        body += `<tr><td>${esc(g.platform || '')}</td><td>${esc(g.status || '')}</td><td>${esc(g.opportunity || '')}</td><td><span class="badge badge-${g.priority === 'high' ? 'red' : g.priority === 'medium' ? 'amber' : 'primary'}">${esc(g.priority || '')}</span></td></tr>`;
      });
      body += `</tbody></table>`;
    }
    if (safeArr(social.media_mention_gaps).length) body += `<h4 style="margin-top:12px">Media Mention Gaps</h4>${listHtml(safeArr(social.media_mention_gaps), 'list-warn')}`;
    if (safeArr(social.competitor_advantages).length) body += `<h4 style="margin-top:12px">Competitor Advantages</h4>${listHtml(safeArr(social.competitor_advantages))}`;
    body += `</div>`;
  }

  // Visibility Gaps
  const gaps = safeArr(audit.visibility_gaps);
  if (gaps.length) {
    body += `<h3>Critical Visibility Gaps</h3>`;
    gaps.forEach((gap: any) => {
      body += `<div class="card">
        <div class="card-header">
          <span class="card-title">${esc(gap.title || '')}</span>
          <span class="badge badge-${gap.severity === 'critical' ? 'red' : gap.severity === 'high' ? 'amber' : 'primary'}">${esc(gap.severity || '')}</span>
        </div>
        <p>${esc(gap.description || '')}</p>
        ${safeArr(gap.action_items).length ? listHtml(safeArr(gap.action_items)) : ''}
        ${gap.estimated_effort ? `<p style="font-size:11px;color:var(--fg-muted)">Effort: ${esc(gap.estimated_effort)}</p>` : ''}
      </div>`;
    });
  }

  // Recommendations
  const recs = safeArr(audit.recommendations);
  if (recs.length) {
    body += `<h3>Visibility Recommendations</h3>`;
    recs.forEach((rec: any) => {
      body += `<div class="card">
        <div class="card-header">
          <span class="card-title">#${rec.priority || '—'} ${esc(rec.title || '')}</span>
          ${rec.impact ? `<span class="badge badge-${rec.impact === 'high' ? 'emerald' : rec.impact === 'medium' ? 'amber' : 'primary'}">${esc(rec.impact)} impact</span>` : ''}
        </div>
        <p>${esc(rec.description || '')}</p>
        ${rec.category ? `<span style="font-size:11px;color:var(--fg-muted)">${esc(rec.category)}</span>` : ''}
        ${rec.effort ? `<span style="font-size:11px;color:var(--fg-muted);margin-left:8px">Effort: ${esc(rec.effort)}</span>` : ''}
      </div>`;
    });
  }

  return body;
}

export function exportBrandIntelligenceHtml(
  intelligence: any,
  options: { entityName: string; entityType: string; visibilityAudit?: any }
) {
  const body = buildBrandIntelligenceBody(intelligence) + buildVisibilityAuditBody(options.visibilityAudit);
  const html = wrapDocument(
    `Brand Intelligence — ${options.entityName}`,
    `${options.entityType} Intelligence Report`,
    body
  );
  const slug = options.entityName.replace(/\s+/g, '-').toLowerCase();
  downloadHtml(html, `brand-intelligence-${slug}.html`);
}

export async function exportBrandIntelligencePdf(
  intelligence: any,
  options: { entityName: string; entityType: string; visibilityAudit?: any }
) {
  const body = buildBrandIntelligenceBody(intelligence) + buildVisibilityAuditBody(options.visibilityAudit);
  const html = wrapDocument(
    `Brand Intelligence — ${options.entityName}`,
    `${options.entityType} Intelligence Report`,
    body
  );

  // Create hidden container
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;top:0;left:0;width:800px;z-index:-1;opacity:0.01;pointer-events:none;';
  container.innerHTML = `<div style="background:#0c0d12;padding:40px 24px;max-width:800px;">${html.replace(/<!DOCTYPE[\s\S]*?<body>/, '').replace(/<\/body>[\s\S]*$/, '')}</div>`;
  document.body.appendChild(container);

  try {
    const { default: html2pdf } = await import('html2pdf.js');
    const slug = options.entityName.replace(/\s+/g, '-').toLowerCase();
    await (html2pdf() as any).set({
      margin: [10, 10, 10, 10],
      filename: `brand-intelligence-${slug}.pdf`,
      image: { type: 'jpeg', quality: 0.75 },
      html2canvas: { scale: 1.5, useCORS: true, backgroundColor: '#0c0d12' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    }).from(container.firstElementChild as HTMLElement).save();
  } finally {
    document.body.removeChild(container);
  }
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

    // Special handling for PI&E recruitment panels
    if (m.key === 'pie_module' && data.touchpoints) {
      Object.entries(data.touchpoints as Record<string, any>).forEach(([tpKey, tp]) => {
        if (!tp || typeof tp !== 'object') return;
        const tpLabel = tpKey.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        body += `<h3>${esc(tpLabel)}</h3>`;
        if (tp.score !== undefined) body += scoreBar(Number(tp.score), tpLabel);
        if (tp.recommendation) body += `<p style="margin:4px 0;font-size:12px"><strong>Recommendation:</strong> ${esc(tp.recommendation)}</p>`;
        
        // Render recruitment panel
        const panel = Array.isArray(tp.recruitment_panel) ? tp.recruitment_panel : [];
        if (panel.length > 0) {
          body += `<p style="font-size:11px;font-weight:600;color:var(--fg-muted);margin:12px 0 4px;text-transform:uppercase">Diverse Recruitment Panel</p>`;
          body += `<table><thead><tr><th>Persona</th><th>Dimension</th><th>Needs</th><th>Curb-Cut Benefit</th><th>Criteria</th></tr></thead><tbody>`;
          panel.forEach((p: any) => {
            body += `<tr>
              <td style="font-weight:600">${esc(p.persona_name || '')}</td>
              <td>${esc((p.dimension || '').replace(/_/g, ' '))}</td>
              <td>${esc(p.needs || '')}</td>
              <td>${esc(p.curb_cut_benefit || '')}</td>
              <td style="font-style:italic">${esc(p.recruitment_criteria || '')}</td>
            </tr>`;
          });
          body += `</tbody></table>`;
        }
      });
      
      // Aggregate summary
      if (data.aggregate_recruitment_summary) {
        const ars = data.aggregate_recruitment_summary;
        body += `<h3>Recruitment Summary</h3>`;
        body += `<p style="margin:4px 0"><strong>Total Personas:</strong> ${ars.total_personas_recommended || 0}</p>`;
        if (Array.isArray(ars.dimensions_missing) && ars.dimensions_missing.length > 0) {
          body += `<p style="margin:4px 0;color:#d97706"><strong>⚠ Missing Dimensions:</strong> ${esc(ars.dimensions_missing.join(', '))}</p>`;
        }
        body += `<p style="margin:4px 0"><strong>Priority:</strong> <span class="badge ${ars.recruitment_priority === 'immediate' ? 'badge-red' : 'badge-amber'}">${esc(ars.recruitment_priority || 'N/A')}</span></p>`;
      }
    } else {
      // Default rendering for other modules
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
    }
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

// ─── Color Lab Research Report ──────────────────────────────
interface ColorLabReportData {
  title: string;
  executiveSummary: string;
  colorTheory: { harmonyType: string; analysis: string; emotionalImpact: string };
  accessibilityAudit: { wcagScore: number; apcaScore: number; colorblindSafety: number; findings: string[] };
  culturalAnalysis: string;
  industryBenchmark: string;
  productionNotes: string;
  recommendations: string[];
  conclusion: string;
}

interface ColorLabColor {
  hex: string;
  name: string;
  hsl?: { h: number; s: number; l: number };
  cmyk?: { c: number; m: number; y: number; k: number };
  pantone?: string;
  pantoneDistance?: number;
  printScore?: number;
  printNotes?: string[];
  inkCoverage?: number;
}

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function colorSwatchesHtml(colors: ColorLabColor[]): string {
  const swatches = colors.map(c => {
    const textColor = isLightColor(c.hex) ? '#111827' : '#ffffff';
    return `<div style="flex:1;min-width:80px;text-align:center;padding:16px 8px;background:${c.hex};color:${textColor};border-radius:var(--radius);font-size:11px;">
      <div style="font-weight:600;margin-bottom:2px;">${esc(c.name)}</div>
      <div style="font-family:monospace;font-size:10px;opacity:0.8;">${c.hex.toUpperCase()}</div>
    </div>`;
  }).join('');
  return `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0;">${swatches}</div>`;
}

function colorDetailsTableHtml(colors: ColorLabColor[]): string {
  const rows = colors.map(c => {
    const hsl = c.hsl ? `hsl(${Math.round(c.hsl.h)}, ${Math.round(c.hsl.s)}%, ${Math.round(c.hsl.l)}%)` : '—';
    const cmyk = c.cmyk ? `C${c.cmyk.c} M${c.cmyk.m} Y${c.cmyk.y} K${c.cmyk.k}` : '—';
    const r = parseInt(c.hex.slice(1, 3), 16);
    const g = parseInt(c.hex.slice(3, 5), 16);
    const b = parseInt(c.hex.slice(5, 7), 16);
    const rgb = `rgb(${r}, ${g}, ${b})`;
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:8px;"><div style="width:20px;height:20px;border-radius:4px;background:${c.hex};border:1px solid var(--border);"></div>${esc(c.name)}</div></td>
      <td style="font-family:monospace;font-size:12px;">${c.hex.toUpperCase()}</td>
      <td style="font-size:12px;">${rgb}</td>
      <td style="font-size:12px;">${hsl}</td>
      <td style="font-size:12px;">${cmyk}</td>
      <td style="font-size:12px;">${esc(c.pantone || '—')}</td>
    </tr>`;
  }).join('');
  return `<table><thead><tr><th>Name</th><th>HEX</th><th>RGB</th><th>HSL</th><th>CMYK</th><th>Pantone</th></tr></thead><tbody>${rows}</tbody></table>`;
}

interface ContrastPairData {
  fg: { hex: string; name: string };
  bg: { hex: string; name: string };
  ratio: number;
}

interface HarmonyData {
  label: string;
  description: string;
  score?: number;
}

function contrastPairsHtml(pairs: ContrastPairData[]): string {
  if (!pairs.length) return '';
  const cards = pairs.slice(0, 6).map(p => {
    const grade = p.ratio >= 7 ? 'AAA' : p.ratio >= 4.5 ? 'AA' : p.ratio >= 3 ? 'AA Large' : 'Fail';
    const gradeClass = p.ratio >= 4.5 ? 'badge-emerald' : p.ratio >= 3 ? 'badge-amber' : 'badge-red';
    return `<div style="border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
      <div style="padding:12px 16px;background:${p.bg.hex};color:${p.fg.hex};display:flex;align-items:center;gap:10px;">
        <span style="font-size:20px;font-weight:700;">Aa</span>
        <span style="font-size:11px;opacity:0.8;">${esc(p.fg.name)} on ${esc(p.bg.name)}</span>
      </div>
      <div style="padding:8px 16px;display:flex;align-items:center;justify-content:space-between;background:var(--bg-muted);">
        <span style="font-size:12px;color:var(--fg-muted);">${p.ratio.toFixed(2)}:1</span>
        <span class="badge ${gradeClass}">${grade}</span>
      </div>
    </div>`;
  }).join('');
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">${cards}</div>`;
}

function psychologyHtml(colors: ColorLabColor[], psychologyMap: Map<string, string[]>): string {
  const cards = colors.map(c => {
    const traits = psychologyMap.get(c.hex) || [];
    const textColor = isLightColor(c.hex) ? '#111827' : '#ffffff';
    const badges = traits.map(t => `<span class="badge" style="background:var(--bg-muted);color:var(--fg-muted);font-size:10px;">${esc(t)}</span>`).join('');
    return `<div style="border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">
      <div style="height:32px;background:${c.hex};display:flex;align-items:center;padding:0 12px;">
        <span style="font-size:11px;font-weight:600;color:${textColor};">${esc(c.name)}</span>
      </div>
      <div style="padding:8px 12px;display:flex;flex-wrap:wrap;gap:4px;">${badges}</div>
    </div>`;
  }).join('');
  return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;">${cards}</div>`;
}

function contrastMatrixHtml(colors: ColorLabColor[]): string {
  if (colors.length < 2 || colors.length > 8) return '';
  const header = colors.map(c => 
    `<th style="padding:6px;text-align:center;"><div style="width:20px;height:20px;border-radius:4px;background:${c.hex};border:1px solid var(--border);margin:0 auto 4px;"></div><span style="font-size:9px;">${esc(c.name.slice(0,8))}</span></th>`
  ).join('');
  const rows = colors.map((row, i) => {
    const cells = colors.map((col, j) => {
      if (i === j) return `<td style="padding:6px;text-align:center;background:var(--bg);font-size:10px;color:var(--fg-muted);">—</td>`;
      const r = parseInt(row.hex.slice(1, 3), 16) * 299 + parseInt(row.hex.slice(3, 5), 16) * 587 + parseInt(row.hex.slice(5, 7), 16) * 114;
      const ratio = (() => {
        const lum1 = [parseInt(row.hex.slice(1, 3), 16), parseInt(row.hex.slice(3, 5), 16), parseInt(row.hex.slice(5, 7), 16)].map(c => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
        const lum2 = [parseInt(col.hex.slice(1, 3), 16), parseInt(col.hex.slice(3, 5), 16), parseInt(col.hex.slice(5, 7), 16)].map(c => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
        const l1 = 0.2126 * lum1[0] + 0.7152 * lum1[1] + 0.0722 * lum1[2];
        const l2 = 0.2126 * lum2[0] + 0.7152 * lum2[1] + 0.0722 * lum2[2];
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      })();
      const color = ratio >= 7 ? 'var(--emerald)' : ratio >= 4.5 ? 'var(--primary)' : ratio >= 3 ? 'var(--amber)' : 'var(--red)';
      return `<td style="padding:6px;text-align:center;font-size:11px;font-weight:600;color:${color};">${ratio.toFixed(1)}</td>`;
    }).join('');
    return `<tr><td style="padding:6px;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:16px;height:16px;border-radius:3px;background:${row.hex};border:1px solid var(--border);"></div><span style="font-size:10px;">${esc(row.name.slice(0,10))}</span></div></td>${cells}</tr>`;
  }).join('');
  return `<table style="width:100%;border-collapse:collapse;"><thead><tr><th></th>${header}</tr></thead><tbody>${rows}</tbody></table>
  <div style="display:flex;gap:16px;margin-top:8px;font-size:10px;color:var(--fg-muted);">
    <span><span style="color:var(--emerald);font-weight:600;">●</span> AAA ≥7:1</span>
    <span><span style="color:var(--primary);font-weight:600;">●</span> AA ≥4.5:1</span>
    <span><span style="color:var(--amber);font-weight:600;">●</span> AA Large ≥3:1</span>
    <span><span style="color:var(--red);font-weight:600;">●</span> Fail</span>
  </div>`;
}

function scoreRingSvg(score: number, label: string, size = 80): string {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'var(--emerald)' : score >= 60 ? 'var(--amber)' : 'var(--red)';
  return `<div style="text-align:center;">
    <svg width="${size}" height="${size}" style="transform:rotate(-90deg);">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--bg-muted)" stroke-width="4"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
    </svg>
    <div style="margin-top:-${size - 8}px;height:${size - 8}px;display:flex;align-items:center;justify-content:center;">
      <span style="font-size:20px;font-weight:700;color:${color};">${score}%</span>
    </div>
    <div style="font-size:10px;color:var(--fg-muted);text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">${label}</div>
  </div>`;
}

export function exportColorLabReportHtml(
  report: ColorLabReportData,
  colors: ColorLabColor[],
  contrastPairs?: ContrastPairData[],
  psychologyMap?: Map<string, string[]>,
  harmony?: HarmonyData
): void {
  // Palette strip (full-width gradient-like)
  const paletteStrip = `<div style="display:flex;border-radius:12px;overflow:hidden;height:64px;margin:20px 0;border:1px solid var(--border);">
    ${colors.map(c => {
      const textColor = isLightColor(c.hex) ? '#111827' : '#ffffff';
      return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:${c.hex};color:${textColor};transition:flex 0.2s;">
        <span style="font-size:10px;font-weight:600;">${esc(c.name)}</span>
        <span style="font-size:9px;opacity:0.7;font-family:monospace;">${c.hex.toUpperCase()}</span>
      </div>`;
    }).join('')}
  </div>`;

  // Score rings
  const scoreSection = `<div class="three-col" style="margin:24px 0;">
    ${scoreRingSvg(report.accessibilityAudit.wcagScore, 'WCAG 2.2', 88)}
    ${scoreRingSvg(report.accessibilityAudit.apcaScore, 'APCA', 88)}
    ${scoreRingSvg(report.accessibilityAudit.colorblindSafety, 'Colorblind Safety', 88)}
  </div>`;

  // Harmony badge
  const harmonyBadge = harmony
    ? `<div class="card" style="display:flex;align-items:center;gap:12px;padding:14px 20px;">
        <span class="badge badge-violet">${esc(harmony.label)}</span>
        <span style="font-size:12px;color:var(--fg-muted);">${esc(harmony.description)}</span>
      </div>`
    : '';

  // Psychology section
  const psychSection = psychologyMap && psychologyMap.size > 0
    ? `<h2>🧠 Color Psychology</h2>${psychologyHtml(colors, psychologyMap)}`
    : '';

  // Contrast pairs
  const contrastSection = contrastPairs && contrastPairs.length > 0
    ? `<h2>🔤 Best Contrast Pairs</h2>${contrastPairsHtml(contrastPairs)}`
    : '';

  // Contrast matrix
  const matrixSection = colors.length >= 2 && colors.length <= 8
    ? `<h2>📊 Contrast Matrix</h2><div class="card">${contrastMatrixHtml(colors)}</div>`
    : '';

  // Print production analysis
  const printCards = colors.map(c => {
    const ink = c.inkCoverage ?? (c.cmyk ? c.cmyk.c + c.cmyk.m + c.cmyk.y + c.cmyk.k : 0);
    const ps = c.printScore ?? 100;
    const statusBadge = ps >= 80 ? 'badge-emerald' : ps >= 50 ? 'badge-amber' : 'badge-red';
    const statusLabel = ps >= 80 ? 'Print-Ready' : ps >= 50 ? 'Caution' : 'Review';
    return `<div style="display:flex;gap:14px;align-items:flex-start;padding:14px;background:var(--bg-muted);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:8px;">
      <div style="width:40px;height:40px;border-radius:8px;background:${c.hex};border:1px solid var(--border);flex-shrink:0;"></div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <strong style="font-size:13px;">${esc(c.name)}</strong>
          <span class="badge ${statusBadge}">${statusLabel}</span>
        </div>
        <p style="font-size:11px;margin:2px 0;color:var(--fg-muted);">
          Ink: <strong>${ink}%</strong>${ink > 300 ? ' ⚠️' : ''} · Pantone: ${esc(c.pantone || '—')} (ΔE≈${c.pantoneDistance ?? '?'}) · Score: <strong>${ps}/100</strong>
        </p>
        ${(c.printNotes && c.printNotes.length > 0) ? `<p style="font-size:10px;color:var(--fg-muted);margin-top:4px;">${c.printNotes.map(n => `• ${esc(n)}`).join(' ')}</p>` : ''}
      </div>
    </div>`;
  }).join('');

  // Recommendations as numbered cards
  const recsHtml = safeArr(report.recommendations).map((r, i) => 
    `<div style="display:flex;gap:12px;align-items:flex-start;padding:12px;background:var(--bg-muted);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:8px;">
      <div style="width:28px;height:28px;border-radius:50%;background:var(--primary-soft);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <span style="font-size:11px;font-weight:700;color:var(--primary);">${i + 1}</span>
      </div>
      <p style="font-size:13px;color:var(--fg-muted);margin:0;padding-top:4px;">${esc(r)}</p>
    </div>`
  ).join('');

  const body = `
    ${paletteStrip}
    ${scoreSection}
    ${harmonyBadge}

    <h2>📝 Executive Summary</h2>
    <div class="card" style="border-left:3px solid var(--primary);"><p>${esc(report.executiveSummary)}</p></div>

    ${psychSection}

    <h2>🎨 Color Theory Analysis</h2>
    <div class="card">
      <div class="card-header"><span class="badge badge-primary">${esc(report.colorTheory.harmonyType)}</span></div>
      <p>${esc(report.colorTheory.analysis)}</p>
      <div style="margin-top:12px;padding:12px;background:var(--bg-muted);border-radius:8px;">
        <h3 style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:var(--fg-muted);margin:0 0 6px;">Emotional Impact</h3>
        <p style="margin:0;">${esc(report.colorTheory.emotionalImpact)}</p>
      </div>
    </div>

    ${contrastSection}
    ${matrixSection}

    <h2>♿ Accessibility Findings</h2>
    <div class="card">${listHtml(safeArr(report.accessibilityAudit.findings), 'list-warn')}</div>

    <h2>🌍 Cultural Analysis</h2>
    <div class="card"><p>${esc(report.culturalAnalysis)}</p></div>

    <h2>📊 Industry Benchmark</h2>
    <div class="card"><p>${esc(report.industryBenchmark)}</p></div>

    <h2>🏭 Production Notes</h2>
    <div class="card"><p>${esc(report.productionNotes)}</p></div>

    <h2>🖨️ Print Production Analysis</h2>
    <div class="card">${printCards}</div>

    <h2>💡 Strategic Recommendations</h2>
    <div class="card">${recsHtml}</div>

    <h2>🔚 Conclusion</h2>
    <div class="card" style="border:1px dashed var(--border);"><p>${esc(report.conclusion)}</p></div>

    <h2>📋 Color Specifications</h2>
    <div class="card">${colorDetailsTableHtml(colors)}</div>
  `;

  const html = wrapDocument(
    report.title,
    `${colors.length} Colors · Color Lab Research Report`,
    body
  );
  downloadHtml(html, `color-lab-report-${Date.now()}.html`);
}

export async function exportColorLabReportPdf(
  report: ColorLabReportData,
  colors: ColorLabColor[]
): Promise<void> {
  const { default: html2pdf } = await import('html2pdf.js');

  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed', top: '0', left: '0', width: '750px',
    zIndex: '-1', opacity: '0.01', pointerEvents: 'none',
    background: '#ffffff', color: '#111827', fontFamily: "'Segoe UI', system-ui, sans-serif",
    padding: '40px', lineHeight: '1.6', overflow: 'visible',
  });

  const sc = (score: number) => score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
  const textColor = (hex: string) => isLightColor(hex) ? '#111827' : '#ffffff';

  const swatches = colors.map(c => `
    <div style="flex:1;min-width:70px;text-align:center;padding:14px 6px;background:${c.hex};color:${textColor(c.hex)};border-radius:8px;font-size:10px;">
      <div style="font-weight:600;">${c.name}</div>
      <div style="font-family:monospace;font-size:9px;opacity:0.8;">${c.hex.toUpperCase()}</div>
    </div>
  `).join('');

  const colorRows = colors.map(c => {
    const hsl = c.hsl ? `hsl(${Math.round(c.hsl.h)}, ${Math.round(c.hsl.s)}%, ${Math.round(c.hsl.l)}%)` : '—';
    const cmyk = c.cmyk ? `C${c.cmyk.c} M${c.cmyk.m} Y${c.cmyk.y} K${c.cmyk.k}` : '—';
    const r = parseInt(c.hex.slice(1, 3), 16);
    const g = parseInt(c.hex.slice(3, 5), 16);
    const b = parseInt(c.hex.slice(5, 7), 16);
    const rgb = `rgb(${r}, ${g}, ${b})`;
    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:16px;height:16px;border-radius:3px;background:${c.hex};border:1px solid #e5e7eb;"></div>${c.name}</div></td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:11px;">${c.hex.toUpperCase()}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:11px;">${rgb}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:11px;">${hsl}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:11px;">${cmyk}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:11px;">${c.pantone || '—'}</td>
    </tr>`;
  }).join('');

  // Individual color detail cards with all codes + print production
  const colorDetailCards = colors.map(c => {
    const hsl = c.hsl ? `hsl(${Math.round(c.hsl.h)}, ${Math.round(c.hsl.s)}%, ${Math.round(c.hsl.l)}%)` : '—';
    const cmyk = c.cmyk ? `C${c.cmyk.c} M${c.cmyk.m} Y${c.cmyk.y} K${c.cmyk.k}` : '—';
    const r = parseInt(c.hex.slice(1, 3), 16);
    const g = parseInt(c.hex.slice(3, 5), 16);
    const b = parseInt(c.hex.slice(5, 7), 16);
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const inkCov = c.inkCoverage ?? (c.cmyk ? c.cmyk.c + c.cmyk.m + c.cmyk.y + c.cmyk.k : 0);
    const printSc = c.printScore ?? 100;
    const printColor = printSc >= 80 ? '#22c55e' : printSc >= 50 ? '#eab308' : '#ef4444';
    const inkColor = inkCov > 300 ? '#ef4444' : inkCov > 280 ? '#eab308' : '#22c55e';
    const row = (label: string, val: string, color?: string) => `
      <tr>
        <td style="padding:4px 8px;font-size:10px;color:#6b7280;font-weight:600;border:none;width:80px;">${label}</td>
        <td style="padding:4px 8px;font-size:11px;font-family:monospace;border:none;${color ? `color:${color};font-weight:600;` : ''}">${val}</td>
      </tr>`;
    const printNotesHtml = (c.printNotes && c.printNotes.length > 0)
      ? c.printNotes.map(n => `<div style="font-size:10px;color:#6b7280;padding:2px 0;">• ${n}</div>`).join('')
      : '<div style="font-size:10px;color:#22c55e;padding:2px 0;">✓ No issues detected</div>';
    return `
      <div style="page-break-inside:avoid;display:flex;gap:16px;align-items:flex-start;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:10px;">
        <div style="width:60px;height:60px;border-radius:8px;background:${c.hex};border:1px solid #e5e7eb;flex-shrink:0;"></div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:14px;color:#111827;margin-bottom:4px;">${c.name}</div>
          <table style="width:100%;border-collapse:collapse;">
            ${row('HEX', c.hex.toUpperCase())}
            ${row('RGB', rgb)}
            ${row('HSL', hsl)}
            ${row('CMYK', cmyk)}
            ${row('Ink %', `${inkCov}%${inkCov > 300 ? ' ⚠ OVER LIMIT' : ''}`, inkColor)}
            ${row('Pantone', `${c.pantone || '—'} (ΔE ≈ ${c.pantoneDistance ?? '?'})`)}
            ${row('Print', `${printSc}/100`, printColor)}
          </table>
          <div style="margin-top:6px;border-top:1px solid #e5e7eb;padding-top:6px;">
            <div style="font-size:9px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Print Notes</div>
            ${printNotesHtml}
          </div>
        </div>
      </div>`;
  }).join('');

  // Print Production Summary
  const avgPrintScore = colors.length > 0
    ? Math.round(colors.reduce((sum, c) => sum + (c.printScore ?? 100), 0) / colors.length)
    : 0;
  const gamutWarnings = colors.filter(c => (c.inkCoverage ?? 0) > 300).length;
  const lowPantoneAccuracy = colors.filter(c => (c.pantoneDistance ?? 0) > 15).length;
  const printReadyCount = colors.filter(c => (c.printScore ?? 100) >= 80).length;

  const printSummaryHtml = `
    <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
      <div style="flex:1;min-width:120px;text-align:center;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
        <div style="font-size:24px;font-weight:700;color:${sc(avgPrintScore)};">${avgPrintScore}%</div>
        <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Avg Print Score</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
        <div style="font-size:24px;font-weight:700;color:${printReadyCount === colors.length ? '#22c55e' : '#eab308'};">${printReadyCount}/${colors.length}</div>
        <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Print-Ready</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
        <div style="font-size:24px;font-weight:700;color:${gamutWarnings > 0 ? '#ef4444' : '#22c55e'};">${gamutWarnings}</div>
        <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Gamut Warnings</div>
      </div>
      <div style="flex:1;min-width:120px;text-align:center;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
        <div style="font-size:24px;font-weight:700;color:${lowPantoneAccuracy > 0 ? '#eab308' : '#22c55e'};">${lowPantoneAccuracy}</div>
        <div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">Low Pantone Match</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead><tr>
        <th style="padding:8px;border-bottom:2px solid #e5e7eb;font-size:10px;color:#6b7280;text-transform:uppercase;text-align:left;">Color</th>
        <th style="padding:8px;border-bottom:2px solid #e5e7eb;font-size:10px;color:#6b7280;text-transform:uppercase;text-align:left;">Ink Coverage</th>
        <th style="padding:8px;border-bottom:2px solid #e5e7eb;font-size:10px;color:#6b7280;text-transform:uppercase;text-align:left;">Pantone (ΔE)</th>
        <th style="padding:8px;border-bottom:2px solid #e5e7eb;font-size:10px;color:#6b7280;text-transform:uppercase;text-align:left;">Print Score</th>
        <th style="padding:8px;border-bottom:2px solid #e5e7eb;font-size:10px;color:#6b7280;text-transform:uppercase;text-align:left;">Status</th>
      </tr></thead>
      <tbody>${colors.map(c => {
        const ink = c.inkCoverage ?? 0;
        const ps = c.printScore ?? 100;
        const status = ps >= 80 ? '✓ Ready' : ps >= 50 ? '⚠ Caution' : '✕ Review';
        const statusColor = ps >= 80 ? '#22c55e' : ps >= 50 ? '#eab308' : '#ef4444';
        return `<tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;"><div style="display:flex;align-items:center;gap:6px;"><div style="width:14px;height:14px;border-radius:3px;background:${c.hex};border:1px solid #e5e7eb;"></div>${c.name}</div></td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:${ink > 300 ? '#ef4444' : '#374151'};font-weight:${ink > 300 ? '600' : '400'};">${ink}%</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${c.pantone || '—'} (${c.pantoneDistance ?? '?'})</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:${statusColor};font-weight:600;">${ps}/100</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;color:${statusColor};font-weight:600;">${status}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>
  `;

  const findings = report.accessibilityAudit.findings.map(f => `<li style="padding:4px 0;font-size:12px;color:#374151;">${f}</li>`).join('');
  const recs = report.recommendations.map((r, i) => `<li style="padding:4px 0;font-size:12px;color:#374151;"><strong>${i + 1}.</strong> ${r}</li>`).join('');

  const statCard = (label: string, value: number) => `
    <div style="flex:1;text-align:center;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
      <div style="font-size:28px;font-weight:700;color:${sc(value)};">${value}%</div>
      <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;">${label}</div>
    </div>`;

  const section = (title: string, content: string) => `
    <div style="page-break-inside:avoid;margin-top:24px;">
      <h2 style="font-size:16px;font-weight:600;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-bottom:12px;">${title}</h2>
      ${content}
    </div>`;

  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  container.innerHTML = `
    <h1 style="font-size:24px;font-weight:700;color:#111827;margin-bottom:4px;">${report.title}</h1>
    <p style="font-size:12px;color:#6b7280;margin-bottom:24px;">${colors.length} Colors · Generated ${now}</p>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;">${swatches}</div>

    <div style="display:flex;gap:12px;margin-bottom:24px;">
      ${statCard('WCAG', report.accessibilityAudit.wcagScore)}
      ${statCard('APCA', report.accessibilityAudit.apcaScore)}
      ${statCard('CB Safe', report.accessibilityAudit.colorblindSafety)}
    </div>

    ${section('Executive Summary', `<p style="font-size:13px;color:#374151;">${report.executiveSummary}</p>`)}

    ${section('Color Theory — ' + report.colorTheory.harmonyType, `
      <p style="font-size:13px;color:#374151;">${report.colorTheory.analysis}</p>
      <p style="font-size:13px;color:#374151;margin-top:8px;"><strong>Emotional Impact:</strong> ${report.colorTheory.emotionalImpact}</p>
    `)}

    ${section('Accessibility Findings', `<ul style="list-style:none;padding:0;">${findings}</ul>`)}

    ${section('Cultural Analysis', `<p style="font-size:13px;color:#374151;">${report.culturalAnalysis}</p>`)}

    ${section('Industry Benchmark', `<p style="font-size:13px;color:#374151;">${report.industryBenchmark}</p>`)}

    ${section('Production Notes', `<p style="font-size:13px;color:#374151;">${report.productionNotes}</p>`)}

    ${section('🖨️ Print Production Analysis', printSummaryHtml)}

    ${section('Strategic Recommendations', `<ol style="list-style:none;padding:0;">${recs}</ol>`)}

    ${section('Conclusion', `<p style="font-size:13px;color:#374151;">${report.conclusion}</p>`)}

    ${section('Color Specifications', `
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr>
          <th style="padding:8px;border-bottom:2px solid #e5e7eb;font-size:10px;color:#6b7280;text-transform:uppercase;text-align:left;">Name</th>
          <th style="padding:8px;border-bottom:2px solid #e5e7eb;font-size:10px;color:#6b7280;text-transform:uppercase;text-align:left;">HEX</th>
          <th style="padding:8px;border-bottom:2px solid #e5e7eb;font-size:10px;color:#6b7280;text-transform:uppercase;text-align:left;">RGB</th>
          <th style="padding:8px;border-bottom:2px solid #e5e7eb;font-size:10px;color:#6b7280;text-transform:uppercase;text-align:left;">HSL</th>
          <th style="padding:8px;border-bottom:2px solid #e5e7eb;font-size:10px;color:#6b7280;text-transform:uppercase;text-align:left;">CMYK</th>
          <th style="padding:8px;border-bottom:2px solid #e5e7eb;font-size:10px;color:#6b7280;text-transform:uppercase;text-align:left;">Pantone</th>
        </tr></thead>
        <tbody>${colorRows}</tbody>
      </table>
    `)}

    ${section('Palette Color Details', colorDetailCards)}

    <div style="text-align:center;color:#9ca3af;font-size:10px;margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;">
      Generated by BrandHub Color Lab · ${now}
    </div>
  `;

  document.body.appendChild(container);

  // Allow DOM to render before capturing
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `color-lab-report-${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.75 },
      html2canvas: { scale: 1.5, useCORS: true, logging: false, backgroundColor: '#ffffff', windowWidth: 750 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    } as any).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
}
