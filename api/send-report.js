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
      adminSecret,
      reportUrl
    } = req.body || {};

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
      `${process.env.KV_REST_API_URL}/get/payment:${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`
        }
      }
    );

    const data = await response.json();

    if (!data.result) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const payment = JSON.parse(data.result);

    if (payment.status !== "PAYMENT_SUBMITTED") {
      return res.status(400).json({
        success: false,
        message: `Payment status is ${payment.status}`
      });
    }

    payment.status = "VERIFIED";
    payment.verifiedAt = new Date().toISOString();
    payment.reportUrl = reportUrl || "";

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

    // Email customer
    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "NegotiateAI <onboarding@resend.dev>",
          to: [payment.email],
          subject: "Your NegotiateAI Full Report is Ready",
          html: `
            <h2>Your payment has been verified!</h2>

            <p>
              Your NegotiateAI Full Report is now available.
            </p>

            ${
              reportUrl
                ? `<p>
                    <a href="${reportUrl}">
                      Open Your Full Report
                    </a>
                   </p>`
                : `<p>Please login to NegotiateAI to view your report.</p>`
            }

            <p>Thank you for using NegotiateAI.</p>
          `
        })
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and customer notified"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify payment"
    });
  }
}
