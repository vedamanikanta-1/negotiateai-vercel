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

    // Verify admin
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Get payment from Vercel KV / Redis
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

    if (!data.result) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const payment = JSON.parse(data.result);

    return res.status(200).json({
      success: true,
      payment
    });

  } catch (error) {
    console.error("Get payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve payment"
    });
  }
}
