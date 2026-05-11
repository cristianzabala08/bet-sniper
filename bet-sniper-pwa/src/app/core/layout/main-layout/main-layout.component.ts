import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommonModule } from '@angular/common';
import { OracleService } from '../../services/oracle.service';

@Component({
  standalone: true,
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  imports: [RouterModule, TranslateModule, FormsModule, CommonModule],
})
export class MainLayoutComponent {
  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  isProfileMenuOpen = false;

  private oracleService = inject(OracleService);

  isExpanded: boolean = true; // Always visible as per design
  searchQuery: string = '';
  isThinking: boolean = false;
  responseMessage: string | null = null;

  toggleProfileMenu() {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  async onSearch() {
    if (!this.searchQuery.trim()) return;

    this.isThinking = true;
    this.responseMessage = null;

    try {
      // Call service
      const response = await this.oracleService.ask(this.searchQuery);
      this.responseMessage = response;
    } catch (error) {
      this.responseMessage =
        'Lo siento, no pude procesar tu solicitud en este momento.';
    } finally {
      this.isThinking = false;
      this.searchQuery = ''; // Clear input or keep it? Design usually keeps until new search
      // keeping input clear for now
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }
}
