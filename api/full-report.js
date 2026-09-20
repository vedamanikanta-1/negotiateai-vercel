const { GoogleGenAI } = require("@google/genai");

async function generateFullReport(profile) {
  const {
    jobTitle,
    skills,
    experience,
    location,
    currentSalary
  } = profile || {};

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key not found");
  }

  const ai = new GoogleGenAI({
    apiKey
  });

  const prompt = `You are India's top salary negotiation coach.

Profile:
- Job Title: ${jobTitle || "Not provided"}
- Skills: ${skills || "Not provided"}
- Experience: ${experience || "Not provided"}
- Location: ${location || "Not provided"}
- Current Salary: ${currentSalary || "Not disclosed"}

Return ONLY valid JSON. Do not use markdown.

{
  "companyWiseSalaries": [
    {
      "company": "Google",
      "range": "XX-XX LPA",
      "notes": "brief note"
    },
    {
      "company": "Amazon",
      "range": "XX-XX LPA",
      "notes": "brief note"
    },
    {
      "company": "Microsoft",
      "range": "XX-XX LPA",
      "notes": "brief note"
    },
    {
      "company": "TCS",
      "range": "XX-XX LPA",
      "notes": "brief note"
    },
    {
      "company": "Infosys",
      "range": "XX-XX LPA",
      "notes": "brief note"
    },
    {
      "company": "Wipro",
      "range": "XX-XX LPA",
      "notes": "brief note"
    }
  ],
  "negotiationScript": {
    "opening": "exact opening statement",
    "whenAsked": "exact response when HR asks salary",
    "counterOffer": "exact counter offer script",
    "closing": "exact closing statement"
  },
  "offerEvaluation": "Explain whether the salary appears fair, underpaid or overpaid and why.",
  "actionPlan": [
    "step1",
    "step2",
    "step3"
  ],
  "redFlags": [
    "flag1",
    "flag2"
  ],
  "skillsToAdd": [
    "skill with expected salary impact"
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: prompt
  });

  const text = response.text || "";

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}


// Existing API endpoint
module.exports = async function handler(req, res) {

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  try {

    const data = await generateFullReport(
      req.body || {}
    );

    return res.status(200).json({
      success: true,
      data
    });

  } catch (err) {

    console.error("Full report error:", err);

    return res.status(500).json({
      error: "Report failed: " + err.message
    });
  }
};


// Export generator for other API functions
module.exports.generateFullReport = generateFullReport;
