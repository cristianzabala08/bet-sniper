import { Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  TransactionsService,
  Transaction,
} from 'src/app/core/services/transactions.service';
import { LogoComponent } from 'src/app/shared/components/logo/logo.component';
import { CommonModule } from '@angular/common';
import { ToastService } from 'src/app/core/services/toast.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'app-transaction-history',
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.scss'],
  imports: [LogoComponent, TranslateModule, CommonModule],
})
export class TransactionHistoryComponent implements OnInit {
  transactions: Transaction[] = [];
  paginatedTransactions: Transaction[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  totalItems = 0;

  constructor(
    private transactionsService: TransactionsService,
    private toast: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions() {
    this.transactionsService.getTransactions().subscribe({
      next: (data) => {
        // Sort by date descending (newest first)
        this.transactions = data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.totalItems = this.transactions.length;
        this.updatePagination();
      },
      error: (err) => {
        console.error('Error loading transactions', err);
      },
    });
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedTransactions = this.transactions.slice(startIndex, endIndex);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getTranslationKey(type: 'status' | 'detail', value: string): string {
    if (type === 'status') {
      return `TRANSACTION.STATUS.${value}`;
    }
    return `TRANSACTION.DETAIL.${value}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      case 'PENDING':
        return 'status-pending'; // You might need to add this class to CSS
      case 'ACTIVE':
        return 'status-active';
      default:
        return '';
    }
  }

  isNegative(amount: number): boolean {
    return amount < 0;
  }

  canShowHash(transaction: Transaction): boolean {
    const isApproved = transaction.status === 'APPROVED';
    const isWithdraw = transaction.details === 'WITHDRAW';
    const isMembership =
      !!transaction.details &&
      transaction.details.toUpperCase().includes('MEMBERSHIP');

    return isApproved && (isWithdraw || isMembership) && !!transaction.txHash;
  }

  copyHash(hash?: string) {
    if (!hash) return;
    navigator.clipboard
      .writeText(hash)
      .then(() => {
        this.toast.success(this.translate.instant('HISTORY.HASH_COPIED'));
      })
      .catch((err) => {
        console.error('Failed to copy hash', err);
      });
  }

  openExplorer(hash?: string) {
    if (!hash) return;
    window.open(`https://bscscan.com/tx/${hash}`, '_blank');
  }

  formatType(type: string): string {
    if (!type) return '';
    // Check if it looks like a wallet address (starts with 0x and is long enough)
    if (type.startsWith('0x') && type.length > 10) {
      return `${type.slice(0, 6)}...${type.slice(-4)}`;
    }
    return type;
  }

  downloadExcel() {
    // Generate CSV content
    const header = ['ID', 'Type', 'Details', 'Date', 'Amount', 'Status'];
    const rows = this.transactions.map((t) => [
      t._id,
      t.type,
      t.details,
      new Date(t.createdAt).toLocaleDateString(),
      t.amount,
      t.status,
    ]);

    const csvContent = [
      header.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Create a Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Create a link and trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'transactions.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
