import {Component, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule, NgClass} from '@angular/common';
import {ToastService} from '../../core/services/toast.service';
import {RequestService} from "../../core/services/request.service";
import {DELETE_ROLE_API_URL, MODULES_API_URL, ROLES_API_URL} from "../../utils/api.url.constants";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {FilterParams, Role} from "../../core/models/user.model";
import {MultiSelectModule} from "primeng/multiselect";
import {SelectModule} from "primeng/select";
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from "rxjs";
import {getError, markAllTouched} from "../../utils/global.utils";
import {RegexConstants} from "../../utils/regex-constants";

@Component({
    selector: 'app-roles',
    standalone: true,
    imports: [FormsModule, NgClass, ReactiveFormsModule, CommonModule, MultiSelectModule, SelectModule],
    templateUrl: './roles.component.html',
    styleUrl: './roles.component.scss'
})
export class RolesComponent implements OnInit {
    searchQuery = signal('');
    pageQuery = signal(1);
    pagination = signal<any>(null);
    showAddModal = signal(false);
    showViewModal = signal(false);
    showDeleteModal = signal(false);
    showConfirmClose = signal(false);
    selectedRole = signal<Role | null>(null);
    selectedRoleId = signal<string | null>(null);
    isEditMode: boolean = false;
    form!: FormGroup;
    roles: Role[] = [];
    modules: any[] = [];
    selectedPermissions = new Set<string>();
    isLoading = signal(false);

    private toastService = inject(ToastService);
    private fb = inject(FormBuilder);
    private requestService = inject(RequestService);
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();
    errorMessages = {
        name: {
            required: 'Code is required', pattern: 'No spaces allowed',
            minlength: 'Min 3 characters',
            maxlength: 'Max 50 characters',
        },
        label: {
            required: 'Name is required',
            minlength: 'Min 3 characters',
            maxlength: 'Max 50 characters',
            pattern: 'Only alphabets allowed'
        },
        description: {
            maxlength: 'Max 500 characters',
        }
    };
    ngOnInit() {
        this.loadRoles();
        this.buildForm();
        this.loadModules();
        this.setupSearchDebounce();
    }

