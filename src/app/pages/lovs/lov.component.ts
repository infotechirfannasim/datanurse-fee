import {Component, computed, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ToastService} from '../../core/services/toast.service';
import {RequestService} from '../../core/services/request.service';
import {
    DELETE_LOV_API_URL,
    GET_LOV_BULK_API_URL,
    GET_LOV_BY_TYPE_API_URL,
    LOV_API_URL,
    LOV_TYPES_API_URL,
} from '../../utils/api.url.constants';
import {HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {LOV} from '../../core/models/lov.model';
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from 'rxjs';
import {SelectModule} from "primeng/select";
import {MultiSelectModule} from "primeng/multiselect";
import {RegexConstants} from "../../utils/regex-constants";
import {getError} from "../../utils/global.utils";


interface NavigationState {
    type: string;
    parentContext: { type: string; code: string; name: string } | null;
}

export interface FilterParams {
    search?: string;
    page?: number;
    limit?: number;
    parentType?: string;
    parentCode?: string;

    [key: string]: any;
}

@Component({
    selector: 'app-lov',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, MultiSelectModule, SelectModule,],
    templateUrl: './lov.component.html',
    styleUrl: './lov.component.scss'
})
export class LovComponent implements OnInit, OnDestroy {
    navigationStack = signal<NavigationState[]>([]);
    searchQuery = signal<string>('');
    pageQuery = signal<number>(1);
    pagination = signal<any>(null);
    showAddModal = signal<boolean>(false);
    showViewModal = signal<boolean>(false);
    showDeleteModal = signal<boolean>(false);
    selectedLov = signal<LOV | null>(null);
    isLoading = signal<boolean>(false);
    selectedLovType = signal<string>('');
    lovOptions = signal<{ [key: string]: any[] }>({});
    rootType = computed(() => this.navigationStack().at(0)?.type ?? '');

    topLevelLovTypes = computed(() =>
        this.lovTypes().filter((t: any) => !t.hasParent && t.childMeta?.length === 0)
    );
    isActive = true;

    currentLovType = computed(() => this.navigationStack().at(-1)?.type ?? '');
    currentParentContext = computed(() => this.navigationStack().at(-1)?.parentContext ?? null);

    hasChildrenForCurrentType = computed(() => {
        const type = this.currentLovType();
        return !!(type && this.childTypesMap()[type]?.length > 0);
    });
    lovOptionsForCurrentType = computed<any[]>(() => {
        const type = this.currentLovType();
        return type ? (this.lovOptions()[type] || []) : [];
    });
    breadcrumbItems = computed(() => {
        const stack = this.navigationStack();
        const items: { name: string; targetLevel: number }[] = [];
        if (stack.length === 0) return items;

        const rootLabel = this.lovTypes().find((t: any) => t.key === stack[0].type)?.name || stack[0].type;
        items.push({name: rootLabel, targetLevel: 1});

        for (let i = 1; i < stack.length; i++) {
            const ctx = stack[i].parentContext;
            if (ctx) items.push({name: ctx.name, targetLevel: i + 1});

            const typeLabel = this.lovTypes().find((t: any) => t.key === stack[i].type)?.name || stack[i].type;
            items.push({name: typeLabel, targetLevel: i + 1});
        }
        return items;
    });

    lovTypes = signal<any[]>([]);
    childTypesMap = signal<{ [parentKey: string]: any[] }>({});

    selectedLovRelations: any[] = [];
    lovName: string = '';
    isEditMode = false;
    form!: FormGroup;

    private destroy$ = new Subject<void>();
    private searchSubject = new Subject<string>();

    private toastService = inject(ToastService);
    private fb = inject(FormBuilder);
    private requestService = inject(RequestService);

    ngOnInit(): void {
        this.getAllLovTypes();
        this.setupSearchDebounce();
    }

    setupSearchDebounce(): void {
        this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => this.getLovValueOptions());
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    getAllLovTypes(): void {
        this.requestService.getRequest(LOV_TYPES_API_URL).subscribe({
            next: (res: HttpResponse<any>) => {
                if (res.status === 200) {
                    this.lovTypes.set(res.body?.data || []);
                    this.buildChildTypesMap();
                }
            },
            error: (err) => console.error('Failed to load LOV types', err)
        });
    }

    buildChildTypesMap(): void {
        const map: { [key: string]: any[] } = {};
        this.lovTypes().forEach((t: any) => {
            if (t.childMeta?.length) {
                t.childMeta.forEach((meta: any) => {
                    const pKey = meta.parentLovKey;
                    if (!map[pKey]) map[pKey] = [];
                    if (!map[pKey].some((existing: any) => existing.key === t.key)) {
                        map[pKey].push(t);
                    }
                });
            }
        });
        this.childTypesMap.set(map);
    }

    onSearchChange(): void {
        this.searchSubject.next(this.searchQuery());
    }

    onTopLevelTypeChange(newType: string): void {
        if (!newType || newType === this.rootType()) return;

        this.navigationStack.set([{
            type: newType,
            parentContext: null
        }]);

        this.updateLovName();
        this.setTableColumns();
        this.getLovValueOptions();
    }

    openView(lov: LOV): void {
        this.selectedLov.set(lov);
        this.showViewModal.set(true);
    }

