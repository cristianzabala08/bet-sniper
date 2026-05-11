import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SignalsService } from 'src/app/core/services/signals.service';
import { ActiveSignalsComponent } from '../../components/active-signals/active-signals.component';
import { LogoComponent } from 'src/app/shared/components/logo/logo.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-signals-list',
  templateUrl: './signals-list.component.html',
  styleUrls: ['./signals-list.component.scss'],
  imports: [
    CommonModule,
    ActiveSignalsComponent,
    LogoComponent,
    TranslateModule,
  ],
})
export class SignalsListComponent implements OnInit {
  dailySignals: any[] = [];

  isLoading: boolean = false;

  constructor(private signalsService: SignalsService) {}

  ngOnInit() {
    this.loadSignals();
  }

  loadSignals() {
    this.isLoading = true;
    this.signalsService.getDailySignals().subscribe({
      next: (data) => {
        this.dailySignals = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error refreshing signals', err);
        this.isLoading = false;
      },
    });
  }

  refreshData() {
    this.loadSignals();
  }

  getSignalStatus(signal: any): 'win' | 'loss' | 'pending' {
    if (signal.win === true) return 'win';
    if (signal.win === false) return 'loss';
    return 'pending';
  }

  getAmount(signal: any): string {
    // Placeholder logic since API doesn't return amount
    // Could track profit from martingale step?
    return '10.00';
  }

  getForecastItems(signal: any): any[] {
    const data = signal.data?.results || signal.data?.signal;
    if (!data || !data.vector_forecast) return [];

    const vector = data.vector_forecast;
    const winVector = data.vector_win || [];
    const currentStep = data.numero_martingala || 1;
    const isPending = signal.win === null || signal.win === undefined; // Check if signal is still open

    // Condense Win Vector Logic
    const condensedWins: { [key: number]: string } = {};
    let stepIndex = 0;
    let hasWon = false;

    for (const result of winVector) {
      if (result === 'L') {
        condensedWins[stepIndex] = 'L';
        stepIndex++;
      } else if (result === 'W') {
        condensedWins[stepIndex] = 'W';
        hasWon = true;
        stepIndex++;
      } else if (result === 'E') {
        condensedWins[stepIndex] = 'E';
      }
    }

    return vector.map((val: string, index: number) => {
      let colorClass = '';
      if (val === 'B') colorClass = 'dot-red';
      else if (val === 'P') colorClass = 'dot-blue';
      else if (val === 'T') colorClass = 'dot-green';

      let displayLabel = (index + 1).toString();
      let winLabel = '';
      let status = 'future';
      let isWinner = false;

      const finalResult = condensedWins[index];

      if (finalResult) {
        if (finalResult === 'W') {
          status = 'won';
          isWinner = true;
          displayLabel = 'W';
          winLabel = 'W';
        } else if (finalResult === 'L') {
          status = 'lost';
          displayLabel = 'L';
          winLabel = 'L';
        } else if (finalResult === 'E') {
          status = 'active';
          displayLabel = 'E';
          winLabel = 'E';
        }
      } else {
        if (index < stepIndex) {
          status = 'lost'; // Past step without explicit result recorded? Treat as lost
        } else if (index === stepIndex && !hasWon && isPending) {
          // Only show as active if the signal is actually pending
          status = 'active';
        }
      }

      return {
        label: val,
        index: index + 1,
        colorClass: colorClass,
        isActive: status === 'active', // For compatibility
        status: status,
        displayLabel: displayLabel,
        winLabel: winLabel,
      };
    });
  }
}
