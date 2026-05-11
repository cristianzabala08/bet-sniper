import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-notificacions-modal',
  templateUrl: './notificacions-modal.component.html',
  styleUrls: ['./notificacions-modal.component.scss'],
   standalone: true,
  imports: [CommonModule],
})
export class NotificacionsModalComponent {

    // 1. Receive data from the parent component
  @Input() notification: any = null; 

  // 2. Send an event to close the modal
  @Output() close = new EventEmitter<void>();

  constructor() { }

  closeModal() {
    this.close.emit();
  }
}