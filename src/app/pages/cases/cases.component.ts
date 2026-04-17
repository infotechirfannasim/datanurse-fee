import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';

import { ToastService } from '../../core/services/toast.service';
import { RequestService } from '../../core/services/request.service';
import { ADD_FOLLOW_UP_API_URL, CASES_API_URL, GET_LOV_BULK_API_URL } from '../../utils/api.url.constants';
import { FilterParams } from '../../core/models/user.model';
import { getError, getUserInitials } from '../../utils/global.utils';
import { RegexConstants } from '../../utils/regex-constants';
import {AppConstants, CASE_STAUSES, PATIENT_STATUS} from '../../utils/app-constants';

import { RawCase } from '../../core/models/case-raw-type.model';
import { LovStore } from '../../core/models/lov.types.model';
import { CaseDetailDto, CaseListItemDto, DisplayFollowup } from '../../core/models/case.model';
import { mapToCaseDetailDto } from '../../core/mapper/case-detail.mapper';
import { mapToCaseListItemDto } from '../../core/mapper/case-detail.mapper'; // same file

const LIST_LOV_TYPES  = ['gender', 'bloodGroup', 'status'];

@Component({
    selector: 'app-cases',
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, CommonModule, MultiSelectModule, SelectModule],
    templateUrl: './cases.component.html',
    styleUrl: './cases.component.scss',
})
export class CasesComponent implements OnInit, OnDestroy {

    // ── services ────────────────────────────────────────────────
    private readonly toastService   = inject(ToastService);
    private readonly requestService = inject(RequestService);
    private readonly fb             = inject(FormBuilder);

    // ── UI state ────────────────────────────────────────────────
    searchQuery  = signal('');
    pageQuery    = signal(1);
    pagination   = signal<any>(null);
    loading      = signal(false);
    detailLoading = signal(false);

    showViewModal      = signal(false);
    showFollowupModal  = signal(false);

    // ── LOV store — loaded once, shared across list + detail ────
    private readonly _lovStore = signal<LovStore>({});

    // ── list data — mapped to CaseListItemDto[] ─────────────────
    cases = signal<CaseListItemDto[]>([]);

    // ── detail — raw + computed DTO ─────────────────────────────
    private readonly _rawCase = signal<RawCase | null>(null);

    readonly caseDto = computed<CaseDetailDto | null>(() => {
        const raw = this._rawCase();
        if (!raw) return null;
        return mapToCaseDetailDto(raw, this._lovStore());
    });

    private _followupCaseId     = '';
    private _followupPatientId  = '';
    private _followupDoctorId   = '';

    followupForm!: FormGroup;
    private readonly searchSubject = new Subject<string>();
    private readonly destroy$      = new Subject<void>();
    readonly errorMessages = {
        causeOfDeath: {
            required:  'Cause of death is required',
            pattern:   "Only letters, numbers and ,' - _ * & + . / ( ) are allowed.",
            maxlength: 'Max 50 characters',
            minlength: 'Min 3 characters',
        },
        notes: {
            maxlength: 'Max 500 characters',
            pattern:   "Only letters, numbers and ,' - _ * & + . / ( ) are allowed.",
        },
        readmissionReason: {
            maxlength: 'Max 500 characters',
            pattern:   "Only letters, numbers and ,' - _ * & + . / ( ) are allowed.",
        },
    };

