import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ToastService} from '../../core/services/toast.service';
import {RequestService} from '../../core/services/request.service';
import {CHANGE_PASS_API_URL, PROFILE_API_URL, UPDATE_PROFILE_API_URL} from "../../utils/api.url.constants";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {User} from "../../core/models/user.model";
import {AuthService} from "../../core/services/auth.service";
import {NgxMaskDirective} from "ngx-mask";
import {getError, markAllTouched, passwordMatchValidator} from "../../utils/global.utils";
import {RouterLink} from "@angular/router";
import {finalize} from "rxjs";
import {RegexConstants} from "../../utils/regex-constants";


@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, NgxMaskDirective, RouterLink],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
    private authService = inject(AuthService);
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
    isSubmitting: boolean = false;
    currentPassword: boolean = false
    newPassword: boolean = false
    confirmPassword: boolean = false

    errorMessages = {
        firstName: {
            required: 'First name is required',
            pattern: "Only alphanumeric characters are allowed.",
            maxLength: 'Max 50 characters'
        },
        lastName: {
            required: 'Last name is required',
            pattern: "Only alphanumeric characters are allowed.",
            maxLength: 'Max 50 characters'
        },
        currentPassword: {required: 'Current password is required'},
        newPassword: {
            required: 'Password is required',
            minlength: 'Min 8 characters',
            maxlength: 'Max 20 characters',
            pattern: 'Include upper, lower, number & special char'
        },
        confirmPassword: {required: 'Confirm password is required', mismatch: 'New passwords must be same'}
    };


    ngOnInit(): void {
        this.initForms();
        this.loadProfile();
    }

    initForms(): void {
        this.personalForm = this.fb.group({
            firstName: ['', [
                Validators.required,
                Validators.minLength(1),
                Validators.maxLength(50),
                Validators.pattern(RegexConstants.ALPHANUMERIC_REGEX)
            ]],
            lastName: ['',
                [Validators.required,
                    Validators.minLength(1),
                    Validators.maxLength(50),
                    Validators.pattern(RegexConstants.ALPHABET_REGEX)]],
            email: [{value: '', disabled: true}],
            phone: [''],
        });

        this.passwordForm = this.fb.group(
            {
                currentPassword: ['', [Validators.required]],
                newPassword: ['', [Validators.required,
                    Validators.minLength(8),
                    Validators.maxLength(20),
                    Validators.pattern(RegexConstants.PASSWORD_REGEX)]],
                confirmPassword: ['', [Validators.required]]
            },
            {validators: passwordMatchValidator('newPassword', 'confirmPassword', {requireBoth: true})}
        );
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

    onImageSelected(event: any) {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png'];
        const allowedExtensions = ['jpg', 'jpeg', 'png'];

        const fileName = file.name.toLowerCase();
        const ext = fileName.split('.').pop();

        event.target.value = '';

        if (file.size > 1024 * 1024) {
            this.toastService.show('Max size is 1MB', 'error');
            return;
        }

        if (!ext || !allowedExtensions.includes(ext)) {
            this.toastService.show('Only JPG and PNG allowed', 'error');
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            this.toastService.show('Invalid file type', 'error');
            return;
        }

        this.selectedFile = file;

        const reader = new FileReader();
        reader.onload = () => {
            this.imagePreview = reader.result as string;
        };
        reader.readAsDataURL(file);
    }

    updateProfile(): void {
        if (this.personalForm.invalid) {
            markAllTouched(this.personalForm);
            this.toastService.show('Please fill all required fields correctly', 'error');
            return;
        }

        const formData = new FormData();
        const formValue = this.personalForm.getRawValue();

        Object.keys(formValue).forEach(key => {
            if (key === 'email') return;

            const value = formValue[key];
            if (value !== undefined) {
                formData.append(key, value);
            }
        });
        if (this.selectedFile) {
            formData.append('profileImage', this.selectedFile);
        }

        this.requestService.putReqWithFormData(UPDATE_PROFILE_API_URL, formData).subscribe({
            next: (response: HttpResponse<any>) => {
                this.personalForm.markAsPristine();
                this.personalForm.markAsUntouched();
                this.toastService.show('Profile updated successfully!', 'success');
                this.authService.setUser = response.body.data;
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

        const {currentPassword, newPassword} = this.passwordForm.getRawValue();

        const payload = {currentPassword, newPassword};

        this.isSubmitting = true;

        this.requestService.postRequest(CHANGE_PASS_API_URL, payload)
            .pipe(finalize(() => (this.isSubmitting = false)))
            .subscribe({
                next: () => {
                    this.toastService.show('Password changed successfully!', 'success');
                    this.passwordForm.reset();
                },
                error: (err) => {
                    const msg = err?.error?.message ?? 'Failed to change password';
                    this.toastService.show(msg, 'error');
                }
            });
    }

    getErrorMsg(controlName: string, index?: number, field?: string) {
        return getError(this.personalForm, controlName, {
            index,
            field,
            customMessages: this.errorMessages
        });
    }

    toggleButton(type: 'currentPassword' | 'newPassword' | 'confirmPassword') {
        if (type === 'currentPassword') {
            this.currentPassword = !this.currentPassword;
        } else if (type === 'newPassword') {
            this.newPassword = !this.newPassword;
        } else if (type === 'confirmPassword') {
            this.confirmPassword = !this.confirmPassword;
        }
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
