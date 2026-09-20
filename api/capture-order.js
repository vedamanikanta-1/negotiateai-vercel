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
      whatsapp
    } = req.body || {};

    if (!paymentId || !utr || !email) {
      return res.status(400).json({
        success: false,
        message: "Payment ID, UTR and email are required"
      });
    }

    const redisResponse = await fetch(
      `${process.env.KV_REST_API_URL}/get/payment:${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`
        }
      }
    );

    if (!redisResponse.ok) {
      throw new Error("Payment record not found");
    }

    const data = await redisResponse.json();

    if (!data.result) {
      return res.status(404).json({
        success: false,
        message: "Payment request not found"
      });
    }

    const payment = JSON.parse(data.result);

    payment.utr = utr;
    payment.email = email;
    payment.whatsapp = whatsapp || payment.whatsapp;
    payment.status = "PAYMENT_SUBMITTED";
    payment.submittedAt = new Date().toISOString();

    await fetch(
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

    return res.status(200).json({
      success: true,
      message: "Payment submitted for verification"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit payment"
    });
  }
}
