import { Component, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page-header-row">
      <div class="page-title-block"><h2>Search</h2><p>Find doctors, patients, and records</p></div>
    </div>
    <div class="search-hero">
      <div class="search-hero-input">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#7A8BB0" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="#7A8BB0" stroke-width="2" stroke-linecap="round"/></svg>
        <input [(ngModel)]="query" placeholder="Search anything — doctor name, case ID, diagnosis…" (input)="onSearch()"/>
      </div>
      <div class="search-filters">
        @for (f of filters; track f) {
          <button class="search-filter-chip" [class.active]="activeFilter()===f" (click)="activeFilter.set(f)">{{ f }}</button>
        }
      </div>
    </div>
    @if (query.length > 1) {
      <div class="search-results-label">Results for "<strong>{{ query }}</strong>"</div>
      <div class="section-card" style="margin-top:16px;">
        <div class="section-header"><div class="section-title">Doctors</div></div>
        @for (r of doctorResults; track r.name) {
          <div class="search-result-item">
            <div class="p-avatar" [style.background]="r.color">{{ r.initials }}</div>
            <div style="flex:1"><div style="font-weight:600;color:var(--navy);">{{ r.name }}</div><div style="font-size:12px;color:var(--muted);">{{ r.spec }}</div></div>
            <span class="badge badge-green">Active</span>
          </div>
        }
      </div>
    } @else {
      <div class="empty-state" style="margin-top:60px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="var(--muted)" stroke-width="1.5"/><path d="M21 21l-4.35-4.35" stroke="var(--muted)" stroke-width="1.5" stroke-linecap="round"/></svg>
        <h3>Start typing to search</h3>
        <p>Search across doctors, cases, patients and reports</p>
      </div>
    }
  `,
  styles: [`
    .search-hero { background: var(--card); border-radius: 16px; border: 1px solid var(--border); padding: 24px; margin-bottom: 20px; }
    .search-hero-input { display: flex; align-items: center; gap: 12px; border: 1.5px solid var(--border); border-radius: 12px; padding: 14px 18px; background: var(--bg); transition: border-color 0.15s; &:focus-within { border-color: var(--blue); } }
    .search-hero-input input { border: none; background: none; outline: none; font-size: 16px; color: var(--text); font-family: 'DM Sans'; flex: 1; &::placeholder { color: var(--muted); } }
    .search-filters { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
    .search-filter-chip { padding: 7px 16px; border-radius: 20px; font-size: 12.5px; font-weight: 500; border: 1.5px solid var(--border); background: #fff; color: var(--muted); cursor: pointer; font-family: 'DM Sans'; transition: all 0.15s; &.active { background: var(--navy); color: #fff; border-color: var(--navy); } &:hover:not(.active) { border-color: var(--blue); color: var(--blue); } }
    .search-results-label { font-size: 13px; color: var(--muted); }
    .search-result-item { display: flex; align-items: center; gap: 14px; padding: 14px 22px; border-bottom: 1px solid var(--border); &:last-child { border-bottom: none; } &:hover { background: #F7F9FE; } cursor: pointer; }
    .p-avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0; }
  `]
})
export class SearchComponent {
  private route = inject(ActivatedRoute);
  query = '';
  filters = ['All', 'Doctors', 'Cases', 'Patients', 'Reports'];
  activeFilter = signal('All');

  doctorResults = [
    { name: 'Dr. Salman A. Shah', spec: 'Endocrinology', initials: 'SS', color: '#2251CC' },
    { name: 'Dr. Omar Farooq',    spec: 'Cardiology',     initials: 'OF', color: '#5B4FCF' },
  ];

  constructor() {
    this.route.queryParams.subscribe(p => { if (p['q']) this.query = p['q']; });
  }

  onSearch(): void {}
}
