module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const apiKey = process.env.INSTAMOJO_API_KEY;
  const authToken = process.env.INSTAMOJO_AUTH_TOKEN;
  const { paymentRequestId, paymentId } = req.body;

  try {
    const response = await fetch(
      `https://www.instamojo.com/api/1.1/payment-requests/${paymentRequestId}/${paymentId}/`,
      {
        method: "GET",
        headers: {
          "X-Api-Key": apiKey,
          "X-Auth-Token": authToken
        }
      }
    );

    const data = await response.json();

    if (data.success && data.payment_request.payment.status === "Credit") {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ error: "Payment not verified", details: data });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
