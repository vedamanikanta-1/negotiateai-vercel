export default async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {

    const {
      paymentId,
      adminSecret
    } = req.query;

    if (!paymentId || !adminSecret) {
      return res.status(400).json({
        success: false,
        message: "Payment ID and admin secret are required"
      });
    }

    // -----------------------------
    // Verify admin
    // -----------------------------

    if (
      adminSecret !==
      process.env.ADMIN_SECRET
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // -----------------------------
    // Get report from Redis
    // -----------------------------

    const response = await fetch(
      `${process.env.KV_REST_API_URL}/get/report:${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${process.env.KV_REST_API_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        "Failed to access report database"
      );
    }

    const data = await response.json();

    if (
      data.result === null ||
      data.result === undefined
    ) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }

    // -----------------------------
    // Parse Redis response
    // -----------------------------

    let redisWrapper = data.result;

    if (typeof redisWrapper === "string") {
      redisWrapper =
        JSON.parse(redisWrapper);
    }

    let reportRecord =
      redisWrapper.value;

    if (typeof reportRecord === "string") {
      reportRecord =
        JSON.parse(reportRecord);
    }

    if (!reportRecord) {
      return res.status(404).json({
        success: false,
        message: "Report data is empty"
      });
    }

    const report =
      reportRecord.report || {};

    // -----------------------------
    // HTML helpers
    // -----------------------------

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    const companyRows =
      (report.companyWiseSalaries || [])
        .map(company => `
          <tr>
            <td>${escapeHtml(company.company)}</td>
            <td>${escapeHtml(company.range)}</td>
            <td>${escapeHtml(company.notes)}</td>
          </tr>
        `)
        .join("");

    const actionPlan =
      (report.actionPlan || [])
        .map(item =>
          `<li>${escapeHtml(item)}</li>`
        )
        .join("");

    const redFlags =
      (report.redFlags || [])
        .map(item =>
          `<li>${escapeHtml(item)}</li>`
        )
        .join("");

    const skills =
      (report.skillsToAdd || [])
        .map(item =>
          `<li>${escapeHtml(item)}</li>`
        )
        .join("");

    // -----------------------------
    // Create downloadable HTML
    // -----------------------------

    const html = `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
NegotiateAI Full Salary Negotiation Report
</title>

<style>

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  color: #222;
  background: #f5f7fb;
  margin: 0;
  padding: 30px;
}

.container {
  max-width: 900px;
  margin: auto;
  background: white;
  padding: 40px;
  border-radius: 14px;
}

h1 {
  color: #111;
  margin-bottom: 10px;
}

h2 {
  margin-top: 30px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

th {
  background: #f1f1f1;
}

.script {
  background: #f7f7f7;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.meta {
  background: #f7f7f7;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.footer {
  margin-top: 40px;
  color: #777;
  font-size: 13px;
}

</style>

</head>

<body>

<div class="container">

<h1>
NegotiateAI — Full Salary Negotiation Report
</h1>

<div class="meta">

<strong>Payment ID:</strong>
${escapeHtml(reportRecord.paymentId)}

<br>

<strong>Generated:</strong>
${escapeHtml(reportRecord.generatedAt)}

</div>


<h2>
Company Salary Comparison
</h2>

<table>

<thead>

<tr>
<th>Company</th>
<th>Estimated Range</th>
<th>Notes</th>
</tr>

</thead>

<tbody>

${companyRows}

</tbody>

</table>


<h2>
Negotiation Script
</h2>

<div class="script">

<strong>Opening:</strong>

<br>

${escapeHtml(
  report.negotiationScript?.opening
)}

</div>


<div class="script">

<strong>
When HR Asks Salary:
</strong>

<br>

${escapeHtml(
  report.negotiationScript?.whenAsked
)}

</div>


<div class="script">

<strong>
Counter Offer:
</strong>

<br>

${escapeHtml(
  report.negotiationScript?.counterOffer
)}

</div>


<div class="script">

<strong>
Closing:
</strong>

<br>

${escapeHtml(
  report.negotiationScript?.closing
)}

</div>


<h2>
Offer Evaluation
</h2>

<p>

${escapeHtml(
  report.offerEvaluation
)}

</p>


<h2>
Action Plan
</h2>

<ul>

${actionPlan}

</ul>


<h2>
Potential Red Flags
</h2>

<ul>

${redFlags}

</ul>


<h2>
Skills To Add
</h2>

<ul>

${skills}

</ul>


<div class="footer">

Generated by NegotiateAI.

<br><br>

This report provides AI-generated career and salary guidance and should be used as an informational tool.

</div>

</div>

</body>

</html>
`;

    // -----------------------------
    // Download response
    // -----------------------------

    res.setHeader(
      "Content-Type",
      "text/html; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="NegotiateAI-Report-${paymentId}.html"`
    );

    return res.status(200).send(html);

  } catch (error) {

    console.error(
      "Get report error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve report"
    });

  }

}
