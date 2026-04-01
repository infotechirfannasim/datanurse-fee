import {Component, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule, NgClass} from '@angular/common';
import {ToastService} from '../../core/services/toast.service';
import {Doctor} from '../../core/models/doctor.model';
import {RequestService} from "../../core/services/request.service";
import {
    ACTIVE_ROLES_API_URL,
    DELETE_USER_API_URL,
    GET_LOV_BULK_API_URL,
    USERS_API_URL
} from "../../utils/api.url.constants";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {FilterParams, Role} from "../../core/models/user.model";
import {ROLES} from "../../utils/app-constants";
import {MultiSelectModule} from "primeng/multiselect";
import {SelectModule} from "primeng/select";
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from "rxjs";

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
    selectedUser = signal<Doctor | null>(null);
    selectedUserId = signal<number | null>(null);
    isEditMode: boolean = false;
    form!: FormGroup;
    imagePreview: string | null = null;
    selectedFile: File | null = null;
    roles: any[] = [];
    specialtyOptions: any[] = [];
    hospitalOptions: any[] = [];
    cityOptions: any[] = [];
    users: Doctor[] = [];
    showPassword = false;
    showConfirmPassword = false;
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
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            role: ['', Validators.required],
            password: ['', Validators.required],
            confirmPassword: ['', Validators.required],
            status: ['active', Validators.required],
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
                const errMsg = error.message || error.error.message || 'Something went wrong';
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
                const errMsg = error.message || error.error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error')
                this.roles = [];
            },
        });
    }

    openView(doc: Doctor): void {
        this.selectedUser.set(doc);
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
                const errMsg = error.message || error.error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error');
                this.roles = [];
            },
        });
    }

    openDelete(doc: Doctor): void {
        this.selectedUser.set(doc);
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
        this.showAddModal.set(true);
    }

    onEditProfile(doc: Doctor): void {
        this.selectedUser.set(doc);
        this.form.patchValue(this.mapDoctorToForm(doc));
        this.isEditMode = true;
        this.showAddModal.set(true);
    }

    mapDoctorToForm(doc: any) {
        return {
            firstName: doc.firstName,
            lastName: doc.lastName,
            email: doc.email,
            role: doc.role._id,
            status: doc.status,
        };
    }

    confirmDelete(): void {
        if (!this.selectedUser()) return;
        this.requestService.deleteRequest(DELETE_USER_API_URL + this.selectedUser()?._id).subscribe({
            next: (response) => {
                this.toastService.show('User removed successfully', 'success');
                this.showDeleteModal.set(false);
                this.loadUsers();
            },
            error: (error: HttpErrorResponse) => {
                const errMsg = error.message || error.error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error')
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

    submitUser(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        if (!this.isEditMode) {
            const password = this.form.value.password;
            const confirmPassword = this.form.value.confirmPassword;

            if (!password || !confirmPassword) {
                this.toastService.show('Password and Confirm Password are required', 'error');
                return;
            }
        }

        const formData = new FormData();
        formData.append('firstName', this.form.value.firstName);
        formData.append('lastName', this.form.value.lastName);
        formData.append('email', this.form.value.email);
        formData.append('password', this.form.value.password);
        formData.append('mustSetPassword', 'false');
        formData.append('role', this.roles.find((role: Role) => role.name === ROLES.SUPER_ADMIN)?._id);
        formData.append('status', this.form.value.status);

        if (this.selectedFile) {
            formData.append('profileImage', this.selectedFile);
        }
        const request$ = this.isEditMode
            ? this.requestService.patchReqWithFormData(`${USERS_API_URL}/${this.selectedUserId()}`, formData)
            : this.requestService.postReqWithFormData(USERS_API_URL, formData);

        request$.subscribe({
            next: (response) => {
                this.toastService.show(this.isEditMode ? 'User updated successfully' : 'User added successfully', 'success');
                this.resetForm();
                this.showAddModal.set(false);
                this.loadUsers();
            },
            error: (error: HttpErrorResponse) => {
                const errMsg = error.message || error.error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error')
            }
        });
    }

    resetForm(): void {
        this.form.reset();
        this.selectedUser.set(null);
        this.imagePreview = null;
        this.selectedFile = null;
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

    getProfileImageUrl(doc: any = this.selectedUser()): string | null {
        if (!doc?.profileImage?.data || !doc?.profileImage?.contentType) return null;
        return `data:${doc.profileImage.contentType};base64,${doc.profileImage.data}`;
    }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPassword(): void {
        this.showConfirmPassword = !this.showConfirmPassword;
    }
}
