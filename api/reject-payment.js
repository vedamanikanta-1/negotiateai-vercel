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
      adminSecret
    } = req.body || {};

    if (!paymentId || !adminSecret) {
      return res.status(400).json({
        success: false,
        message: "Payment ID and admin secret are required"
      });
    }

    // Verify admin
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Get existing payment
    const getResponse = await fetch(
      `${process.env.KV_REST_API_URL}/get/payment:${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`
        }
      }
    );

    if (!getResponse.ok) {
      throw new Error("Failed to access payment database");
    }

    const data = await getResponse.json();

    if (!data.result) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const payment = JSON.parse(data.result);

    // Change status
    payment.status = "REJECTED";
    payment.rejectedAt = new Date().toISOString();

    // Save updated payment
    const saveResponse = await fetch(
      `${process.env.KV_REST_API_URL}/set/payment:${encodeURIComponent(paymentId)}`,
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

    if (!saveResponse.ok) {
      throw new Error("Failed to update payment");
    }

    return res.status(200).json({
      success: true,
      message: "Payment rejected successfully"
    });

  } catch (error) {
    console.error("Reject payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject payment"
    });
  }
}
