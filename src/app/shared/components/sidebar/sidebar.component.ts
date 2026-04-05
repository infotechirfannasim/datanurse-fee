import {Component, ElementRef, HostListener, inject, signal, ViewChild} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {AuthService} from "../../../core/services/auth.service";
import {User} from "../../../core/models/user.model";
import {getUserInitials} from "../../../utils/global.utils";
import {SidebarStateService} from "../../../core/services/sidebar-state.service";
import {DatePipe} from "@angular/common"; // ← naya

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
  menuOpen = false;
  showInfotechModal = false;

  private authService = inject(AuthService);
  sidebarState = inject(SidebarStateService);  // ← naya

  protected readonly getUserInitials = getUserInitials;

  @ViewChild('menuContainer') menuContainer!: ElementRef;

  userInfo = signal<User | null>(null);

  constructor() {
    this.authService.currentUser$.subscribe((user: any) => {
      this.userInfo.set(user);
    });
  }

  // Window resize — desktop pe auto open, mobile pe auto close
  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 769) {
      this.sidebarState.open();
    } else {
      this.sidebarState.close();
    }
  }

  // Click outside user menu
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (this.menuContainer && !this.menuContainer.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.menuOpen = false;
  }

  toggleUserManagement(): void {
    this.isUserManagementExpanded = !this.isUserManagementExpanded;
  }

  getProfileImageUrl(): string | null {
    if (!this.userInfo()?.profileImage?.data || !this.userInfo()?.profileImage?.contentType) return null;
    return `data:${this.userInfo()?.profileImage.contentType};base64,${this.userInfo()?.profileImage.data}`;
  }
}
