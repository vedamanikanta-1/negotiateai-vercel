export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const {
      email,
      whatsapp,
      profile
    } = req.body || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const paymentId =
      "NEG-" +
      Date.now() +
      "-" +
      Math.random().toString(36).substring(2, 8).toUpperCase();

    const payment = {
      paymentId,
      email,
      whatsapp: whatsapp || "",
      profile: profile || {},
      amount: 199,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    // Vercel KV / Redis
    const response = await fetch(
      `${process.env.KV_REST_API_URL}/set/payment:${paymentId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          value: JSON.stringify(payment)
        })
      }
    );

    if (!response.ok) {
      throw new Error("Failed to save payment");
    }

    return res.status(200).json({
      success: true,
      paymentId,
      amount: 199,
      upiId: process.env.UPI_ID
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment request"
    });
  }
}
