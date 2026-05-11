import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true, // <--- AGREGA ESTO
  imports: [CommonModule, TranslateModule],
  selector: 'app-info-cards',
  templateUrl: './info-cards.component.html',
  styleUrls: ['./info-cards.component.scss'],
})
export class InfoCardsComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
