import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { FinanceClaim, FinanceDashboard, FinancePayment, FinanceService } from '../services/finance-service';

type WorkspaceSection = 'dashboard' | 'employees' | 'finance' | 'audit-logs';
type FinanceView = 'dashboard' | 'queue' | 'payments' | 'approved' | 'reports' | 'audit';

interface MetricCard {
  label: string;
  value: string;
  tone: 'neutral' | 'warning' | 'success' | 'danger';
}

interface WorkspaceLink {
  label: string;
  route: string;
  icon: string;
}

interface FinanceNavItem {
  label: string;
  icon: string;
  view: FinanceView;
}

interface FinanceListItem {
  claimId?: number;
  reference: string;
  employee: string;
  status: string;
  amount: string;
}

@Component({
  selector: 'app-snt-workspace',
  standalone: false,
  templateUrl: './snt-workspace.html',
  styleUrl: './snt-workspace.css',
})
export class SntWorkspaceComponent {
  section: WorkspaceSection = 'dashboard';
  financeView: FinanceView = 'dashboard';
  userName = 'User';

  navigation: WorkspaceLink[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
    { label: 'Employees', route: '/employees', icon: 'badge' },
    { label: 'Travel Authorisations', route: '/travel-authorisations', icon: 'flight_takeoff' },
    { label: 'Claims', route: '/claims', icon: 'receipt_long' },
    { label: 'Mileage', route: '/mileage', icon: 'directions_car' },
    { label: 'Approvals', route: '/approvals', icon: 'task_alt' },
    { label: 'Finance', route: '/finance', icon: 'payments' },
    { label: 'Reports', route: '/reports', icon: 'bar_chart' },
    { label: 'Audit Logs', route: '/audit-logs', icon: 'history' },
  ];

