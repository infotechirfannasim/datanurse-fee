import { Component, signal, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { Case } from '../../core/models/case.model';

@Component({
  selector: 'app-cases',
  standalone: true,
  imports: [NgClass],
  templateUrl: './cases.component.html',
  styleUrl: './cases.component.scss'
})
export class CasesComponent {
  private toastService = inject(ToastService);
  searchQuery = signal('');
  activeTab = signal<'all' | 'active' | 'pending' | 'critical'>('all');

  cases: Case[] = [
    { id: 'PT-2024-8901', patientName: 'Ayesha Raza',   patientId: 'PT-2024-8901', avatarColor: '#2251CC', avatarInitials: 'AR', doctor: 'Dr. Salman Shah', diagnosis: 'Type II Diabetes',   status: 'Active',    date: 'Mar 22, 2026', priority: 'High' },
    { id: 'PT-2024-8892', patientName: 'Bilal Hussain', patientId: 'PT-2024-8892', avatarColor: '#5B4FCF', avatarInitials: 'BH', doctor: 'Dr. Omar Farooq', diagnosis: 'Hypertension',        status: 'Recovered', date: 'Mar 21, 2026', priority: 'Low' },
    { id: 'PT-2024-8887', patientName: 'Sana Malik',    patientId: 'PT-2024-8887', avatarColor: '#0EA5A0', avatarInitials: 'SM', doctor: 'Dr. Amna Tariq',  diagnosis: 'Pulmonary Infection', status: 'Critical',  date: 'Mar 20, 2026', priority: 'High' },
    { id: 'PT-2024-8876', patientName: 'Haris Khan',    patientId: 'PT-2024-8876', avatarColor: '#F0659A', avatarInitials: 'HK', doctor: 'Dr. Zaid Awan',   diagnosis: 'Appendicitis',        status: 'Pending',   date: 'Mar 19, 2026', priority: 'Medium' },
    { id: 'PT-2024-8862', patientName: 'Nida Siddiqui', patientId: 'PT-2024-8862', avatarColor: '#E8344A', avatarInitials: 'NS', doctor: 'Dr. Salman Shah', diagnosis: 'Kidney Stone',        status: 'Active',    date: 'Mar 18, 2026', priority: 'Medium' },
    { id: 'PT-2024-8845', patientName: 'Kamran Ali',    patientId: 'PT-2024-8845', avatarColor: '#F59E0B', avatarInitials: 'KA', doctor: 'Dr. Bilal Ahmed', diagnosis: 'Migraine',            status: 'Active',    date: 'Mar 17, 2026', priority: 'Low' },
    { id: 'PT-2024-8831', patientName: 'Farah Naz',     patientId: 'PT-2024-8831', avatarColor: '#22C55E', avatarInitials: 'FN', doctor: 'Dr. Sara Qureshi','diagnosis': 'Asthma',            status: 'Pending',   date: 'Mar 16, 2026', priority: 'Medium' },
  ];

  get filteredCases(): Case[] {
    let list = this.cases;
    const tab = this.activeTab();
    if (tab !== 'all') list = list.filter(c => c.status.toLowerCase() === tab);
    const q = this.searchQuery().toLowerCase();
    if (q) list = list.filter(c => c.patientName.toLowerCase().includes(q) || c.diagnosis.toLowerCase().includes(q) || c.doctor.toLowerCase().includes(q));
    return list;
  }

  getStatusClass(status: string): string {
    const m: Record<string, string> = { Active: 'badge-blue', Recovered: 'badge-green', Pending: 'badge-amber', Critical: 'badge-rose' };
    return m[status] ?? 'badge-gray';
  }

  getPriorityClass(p: string): string {
    const m: Record<string, string> = { High: 'badge-rose', Medium: 'badge-amber', Low: 'badge-green' };
    return m[p] ?? 'badge-gray';
  }

  onAction(action: string, c: Case): void {
    this.toastService.show(`${action}: ${c.patientId}`, 'info');
  }
}
