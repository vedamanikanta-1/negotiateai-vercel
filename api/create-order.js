const crypto = require("crypto");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: "Missing Razorpay credentials" });
  }

  try {
    const authString = Buffer.from(keyId + ":" + keySecret).toString("base64");

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + authString
      },
      body: JSON.stringify({
        amount: 19900,
        currency: "INR",
        receipt: "negotiateai_" + Date.now(),
        notes: { product: "NegotiateAI Full Report" }
      })
    });

    const orderData = await orderRes.json();
    if (!orderData.id) {
      return res.status(500).json({ error: "No order ID", details: orderData });
    }

    return res.status(200).json({
      orderID: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      keyId: keyId
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
