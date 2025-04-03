import { inject, Injectable } from '@angular/core';
import { collection, collectionData, Firestore } from '@angular/fire/firestore';
import { BehaviorSubject, interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Promotions2Service {

	private firestore = inject(Firestore);
	private _promotionCollection = collection(this.firestore, 'promotions');

	private promotions: any[] = [];
	private promotionsSubject = new BehaviorSubject<any[]>([]);
	promotions$ = this.promotionsSubject.asObservable();

	constructor() {
		this.loadPromotions();
		this.startTimer();
	}

	private loadPromotions(): void {
		collectionData(this._promotionCollection, { idField: 'id' }).subscribe(promotions => {
			this.promotions = promotions;
			this.filterPromotions();
		});
	}

	private startTimer(): void {
		interval(10000).subscribe(() => this.filterPromotions());
	}

	private filterPromotions(): void {
		const now = new Date();
		const formattedNow = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

		const activePromotions = this.promotions.filter(promo =>
			promo.enabled && promo['startTime'] <= formattedNow && promo['endTime'] >= formattedNow
		);

		console.log("Hora actual:", formattedNow, "Promociones activas:", activePromotions);
		this.promotionsSubject.next(activePromotions);
	}

}
