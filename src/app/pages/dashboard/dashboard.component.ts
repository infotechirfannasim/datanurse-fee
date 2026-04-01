import {Component, inject, OnInit, signal} from '@angular/core';
import {NgClass} from '@angular/common';
import {ToastService} from '../../core/services/toast.service';
import {AuthService} from "../../core/services/auth.service";
import {FilterParams, User} from "../../core/models/user.model";
import {USERS_API_URL} from "../../utils/api.url.constants";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {ROLES} from "../../utils/app-constants";
import {RequestService} from "../../core/services/request.service";
import {getUserInitials} from "../../utils/global.utils";

interface StatCard {
  icon: string;
  id: string;
  label: string;
  value: number;
  target: number;
  trend: string;
  trendType: 'up' | 'down' | 'neu';
  accentColor: string;
  bgColor: string;
  barColor: string;
  barWidth: string;
  suffix?: string;
}

interface RecentCase {
  patientName: string;
  patientId: string;
  avatarColor: string;
  initials: string;
  surgeon: string;
  procedure: string;
  status: 'Active' | 'Recovered' | 'Pending' | 'Critical';
  date: string;
}

interface ProcedureItem {
  label: string;
  percentage: number;
  color: string;
  cases: number;
}

interface SurgeonItem {
  name: string;
  initials: string;
  avatarColor: string;
  specialty: string;
  cases: number;
  successRate: number;
}

interface AgeGroupItem {
  label: string;
  percentage: number;
  color: string;
}

interface ProvinceItem {
  label: string;
  percentage: number;
  color: string;
}

interface FollowupItem {
  label: string;
  rate: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private requestService = inject(RequestService);
  pagination = signal<any>(null);
  userInfo = signal<User | null>(null);
  searchQuery = signal('');
  pageQuery = signal(1);

  doctors: User[] = [];

  constructor() {
    this.authService.currentUser$.subscribe((user: any) => {
      this.userInfo.set(user);
    });
  }

  statCards: StatCard[] = [
    {
      icon: './assets/images/doctor.svg',
      id: 'cnt-cases',
      label: 'Total Cases (YTD)',
      value: 0,
      target: 312,
      trend: '+8 this month',
      trendType: 'up',
      accentColor: 'var(--blue)',
      bgColor: 'rgba(34,81,204,0.08)',
      barColor: 'var(--blue)',
      barWidth: '68%'
    },
    {
      icon: './assets/images/ActiveCases.svg',
      id: 'cnt-success',
      label: '30-Day Success Rate',
      value: 0,
      target: 91,
      trend: '+2% vs last year',
      trendType: 'up',
      accentColor: 'var(--teal)',
      bgColor: 'rgba(14,165,160,0.08)',
      barColor: 'var(--teal)',
      barWidth: '91%',
      suffix: '%'
    },
    {
      icon: './assets/images/doctor.svg',
      id: 'cnt-followup',
      label: 'Pending Follow-ups',
      value: 0,
      target: 27,
      trend: '−3 vs last week',
      trendType: 'down',
      accentColor: 'var(--amber)',
      bgColor: 'rgba(245,158,11,0.08)',
      barColor: 'var(--amber)',
      barWidth: '32%'
    },
    {
      icon: './assets/images/RecoveryRate.svg',
      id: 'cnt-survival',
      label: '1-Year Survival Rate',
      value: 0,
      target: 87,
      trend: '±0 stable',
      trendType: 'neu',
      accentColor: 'var(--indigo)',
      bgColor: 'rgba(91,79,207,0.08)',
      barColor: 'var(--indigo)',
      barWidth: '87%',
      suffix: '%'
    },
  ];

  procedures: ProcedureItem[] = [
    { label: 'ASD Repair',      percentage: 28, color: '#2251CC', cases: 87 },
    { label: 'VSD Repair',      percentage: 22, color: '#E8344A', cases: 69 },
    { label: 'TOF Correction',  percentage: 19, color: '#0EA5A0', cases: 59 },
    { label: 'Valve Repair',    percentage: 18, color: '#F59E0B', cases: 56 },
    { label: 'Other',           percentage: 13, color: '#5B4FCF', cases: 41 },
  ];

  topSurgeons: SurgeonItem[] = [
    { name: 'Dr. Salman Shah',  initials: 'SS', avatarColor: '#2251CC', specialty: 'Congenital Heart Surgery', cases: 84, successRate: 94 },
    { name: 'Dr. Omar Farooq', initials: 'OF', avatarColor: '#0EA5A0', specialty: 'Pediatric Cardiac Surgery',  cases: 71, successRate: 91 },
    { name: 'Dr. Amna Tariq',  initials: 'AT', avatarColor: '#E8344A', specialty: 'Valve Reconstruction',       cases: 63, successRate: 89 },
    { name: 'Dr. Zaid Awan',   initials: 'ZA', avatarColor: '#F59E0B', specialty: 'Neonatal Surgery',           cases: 55, successRate: 87 },
  ];

