import { Component, OnInit, inject } from '@angular/core';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { AuditLog, AuditLogService } from 'src/app/services/audit-log.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: []
})
export class AuditLogsComponent implements OnInit {
  private auditLogService = inject(AuditLogService);

  logs: AuditLog[] = [];
  total = 0;
  page = 1;
  limit = 50;
  loading = false;

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    this.auditLogService.findByPagination(this.page, this.limit).subscribe({
      next: (res) => {
        this.logs = res.rows;
        this.total = res.totalRow;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading audit logs', err);
        this.loading = false;
      }
    });
  }

  onPageChange(page: number) {
    this.page = page;
    this.loadLogs();
  }
}
