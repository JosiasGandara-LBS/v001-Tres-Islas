import { inject, Injectable } from '@angular/core';
import { doc, Firestore, getDoc, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class PromotionsService {

	private firestore = inject(Firestore);

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

	async setProductDiscounts(product: string, discount: any) {
		const discountsRef = doc(this.firestore, 'promotions/' + product);
		return await updateDoc(discountsRef, discount).then(() => {
		}).catch((error) => {
			console.error('Error getting document:', error);
			return null;
		});
	}
}
