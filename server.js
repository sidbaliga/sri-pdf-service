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

  let html = fs.readFileSync("./template.html", "utf8");

  // Inject values
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, "g");
    html = html.replace(regex, data[key]);
  });

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.waitForTimeout(1000);

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

    const data = req.body;

    const pdfPath = await generatePDF(data);

    res.download(pdfPath, () => {
      fs.unlinkSync(pdfPath); // delete after sending
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

app.get("/", (req, res) => {
  res.send("SRI PDF Service Running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});