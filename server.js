const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const puppeteer = require("puppeteer");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

const supabase = createClient(
  "https://wkjobfzvucoxhdynncfw.supabase.co",
  process.env.SUPABASE_ANON_KEY
);

function band(score) {
  if (score >= 20) return "Performance Strength";
  if (score >= 14) return "Stable Capability";
  if (score >= 8)  return "Inconsistent Performance";
  return "Structural Risk";
}

function readiness(score) {
  if (score >= 101) return "Elite Readiness Band";
  if (score >= 76)  return "Performance Acceleration Zone";
  if (score >= 51)  return "Competitive Structure";
  if (score >= 26)  return "Developing Stability";
  return "Structural Deficit";
}

function varianceLabel(v) {
  if (v >= 10) return "High Structural Imbalance";
  if (v >= 5)  return "Moderate Structural Skew";
  return "Structurally Balanced";
}

function pct(score) {
  return Math.round((score / 25) * 100);
}

function leverName(scores, targetValue) {
  const map = {
    cognitive: "Cognition",
    emotional: "Emotion",
    attention: "Attention",
    execution: "Execution",
    energy:    "Energy",
  };
  const entry = Object.entries(scores).find(([, v]) => v === targetValue);
  return entry ? map[entry[0]] : "Unknown";
}

function interpretation(lever, score) {
  const b = band(score);
  const map = {
    "Structural Risk": {
      Cognition:  "Decision calibration is underdeveloped. Performance inconsistency is likely under pressure. Systematic cognitive structuring required before scaling activity.",
      Emotion:    "Emotional regulation shows significant vulnerability. Reactivity risk is elevated. Structural emotional anchoring protocols are indicated.",
      Attention:  "Attentional bandwidth is fragmented. Sustained focus under load is inconsistent. Priority architecture requires immediate rebuilding.",
      Execution:  "Behavioral follow-through is critically weak. Activity-to-outcome conversion is below functional threshold. Execution discipline protocols required immediately.",
      Energy:     "Operational energy is depleted or misallocated. Sustainable performance output is not currently viable. Recovery and reallocation architecture is required.",
    },
    "Inconsistent Performance": {
      Cognition:  "Cognitive processing is functional but unreliable across varying conditions. Structured thinking frameworks will improve consistency.",
      Emotion:    "Emotional management is present but inconsistent under pressure. Regulation calibration recommended to stabilize output.",
      Attention:  "Focus capacity exists but degrades under sustained load. Attentional systems require strengthening for high-demand environments.",
      Execution:  "Execution capability is present but inconsistently applied. Structured accountability frameworks are recommended.",
      Energy:     "Energy management is reactive rather than strategic. Sustainable energy allocation frameworks are indicated.",
    },
    "Stable Capability": {
      Cognition:  "Cognitive processing is reliable across most conditions. Precision tuning toward higher-order strategic thinking will expand performance ceiling.",
      Emotion:    "Emotional regulation is functional and consistent. Minor calibration in edge-case scenarios will yield measurable gains.",
      Attention:  "Attentional control is strong in standard conditions. Deepening focus architecture for complex environments is the next priority.",
      Execution:  "Execution discipline is present and consistent. Refining behavioral precision will unlock the next performance tier.",
      Energy:     "Energy management is stable in most contexts. Fine-tuning recovery protocols will drive incremental gains.",
    },
    "Performance Strength": {
      Cognition:  "Cognitive architecture is operating at high capacity. Strategic processing and adaptability are strong assets. Leverage this across complex scenarios.",
      Emotion:    "Emotional architecture is a performance asset. Regulation under pressure is consistent. This lever can stabilize other underperforming systems.",
      Attention:  "Attentional bandwidth is a structural advantage. Sustained focus across high-load environments is a reliable differentiator.",
      Execution:  "Execution is a high-performance lever. Behavioral consistency is operating at elite levels. Protect and replicate this structural strength.",
      Energy:     "Energy management is a performance differentiator. Operational output is sustained, directed, and strategic.",
    },
  };
  return map[b]?.[lever] ?? "Interpretation not available.";
}

function structuralPattern(scores) {
  const { cognitive, emotional, attention, execution, energy } = scores;
  const vals = [cognitive, emotional, attention, execution, energy];
  const avg = vals.reduce((a, b) => a + b, 0) / 5;

  if (cognitive >= 18 && attention >= 18) return "Strategic Processor";
  if (energy >= 18 && execution < 12)      return "High Drive, Low Conversion";
  if (cognitive < 12 && emotional >= 18)   return "Emotional Override Profile";
  if (vals.every(v => Math.abs(v - avg) < 4)) return "Balanced Generalist";
  if (vals.filter(v => v < 12).length >= 3)   return "Multi-System Underperformance";
  return "Mixed Structural Profile";
}

