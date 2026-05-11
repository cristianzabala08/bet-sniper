import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface LandingConfig {
  _id?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
  statsWinsToday: number;
  statsLossesToday: number;
  statsProfitToday: string;
  statsWinRate: string;
  statsActiveUsers: string;
  martingalaDescription: string;
  martingalaFeatures: string[];
  ctaSectionTitle: string;
  ctaSectionSubtitle: string;
  ctaSectionButtonText: string;
  ctaSectionButtonLink: string;
  footerText: string;
  footerDisclaimer: string;
  socialLinks: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class LandingConfigService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  getConfig(): Observable<LandingConfig> {
    return this.http.get<LandingConfig>(`${this.apiUrl}/landing-config`);
  }

  updateConfig(data: Partial<LandingConfig>): Observable<LandingConfig> {
    return this.http.put<LandingConfig>(`${this.apiUrl}/landing-config`, data);
  }
}
