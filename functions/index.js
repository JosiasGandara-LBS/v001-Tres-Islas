/* eslint-disable */
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const firebase_admin = require("firebase-admin");
const Openpay = require("openpay");
const cors = require('cors')({ origin: true });

require('dotenv').config();

const openpay = new Openpay(process.env.OPENPAY_MERCHANT_ID, process.env.OPENPAY_PRIVATE_KEY, false);

firebase_admin.initializeApp()

exports.procesarPago = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { tokenId, deviceSessionId, amount, description } = req.body;

      console.log("Device Session ID:", deviceSessionId);

      const chargeRequest = {
        source_id: tokenId,
        method: "card",
        amount: amount,
        currency: "MXN",
        description: description,
        device_session_id: deviceSessionId,
		use_3d_secure: true,
		redirect_url: "https://example.com"
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
	  console.error("Error al procesar el pago:", JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error });
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

// Función programada con Firebase Functions v2
exports.copyOrdersToHistory = onSchedule(
	{
		schedule: "0 8 * * *",
		timeZone: "America/Mazatlan",
	},
	async (event) => {
		const db = firebase_admin.firestore();

		try {
			const ordersRef = db.collection("orders");
			const snapshot = await ordersRef.get();

			if (snapshot.empty) {
				console.log("No hay órdenes para archivar.");
				return null;
			}

			const batch = db.batch();
			snapshot.forEach((doc) => {
				const orderData = doc.data();
				const orderHistoryRef = db.collection("orderHistory").doc(doc.id);
				batch.set(orderHistoryRef, orderData);
				batch.delete(doc.ref);
			});

			await batch.commit();
			console.log(`Se copiaron ${snapshot.size} órdenes a orderHistory.`);
		} catch (error) {
			console.error("Error al copiar órdenes:", error);
		}

		return null;
	}
);