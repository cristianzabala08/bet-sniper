import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseService } from 'src/app/core/services/purchase.service';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss'],
})
export class LoadingOverlayComponent {
  private purchaseService = inject(PurchaseService);

  // Expose signals to template
  isLoading = this.purchaseService.isLoading;
  message = this.purchaseService.loadingMessage;
}
