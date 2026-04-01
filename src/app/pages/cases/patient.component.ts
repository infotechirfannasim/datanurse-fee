import {Component, inject, OnInit, signal} from '@angular/core';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule, NgClass} from '@angular/common';
import {ToastService} from '../../core/services/toast.service';
import {Doctor} from '../../core/models/doctor.model';
import {RequestService} from "../../core/services/request.service";
import {DELETE_USER_API_URL, PATIENTS_API_URL} from "../../utils/api.url.constants";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {FilterParams} from "../../core/models/user.model";
import {MultiSelectModule} from "primeng/multiselect";
import {SelectModule} from "primeng/select";
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from "rxjs";

@Component({
    selector: 'app-cases',
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, CommonModule, MultiSelectModule, SelectModule],
    templateUrl: './patient.component.html',
    styleUrl: './patient.component.scss'
})
export class PatientComponent implements OnInit {
    private toastService = inject(ToastService);

    searchQuery = signal('');
    pageQuery = signal(1);
    pagination = signal<any>(null);
    showAddModal = signal(false);
    showViewModal = signal(false);
    showDeleteModal = signal(false);
    isEditMode: boolean = false;
    doctorForm!: FormGroup;
    patients: any[] = [];
    selectedPatient = signal<any | null>(null);
    private requestService = inject(RequestService);
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    constructor() {
    }

    ngOnInit() {
        this.loadPatients();
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
                this.loadPatients();
            });
    }

    onSearchChange() {
        this.searchSubject.next(this.searchQuery().toLowerCase());
    }

    loadPatients() {
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
            },
        });
    }

    openView(patient: any): void {
        this.requestService
            .getRequest(`${PATIENTS_API_URL}/${patient._id}`)
            .subscribe({
                next: (res: HttpResponse<any>) => {
                    if (res.status === 200) {
                        this.selectedPatient.set(res.body.data);
                        this.showViewModal.set(true);
                    } else {
                        const msg = res.body.message || 'Something went wrong'
                        this.toastService.show(msg, 'info');
                    }
                },
                error: (err: HttpErrorResponse) => {
                    const errMsg = err.error.message || err.message || 'Something went wrong'
                    this.toastService.show(errMsg, 'error');
                }
            });
    }

    openDelete(doc: Doctor): void {
        this.selectedPatient.set(doc);
        this.showDeleteModal.set(true);
    }

    getStatusClass(status: string): string {
        const map: Record<string, string> = {active: 'badge-green', pending: 'badge-amber', inactive: 'badge-gray'};
        return map[status] ?? 'badge-gray';
    }

    onEditProfile() {
        const patient = this.selectedPatient();

        if (!patient) return;

        this.isEditMode = true;
        this.doctorForm.patchValue(this.mapDoctorToForm(this.selectedPatient()));
        this.showViewModal.set(false);
        this.showAddModal.set(true);
    }

    mapDoctorToForm(doc: any) {
        return {
            name: `${doc.firstName} ${doc.lastName}`,
            email: doc.email,
            phone: doc.phone,
            pmdc: doc.profile?.licenseNumber,
            specialities: doc.specialities || [],
            hospitals: doc.hospitalAffiliations || []
        };
    }

    confirmDelete(): void {
        if (!this.selectedPatient()) return;
        this.requestService.deleteRequest(DELETE_USER_API_URL + this.selectedPatient()?._id).subscribe({
            next: (response) => {
                this.toastService.show('Doctor removed successfully', 'error');
                this.showDeleteModal.set(false);
                this.loadPatients();
            },
            error: (err) => {
                console.error(err);
                alert(err.error?.message || 'Failed to removed doctor');
            }
        });

    }

    resetForm(): void {
        this.doctorForm.reset();
    }

    goToPage(page: number) {
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

    getProfileImageUrl(doc: any): string | null {
        if (!doc?.profileImage?.data || !doc?.profileImage?.contentType) return null;
        return `data:${doc.profileImage.contentType};base64,${doc.profileImage.data}`;
    }
}