  financeNavigation: FinanceNavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', view: 'dashboard' },
    { label: 'Finance Queue', icon: 'pending_actions', view: 'queue' },
    { label: 'Payment Processing', icon: 'payments', view: 'payments' },
    { label: 'Approved Claims', icon: 'task_alt', view: 'approved' },
    { label: 'Reports', icon: 'bar_chart', view: 'reports' },
    { label: 'Audit Logs', icon: 'history', view: 'audit' },
  ];

  metrics: MetricCard[] = [
    { label: 'Total claims submitted', value: '128', tone: 'neutral' },
    { label: 'Pending approvals', value: '24', tone: 'warning' },
    { label: 'Approved claims', value: '76', tone: 'success' },
    { label: 'Rejected claims', value: '8', tone: 'danger' },
    { label: 'Paid claims', value: '63', tone: 'success' },
    { label: 'Awaiting logistics', value: '11', tone: 'warning' },
    { label: 'Awaiting finance', value: '17', tone: 'warning' },
    { label: 'Total claim value', value: 'R 486,920', tone: 'neutral' },
  ];

  employeeFields = [
    'Employee ID',
    'PERSAL number',
    'Initials',
    'Surname',
    'Cellphone',
    'Email',
    'Department',
    'Directorate',
    'Region',
    'Rank',
    'Supervisor',
    'Cost centre',
  ];

  financeQueue: FinanceListItem[] = [
    { reference: 'ST-2026-0048', employee: 'P. Dlamini', status: 'Awaiting Finance', amount: 'R 1,920.00' },
    { reference: 'ST-2026-0050', employee: 'K. Naidoo', status: 'Logistics Verified', amount: 'R 7,315.50' },
    { reference: 'ST-2026-0054', employee: 'A. Khumalo', status: 'Awaiting Finance', amount: 'R 3,680.00' },
  ];

  financeMetrics: MetricCard[] = [
    { label: 'Awaiting finance review', value: '18', tone: 'warning' },
    { label: 'Payment approvals', value: '9', tone: 'neutral' },
    { label: 'Allocation checks', value: '12', tone: 'warning' },
    { label: 'Paid this month', value: 'R 214,360', tone: 'success' },
  ];

  paymentApprovals: FinanceListItem[] = [
    { reference: 'ST-2026-0041', employee: 'N. Mokoena', status: 'Ready for Payment', amount: 'R 4,850.00' },
    { reference: 'ST-2026-0043', employee: 'L. Maseko', status: 'Payment Approval', amount: 'R 2,540.00' },
    { reference: 'ST-2026-0047', employee: 'S. Adams', status: 'Payment Approval', amount: 'R 6,115.00' },
  ];

  approvedClaims: FinanceListItem[] = [
    { reference: 'ST-2026-0036', employee: 'T. Molefe', status: 'Finance Approved', amount: 'R 5,220.00' },
    { reference: 'ST-2026-0039', employee: 'R. Jacobs', status: 'Finance Approved', amount: 'R 1,880.50' },
    { reference: 'ST-2026-0040', employee: 'M. Sithole', status: 'Finance Approved', amount: 'R 8,430.00' },
  ];

  paymentHistory: FinanceListItem[] = [
    { reference: 'ST-2026-0027', employee: 'B. Nkosi', status: 'Paid', amount: 'R 3,125.00' },
    { reference: 'ST-2026-0029', employee: 'D. Pillay', status: 'Paid', amount: 'R 7,980.00' },
    { reference: 'ST-2026-0031', employee: 'J. Smith', status: 'Paid', amount: 'R 2,460.00' },
  ];

  financeReports = [
    'Claims awaiting finance review',
    'Payment approvals',
    'Allocation verification exceptions',
    'Payment history',
  ];

  auditEvents = [
    { action: 'Submitted', subject: 'ST-2026-0050', actor: 'Employee', time: '2026-05-26 09:12' },
    { action: 'Logistics Verified', subject: 'ST-2026-0048', actor: 'Logistics', time: '2026-05-26 08:40' },
    { action: 'Document uploaded', subject: 'Google Maps proof', actor: 'Employee', time: '2026-05-25 16:22' },
    { action: 'Tariff updated', subject: 'Circular 292 rates', actor: 'Admin', time: '2026-05-25 14:08' },
  ];

  allocationCodes = [
    '0436',
    '0717',
    '0462',
    '0463',
    '0497',
    '0498',
    '0499',
    '0469',
    '0470',
    '0515',
    '0494',
    '0588',
    '0674',
    '0614',
    '0476',
    '0477',
    '0473',
    '0444',
    '0500',
    '0501',
    '0589',
    '0464',
    '0465',
    '0504',
    '0650',
    '0043',
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private financeService: FinanceService
  ) {
    const user = this.authService.getUser();
    this.userName = user?.userFirstName && user?.userLastName
      ? `${user.userFirstName} ${user.userLastName}`
      : user?.userName || 'User';

    this.route.data.subscribe((data) => {
      this.section = (data['section'] || 'dashboard') as WorkspaceSection;
      if (this.section === 'finance') {
        this.loadFinanceData();
      }
    });
  }

  get title(): string {
    if (this.section === 'employees') return 'Employee Management';
    if (this.section === 'finance') return this.financeTitle;
    if (this.section === 'audit-logs') return 'Audit Trail';
    return 'S&T Dashboard';
  }

  get description(): string {
    if (this.section === 'employees') return 'Admin CRUD surface for PERSAL-linked employee records and reporting lines.';
    if (this.section === 'finance') return 'Finance workspace for review queues, payment approvals, allocation verification, reports, and payment history.';
    if (this.section === 'audit-logs') return 'Immutable event timeline for submissions, approvals, document uploads, and configuration changes.';
    return 'Enterprise overview for travel authorisations, subsistence claims, mileage, logistics, finance, and compliance.';
  }

  get financeTitle(): string {
    if (this.financeView === 'queue') return 'Finance Queue';
    if (this.financeView === 'payments') return 'Payment Processing';
    if (this.financeView === 'approved') return 'Approved Claims';
    if (this.financeView === 'reports') return 'Finance Reports';
    if (this.financeView === 'audit') return 'Finance Audit Logs';
    return 'Finance Dashboard';
  }

  get roleLabel(): string {
    return this.section === 'finance' ? 'Finance' : 'Role-based access';
  }

  get isFinanceWorkspace(): boolean {
    return this.section === 'finance';
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  selectFinanceView(view: FinanceView): void {
    this.financeView = view;
  }

  approveFinanceClaim(claim: FinanceListItem): void {
    if (!claim.claimId) return;

    this.financeService.approveClaim(claim.claimId).subscribe({
      next: () => this.loadFinanceData(),
    });
  }

  payFinanceClaim(claim: FinanceListItem): void {
    if (!claim.claimId) return;

    this.financeService.payClaim(claim.claimId).subscribe({
      next: () => this.loadFinanceData(),
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  private loadFinanceData(): void {
    this.financeService.getDashboard().subscribe({
      next: (dashboard) => this.applyFinanceDashboard(dashboard),
    });

    this.financeService.getQueue().subscribe({
      next: (claims) => {
        const mappedClaims = claims.map((claim) => this.mapFinanceClaim(claim));
        this.financeQueue = mappedClaims;
        this.paymentApprovals = mappedClaims.filter((claim) =>
          ['Payment Approval', 'Ready for Payment'].includes(claim.status)
        );
      },
    });

    this.financeService.getApprovedClaims().subscribe({
      next: (claims) => this.approvedClaims = claims.map((claim) => this.mapFinanceClaim(claim)),
    });

    this.financeService.getPaidClaims().subscribe({
      next: (claims) => this.paymentHistory = claims.map((claim) => this.mapFinanceClaim(claim)),
    });

    this.financeService.getPayments().subscribe({
      next: (payments) => {
        if (payments.length > 0) {
          this.paymentHistory = payments.map((payment) => this.mapFinancePayment(payment));
        }
      },
    });
  }

  private applyFinanceDashboard(dashboard: FinanceDashboard): void {
    this.financeMetrics = [
      { label: 'Awaiting finance review', value: String(dashboard.awaitingFinanceReview || 0), tone: 'warning' },
      { label: 'Payment approvals', value: String(dashboard.paymentApprovals || 0), tone: 'neutral' },
      { label: 'Allocation checks', value: String(dashboard.financeApproved || 0), tone: 'warning' },
      { label: 'Paid this month', value: this.formatCurrency(dashboard.paidThisMonth || 0), tone: 'success' },
    ];
  }

  private mapFinanceClaim(claim: FinanceClaim): FinanceListItem {
    return {
      claimId: claim.claimId,
      reference: claim.claimReference || `CLM-${claim.claimId}`,
      employee: claim.userName || `User ${claim.userId}`,
      status: claim.status || 'Submitted',
      amount: this.formatCurrency(claim.total_amount || 0),
    };
  }

  private mapFinancePayment(payment: FinancePayment): FinanceListItem {
    return {
      reference: payment.reference || `PAY-${payment.paymentId}`,
      employee: payment.processedBy || 'Finance',
      status: payment.status ? 'Paid' : 'Pending',
      amount: '',
    };
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount || 0);
  }
}
