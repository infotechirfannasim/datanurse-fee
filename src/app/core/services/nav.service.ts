import { Injectable, signal } from '@angular/core';

export interface PageMeta {
  title: string;
  breadcrumb: string;
}

const PAGE_META: Record<string, PageMeta> = {
  dashboard:  { title: 'Dashboard',       breadcrumb: 'Overview' },
  doctors:    { title: 'Doctor Registry', breadcrumb: 'Physicians' },
  cases:      { title: 'Cases',           breadcrumb: 'Patient Records' },
  search:     { title: 'Search',          breadcrumb: 'Find Records' },
  reports:    { title: 'Reports',         breadcrumb: 'Analytics' },
  data:       { title: 'Data Management', breadcrumb: 'CRUD Operations' },
  profile:    { title: 'My Profile',      breadcrumb: 'Account' },
  settings:   { title: 'Settings',        breadcrumb: 'Configuration' },
};

@Injectable({ providedIn: 'root' })
export class NavService {
  currentMeta = signal<PageMeta>({ title: 'Dashboard', breadcrumb: 'Overview' });

  setPage(route: string): void {
    const key = route.replace('/', '').split('/')[0];
    const meta = PAGE_META[key] ?? { title: key, breadcrumb: '' };
    this.currentMeta.set(meta);
  }
}
