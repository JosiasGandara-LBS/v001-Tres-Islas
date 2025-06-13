import { inject, Injectable, Signal, signal, effect, computed } from '@angular/core';
import { collectionData, Firestore, addDoc, deleteDoc, docData } from '@angular/fire/firestore';
import { Product } from '@shared/interfaces/product.interface';
import { map, Observable} from 'rxjs';
import { collection, doc, getDoc, updateDoc, getDocFromServer, DocumentData, DocumentReference, onSnapshot } from 'firebase/firestore';
import { KitchenHours } from '../models/kitchen-hours.model';

@Injectable({
  providedIn: 'root'
})
export class KitchenStatusService {
    private firestore = inject(Firestore);
    private _now = signal<number>(Date.now());
    // public isKitchenOpen = signal<boolean>(true);
    public isKitchenOpen = computed(() => {
        // Forzar reevaluación cada minuto
        this._now();
        const hours = this.kitchenHoursSignal();
        const status = this.kitchenStatusSignal();
        if (!hours || status === undefined) return false;
        const now = new Date();
        const day = now.getDay();
        const prevDay = (day === 0) ? 6 : day - 1;
        const currentTime = now.getHours() * 60 + now.getMinutes();
        let isOpen = false;
        const today = hours[day];
        const yesterday = hours[prevDay];

        // Si el día de hoy está activado, solo se considera el horario de hoy
        if (today && today.enabled) {
            const start = this.timeToMinutes(today.start);
            const end = this.timeToMinutes(today.end);
            if (start < end) {
                isOpen = currentTime >= start && currentTime < end;
            } else {
                isOpen = currentTime >= start || currentTime < end;
            }
        } else if (yesterday && yesterday.enabled) {
            // Si el día de hoy está desactivado, solo considerar la franja nocturna de ayer
            const yStart = this.timeToMinutes(yesterday.start);
            const yEnd = this.timeToMinutes(yesterday.end);
            if (yStart > yEnd) {
                if (currentTime < yEnd) {
                    isOpen = true;
                }
            }
        }
        return isOpen && status;
    });

    private statusSignal = signal<boolean>(false);
	private olinePaymentStatus = signal<boolean>(false);

    // Signal reactivo para los horarios
    private kitchenHoursSignal = signal<KitchenHours | null>(null);

    // Signal reactivo para el status de cocina (isKitchenOpen de Firebase)
    private kitchenStatusSignal = signal<boolean | undefined>(undefined);

    // Signal computado: true si ambos (horario y status) permiten abrir
    public isKitchenReallyOpen = computed(() => {
        const hours = this.kitchenHoursSignal();
        const status = this.kitchenStatusSignal();
        if (!hours || status === undefined) return false;
        const now = new Date();
        const day = now.getDay();
        const prevDay = (day === 0) ? 6 : day - 1;
        const currentTime = now.getHours() * 60 + now.getMinutes();
        let isOpen = false;
        const today = hours[day];
        const yesterday = hours[prevDay];

        // Si el día de hoy está activado, solo se considera el horario de hoy
        if (today && today.enabled) {
            const start = this.timeToMinutes(today.start);
            const end = this.timeToMinutes(today.end);
            if (start < end) {
                isOpen = currentTime >= start && currentTime < end;
            } else {
                isOpen = currentTime >= start || currentTime < end;
            }
        } else if (yesterday && yesterday.enabled) {
            // Si el día de hoy está desactivado, solo considerar la franja nocturna de ayer
            const yStart = this.timeToMinutes(yesterday.start);
            const yEnd = this.timeToMinutes(yesterday.end);
            if (yStart > yEnd) {
                if (currentTime < yEnd) {
                    isOpen = true;
                }
            }
        }
        return isOpen && status;
    });

    constructor() {
		this.cashPaymentToGoStatus();
		this.onlinePaymentStatus();
        this.listenToKitchenHours();
        this.listenToKitchenStatus();
        // Timer para forzar reevaluación cada minuto
        setInterval(() => {
          this._now.set(Date.now());
        }, 60000);
    }

