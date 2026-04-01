import {Component, computed, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';

import {ToastService} from '../../core/services/toast.service';
import {RequestService} from '../../core/services/request.service';

import {
    DELETE_ROLE_API_URL,
    GET_LOV_BULK_API_URL,
    GET_LOV_BY_TYPE_API_URL,
    LOV_API_URL,
    LOV_TYPES_API_URL,
} from '../../utils/api.url.constants';

import {HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {FilterParams} from '../../core/models/user.model';
import {LOV} from '../../core/models/lov.model';

import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, takeUntil} from 'rxjs/operators';

@Component({
    selector: 'app-lov',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './lov.component.html',
    styleUrl: './lov.component.scss'
})
export class LovComponent implements OnInit, OnDestroy {

    // Signals
    searchQuery = signal<string>('');
    pageQuery = signal<number>(1);
    pagination = signal<any>(null);
    showAddModal = signal<boolean>(false);
    showViewModal = signal<boolean>(false);
    showDeleteModal = signal<boolean>(false);
    selectedLov = signal<LOV | null>(null);
    selectedLovType = signal<string>('');
    isLoading = signal<boolean>(false);
    lovOptions = signal<{ [key: string]: any[] }>({});

    // Regular properties
    isEditMode = false;
    form!: FormGroup;
    lovs: LOV[] = [];
    lovTypes: any[] = [];
    selectedLovRelations: any[] = [];
    lovName: string = '';

    private destroy$ = new Subject<void>();
    private searchSubject = new Subject<string>();

    private toastService = inject(ToastService);
    private fb = inject(FormBuilder);
    private requestService = inject(RequestService);

    ngOnInit(): void {
        this.getLovTypes();
        this.setupSearchDebounce();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    lovOptionsForCurrentType = computed<any[]>(() => {
        const type = this.selectedLovType();
        if (!type) return [];

        return this.lovOptions()[type] || [];
    });

    buildForm() {
        if (!this.selectedLovType()) return;
        const lov = this.selectedLov();
        const group: any = {
            type: [this.selectedLovType()],
            code: [{value: lov?.code || '', disabled: this.isEditMode}, Validators.required],
            label: [lov?.label || '', Validators.required],
            description: [lov?.description || ''],
            status: [lov?.status ?? 'active']
        };

        this.selectedLovRelations.forEach(col => {
            const parent = this.selectedLov()?.parents?.find(
                (item: any) => item.type === col.parentLovKey
            );

            group[col.formKey] = [
                parent ? parent.code : '',
                Validators.required
            ];
        });
        this.form = this.fb.group(group);
    }

    resetForm(): void {
        this.isEditMode = false;
        this.selectedLov.set(null);
        this.form.reset(
            {
                type: this.selectedLovType(),
                status: 'active'
            }
        );
        this.form.get('code')?.enable();
    }

    setupSearchDebounce(): void {
        this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => this.getLovValueOptions());
    }

    onSearchChange(): void {
        this.searchSubject.next(this.searchQuery());
    }

    getLovTypes(): void {
        this.requestService.getRequest(LOV_TYPES_API_URL).subscribe({
            next: (res: HttpResponse<any>) => {
                if (res.status === 200) {
                    this.lovTypes = res.body?.data || [];
                }
            },
            error: (err) => console.error('Failed to load LOV types', err)
        });
    }

    openAddModal(): void {
        if (!this.selectedLovType()) {
            this.toastService.show('Please select LOV Type first', 'error');
            return;
        }

        this.isEditMode = false;
        this.buildForm();
        this.resetForm();
        this.getParentLOVs();
        this.showAddModal.set(true);
    }

    openEdit(lov: LOV | null): void {
        this.closeViewModal();
        this.isEditMode = true;
        this.buildForm();

        this.form.patchValue({
            type: this.selectedLovType(),
            code: lov?.code,
            label: lov?.label,
            description: lov?.description || '',
            status: lov?.status
        });
        this.form.get('code')?.disable();
        this.getParentLOVs();
        this.showAddModal.set(true);
    }

    openView(lov: LOV): void {
        this.selectedLov.set(lov);
        this.showViewModal.set(true);
    }

    openDelete(lov: LOV): void {
        this.selectedLov.set(lov);
        this.showDeleteModal.set(true);
    }

    getParentLOVs(): void {
        if (!this.selectedLovRelations.length) return;

        const types = this.selectedLovRelations.map((meta: any) => meta.parentLovKey);

        this.requestService.postRequest(GET_LOV_BULK_API_URL, {types}).subscribe({
            next: (res: HttpResponse<any>) => {
                if (res.status === 200) {
                    const newData = res.body?.data || {};
                    this.lovOptions.update(current => ({
                        ...current,
                        ...newData
                    }));
                }
            },
            error: (err) => console.error('Failed to load parent LOVs', err)
        });
    }

    onLovTypeChange(): void {
        this.updateLovName();
        this.setTableColumns();
        this.getLovValueOptions();
    }

    updateLovName(): void {
        if (!this.selectedLovType()) {
            this.lovName = '';
            return;
        }

        const selected = this.lovTypes.find(t => t.key === this.selectedLovType() || t.value === this.selectedLovType());
        this.lovName = selected?.label || '';
    }

    getLovValueOptions(): void {
        const type = this.selectedLovType();
        if (!type) return;
        const filters: FilterParams = {
            search: this.searchQuery().trim(),
            page: this.pageQuery(),
            limit: 10
        };

        const url = `${GET_LOV_BY_TYPE_API_URL}${this.selectedLovType()}`;
        this.requestService.getRequest(url, filters).subscribe({
            next: (res: HttpResponse<any>) => {
                if (res.status === 200) {
                    const newData = res.body?.data || [];
                    this.lovOptions.update(current => ({
                        ...current,
                        [type]: newData
                    }));
                    this.pagination.set(res.body.meta?.pagination || null);
                } else {
                    this.pagination.set(null);
                }
            },
            error: () => {
                this.pagination.set(null);
            }
        });
    }

    setTableColumns(): void {
        const selectedType = this.lovTypes.find(t => t.key === this.selectedLovType());
        this.selectedLovRelations = selectedType?.childMeta || [];
    }

    submitLov(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.toastService.show('Please fill all required fields', 'error');
            return;
        }

        const rawValue = this.form.getRawValue();
        const payload = this.normalizePayload(rawValue);

        const request$ = this.isEditMode
            ? this.requestService.patchRequest(`${LOV_API_URL}/${this.selectedLov()?._id}`, payload)
            : this.requestService.postRequest(LOV_API_URL, payload);

        request$.subscribe({
            next: () => {
                this.toastService.show(
                    this.isEditMode ? 'LOV updated successfully!' : 'LOV created successfully!',
                    'success'
                );
                this.closeAddModal();
                this.getLovValueOptions();
            },
            error: (err: HttpErrorResponse) => {
                this.toastService.show(err.error?.message || 'Failed to save LOV', 'error');
            }
        });
    }

    normalizePayload(formValue: any): any {
        return {
            ...formValue,
            status: formValue.status ? 'active' : 'inactive',
            parents: this.buildParents(formValue)
        };
    }

    buildParents(formValue: any): any[] {
        return this.selectedLovRelations.map((col: any, index: number) => ({
            type: col.parentLovKey,
            code: formValue[col.formKey],
            isPrimary: index === 0
        }));
    }

    confirmDelete(): void {
        const lov = this.selectedLov();
        if (!lov) return;

        this.requestService.deleteRequest(`${DELETE_ROLE_API_URL}/${lov._id}`).subscribe({
            next: () => {
                this.toastService.show('LOV deleted successfully', 'success');
                this.closeDeleteModal();
                this.getLovValueOptions();
            },
            error: (err: HttpErrorResponse) => {
                this.toastService.show(err.error?.message || 'Failed to delete LOV', 'error');
            }
        });
    }

    closeAddModal(): void {
        this.showAddModal.set(false);
        this.resetForm();
    }

    closeViewModal(): void {
        this.showViewModal.set(false);
    }

    closeDeleteModal(): void {
        this.showDeleteModal.set(false);
        this.selectedLov.set(null);
    }

    goToPage(page: number): void {
        const p = this.pagination();
        if (!p || page < 1 || page > p.totalPages) return;

        this.pageQuery.set(page);
        this.getLovValueOptions();
    }

    getPages(): number[] {
        const p = this.pagination();
        return p ? Array.from({length: p.totalPages}, (_, i) => i + 1) : [];
    }

    getStatusClass(status: string): string {
        const map: Record<string, string> = {active: 'badge-green', pending: 'badge-amber', inactive: 'badge-gray'};
        return map[status] ?? 'badge-gray';
    }
}