    buildForm() {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(RegexConstants.NO_SPACE_REGEX)]],
            label: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(RegexConstants.ALPHABET_REGEX)]],
            description: ['', [Validators.maxLength(500)]],
            permissions: [[]]
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
                this.loadRoles();
            });
    }

    onSearchChange() {
        this.searchSubject.next(this.searchQuery().toLowerCase());
    }

    loadRoles() {
        this.isLoading.set(true);
        const filters: FilterParams = {
            search: this.searchQuery().toLowerCase() || '',
            page: this.pageQuery(),
            limit: 10
        };
        this.requestService.getRequest(ROLES_API_URL, filters).subscribe({
            next: (response: HttpResponse<any>) => {
                if (response.status == 200 && response.body.data) {
                    this.roles = response.body.data || [];
                    this.pagination.set(response.body.meta?.pagination || null);
                } else {
                    this.roles = [];
                    this.pagination.set(null);
                }
                this.isLoading.set(false);
            },
            error: (error: HttpErrorResponse) => {
                this.roles = [];
                this.pagination.set(null);
                this.isLoading.set(false);
                const errMsg = error.error.message || error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error')
            },
        });
    }

    openView(role: Role): void {
        this.selectedRole.set(role);
        this.showViewModal.set(true);
    }

    loadModules() {
        this.requestService.getRequest(MODULES_API_URL).subscribe({
            next: (response: HttpResponse<any>) => {
                if (response.status == 200 && response.body.data) {
                    this.modules = response.body.data;
                    this.modules = this.modules.sort((a, b) => a.seq - b.seq);
                } else {
                    this.modules = [];
                }
            },
            error: (error: HttpErrorResponse) => {
                this.modules = [];
                const errMsg = error.error.message || error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error')
            },
        });
    }

    openDelete(role: Role): void {
        this.selectedRole.set(role);
        this.showDeleteModal.set(true);
    }

    getStatusClass(status: string): string {
        const map: Record<string, string> = {active: 'badge-green', pending: 'badge-amber', inactive: 'badge-gray'};
        return map[status] ?? 'badge-gray';
    }

    onEditRole(role: Role) {
        this.selectedRole.set(role);
        if (!role) return;

        this.isEditMode = true;
        this.selectedRoleId.set(String(role._id));
        if (role.permissions && Array.isArray(role.permissions)) {
            this.selectedPermissions.clear();
            (role.permissions as any[]).forEach(perm => {
                if (typeof perm === 'string') {
                    this.selectedPermissions.add(perm);
                }
                else {
                    const permValue = perm.slug || perm.name || perm.code;
                    if (permValue) {
                        this.selectedPermissions.add(permValue);
                    }
                }
            });
        }
        this.form.patchValue({
            name: role.name,
            label: role.label,
            description: role.description,
            permissions: Array.from(this.selectedPermissions)
        });

        this.form.get('name')?.disable();
        this.showViewModal.set(false);
        this.showAddModal.set(true);
    }

    resetForm() {
        this.form.reset();
        this.selectedPermissions.clear();
        this.isEditMode = false;
        this.form.get('name')?.enable();
        this.selectedRoleId.set(null);
    }

    confirmDelete(): void {
        if (!this.selectedRole()) return;

        this.requestService.deleteRequest(`${DELETE_ROLE_API_URL}/${this.selectedRole()?._id}`).subscribe({
            next: (response) => {
                this.toastService.show('Role deleted successfully', 'success');
                this.showDeleteModal.set(false);
                this.loadRoles();
            },
            error: (err) => {
                console.error(err);
                this.toastService.show(err.error?.message || 'Failed to remove role', 'error');
            }
        });
    }

    isChecked(slug: string): boolean {
        return this.selectedPermissions.has(slug);
    }

    togglePermission(slug: string, checked: boolean) {
        if (checked) {
            this.selectedPermissions.add(slug);
        } else {
            this.selectedPermissions.delete(slug);
        }
        this.syncFormPermissions();
    }

    syncFormPermissions() {
        this.form.patchValue({
            permissions: Array.from(this.selectedPermissions)
        });
    }

    selectAllModulePermissions(module: any, checked: boolean) {
        if (module.actions) {
            module.actions.forEach((action: any) => {
                if (checked) {
                    this.selectedPermissions.add(action.slug);
                } else {
                    this.selectedPermissions.delete(action.slug);
                }
            });
        }


        if (module.children) {
            module.children.forEach((child: any) => {
                if (child.actions) {
                    child.actions.forEach((action: any) => {
                        if (checked) {
                            this.selectedPermissions.add(action.slug);
                        } else {
                            this.selectedPermissions.delete(action.slug);
                        }
                    });
                }
            });
        }

        this.syncFormPermissions();
    }

    isModuleFullySelected(module: any): boolean {
        if (!module?.actions) return false;

        return module.actions.every((action: any) =>
            action?.slug && this.selectedPermissions.has(action.slug)
        );
    }

    submitRole(): void {
        if (this.form.invalid) {
            markAllTouched(this.form)
            this.toastService.show('Please fill all required fields correctly', 'error');
            return;
        }
        const {description} = this.form.value;
        const payload = {
            ...this.form.value,
            description: description ? description : '',
            permissions: Array.from(this.selectedPermissions)
        };

        const request$ = this.isEditMode
            ? this.requestService.patchRequest(`${ROLES_API_URL}/${this.selectedRoleId()}`, payload)
            : this.requestService.postRequest(ROLES_API_URL, payload);

        request$.subscribe({
            next: (response) => {
                this.toastService.show(
                    this.isEditMode ? 'Role updated successfully!' : 'Role added successfully!',
                    'success'
                );
                this.resetForm();
                this.showAddModal.set(false);
                this.loadRoles();
            },
            error: (err) => {
                console.error(err);
                this.toastService.show(err.error?.message || 'Failed to save role', 'error');
            }
        });
    }

    goToPage(page: number) {
        const p = this.pagination();
        if (!p || page < 1 || page > p.totalPages) return;
        this.pageQuery.set(page);
        this.loadRoles();
    }

    getPages(): number[] {
        const p = this.pagination();
        if (!p) return [];
        return Array.from({length: p.totalPages}, (_, i) => i + 1);
    }

    getErrorMsg(controlName: string, index?: number, field?: string) {
        return getError(this.form, controlName, {
            index,
            field,
            customMessages: this.errorMessages
        });
    }

    cancelClose() {
        this.showConfirmClose.set(false);
    }

    closeModal() {
        if (this.form.dirty) {
            this.showConfirmClose.set(true);
        } else {
            this.showAddModal.set(false);
            this.resetForm();
        }
    }

    discardChanges() {
        this.resetForm();
        this.cancelClose();
        this.closeModal();
    }
}
