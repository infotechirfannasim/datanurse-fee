import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

interface DataRecord {
  id: string;
  name: string;
  type: 'Doctor' | 'Patient' | 'Case' | 'Report';
  created: string;
  updated: string;
  status: 'Active' | 'Archived' | 'Pending';
}

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './data-management.component.html',
  styleUrl: './data-management.component.scss'
})
export class DataManagementComponent {
  private toastService = inject(ToastService);

  activeSection = signal<'records' | 'import' | 'export' | 'backup'>('records');
  searchQuery = signal('');
  showAddModal = signal(false);
  showDeleteModal = signal(false);
  selectedRecord = signal<DataRecord | null>(null);

  newRecord = { name: '', type: 'Doctor' as DataRecord['type'], status: 'Active' as DataRecord['status'] };

  records: DataRecord[] = [
    { id: 'REC-001', name: 'Dr. Salman A. Shah',   type: 'Doctor',  created: 'Jan 12, 2024', updated: 'Mar 22, 2026', status: 'Active' },
    { id: 'REC-002', name: 'Patient: Ayesha Raza',  type: 'Patient', created: 'Mar 22, 2026', updated: 'Mar 22, 2026', status: 'Active' },
    { id: 'REC-003', name: 'Case PT-2024-8892',     type: 'Case',    created: 'Mar 21, 2026', updated: 'Mar 21, 2026', status: 'Active' },
    { id: 'REC-004', name: 'Q1 2026 Summary Report',type: 'Report',  created: 'Mar 31, 2026', updated: 'Mar 31, 2026', status: 'Active' },
    { id: 'REC-005', name: 'Dr. Bilal Ahmed',       type: 'Doctor',  created: 'Jun 8, 2024',  updated: 'Jan 10, 2026', status: 'Archived' },
    { id: 'REC-006', name: 'Case PT-2024-8831',     type: 'Case',    created: 'Mar 16, 2026', updated: 'Mar 16, 2026', status: 'Pending' },
  ];

  get filteredRecords(): DataRecord[] {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.records;
    return this.records.filter(r => r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
  }

  getTypeClass(type: string): string {
    const m: Record<string, string> = { Doctor: 'badge-blue', Patient: 'badge-green', Case: 'badge-amber', Report: 'badge-gray' };
    return m[type] ?? 'badge-gray';
  }

  getStatusClass(status: string): string {
    const m: Record<string, string> = { Active: 'badge-green', Archived: 'badge-gray', Pending: 'badge-amber' };
    return m[status] ?? 'badge-gray';
  }

  addRecord(): void {
    const newRec: DataRecord = {
      id: `REC-00${this.records.length + 1}`,
      name: this.newRecord.name,
      type: this.newRecord.type,
      status: this.newRecord.status,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      updated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    };
    this.records = [newRec, ...this.records];
    this.toastService.show('Record added successfully!', 'success');
    this.showAddModal.set(false);
    this.newRecord = { name: '', type: 'Doctor', status: 'Active' };
  }

  openDelete(r: DataRecord): void { this.selectedRecord.set(r); this.showDeleteModal.set(true); }

  confirmDelete(): void {
    const r = this.selectedRecord();
    if (r) {
      this.records = this.records.filter(rec => rec.id !== r.id);
      this.toastService.show('Record deleted.', 'error');
    }
    this.showDeleteModal.set(false);
  }

  onImport(): void { this.toastService.show('Import started…', 'info'); }
  onExport(): void { this.toastService.show('Export ready for download!', 'success'); }
  onBackup(): void { this.toastService.show('Backup created successfully!', 'success'); }
}
