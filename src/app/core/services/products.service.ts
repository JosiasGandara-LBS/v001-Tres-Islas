import { inject, Inject, Injectable, signal } from '@angular/core';
import { collectionData, Firestore, addDoc, deleteDoc } from '@angular/fire/firestore';
import { Product } from '@shared/interfaces/product.interface';
import { map } from 'rxjs';
import { collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
	private firestore = inject(Firestore);
	constructor() {}

	public selectedProduct = signal<Product | null>(null);

	getProducts() {
		return collectionData(collection(this.firestore, 'menu'), { idField: 'id' }).pipe(
			map((products: any) => {
				return products.map((product: any) => {
					return {
						id: product.id,
						name: product.name,
						price: product.price,
						description: product.description,
						image: product.image,
						category: product.category
					};
				});
			}
			)
		);
	}

	getProductById(id: string) {
		return getDoc(doc(this.firestore, 'menu', id))
	}

	uploadImage(file: File) {
		const storage = getStorage();
		const storageRef = ref(storage, `images/${file.name}`);
		const uploadTask = uploadBytes(storageRef, file);

		return new Observable<string>((observer) => {
			uploadTask.then(async (snapshot) => {
				const downloadURL = await getDownloadURL(snapshot.ref);
				observer.next(downloadURL);
				observer.complete();
			}).catch((error) => {
				observer.error(error);
			});
		});
	}

	addCategory(category: any) {
		return addDoc(collection(this.firestore, 'categories'), category);
	}

	deleteCategory(id: string) {
		const categoryRef = doc(this.firestore, 'categories', id);
		return deleteDoc(categoryRef);
	}

	getCategories() {
		return collectionData(collection(this.firestore, 'categories'), { idField: 'id' });
	}

	async updateProduct(product: Product) {
		const productRef = doc(this.firestore, 'menu', product.id);
		return await updateDoc(productRef, { ...product });
	}
}
