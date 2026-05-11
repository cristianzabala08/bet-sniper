import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NotificacionsModalComponent } from '../../components/notificacions-modal/notificacions-modal.component';
import { LogoComponent } from 'src/app/shared/components/logo/logo.component';
import { TranslateModule } from '@ngx-translate/core';
import { NotificationsService } from 'src/app/core/services/notifications.service';
import { TokenService } from 'src/app/shared/services/jwt-token.service';

interface NotificationItem {
  id: string | number;
  date: string;
  // subject: string;
  type: 'new' | 'standard'; // Para controlar mostrar notificacion como nueva o estandar
  description: string;
}

@Component({
  standalone: true,
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  imports: [
    CommonModule,
    NotificacionsModalComponent,
    LogoComponent,
    TranslateModule,
  ],
})
export class NotificationsComponent implements OnInit {
  // Estado del modal
  showModal = false;
  selectedNotification: NotificationItem | null = null;

  notifications: NotificationItem[] = [];
  item: any;

  constructor(
    private notificationsService: NotificationsService,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    this.getNotifications();
  }

  getNotifications() {
    const payload = this.tokenService.getPayload();
    const currentUserId = payload?.sub;

    this.notificationsService.getNotifications().subscribe(
      (data: any[]) => {
        this.notifications = data
          .filter(
            (item) => item.status === false && item.userId === currentUserId
          )
          .map((item) => {
            // Si el backend devuelve _id como objeto o string, intentamos manejarlo.
            // Asumimos que la API devuelve un JSON estándar, pero si devuelve el formato con $oid, lo manejamos.
            // El usuario mostró el formato de la BD, así que la API podría devolver lo mismo o simplificado.
            const id = item._id?.$oid || item._id;
            const date = item.date?.$date || item.date || item.createdAt;

            return {
              id: id,
              date: date, // Se formateará en el HTML con pipe date
              // subject: item.description, // No hay campo subject en la BD, usamos default
              type: item.status ? 'standard' : 'new', // false = no leído (new), true = leído (standard)
              description: item.description,
            };
          });
      },
      (error: any) => {
        console.error('Error fetching notifications', error);
      }
    );
  }

  openNotification(item: NotificationItem) {
    this.selectedNotification = item;
    // Opcional: Marcar como leída llamar al servicio aqui
    this.showModal = true;
  }

  closeModal() {
    if (this.selectedNotification) {
      console.log(this.selectedNotification.id);
      this.notificationsService
        .markAsRead(this.selectedNotification.id)
        .subscribe({
          next: () => {
            console.log('Notification marked as read');
            this.getNotifications(); // Refrescar la lista para que desaparezca la leída
          },
          error: (err) => console.error('Error marking as read', err),
        });
    }
    this.showModal = false;
    this.selectedNotification = null;
  }
}
