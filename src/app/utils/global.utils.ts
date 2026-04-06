import {User} from "../core/models/user.model";
import {AbstractControl, FormArray, FormGroup} from "@angular/forms";

export function getUserInitials(user: User | null): string {

    if (!user) return 'NA';
    if (user.firstName || user.lastName) {
        const first = user.firstName?.trim()?.charAt(0) || '';
        const last = user.lastName?.trim()?.charAt(0) || '';
        const initials = (first + last).toUpperCase();
        if (initials) return initials;
    }

    if (user.fullName) {
        const parts = user.fullName.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].charAt(0).toUpperCase();
        }
        const first = parts[0].charAt(0);
        const last = parts[parts.length - 1].charAt(0);
        return (first + last).toUpperCase();
    }
    if (user.email) {
        return user.email.charAt(0).toUpperCase();
    }
    if (user.username) {
        return user.username.charAt(0).toUpperCase();
    }
    return 'NA';
}

export function getControl(
    form: FormGroup,
    controlName: string,
    index?: number,
    field?: string
): AbstractControl | null {

    if (index !== undefined && field) {
        const formArray = form.get(controlName) as FormArray;
        return formArray?.at(index)?.get(field) || null;
    }

    return form.get(controlName);
};

export function getError(
    form: FormGroup,
    controlName: string,
    options?: {
        index?: number;
        field?: string;
        customMessages?: any;
    }
): string {

    const control = getControl(
        form,
        controlName,
        options?.index,
        options?.field
    );

    if (!control || !control.touched || !control.errors) return '';

    const errors = control.errors;
    const key = options?.field || controlName;
    const customMessages = options?.customMessages || {};

    for (const errorKey of Object.keys(errors)) {

        if (customMessages[key]?.[errorKey]) {
            const msg = customMessages[key][errorKey];
            return typeof msg === 'function' ? msg(errors[errorKey]) : msg;
        }
        switch (errorKey) {
            case 'required':
                return 'This field is required';

            case 'minlength':
                return `Minimum ${errors['minlength'].requiredLength} characters required`;

            case 'maxlength':
                return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;

            case 'email':
                return 'Invalid email format';

            case 'pattern':
                return 'Invalid format';

            default:
                return 'Invalid field';
        }
    }

    return '';
}

export function markAllTouched(control: AbstractControl): void {
    if (control instanceof FormGroup || control instanceof FormArray) {
        Object.values(control.controls).forEach(c => markAllTouched(c));
    }
    control.markAsTouched();
}

export interface MenuItem {
    id: number;
    title: string;
    route?: string;
    icon: string;
    permission: string | null;
    type: 'item' | 'parent';
    children?: MenuItem[];
    section?: string;
}

export const SIDEBAR_MENU: MenuItem[] = [
    {
        id: 1,
        title: 'Dashboard',
        route: '/dashboard',
        icon: 'dashboard',
        permission: 'DASHBOARD_VIEW',
        type: 'item'
    },
    {
        id: 2,
        title: 'User Management',
        icon: 'users',
        permission: null,
        type: 'parent',
        children: [
            {id: 3, title: 'Users', route: '/users', icon: 'users', permission: 'USER_VIEW', type: 'item'},
            {id: 4, title: 'Roles', route: '/roles', icon: 'roles', permission: 'ROLE_VIEW', type: 'item'}
        ]
    },
    {
        id: 5,
        title: 'Doctor Registry',
        route: '/doctors',
        icon: 'doctors',
        permission: 'DOCTOR_VIEW',
        type: 'item'
    },
    {
        id: 6,
        title: 'Patients',
        route: '/patients',
        icon: 'patients',
        permission: 'PATIENT_VIEW',
        type: 'item'
    },
    {
        id: 7,
        title: 'Cases',
        route: '/cases',
        icon: 'cases',
        permission: 'CASE_VIEW',
        type: 'item'
    },
    {
        id: 8,
        title: 'Reference Data Listing',
        route: '/lovs',
        icon: 'lovs',
        permission: 'LOV_VIEW',
        type: 'item'
    },
    {
        id: 9,
        title: 'Reports',
        route: '/reports',
        icon: 'reports',
        permission: 'REPORT_VIEW',
        type: 'item'
    },
    {
        id: 10,
        title: 'My Profile',
        route: '/profile',
        icon: 'profile',
        permission: 'PROFILE_VIEW',
        type: 'item',
        section: 'Account'
    }
];
