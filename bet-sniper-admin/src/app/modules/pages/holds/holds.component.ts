import { Component, OnInit, inject, TemplateRef, ViewChild, OnDestroy } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { Hold, HoldsService, HoldStatus } from 'src/app/services/holds.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-holds',
  standalone: true,
  imports: [SharedModule, RouterModule],
  templateUrl: './holds.component.html',
  styleUrls: []
})
export class HoldsComponent implements OnInit, OnDestroy {
  private holdsService = inject(HoldsService);
  private modalService = inject(NgbModal);

  holds: Hold[] = [];
  filteredHolds: Hold[] = [];
  paginatedHolds: Hold[] = [];
  loading = false;
  selectedHold: Hold | null = null;
  rejectReason = '';
  modalRef: NgbModalRef | null = null;
  search = '';
  statusFilter = '';
  private searchSubject = new Subject<string>();

  total = 0;
  page = 1;
  limit = 50;

  @ViewChild('confirmApproveModal') confirmApproveModal!: TemplateRef<any>;
  @ViewChild('rejectModal') rejectModal!: TemplateRef<any>;

  ngOnInit() {
    this.loadHolds();
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.page = 1; // Reset to page 1 on search
      this.applyFilter();
    });
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  loadHolds() {
    this.loading = true;
    this.holdsService.findAll().subscribe({
      next: (res) => {
        this.holds = res;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading holds', err);
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

    // 1. Filter by search term
    let result = [...this.holds];
    if (term) {
      result = result.filter(
        (hold) =>
          (hold.user_id?.username && hold.user_id.username.toLowerCase().includes(term)) ||
          (hold.user_id?.email && hold.user_id.email.toLowerCase().includes(term)) ||
          (hold.wallet && hold.wallet.toLowerCase().includes(term))
      );
    }

    // 2. Filter by status
    if (this.statusFilter) {
      result = result.filter((hold) => hold.status === this.statusFilter);
    }

    // 3. Sort: PENDING first, then by date (optional, but good practice to keep stability)
    result.sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      // Secondary sort by date descending if needed, or keep original order
      return 0;
    });

    this.filteredHolds = result;
    this.total = this.filteredHolds.length;
    this.updatePaginatedHolds();
  }

  onPageChange(page: number) {
    this.page = page;
    this.updatePaginatedHolds();
  }

  updatePaginatedHolds() {
    const startIndex = (this.page - 1) * this.limit;
    const endIndex = startIndex + this.limit;
    this.paginatedHolds = this.filteredHolds.slice(startIndex, endIndex);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  openApproveModal(hold: Hold) {
    this.selectedHold = hold;
    this.modalRef = this.modalService.open(this.confirmApproveModal, { centered: true });
  }

  confirmApprove() {
    if (!this.selectedHold) return;
    this.holdsService.approve(this.selectedHold._id).subscribe({
      next: () => {
        this.loadHolds();
        this.closeModal();
      },
      error: (err) => {
        console.error('Error approving hold', err);
      }
    });
  }

  openRejectModal(hold: Hold) {
    this.selectedHold = hold;
    this.rejectReason = '';
    this.modalRef = this.modalService.open(this.rejectModal, { centered: true });
  }

  confirmReject() {
    if (!this.selectedHold) return;
    this.holdsService.reject(this.selectedHold._id, this.rejectReason).subscribe({
      next: () => {
        this.loadHolds();
        this.closeModal();
      },
      error: (err) => {
        console.error('Error rejecting hold', err);
      }
    });
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
      this.selectedHold = null;
      this.rejectReason = '';
    }
  }
}
