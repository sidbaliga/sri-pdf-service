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

  const templatePath = path.join(__dirname, "template.html");
  let html = fs.readFileSync(templatePath, "utf8");

  // Ensure numeric safety
  const cognition = Number(data.COGNITION_SCORE || 0);
  const emotion = Number(data.EMOTION_SCORE || 0);
  const attention = Number(data.ATTENTION_SCORE || 0);
  const execution = Number(data.EXECUTION_SCORE || 0);
  const energy = Number(data.ENERGY_SCORE || 0);
  const totalScore = Number(data.TOTAL_SCORE || 0);

  const highest = Math.max(cognition, emotion, attention, execution, energy);
  const lowest = Math.min(cognition, emotion, attention, execution, energy);
  const variance = highest - lowest;

  const pct = (score) => Math.round((score / 25) * 100);

  const band = (score) => {
    if (score >= 20) return "High";
    if (score >= 14) return "Moderate";
    return "Low";
  };

  const readiness = (score) => {
    if (score >= 100) return "Elite Readiness";
    if (score >= 85) return "Developing Readiness";
    if (score >= 70) return "Emerging Readiness";
    return "Foundational Readiness";
  };

  const varianceLabel = (v) => {
    if (v >= 10) return "High Structural Imbalance";
    if (v >= 5) return "Moderate Structural Skew";
    return "Structurally Balanced";
  };

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

  const computedData = {
    ...data,

    READINESS_CLASSIFICATION: readiness(totalScore),

    DOMINANT_LEVER: dominantLever,
    DOMINANT_LEVER_SCORE: highest,

    PRIMARY_CONSTRAINT: constraintLever,
    PRIMARY_CONSTRAINT_SCORE: lowest,

    VARIANCE_SCORE: variance,
    VARIANCE_CLASSIFICATION: varianceLabel(variance),

    COGNITION_BAND: band(cognition),
    EMOTION_BAND: band(emotion),
    ATTENTION_BAND: band(attention),
    EXECUTION_BAND: band(execution),
    ENERGY_BAND: band(energy),

    COGNITION_PCT: pct(cognition),
    EMOTION_PCT: pct(emotion),
    ATTENTION_PCT: pct(attention),
    EXECUTION_PCT: pct(execution),
    ENERGY_PCT: pct(energy),

    COGNITION_INTERPRETATION: "Strategic reasoning and cognitive structuring capacity.",
    EMOTION_INTERPRETATION: "Emotional regulation and resilience under pressure.",
    ATTENTION_INTERPRETATION: "Focus consistency and attentional discipline across cycles.",
    EXECUTION_INTERPRETATION: "Bias toward action and operational delivery strength.",
    ENERGY_INTERPRETATION: "Sustainable energy deployment and performance stamina.",

    EXECUTIVE_SUMMARY:
      `The Sales Readiness Index reflects a ${readiness(totalScore)} architecture. Dominant leverage is observed in ${dominantLever}, while constraint pressure is visible in ${constraintLever}. Variance analysis indicates ${varianceLabel(variance)} across performance levers.`
  };

  // Replace placeholders safely
  for (const key in computedData) {
    const value = String(computedData[key] ?? "");
    const regex = new RegExp(`{{${key}}}`, "g");
    html = html.replace(regex, value);
  }

  // Final cleanup: remove any unreplaced placeholders
  html = html.replace(/{{[^}]+}}/g, "");

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
    margin: {
      top: "22mm",
      bottom: "22mm",
      left: "20mm",
      right: "20mm"
    }
  });

  await browser.close();

  return filePath;
}

app.post("/generate-report", async (req, res) => {
  try {
    const pdfPath = await generatePDF(req.body);
    res.download(pdfPath, () => fs.unlinkSync(pdfPath));
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

app.get("/", (req, res) => {
  res.send("SRI PDF Service Running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});