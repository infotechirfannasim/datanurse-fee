import {Component, inject, OnInit, signal} from '@angular/core';
import {ToastService} from '../../core/services/toast.service';
import {AuthService} from "../../core/services/auth.service";
import {FilterParams, User} from "../../core/models/user.model";
import {
  ANALYTICS_API_URL,
  DEMOGRAPHICS_API_URL, GET_LOV_BULK_API_URL,
  SUMMARY_API_URL,
  TOP_DOCTORS_API_URL
} from "../../utils/api.url.constants";
import {HttpErrorResponse, HttpResponse} from "@angular/common/http";
import {RequestService} from "../../core/services/request.service";
import {forkJoin} from "rxjs";
import {FindObjByKeyPipe} from "../../core/pipe/find-obj-by-key";

interface StatCard {
  icon: string;
  _id: number;
  label: string;
  value: number;
  target?: number;
  trend?: string;
  trendType?: 'up' | 'down' | 'neu';
  accentColor?: string;
  bgColor?: string;
  barColor?: string;
  barWidth?: string;
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
  casePercentage?: number;
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
  imports: [FindObjByKeyPipe],
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
  specialtyOptions: any[] = [];

  constructor() {
    this.authService.currentUser$.subscribe((user: any) => {
      this.userInfo.set(user);
    });
  }

  statCards: StatCard[] = [
  ];
  // New — for dynamic ring chart and outcome cards
  totalCases:           number = 0;
  ringSegments:         any[] = [];
  outcomes:             any = {};
  followupOverallRate:  number = 0;

  procedures: ProcedureItem[] = [
    { label: 'ASD Repair',      percentage: 28, color: '#2251CC', cases: 87 },
    { label: 'VSD Repair',      percentage: 22, color: '#E8344A', cases: 69 },
    { label: 'TOF Correction',  percentage: 19, color: '#0EA5A0', cases: 59 },
    { label: 'Valve Repair',    percentage: 18, color: '#F59E0B', cases: 56 },
    { label: 'Other',           percentage: 13, color: '#5B4FCF', cases: 41 },
  ];

  topSurgeons: any[] = [
    {name: 'Dr. Salman Shah', initials: 'SS', specialty: 'Congenital Heart Surgery', cases: 84, successRate: 94},
    {name: 'Dr. Omar Farooq', initials: 'OF', specialty: 'Pediatric Cardiac Surgery', cases: 71, successRate: 91},
    {name: 'Dr. Amna Tariq', initials: 'AT', specialty: 'Valve Reconstruction', cases: 63, successRate: 89},
    {name: 'Dr. Zaid Awan', initials: 'ZA', specialty: 'Neonatal Surgery', cases: 55, successRate: 87},
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
    this.loadLovs();
    this.loadDashboard()
  }

  loadLovs() {
    const payload = {
      types: ['specialty', 'hospitals', 'city'],
    };
    this.requestService.postRequest(GET_LOV_BULK_API_URL, payload).subscribe({
      next: (response: HttpResponse<any>) => {
        if (response.status == 200 && response.body.data) {
          this.specialtyOptions = response.body.data['specialty'];
        } else {
          this.specialtyOptions = [];
        }
      },
      error: (error: HttpErrorResponse) => {
        this.specialtyOptions = [];
        const errMsg = error.error.message || error.message || 'Something went wrong';
        this.toastService.show(errMsg, 'error')
      },
    });
  }

  loadDashboard() {
    forkJoin({
      summary: this.requestService.getRequest(SUMMARY_API_URL),
      analytics: this.requestService.getRequest(ANALYTICS_API_URL),
      demographics: this.requestService.getRequest(DEMOGRAPHICS_API_URL),
    }).subscribe({
      next: ({summary, analytics, demographics}: any) => {
        if (summary.status !== 200 || analytics.status !== 200 || demographics.status !== 200) return;

        // Summary
        this.mapStatCards(summary.body.data.stats);
        this.topSurgeons = summary.body.data.topSurgeons ?? [];

        // Analytics
        const analyticsData = analytics.body.data;
        this.totalCases = analyticsData.totalCases ?? 0;
        this.procedures = analyticsData.caseDistribution ?? [];
        this.outcomes = analyticsData.outcomes ?? {};
        this.followupOverallRate = analyticsData.followup?.overallRate ?? 0;
        this.followups = analyticsData.followup?.breakdown ?? [];
        this.ringSegments = this.buildRingSegments(analyticsData.caseDistribution ?? []);

        // Demographics
        const demoData = demographics.body.data;
        this.ageGroups = demoData.ageGroups ?? [];
        this.genderMale = demoData.gender?.malePercent ?? 0;
        this.genderFemale = demoData.gender?.femalePercent ?? 0;
        this.provinces = demoData.provinces ?? [];
      },
      error: (err) => console.error('Dashboard load failed', err),
    });
  }

  // Converts procedure distribution % into SVG stroke-dasharray values
  // circumference of r=48 circle = 2 * π * 48 ≈ 301.6
  buildRingSegments(procedures: any[]): any[] {
    const CIRCUMFERENCE = 301.6;
    const COLORS = ['#2251CC', '#E8344A', '#0EA5A0', '#F59E0B', '#5B4FCF', '#10B981'];
    let offset = -90; // start at top

    return procedures.map((p, i) => {
      const arc = (p.percentage / 100) * CIRCUMFERENCE;
      const gap = CIRCUMFERENCE - arc;
      const rotation = offset;
      offset += (p.percentage / 100) * 360;

      return {
        label: p.label,
        percentage: p.percentage,
        count: p.count,
        color: COLORS[i % COLORS.length],
        dasharray: `${arc.toFixed(1)} ${gap.toFixed(1)}`,
        rotation: `rotate(${rotation} 60 60)`,
      };
    });
  }

  getUserInitials(surgeon: any): string {
    if (!surgeon?.name) return '?';
    const parts = surgeon.name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0][0].toUpperCase();
  }

  mapStatCards(stats: any) {
    this.statCards = [
      {
        _id: 1, label: 'Total Patients',
        value: stats.totalPatients.value,
        trend: stats.totalPatients.trend,
        trendType: stats.totalPatients.trendType,
        barWidth: stats.totalPatients.barWidth,
        barColor: '#2251CC', accentColor: '#2251CC',
        bgColor: '#EEF2FF', icon: './assets/images/pending.svg',
      },
      {
        _id: 2, label: 'Total Cases',
        value: stats.totalCases.value,
        trend: stats.totalCases.trend,
        trendType: stats.totalCases.trendType,
        barWidth: stats.totalCases.barWidth,
        barColor: '#0EA5A0', accentColor: '#0EA5A0',
        bgColor: '#F0FDFA', icon: './assets/images/ActiveCases.svg',
      },
      {
        _id: 3, label: 'Active Doctors',
        value: stats.activeDoctors.value,
        trend: stats.activeDoctors.trend,
        trendType: stats.activeDoctors.trendType,
        barWidth: stats.activeDoctors.barWidth,
        barColor: '#5B4FCF', accentColor: '#5B4FCF',
        bgColor: '#F5F3FF', icon: './assets/images/doctor.svg',
      },
      {
        _id: 4, label: 'Cases This Month',
        value: stats.casesThisMonth.value,
        trend: stats.casesThisMonth.trend,
        trendType: stats.casesThisMonth.trendType,
        barWidth: stats.casesThisMonth.barWidth,
        barColor: '#F59E0B', accentColor: '#F59E0B',
        bgColor: '#FFFBEB', icon: './assets/images/RecoveryRate.svg',
      },
    ];
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
        // card.value = Math.round(ease * target);
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
}
