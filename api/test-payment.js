export default async function handler(req, res) {
  try {
    const paymentId = "NEG-1789910254359-EHQ2A7";

    const response = await fetch(
      `${process.env.KV_REST_API_URL}/get/payment:${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`
        }
      }
    );

    const text = await response.text();

    return res.status(200).json({
      redisStatus: response.status,
      redisResponse: text
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
