import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private snackBar = inject(MatSnackBar);

  showError(message: string) {
    this.error(message);
  }

  showSuccess(message: string) {
    this.success(message);
  }

  success(message: string) {
    this.snackBar.open(message, '', {
      duration: 3000,
      panelClass: ['toast-success'],
      verticalPosition: 'top',
      horizontalPosition: 'right',
    });
  }

  error(message: string) {
    this.snackBar.open(message, '', {
      duration: 4000,
      panelClass: ['snack-error'],
      verticalPosition: 'top',
      horizontalPosition: 'right',
    });
  }

  info(message: string) {
    this.snackBar.open(message, '', {
      duration: 3000,
      panelClass: ['toast-info'],
      verticalPosition: 'top',
      horizontalPosition: 'right',
    });
  }
}
