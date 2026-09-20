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

    const saveResponse = await fetch(
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

    if (!saveResponse.ok) {
      throw new Error("Database save failed");
    }

    // Notify admin
    if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "NegotiateAI <onboarding@resend.dev>",
          to: [process.env.ADMIN_EMAIL],
          subject: `New NegotiateAI Payment - ${paymentId}`,
          html: `
            <h2>New Payment Submitted</h2>

            <p><strong>Payment ID:</strong> ${paymentId}</p>
            <p><strong>Amount:</strong> ₹199</p>
            <p><strong>UTR:</strong> ${utr}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>WhatsApp:</strong> ${whatsapp || "Not provided"}</p>

            <p>
              Login to the NegotiateAI admin dashboard
              to verify this payment.
            </p>
          `
        })
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment submitted successfully"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
}
