import {Component, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {ToastService} from '../../core/services/toast.service';
import {RequestService} from "../../core/services/request.service";
import {ADD_FOLLOW_UP_API_URL, CASES_API_URL} from "../../utils/api.url.constants";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {FilterParams} from "../../core/models/user.model";
import {MultiSelectModule} from "primeng/multiselect";
import {SelectModule} from "primeng/select";
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from "rxjs";
import {getError, getUserInitials} from "../../utils/global.utils";
import {CaseDetailDTO, CaseListDTO} from "../../core/models/case.model";
import {PATIENT_STATUS} from "../../utils/app-constants";
import {RegexConstants} from "../../utils/regex-constants";

@Component({
    selector: 'app-cases',
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, CommonModule, MultiSelectModule, SelectModule],
    templateUrl: './cases.component.html',
    styleUrl: './cases.component.scss'
})
export class CasesComponent implements OnInit {
    private toastService = inject(ToastService);
    private fb = inject(FormBuilder);

    searchQuery = signal('');
    pageQuery = signal(1);
    pagination = signal<any>(null);
    showAddModal = signal(false);
    showViewModal = signal(false);
    showDeleteModal = signal(false);
    showFollowupModal = signal(false);
    selectedCaseForFollowup = signal<any>(null);

    followupForm!: FormGroup;
    cases: CaseListDTO[] = [];
    selectedCase = signal<CaseDetailDTO>(new CaseDetailDTO());
    private requestService = inject(RequestService);
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();
    errorMessages = {
        causeOfDeath: {
            required: 'Cause of death is required',
            pattern: "Only letters, numbers and ,' - _ * & + . / ( ) are allowed.",
            maxLength: 'Max 50 characters',
            minLength: 'Max 3 characters'
        },
        notes: {
            maxlength: 'Max 500 characters',
            pattern: "Only letters, numbers and ,' - _ * & + . / ( ) are allowed.",
        },
        readmissionReason: {
            maxlength: 'Max 500 characters',
            pattern: "Only letters, numbers and ,' - _ * & + . / ( ) are allowed.",
        }
    };

    constructor() {
    }

    ngOnInit() {
        this.loadCases();
        this.initFollowupForm();
        this.setupSearchDebounce();
    }

    setupSearchDebounce() {
        this.searchSubject
            .pipe(
                debounceTime(500),
                distinctUntilChanged(),
                takeUntil(this.destroy$),
            )
            .subscribe(() => {
                this.loadCases();
            });
    }

