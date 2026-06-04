module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  if (!clientId || !secret) {
    return res.status(500).json({ error: "Missing PayPal credentials" });
  }

  try {
    const authString = Buffer.from(clientId + ":" + secret).toString("base64");

    const authRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + authString,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const authData = await authRes.json();

    if (!authData.access_token) {
      return res.status(500).json({ error: "PayPal auth failed", details: authData });
    }

    const orderRes = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + authData.access_token
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "EUR", value: "2.40" },
          description: "NegotiateAI Full Report"
        }]
      })
    });

   const orderData = await orderRes.json();

if (!orderData.id) {
  return res.status(500).json({
    error: "No order ID",
    details: orderData
  });
}

    return res.status(200).json({ orderID: orderData.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