function patternExplanation(pattern, scores) {
  const map = {
    "Strategic Processor":
      "High Cognition and Attention scores indicate strong analytical capacity and focus discipline. This profile processes complex information effectively and maintains clarity under ambiguity. The primary development opportunity lies in ensuring Execution and Energy systems can match the strategic output capacity. Without operational follow-through, strategic capability remains theoretical.",
    "High Drive, Low Conversion":
      "Elevated Energy combined with low Execution indicates a motivation-execution misalignment. Drive is present but behavioral discipline and follow-through systems are underdeveloped. This profile often produces high activity volume with low output efficiency. Structural intervention in Execution architecture is the immediate priority.",
    "Emotional Override Profile":
      "High Emotional capacity with low Cognitive scores creates a risk environment where reactivity supersedes analysis. Decisions under pressure are likely emotion-driven rather than structurally reasoned. This profile benefits significantly from cognitive structuring protocols and decision frameworks that introduce analytical discipline before action.",
    "Balanced Generalist":
      "Scores are evenly distributed across all five levers, indicating a generalist performance architecture. No single lever dominates and no single lever critically underperforms. The development pathway involves selecting one or two levers for deliberate amplification to move from balanced competence toward structural excellence.",
    "Multi-System Underperformance":
      "Three or more levers are operating below functional threshold, creating compounding performance drag across the system. Single-lever interventions will be insufficient. A systemic recalibration approach is required, prioritizing foundational stability before targeted lever development.",
    "Mixed Structural Profile":
      "The performance architecture shows a combination of functional and underperforming levers without a dominant pattern signal. This profile requires individual lever assessment to identify specific intervention points. The absence of a clear structural pattern suggests inconsistent development across performance domains.",
  };
  return map[pattern] ?? "Structural pattern analysis unavailable.";
}

function roadmap(scores) {
  const levers = [
    { name: "Cognition",  score: scores.cognitive },
    { name: "Emotion",    score: scores.emotional },
    { name: "Attention",  score: scores.attention },
    { name: "Execution",  score: scores.execution },
    { name: "Energy",     score: scores.energy },
  ];
  const sorted = [...levers].sort((a, b) => a.score - b.score);
  const lowest  = sorted[0];
  const second  = sorted[1];
  const highest = sorted[sorted.length - 1];

  const immediateMap = {
    Cognition:  "Implement structured pre-performance decision frameworks. Reduce cognitive load through systematic prioritization. Introduce deliberate scenario analysis into daily workflow.",
    Emotion:    "Establish performance-state protocols for high-pressure situations. Develop pre-performance emotional calibration routines. Remove reactive decision patterns from operational workflow.",
    Attention:  "Eliminate attentional fragmentation through environmental structuring. Implement single-task operational protocols. Introduce focused work blocks with defined output targets.",
    Execution:  "Establish non-negotiable daily execution protocols. Introduce accountability structures with measurable behavioral outputs. Eliminate decision drift and activity dispersion.",
    Energy:     "Audit current energy expenditure and identify high-drain, low-return activities. Implement structured recovery cycles. Rebuild sustainable operational output architecture.",
  };

  const structuralMap = {
    Cognition:  "Expand cognitive bandwidth through sustained analytical practice. Introduce structured problem decomposition disciplines. Build decision-quality review mechanisms into performance cycles.",
    Emotion:    "Strengthen emotional architecture through structured regulation practice. Develop consistent performance-state triggers. Build resilience protocols for sustained high-performance environments.",
    Attention:  "Develop sustained attentional capacity through progressive focus disciplines. Build resistance to distraction in high-demand environments. Implement attention management frameworks.",
    Execution:  "Build execution consistency through behavioral habit architecture. Develop precision follow-through disciplines. Implement outcome-tracking mechanisms to close execution gaps.",
    Energy:     "Develop strategic energy management frameworks. Build peak-performance state protocols. Implement proactive recovery architecture to sustain operational output.",
  };

  const leverageMap = {
    Cognition:  "Deploy high Cognition in complex client scenarios, strategic planning, and competitive analysis to drive higher-order decision quality across the sales architecture.",
    Emotion:    "Leverage strong Emotional regulation in relationship-intensive environments, high-stakes negotiations, and client retention scenarios to build trust infrastructure.",
    Attention:  "Deploy high Attention in complex deal management, multi-stakeholder environments, and detailed solution design to build precision positioning.",
    Execution:  "Deploy strong Execution to drive pipeline velocity, activity consistency, and behavioral discipline across the sales cycle as a structural anchor.",
    Energy:     "Leverage high Energy to sustain performance output in high-volume environments, extend performance cycles, and maintain operational intensity.",
  };

  return {
    immediate:  immediateMap[lowest.name]  ?? "",
    structural: structuralMap[second.name] ?? "",
    leverage:   leverageMap[highest.name]  ?? "",
  };
}