    drillDown(lov: LOV): void {
        const currType = this.currentLovType();
        let childrenTypes = this.childTypesMap()[currType] || [];

        if (childrenTypes.length === 0) {
            this.toastService.show('No child types defined', 'info');
            return;
        }

        childrenTypes = [...childrenTypes].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        const targetChild = childrenTypes[0];

        const newState: NavigationState = {
            type: targetChild.key,
            parentContext: {
                type: currType,
                code: lov.code,
                name: lov.name
            }
        };

        this.navigationStack.update(stack => [...stack, newState]);
        this.updateLovName();
        this.setTableColumns();
        this.getLovValueOptions();
    }

    goToLevel(targetLevel: number): void {
        if (targetLevel < 1 || targetLevel > this.navigationStack().length) return;
        this.navigationStack.update(stack => stack.slice(0, targetLevel));
        this.updateLovName();
        this.setTableColumns();
        this.getLovValueOptions();
    }

    buildForm() {
        if (!this.currentLovType()) return;
        const lov = this.selectedLov();
        const group: any = {
            type: [this.currentLovType()],
            code: [{
                value: lov?.code || '',
                disabled: this.isEditMode
            }, [Validators.required, Validators.pattern(RegexConstants.NO_SPACE_REGEX)]],
            name: [lov?.name || '', Validators.required],
            description: [lov?.description || ''],
            status: [lov?.status ?? 'active']
        };

        this.selectedLovRelations.forEach(col => {
            const parent = lov?.parents?.find((item: any) => item.type === col.parentLovKey);
            group[col.formKey] = [parent ? parent.code : '', Validators.required];
        });
        this.form = this.fb.group(group);
    }

    prefillParentContext(): void {
        const ctx = this.currentParentContext();
        if (!ctx || !this.form) return;

        const matchingCol = this.selectedLovRelations.find((col: any) => col.parentLovKey === ctx.type);
        if (matchingCol) {
            this.form.get(matchingCol.formKey)?.setValue(ctx.code);
        }
    }

    resetForm(): void {
        this.isEditMode = false;
        this.selectedLov.set(null);
        this.form.reset({type: this.currentLovType(), status: 'active'});
        this.form.get('code')?.enable();
        this.prefillParentContext();
    }

    getLovValueOptions(): void {
        const type = this.currentLovType();
        if (!type) return;

        const ctx = this.currentParentContext();
        const search = this.searchQuery().trim();
        const page = this.pageQuery();
        const limit = 10;

        let url: string;
        let params: any = {page, limit};

        if (ctx) {
            // We have a parent → use dedicated Children endpoint
            url = `${LOV_API_URL}/${ctx.type}/${ctx.code}/children`;
            params.childType = type;           // important: tell backend which child type we want
            if (search) params.search = search;
        } else {
            // Top level → normal list by type
            url = `${GET_LOV_BY_TYPE_API_URL}${type}`;
            if (search) params.search = search;
        }

        this.requestService.getRequest(url, params).subscribe({
            next: (res: HttpResponse<any>) => {
                if (res.status === 200) {
                    const data = ctx ? (res.body?.data?.grouped?.[type] || []) : (res.body?.data || []);

                    this.lovOptions.update(current => ({
                        ...current,
                        [type]: data
                    }));

                    if (ctx) {
                        this.pagination.set({
                            total: res.body?.data?.total || data.length,
                            totalPages: 1,
                            page: 1,
                            hasNextPage: false,
                            hasPrevPage: false
                        });
                    } else {
                        this.pagination.set(res.body.meta?.pagination || null);
                    }
                }
            },
            error: () => this.pagination.set(null)
        });
    }

    openAddModal(): void {
        if (!this.currentLovType()) {
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
        this.selectedLov.set(lov);
        this.closeViewModal();
        this.isEditMode = true;
        this.buildForm();
        this.form.patchValue({
            type: this.currentLovType(),
            code: lov?.code,
            name: lov?.name,
            description: lov?.description || '',
            status: lov?.status
        });
        this.form.get('code')?.disable();
        this.getParentLOVs();
        this.showAddModal.set(true);
    }

    closeAddModal(): void {
        this.showAddModal.set(false);
        this.resetForm();
    }

    closeViewModal(): void {
        this.showViewModal.set(false);
    }

    updateLovName(): void {
        this.lovName = this.breadcrumbItems().at(-1)?.name as string || '';
    }

    setTableColumns(): void {
        const selectedType = this.lovTypes().find(t => t.key === this.currentLovType());
        this.selectedLovRelations = selectedType?.childMeta || [];
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
            error: (err) => console.error('Failed to load parent Data references.', err)
        });
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
                    this.isEditMode ? 'LOV updated successfully!' : 'LOV added successfully!',
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

    openDelete(lov: LOV): void {
        this.selectedLov.set(lov);
        this.showDeleteModal.set(true);
    }

    confirmDelete(): void {
        const lov = this.selectedLov();
        if (!lov) return;

        this.requestService.deleteRequest(`${DELETE_LOV_API_URL}/${lov._id}`).subscribe({
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

    closeDeleteModal(): void {
        this.showDeleteModal.set(false);
        this.selectedLov.set(null);
    }

    getErrorMsg(controlName: string, index?: number, field?: string) {
        return getError(this.form, controlName, {
            index,
            field
        });
    }
}