    // Escuchar cambios en los horarios de cocina
    private listenToKitchenHours() {
        const docRef = doc(this.firestore, 'kitchenStatus', 'kitchenStatus');
        onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.kitchenHoursSignal.set(data['kitchenHours'] ?? null);
            } else {
                this.kitchenHoursSignal.set(null);
            }
        });
    }

    // Escuchar cambios en el status de cocina (isKitchenOpen de Firebase)
    private listenToKitchenStatus() {
        const kitchenStatusCollection = collection(this.firestore, 'kitchenStatus');
        const kitchenStatusRef = doc(kitchenStatusCollection, 'kitchenStatus');
        onSnapshot(kitchenStatusRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                this.kitchenStatusSignal.set(data['status']);
            } else {
                this.kitchenStatusSignal.set(undefined);
            }
        });
    }

    private timeToMinutes(time: string): number {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }



    public selectedProduct = signal<Product | null>(null);

    getKitchenStatus(): Observable<boolean | undefined> {
        const kitchenStatusCollection = collection(this.firestore, 'kitchenStatus');
        return collectionData(kitchenStatusCollection, { idField: 'id' }).pipe(
          map((status: any[]) => {
            if (status && status.length > 0) {
              return status[0]?.status;
            }
            return undefined;
          })
        );
    }

    setKitchenStatus(status: boolean) {
        const kitchenStatusCollection = collection(this.firestore, 'kitchenStatus');
        const kitchenStatusRef = doc(kitchenStatusCollection, 'kitchenStatus');
        return updateDoc(kitchenStatusRef, {
            status: status
        });
    }

    getOrdersEstimatedTime() {
		const kitchenStatusDoc = doc(this.firestore, 'kitchenStatus/kitchenStatus');

		return docData(kitchenStatusDoc).pipe(map((data: any) => {
			if (!data) return null;

			if (data.estimatedOrdersTime === undefined) return null;

			return data.estimatedOrdersTime;
		}));
	}

    setOrdersEstimatedTime(estimatedTime: number) {
        const kitchenStatusCollection = collection(this.firestore, 'kitchenStatus');
        const kitchenStatusRef = doc(kitchenStatusCollection, 'kitchenStatus');
        return updateDoc(kitchenStatusRef, {
            estimatedOrdersTime: estimatedTime
        });
    }

	getConfigs() {
		const kitchenStatusDoc = doc(this.firestore, 'kitchenStatus/kitchenStatus');

		return docData(kitchenStatusDoc).pipe(map((data: any) => {
			if (!data) return null;

			return data;
		}));
	}

	saveConfigs(configs: any) {
		const kitchenStatusDoc = doc(this.firestore, 'kitchenStatus/kitchenStatus');

		return updateDoc(kitchenStatusDoc, {
			CashPaymentToGoStatus: configs.CashPaymentToGoStatus,
			OnlinePaymentStatus: configs.OnlinePaymentStatus,
			kitchenHours: configs.kitchenHours,
		});
	}

	private cashPaymentToGoStatus() {
		const docRef = doc(this.firestore, 'kitchenStatus', 'kitchenStatus');

		// Escucha en tiempo real
		onSnapshot(docRef, (docSnap) => {
			if (docSnap.exists()) {
				const data = docSnap.data();
				this.statusSignal.set(data['CashPaymentToGoStatus']);
			} else {
				this.statusSignal.set(false);
			}
		});
	}

	private onlinePaymentStatus() {
		const docRef = doc(this.firestore, 'kitchenStatus', 'kitchenStatus');

		// Escucha en tiempo real
		onSnapshot(docRef, (docSnap) => {
			if (docSnap.exists()) {
				const data = docSnap.data();
				this.olinePaymentStatus.set(data['OnlinePaymentStatus']);
			} else {
				this.olinePaymentStatus.set(false);
			}
		});
	}

	// Signal pública para acceder al valor reactivo
	get cashPaymentStatusSignal() {
		return this.statusSignal.asReadonly();
	}

	get onlinePaymentStatusSignal(): Signal<boolean> {
		return this.olinePaymentStatus.asReadonly();
	}

	getTables() {
		const kitchenStatusDoc = doc(this.firestore, 'kitchenStatus/kitchenStatus');

		return docData(kitchenStatusDoc).pipe(map((data: any) => {
			if (!data) return null;

			if (data.tables === undefined) return null;

			return data.tables;
		}));
	}

	saveTables(tables: any[]) {
		const kitchenStatusDoc = doc(this.firestore, 'kitchenStatus/kitchenStatus');

		return updateDoc(kitchenStatusDoc, {
			tables: tables
		});
	}
}

