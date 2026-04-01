import { Component, inject, signal, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { NavService } from '../../../core/services/nav.service';
import { ToastService } from '../../../core/services/toast.service';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';  // ← naya

@Component({
  selector: 'app-topbar',
  standalone: true,
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {

  private router   = inject(Router);
  navService       = inject(NavService);
  toastService     = inject(ToastService);
  sidebarState     = inject(SidebarStateService);  // ← naya

  notifOpen    = signal(false);
  searchValue  = signal('');

  toggleNotif(): void {
    this.notifOpen.update(v => !v);
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
}