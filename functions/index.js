const { onRequest } = require("firebase-functions/v2/https");
const Openpay = require("openpay");
const cors = require('cors')({ origin: true });

const openpay = new Openpay(
  "mheinovbagqf3nzxctrx",
  "sk_cf030af358ea459984ed87e8fb92daf2",
  false
);

exports.procesarPago = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { tokenId, deviceSessionId, amount, description, customer } = req.body;

      if (!customer) {
        return res.status(400).json({ error: "Customer data is required" });
      }

      console.log("Device Session ID:", deviceSessionId);

      const chargeRequest = {
        source_id: tokenId,
        method: "card",
        amount: amount,
        currency: "MXN",
        description: description,
        device_session_id: deviceSessionId,
        customer: customer,
      };

      // Convertir el callback en una promesa
      const charge = await new Promise((resolve, reject) => {
        openpay.charges.create(chargeRequest, (error, body) => {
          if (error) {
            reject(error);
          } else {
            resolve(body);
          }
        });
      });

      return res.status(200).json(charge);
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      return res.status(500).json({ error: error.toString() });
    }
  });
});