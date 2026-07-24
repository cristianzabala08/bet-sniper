import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { LangDropdownComponent } from './shared/components/lang-dropdown/lang-dropdown.component';
import { LoadingOverlayComponent } from './shared/components/loading-overlay/loading-overlay.component';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { filter } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, LangDropdownComponent, LoadingOverlayComponent, MatSnackBarModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  title = 'bet-sniper';
  private swUpdate = inject(SwUpdate);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  // Las páginas de /auth traen su propio selector de idioma integrado al diseño
  showGlobalChrome = !this.router.url.startsWith('/auth');

  ngOnInit() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.showGlobalChrome = !e.urlAfterRedirects.startsWith('/auth');
      });

    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter(
            (evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'
          )
        )
        .subscribe(() => {
          const snack = this.snackBar.open(
            'Nueva versión disponible / New version available',
            'Reload',
            {
              duration: 10000,
            }
          );

          snack.onAction().subscribe(() => {
            document.location.reload();
          });
        });
    }
  }
}
