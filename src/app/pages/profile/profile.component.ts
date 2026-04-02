import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ToastService} from '../../core/services/toast.service';
import {RequestService} from '../../core/services/request.service';
import {PROFILE_API_URL, UPDATE_PROFILE_API_URL} from "../../utils/api.url.constants";
import {HttpErrorResponse} from "@angular/common/http";
import {User} from "../../core/models/user.model";


@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {

    private toastService = inject(ToastService);
    private requestService = inject(RequestService);
    private fb = inject(FormBuilder);

    activeTab = signal<'personal' | 'security' | 'activity'>('personal');

    profile = signal<User | null>(null);
    isLoading = signal(true);

    // Reactive Forms
    personalForm!: FormGroup;
    passwordForm!: FormGroup;

    imagePreview: string | null = null;
    selectedFile: File | null = null;

    recentActivity = [
        { action: 'Logged in from Lahore, PK', time: 'Today, 9:00 AM', type: 'login' },
        {action: 'Updated profile information', time: 'Yesterday, 2:30 PM', type: 'update'},
    ];

    ngOnInit(): void {
        this.initForms();
        this.loadProfile();
    }

    initForms(): void {
        this.personalForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: [{value: '', disabled: true}],
            phone: [''],
        });

        this.passwordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.required]
        });
    }

    loadProfile(): void {
        this.isLoading.set(true);

        this.requestService.getRequest(PROFILE_API_URL).subscribe({
            next: (res: any) => {
                if (res.status == 200 && res.body.data) {
                    const data = res.body.data;
                    this.profile.set(data);
                    this.personalForm.patchValue({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        location: data.location || '',
                        department: data.department || '',
                        bio: data.bio || ''
                    });
                }
                this.isLoading.set(false);
            },
            error: () => {
                this.toastService.show('Failed to load profile', 'error');
                this.isLoading.set(false);
            }
        });
    }

    onImageSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size must be less than 2MB');
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                alert('Only JPG, PNG or WEBP allowed');
                return;
            }

            this.selectedFile = file;

            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    updateProfile(): void {
        if (this.personalForm.invalid) {
            this.personalForm.markAllAsTouched();
            this.toastService.show('Please fill all required fields correctly', 'error');
            return;
        }

        const formData = new FormData();
        const formValue = this.personalForm.getRawValue();

        Object.keys(formValue).forEach(key => {
            if (key === 'email') return;

            const value = formValue[key];
            if (value !== null && value !== undefined && value !== '') {
                formData.append(key, value);
            }
        });
        if (this.selectedFile) {
            formData.append('profileImage', this.selectedFile);
        }

        this.requestService.patchReqWithFormData(UPDATE_PROFILE_API_URL, formData).subscribe({
            next: (response: any) => {
                this.toastService.show('Profile updated successfully!', 'success');
                this.loadProfile();
            },
            error: (error: HttpErrorResponse) => {
                const errMsg = error.error?.message || error.message || 'Failed to update profile';
                this.toastService.show(errMsg, 'error');
            }
        });
    }

    getProfileImageUrl(): string | null {
        if (!this.profile()?.profileImage?.data || !this.profile()?.profileImage?.contentType) return null;
        return `data:${this.profile()?.profileImage.contentType};base64,${this.profile()?.profileImage.data}`;
    }

    changePassword(): void {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        const {currentPassword, newPassword, confirmPassword} = this.passwordForm.value;

        if (newPassword !== confirmPassword) {
            this.toastService.show('New passwords do not match!', 'error');
            return;
        }

        // Call change password API here
        // this.requestService.postRequest('/auth/change-password', { currentPassword, newPassword })...

        this.toastService.show('Password changed successfully!', 'success');
        this.passwordForm.reset();
    }

    getActivityColor(type: string): string {
        const map: Record<string, string> = {
            create: '#22C55E',
            update: '#2251CC',
            report: '#F59E0B',
            delete: '#E8344A',
            login: '#5B4FCF'
        };
        return map[type] ?? '#7A8BB0';
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
    }
}
