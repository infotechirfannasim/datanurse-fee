import {Component, inject, OnInit, signal} from '@angular/core';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule, NgClass} from '@angular/common';
import {ToastService} from '../../core/services/toast.service';
import {RequestService} from '../../core/services/request.service';
import {DELETE_USER_API_URL, PATIENTS_API_URL} from '../../utils/api.url.constants';
import {HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {FilterParams} from '../../core/models/user.model';
import {MultiSelectModule} from 'primeng/multiselect';
import {SelectModule} from 'primeng/select';
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from 'rxjs';
import {getUserInitials} from '../../utils/global.utils';
import {PatientDTO} from "../../core/models/patient.model";
import {CaseDetailDTO} from "../../core/models/case.model";

@Component({
    selector: 'app-cases',
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, CommonModule, NgClass, MultiSelectModule, SelectModule],
    templateUrl: './patient.component.html',
    styleUrl: './patient.component.scss'
})
export class PatientComponent implements OnInit {

    private toastService = inject(ToastService);
    private requestService = inject(RequestService);

    searchQuery = signal('');
    pageQuery = signal(1);
    pagination = signal<any>(null);
    showAddModal = signal(false);
    showViewModal = signal(false);
    showDeleteModal = signal(false);
    activeTab = signal<'overview' | 'cases' | 'case-detail'>('overview');
    selectedCase = signal<any | null>(null);
    selectedIndex: number | null = null
    selectedPatient = signal<any | null>(null);
    isEditMode = false;
    doctorForm!: FormGroup;
    patients: PatientDTO[] = [];
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    protected readonly getUserInitials = getUserInitials;

    // ────────────────────────────────────────────
    // Lifecycle
    // ────────────────────────────────────────────

