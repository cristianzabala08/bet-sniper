import { Component, OnInit, inject } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { Transaction, TransactionsService } from 'src/app/services/transactions.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-transactions-admin',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './transactions-admin.component.html',
  styleUrls: []
})
export class TransactionsAdminComponent implements OnInit {
  private transactionsService = inject(TransactionsService);

  transactions: Transaction[] = [];
  total = 0;
  page = 1;
  limit = 10;
  loading = false;

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.loading = true;
    this.transactionsService.getAllTransactions(this.page, this.limit).subscribe({
      next: (res) => {
        this.transactions = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading transactions', err);
        this.loading = false;
      }
    });
  }

  onPageChange(page: number) {
    this.page = page;
    this.loadTransactions();
  }
}
