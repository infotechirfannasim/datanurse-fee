import {Injectable, signal} from '@angular/core';

export interface PageMeta {
    title: string;
    breadcrumb: string;
}

const PAGE_META: Record<string, PageMeta> = {
    dashboard: {title: 'Dashboard', breadcrumb: 'Dashboard'},
    doctors: {title: 'Surgeon Registry', breadcrumb: 'Surgeon Registry'},
    users: {title: 'Users', breadcrumb: 'User Management > Users'},
    roles: {title: 'Roles', breadcrumb: 'User Management > Roles'},
    cases: {title: 'Cases', breadcrumb: 'Cases'},
    patients: {title: 'Patients', breadcrumb: 'Patients'},
    search: {title: 'Search', breadcrumb: 'Find Records'},
    reports: {title: 'Reports', breadcrumb: 'Analytics'},
    data: {title: 'Data Management', breadcrumb: 'CRUD Operations'},
    profile: {title: 'My Profile', breadcrumb: 'My Profile'},
    settings: {title: 'Settings', breadcrumb: 'Configuration'},
    lovs: {title: 'Reference Data Listing', breadcrumb: 'Reference Data Listing'},

};

@Injectable({providedIn: 'root'})
export class NavService {
    currentMeta = signal<PageMeta>({title: 'Dashboard', breadcrumb: 'Overview'});

    setPage(route: string): void {
        const key = route.replace('/', '').split('/')[0];
        const meta = PAGE_META[key] ?? {title: key, breadcrumb: ''};
        this.currentMeta.set(meta);
    }
}
