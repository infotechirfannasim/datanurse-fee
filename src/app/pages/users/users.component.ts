import {Component, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule, NgClass} from '@angular/common';
import {ToastService} from '../../core/services/toast.service';
import {RequestService} from "../../core/services/request.service";
import {
    ACTIVE_ROLES_API_URL,
    DELETE_USER_API_URL,
    GET_LOV_BULK_API_URL,
    USERS_API_URL
} from "../../utils/api.url.constants";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {FilterParams, Role, User} from "../../core/models/user.model";
import {ROLES} from "../../utils/app-constants";
import {MultiSelectModule} from "primeng/multiselect";
import {SelectModule} from "primeng/select";
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from "rxjs";
import {getError, getUserInitials, markAllTouched, passwordMatchValidator} from "../../utils/global.utils";
import {RegexConstants} from "../../utils/regex-constants";

@Component({
    selector: 'app-doctors',
    standalone: true,
    imports: [FormsModule, NgClass, ReactiveFormsModule, CommonModule, MultiSelectModule, SelectModule],
    templateUrl: './users.component.html',
    styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
    private toastService = inject(ToastService);

    searchQuery = signal('');
    pageQuery = signal(1);
    pagination = signal<any>(null);
    showAddModal = signal(false);
    showViewModal = signal(false);
    showDeleteModal = signal(false);
    selectedUser = signal<User | null>(null);
    selectedUserId = signal<number | null>(null);
    isEditMode: boolean = false;
    form!: FormGroup;
    imagePreview: string | null = null;
    selectedFile: File | null = null;
    roles: any[] = [];
    specialtyOptions: any[] = [];
    hospitalOptions: any[] = [];
    cityOptions: any[] = [];
    users: User[] = [];
    showPassword = false;
    showConfirmPassword = false;
    errorMessages = {
        firstName: {required: 'First name is required', pattern: 'Only alphabets allowed'},
        lastName: {required: 'Last name is required', pattern: 'Only alphabets allowed'},
        role: {required: 'Role is required'},
        email: {required: 'Email is required', email: 'Provide valid email'},
        password: {
            required: 'Password is required',
            minlength: 'Min 8 characters',
            maxlength: 'Max 20 characters',
            pattern: 'Include upper, lower, number & special char'
        },
        confirmPassword: {required: 'Confirm password is required', mismatch: 'Passwords must be same'}
    };
    private fb = inject(FormBuilder);
    private requestService = inject(RequestService);
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    constructor() {
    }

    ngOnInit() {
        this.loadUsers();
        this.loadRoles();
        this.buildForm();
        this.loadLovs();
        this.setupSearchDebounce();
    }

    buildForm() {
        this.form = this.fb.group({
            firstName: ['', [Validators.required,
                Validators.minLength(5),
                Validators.maxLength(50),
                Validators.pattern(RegexConstants.ALPHABET_REGEX)]],
            lastName: ['', [Validators.required,
                Validators.minLength(5),
                Validators.maxLength(50),
                Validators.pattern(RegexConstants.ALPHABET_REGEX)]],
            email: ['', [Validators.required, Validators.email]],
            role: ['', Validators.required],
            password: [''],
            confirmPassword: [''],
            status: ['active', Validators.required],
        }, {
            validators: passwordMatchValidator('password', 'confirmPassword')
        });
    }

    setupSearchDebounce() {
        this.searchSubject
            .pipe(
                debounceTime(500),
                distinctUntilChanged(),
                takeUntil(this.destroy$),
            )
            .subscribe(() => {
                this.loadUsers();
            });
    }

    onSearchChange() {
        this.searchSubject.next(this.searchQuery().toLowerCase());
    }

    loadUsers() {
        const filters: FilterParams = {
            search: this.searchQuery().toLowerCase() || '',
            page: this.pageQuery(),
            limit: 10
        };
        this.requestService.getRequest(USERS_API_URL, filters).subscribe({
            next: (response: HttpResponse<any>) => {
                if (response.status == 200 && response.body.data) {
                    this.users = response.body.data || [];
                    this.pagination.set(response.body.meta?.pagination || null);
                } else {
                    this.users = [];
                    this.pagination.set(null);
                }
            },
            error: (error: HttpErrorResponse) => {
                const errMsg = error.error.message || error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error')
                this.users = [];
                this.pagination.set(null);
            },
        });
    }

    loadRoles() {
        this.requestService.getRequest(ACTIVE_ROLES_API_URL).subscribe({
            next: (response: HttpResponse<any>) => {
                if (response.status == 200 && response.body.data) {
                    this.roles = Array.isArray(response.body.data)
                        ? response.body.data.filter((user: any) => user.name.toLowerCase() == ROLES.SUPER_ADMIN.toLowerCase())
                        : [];
                } else {
                    this.roles = [];
                }
            },
            error: (error: HttpErrorResponse) => {
                const errMsg = error.error.message || error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error')
                this.roles = [];
            },
        });
    }

    openView(user: User): void {
        this.selectedUser.set(user);
        this.showViewModal.set(true);
    }

    loadLovs() {
        const payload = {
            types: ['specialty', 'hospitals', 'city'],
        };
        this.requestService.postRequest(GET_LOV_BULK_API_URL, payload).subscribe({
            next: (response: HttpResponse<any>) => {
                if (response.status == 200 && response.body.data) {
                    this.specialtyOptions = response.body.data['specialty'];
                    this.hospitalOptions = response.body.data['hospitals'];
                    this.cityOptions = response.body.data['city'];
                } else {
                    this.roles = [];
                }
            },
            error: (error: HttpErrorResponse) => {
                const errMsg = error.error.message || error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error');
                this.roles = [];
            },
        });
    }

    openDelete(user: User): void {
        this.selectedUser.set(user);
        this.showDeleteModal.set(true);
    }

    getStatusClass(status: string): string {
        const map: Record<string, string> = {active: 'badge-green', pending: 'badge-amber', inactive: 'badge-gray'};
        return map[status] ?? 'badge-gray';
    }

    onAddUer(): void {
        this.resetForm();
        this.selectedUser.set(null);
        this.isEditMode = false;
        this.updateFormValidation();
        this.showAddModal.set(true);
    }

    onEditProfile(user: User): void {
        if (!user) return;
        this.selectedUser.set(user);
        this.form.patchValue(this.mapDoctorToForm(user));
        this.isEditMode = true;
        this.updateFormValidation();
        this.showAddModal.set(true);
    }

    updateFormValidation(): void {
        const isAddMode = !this.isEditMode;
        this.isEditMode ? this.form.get('email')?.disable() : this.form.get('email')?.enable();
        if (isAddMode) {
            this.form.get('password')?.setValidators([
                Validators.required,
                Validators.minLength(8),
                Validators.maxLength(20),
                Validators.pattern(RegexConstants.PASSWORD_REGEX)
            ]);

            this.form.get('confirmPassword')?.setValidators([
                Validators.required
            ]);
        } else {
            this.form.get('password')?.setValidators(null);
            this.form.get('confirmPassword')?.setValidators(null);
        }
        this.form.get('password')?.updateValueAndValidity();
        this.form.get('confirmPassword')?.updateValueAndValidity();
    }

    mapDoctorToForm(user: any) {
        return {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user?.role?._id,
            status: user.status,
        };
    }

    confirmDelete(): void {
        if (!this.selectedUser()) return;
        this.requestService.deleteRequest(DELETE_USER_API_URL + this.selectedUser()?._id).subscribe({
            next: (response) => {
                this.toastService.show('User deleted successfully', 'success');
                this.showDeleteModal.set(false);
                this.loadUsers();
            },
            error: (error: HttpErrorResponse) => {
                const errMsg = error.error.message || error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error')
            }
        });

    }

    onImageSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                this.toastService.show('Image size must be less than 1MB', 'error');
                return;
            }
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                this.toastService.show('Only JPG and PNG allowed', 'error');
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

    submitUser(): void {
        if (this.form.invalid) {
            markAllTouched(this.form);
            this.toastService.show('Please fill all required fields correctly', 'error');
            return;
        }

        const formData = new FormData();
        if (!this.isEditMode) {
            const password = this.form.value.password;
            const confirmPassword = this.form.value.confirmPassword;
            if (!password || !confirmPassword) {
                this.toastService.show('Password and Confirm Password are required.', 'error');
                return;
            }
            if (password !== confirmPassword) {
                this.toastService.show('Password and Confirm Password must be same.', 'error');
                return;
            }
            formData.append('password', this.form.value.password);
            formData.append('mustSetPassword', 'false');
        }

        formData.append('firstName', this.form.value.firstName);
        formData.append('lastName', this.form.value.lastName);
        formData.append('email', this.form.value.email);
        formData.append('role', this.roles.find((role: Role) => role.name === ROLES.SUPER_ADMIN)?._id);
        formData.append('status', this.form.value.status);

        if (this.selectedFile) {
            formData.append('profileImage', this.selectedFile);
        }
        const request$ = this.isEditMode
            ? this.requestService.patchReqWithFormData(`${USERS_API_URL}/${this.selectedUser()?._id}`, formData)
            : this.requestService.postReqWithFormData(USERS_API_URL, formData);

        request$.subscribe({
            next: (response) => {
                this.toastService.show(this.isEditMode ? 'User updated successfully' : 'User added successfully', 'success');
                this.resetForm();
                this.showAddModal.set(false);
                this.loadUsers();
            },
            error: (error: HttpErrorResponse) => {
                const errMsg = error.error.message || error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error')
            }
        });
    }

    resetForm(): void {
        this.selectedUser.set(null);
        this.imagePreview = null;
        this.selectedFile = null;
        this.form.reset({status: 'active'});
    }

    goToPage(page: number) {
        const p = this.pagination();
        if (!p || page < 1 || page > p.totalPages) return;
        this.pageQuery.set(page);
        this.loadUsers();
    }

    getPages(): number[] {
        const p = this.pagination();
        if (!p) return [];
        return Array.from({length: p.totalPages}, (_, i) => i + 1);
    }

    getProfileImageUrl(user: any = this.selectedUser()): string | null {
        if (!user?.profileImage?.data || !user?.profileImage?.contentType) return null;
        return `data:${user.profileImage.contentType};base64,${user.profileImage.data}`;
    }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPassword(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    getErrorMsg(controlName: string, index?: number, field?: string) {
        return getError(this.form, controlName, {
            index,
            field,
            customMessages: this.errorMessages
        });
    }

    protected readonly getUserInitials = getUserInitials;
}
