import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-avatar-selector-modal',
  templateUrl: './avatar-selector-modal.component.html',
  styleUrls: ['./avatar-selector-modal.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class AvatarSelectorModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() iconSelected = new EventEmitter<string>();

  icons: string[] = [
    'fa-user',
    'fa-user-circle',
    'fa-user-alt',
    'fa-user-tie',
    'fa-user-astronaut',
    'fa-user-ninja',
    'fa-user-graduate',
    'fa-user-md',
    'fa-user-secret',
    'fa-user-shield',
  ];

  selectIcon(icon: string): void {
    const iconClass = `fa-solid ${icon}`;
    // Or maybe keep the user's input exact class structure if they are mixed solid/regular?
    // The user list was just names like 'fa-user'. FontAwesome usually needs a style prefix.
    // The default was 'fa-regular fa-user'.
    // Most of the specific ones (astronaut, ninja) are solid.
    // Let's assume solid for these or check if they exist in regular.
    // 'fa-user' is in both. 'fa-user-astronaut' is likely solid.
    // To be safe, I will prepend 'fa-solid' to all as it likely has the most coverage,
    // or better yet, I will attach 'fa-solid' in the template loop and emit the full class string.

    // Actually, looking at the user request:
    // fa-user, fa-user-circle, etc.
    // I will iterate them and prepend 'fa-solid' (or 'fa-regular' if desired, but solid is safer for "icons").
    // Wait, the default was 'fa-regular fa-user'.
    // Let's use 'fa-solid' for the new ones to ensure they show up well.

    const fullClass = `fa-solid ${icon}`;
    this.iconSelected.emit(fullClass);
  }

  closeModal(): void {
    this.close.emit();
  }
}
