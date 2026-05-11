import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActiveSignalsComponent } from '../../components/active-signals/active-signals.component';
import { SessionStatsComponent } from '../../components/session-stats/session-stats.component';
import { InfoCardsComponent } from '../../../../shared/components/info-cards/info-cards.component';
import { LogoComponent } from 'src/app/shared/components/logo/logo.component';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    CommonModule,
    ActiveSignalsComponent, // Importar aquí
    SessionStatsComponent, // Importar aquí
    InfoCardsComponent, // Importar aquí
    LogoComponent,
  ],
})
export class HomeComponent {}
