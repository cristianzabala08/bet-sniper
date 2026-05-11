import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-responsive">
      <table class="table table-hover" [ngClass]="{ 'table-dark': isDark }">
        <thead>
          <tr>
            <th *ngFor="let col of columns">{{ col.header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of data">
            <td *ngFor="let col of columns">
              <ng-container *ngIf="!col.template">{{ row[col.field] }}</ng-container>
              <ng-container *ngIf="col.template">
                <!-- Simple template handling or specific formatting logic can go here -->
                <span [innerHTML]="col.template(row)"></span>
              </ng-container>
            </td>
          </tr>
          <tr *ngIf="data.length === 0">
            <td [attr.colspan]="columns.length" class="text-center">No data found</td>
          </tr>
        </tbody>
      </table>

      <div class="d-flex justify-content-between p-2" *ngIf="pagination">
        <button class="btn btn-sm btn-outline-secondary" [disabled]="page <= 1" (click)="changePage(page - 1)">Previous</button>
        <span>Page {{ page }}</span>
        <button class="btn btn-sm btn-outline-secondary" (click)="changePage(page + 1)">Next</button>
      </div>
    </div>
  `,
  styles: [
    `
      .table-dark {
        background-color: #2c2c2c;
        color: #fff;
      }
    `
  ]
})
export class DataTableComponent {
  @Input() data: any[] = [];
  @Input() columns: { header: string; field: string; template?: (row: any) => string }[] = [];
  @Input() isDark: boolean = true;
  @Input() pagination: boolean = true;
  @Input() page: number = 1;

  @Output() pageChange = new EventEmitter<number>();

  changePage(newPage: number) {
    this.pageChange.emit(newPage);
  }
}
