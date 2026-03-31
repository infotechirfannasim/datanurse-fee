import {Component, inject, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {filter} from 'rxjs/operators';
import {SidebarComponent} from './shared/components/sidebar/sidebar.component';
import {TopbarComponent} from './shared/components/topbar/topbar.component';
import {ToastComponent} from './shared/components/toast/toast.component';
import {NavService} from './core/services/nav.service';
import {AuthService} from "./core/services/auth.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private navService = inject(NavService);
  isLoggedIn: boolean = false;
  ngOnInit(): void {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.navService.setPage(e.urlAfterRedirects);
    });
    // Set initial page
    this.navService.setPage(this.router.url);

    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
    })
  }
}
