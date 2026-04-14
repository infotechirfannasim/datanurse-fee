import {Component, ElementRef, HostListener, inject, signal, ViewChild} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {AuthService} from "../../../core/services/auth.service";
import {User} from "../../../core/models/user.model";
import {getUserInitials} from "../../../utils/global.utils";
import {SidebarStateService} from "../../../core/services/sidebar-state.service";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";

export interface NavChild {
  label: string;
  route: string;
  permission: string;
  icon: SafeHtml;
}

export interface NavItem {
  label: string;
  icon: SafeHtml;
  route?: string;
  permission?: string;
  children?: NavChild[];
}

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
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);
  sidebarState = inject(SidebarStateService);  // ← naya

  protected readonly getUserInitials = getUserInitials;

  @ViewChild('menuContainer') menuContainer!: ElementRef;

  userInfo = signal<User | null>(null);

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      permission: 'DASHBOARD_VIEW',
      icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.8)"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.8)"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.8)"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="rgba(255,255,255,0.8)"/>
      </svg>`
    },
    {
      label: 'User Management',
      icon: `<svg fill="none" height="17" viewBox="0 0 24 24" width="17">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="rgba(255,255,255,0.8)" stroke-linecap="round" stroke-width="2"/>
        <circle cx="9" cy="7" r="4" stroke="rgba(255,255,255,0.8)" stroke-width="2"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="rgba(255,255,255,0.8)" stroke-linecap="round" stroke-width="2"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="rgba(255,255,255,0.8)" stroke-linecap="round" stroke-width="2"/>
      </svg>`,
      children: [
        {
          label: 'Users',
          route: '/users',
          permission: 'USER_VIEW',
          icon: `<svg fill="none" height="14" viewBox="0 0 24 24" width="14">
            <circle cx="12" cy="8" r="4" stroke="rgba(255,255,255,0.8)" stroke-width="2"/>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="rgba(255,255,255,0.8)" stroke-linecap="round" stroke-width="2"/>
          </svg>`
        },
        {
          label: 'Roles',
          route: '/roles',
          permission: 'ROLE_VIEW',
          icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_roles)">
              <path d="M9.65159 1.60309C9.57417 1.269 9.38123 0.973003 9.10682 0.767318C8.83242 0.561633 8.49417 0.459484 8.15179 0.478897C7.8094 0.498309 7.48487 0.638035 7.23547 0.873419C6.98607 1.1088 6.82783 1.42471 6.78867 1.76541C6.74951 2.1061 6.83194 2.44968 7.02143 2.73551C7.21092 3.02134 7.49528 3.23106 7.82433 3.32765C8.15338 3.42425 8.50598 3.40151 8.8199 3.26345C9.13382 3.12539 9.38888 2.88089 9.54009 2.57309C10.4606 2.78269 11.3162 3.21307 12.0333 3.82709C12.7504 4.44111 13.3073 5.22034 13.6561 6.09759L14.5436 5.74859C14.1328 4.70809 13.4712 3.78521 12.6178 3.06199C11.7643 2.33877 10.7454 1.83762 9.65159 1.60309Z" fill="currentColor"/>
              <path d="M9.59731 8.17874C9.87318 7.90937 10.0625 7.56389 10.1411 7.18642C10.2197 6.80895 10.184 6.41662 10.0386 6.05953C9.89314 5.70245 9.64458 5.39681 9.32464 5.18164C9.00469 4.96648 8.62788 4.85156 8.24231 4.85156C7.85675 4.85156 7.47993 4.96648 7.15999 5.18164C6.84004 5.39681 6.59148 5.70245 6.44606 6.05953C6.30063 6.41662 6.26494 6.80895 6.34354 7.18642C6.42213 7.56389 6.61145 7.90937 6.88731 8.17874C6.55902 8.40063 6.29011 8.6996 6.1041 9.04948C5.91809 9.39936 5.82065 9.78949 5.82031 10.1857V11.1552H10.6688V10.1852C10.668 9.78858 10.5698 9.39819 10.383 9.04828C10.1962 8.69837 9.92644 8.40013 9.59731 8.17874Z" fill="currentColor"/>
            </g>
            <defs><clipPath id="clip0_roles"><rect width="16" height="16" fill="white"/></clipPath></defs>
          </svg>`
        }
      ]
    },
    {
      label: 'Surgoen Registry',
      route: '/doctors',
      permission: 'DOCTOR_VIEW',
      icon: `<svg width="17" height="17" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M16.649 9.32576C16.6638 9.26051 16.6816 9.18217 16.7042 9.08596C16.809 8.63989 16.9815 7.98431 17.3364 7.33819C17.698 6.68004 18.2591 6.01298 19.1388 5.5742C20.0155 5.13692 21.115 4.97307 22.4739 5.15425C23.9737 5.35421 26.9871 5.85032 29.6486 7.20423C32.3262 8.56634 34.8337 10.9086 34.8336 14.8107C34.8336 16.8266 34.0531 18.9896 33.2985 20.3998C32.9353 21.0784 32.5036 21.726 32.0722 22.0754C31.9733 22.1555 31.8329 22.2548 31.6567 22.3257C30.6604 25.6096 27.6093 27.9999 24 27.9999C20.6668 27.9999 17.8097 25.9614 16.6074 23.0631L16.5829 23.0665L16.2281 22.6357C16.2284 22.6361 16.2281 22.6357 17 21.9999L16.2281 22.6357L16.2268 22.6341L16.2249 22.6318L16.2196 22.6253L16.2029 22.6046C16.1893 22.5875 16.1705 22.5638 16.1471 22.5336C16.1003 22.4733 16.0352 22.3874 15.956 22.2779C15.7979 22.0593 15.5828 21.7455 15.3465 21.3541C14.8766 20.5758 14.3087 19.4678 13.9466 18.1751C13.5843 16.8818 13.4178 15.366 13.7981 13.8024C14.1684 12.2799 15.0408 10.7813 16.622 9.4441C16.6301 9.40931 16.6389 9.3704 16.649 9.32576Z" fill="rgba(255,255,255,0.8)"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M17.9141 28.855C17.7025 28.433 17.4413 27.9121 17 28.0126C11.5958 29.2433 6 32.7945 6 36.5698V41.9999H42V36.5698C42 33.5961 38.5281 30.7614 34.4127 29.0902C33.2676 28.6285 32.1296 28.2698 31 28.0126C30.4972 27.8981 29.9775 28.5901 29.7493 29.0237H18C17.9721 28.9707 17.9436 28.9138 17.9141 28.855Z" fill="rgba(255,255,255,0.8)"/>
      </svg>`
    },
    {
      label: 'Patients',
      route: '/patients',
      permission: 'PATIENT_VIEW',
      icon: `<svg width="17" height="17" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M21.5706 13C24.0558 13 26.0706 10.9853 26.0706 8.5C26.0706 6.01472 24.0558 4 21.5706 4C19.0853 4 17.0706 6.01472 17.0706 8.5C17.0706 10.9853 19.0853 13 21.5706 13Z" fill="rgba(255,255,255,0.8)"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M11.8076 16.9446C13.0827 15.206 15.2273 15 16.5706 15H26.5706C30.3053 15 32.7945 16.6015 34.3319 18.6194C35.5387 20.2033 36.0883 21.9895 36.3313 22.7792L36.3374 22.7988C36.8282 24.2859 36.3924 25.5988 35.4249 26.3593C36.3629 26.8665 37 27.8588 37 29V43H35V29C35 28.4477 34.5523 28 34 28C33.4477 28 33 28.4477 33 29V29.6667H31V29C31 28.0426 31.4485 27.1899 32.1468 26.6406C31.4981 26.291 30.976 25.703 30.7245 24.9487L28.5706 21.409L28.5706 41.1507C28.5706 42.7505 27.3152 44.0688 25.7173 44.1471C24.1194 44.2253 22.7413 43.0359 22.585 41.4438L21.8542 34H21.287L20.5562 41.4438C20.3999 43.0359 19.0218 44.2253 17.4239 44.1471C15.826 44.0688 14.5706 42.7505 14.5706 41.1507L14.5706 26.6011C14.3315 26.2933 14.1014 25.9915 13.882 25.6964C12.9471 24.4392 12.083 23.1447 11.5631 21.9318C11.1288 20.9184 10.4391 18.8107 11.8076 16.9446Z" fill="rgba(255,255,255,0.8)"/>
      </svg>`
    },
    {
      label: 'Cases',
      route: '/cases',
      permission: 'CASE_VIEW',
      icon: `<svg width="17" height="17" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 30C11 29.4477 11.4477 29 12 29H26C26.5523 29 27 29.4477 27 30C27 30.5523 26.5523 31 26 31H12C11.4477 31 11 30.5523 11 30Z" fill="rgba(255,255,255,0.8)"/>
        <path d="M12 34C11.4477 34 11 34.4477 11 35C11 35.5523 11.4477 36 12 36H26C26.5523 36 27 35.5523 27 35C27 34.4477 26.5523 34 26 34H12Z" fill="rgba(255,255,255,0.8)"/>
        <path d="M14 21V18H16V21H19V23H16V26H14V23H11V21H14Z" fill="rgba(255,255,255,0.8)"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M15 6C13.3431 6 12 7.34315 12 9H9C7.34315 9 6 10.3431 6 12V39C6 40.6569 7.34315 42 9 42H29C30.6569 42 32 40.6569 32 39V12C32 10.3431 30.6569 9 29 9H26C26 7.34315 24.6569 6 23 6H15ZM23 12C23.5523 12 24 11.5523 24 11V9C24 8.44772 23.5523 8 23 8H15C14.4477 8 14 8.44772 14 9V11C14 11.5523 14.4477 12 15 12H23ZM12 11C12 12.6569 13.3431 14 15 14H23C24.6569 14 26 12.6569 26 11H29C29.5523 11 30 11.4477 30 12V39C30 39.5523 29.5523 40 29 40H9C8.44772 40 8 39.5523 8 39V12C8 11.4477 8.44772 11 9 11H12Z" fill="rgba(255,255,255,0.8)"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M36 17C36 15.3431 37.3431 14 39 14C40.6569 14 42 15.3431 42 17V37.3028L39 41.8028L36 37.3028V17ZM39 16C38.4477 16 38 16.4477 38 17V19H40V17C40 16.4477 39.5523 16 39 16ZM39 38.1972L40 36.6972V21H38V36.6972L39 38.1972Z" fill="rgba(255,255,255,0.8)"/>
      </svg>`
    },
    {
      label: 'Reference Data Listing',
      route: '/lovs',
      permission: 'LOV_VIEW',
      icon: `<svg fill="none" height="17" viewBox="0 0 24 24" width="17">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="14 2 14 8 20 8" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="16" y1="13" x2="8" y2="13" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round"/>
        <line x1="16" y1="17" x2="8" y2="17" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round"/>
        <polyline points="10 9 9 9 8 9" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round"/>
      </svg>`
    },
    {
      label: 'Reports',
      route: '/reports',
      permission: 'REPORT_VIEW',
      icon: `<svg fill="none" height="17" viewBox="0 0 24 24" width="17">
        <path d="M18 20V10" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 20V4" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round"/>
        <path d="M6 20v-6" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round"/>
      </svg>`
    }
  ];

  readonly accountItems: NavItem[] = [
    {
      label: 'My Profile',
      route: '/profile',
      permission: 'PROFILE_VIEW',
      icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="rgba(255,255,255,0.8)" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="7" r="4" stroke="rgba(255,255,255,0.8)" stroke-width="2"/>
      </svg>`
    }
  ];

  constructor() {
    this.authService.currentUser$.subscribe((user: any) => {
      this.userInfo.set(user);
    });
    this.navItems = this.navItems.map(item => ({
      ...item,
      icon: this.sanitizer.bypassSecurityTrustHtml(item.icon as string),
      children: item.children?.map(child => ({
        ...child,
        icon: this.sanitizer.bypassSecurityTrustHtml(child.icon as string)
      }))
    }));

    this.accountItems = this.accountItems.map(item => ({
      ...item,
      icon: this.sanitizer.bypassSecurityTrustHtml(item.icon as string)
    }));
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


  isVisible(item: NavItem): boolean {
    if (item.children?.length) {
      return item.children.some(child => this.authService.hasPermission(child.permission));
    }
    if (!item.permission) return true;
    return this.authService.hasPermission(item.permission);
  }


  isChildVisible(child: NavChild): boolean {
    return this.authService.hasPermission(child.permission);
  }

  toggleUserManagement(): void {
    this.isUserManagementExpanded = !this.isUserManagementExpanded;
  }

  getProfileImageUrl(): string | null {
    if (!this.userInfo()?.profileImage?.data || !this.userInfo()?.profileImage?.contentType) return null;
    return `data:${this.userInfo()?.profileImage.contentType};base64,${this.userInfo()?.profileImage.data}`;
  }
}
