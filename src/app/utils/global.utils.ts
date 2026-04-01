import {User} from "../core/models/user.model";

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
