/* eslint-disable */
const { onRequest } = require("firebase-functions/v2/https");
const Openpay = require("openpay");
const cors = require('cors')({ origin: true });
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const firebase_admin = require("firebase-admin");
require('dotenv').config();

const openpay = new Openpay(process.env.OPENPAY_MERCHANT_ID, process.env.OPENPAY_PRIVATE_KEY, process.env.OPENPAY_PRODUCTION_MODE);

firebase_admin.initializeApp()

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

exports.crearUsuario = onRequest(async (req, res) => {
	cors(req, res, async () => {
		try {
			const { email, password, name } = req.body;

			if (!email || !password) {
				return res.status(400).json({ error: "Email and password are required" });
			}

			const userRecord = await getAuth().createUser({
				email: email,
				password: password,
				displayName: name,
			});
			const db = getFirestore();

			const { role } = req.body;

			await db.collection("employees").doc(userRecord.uid).set({
				name: name,
				email: email,
				role: role,
			});

			return res.status(201).json({ message: "User created successfully", user: userRecord });
		} catch (error) {
			console.error("Error al crear el usuario:", error);
			return res.status(500).json({ error: error.toString() });
		}
	});
});

exports.eliminarUsuario = onRequest(async (req, res) => {
	cors(req, res, async () => {
		try {
			const { uid } = req.body;

			if (!uid) {
				return res.status(400).json({ error: "User ID is required" });
			}
			const db = getFirestore();
			await db.collection("employees").doc(uid).delete();

			await getAuth().deleteUser(uid);

			return res.status(200).json({ message: "User deleted successfully" });
		} catch (error) {
			console.error("Error al eliminar el usuario:", error);
			return res.status(500).json({ error: error.toString() });
		}
	});
});