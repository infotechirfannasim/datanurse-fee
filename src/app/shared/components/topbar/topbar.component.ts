import { Component, inject, signal, HostListener } from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import { NavService } from '../../../core/services/nav.service';
import { ToastService } from '../../../core/services/toast.service';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';
import {getUserInitials} from "../../../utils/global.utils";
import {User} from "../../../core/models/user.model";
import {AuthService} from "../../../core/services/auth.service";
import {DatePipe} from "@angular/common";  // ← naya

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports:[RouterLink],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {

  private router   = inject(Router);
  navService       = inject(NavService);
  toastService     = inject(ToastService);
  sidebarState     = inject(SidebarStateService);
  userInfo = signal<User | null>(null);
  private authService = inject(AuthService);
  menuOpen = false;


  notifOpen    = signal(false);
  searchValue  = signal('');

  constructor() {
    this.authService.currentUser$.subscribe((user: any) => {
      this.userInfo.set(user);
    });
  }

  toggleNotif(): void {
    this.notifOpen.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
    this.menuOpen = false;
    this.toggleNotif();
  }

  navigate(){
    this.router.navigate(['/profile'])
    this.toggleNotif();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('#notif-wrap')) {
      this.notifOpen.set(false);
    }
  }

  onSearch(val: string): void {
    this.searchValue.set(val);
    if (val.length > 1) {
      this.router.navigate(['/search'], { queryParams: { q: val } });
    }
  }

  openAddDoctor(): void {
    this.router.navigate(['/doctors']);
  }
  getProfileImageUrl(): string | null {
    if (!this.userInfo()?.profileImage?.data || !this.userInfo()?.profileImage?.contentType) return null;
    return `data:${this.userInfo()?.profileImage.contentType};base64,${this.userInfo()?.profileImage.data}`;
  }

  protected readonly getUserInitials = getUserInitials;
}
