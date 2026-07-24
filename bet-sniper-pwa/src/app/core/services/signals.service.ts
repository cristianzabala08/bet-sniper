import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TokenService } from 'src/app/shared/services/jwt-token.service';
import { io, Socket } from 'socket.io-client';

export interface BarraSuperior {
  wins: number;
  losses: number;
  winRate: number;
  profit: number;
  winPercentage: number | string;
}

export interface Victorias {
  player: number;
  banker: number;
  tie: number;
}

export interface Results {
  nombre_mesa: string;
  martingala_active: boolean;
  vector_forecast: string[];
  vector_resultado: string[];
  vector_win: string[];
  numero_martingala: number;
  ronda_actual: number;
  victorias: Victorias;
}

export interface SignalData {
  results: Results;
  signal: Results;
}

export interface PanelPrincipal {
  win: boolean;
  _id: string;
  data: SignalData;
  prediction: string;
  contador_martingala: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
  titulo?: string; // Optional if needed for UI mapping
  tipo?: string; // Add type to distinguish signal vs result
  duration?: string; // Duration string from backend (e.g. "0m 28s")
  winTime?: string; // Optional if needed
  mesa?: string; // Add table name
  isOpen?: boolean; // Add open status
  ronda?: number; // Add round number
  winStep?: number; // Add martingale step of win
}

export interface SignalsResponse {
  barraSuperior: BarraSuperior;
  panelPrincipal: PanelPrincipal;
  ultimoResult?: PanelPrincipal; // Added
  previousSignal?: PanelPrincipal; // Added
  listaMesas: PanelPrincipal[];
}

export interface SocketUpdate {
  type: 'NEW_SIGNAL' | 'NEW_RESULT';
  data: any; // Signal Document
  // Additional fields for NEW_RESULT
  winStatus?: boolean | null;
  martingalaData?: any;
}

@Injectable({
  providedIn: 'root',
})
export class SignalsService {
  private apiUrl = '/webhook/signals/receive';
  private socket!: Socket;
  // Single source of truth for socket updates
  private dashboardUpdateSubject = new Subject<SocketUpdate>();
  // Single source of truth for connection state, shared by any page that needs it
  // (e.g. the dashboard and the automatic-mode page) without opening a second socket.
  private sessionActiveSubject = new BehaviorSubject<boolean>(false);
  sessionActive$ = this.sessionActiveSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
  ) {}

  connect() {
    this.socket = io(environment.api, {
      auth: {
        token: this.tokenService.getToken(),
      },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.sessionActiveSubject.next(true);
    });

    // Listen to the single event source
    this.socket.on('dashboardUpdate', (payload: SocketUpdate) => {
      this.dashboardUpdateSubject.next(payload);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.sessionActiveSubject.next(false);
    });
  }

  // Initial HTTP Load usually calls this
  getSignals(): Observable<SignalsResponse> {
    return this.http.get<SignalsResponse>(this.apiUrl);
  }

  // Components subscribe to this for Real-time events
  getDashboardUpdates(): Observable<SocketUpdate> {
    return this.dashboardUpdateSubject.asObservable();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.sessionActiveSubject.next(false);
  }

  getDailySignals(): Observable<any[]> {
    return this.http.get<any[]>('/webhook/signals/daily');
  }

  // Time Sync Logic
  private timeOffset: number = 0;

  getServerTime(): Observable<{ serverTime: string }> {
    return this.http.get<{ serverTime: string }>(
      '/webhook/signals/server-time',
    );
  }

  syncTime() {
    this.getServerTime().subscribe({
      next: (response) => {
        const serverTime = new Date(response.serverTime).getTime();
        const localTime = new Date().getTime();
        // offset = server - local
        // corrected = local + offset = local + (server - local) = server
        this.timeOffset = serverTime - localTime;
      },
      error: (err) => console.error('Error syncing time', err),
    });
  }

  getCorrectedTime(): number {
    return new Date().getTime() + this.timeOffset;
  }
}
