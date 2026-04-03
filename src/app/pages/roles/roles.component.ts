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

    ngOnInit() {
        this.loadRoles();
        this.buildForm();
        this.loadModules();
        this.setupSearchDebounce();
    }

    buildForm() {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            label: ['', [Validators.required]],
            description: [''],
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

    onEditRole() {
        const role = this.selectedRole();
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
                this.toastService.show('Role removed successfully', 'success');
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

    submitRole(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.toastService.show('Please fill all required fields', 'error');
            return;
        }

        const payload = {
            ...this.form.value,
            permissions: Array.from(this.selectedPermissions)
        };

        const request$ = this.isEditMode
            ? this.requestService.patchRequest(`${ROLES_API_URL}/${this.selectedRoleId()}`, payload)
            : this.requestService.postRequest(ROLES_API_URL, payload);

        request$.subscribe({
            next: (response) => {
                this.toastService.show(
                    this.isEditMode ? 'Role updated successfully!' : 'Role created successfully!',
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
}
