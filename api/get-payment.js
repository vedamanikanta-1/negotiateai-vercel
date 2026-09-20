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
      console.error("Redis GET error:", errorText);

      return res.status(500).json({
        success: false,
        message: "Failed to access payment database"
      });
    }

    const data = await response.json();

    console.log("RAW REDIS RESULT:", JSON.stringify(data));

    if (data.result === null || data.result === undefined) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    let payment;

    // Normal Upstash REST response:
    // { result: "{\"paymentId\":\"...\",...}" }
    if (typeof data.result === "string") {
      try {
        payment = JSON.parse(data.result);
      } catch (error) {
        console.error("JSON parse failed:", data.result);

        return res.status(500).json({
          success: false,
          message: "Stored payment data is invalid"
        });
      }
    } else {
      payment = data.result;
    }

    // Handle accidental wrapper structures from older records.
    if (payment && payment.payment && typeof payment.payment === "object") {
      payment = payment.payment;
    }

    console.log(
      "NORMALIZED PAYMENT:",
      JSON.stringify({
        paymentId: payment?.paymentId,
        amount: payment?.amount,
        email: payment?.email,
        whatsapp: payment?.whatsapp,
        utr: payment?.utr,
        status: payment?.status
      })
    );

    return res.status(200).json({
      success: true,
      payment: {
        paymentId: payment?.paymentId || paymentId,
        amount: payment?.amount ?? 199,
        email: payment?.email || "",
        whatsapp: payment?.whatsapp || "",
        utr: payment?.utr || "",
        status: payment?.status || "UNKNOWN",
        createdAt: payment?.createdAt || "",
        profile: payment?.profile || {}
      }
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
