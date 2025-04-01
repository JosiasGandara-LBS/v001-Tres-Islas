import { inject, Injectable, signal } from '@angular/core';
import { collectionData, Firestore, addDoc, deleteDoc, docData } from '@angular/fire/firestore';
import { Product } from '@shared/interfaces/product.interface';
import { map, Observable} from 'rxjs';
import { collection, doc, getDoc, updateDoc, getDocFromServer, DocumentData, DocumentReference } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class KitchenStatusService {
    private firestore = inject(Firestore);
    public isKitchenOpen = signal<boolean>(true);

    constructor() {
        this.getKitchenStatus().subscribe(status => {
            if(status !== undefined)
                this.isKitchenOpen.set(status);
        });
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
            estimatedTime: estimatedTime
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
}

