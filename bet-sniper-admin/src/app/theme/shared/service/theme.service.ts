import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = false;

  constructor() {
    this.checkPreference();
  }

  private checkPreference() {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      this.enableDarkMode();
    } else {
      this.disableDarkMode();
    }
  }

  toggleTheme() {
    if (this.darkMode) {
      this.disableDarkMode();
      localStorage.setItem('theme', 'light');
    } else {
      this.enableDarkMode();
      localStorage.setItem('theme', 'dark');
    }
  }

  private enableDarkMode() {
    this.darkMode = true;
    document.body.classList.add('dark-mode');
  }

  private disableDarkMode() {
    this.darkMode = false;
    document.body.classList.remove('dark-mode');
  }

  isDarkMode() {
    return this.darkMode;
  }
}
