import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { Commission, CommissionsService } from 'src/app/services/commissions.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-commissions-admin',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './commissions-admin.component.html',
  styleUrls: []
})
export class CommissionsAdminComponent implements OnInit, OnDestroy {
  private commissionsService = inject(CommissionsService);

  allCommissions: Commission[] = [];
  filteredCommissions: Commission[] = [];
  paginatedCommissions: Commission[] = [];

  total = 0;
  page = 1;
  limit = 50;
  loading = false;
  search = '';
  statusFilter = '';
  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.loadCommissions();
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.page = 1;
      this.applyFilter();
    });
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  loadCommissions() {
    this.loading = true;
    // Fetch large amount for client-side filtering
    this.commissionsService.getAllCommissions(1, 10000).subscribe({
      next: (res) => {
        // Sort commissions: pending first, approved second
        this.allCommissions = res.data.sort((a, b) => {
          const statusOrder: Record<string, number> = { pending: 0, approved: 1, rejected: 2, skipped: 3 };
          const statusA = a.validation_status || 'skipped';
          const statusB = b.validation_status || 'skipped';
          return (statusOrder[statusA] ?? 99) - (statusOrder[statusB] ?? 99);
        });
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading commissions', err);
        this.loading = false;
      }
    });
  }

  onSearch() {
    this.page = 1;
    this.applyFilter();
  }

  onSearchChange() {
    this.searchSubject.next(this.search);
  }

  applyFilter() {
    const term = this.search.toLowerCase().trim();

    let filtered = [...this.allCommissions];

    // Filter by search term
    if (term) {
      filtered = filtered.filter((com) => {
        const username = typeof com.receiver_id === 'object' && com.receiver_id?.username ? com.receiver_id.username.toLowerCase() : '';
        const email = typeof com.receiver_id === 'object' && com.receiver_id?.email ? com.receiver_id.email.toLowerCase() : '';
        const txId = com.transaction_id ? com.transaction_id.toLowerCase() : '';

        return username.includes(term) || email.includes(term) || txId.includes(term);
      });
    }

    // Filter by status
    if (this.statusFilter) {
      filtered = filtered.filter((com) => com.validation_status === this.statusFilter);
    }

    this.filteredCommissions = filtered;
    this.total = this.filteredCommissions.length;
    this.updatePaginatedCommissions();
  }

  onPageChange(page: number) {
    this.page = page;
    this.updatePaginatedCommissions();
  }

  updatePaginatedCommissions() {
    const startIndex = (this.page - 1) * this.limit;
    const endIndex = startIndex + this.limit;
    this.paginatedCommissions = this.filteredCommissions.slice(startIndex, endIndex);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
}
