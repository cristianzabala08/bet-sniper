import { Component, OnInit, inject, TemplateRef, ViewChild, OnDestroy } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { User, UsersService } from 'src/app/services/users.service';
import { Plan, PlansService } from 'src/app/services/plans.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [SharedModule, RouterModule], // SharedModule exports CommonModule, FormsModule, CardComponent, NgbModule
  templateUrl: './users.component.html',
  styleUrls: []
})
export class UsersComponent implements OnInit, OnDestroy {
  private usersService = inject(UsersService);
  private plansService = inject(PlansService);
  private modalService = inject(NgbModal);
  private storageService = inject(StorageService);

  users: User[] = []; // Displayed users
  allUsers: User[] = []; // All fetched users
  filteredUsers: User[] = []; // Users after search filter

  total = 0;
  page = 1;
  limit = 50; // Pagination limit
  search = '';

  private searchSubject = new Subject<string>();
  private emailSubject = new Subject<string>();

  // Modal State
  selectedUser: User | null = null;
  selectedUserForEdit: any = {};
  passwordForm: any = { password: '' };
  modalRef: NgbModalRef | null = null;
  emailUnavailable = false;
  emailCheckMessage = '';

  // Plans assignment
  availablePlans: Plan[] = [];
  selectedPlanId = '';
  currentStaffRole = '';

  @ViewChild('blockModal') blockModal!: TemplateRef<any>;
  @ViewChild('editModal') editModal!: TemplateRef<any>;
  @ViewChild('passwordModal') passwordModal!: TemplateRef<any>;
  @ViewChild('reset2FAModal') reset2FAModal!: TemplateRef<any>;
  @ViewChild('assignPlanModal') assignPlanModal!: TemplateRef<any>;
  @ViewChild('forceActionModal') forceActionModal!: TemplateRef<any>;

