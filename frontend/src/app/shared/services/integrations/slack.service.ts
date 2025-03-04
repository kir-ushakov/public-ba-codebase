import { Injectable } from '@angular/core';
import { API_ENDPOINTS } from '../../constants/api-endpoints.const';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class SlackService {
  constructor(private http: HttpClient) {}
  async addToSlack(code: string): Promise<void> {
    const endpoint = `${API_ENDPOINTS.INTEGRATIONS.SLACK}`;
    const payload = { code };
    await this.http.post(endpoint, payload).toPromise();
  }

  async removeFromSlack(): Promise<void> {
    const endpoint = `${API_ENDPOINTS.INTEGRATIONS.SLACK}`;
    await this.http.delete(endpoint).toPromise();
  }
}
