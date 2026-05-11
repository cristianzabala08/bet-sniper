import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private _languageSelected = 'es';

  /**
   * @constructor
   * @param translate
   */
  constructor(private translate: TranslateService) {
    if (localStorage['language']) {
      this.languageSelected = localStorage['language'];
    }
    this.translate.use(this._languageSelected);
  }

  public get languageSelected() {
    return this._languageSelected;
  }

  public set languageSelected(value) {
    this._languageSelected = value;
    localStorage['language'] = value;
    this.translate.use(value);
  }
}
