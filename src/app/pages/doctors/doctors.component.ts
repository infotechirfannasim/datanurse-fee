import {Component, inject, OnInit, signal} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {CommonModule, NgClass} from '@angular/common';
import {ToastService} from '../../core/services/toast.service';
import {Doctor} from '../../core/models/doctor.model';
import {RequestService} from "../../core/services/request.service";
import {
    ACTIVE_ROLES_API_URL,
    DELETE_USER_API_URL,
    DOCTORS_API_URL,
    GET_LOV_BULK_API_URL,
    USERS_API_URL
} from "../../utils/api.url.constants";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {FilterParams, Role} from "../../core/models/user.model";
import {ROLES} from "../../utils/app-constants";
import {MultiSelectModule} from "primeng/multiselect";
import {SelectModule} from "primeng/select";
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from "rxjs";
import {FindObjByKeyPipe} from "../../core/pipe/find-obj-by-key";
import {getError, markAllTouched} from "../../utils/global.utils";
import {NgxMaskDirective} from "ngx-mask";
import {RegexConstants} from "../../utils/regex-constants";

@Component({
    selector: 'app-doctors',
    standalone: true,
    imports: [FormsModule, NgClass, ReactiveFormsModule, CommonModule, MultiSelectModule, SelectModule, FindObjByKeyPipe, NgxMaskDirective],
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
    showConfirmClose = signal(false);
    selectedDoctor = signal<Doctor | null>(null);
    errorMessages = {
        phone: {required: 'Phone is required', pattern: 'Invalid Pakistani phone number'},
        pmdcNumber: {
            required: 'PMDC number is required',
            minLength: 'Min 1 characters',
            maxLength: 'Max 10 characters',
            pattern: 'Only numbers are allowed'
        },
        email: {
            required: 'Email is required',
            maxlength: 'Max 50 characters',
            email: 'Provide valid email', pattern: 'Provide valid email'
        },
        firstName: {
            required: 'First name is required',
            pattern: 'Only letters and , - _ * & + . are allowed.',
            maxLength: 'Max 50 characters'
        },
        lastName: {
            required: 'Last name is required',
            pattern: 'Only letters and , - _ * & + . are allowed.',
            maxLength: 'Max 50 characters'
        },
    };
    isEditMode: boolean = false;
    doctorForm!: FormGroup;
    imagePreview: string | null = null;
    selectedFile: File | null = null;
    roles: any[] = [];
    countryOptions: any[] = [];
    specialtyOptions: any[] = [];
    hospitalOptions: any[] = [];
    doctors: Doctor[] = [];
    rowProvinceOptions: Map<number, any[]> = new Map();
    rowDistrictOptions: Map<number, any[]> = new Map();
    rowCityOptions: Map<number, any[]> = new Map();

    allProvinces: any[] = [];
    allDistricts: any[] = [];
    cityOptions: any[] = [];
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

    get hospitals(): FormArray {
        return this.doctorForm.get('hospitals') as FormArray;
    }

    ngOnInit() {
        this.loadDoctors();
        this.loadRoles();
        this.buildForm();
        this.loadLovs();
        this.setupSearchDebounce();
    }

    buildForm() {
        this.doctorForm = this.fb.group({
            firstName: ['', [
                Validators.required,
                Validators.minLength(1),
                Validators.maxLength(50),
                Validators.pattern(RegexConstants.NAME_SPECIAL_REGEX)
            ]],
            lastName: ['', [
                Validators.required,
                Validators.minLength(1),
                Validators.maxLength(50),
                Validators.pattern(RegexConstants.NAME_SPECIAL_REGEX)
            ]],
            email: ['', [
                Validators.required,
                Validators.email,
                Validators.pattern(RegexConstants.VALID_EMAIL_REGEX),
                Validators.maxLength(50)
            ]],
            phone: ['', [
                Validators.required,
                Validators.pattern(RegexConstants.PHONE_REGEX)
            ]],
            role: [this.roles.find((r: Role) => r.name === ROLES.DOCTOR)?._id, Validators.required],
            pmdcNumber: ['', [
                Validators.required,
                Validators.minLength(1),
                Validators.maxLength(10),
                Validators.pattern(RegexConstants.NUMERIC_REGEX)
            ]],
            specialities: [null, [
                Validators.required,
                Validators.minLength(1)
            ]],
            hospitalAffiliations: [null, Validators.required],
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
        this.requestService.getRequest(DOCTORS_API_URL, filters).subscribe({
            next: (response: HttpResponse<any>) => {
                if (response.status == 200 && response.body.data) {
                    this.doctors = response.body.data ?? [];
                    this.pagination.set(response.body.meta?.pagination || null);
                } else {
                    this.doctors = [];
                    this.pagination.set(null);
                }
            },
            error: (error: HttpErrorResponse) => {
                this.doctors = [];
                this.pagination.set(null);
                const errMsg = error.error.message || error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error')
            },
        });
    }

    loadRoles() {
        this.requestService.getRequest(ACTIVE_ROLES_API_URL).subscribe({
            next: (response: HttpResponse<any>) => {
                if (response.status == 200 && response.body.data) {
                    this.roles = response.body.data;
                    const dctRole = this.roles.find((r: Role) => r.name === ROLES.DOCTOR);
                    this.doctorForm.get('role')?.setValue(dctRole?._id);
                } else {
                    this.roles = [];
                }
            },
            error: (error: HttpErrorResponse) => {
                this.doctors = [];
                const errMsg = error.error.message || error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error')
            },
        });
    }

    openView(doc: Doctor): void {
        this.selectedDoctor.set(doc);
        this.showViewModal.set(true);
    }

    loadLovs() {
        const payload = {
            types: ['specialty', 'hospitals', 'country', 'province', 'district', 'city'],
        };
        this.requestService.postRequest(GET_LOV_BULK_API_URL, payload).subscribe({
            next: (response: HttpResponse<any>) => {
                if (response.status == 200 && response.body.data) {
                    this.specialtyOptions = response.body.data['specialty'];
                    this.hospitalOptions = response.body.data['hospitals'];
                    this.countryOptions = response.body.data['country'];
                    this.allProvinces = response.body.data['province'];
                    this.allDistricts = response.body.data['district'];
                    this.cityOptions = response.body.data['city'];
                }
            },
            error: (error: HttpErrorResponse) => {
                const errMsg = error.error.message || error.message || 'Something went wrong';
                this.toastService.show(errMsg, 'error');
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

    onEditProfile(doc: Doctor) {
        if (!doc) return;
        this.selectedDoctor.set(doc);
        this.isEditMode = true;
        this.doctorForm.patchValue(this.mapDoctorToForm(doc));

        this.showViewModal.set(false);
        this.showAddModal.set(true);
    }

    mapDoctorToForm(doc: Doctor | null) {
        return {
            firstName: doc?.firstName,
            lastName: doc?.lastName,
            email: doc?.email,
            phone: doc?.phone,
            pmdcNumber: doc?.pmdcNumber,
            tinNumber: doc?.tinNumber,
            npiNumber: doc?.npiNumber,
            specialities: doc?.specialities || [],
            role: this.doctorForm.value?.role,
            hospitalAffiliations: doc?.hospitalAffiliations || []
        };
    }

    confirmDelete(): void {
        if (!this.selectedDoctor()) return;
        this.requestService.deleteRequest(DELETE_USER_API_URL + this.selectedDoctor()?._id).subscribe({
            next: (response) => {
                this.toastService.show('Doctor deleted successfully', 'success');
                this.showDeleteModal.set(false);
                this.loadDoctors();
            },
            error: (err: HttpErrorResponse) => {
                const errMsg = err.message || err.error.message || 'Failed to delete doctor.';
                this.toastService.show(errMsg, 'error');
            }
        });

    }

    onImageSelected(event: any) {
        const file = event.target.files?.[0];
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png'];
        const allowedExtensions = ['jpg', 'jpeg', 'png'];

        const fileName = file.name.toLowerCase();
        const ext = fileName.split('.').pop();

        event.target.value = '';

        if (file.size > 1024 * 1024) {
            this.toastService.show('Max size is 1MB', 'error');
            return;
        }

        if (!ext || !allowedExtensions.includes(ext)) {
            this.toastService.show('Only JPG and PNG allowed', 'error');
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            this.toastService.show('Invalid file type', 'error');
            return;
        }

        this.selectedFile = file;

        const reader = new FileReader();
        reader.onload = () => {
            this.imagePreview = reader.result as string;
        };
        reader.readAsDataURL(file);
    }

    submitAddDoctor(): void {
        if (this.doctorForm.invalid) {
            markAllTouched(this.doctorForm);
            this.toastService.show('Please fill all required fields correctly', 'error');
            return;
        }
        const formData = new FormData();
        if (!this.isEditMode) {
            formData.append('mustSetPassword', 'true');
        }
        formData.append('firstName', this.doctorForm.value.firstName || '');
        formData.append('lastName', this.doctorForm.value.lastName || '');
        formData.append('email', this.doctorForm.value.email);
        formData.append('phone', this.doctorForm.value.phone || '');
        formData.append('pmdcNumber', this.doctorForm.value.pmdcNumber || '');
        formData.append('tinNumber', this.doctorForm.value.tinNumber || '');
        formData.append('npiNumber', this.doctorForm.value.npiNumber || '');
        formData.append('role', this.doctorForm.value.role || '');

        const specialities = this.doctorForm.value.specialities || [];
        specialities.forEach((spec: string) => {
            if (spec && spec.trim() !== '') {
                formData.append('specialities[]', spec.trim());
            }
        });

        const hospitals = this.doctorForm.value.hospitalAffiliations || [];
        hospitals.forEach((hospital: any) => {
            if (hospital && hospital.trim() !== '') {
                formData.append(`hospitalAffiliations[]`, hospital);
            }
        });

        if (this.selectedFile) {
            formData.append('profileImage', this.selectedFile);
        }
        const request$ = this.isEditMode
            ? this.requestService.putReqWithFormData(`${USERS_API_URL}/${this.selectedDoctor()?._id}`, formData)
            : this.requestService.postReqWithFormData(USERS_API_URL, formData);

        request$.subscribe({
            next: (response: HttpResponse<any>) => {
                if (response.status == 200 || response.status == 201) {
                }
                this.showAddModal.set(false);
                this.toastService.show(this.isEditMode ? 'Doctor updated successfully.' : 'Doctor added successfully. Email has been sent.', 'success')
                this.resetForm();
                this.loadDoctors();
            },
            error: (err: HttpErrorResponse) => {
                const errMsg = err.error.message || err.message || 'Something went wrong';
                this.toastService.show(errMsg || 'Failed to register doctor', 'error');
            }
        });
    }

    resetForm(): void {
        this.doctorForm.reset({role: this.doctorForm.value.role});
        this.imagePreview = null;
        this.selectedFile = null;
        this.isEditMode = false;
        this.selectedDoctor.set(null);
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

    getProfileImageUrl(doc: Doctor | null): string | null {
        if (!doc?.profileImage?.data || !doc?.profileImage?.contentType) return null;
        return `data:${doc?.profileImage.contentType};base64,${doc?.profileImage.data}`;
    }

    getErrorMsg(controlName: string, index?: number, field?: string) {
        return getError(this.doctorForm, controlName, {
            index,
            field,
            customMessages: this.errorMessages
        });
    }

    cancelClose() {
        this.showConfirmClose.set(false);
    }

    closeModal() {
        if (this.doctorForm.dirty) {
            this.showConfirmClose.set(true);
        } else {
            this.resetForm();
            this.showAddModal.set(false);
        }
    }

    discardChanges() {
        this.resetForm();
        this.cancelClose();
        this.closeModal();
    }
}