  ageGroups: AgeGroupItem[] = [
    { label: 'Neonates (<1m)',   percentage: 12, color: '#E8344A' },
    { label: 'Infants (1–12m)', percentage: 29, color: '#F59E0B' },
    { label: 'Toddlers (1–3y)', percentage: 22, color: '#2251CC' },
    { label: 'Children (3–10y)',percentage: 25, color: '#0EA5A0' },
    { label: 'Adolescents (10+)',percentage: 12, color: '#5B4FCF' },
  ];

  provinces: ProvinceItem[] = [
    { label: 'Punjab',      percentage: 44, color: '#2251CC' },
    { label: 'Sindh',       percentage: 21, color: '#E8344A' },
    { label: 'KPK',         percentage: 18, color: '#0EA5A0' },
    { label: 'Balochistan', percentage: 10, color: '#F59E0B' },
    { label: 'AJK / GB',   percentage:  7, color: '#5B4FCF' },
  ];

  followups: FollowupItem[] = [
    { label: '30-day follow-up',  rate: 89, color: '#2251CC' },
    { label: '3-month follow-up', rate: 81, color: '#0EA5A0' },
    { label: '6-month follow-up', rate: 74, color: '#F59E0B' },
    { label: '1-year follow-up',  rate: 61, color: '#E8344A' },
  ];

  recentCases: RecentCase[] = [
    {
      patientName: 'Ahmed Raza',
      patientId: 'CS-2024-0901',
      avatarColor: '#2251CC',
      initials: 'AR',
      surgeon: 'Dr. Salman Shah',
      procedure: 'ASD Repair',
      status: 'Recovered',
      date: 'Mar 22, 2026'
    },
    {
      patientName: 'Bilal Hussain',
      patientId: 'CS-2024-0892',
      avatarColor: '#5B4FCF',
      initials: 'BH',
      surgeon: 'Dr. Omar Farooq',
      procedure: 'VSD Repair',
      status: 'Active',
      date: 'Mar 21, 2026'
    },
    {
      patientName: 'Sara Malik',
      patientId: 'CS-2024-0887',
      avatarColor: '#0EA5A0',
      initials: 'SM',
      surgeon: 'Dr. Amna Tariq',
      procedure: 'TOF Correction',
      status: 'Critical',
      date: 'Mar 20, 2026'
    },
    {
      patientName: 'Haris Khan',
      patientId: 'CS-2024-0876',
      avatarColor: '#F0659A',
      initials: 'HK',
      surgeon: 'Dr. Zaid Awan',
      procedure: 'Valve Repair',
      status: 'Pending',
      date: 'Mar 19, 2026'
    },
    {
      patientName: 'Nida Siddiqui',
      patientId: 'CS-2024-0862',
      avatarColor: '#E8344A',
      initials: 'NS',
      surgeon: 'Dr. Salman Shah',
      procedure: 'ASD Repair',
      status: 'Active',
      date: 'Mar 18, 2026'
    },
  ];

  // Bar chart month data
  caseVolumeData = [
    { month: 'Jan', cases: 60, resolved: 48 },
    { month: 'Feb', cases: 75, resolved: 60 },
    { month: 'Mar', cases: 55, resolved: 44 },
    { month: 'Apr', cases: 90, resolved: 72 },
    { month: 'May', cases: 70, resolved: 56 },
    { month: 'Jun', cases: 85, resolved: 68 },
  ];

  chartPeriod = 'month';
  genderMale = 58;
  genderFemale = 42;

  ngOnInit(): void {
    this.animateCounters();
    this.loadDoctors();
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

  private animateCounters(): void {
    this.statCards.forEach(card => {
      const target = card.target;
      const duration = 1400;
      const start = performance.now();
      const update = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        card.value = Math.round(ease * target);
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Active: 'badge-blue', Recovered: 'badge-green',
      Pending: 'badge-amber', Critical: 'badge-rose'
    };
    return map[status] ?? 'badge-gray';
  }

  setPeriod(p: string): void {
    this.chartPeriod = p;
  }

  onQuickAction(action: string): void {
    this.toastService.show(`${action} opened`, 'info');
  }

  getBarHeightPercent(value: number, data: {cases: number, resolved: number}[]): string {
    const max = Math.max(...data.map(d => d.cases));
    return ((value / max) * 90) + '%';
  }

  protected readonly getUserInitials = getUserInitials;
}