  ngOnInit() {
    this.loadUsers();
    this.loadPlans();
    this.loadCurrentRole();

    // Listen for search changes with debounce
    this.searchSubject.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.onSearch();
    });

    this.emailSubject.pipe(debounceTime(500), distinctUntilChanged()).subscribe((email) => {
      this.checkEmail(email);
    });
  }

  loadPlans() {
    this.plansService.findAll(false).subscribe({
      next: (plans) => this.availablePlans = plans,
      error: (err) => console.error('Error loading plans', err)
    });
  }

  loadCurrentRole() {
    const user = this.storageService.getStaffUser();
    if (user) {
      this.currentStaffRole = user.role || '';
    }
  }

  get isSuperAdmin(): boolean {
    return this.currentStaffRole === 'super_admin';
  }

  ngOnDestroy() {
    this.searchSubject.complete();
    this.emailSubject.complete();
  }

  loadUsers() {
    // Fetch a large number of users to handle client-side filtering effectively
    this.usersService.findAll(1, 10000, '').subscribe({
      next: (res) => {
        this.allUsers = res.data;
        this.applyFilter(); // Initial filter application
      },
      error: (err) => {
        console.error('Error loading users', err);
        // Optionally show a toast or error message
      }
    });
  }

  onPageChange(page: number) {
    this.page = page;
    this.updatePaginatedUsers();
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

    if (!term) {
      this.filteredUsers = [...this.allUsers];
    } else {
      this.filteredUsers = this.allUsers.filter(
        (user) =>
          (user.fullname && user.fullname.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term)) ||
          (user.username && user.username.toLowerCase().includes(term))
      );
    }

    this.total = this.filteredUsers.length;
    this.updatePaginatedUsers();
  }

  updatePaginatedUsers() {
    const startIndex = (this.page - 1) * this.limit;
    const endIndex = startIndex + this.limit;
    this.users = this.filteredUsers.slice(startIndex, endIndex);
  }

  // Actions
  openBlockModal(user: User) {
    this.selectedUser = user;
    this.modalRef = this.modalService.open(this.blockModal, { centered: true });
  }

  confirmBlock() {
    if (!this.selectedUser || !this.selectedUser._id) return;
    const newStatus = !this.selectedUser.activated;
    this.usersService.blockUser(this.selectedUser._id, newStatus).subscribe({
      next: () => {
        if (this.selectedUser) {
          this.selectedUser.activated = newStatus;
          this.selectedUser.status = newStatus ? 'active' : 'expired'; // Assuming 'expired' maps to inactive/blocked for UI
        }
        this.closeModal();
      },
      error: (err) => console.error('Error blocking user', err)
    });
  }

  openEditModal(user: User) {
    this.selectedUser = user;
    this.selectedUserForEdit = { ...user }; // Clone
    this.emailUnavailable = false;
    this.emailCheckMessage = '';
    this.modalRef = this.modalService.open(this.editModal, { size: 'lg' });
  }

  onEmailChange(email: string) {
    if (this.selectedUser && email === this.selectedUser.email) {
      this.emailUnavailable = false;
      this.emailCheckMessage = '';
      return;
    }
    this.emailSubject.next(email);
  }

  checkEmail(email: string) {
    if (!email || !this.selectedUser?._id) return;
    this.usersService.checkEmailAvailability(this.selectedUser._id, email).subscribe({
      next: (res) => {
        this.emailUnavailable = !res.available;
        this.emailCheckMessage = res.message;
        console.log('Email check:', res);
      },
      error: (err) => {
        console.error('Error checking email', err);
      }
    });
  }

  saveUser() {
    if (!this.selectedUser || !this.selectedUser._id) return;
    if (this.emailUnavailable) return;

    // Filter data to strictly send only allowed fields
    const dataToUpdate = {
      fullname: this.selectedUserForEdit.fullname,
      email: this.selectedUserForEdit.email,
      username: this.selectedUserForEdit.username,
      wallet: this.selectedUserForEdit.wallet
    };
    // console.log('show modal-> ' + JSON.stringify(this.selectedUserForEdit));

    this.usersService.updateUser(this.selectedUser._id, dataToUpdate).subscribe({
      next: (result) => {
        // Update the user in the local list without reloading from server if possible,
        // to avoid resetting scroll/search state, or just reload.
        // For simplicity, let's update local reference if we can, or just reload.
        // Reloading is safer to ensure consistency.
        this.loadUsers();
        this.closeModal();
        // console.log('resp saveUser-> ' + JSON.stringify(result));
      },
      error: (err) => console.error('Error updating user', err)
    });
  }

  openPasswordModal(user: User) {
    this.selectedUser = user;
    this.passwordForm = { password: '' };
    this.modalRef = this.modalService.open(this.passwordModal, { centered: true });
  }

  savePassword() {
    if (!this.selectedUser || !this.selectedUser._id) return;
    this.usersService.changePassword(this.selectedUser._id, this.passwordForm.password).subscribe({
      next: () => {
        // Show success toast?
        console.log('Password changed');
        this.closeModal();
      },
      error: (err) => console.error('Error changing password', err)
    });
  }

  openReset2FAModal(user: User) {
    this.selectedUser = user;
    this.modalRef = this.modalService.open(this.reset2FAModal, { centered: true });
  }

  confirmReset2FA(userId: string) {
    if (!userId) return;
    this.usersService.adminReset2FA(userId).subscribe({
      next: () => {
        console.log('2FA reset successfully');
        this.closeModal();
      },
      error: (err) => console.error('Error resetting 2FA', err)
    });
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
  }

  getPlanBadgeClass(plan: string): string {
    switch (plan) {
      case 'ELITE':
        return 'bg-danger';
      case 'EXPERT':
        return 'bg-warning';
      case 'PRO':
        return 'bg-primary';
      case 'AMATEUR':
        return 'bg-info';
      case 'BASIC':
        return 'bg-success';
      case 'WEEKLY':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  }

  // Helper for Math.min
  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  getInitials(name: string): string {
    if (!name) return '';
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  }

  // Plan Assignment
  openAssignPlanModal(user: User) {
    this.selectedUser = user;
    this.selectedPlanId = '';
    this.modalRef = this.modalService.open(this.assignPlanModal, { centered: true });
  }

  confirmAssignPlan() {
    if (!this.selectedUser || !this.selectedUser._id || !this.selectedPlanId) return;
    this.plansService.assignPlan({
      userId: this.selectedUser._id,
      planId: this.selectedPlanId
    }).subscribe({
      next: (res) => {
        console.log('Plan assigned:', res);
        this.loadUsers();
        this.closeModal();
      },
      error: (err) => {
        console.error('Error assigning plan', err);
        alert(err.error?.message || 'Error al asignar el plan');
      }
    });
  }

  // Force Plan Actions
  forceAction: 'activate' | 'expire' = 'activate';

  openForceActionModal(user: User, action: 'activate' | 'expire') {
    this.selectedUser = user;
    this.forceAction = action;
    this.modalRef = this.modalService.open(this.forceActionModal, { centered: true });
  }

  confirmForceAction() {
    if (!this.selectedUser || !this.selectedUser._id) return;
    this.plansService.forcePlanAction({
      userId: this.selectedUser._id,
      action: this.forceAction
    }).subscribe({
      next: (res) => {
        console.log('Force action result:', res);
        this.loadUsers();
        this.closeModal();
      },
      error: (err) => {
        console.error('Error forcing plan action', err);
        alert(err.error?.message || 'Error al forzar acción');
      }
    });
  }

  getAvatarColor(name: string): string {
    const colors = [
      '#7267EF', // Purple
      '#17A2B8', // Info/Blue
      '#28A745', // Success/Green
      '#DC3545', // Danger/Red
      '#FD7E14', // Orange
      '#20C997', // Teal
      '#6610f2', // Indigo
      '#e83e8c' // Pink
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }
}
