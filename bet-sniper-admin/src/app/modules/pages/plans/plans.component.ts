import { Component, OnInit, inject, TemplateRef, ViewChild } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { Plan, PlansService, CreatePlanDto } from 'src/app/services/plans.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { StorageService } from 'src/app/core/services/storage.service';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit {
  private plansService = inject(PlansService);
  private modalService = inject(NgbModal);
  private storageService = inject(StorageService);

  plans: Plan[] = [];
  loading = false;
  showInactive = true;

  // Current staff role
  currentStaffRole = '';

  // Form state
  planForm: CreatePlanDto = this.getEmptyPlanForm();
  editingPlanId: string | null = null;
  featureInput = '';

  modalRef: NgbModalRef | null = null;
  selectedPlan: Plan | null = null;

  @ViewChild('planModal') planModal!: TemplateRef<any>;
  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;

  ngOnInit() {
    this.loadPlans();
    this.loadCurrentRole();
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

  getEmptyPlanForm(): CreatePlanDto {
    return {
      name: '',
      displayName: '',
      durationDays: 1,
      price: 0,
      currency: 'USDT',
      features: [],
      isActive: true,
      isTrialPlan: false,
      maxSignalsPerDay: 0,
      commissionLevels: 0,
      sortOrder: 0
    };
  }

  loadPlans() {
    this.loading = true;
    this.plansService.findAll(this.showInactive).subscribe({
      next: (plans) => {
        this.plans = plans;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading plans', err);
        this.loading = false;
      }
    });
  }

  openCreateModal() {
    this.editingPlanId = null;
    this.planForm = this.getEmptyPlanForm();
    this.featureInput = '';
    this.modalRef = this.modalService.open(this.planModal, { size: 'lg', centered: true });
  }

  openEditModal(plan: Plan) {
    this.editingPlanId = plan._id || null;
    this.planForm = {
      name: plan.name,
      displayName: plan.displayName,
      durationDays: plan.durationDays,
      price: plan.price,
      currency: plan.currency,
      features: [...plan.features],
      isActive: plan.isActive,
      isTrialPlan: plan.isTrialPlan,
      maxSignalsPerDay: plan.maxSignalsPerDay,
      commissionLevels: plan.commissionLevels,
      sortOrder: plan.sortOrder
    };
    this.featureInput = '';
    this.modalRef = this.modalService.open(this.planModal, { size: 'lg', centered: true });
  }

  addFeature() {
    const feature = this.featureInput.trim();
    if (feature && this.planForm.features && !this.planForm.features.includes(feature)) {
      this.planForm.features.push(feature);
      this.featureInput = '';
    }
  }

  removeFeature(index: number) {
    if (this.planForm.features) {
      this.planForm.features.splice(index, 1);
    }
  }

  savePlan() {
    if (!this.planForm.name || !this.planForm.displayName || !this.planForm.durationDays) {
      alert('Por favor complete los campos requeridos');
      return;
    }

    // Role restriction: non-super-admins can only create 1-day plans
    if (!this.isSuperAdmin && this.planForm.durationDays > 1) {
      alert('Solo el Super Super Admin puede crear planes con duración mayor a 1 día.');
      return;
    }

    if (this.editingPlanId) {
      this.plansService.update(this.editingPlanId, this.planForm).subscribe({
        next: () => {
          this.loadPlans();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error updating plan', err);
          alert(err.error?.message || 'Error al actualizar el plan');
        }
      });
    } else {
      this.plansService.create(this.planForm).subscribe({
        next: () => {
          this.loadPlans();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error creating plan', err);
          alert(err.error?.message || 'Error al crear el plan');
        }
      });
    }
  }

  openDeleteModal(plan: Plan) {
    this.selectedPlan = plan;
    this.modalRef = this.modalService.open(this.deleteModal, { centered: true });
  }

  confirmDelete() {
    if (!this.selectedPlan || !this.selectedPlan._id) return;
    this.plansService.delete(this.selectedPlan._id).subscribe({
      next: () => {
        this.loadPlans();
        this.closeModal();
      },
      error: (err) => {
        console.error('Error deleting plan', err);
        alert(err.error?.message || 'Error al eliminar el plan');
      }
    });
  }

  togglePlanStatus(plan: Plan) {
    if (!plan._id) return;
    this.plansService.update(plan._id, { isActive: !plan.isActive } as any).subscribe({
      next: () => {
        plan.isActive = !plan.isActive;
      },
      error: (err) => {
        console.error('Error toggling plan status', err);
      }
    });
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
  }

  getPlanBadgeClass(isActive: boolean): string {
    return isActive ? 'bg-success' : 'bg-secondary';
  }
}
