export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const {
      paymentId,
      utr,
      email,
      whatsapp,
      profile
    } = req.body || {};

    console.log("SUBMIT PAYMENT BODY:", {
      paymentId,
      utr,
      email,
      whatsapp,
      profile
    });

    if (!paymentId || !utr || !email) {
      return res.status(400).json({
        success: false,
        message: "Payment ID, UTR and email are required"
      });
    }

    const payment = {
      paymentId,
      utr,
      email,
      whatsapp: whatsapp || "",
      profile: profile || {},
      amount: 199,
      status: "PAYMENT_SUBMITTED",
      createdAt: new Date().toISOString()
    };

    console.log("PAYMENT OBJECT BEFORE REDIS:", payment);

    const redisResponse = await fetch(
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

    const redisResult = await redisResponse.text();

    console.log("REDIS SAVE RESPONSE:", redisResult);

    if (!redisResponse.ok) {
      throw new Error("Database save failed");
    }

    return res.status(200).json({
      success: true,
      message: "Payment submitted successfully",
      paymentId
    });

  } catch (error) {
    console.error("SUBMIT PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
}
