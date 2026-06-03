const { GoogleGenAI } = require("@google/genai");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Gemini API key not found" });

  const { jobTitle, skills, experience, location, currentSalary } = req.body;

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `You are India top salary negotiation coach.

Profile:
- Job Title: ${jobTitle}
- Skills: ${skills}
- Experience: ${experience}
- Location: ${location}
- Current Salary: ${currentSalary || "Not disclosed"}

Return ONLY valid JSON no markdown:
{
  "companyWiseSalaries": [
    {"company": "Google", "range": "XX-XXL", "notes": "brief note"},
    {"company": "Amazon", "range": "XX-XXL", "notes": "brief note"},
    {"company": "Microsoft", "range": "XX-XXL", "notes": "brief note"},
    {"company": "TCS", "range": "XX-XXL", "notes": "brief note"},
    {"company": "Infosys", "range": "XX-XXL", "notes": "brief note"},
    {"company": "Wipro", "range": "XX-XXL", "notes": "brief note"}
  ],
  "negotiationScript": {
    "opening": "exact opening statement",
    "whenAsked": "exact response when HR asks salary",
    "counterOffer": "exact counter offer script",
    "closing": "exact closing statement"
  },
  "offerEvaluation": "is current salary fair underpaid or overpaid",
  "actionPlan": ["step1","step2","step3"],
  "redFlags": ["flag1","flag2"],
  "skillsToAdd": ["skill with percent salary increase"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });

    const text = response.text;
    const cleaned = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleaned);
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ error: "Report failed: " + err.message });
  }
};
