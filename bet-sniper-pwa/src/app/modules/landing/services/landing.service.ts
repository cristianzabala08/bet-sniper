import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface LandingConfig {
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
export class LandingService {
  private http = inject(HttpClient);
  private apiUrl = environment.api;

  private defaultConfig: LandingConfig = {
    heroTitle: 'Señales con Criterio',
    heroSubtitle: 'Potencia tus operaciones con señales profesionales respaldadas por inteligencia artificial y análisis técnico de élite.',
    heroCtaText: 'Únete Ahora',
    heroCtaLink: '/auth/register',
    statsWinsToday: 47,
    statsLossesToday: 3,
    statsProfitToday: '+$2,340.00',
    statsWinRate: '95%',
    statsActiveUsers: '+500',
    martingalaDescription: 'Nuestro algoritmo usa la estrategia Martingala para maximizar la recuperación tras una pérdida, garantizando que la siguiente operación cubra el déficit anterior.',
    martingalaFeatures: ['Análisis técnico avanzado', 'Recuperación inteligente', 'Gestión de riesgo automática', 'Señales en tiempo real'],
    ctaSectionTitle: '¿Listo para operar con criterio?',
    ctaSectionSubtitle: 'Únete a la manada de traders que confían en Bet Sniper.',
    ctaSectionButtonText: 'Comenzar Ahora',
    ctaSectionButtonLink: '/auth/register',
    footerText: '© 2025 Bet Sniper. Todos los derechos reservados.',
    footerDisclaimer: 'El trading conlleva riesgos. Opera con responsabilidad.',
    socialLinks: { twitter: '', telegram: '', instagram: '', discord: '' }
  };

  getConfig(): Observable<LandingConfig> {
    return this.http.get<LandingConfig>(`${this.apiUrl}/landing-config`).pipe(
      catchError(() => of(this.defaultConfig))
    );
  }
}
