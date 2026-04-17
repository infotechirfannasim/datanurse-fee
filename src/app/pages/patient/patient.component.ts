import {Component, computed, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule, NgClass} from '@angular/common';
import {HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from 'rxjs';
import {MultiSelectModule} from 'primeng/multiselect';
import {SelectModule} from 'primeng/select';

import {ToastService} from '../../core/services/toast.service';
import {RequestService} from '../../core/services/request.service';
import {DELETE_USER_API_URL, GET_LOV_BULK_API_URL, PATIENTS_API_URL} from '../../utils/api.url.constants';
import {FilterParams} from '../../core/models/user.model';
import {getUserInitials} from '../../utils/global.utils';

import {RawCase, RawPatientListItem, RawPatientWithCases} from '../../core/models/case-raw-type.model';
import {LovStore} from '../../core/models/lov.types.model';
import {CaseDetailDto, PatientDetailDto, PatientListItemDto} from '../../core/models/case.model';
import {mapToCaseDetailDto, mapToPatientDetailDto, mapToPatientList} from '../../core/mapper/case-detail.mapper';
import {AppConstants, CASE_STAUSES} from "../../utils/app-constants";

// LOV types needed for patient pages
const PATIENT_LOV_TYPES = ['gender', 'bloodGroup', 'country', 'province', 'city', 'funding'];

@Component({
    selector: 'app-patients',
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, CommonModule, NgClass, MultiSelectModule, SelectModule],
    templateUrl: './patient.component.html',
    styleUrl: './patient.component.scss',
})
export class PatientComponent implements OnInit, OnDestroy {

    private readonly toastService = inject(ToastService);
    private readonly requestService = inject(RequestService);

    // ── UI state ────────────────────────────────────────────────
    searchQuery = signal('');
    pageQuery = signal(1);
    pagination = signal<any>(null);
    showViewModal = signal(false);
    activeTab = signal<'overview' | 'cases' | 'case-detail'>('overview');
    loading = signal(false);

    // ── LOV store ───────────────────────────────────────────────
    private readonly _lovStore = signal<LovStore>({});

    // ── List: PatientListItemDto[] ──────────────────────────────
    patients = signal<PatientListItemDto[]>([]);

    // ── Detail: raw → mapped ────────────────────────────────────
    private readonly _rawDetail = signal<RawPatientWithCases | null>(null);

    // Computed DTO — re-runs when raw data or LOVs change
    readonly patientDto = signal<PatientDetailDto | null>(null);

    // ── Selected case (raw) inside the detail modal ─────────────
    // Kept as raw so we can access every field in the template
    // without needing a second detail API call.
    private readonly _rawCase = signal<RawCase | null>(null);
    readonly caseDto = computed<CaseDetailDto | null>(() => {
        const raw = this._rawCase();
        if (!raw) return null;
        return mapToCaseDetailDto(raw, this._lovStore());
    });
    selectedIndex: number | null = null;

    private readonly searchSubject = new Subject<string>();
    private readonly destroy$ = new Subject<void>();

    protected readonly getUserInitials = getUserInitials;

    // ────────────────────────────────────────────────────────────
    // Lifecycle
    // ────────────────────────────────────────────────────────────

