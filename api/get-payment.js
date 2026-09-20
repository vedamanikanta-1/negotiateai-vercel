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
      throw new Error("Failed to access payment database");
    }

    const data = await response.json();

    console.log("RAW REDIS RESULT:", data);

    if (data.result === null || data.result === undefined) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    let payment = data.result;

    // Redis may return a JSON string
    if (typeof payment === "string") {
      payment = JSON.parse(payment);
    }

    // Handle accidental nested payment object
    if (payment && payment.payment) {
      payment = payment.payment;
    }

    console.log("NORMALIZED PAYMENT:", payment);

    return res.status(200).json({
      success: true,
      payment: {
        paymentId: payment.paymentId || paymentId,
        amount: payment.amount || 199,
        email: payment.email || "",
        whatsapp: payment.whatsapp || "",
        utr: payment.utr || "",
        status: payment.status || "UNKNOWN",
        createdAt: payment.createdAt || "",
        profile: payment.profile || {}
      }
    });

  } catch (error) {
    console.error("Get payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve payment"
    });
  }
}
