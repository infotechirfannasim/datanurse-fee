import {Component, inject, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {filter} from 'rxjs/operators';
import {SidebarComponent} from './shared/components/sidebar/sidebar.component';
import {TopbarComponent} from './shared/components/topbar/topbar.component';
import {ToastComponent} from './shared/components/toast/toast.component';
import {NavService} from './core/services/nav.service';
import {AuthService} from './core/services/auth.service';
import {SidebarStateService} from './core/services/sidebar-state.service';
import {NgxLoadingBar} from "@ngx-loading-bar/core";

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, SidebarComponent, TopbarComponent, ToastComponent, NgxLoadingBar],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

    private router = inject(Router);
    private authService = inject(AuthService);
    private navService = inject(NavService);
    sidebarState = inject(SidebarStateService);  // ← naya

    isLoggedIn = false;
    /** Standalone public pages render without the admin shell, even for logged-in users. */
    isStandalonePage = false;
    private readonly STANDALONE_PREFIXES = ['/insights'];

    private checkStandalone(url: string) {
        this.isStandalonePage = this.STANDALONE_PREFIXES.some(p => url === p || url.startsWith(p + '?') || url.startsWith(p + '/'));
    }

    ngOnInit(): void {
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe((e: any) => {
            this.navService.setPage(e.urlAfterRedirects);
            this.checkStandalone(e.urlAfterRedirects);
            if (this.sidebarState.isMobile) {
                this.sidebarState.close();
            }
        });

        this.navService.setPage(this.router.url);
        this.checkStandalone(location.pathname);

        this.authService.currentUser$.subscribe(user => {
            this.isLoggedIn = !!user;
        });
    }
}