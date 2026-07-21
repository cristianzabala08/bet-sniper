import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LandingService, LandingConfig } from '../../services/landing.service';
import { HeroCinematicComponent } from '../../components/hero-cinematic/hero-cinematic.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeroCinematicComponent],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit {
  private landingService = inject(LandingService);
  config: LandingConfig | null = null;
  mobileMenuOpen = false;

  ngOnInit() {
    this.landingService.getConfig().subscribe(cfg => {
      this.config = cfg;
    });
  }
}