    ngOnInit(): void {
        this.loadLovs();         // load LOVs first so list renders with resolved names
        this.initFollowupForm();
        this.setupSearchDebounce();
        this.loadCases();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ────────────────────────────────────────────────────────────
    // LOV loading
    // ────────────────────────────────────────────────────────────

    /**
     * Loads LOV types needed for the list view.
     * Detail LOVs are loaded lazily when a case is opened.
     */
    private loadLovs(): void {
        this.requestService
            .postRequest(GET_LOV_BULK_API_URL, { types: LIST_LOV_TYPES })
            .subscribe({
                next: (response: HttpResponse<any>) => {
                    if (response.status === 200 && response.body?.data) {
                        // Merge into existing store — safe to call multiple times
                        this._lovStore.update((current) => ({
                            ...current,
                            ...response.body.data,
                        }));
                    }
                },
                error: (err: HttpErrorResponse) => {
                    // Non-fatal — list still works, just shows raw codes
                    console.warn('LOV load failed:', err.message);
                },
            });
    }

    private loadDetailLovs(): void {
        const current = this._lovStore();
        const missing = AppConstants.LOV_KEYS.filter((t) => !current[t]?.length);
        if (!missing.length) return;

        this.requestService
            .postRequest(GET_LOV_BULK_API_URL, { types: missing })
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
    // List
    // ────────────────────────────────────────────────────────────

    loadCases(): void {
        this.loading.set(true);

        const filters: FilterParams = {
            search: this.searchQuery() || '',
            page:   this.pageQuery(),
            limit:  10,
        };

        this.requestService.getRequest(CASES_API_URL, filters).subscribe({
            next: (response: HttpResponse<any>) => {
                this.loading.set(false);
                if (response.status === 200 && response.body?.data) {
                    this.cases.set(
                        (response.body.data as RawCase[]).map((raw) =>
                            mapToCaseListItemDto(raw, this._lovStore())
                        )
                    );
                    this.pagination.set(response.body.meta?.pagination ?? null);
                } else {
                    this.cases.set([]);
                    this.pagination.set(null);
                }
            },
            error: () => {
                this.loading.set(false);
                this.cases.set([]);
                this.pagination.set(null);
            },
        });
    }

    openView(record: CaseListItemDto): void {
        this.detailLoading.set(true);
        this.loadDetailLovs();

        this.requestService
            .getRequest(`${CASES_API_URL}/${record.id}`)
            .subscribe({
                next: (res: HttpResponse<any>) => {
                    this.detailLoading.set(false);
                    if (res.status === 200 && res.body?.data) {
                        this._rawCase.set(res.body.data as RawCase);
                        this.showViewModal.set(true);
                    } else {
                        this.toastService.show(res.body?.message ?? 'Something went wrong', 'warning');
                    }
                },
                error: (err: HttpErrorResponse) => {
                    this.detailLoading.set(false);
                    this.toastService.show(
                        err.error?.message ?? err.message ?? 'Something went wrong',
                        'error'
                    );
                },
            });
    }

    openFollowupModal() {
        const raw = this._rawCase();
        if (!raw) return;

        // Capture raw IDs for the payload — DTO only has display values
        this._followupCaseId    = raw._id;
        this._followupPatientId = raw.patientId?._id ?? '';
        this._followupDoctorId  = raw.ownerDoctorId?._id ?? '';

        this.followupForm.reset({
            followupDate:        new Date().toISOString().split('T')[0],
            patientStatus:       PATIENT_STATUS.ALIVE,
            causeOfDeath:        '',
            readmissionRequested: false,
            readmissionReason:   '',
            readmissionDate:     null,
            notes:               '',
        });

        this.showFollowupModal.set(true);
    }

    saveFollowup(): void {
        if (this.followupForm.invalid) {
            this.followupForm.markAllAsTouched();
            return;
        }

        const form   = this.followupForm.getRawValue();
        const isAlive    = form.patientStatus === PATIENT_STATUS.ALIVE;
        const isDeceased = form.patientStatus === PATIENT_STATUS.DECEASED;

        const payload: Record<string, unknown> = {
            caseId:       this._followupCaseId,
            patientId:    this._followupPatientId,
            doctorId:     this._followupDoctorId,
            followupDate: form.followupDate,
            patientStatus: form.patientStatus,
            notes:        form.notes ?? '',
        };

        if (isDeceased) {
            payload['causeOfDeath'] = form.causeOfDeath;
        }

        if (isAlive) {
            payload['readmissionRequested'] = form.readmissionRequested;
            if (form.readmissionRequested) {
                payload['readmissionReason'] = form.readmissionReason;
                payload['readmissionDate']   = form.readmissionDate;
            }
        } else {
            payload['readmissionRequested'] = false;
        }

        this.requestService.postRequest(ADD_FOLLOW_UP_API_URL, payload).subscribe({
            next: (resp: HttpResponse<any>) => {
                if (resp.status === 200) {
                    this.toastService.show('Follow-up saved successfully', 'success');
                    this.showFollowupModal.set(false);

                    // Patch the raw case signal so caseDto() re-computes with the new followup
                    const newFollowup = resp.body?.data;
                    if (newFollowup) {
                        this._rawCase.update((raw) => {
                            if (!raw) return raw;
                            return {
                                ...raw,
                                followups: [...(raw.followups ?? []), newFollowup],
                            };
                        });
                    }

                    this.loadCases(); // refresh list
                }
            },
            error: (err: HttpErrorResponse) => {
                this.toastService.show(
                    err.error?.message ?? err.message ?? 'Failed to save follow-up',
                    'error'
                );
            },
        });
    }

    canAddFollowup(): boolean {
        const dto = this.caseDto();
        if (!dto) return false;

        // Must have a discharge date
        const dischargeDate = dto.discharge.dischargeDate; // string | null
        if (!dischargeDate) return false;

        // Must be >= 30 days since discharge
        const discharge = new Date(dischargeDate);
        const today     = new Date();
        const diffDays  = Math.ceil(
            (today.getTime() - discharge.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays < 30) return false;

        // No existing follow-ups
        return dto.followups.length === 0;
    }

    private initFollowupForm(): void {
        this.followupForm = this.fb.group({
            followupDate:         [new Date().toISOString().split('T')[0], Validators.required],
            patientStatus:        [PATIENT_STATUS.ALIVE, Validators.required],
            causeOfDeath:         [''],
            readmissionRequested: [false],
            readmissionReason:    ['', [Validators.maxLength(500), Validators.pattern(RegexConstants.NAME_SPECIAL_REGEX)]],
            readmissionDate:      [null],
            notes:                ['', [Validators.maxLength(500), Validators.pattern(RegexConstants.NAME_SPECIAL_REGEX)]],
        });

        // patientStatus changes
        this.followupForm.get('patientStatus')?.valueChanges.subscribe((status) => {
            const causeCtrl       = this.followupForm.get('causeOfDeath');
            const readmissionCtrl = this.followupForm.get('readmissionRequested');

            if (status === PATIENT_STATUS.DECEASED) {
                causeCtrl?.setValidators([
                    Validators.required,
                    Validators.minLength(3),
                    Validators.maxLength(50),
                    Validators.pattern(RegexConstants.NAME_SPECIAL_REGEX),
                ]);
                readmissionCtrl?.setValue(false);
                readmissionCtrl?.disable();
            } else {
                causeCtrl?.clearValidators();
                readmissionCtrl?.enable();
            }
            causeCtrl?.updateValueAndValidity();
        });

        // readmissionRequested changes
        this.followupForm.get('readmissionRequested')?.valueChanges.subscribe((value) => {
            const dateCtrl = this.followupForm.get('readmissionDate');
            if (value) {
                dateCtrl?.setValidators(Validators.required);
            } else {
                dateCtrl?.clearValidators();
                dateCtrl?.setValue(null);
            }
            dateCtrl?.updateValueAndValidity();
        });
    }

    private setupSearchDebounce(): void {
        this.searchSubject
            .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
            .subscribe(() => {
                this.pageQuery.set(1); // reset to page 1 on new search
                this.loadCases();
            });
    }

    onSearchChange(): void {
        this.searchSubject.next(this.searchQuery());
    }

    goToPage(page: number): void {
        const p = this.pagination();
        if (!p || page < 1 || page > p.totalPages) return;
        this.pageQuery.set(page);
        this.loadCases();
    }

    getPages(): number[] {
        const p = this.pagination();
        if (!p) return [];
        return Array.from({ length: p.totalPages }, (_, i) => i + 1);
    }

    getCaseStatusClass(code: string): string {
        const map: Record<string, string> = {
            reviewed:  'status-reviewed',
            pending:   'status-pending',
            submitted: 'status-submitted',
            draft:     'status-draft',
        };
        return map[code?.toLowerCase()] ?? 'status-pending';
    }

    getDischargeClass(code: string): string {
        switch (code) {
            case PATIENT_STATUS.ALIVE:    return 'cd-discharge-row--alive';
            case PATIENT_STATUS.DECEASED: return 'cd-discharge-row--deceased';
            default:                      return 'cd-discharge-row--unknown';
        }
    }

    getOperationStatusClass(code: string): string {
        const map: Record<string, string> = {
            E11: 'op-status--emergency',
            E12: 'op-status--urgent',
            E13: 'op-status--elective',
        };
        return map[code] ?? 'op-status--default';
    }

    getStatusLabel(code: string): string {
        const status = Object.values(CASE_STAUSES).find((s:any) => s.key === code || s.value === code);
        return status?.label || code;
    }

    getErrorMsg(controlName: string, index?: number, field?: string): string {
        return getError(this.followupForm, controlName, {
            index,
            field,
            customMessages: this.errorMessages,
        });
    }

    getProfileImageUrl(doc: any): string | null {
        if (!doc?.profileImage?.data || !doc?.profileImage?.contentType) return null;
        return `data:${doc.profileImage.contentType};base64,${doc.profileImage.data}`;
    }

    protected readonly getUserInitials = getUserInitials;
    protected readonly PATIENT_STATUS  = PATIENT_STATUS;
}
