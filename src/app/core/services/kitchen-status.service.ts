import { inject, Injectable, signal } from '@angular/core';
import { collectionData, Firestore, addDoc, deleteDoc, docData } from '@angular/fire/firestore';
import { Product } from '@shared/interfaces/product.interface';
import { map, Observable} from 'rxjs';
import { collection, doc, getDoc, updateDoc, getDocFromServer, DocumentData, DocumentReference, onSnapshot } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class KitchenStatusService {
    private firestore = inject(Firestore);
    public isKitchenOpen = signal<boolean>(true);
	private statusSignal = signal<boolean>(false);

    constructor() {
        this.getKitchenStatus().subscribe(status => {
            if(status !== undefined)
                this.isKitchenOpen.set(status);
        });

		this.cashPaymentToGoStatus();
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

	// Signal pública para acceder al valor reactivo
	get cashPaymentStatusSignal() {
		return this.statusSignal.asReadonly();
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

