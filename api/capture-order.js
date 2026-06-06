module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  const { orderID } = req.body;

  try {
    const authString = Buffer.from(clientId + ":" + secret).toString("base64");

    const authRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + authString,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const authData = await authRes.json();
console.log("PayPal Auth Response:", authData);

    const captureRes = await fetch(
      "https://api-m.paypal.com/v2/checkout/orders/" + orderID + "/capture",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + authData.access_token
        },
        body: "{}"
      }
    );

    const captureData = await captureRes.json();

    if (captureData.status === "COMPLETED") {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ error: "Not completed", details: captureData });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
