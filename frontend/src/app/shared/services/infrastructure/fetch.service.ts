import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FetchService {
	public async fetchBlob(url: string): Promise<Blob> {
		const response = await fetch(url);
		return await response.blob();
	}
}