    initFollowupForm() {
        this.followupForm = this.fb.group({
            followupDate: [new Date(), Validators.required],
            patientStatus: [PATIENT_STATUS.ALIVE, Validators.required],
            causeOfDeath: [''],
            readmissionRequested: [false],
            readmissionReason: ['', [Validators.maxLength(500), Validators.pattern(RegexConstants.NAME_SPECIAL_REGEX)]],
            readmissionDate: [null],
            notes: ['', [Validators.maxLength(500), Validators.pattern(RegexConstants.NAME_SPECIAL_REGEX)]]
        });

        this.followupForm.get('patientStatus')?.valueChanges.subscribe(status => {
            const causeCtrl = this.followupForm.get('causeOfDeath');
            const readmissionCtrl = this.followupForm.get('readmissionRequested');

            if (status === PATIENT_STATUS.DECEASED) {
                causeCtrl?.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(RegexConstants.NAME_SPECIAL_REGEX)]);
                readmissionCtrl?.setValue(false);
                readmissionCtrl?.disable();
            } else {
                causeCtrl?.clearValidators();
                readmissionCtrl?.enable();
            }
            causeCtrl?.updateValueAndValidity();
        });
        this.followupForm.get('readmissionRequested')?.valueChanges.subscribe(value => {
            const readmissionCntrl = this.followupForm.get('readmissionDate');
            if (value) {
                readmissionCntrl?.setValidators(Validators.required);
            } else {
                readmissionCntrl?.clearValidators();
                readmissionCntrl?.setValue(null);
            }
            readmissionCntrl?.updateValueAndValidity();
        });
    }

    onSearchChange() {
        this.searchSubject.next(this.searchQuery().toLowerCase());
    }

    loadCases() {
        const filters: FilterParams = {
            search: this.searchQuery().toLowerCase() || '',
            page: this.pageQuery(),
            limit: 10
        };

        this.requestService.getRequest(CASES_API_URL, filters).subscribe({
            next: (response: HttpResponse<any>) => {
                if (response.status === 200 && response.body.data) {
                    this.cases = CaseListDTO.fromArray(response.body.data);
                    this.pagination.set(response.body.meta?.pagination || null);
                } else {
                    this.cases = [];
                    this.pagination.set(null);
                }
            },
            error: () => {
                this.cases = [];
                this.pagination.set(null);
            },
        });
    }

    openView(record: any): void {
        this.requestService
            .getRequest(`${CASES_API_URL}/${record._id}`)
            .subscribe({
                next: (res: HttpResponse<any>) => {
                    if (res.status === 200) {
                        const data: any = res.body.data;
                        this.selectedCase.set(data)
                        this.showViewModal.set(true);
                    } else {
                        const msg = res.body.message || 'Something went wrong'
                        this.toastService.show(msg, 'warning');
                    }
                },
                error: (err: HttpErrorResponse) => {
                    const errMsg = err.error.message || err.message || 'Something went wrong'
                    this.toastService.show(errMsg, 'error');
                }
            });
    }


    getCaseStatusClass(status: string | null | undefined): string {
        if (!status) return '';
        const map: Record<string, string> = {
            'Salvage': 'status-salvage',
            'Completed': 'status-completed',
            'Active': 'status-active',
            'Pending': 'status-pending',
            'Critical': 'status-critical',
            'Recovered': 'status-completed',
        };
        return map[status] ?? 'status-pending';
    }

    getDischargeClass(status: string | null | undefined): string {
        if (!status) return 'cd-discharge-row--deceased';
        switch (status){
            case PATIENT_STATUS.ALIVE:
                return 'cd-discharge-row--alive'
            case PATIENT_STATUS.DECEASED:
                return 'cd-discharge-row--deceased'
            case PATIENT_STATUS.UNKNOWN:
                return 'cd-discharge-row--unknown'
        }
        return '';
    }


    goToPage(page: number) {
        const p = this.pagination();
        if (!p || page < 1 || page > p.totalPages) return;
        this.pageQuery.set(page);
        this.loadCases();
    }

    getPages(): number[] {
        const p = this.pagination();
        if (!p) return [];
        return Array.from({length: p.totalPages}, (_, i) => i + 1);
    }

    getProfileImageUrl(doc: any): string | null {
        if (!doc?.profileImage?.data || !doc?.profileImage?.contentType) return null;
        return `data:${doc.profileImage.contentType};base64,${doc.profileImage.data}`;
    }

    openFollowupModal(caseItem: CaseDetailDTO) {
        this.selectedCaseForFollowup.set(caseItem);
        this.followupForm.reset({
            followupDate: new Date().toISOString().split('T')[0],
            patientStatus: 'Alive',
            readmissionRequested: false
        });

        this.showFollowupModal.set(true);
    }

    saveFollowup() {
        if (this.followupForm.invalid) {
            this.followupForm.markAllAsTouched();
            return;
        }

        const formValue = this.followupForm.getRawValue();
        const selectedCase = this.selectedCaseForFollowup();

        let payload: any = {
            caseId: selectedCase._id,
            patientId: selectedCase.patientId?._id || selectedCase.patientId,
            doctorId: selectedCase.ownerDoctorId?._id || selectedCase.ownerDoctorId,
            followupDate: formValue.followupDate,
            patientStatus: formValue.patientStatus,
            notes: formValue.notes || ''
        };

        if (formValue.patientStatus === PATIENT_STATUS.DECEASED) {
            payload.causeOfDeath = formValue.causeOfDeath;
        }

        if (formValue.patientStatus === PATIENT_STATUS.ALIVE && formValue.readmissionRequested) {
            payload.readmissionRequested = true;
            payload.readmissionReason = formValue.readmissionReason;
            if (formValue.readmissionRequested) {
                payload.readmissionDate = formValue.readmissionDate;
            }
        } else {
            payload.readmissionRequested = false;
        }

        this.requestService.postRequest(ADD_FOLLOW_UP_API_URL, payload).subscribe({
            next: (resp: HttpResponse<any>) => {
                if(resp.status == 200) {
                    this.toastService.show('Follow-up saved successfully', 'success');
                    this.selectedCase().followups.push(resp.body.data);
                    this.showFollowupModal.set(false);
                    this.loadCases();
                }
            },
            error: (err: HttpErrorResponse) => {
                const errMsg = err.error.message || err.message || 'Failed to create followup';
                this.toastService.show(errMsg, 'error');
            }
        });
    }

    canAddFollowup(caseItem: CaseDetailDTO): boolean {
        if (!caseItem?.step15Discharge?.dischargeDate) return false;

        const discharge = new Date(caseItem.step15Discharge.dischargeDate);
        const today = new Date();
        const diffDays = Math.ceil((today.getTime() - discharge.getTime()) / (1000 * 3600 * 24));

        return diffDays >= 30 && caseItem.followups.length == 0;
    }

    getErrorMsg(controlName: string, index?: number, field?: string) {
        return getError(this.followupForm, controlName, {
            index,
            field,
            customMessages: this.errorMessages
        });
    }

    getObjectKeys(obj: any): string[] {
        if (!obj || typeof obj !== 'object') return [];
        return Object.keys(obj).filter(k => obj[k] === true);
    }

    hasObjectKeys(obj: any): boolean {
        return this.getObjectKeys(obj).length > 0;
    }

    protected readonly getUserInitials = getUserInitials;
    protected readonly PATIENT_STATUS = PATIENT_STATUS;
    protected readonly Boolean = Boolean;
    protected readonly Object = Object;
}
