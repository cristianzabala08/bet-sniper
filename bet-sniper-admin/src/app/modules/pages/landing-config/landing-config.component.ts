import { Component, OnInit, inject } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { LandingConfigService, LandingConfig } from 'src/app/services/landing-config.service';

@Component({
  selector: 'app-landing-config',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './landing-config.component.html',
  styleUrls: ['./landing-config.component.scss']
})
export class LandingConfigComponent implements OnInit {
  private configService = inject(LandingConfigService);

  config: LandingConfig | null = null;
  loading = false;
  saving = false;
  saveSuccess = false;
  featureInput = '';

  // Social links
  socialTelegram = '';
  socialTwitter = '';
  socialInstagram = '';
  socialDiscord = '';

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    this.loading = true;
    this.configService.getConfig().subscribe({
      next: (cfg) => {
        this.config = cfg;
        if (cfg.socialLinks) {
          this.socialTelegram = cfg.socialLinks['telegram'] || '';
          this.socialTwitter = cfg.socialLinks['twitter'] || '';
          this.socialInstagram = cfg.socialLinks['instagram'] || '';
          this.socialDiscord = cfg.socialLinks['discord'] || '';
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  addFeature() {
    const f = this.featureInput.trim();
    if (f && this.config && !this.config.martingalaFeatures.includes(f)) {
      this.config.martingalaFeatures.push(f);
      this.featureInput = '';
    }
  }

  removeFeature(index: number) {
    if (this.config) {
      this.config.martingalaFeatures.splice(index, 1);
    }
  }

  saveConfig() {
    if (!this.config) return;
    this.saving = true;
    this.saveSuccess = false;

    const data = {
      ...this.config,
      socialLinks: {
        telegram: this.socialTelegram,
        twitter: this.socialTwitter,
        instagram: this.socialInstagram,
        discord: this.socialDiscord
      }
    };

    this.configService.updateConfig(data).subscribe({
      next: () => {
        this.saving = false;
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
      error: (err) => {
        this.saving = false;
        alert(err.error?.message || 'Error al guardar la configuración');
      }
    });
  }
}