    ngOnInit(): void {
        this.loadLovs();
        this.setupSearchDebounce();
        this.loadPatients();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ────────────────────────────────────────────────────────────
    // LOVs
    // ────────────────────────────────────────────────────────────

    private loadLovs(): void {
        this.requestService
            .postRequest(GET_LOV_BULK_API_URL, {types: PATIENT_LOV_TYPES})
            .subscribe({
                next: (res: HttpResponse<any>) => {
                    if (res.status === 200 && res.body?.data) {
                        this._lovStore.update((s) => ({...s, ...res.body.data}));
                    }
                },
                error: (err: HttpErrorResponse) => console.warn('LOV load failed', err.message),
            });
    }

    // ────────────────────────────────────────────────────────────
    // Search
    // ────────────────────────────────────────────────────────────

    private setupSearchDebounce(): void {
        this.searchSubject
            .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe(() => {
                this.pageQuery.set(1);
                this.loadPatients();
            });
    }

    onSearchChange(): void {
        this.searchSubject.next(this.searchQuery());
    }

    // ────────────────────────────────────────────────────────────
    // List
    // ────────────────────────────────────────────────────────────

    loadPatients(): void {
        this.loading.set(true);
        const filters: FilterParams = {
            search: this.searchQuery() || '',
            page: this.pageQuery(),
            limit: 10,
        };

        this.requestService.getRequest(PATIENTS_API_URL, filters).subscribe({
            next: (res: HttpResponse<any>) => {
                this.loading.set(false);
                if (res.status === 200 && res.body?.data) {
                    this.patients.set(
                        mapToPatientList(res.body.data as RawPatientListItem[], this._lovStore())
                    );
                    this.pagination.set(res.body.meta?.pagination ?? null);
                } else {
                    this.patients.set([]);
                    this.pagination.set(null);
                }
            },
            error: () => {
                this.loading.set(false);
                this.patients.set([]);
                this.pagination.set(null);
            },
        });
    }

    // ────────────────────────────────────────────────────────────
    // Detail modal
    // ────────────────────────────────────────────────────────────

    openView(patient: PatientListItemDto): void {
        this.loadDetailLovs();
        this.requestService
            .getRequest(`${PATIENTS_API_URL}/${patient.id}`)
            .subscribe({
                next: (res: HttpResponse<any>) => {
                    if (res.status === 200 && res.body?.data) {
                        const raw = res.body.data as RawPatientWithCases;
                        this._rawDetail.set(raw);
                        this.patientDto.set(mapToPatientDetailDto(raw, this._lovStore()));
                        this._rawCase.set(null);
                        this.activeTab.set('overview');
                        this.showViewModal.set(true);
                    } else {
                        this.toastService.show(res.body?.message ?? 'Something went wrong', 'info');
                    }
                },
                error: (err: HttpErrorResponse) => {
                    this.toastService.show(err.error?.message ?? err.message ?? 'Something went wrong', 'error');
                },
            });
    }

    closeViewModal(): void {
        this.showViewModal.set(false);
        this.patientDto.set(null);
        this._rawDetail.set(null);
        this._rawCase.set(null);
        this.activeTab.set('overview');
    }

    // ────────────────────────────────────────────────────────────
    // Case tab — uses raw cases from _rawDetail so all fields
    // are available in the case-detail tab without a second call
    // ────────────────────────────────────────────────────────────

    selectCaseFromTab(caseId: string, index: number): void {
        const raw = this._rawDetail();
        if (!raw?.cases) return;
        const rawCase = raw.cases.find((c) => c._id === caseId || c.caseId === caseId)
            ?? raw.cases[index];
        this._rawCase.set(rawCase as RawCase);
        this.selectedIndex = index;
        this.activeTab.set('case-detail');
    }

    private loadDetailLovs(): void {
        const current = this._lovStore();
        const missing = AppConstants.LOV_KEYS.filter((t) => !current[t]?.length);
        if (!missing.length) return; // all already loaded

        this.requestService
            .postRequest(GET_LOV_BULK_API_URL, {types: missing})
            .subscribe({
                next: (response: HttpResponse<any>) => {
                    if (response.status === 200 && response.body?.data) {
                        this._lovStore.update((current) => ({
                            ...current,
                            ...response.body.data,
                        }));
                        // caseDto computed() re-runs automatically because _lovStore changed
                    }
                },
                error: (err: HttpErrorResponse) => {
                    console.warn('Detail LOV load failed:', err.message);
                },
            });
    }

    // ────────────────────────────────────────────────────────────
    // Delete
    // ────────────────────────────────────────────────────────────

    confirmDelete(): void {
        const dto = this.patientDto();
        if (!dto) return;

        this.requestService.deleteRequest(`${DELETE_USER_API_URL}${dto.id}`).subscribe({
            next: () => {
                this.toastService.show('Patient deleted successfully', 'success');
                this.closeViewModal();
                this.loadPatients();
            },
            error: (err) => {
                this.toastService.show(err.error?.message ?? 'Failed to remove patient', 'error');
            },
        });
    }

    // ────────────────────────────────────────────────────────────
    // Pagination
    // ────────────────────────────────────────────────────────────

    goToPage(page: number): void {
        const p = this.pagination();
        if (!p || page < 1 || page > p.totalPages) return;
        this.pageQuery.set(page);
        this.loadPatients();
    }

    getPages(): number[] {
        const p = this.pagination();
        if (!p) return [];
        return Array.from({length: p.totalPages}, (_, i) => i + 1);
    }

    // ────────────────────────────────────────────────────────────
    // CSS class helpers
    // ────────────────────────────────────────────────────────────

    getCaseStatusClass(status: string | null | undefined): string {
        if (!status) return '';
        const map: Record<string, string> = {
            ELECTIVE: 'status-elective',
            EMERGENCY: 'status-emergency',
            URGENT: 'status-urgent',
            SALVAGE: 'status-salvage',
        };
        return map[status.toUpperCase()] ?? 'status-pending';
    }

    getDischargeClass(status: string | null | undefined): string {
        if (!status) return 'cd-discharge-row--unknown';
        const lower = status.toLowerCase();
        if (lower === 'alive' || lower.includes('home') || lower.includes('discharged')) {
            return 'cd-discharge-row--alive';
        }
        if (lower === 'deceased' || lower === 'dead') {
            return 'cd-discharge-row--deceased';
        }
        return 'cd-discharge-row--unknown';
    }

    getPillClass(code: string): string {
        const map: Record<string, string> = {
            ELECTIVE: 'pill-elective',
            EMERGENCY: 'pill-emergency',
            URGENT: 'pill-urgent',
            SALVAGE: 'pill-salvage',
        };
        return map[(code ?? '').toUpperCase()] ?? 'pill-pending';
    }

    getCasePercentage(stage: string): number {
        const map: Record<string, number> = {
            draft: 25,
            assistant_done: 50,
            kpo_done: 75,
            doctor_review_done: 100,
            final: 100,
        };
        return map[stage] ?? 0;
    }

    getSurgeonInitials(name: string): string {
        if (!name) return '?';
        const parts = name.trim().replace(/^Dr\.?\s*/i, '').split(' ').filter(Boolean);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return '?';
    }

    getProfileImageUrl(dto: PatientDetailDto | null): string | null {
        // Profile image lives on the raw doctor object inside cases[].ownerDoctorId
        const raw = this._rawDetail();
        const doc = raw?.cases?.[0]?.ownerDoctorId as any;
        if (!doc?.profileImage?.data || !doc?.profileImage?.contentType) return null;
        return `data:${doc.profileImage.contentType};base64,${doc.profileImage.data}`;
    }

    getStatusLabel(code: string): string {
        const status = Object.values(CASE_STAUSES).find((s:any) => s.key === code || s.value === code);
        return status?.label || code;
    }
}
