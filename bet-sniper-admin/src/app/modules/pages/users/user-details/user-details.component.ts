import { Component, OnInit, inject, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { User, UsersService } from 'src/app/services/users.service';
import { Transaction, TransactionsService } from 'src/app/services/transactions.service';
import { Commission, CommissionsService } from 'src/app/services/commissions.service';
import { Hold, HoldsService } from 'src/app/services/holds.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './user-details.component.html',
  styleUrls: []
})
export class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private usersService = inject(UsersService);
  private transactionsService = inject(TransactionsService);
  private commissionsService = inject(CommissionsService);
  private holdsService = inject(HoldsService);
  private modalService = inject(NgbModal);

  user: User | null = null;
  loading = true;
  modalRef: NgbModalRef | null = null;

  // Transactions State
  transactions: Transaction[] = [];
  txTotal = 0;
  txPage = 1;
  txLimit = 10;
  txLoading = false;

  // Commissions State
  commissions: Commission[] = [];
  comTotal = 0;
  comPage = 1;
  comLimit = 10;
  comLoading = false;

  // Holds State
  holds: Hold[] = [];
  holdsLoading = false;

  @ViewChild('reset2FAModal') reset2FAModal!: TemplateRef<any>;
  @ViewChild('purchasePlanModal') purchasePlanModal!: TemplateRef<any>;
  @ViewChild('manualPurchaseModal') manualPurchaseModal!: TemplateRef<any>;
  @ViewChild('planSelectionModal') planSelectionModal!: TemplateRef<any>;

  plans = [
    { id: 1, name: 'WEEKLY', price: 30, duration: '1 Week', color: 'orange', icon: 'star' },
    { id: 2, name: 'BASIC', price: 99, duration: '1 Month', color: 'gray', icon: 'calendar' },
    { id: 3, name: 'AMATEUR', price: 299, duration: '3 Months', color: 'blue', icon: 'calendar' },
    { id: 4, name: 'PRO', price: 599, duration: '6 Months', color: 'purple', icon: 'calendar' },
    { id: 5, name: 'EXPERT', price: 899, duration: '9 Months', color: 'red', icon: 'medal' },
    { id: 6, name: 'ELITE', price: 1100, duration: '12 Months', color: 'green', icon: 'crown' }
  ];

  selectedPlan: any = null;
  // purchasePlanTxHash removed
  purchaseLoading = false;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUser(id);
    } else {
      this.loading = false;
    }
  }

  loadUser(id: string) {
    this.loading = true;
    this.usersService.findOneById(id).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
        if (user._id) {
          this.loadTransactions(user._id);
          this.loadCommissions(user._id);
          this.loadHolds(user._id);
        }
      },
      error: (err) => {
        console.error('Error loading user details', err);
        this.loading = false;
      }
    });
  }

  loadTransactions(userId: string) {
    console.log('Loading transactions for user:', userId);
    this.txLoading = true;
    this.transactionsService.getUserTransactions(userId, this.txPage, this.txLimit).subscribe({
      next: (res) => {
        console.log('Transactions loaded:', res);
        this.transactions = res.data;
        this.txTotal = res.total;
        this.txLoading = false;
      },
      error: (err) => {
        console.error('Error loading transactions', err);
        this.txLoading = false;
      }
    });
  }

  onTxPageChange(page: number) {
    this.txPage = page;
    if (this.user && this.user._id) {
      this.loadTransactions(this.user._id);
    }
  }

  loadCommissions(userId: string) {
    this.comLoading = true;
    this.commissionsService.getUserCommissions(userId, this.comPage, this.comLimit).subscribe({
      next: (res) => {
        this.commissions = res.data;
        this.comTotal = res.total;
        this.comLoading = false;
      },
      error: (err) => {
        console.error('Error loading commissions', err);
        this.comLoading = false;
      }
    });
  }

  onComPageChange(page: number) {
    this.comPage = page;
    if (this.user && this.user._id) {
      this.loadCommissions(this.user._id);
    }
  }

  loadHolds(userId: string) {
    this.holdsLoading = true;
    this.holdsService.findByUser(userId).subscribe({
      next: (res) => {
        this.holds = res;
        this.holdsLoading = false;
      },
      error: (err) => {
        console.error('Error loading holds', err);
        this.holdsLoading = false;
      }
    });
  }

  openReset2FAModal() {
    this.modalRef = this.modalService.open(this.reset2FAModal, { centered: true });
  }

  confirmReset2FA() {
    if (!this.user || !this.user._id) return;
    this.usersService.adminReset2FA(this.user._id).subscribe({
      next: (res) => {
        console.log(res.message);
        // Toast success?
        if (this.user) {
          this.user.twoFactorEnabled = false; // Optimistic update
        }
        this.closeModal();
      },
      error: (err) => console.error('Error resetting 2FA', err)
    });
  }

  manualTxHash: string = '';

  openPlanSelectionModal() {
    this.modalRef = this.modalService.open(this.planSelectionModal, { centered: true, size: 'lg' });
  }

  openManualPurchaseModal() {
    this.manualTxHash = '';
    this.modalRef = this.modalService.open(this.manualPurchaseModal, { centered: true });
  }

  openPurchasePlanModal(plan: any) {
    this.selectedPlan = plan;
    this.closeModal(); // Close selection modal
    this.modalRef = this.modalService.open(this.purchasePlanModal, { centered: true });
  }

  confirmPurchasePlan() {
    if (!this.user || !this.user._id || !this.selectedPlan) return;

    this.purchaseLoading = true;
    this.transactionsService.adminPurchasePlan(this.user._id, this.selectedPlan.id).subscribe({
      next: (res) => {
        console.log('Purchase Plan Success:', res);
        if (this.user && this.user._id) {
          this.loadUser(this.user._id);
        }
        this.closeModal();
        this.purchaseLoading = false;
      },
      error: (err) => {
        console.error('Error purchasing plan:', err);
        this.purchaseLoading = false;
      }
    });
  }

  confirmManualPurchase() {
    if (!this.user || !this.user._id || !this.manualTxHash) return;

    this.purchaseLoading = true;
    this.transactionsService.manualPurchasePlan(this.user._id, this.manualTxHash).subscribe({
      next: (res) => {
        console.log('Manual Purchase Plan Success:', res);
        if (this.user && this.user._id) {
          this.loadUser(this.user._id);
        }
        this.closeModal();
        this.purchaseLoading = false;
      },
      error: (err) => {
        console.error('Error manually purchasing plan:', err);
        this.purchaseLoading = false;
      }
    });
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
  }

  // Helpers
  getInitials(name: string): string {
    if (!name) return '';
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  }

  getAvatarColor(name: string): string {
    const colors = ['#7267EF', '#17A2B8', '#28A745', '#DC3545', '#FD7E14', '#20C997', '#6610f2', '#e83e8c'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
}
