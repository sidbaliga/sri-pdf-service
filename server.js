const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

async function generatePDF(data) {
  console.log("DEBUG: generatePDF called with:", data);

  const templatePath = path.join(__dirname, "template.html");
  let html = fs.readFileSync(templatePath, "utf8");

  // READ EXACT KEYS FROM FRONTEND
  const cognitive = Number(data.cognitive || 0);
  const emotional = Number(data.emotional || 0);
  const attention = Number(data.attention || 0);
  const execution = Number(data.execution || 0);
  const energy = Number(data.energy || 0);

  const totalScore =
    cognitive + emotional + attention + execution + energy;

  const highest = Math.max(cognitive, emotional, attention, execution, energy);
  const lowest = Math.min(cognitive, emotional, attention, execution, energy);
  const variance = highest - lowest;

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

  function pct(score) {
    return Math.round((score / 25) * 100);
  }

  const dominantLever =
    highest === cognitive ? "Cognitive" :
    highest === emotional ? "Emotional" :
    highest === attention ? "Attention" :
    highest === execution ? "Execution" :
    "Energy";

  const constraintLever =
    lowest === cognitive ? "Cognitive" :
    lowest === emotional ? "Emotional" :
    lowest === attention ? "Attention" :
    lowest === execution ? "Execution" :
    "Energy";

  const computedData = {
    ...data,

    TOTAL_SCORE: totalScore,
    READINESS_CLASSIFICATION: readiness(totalScore),

    DOMINANT_LEVER: dominantLever,
    DOMINANT_LEVER_SCORE: highest,

    PRIMARY_CONSTRAINT: constraintLever,
    PRIMARY_CONSTRAINT_SCORE: lowest,

    VARIANCE_SCORE: variance,
    VARIANCE_CLASSIFICATION: varianceLabel(variance),

    COGNITION_SCORE: cognitive,
    EMOTION_SCORE: emotional,
    ATTENTION_SCORE: attention,
    EXECUTION_SCORE: execution,
    ENERGY_SCORE: energy,

    COGNITION_BAND: band(cognitive),
    EMOTION_BAND: band(emotional),
    ATTENTION_BAND: band(attention),
    EXECUTION_BAND: band(execution),
    ENERGY_BAND: band(energy),

    COGNITION_PCT: pct(cognitive),
    EMOTION_PCT: pct(emotional),
    ATTENTION_PCT: pct(attention),
    EXECUTION_PCT: pct(execution),
    ENERGY_PCT: pct(energy),

    COGNITION_INTERPRETATION: "Strategic reasoning and cognitive structuring capacity.",
    EMOTION_INTERPRETATION: "Emotional regulation and resilience under pressure.",
    ATTENTION_INTERPRETATION: "Focus consistency and attentional discipline across cycles.",
    EXECUTION_INTERPRETATION: "Bias toward action and operational delivery strength.",
    ENERGY_INTERPRETATION: "Sustainable energy deployment and performance stamina.",

    EXECUTIVE_SUMMARY:
      `Total score of ${totalScore} reflects ${readiness(totalScore)}. 
Dominant leverage in ${dominantLever}, constraint pressure in ${constraintLever}. 
Variance indicates ${varianceLabel(variance)}.`,
  };

  Object.keys(computedData).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, "g");
    html = html.replace(regex, computedData[key]);
  });

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const filePath = path.join(__dirname, `report-${Date.now()}.pdf`);

  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  return filePath;
}

app.post("/generate-report", async (req, res) => {
  try {
    const pdfPath = await generatePDF(req.body);

    res.download(pdfPath, () => {
      fs.unlinkSync(pdfPath);
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

app.get("/", (req, res) => {
  res.send("SRI PDF Service Running v2");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});