import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { Doctor, HospitalEntry } from '../../core/models/doctor.model';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './doctors.component.html',
  styleUrl: './doctors.component.scss'
})
export class DoctorsComponent {
  private toastService = inject(ToastService);

  searchQuery = signal('');
  showAddModal = signal(false);
  showViewModal = signal(false);
  showDeleteModal = signal(false);
  selectedDoctor = signal<Doctor | null>(null);

  // New doctor form
  newDoctor = {
    name: '', email: '', phone: '', pmdc: '',
    specializations: [] as string[],
    hospitals: [{ name: '', city: '' }] as HospitalEntry[]
  };
  tagInput = '';

  doctors: Doctor[] = [
    { id: 1, name: 'Dr. Salman A. Shah', email: 'salman.shah@datanurse.pk', specializations: ['Endocrinology', 'Internal Medicine'], hospitals: ['Aga Khan Hospital', 'LUMS Medical'], cases: 312, rating: 4.9, status: 'Active', avatarInitials: 'SS', avatarColor: '#2251CC', joined: 'Jan 12, 2024', phone: '+92-300-1234567', pmdc: 'PMDC-12345' },
    { id: 2, name: 'Dr. Omar Farooq',    email: 'omar.farooq@datanurse.pk',  specializations: ['Cardiology'],                       hospitals: ['Shaukat Khanum', 'CMH Lahore'], cases: 289, rating: 4.8, status: 'Active', avatarInitials: 'OF', avatarColor: '#5B4FCF', joined: 'Feb 3, 2024', phone: '+92-321-9876543', pmdc: 'PMDC-23456' },
    { id: 3, name: 'Dr. Amna Tariq',     email: 'amna.tariq@datanurse.pk',   specializations: ['Pulmonology', 'Critical Care'],     hospitals: ['Services Hospital', 'PKLI'], cases: 254, rating: 4.7, status: 'Active', avatarInitials: 'AT', avatarColor: '#0EA5A0', joined: 'Mar 18, 2024', phone: '+92-333-1111222', pmdc: 'PMDC-34567' },
    { id: 4, name: 'Dr. Zaid Awan',      email: 'zaid.awan@datanurse.pk',    specializations: ['General Surgery'],                  hospitals: ['PIMS Islamabad'], cases: 231, rating: 4.6, status: 'Active', avatarInitials: 'ZA', avatarColor: '#F0659A', joined: 'Apr 5, 2024', phone: '+92-345-5556666', pmdc: 'PMDC-45678' },
    { id: 5, name: 'Dr. Sara Qureshi',   email: 'sara.q@datanurse.pk',       specializations: ['Paediatrics'],                      hospitals: ['Children Hospital Lahore'], cases: 198, rating: 4.5, status: 'Pending', avatarInitials: 'SQ', avatarColor: '#E8344A', joined: 'May 20, 2024', phone: '+92-300-7778888', pmdc: 'PMDC-56789' },
    { id: 6, name: 'Dr. Bilal Ahmed',    email: 'bilal.a@datanurse.pk',      specializations: ['Neurology', 'Stroke Medicine'],     hospitals: ['Mayo Hospital', 'Ittefaq Hospital'], cases: 176, rating: 4.4, status: 'Inactive', avatarInitials: 'BA', avatarColor: '#F59E0B', joined: 'Jun 8, 2024', phone: '+92-321-2223333', pmdc: 'PMDC-67890' },
  ];

  get filteredDoctors(): Doctor[] {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.doctors;
    return this.doctors.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
      d.specializations.some(s => s.toLowerCase().includes(q))
    );
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { Active: 'badge-green', Pending: 'badge-amber', Inactive: 'badge-gray' };
    return map[status] ?? 'badge-gray';
  }

  openView(doc: Doctor): void {
    this.selectedDoctor.set(doc);
    this.showViewModal.set(true);
  }

  openDelete(doc: Doctor): void {
    this.selectedDoctor.set(doc);
    this.showDeleteModal.set(true);
  }

  confirmDelete(): void {
    const doc = this.selectedDoctor();
    if (doc) {
      this.doctors = this.doctors.filter(d => d.id !== doc.id);
      this.toastService.show('Doctor removed successfully', 'error');
    }
    this.showDeleteModal.set(false);
  }

  addHospitalRow(): void {
    this.newDoctor.hospitals.push({ name: '', city: '' });
  }

  removeHospitalRow(i: number): void {
    if (this.newDoctor.hospitals.length > 1) {
      this.newDoctor.hospitals.splice(i, 1);
    }
  }

  addTag(e: KeyboardEvent): void {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const val = this.tagInput.trim();
    if (val && !this.newDoctor.specializations.includes(val)) {
      this.newDoctor.specializations.push(val);
    }
    this.tagInput = '';
  }

  removeTag(tag: string): void {
    this.newDoctor.specializations = this.newDoctor.specializations.filter(t => t !== tag);
  }

  submitAddDoctor(): void {
    this.toastService.show('Doctor registered successfully!', 'success');
    this.showAddModal.set(false);
    this.resetForm();
  }

  private resetForm(): void {
    this.newDoctor = { name: '', email: '', phone: '', pmdc: '', specializations: [], hospitals: [{ name: '', city: '' }] };
    this.tagInput = '';
  }
}
