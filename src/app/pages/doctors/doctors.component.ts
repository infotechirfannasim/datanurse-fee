import {Component, inject, OnInit, signal} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule, NgClass} from '@angular/common';
import {ToastService} from '../../core/services/toast.service';
import {Doctor} from '../../core/models/doctor.model';
import {RequestService} from "../../core/services/request.service";
import {
  ACTIVE_ROLES_API_URL,
  DELETE_USER_API_URL,
  GET_LOV_BULK_API_URL,
  USERS_API_URL
} from "../../utils/api.url.constants";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {FilterParams, Role} from "../../core/models/user.model";
import {ROLES} from "../../utils/app-constants";
import {MultiSelectModule} from "primeng/multiselect";
import {SelectModule} from "primeng/select";
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from "rxjs";

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [FormsModule, NgClass, ReactiveFormsModule, CommonModule, MultiSelectModule, SelectModule],
  templateUrl: './doctors.component.html',
  styleUrl: './doctors.component.scss'
})
export class DoctorsComponent implements OnInit {
  private toastService = inject(ToastService);

  searchQuery = signal('');
  pageQuery = signal(1);
  pagination = signal<any>(null);
  showAddModal = signal(false);
  showViewModal = signal(false);
  showDeleteModal = signal(false);
  selectedDoctor = signal<Doctor | null>(null);
  selectedDoctorId = signal<number | null>(null);
  isEditMode: boolean = false;
  doctorForm!: FormGroup;
  imagePreview: string | null = null;
  selectedFile: File | null = null;
  roles: any[] = [];
  specialtyOptions: any[] = [];
  hospitalOptions: any[] = [];
  cityOptions: any[] = [];
  doctors: Doctor[] = [];
  private fb = inject(FormBuilder);
  private requestService = inject(RequestService);
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
  }

  get filteredDoctors(): Doctor[] {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.doctors;
    return this.doctors.filter(d =>
        d.firstName.toLowerCase().includes(q) ||
        d.lastName.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
        d.specialities.some(s => s.toLowerCase().includes(q))
    );
  }

  // Getter for specializations FormArray
  get specializations(): FormArray {
    return this.doctorForm.get('specializations') as FormArray;
  }

  // Getter for hospitals FormArray
  get hospitals(): FormArray {
    return this.doctorForm.get('hospitals') as FormArray;
  }

  ngOnInit() {
    this.loadDoctors();
    this.loadRoles();
    this.buildForm();
    this.loadLovs();
    this.addHospitalRow();
    this.setupSearchDebounce();
  }

  buildForm() {
    this.doctorForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      role: [this.roles.find((role: Role) => role.name === ROLES.DOCTOR)?._id],
      pmdc: ['', [Validators.required]],
      specialities: [''],
      hospitals: this.fb.array([]),
      profileImage: [null]
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
          this.loadDoctors();
        });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery().toLowerCase());
  }

  loadDoctors() {
    const filters: FilterParams = {
      search: this.searchQuery().toLowerCase() || '',
      page: this.pageQuery(),
      limit: 10
    };
    this.requestService.getRequest(USERS_API_URL, filters).subscribe({
      next: (response: HttpResponse<any>) => {
        if (response.status == 200 && response.body.data) {
          this.doctors = Array.isArray(response.body.data)
              ? response.body.data.filter((dr: any) => dr.role.name == ROLES.DOCTOR)
              : [];
          this.pagination.set(response.body.meta?.pagination || null);
        } else {
          this.doctors = [];
          this.pagination.set(null);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.doctors = [];
        this.pagination.set(null);
      },
    });
  }

  loadRoles() {
    this.requestService.getRequest(ACTIVE_ROLES_API_URL).subscribe({
      next: (response: HttpResponse<any>) => {
        if (response.status == 200 && response.body.data) {
          this.roles = response.body.data;
        } else {
          this.roles = [];
        }
      },
      error: (error: HttpErrorResponse) => {
        this.roles = [];
      },
    });
  }

  openView(doc: Doctor): void {
    this.selectedDoctor.set(doc);
    this.showViewModal.set(true);
  }

  loadLovs() {
    const payload = {
      types: ['specialty', 'hospitals', 'city'],
    };
    this.requestService.postRequest(GET_LOV_BULK_API_URL, payload).subscribe({
      next: (response: HttpResponse<any>) => {
        if (response.status == 200 && response.body.data) {
          this.specialtyOptions = response.body.data['specialty'];
          this.hospitalOptions = response.body.data['hospitals'];
          this.cityOptions = response.body.data['city'];
        } else {
          this.roles = [];
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load roles', error);
        this.roles = [];
      },
    });
  }

  openDelete(doc: Doctor): void {
    this.selectedDoctor.set(doc);
    this.showDeleteModal.set(true);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {active: 'badge-green', pending: 'badge-amber', inactive: 'badge-gray'};
    return map[status] ?? 'badge-gray';
  }

  onEditProfile() {
    const doctor = this.selectedDoctor();

    if (!doctor) return;

    this.isEditMode = true;
    this.selectedDoctorId.set(doctor._id);
    this.doctorForm.patchValue(this.mapDoctorToForm(this.selectedDoctor()));
    console.log(this.doctorForm.value)
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
    if (!this.selectedDoctor()) return;
    this.requestService.deleteRequest(DELETE_USER_API_URL + this.selectedDoctor()?._id).subscribe({
      next: (response) => {
        this.toastService.show('Doctor removed successfully', 'error');
        this.showDeleteModal.set(false);
        this.loadDoctors();
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Failed to removed doctor');
      }
    });

  }

  // Image Handling
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('Only JPG, PNG or WEBP allowed');
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  addHospitalRow(): void {
    const hospitalGroup = this.fb.group({
      name: ['', Validators.required],
      city: ['', Validators.required]
    });
    this.hospitals.push(hospitalGroup);
  }

  removeHospitalRow(index: number): void {
    if (this.hospitals.length > 1) {
      this.hospitals.removeAt(index);
    }
  }

  submitAddDoctor(): void {
    if (this.doctorForm.invalid) {
      this.doctorForm.markAllAsTouched();
      return;
    }
    const formData = new FormData();
    formData.append('firstName', this.doctorForm.value.name.split(' ').slice(0, -1).join(' ') || this.doctorForm.value.name);
    formData.append('lastName', this.doctorForm.value.name.split(' ').slice(-1)[0] || '');
    formData.append('email', this.doctorForm.value.email);
    formData.append('phone', this.doctorForm.value.phone || '');
    formData.append('profile.licenseNumber', this.doctorForm.value.pmdc || '');
    formData.append('role', this.roles.find((role: Role) => role.name === ROLES.DOCTOR)?._id);

    const specialities = this.doctorForm.value.specialities || [];
    specialities.forEach((spec: string) => {
      if (spec && spec.trim() !== '') {
        formData.append('specialities[]', spec.trim());
      }
    });

    const hospitals = this.doctorForm.value.hospitals || [];
    hospitals.forEach((hospital: any, index: number) => {
      if (hospital?.name) {
        formData.append(`hospitalAffiliations[${index}][name]`, hospital.name);
      }
      if (hospital?.city) {
        formData.append(`hospitalAffiliations[${index}][city]`, hospital.city);
      }
    });

    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile);
    }
    const request$ = this.isEditMode
        ? this.requestService.patchReqWithFormData(`${USERS_API_URL}/${this.selectedDoctorId()}`, formData)
        : this.requestService.postReqWithFormData(USERS_API_URL, formData);

    request$.subscribe({
      next: (response) => {
        alert('Doctor registered successfully!');
        this.resetForm();
        this.showAddModal.set(false);
        this.loadDoctors();
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Failed to register doctor');
      }
    });
  }

  resetForm(): void {
    this.doctorForm.reset();
    this.imagePreview = null;
    this.selectedFile = null;
    this.hospitals.clear();
    this.addHospitalRow(); // Add default row again
  }

  goToPage(page: number) {
    const p = this.pagination();
    if (!p || page < 1 || page > p.totalPages) return;
    this.pageQuery.set(page);
    this.loadDoctors();
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
