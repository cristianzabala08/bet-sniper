import { Injectable, TemplateRef } from '@angular/core';

export interface ToastInfo {
  textOrTpl: string | TemplateRef<any>;
  classname?: string;
  delay?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: ToastInfo[] = [];

  show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
    this.toasts.push({ textOrTpl, ...options });
  }

  remove(toast: ToastInfo) {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }

  clear() {
    this.toasts = [];
  }

  success(message: string) {
    this.show(message, { classname: 'bg-success text-light', delay: 5000 });
  }

  error(message: string) {
    this.show(message, { classname: 'bg-danger text-light', delay: 5000 });
  }

  info(message: string) {
    this.show(message, { classname: 'bg-info text-light', delay: 5000 });
  }
}
