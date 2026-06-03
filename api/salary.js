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
  if (!jobTitle || !skills || !experience || !location) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `You are an Indian IT salary database. Give PRECISE salary figures based on EXACT job role and skills.

STRICT RULES:
- Different job titles MUST have different salary ranges
- Skills like AWS, ML, Kubernetes = 30-50% premium
- City multipliers: Bangalore=1.15x, Hyderabad=1.10x, Mumbai=1.12x, Pune=1.08x, Delhi/NCR=1.12x, Tier2=0.85x
- Experience: Fresher=1x, 1-3yr=1.4x, 3-5yr=2x, 5-8yr=2.8x, 8-12yr=3.5x, 12+yr=4.5x
- Base Bangalore 3-5yr: SDE=18-28L, Data Scientist=20-35L, DevOps=18-30L, ML=22-38L, Frontend=15-25L, Backend=16-26L, PM=25-45L

Calculate for:
JOB TITLE: "${jobTitle}"
SKILLS: "${skills}"
EXPERIENCE: "${experience}"
LOCATION: "${location}"
CURRENT SALARY: "${currentSalary || "Not provided"}"

Return ONLY valid JSON no markdown:
{
  "minSalary": "X.XL",
  "avgSalary": "X.XL",
  "maxSalary": "X.XL",
  "marketInsight": "specific insight about this role and skills in this city in 2025",
  "skillPremium": "which specific skill commands highest premium and why",
  "negotiationRoom": "Low/Medium/High",
  "demandLevel": "Low/Medium/High/Very High",
  "topHiringCompanies": ["company1","company2","company3","company4","company5"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt
    });

    const text = response.text;
    const cleaned = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleaned);
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ error: "AI failed: " + err.message });
  }
};
