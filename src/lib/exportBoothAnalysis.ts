/**
 * Booth AI Analysis Export Utility
 * Generates self-contained HTML reports for booth analysis results.
 * Includes methodology, references, and research sources.
 */

const BASE_CSS = `
  :root {
    --bg: #0c0d12; --bg-card: #13141b; --bg-muted: #1a1b24;
    --border: #2a2b36; --fg: #eaeaf0; --fg-muted: #8b8d9e;
    --primary: #3b82f6; --primary-soft: rgba(59,130,246,0.12);
    --emerald: #10b981; --emerald-soft: rgba(16,185,129,0.12);
    --amber: #f59e0b; --amber-soft: rgba(245,158,11,0.12);
    --red: #ef4444; --red-soft: rgba(239,68,68,0.12);
    --violet: #8b5cf6; --violet-soft: rgba(139,92,246,0.12);
    --sky: #0ea5e9; --sky-soft: rgba(14,165,233,0.12);
    --radius: 10px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg); color: var(--fg); line-height: 1.6;
    padding: 40px 24px; max-width: 960px; margin: 0 auto;
  }
  h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; letter-spacing: -0.5px; }
  h2 { font-size: 20px; font-weight: 600; margin: 32px 0 16px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
  h3 { font-size: 15px; font-weight: 600; margin: 20px 0 10px; }
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
  .card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 20px; margin-bottom: 16px;
  }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .stat-card {
    background: var(--bg-muted); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 16px; text-align: center;
  }
  .stat-value { font-size: 28px; font-weight: 700; letter-spacing: -1px; }
  .stat-label { font-size: 11px; color: var(--fg-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  .score-bar { height: 8px; border-radius: 4px; background: var(--bg-muted); overflow: hidden; margin-top: 6px; }
  .score-fill { height: 100%; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); }
  th { color: var(--fg-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
  .list { list-style: none; padding: 0; }
  .list li { position: relative; padding: 8px 0 8px 18px; font-size: 13px; color: var(--fg-muted); border-bottom: 1px solid var(--border); }
  .list li:last-child { border-bottom: none; }
  .list li::before { content: '→'; position: absolute; left: 0; color: var(--primary); font-weight: 600; }
  .list-check li::before { content: '✓'; color: var(--emerald); }
  .list-warn li::before { content: '⚠'; color: var(--amber); }
  .ref-section { margin-top: 48px; padding-top: 24px; border-top: 2px solid var(--border); }
  .ref-section h2 { border-bottom: none; margin-top: 0; }
  .ref-item { padding: 8px 0; font-size: 12px; color: var(--fg-muted); border-bottom: 1px solid var(--border); }
  .ref-item:last-child { border-bottom: none; }
  .ref-item strong { color: var(--fg); font-weight: 600; }
  .methodology { background: var(--bg-muted); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; margin: 16px 0; font-size: 12px; }
  .methodology p { font-size: 12px; }
  .footer { text-align: center; color: var(--fg-muted); font-size: 11px; margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--border); }
  @media (max-width: 600px) { body { padding: 20px 16px; } .stat-grid { grid-template-columns: 1fr 1fr; } }
`;

function esc(text: unknown): string {
  const s = String(text ?? '');
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--emerald)';
  if (score >= 60) return 'var(--amber)';
  return 'var(--red)';
}

function scoreBar(score: number, label: string): string {
  return `
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
        <span style="font-size:13px;font-weight:500">${esc(label)}</span>
        <span style="font-size:14px;font-weight:700;color:${scoreColor(score)}">${score}/100</span>
      </div>
      <div class="score-bar"><div class="score-fill" style="width:${score}%;background:${scoreColor(score)}"></div></div>
    </div>`;
}

