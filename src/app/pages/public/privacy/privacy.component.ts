import { AfterViewInit, Component, OnDestroy, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './privacy.component.html',
  styleUrls: ['../../../shared/scss/doc-pages.scss'],
})
export class PrivacyComponent implements AfterViewInit, OnDestroy {
  readonly activeSection = signal('pp-intro');
  private observer?: IntersectionObserver;

  scrollTo(id: string): void {
    this.activeSection.set(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  ngAfterViewInit(): void {
    const sections = document.querySelectorAll<HTMLElement>('.doc-content section[id]');

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.activeSection.set(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-120px 0px -60% 0px',
        threshold: 0,
      },
    );

    sections.forEach((section) => this.observer?.observe(section));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
