import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'lang-dropdown',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule],
  templateUrl: './lang-dropdown.component.html',
  styleUrls: ['./lang-dropdown.component.scss'],
})
export class LangDropdownComponent {
  public _chosenLanguage = 'ES';

  constructor(private languageService: LanguageService) {
    const saved = languageService.languageSelected;
    this._chosenLanguage = saved ? saved.toUpperCase() : 'ES';
  }

  get chosenLanguage() {
    return this._chosenLanguage;
  }

  public selectLanguage(languageSelected: string): void {
    this._chosenLanguage = languageSelected.toUpperCase();
    this.languageService.languageSelected = languageSelected;
  }
}
