export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    const { paymentId, adminSecret } = req.query;

    if (!paymentId || !adminSecret) {
      return res.status(400).json({
        success: false,
        message: "Payment ID and admin secret are required"
      });
    }

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const response = await fetch(
      `${process.env.KV_REST_API_URL}/get/payment:${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Redis error:", errorText);

      return res.status(500).json({
        success: false,
        message: "Failed to access payment database"
      });
    }

    const data = await response.json();

    console.log("Raw Redis response:", JSON.stringify(data));

    if (!data.result) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    let payment;

    try {
      payment =
        typeof data.result === "string"
          ? JSON.parse(data.result)
          : data.result;
    } catch (parseError) {
      console.error("Payment JSON parse error:", parseError);

      return res.status(500).json({
        success: false,
        message: "Invalid payment data stored in database"
      });
    }

    console.log("Payment object:", JSON.stringify(payment));

    return res.status(200).json({
      success: true,
      payment
    });

  } catch (error) {
    console.error("Get payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve payment",
      error: error.message
    });
  }
}
