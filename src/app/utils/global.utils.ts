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
