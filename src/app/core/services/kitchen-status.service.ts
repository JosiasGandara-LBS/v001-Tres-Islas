import { inject, Injectable, signal } from '@angular/core';
import { collectionData, Firestore, addDoc, deleteDoc } from '@angular/fire/firestore';
import { Product } from '@shared/interfaces/product.interface';
import { map } from 'rxjs';
import { collection, doc, getDoc, updateDoc, getDocFromServer, DocumentData, DocumentReference } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class KitchenStatusService {
    private firestore = inject(Firestore);
    constructor() {}

    public selectedProduct = signal<Product | null>(null);

    getKitchenStatus(){
        const kitchenStatusCollection = collection(this.firestore, 'kitchenStatus');
        return collectionData(kitchenStatusCollection, { idField: 'id' }).pipe(
            map((status: any) => {
                return status.map((status: {id: string, status: boolean}) => {
                    return {
                        status: status.status
                    };
                });
            }
            )
        ).pipe(
            map((statusArray: any[]) => statusArray[0]?.status)
        );
    }

    setKitchenStatus(status: boolean) {
        const kitchenStatusCollection = collection(this.firestore, 'kitchenStatus');
        const kitchenStatusRef = doc(kitchenStatusCollection, 'kitchenStatus');
        return updateDoc(kitchenStatusRef, {
            status: status
        });
    }
}

