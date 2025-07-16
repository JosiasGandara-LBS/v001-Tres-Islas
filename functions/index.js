/* eslint-disable */
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { defineSecret } = require("firebase-functions/params");
const GMAIL_PASS = defineSecret("GMAIL_PASS");

const nodemailer = require("nodemailer");
const ExcelJS = require("exceljs");
const path = require("path");

const firebase_admin = require("firebase-admin");
const Openpay = require("openpay");
const cors = require('cors')({ origin: true });

require('dotenv').config();

const openpay = new Openpay(process.env.OPENPAY_MERCHANT_ID, process.env.OPENPAY_PRIVATE_KEY, true);

firebase_admin.initializeApp()

exports.procesarPago = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { tokenID, deviceSessionID, orderID, amount, description, customer } = req.body;

      if (!customer) {
        return res.status(400).json({ error: "Customer data is required" });
      }

      const chargeRequest = {
        source_id: tokenID,
        method: "card",
        amount: amount,
        currency: "MXN",
        description: description,
		customer: customer,
        device_session_id: deviceSessionID,
		use_3d_secure: true,
		redirect_url: `https://tresislascocina.com/confirm-payment?order_id=${orderID}`
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

exports.resetAllMenuItems = onSchedule(
	{
		schedule: "0 8 * * *",
		timeZone: "America/Mazatlan",
	},
	async (event) => {
		const db = firebase_admin.firestore();

		try {
			const menuRef = db.collection("menu");
			const snapshot = await menuRef.get();

			if (snapshot.empty) {
				console.log("No hay items en el menú.");
				return null;
			}

			// Iteramos sobre cada documento y actualizamos
			const batch = db.batch();

			snapshot.forEach((doc) => {
				const docRef = doc.ref;
				batch.update(docRef, { available: true });
			});

			await batch.commit();
			console.log("Todos los items del menú fueron actualizados a available: true");

		} catch (error) {
			console.error("Error al resetear los items del menú:", error);
		}

		return null;
	}
);


exports.checkPagoStatus = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const { transactionID } = req.query;

      if (!transactionID) {
        return res.status(400).json({ error: "transactionID is required" });
      }

      // Convertir el callback en una promesa
      const transaction = await new Promise((resolve, reject) => {
        openpay.charges.get(transactionID, (error, charge) => {
          if (error) {
            reject(error);
          } else {
            resolve(charge);
          }
        });
      });

      return res.status(200).json(transaction);
    } catch (error) {
      console.error("Error al consultar el estado del pago:", JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error });
    }
  });
});

exports.sendOrdersReport = onSchedule(
	{
		schedule: "0 7 * * *",
		timeZone: "America/Mazatlan",
	},
	async () => {
		const db = getFirestore();
		const now = new Date();
		const yesterday = new Date(now);
		yesterday.setDate(now.getDate() - 1);

		const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));

		const statusMap = {
			1: 'Recibido',
			2: 'Preparando',
			0: 'Cancelado',
			3: 'Entregado'
		};

		const snapshot = await db.collection('orders').orderBy('createdDate', 'asc').get();
		let orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

		// Filtrar órdenes de tarjeta no confirmadas
		orders = orders.filter(order => {
			return !(order.paymentMethod?.toLowerCase().includes('tarjeta') && order.pendingPayment === true);
		});

		if (!orders.length) {
			console.log("No hay órdenes para el día anterior.");
			return;
		}

		orders.sort((a, b) => {
			const dateA = a.createdDate?.seconds ? a.createdDate.seconds * 1000 : a.createdDate;
			const dateB = b.createdDate?.seconds ? b.createdDate.seconds * 1000 : b.createdDate;
			return dateA - dateB;
		});

		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Órdenes');

		worksheet.columns = [
			{ header: 'Cliente', key: 'cliente', width: 25 },
			{ header: 'Mesa/Para llevar', key: 'mesa', width: 18 },
			{ header: 'Fecha y hora', key: 'fecha', width: 22 },
			{ header: 'Total sin propina', key: 'totalSinPropina', width: 18 },
			{ header: 'Propina', key: 'propina', width: 10 },
			{ header: 'Total con propina', key: 'totalConPropina', width: 18 },
			{ header: 'Método de pago', key: 'metodoPago', width: 20 },
			{ header: 'Status', key: 'status', width: 15 },
			{ header: 'Teléfono', key: 'telefono', width: 15 },
			{ header: 'Para llevar', key: 'paraLlevar', width: 12 },
			{ header: 'Items', key: 'items', width: 40 },
		];

		orders.forEach(order => {
			const createdDate = order.createdDate;
			let fechaHora = '';

			if (createdDate) {
				if (typeof createdDate === 'string') {
					// Si es string, intenta parsear con Date
					const parsed = new Date(createdDate);
					fechaHora = isNaN(parsed.getTime()) ? createdDate : parsed.toLocaleString();
				} else if (createdDate.seconds) {
					// Si es timestamp de Firestore
					fechaHora = new Date(createdDate.seconds * 1000).toLocaleString();
				} else {
					// Otro formato (por si acaso)
					const parsed = new Date(createdDate);
					fechaHora = isNaN(parsed.getTime()) ? '' : parsed.toLocaleString();
				}
			}

			const totalSinPropina = order.totalAmount ?? '';
			const propina = order.tip ?? 0;
			const totalConPropina = (order.totalAmount ?? 0) + (order.tip ?? 0);
			const metodoPago = order.paymentMethod ?? '';
			const status = statusMap[order.status] ?? order.status;
			const telefono = order.phoneNumber ?? '';
			const paraLlevar = order.orderToGo === 1 ? 'Sí' : 'No';
			const mesa = order.assignedToTable ?? (order.orderToGo === 1 ? 'PARA LLEVAR' : '');
			const items = Array.isArray(order.foodDishes)
				? order.foodDishes.map((item) =>
					`${item.quantity}x ${item.name}${item.additionalInstructions ? ' (' + item.additionalInstructions + ')' : ''}`
				).join(', ')
				: '';

			worksheet.addRow({
				cliente: order.client ?? order.customerName ?? '',
				mesa,
				fecha: fechaHora,
				totalSinPropina,
				propina,
				totalConPropina,
				metodoPago,
				status,
				telefono,
				paraLlevar,
				items,
			});
		});

		const fechaNombre = startOfYesterday.toISOString().slice(0, 10);
		const filePath = path.join("/tmp", `corte_diario_${fechaNombre}.xlsx`);
		await workbook.xlsx.writeFile(filePath);

		// 4. Configura y envía el correo
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: "servicios.venturesoftlutions@gmail.com",
				pass: process.env.GMAIL_PASS
			},
		});

		const mailOptions = {
			from: "servicios.venturesoftlutions@gmail.com",
			to: "contabilidad@cerveceriatresislas.com",
			subject: `Reporte de órdenes del ${fechaNombre}`,
			text: "Adjunto encontrarás el reporte de órdenes del día anterior.",
			attachments: [
				{
					filename: `reporte_ordenes_${fechaNombre}.xlsx`,
					path: filePath,
				},
			],
		};

		await transporter.sendMail(mailOptions);
		console.log("Correo enviado con éxito.");
	}
);
