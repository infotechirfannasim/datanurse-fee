import {Component, inject, OnInit, signal} from '@angular/core';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule, NgClass} from '@angular/common';
import {ToastService} from '../../core/services/toast.service';
import {Doctor} from '../../core/models/doctor.model';
import {RequestService} from '../../core/services/request.service';
import {DELETE_USER_API_URL, PATIENTS_API_URL} from '../../utils/api.url.constants';
import {HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {FilterParams} from '../../core/models/user.model';
import {MultiSelectModule} from 'primeng/multiselect';
import {SelectModule} from 'primeng/select';
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from 'rxjs';
import {getUserInitials} from '../../utils/global.utils';

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
  showCaseDetailModal = signal(false);   // ← naya

  isEditMode = false;
  doctorForm!: FormGroup;
  patients: any[] = [];

  selectedPatient = signal<any | null>(null);
  selectedCase = signal<any | null>(null);  // ← naya

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  protected readonly getUserInitials = getUserInitials;

  ngOnInit(): void {
    this.loadPatients();
    this.setupSearchDebounce();
  }

  setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadPatients();
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery().toLowerCase());
  }

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

  openView(patient: any): void {
    this.requestService.getRequest(`${PATIENTS_API_URL}/${patient._id}`).subscribe({
      next: (res: HttpResponse<any>) => {
        if (res.status === 200) {
          this.selectedPatient.set(res.body.data);
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


  openCaseDetail(caseItem: any): void {
    this.selectedCase.set(caseItem);
    this.showCaseDetailModal.set(true);
  }


  getCaseStatusClass(status: string): string {
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

  getDischargeClass(status: string): string {
    if (!status) return 'cd-discharge-row--deceased';
    const lower = status.toLowerCase();
    if (lower.includes('alive') || lower.includes('home') || lower.includes('discharged')) {
      return 'cd-discharge-row--alive';
    }
    return 'cd-discharge-row--deceased';
  }

  getSurgeonInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().replace(/^Dr\.?\s*/i, '').split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return '?';
  }


  mapDoctorToForm(doc: any): any {
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
      next: () => {
        this.toastService.show('Patient removed successfully', 'error');
        this.showDeleteModal.set(false);
        this.loadPatients();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to remove patient');
      }
    });
  }

  resetForm(): void {
    this.doctorForm.reset();
  }

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

  getProfileImageUrl(doc: any): string | null {
    if (!doc?.profileImage?.data || !doc?.profileImage?.contentType) return null;
    return `data:${doc.profileImage.contentType};base64,${doc.profileImage.data}`;
  }
}