import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { SignalsService } from 'src/app/core/services/signals.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { getMartingaleDisplayStep } from 'src/app/core/utils/martingale-display.util';

@Component({
  standalone: true,
  selector: 'app-automatic-mode',
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './automatic-mode.component.html',
  styleUrls: ['./automatic-mode.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomaticModeComponent implements OnInit, OnDestroy {
  sessionActive = false;
  showPauseConfirmation = false;
  martingaleLevel = '1';

  private subscriptions = new Subscription();

  constructor(
    private signalsService: SignalsService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.signalsService.sessionActive$.subscribe((active) => {
        this.sessionActive = active;
        this.cdr.markForCheck();
      }),
    );

    this.subscriptions.add(
      this.signalsService.getDashboardUpdates().subscribe((update) => {
        if (update?.martingalaData) {
          this.martingaleLevel = getMartingaleDisplayStep(update.martingalaData);
          this.cdr.markForCheck();
        }
      }),
    );

    this.signalsService.getSignals().subscribe({
      next: (data) => {
        this.martingaleLevel = getMartingaleDisplayStep(data?.ultimoResult);
        this.cdr.markForCheck();
      },
      error: () => {
        // el nivel se mantiene en su valor por defecto si falla la carga inicial
      },
    });
  }

  start(): void {
    this.signalsService.connect();
    this.toastService.showSuccess('Sniper activado');
  }

  requestPause(): void {
    this.showPauseConfirmation = true;
  }

  confirmPause(): void {
    this.signalsService.disconnect();
    this.showPauseConfirmation = false;
    this.toastService.showSuccess('Sniper pausado');
  }

  cancelPause(): void {
    this.showPauseConfirmation = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