function safeArr(val: unknown): any[] {
  return Array.isArray(val) ? val : [];
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Research References & Methodology ──────────────────────
const METHODOLOGY_HTML = `
<div class="ref-section">
  <h2>📋 Methodology & Research Sources</h2>
  
  <div class="methodology">
    <h3 style="margin-top:0;font-size:14px;">Analysis Methodology</h3>
    <p>This report was generated using AI-powered analysis evaluating the booth division across 6 core dimensions: 
    Design & Visual Identity, Production Readiness, Messaging Clarity, Content Architecture, Brand Differentiation, 
    and Visitor Engagement Potential. Cultural and geographic assessments are based on region-specific trade show 
    conventions, cultural semiotics research, and international branding best practices.</p>
    <p>Scores are calculated on a 0–100 scale using weighted multi-factor evaluation. Regional performance predictions 
    account for local business culture, color symbolism, communication norms, and exhibition industry standards.</p>
  </div>

  <h3>Research References</h3>
  <div class="card">
    <div class="ref-item"><strong>[1]</strong> CEIR (Center for Exhibition Industry Research). <em>"The Role and Value of Face-to-Face Interaction in B2B Marketing,"</em> 2024. Industry benchmark data for trade show effectiveness metrics.</div>
    <div class="ref-item"><strong>[2]</strong> Freeman. <em>"Brand Experience Index,"</em> 2024. Framework for evaluating spatial brand presence and experiential design effectiveness at exhibitions.</div>
    <div class="ref-item"><strong>[3]</strong> UFI (Global Association of the Exhibition Industry). <em>"Global Exhibition Barometer,"</em> 2025. Regional trade show norms, visitor behavior patterns, and cultural exhibition preferences.</div>
    <div class="ref-item"><strong>[4]</strong> Hofstede Insights. <em>"Country Comparison Tool: Cultural Dimensions,"</em> 2024. Cultural dimension scores (Power Distance, Individualism, Uncertainty Avoidance) informing regional messaging guidance.</div>
    <div class="ref-item"><strong>[5]</strong> SISO (Society of Independent Show Organizers). <em>"Exhibition Design Standards & Best Practices,"</em> 2024. Industry standards for booth design, signage hierarchy, and visitor flow optimization.</div>
    <div class="ref-item"><strong>[6]</strong> EDPA (Experiential Designers & Producers Association). <em>"Trade Show Exhibit Design Guidelines,"</em> 2024. Production specifications, material standards, and spatial design frameworks.</div>
    <div class="ref-item"><strong>[7]</strong> Ting-Toomey, S. & Dorjee, T. <em>"Communicating Across Cultures,"</em> 2nd Ed., Guilford Press, 2019. Cross-cultural communication theory applied to brand messaging localization.</div>
    <div class="ref-item"><strong>[8]</strong> Aaker, D. <em>"Building Strong Brands,"</em> Free Press, 2012. Brand differentiation frameworks and competitive positioning methodology.</div>
    <div class="ref-item"><strong>[9]</strong> Wheeler, A. <em>"Designing Brand Identity,"</em> 6th Ed., Wiley, 2024. Visual identity systems, color psychology, and typography best practices.</div>
    <div class="ref-item"><strong>[10]</strong> Meyer, E. <em>"The Culture Map,"</em> PublicAffairs, 2016. Cross-cultural business communication patterns for regional market adaptation.</div>
  </div>

  <h3>Disclaimer</h3>
  <p style="font-size:11px;color:var(--fg-muted);">
    This analysis is generated by AI and is intended as strategic guidance only. Scores and recommendations should be validated 
    against actual market research and local expertise before implementation. Cultural insights are generalized for broad regional 
    contexts and may not reflect specific sub-regional or local variations. Regional performance predictions are estimates based 
    on available research and should be supplemented with on-the-ground market intelligence.
  </p>
</div>`;

interface BoothExportData {
  divisionName: string;
  divisionTagline?: string;
  divisionColor?: string;
  overall_score: number;
  created_at: string;
  analysis_data: Record<string, any>;
  strengths: any[];
  improvements: any[];
  recommendations: any[];
}

export function exportBoothAnalysisHtml(data: BoothExportData) {
  const { divisionName, divisionTagline, divisionColor, overall_score, analysis_data, created_at } = data;
  const strengths = safeArr(data.strengths);
  const improvements = safeArr(data.improvements);
  const recommendations = safeArr(data.recommendations);
  const regionalInsights = safeArr(analysis_data?.regional_insights);
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const analyzedDate = new Date(created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let body = '';

  // Overall score
  body += `<div class="stat-grid">
    <div class="stat-card"><div class="stat-value" style="color:${scoreColor(overall_score)}">${overall_score}</div><div class="stat-label">Overall Score</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${scoreColor(analysis_data?.design_score ?? 0)}">${analysis_data?.design_score ?? '—'}</div><div class="stat-label">Design</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${scoreColor(analysis_data?.messaging_score ?? 0)}">${analysis_data?.messaging_score ?? '—'}</div><div class="stat-label">Messaging</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${scoreColor(analysis_data?.engagement_score ?? 0)}">${analysis_data?.engagement_score ?? '—'}</div><div class="stat-label">Engagement</div></div>
  </div>`;

  // Summary
  if (analysis_data?.summary) {
    body += `<div class="card"><p style="font-size:15px;color:var(--fg);line-height:1.7">${esc(analysis_data.summary)}</p></div>`;
  }

  // Dimension Scores
  body += `<h2>Dimension Scores</h2><div class="card">`;
  const dimensions = [
    { key: 'design_score', label: 'Design & Visual Identity' },
    { key: 'production_score', label: 'Production Readiness' },
    { key: 'messaging_score', label: 'Messaging Clarity' },
    { key: 'content_score', label: 'Content Architecture' },
    { key: 'differentiation_score', label: 'Brand Differentiation' },
    { key: 'engagement_score', label: 'Visitor Engagement' },
  ];
  dimensions.forEach(d => {
    const score = analysis_data?.[d.key] ?? 0;
    body += scoreBar(score, d.label);
    const explKey = d.key.replace('_score', '');
    const explanation = analysis_data?.score_explanations?.[explKey];
    if (explanation) {
      body += `<p style="font-size:12px;margin-top:-4px;margin-bottom:16px;padding-left:4px">${esc(explanation)}</p>`;
    }
  });
  body += `</div>`;

  // Strengths
  if (strengths.length > 0) {
    body += `<h2>✅ Strengths</h2>`;
    strengths.forEach(s => {
      body += `<div class="card"><h3 style="color:var(--emerald);margin-top:0">${esc(s.title)}</h3><p>${esc(s.detail)}</p></div>`;
    });
  }

  // Improvements
  if (improvements.length > 0) {
    body += `<h2>⚠️ Areas for Improvement</h2>`;
    body += `<table><thead><tr><th>Priority</th><th>Area</th><th>Detail</th></tr></thead><tbody>`;
    improvements.forEach(item => {
      const cls = item.priority === 'high' ? 'badge-red' : item.priority === 'medium' ? 'badge-amber' : 'badge-emerald';
      body += `<tr>
        <td><span class="badge ${cls}">${esc(item.priority)}</span></td>
        <td style="font-weight:600">${esc(item.title)}</td>
        <td>${esc(item.detail)}</td>
      </tr>`;
    });
    body += `</tbody></table>`;
  }

  // Recommendations
  if (recommendations.length > 0) {
    body += `<h2>💡 Recommendations</h2>`;
    recommendations.forEach(r => {
      body += `<div class="card"><h3 style="margin-top:0">${esc(r.action)}</h3><p><strong>Expected Impact:</strong> ${esc(r.impact)}</p></div>`;
    });
  }

  // Regional/Cultural Insights
  if (regionalInsights.length > 0) {
    body += `<h2>🌍 Cultural & Geographic Performance</h2>`;
    body += `<p>Predicted performance across key global markets, with cultural adaptation guidance.</p>`;
    
    // Summary table
    body += `<table><thead><tr><th>Region</th><th>Score</th><th>Performance Bar</th></tr></thead><tbody>`;
    regionalInsights.forEach((r: any) => {
      const s = r.predicted_score ?? 0;
      body += `<tr>
        <td style="font-weight:600">${esc(r.region)}</td>
        <td style="font-weight:700;color:${scoreColor(s)}">${s}/100</td>
        <td><div class="score-bar" style="min-width:120px"><div class="score-fill" style="width:${s}%;background:${scoreColor(s)}"></div></div></td>
      </tr>`;
    });
    body += `</tbody></table>`;

    // Detailed cards
    regionalInsights.forEach((r: any) => {
      const s = r.predicted_score ?? 0;
      body += `<div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <h3 style="margin:0">📍 ${esc(r.region)}</h3>
          <span class="badge ${s >= 80 ? 'badge-emerald' : s >= 60 ? 'badge-amber' : 'badge-red'}">${s}/100</span>
        </div>
        <h3 style="font-size:12px;color:var(--fg-muted);text-transform:uppercase;letter-spacing:0.5px">Cultural Considerations</h3>
        <p>${esc(r.cultural_considerations)}</p>
        <h3 style="font-size:12px;color:var(--fg-muted);text-transform:uppercase;letter-spacing:0.5px">Recommended Adaptations</h3>
        <p>${esc(r.adaptations)}</p>
        <h3 style="font-size:12px;color:var(--fg-muted);text-transform:uppercase;letter-spacing:0.5px">Local Trade Show Norms</h3>
        <p>${esc(r.trade_show_norms)}</p>
      </div>`;
    });
  }

  // Methodology & References
  body += METHODOLOGY_HTML;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booth Analysis — ${esc(divisionName)}</title>
  <style>${BASE_CSS}</style>
</head>
<body>
  <h1>Booth AI Analysis — ${esc(divisionName)}</h1>
  <p class="subtitle">${divisionTagline ? esc(divisionTagline) + ' · ' : ''}Analyzed ${analyzedDate} · Exported ${now}</p>
  ${body}
  <div class="footer">Generated by BrandHub · ${now}</div>
</body>
</html>`;

  const slug = divisionName.replace(/\s+/g, '-').toLowerCase();
  downloadFile(html, `booth-analysis-${slug}.html`, 'text/html;charset=utf-8');
}
