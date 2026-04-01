import {Component, ElementRef, HostListener, inject, signal, ViewChild} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {AuthService} from "../../../core/services/auth.service";
import {User} from "../../../core/models/user.model";
import {getUserInitials} from "../../../utils/global.utils";

type MenuItem = {
  label: string;
  action: () => void;
};
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  isUserManagementExpanded = false;
  private authService = inject(AuthService);
  menuOpen: boolean = false;
  protected readonly getUserInitials = getUserInitials;
  @ViewChild('menuContainer') menuContainer!: ElementRef;

  userInfo = signal<User | null>(null);

  menuItems: MenuItem[] = [
    {
      label: 'Logout',
      action: () => this.authService.logout()
    }
  ];

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.menuContainer.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  constructor() {
    this.authService.currentUser$.subscribe((user: any) => {
      this.userInfo.set(user);
    })
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  onMenuClick() {
    this.authService.logout();
    this.menuOpen = false;
  }

  toggleUserManagement() {
    this.isUserManagementExpanded = !this.isUserManagementExpanded;
  }
}
