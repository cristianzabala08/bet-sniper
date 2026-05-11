import { Component, OnInit, inject, TemplateRef, ViewChild } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { Staff, StaffService, CreateStaffDto, StaffRole } from 'src/app/services/staff.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './staff.component.html',
  styleUrls: []
})
export class StaffComponent implements OnInit {
  private staffService = inject(StaffService);
  private modalService = inject(NgbModal);

  staffList: Staff[] = [];
  loading = false;

  // Create Staff Form
  createForm: CreateStaffDto = {
    username: '',
    email: '',
    password: '',
    role: StaffRole.SUPPORT
  };

  roles = Object.values(StaffRole);
  modalRef: NgbModalRef | null = null;

  @ViewChild('createStaffModal') createStaffModal!: TemplateRef<any>;

  ngOnInit() {
    this.loadStaff();
  }

  loadStaff() {
    this.loading = true;
    this.staffService.findAll().subscribe({
      next: (res) => {
        this.staffList = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading staff', err);
        this.loading = false;
      }
    });
  }

  openCreateModal() {
    this.createForm = {
      username: '',
      email: '',
      password: '',
      role: StaffRole.SUPPORT
    };
    this.modalRef = this.modalService.open(this.createStaffModal, { centered: true });
  }

  createStaff() {
    if (!this.createForm.username || !this.createForm.email || !this.createForm.password) {
      // Simple validation
      alert('Please fill all fields');
      return;
    }

    this.staffService.create(this.createForm).subscribe({
      next: (newStaff) => {
        this.staffList.push(newStaff);
        this.closeModal();
      },
      error: (err) => {
        console.error('Error creating staff', err);
      }
    });
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.close();
      this.modalRef = null;
    }
  }
}