function executiveSummary(scores, total, dominant, constraint, variance, pattern) {
  return `This diagnostic reflects a total SRI score of ${total} out of 125, placing this profile in the ${readiness(total)} classification. ` +
    `The dominant performance lever is ${dominant}, representing the highest structural asset in the current architecture. ` +
    `The primary constraint lever is ${constraint}, where underperformance creates the greatest drag on overall output efficiency. ` +
    `Variance across the five levers registers at ${variance} points, indicating ${varianceLabel(variance)}. ` +
    `The structural pattern classification is ${pattern}, which defines the characteristic shape of this performance system. ` +
    `Intervention priorities are sequenced in the advisory roadmap based on systemic impact rather than symptomatic urgency.`;
}

async function generatePDF(scores, email, company, reportDate) {
  const templatePath = path.join(__dirname, "template.html");
  let html = fs.readFileSync(templatePath, "utf8");

  const cognitive  = Number(scores.cognitive  || 0);
  const emotional  = Number(scores.emotional  || 0);
  const attention  = Number(scores.attention  || 0);
  const execution  = Number(scores.execution  || 0);
  const energy     = Number(scores.energy     || 0);
  const total      = cognitive + emotional + attention + execution + energy;

  const highest    = Math.max(cognitive, emotional, attention, execution, energy);
  const lowest     = Math.min(cognitive, emotional, attention, execution, energy);
  const variance   = highest - lowest;

  const rawScores  = { cognitive, emotional, attention, execution, energy };
  const dominant   = leverName(rawScores, highest);
  const constraint = leverName(rawScores, lowest);
  const pattern    = structuralPattern(rawScores);
  const road       = roadmap(rawScores);
  const summary    = executiveSummary(rawScores, total, dominant, constraint, variance, pattern);

  const placeholders = {
    TOTAL_SCORE:                   total,
    READINESS_CLASSIFICATION:      readiness(total),
    COMPANY_NAME:                  company || email || "Not provided",
    REPORT_DATE:                   reportDate || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),

    EXECUTIVE_SUMMARY:             summary,

    DOMINANT_LEVER:                dominant,
    DOMINANT_LEVER_SCORE:          highest,
    PRIMARY_CONSTRAINT:            constraint,
    PRIMARY_CONSTRAINT_SCORE:      lowest,
    VARIANCE_SCORE:                variance,
    VARIANCE_CLASSIFICATION:       varianceLabel(variance),

    COGNITION_SCORE:               cognitive,
    EMOTION_SCORE:                 emotional,
    ATTENTION_SCORE:               attention,
    EXECUTION_SCORE:               execution,
    ENERGY_SCORE:                  energy,

    COGNITION_BAND:                band(cognitive),
    EMOTION_BAND:                  band(emotional),
    ATTENTION_BAND:                band(attention),
    EXECUTION_BAND:                band(execution),
    ENERGY_BAND:                   band(energy),

    COGNITION_PCT:                 pct(cognitive),
    EMOTION_PCT:                   pct(emotional),
    ATTENTION_PCT:                 pct(attention),
    EXECUTION_PCT:                 pct(execution),
    ENERGY_PCT:                    pct(energy),

    COGNITION_INTERPRETATION:      interpretation("Cognition",  cognitive),
    EMOTION_INTERPRETATION:        interpretation("Emotion",    emotional),
    ATTENTION_INTERPRETATION:      interpretation("Attention",  attention),
    EXECUTION_INTERPRETATION:      interpretation("Execution",  execution),
    ENERGY_INTERPRETATION:         interpretation("Energy",     energy),

    STRUCTURAL_PATTERN:            pattern,
    STRUCTURAL_PATTERN_EXPLANATION: patternExplanation(pattern, rawScores),

    ROADMAP_IMMEDIATE:             road.immediate,
    ROADMAP_STRUCTURAL:            road.structural,
    ROADMAP_LEVERAGE:              road.leverage,

    RADAR_CHART_BASE64:            "data:image/png;base64,iVBORw0KGgo=",
  };

  Object.keys(placeholders).forEach(key => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    html = html.replace(regex, placeholders[key]);
  });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process",
    ],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const filePath = path.join(__dirname, `report-${Date.now()}.pdf`);
  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true,
    margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
  });

  await browser.close();
  return filePath;
}

app.post("/generate-report", async (req, res) => {
  try {
    const { id, email } = req.body;

    console.log("ID received:", id);

    if (!id) {
      return res.status(400).json({ error: "Missing record id" });
    }

    const { data, error } = await supabase
      .from("spi_results")
      .select("*")
      .eq("id", id)
      .single();

    console.log("Supabase data:", JSON.stringify(data));
    console.log("Supabase error:", JSON.stringify(error));

    if (error || !data) {
      return res.status(404).json({ error: "Record not found", detail: JSON.stringify(error) });
    }

    const reportDate = new Date().toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric"
    });

    const pdfPath = await generatePDF(data, email || data.email, email || data.email, reportDate);

    res.download(pdfPath, `SRI-Performance-Report-${Date.now()}.pdf`, () => {
      fs.unlinkSync(pdfPath);
    });

  } catch (error) {
    console.error("Generate report error:", error);
    res.status(500).json({ error: "PDF generation failed", detail: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("SRI PDF Service Running v3 — Option 2 Architecture");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
