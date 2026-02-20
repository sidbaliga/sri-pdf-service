const fs = require('fs');
const puppeteer = require('puppeteer');

async function generatePDF() {

  // Load template
  let html = fs.readFileSync('./template.html', 'utf8');

  // ─────────────────────────────────────────────
  // RAW LEVER SCORES (Replace with real scoring later)
  // ─────────────────────────────────────────────
  const cognition = 19;
  const emotion = 17;
  const attention = 14;
  const execution = 23;
  const energy = 15;

  // ─────────────────────────────────────────────
  // DERIVED CALCULATIONS
  // ─────────────────────────────────────────────
  const totalScore = cognition + emotion + attention + execution + energy;

  const highest = Math.max(cognition, emotion, attention, execution, energy);
  const lowest = Math.min(cognition, emotion, attention, execution, energy);
  const variance = highest - lowest;

  function pct(score) {
    return Math.round((score / 25) * 100);
  }

  function band(score) {
    if (score >= 20) return "High";
    if (score >= 14) return "Moderate";
    return "Low";
  }

  function readiness(score) {
    if (score >= 100) return "Elite Readiness";
    if (score >= 85) return "Developing Readiness";
    if (score >= 70) return "Emerging Readiness";
    return "Foundational Readiness";
  }

  function varianceLabel(v) {
    if (v >= 10) return "High Structural Imbalance";
    if (v >= 5) return "Moderate Structural Skew";
    return "Structurally Balanced";
  }

  const readinessClassification = readiness(totalScore);
  const varianceClassification = varianceLabel(variance);

  const dominantLever =
    highest === cognition ? "Cognition" :
    highest === emotion ? "Emotion" :
    highest === attention ? "Attention" :
    highest === execution ? "Execution" :
    "Energy";

  const constraintLever =
    lowest === cognition ? "Cognition" :
    lowest === emotion ? "Emotion" :
    lowest === attention ? "Attention" :
    lowest === execution ? "Execution" :
    "Energy";

  // ─────────────────────────────────────────────
  // PREMIUM EXECUTIVE CONTENT
  // ─────────────────────────────────────────────

  const data = {

    // Core
    TOTAL_SCORE: totalScore,
    READINESS_CLASSIFICATION: readinessClassification,
    COMPANY_NAME: "ABC Enterprises",
    REPORT_DATE: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }),

    // Executive Summary
    EXECUTIVE_SUMMARY:
      "The Sales Readiness Index reflects a structurally capable but uneven performance architecture. Execution strength is pronounced, indicating strong bias toward action and operational delivery. However, relative compression within the Attention lever suggests diminishing strategic focus consistency across cycles. This asymmetry introduces controlled performance volatility — progress is made, but not always sequenced optimally. Variance analysis indicates moderate structural skew, meaning leverage exists but remains partially unrealized. With calibrated attention discipline and tighter strategic sequencing, the existing execution strength can convert into compounding performance acceleration. The system is not weak; it is under-aligned. Precision refinement rather than overhaul will unlock disproportionate gains.",

    // Dominant / Constraint
    DOMINANT_LEVER: dominantLever,
    DOMINANT_LEVER_SCORE: highest,
    PRIMARY_CONSTRAINT: constraintLever,
    PRIMARY_CONSTRAINT_SCORE: lowest,
    VARIANCE_SCORE: variance,
    VARIANCE_CLASSIFICATION: varianceClassification,

    // Lever Scores
    COGNITION_SCORE: cognition,
    COGNITION_BAND: band(cognition),
    COGNITION_PCT: pct(cognition),
    COGNITION_INTERPRETATION:
      "Cognitive architecture demonstrates solid strategic reasoning capacity, though forward planning occasionally outpaces structured sequencing discipline.",

    EMOTION_SCORE: emotion,
    EMOTION_BAND: band(emotion),
    EMOTION_PCT: pct(emotion),
    EMOTION_INTERPRETATION:
      "Emotional regulation remains stable under routine pressure; resilience profile suggests dependable internal state management.",

    ATTENTION_SCORE: attention,
    ATTENTION_BAND: band(attention),
    ATTENTION_PCT: pct(attention),
    ATTENTION_INTERPRETATION:
      "Attention bandwidth appears fragmented across competing operational demands, reducing compounding focus leverage.",

    EXECUTION_SCORE: execution,
    EXECUTION_BAND: band(execution),
    EXECUTION_PCT: pct(execution),
    EXECUTION_INTERPRETATION:
      "Execution rhythm is decisive and output-oriented, reflecting strong bias toward completion and momentum generation.",

    ENERGY_SCORE: energy,
    ENERGY_BAND: band(energy),
    ENERGY_PCT: pct(energy),
    ENERGY_INTERPRETATION:
      "Energy deployment is sustainable but not consistently optimized for peak performance cycles.",

    // Structural Pattern
    STRUCTURAL_PATTERN: "Strategic Latency",
    STRUCTURAL_PATTERN_EXPLANATION:
      "The system reflects a Strategic Latency architecture — high execution capability operating ahead of calibrated focus discipline. Momentum exists, but strategic compression reduces multiplicative effect. With structural refinement to attention sequencing, the existing execution strength can transition from linear output to exponential leverage.",

    // Roadmap (Premium Advisory)
    ROADMAP_IMMEDIATE:
      "<ul><li>Install structured daily focus calibration protocol</li><li>Reduce parallel priority streams to three core initiatives</li><li>Introduce weekly execution-to-strategy alignment review</li></ul>",

    ROADMAP_STRUCTURAL:
      "<ul><li>Implement structured performance cadence architecture</li><li>Formalize decision sequencing framework</li><li>Integrate attention discipline metrics into review cycles</li></ul>",

    ROADMAP_LEVERAGE:
      "<ul><li>Engineer execution rhythm into scalable playbooks</li><li>Build structural performance dashboards</li><li>Institutionalize alignment calibration loops</li></ul>",

    // Placeholder Radar Image (safe empty pixel)
    RADAR_CHART_BASE64:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
  };

  // ─────────────────────────────────────────────
  // INJECTION ENGINE
  // ─────────────────────────────────────────────
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, data[key]);
  });

  // ─────────────────────────────────────────────
  // PUPPETEER PDF GENERATION
  // ─────────────────────────────────────────────
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: 'SRI_Final_Report.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '22mm',
      bottom: '22mm',
      left: '20mm',
      right: '20mm'
    }
  });

  await browser.close();

  console.log("✅ Premium Executive SRI report generated successfully.");
}

generatePDF();