module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const apiKey = process.env.INSTAMOJO_API_KEY;
  const authToken = process.env.INSTAMOJO_AUTH_TOKEN;

  if (!apiKey || !authToken) {
    return res.status(500).json({ error: "Missing Instamojo credentials" });
  }

  try {
    const params = new URLSearchParams();
    params.append("purpose", "NegotiateAI Full Report");
    params.append("amount", "199");
    params.append("buyer_name", "Customer");
    params.append("redirect_url", "https://negotiateai-vercel.vercel.app/");
    params.append("send_email", "false");
    params.append("send_sms", "false");
    params.append("allow_repeated_payments", "true");

    const response = await fetch("https://www.instamojo.com/api/1.1/payment-requests/", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "X-Auth-Token": authToken,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(500).json({ error: "Order creation failed", details: data });
    }

    return res.status(200).json({
      paymentRequestId: data.payment_request.id,
      paymentUrl: data.payment_request.longurl
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
