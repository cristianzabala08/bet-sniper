// angular import
import { Component, inject, OnInit } from '@angular/core';

// bootstrap import
import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';

// project import
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { ThemeService } from '../../../../shared/service/theme.service';

import { StaffAuthService } from 'src/app/services/staff-auth.service';

@Component({
  selector: 'app-nav-right',
  imports: [SharedModule],
  templateUrl: './nav-right.component.html',
  styleUrls: ['./nav-right.component.scss'],
  providers: [NgbDropdownConfig]
})
export class NavRightComponent implements OnInit {
  // public props
  private staffAuthService = inject(StaffAuthService);

  // constructor
  constructor(public themeService: ThemeService) {
    const config = inject(NgbDropdownConfig);

    config.placement = 'bottom-right';
  }

  logout() {
    this.staffAuthService.logout();
  }

  ngOnInit() {}
}
