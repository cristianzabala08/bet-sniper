import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-manual-verify-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './manual-verify-modal.component.html',
  styleUrls: ['./manual-verify-modal.component.scss'],
})
export class ManualVerifyModalComponent {
  @Input() isVisible: boolean = false;
  txHash: string = '';

  @Output() verify = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  onVerify() {
    if (this.txHash) {
      this.verify.emit(this.txHash);
      this.txHash = ''; // Reset after emit
    }
  }

  onCancel() {
    this.cancel.emit();
    this.txHash = ''; // Reset on cancel
  }
}
