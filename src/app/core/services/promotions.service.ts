import { inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { collection, collectionData, doc, Firestore, getDoc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PromotionsService {

	private firestore = inject(Firestore);
	private _promotionCollection = collection(this.firestore, 'promotions');

  	constructor() {}

  	async getProductDiscounts(docId: string) {
		const discountsRef = doc(this.firestore, 'promotions', docId);
		return await getDoc(discountsRef).then((doc) => {
			if (doc.exists()) {
				const data = doc.data();
				return data;
			} else {
				console.error('No such document!');
				return null;
			}
		}
		).catch((error) => {
			console.error('Error getting document:', error);
			return null;
		}
		);
	}

	getPromotions(): Observable<any[]> {
		return collectionData(this._promotionCollection, { idField: 'id' }).pipe(
			map(promotions => {
				const now = new Date();
				const formattedNow = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

				return promotions.filter(promo => {
					return promo['startTime'] <= formattedNow && promo['endTime'] >= formattedNow;
				});
			})
		);
	}


	async setProductDiscounts(product: string, discount: any) {
		const discountsRef = doc(this.firestore, 'promotions/' + product);
		return await updateDoc(discountsRef, discount).then(() => {
		}).catch((error) => {
			console.error('Error getting document:', error);
			return null;
		});
	}
}