    ngOnInit(): void {
        this.loadPatients();
        this.setupSearchDebounce();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ────────────────────────────────────────────
    // Search
    // ────────────────────────────────────────────

    setupSearchDebounce(): void {
        this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.pageQuery.set(1);
            this.loadPatients();
        });
    }

    onSearchChange(): void {
        this.searchSubject.next(this.searchQuery().toLowerCase());
    }

    // ────────────────────────────────────────────
    // Data Loading
    // ────────────────────────────────────────────

    loadPatients(): void {
        const filters: FilterParams = {
            search: this.searchQuery().toLowerCase() || '',
            page: this.pageQuery(),
            limit: 10
        };

        this.requestService.getRequest(PATIENTS_API_URL, filters).subscribe({
            next: (response: HttpResponse<any>) => {
                if (response.status === 200 && response.body.data) {
                    this.patients = response.body.data ?? [];
                    this.pagination.set(response.body.meta?.pagination || null);
                } else {
                    this.patients = [];
                    this.pagination.set(null);
                }
            },
            error: () => {
                this.patients = [];
                this.pagination.set(null);
            }
        });
    }

    // ────────────────────────────────────────────
    // Modal Actions
    // ────────────────────────────────────────────

    /**
     * Opens the patient view modal.
     * Fetches full patient data (including all cases) from API.
     * Resets tab to 'overview' and clears any previously selected case.
     */
    openView(patient: any): void {
        this.requestService.getRequest(`${PATIENTS_API_URL}/${patient._id}`).subscribe({
            next: (res: HttpResponse<any>) => {
                if (res.status === 200) {
                    const patientDTO = new PatientDTO();
                    const data : any = res.body.data;
                    this.selectedPatient.set(data);
                    this.selectedCase.set(null);
                    this.activeTab.set('overview');
                    this.showViewModal.set(true);
                } else {
                    this.toastService.show(res.body.message || 'Something went wrong', 'info');
                }
            },
            error: (err: HttpErrorResponse) => {
                this.toastService.show(err.error?.message || err.message || 'Something went wrong', 'error');
            }
        });
    }

    /**
     * Called when user clicks a case row inside the Cases tab.
     * Sets the selected case and switches to Case Detail tab.
     */
    selectCaseFromTab(caseItem: any, index: number): void {
        this.selectedCase.set(caseItem);
        this.selectedIndex = index;
        this.activeTab.set('case-detail');
    }

    /**
     * Called from anywhere to open a specific case detail.
     * Also ensures the view modal is open.
     */
    openCaseDetail(caseItem: any): void {
        this.selectedCase.set(caseItem);
        this.activeTab.set('case-detail');
        if (!this.showViewModal()) {
            this.showViewModal.set(true);
        }
    }

    /**
     * Closes the view modal and resets all related state.
     */
    closeViewModal(): void {
        this.showViewModal.set(false);
        this.selectedPatient.set(null);
        this.selectedCase.set(null);
        this.activeTab.set('overview');
    }

    // ────────────────────────────────────────────
    // Delete
    // ────────────────────────────────────────────

    confirmDelete(): void {
        if (!this.selectedPatient()) return;

        this.requestService.deleteRequest(DELETE_USER_API_URL + this.selectedPatient()?._id).subscribe({
            next: () => {
                this.toastService.show('Patient deleted successfully', 'error');
                this.showDeleteModal.set(false);
                this.selectedPatient.set(null);
                this.loadPatients();
            },
            error: (err) => {
                this.toastService.show(err.error?.message || 'Failed to remove patient', 'error');
            }
        });
    }

    // ────────────────────────────────────────────
    // Pagination
    // ────────────────────────────────────────────

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

    // ────────────────────────────────────────────
    // CSS Class Helpers
    // ────────────────────────────────────────────

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
        const lower = status.toLowerCase();
        if (lower.includes('alive') || lower.includes('home') || lower.includes('discharged')) {
            return 'cd-discharge-row--alive';
        }
        return 'cd-discharge-row--deceased';
    }

    // ────────────────────────────────────────────
    // Display Helpers
    // ────────────────────────────────────────────

    getSurgeonInitials(name: string): string {
        if (!name) return '?';
        const parts = name.trim().replace(/^Dr\.?\s*/i, '').split(' ').filter(Boolean);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return '?';
    }

    getProfileImageUrl(doc: any): string | null {
        if (!doc?.profileImage?.data || !doc?.profileImage?.contentType) return null;
        return `data:${doc.profileImage.contentType};base64,${doc.profileImage.data}`;
    }

    /**
     * Returns keys of an object where value is truthy (true / 1).
     * Used for object-style boolean fields:
     *   e.g. RegAnesSite: { "Thoracic Epidural Catheter": true }
     *     => ["Thoracic Epidural Catheter"]
     */
    getObjectKeys(obj: Record<string, any> | null | undefined): string[] {
        if (!obj) return [];
        return Object.keys(obj).filter(k => obj[k] === true || obj[k] === 1);
    }

    // ────────────────────────────────────────────
    // Misc / Legacy
    // ────────────────────────────────────────────

    hasObjectKeys(obj: any): boolean {
        return obj && typeof obj === 'object' && Object.keys(obj).length > 0;
    }

    getPillClass(status: string | null | undefined): string {
        if (!status) return '';
        const map: Record<string, string> = {
            'Completed': 'pill-completed',
            'Recovered': 'pill-completed',
            'Active': 'pill-active',
            'Salvage': 'pill-salvage',
            'Critical': 'pill-critical',
            'Pending': 'pill-pending',
        };
        return map[status] ?? 'pill-pending';
    }

    getCasePercentage(stage: 'draft' | 'assistant_done' | 'kpo_done' | 'doctor_review_done' | 'final' | undefined ): number {
        if (!stage) return 0;
        const map: Record<string, number> = {
            'draft': 25,
            'assistant_done': 50,
            'kpo_done': 75,
            'doctor_review_done': 100,
            'final': 100,
        };
        return map[stage] ?? 0;
    }

    protected readonly Boolean = Boolean;
}
