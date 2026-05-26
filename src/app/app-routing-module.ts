import { NgModule } from '@angular/core';

import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';

import { ApproveClaims } from './approve-claims/approve-claims';
import { ClaimStatus } from './claim-status/claim-status';
import { ClaimDetailsComponent } from './claim-details/claim-details';
import { PayClaimsComponent } from './pay-claims/pay-claims';
import { PrivateOwnedComponent } from './private-owned/private-owned';
import { DetailsOfJourneyComponent } from './details-of-journey/details-of-journey';
import { SubsistenceTravelClaimFormComponent } from './subsistence-travel-claim-form/subsistence-travel-claim-form';
import { AuthorisationComponent } from './authorisation/authorisation';
import { GenerateReportsComponent } from './generate-reports/generate-reports';
import { SntWorkspaceComponent } from './snt-workspace/snt-workspace';
import { AdminAuthGuard } from './services/admin-auth-guard';
import { FinanceAuthGuard } from './services/finance-auth-guard';

 

const routes: Routes = [

  { path: '',component: LoginComponent,},
  { path: 'dashboard', component: SntWorkspaceComponent, canActivate: [AdminAuthGuard], data: { section: 'dashboard' } },
  { path: 'employees', component: SntWorkspaceComponent, canActivate: [AdminAuthGuard], data: { section: 'employees' } },
  { path: 'travel-authorisations', component: AuthorisationComponent },
  { path: 'mileage', component: PrivateOwnedComponent },
  { path: 'approvals', component: ApproveClaims },
  { path: 'finance', component: SntWorkspaceComponent, canActivate: [FinanceAuthGuard], data: { section: 'finance' } },
  { path: 'reports', component: GenerateReportsComponent },
  { path: 'admin', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'audit-logs', component: SntWorkspaceComponent, canActivate: [AdminAuthGuard], data: { section: 'audit-logs' } },
  { path: 'claim-details',component: ClaimDetailsComponent, },
  { path: 'timesheet',redirectTo: 'claim-details', pathMatch: 'full',},
  { path: 'claims',component: ClaimDetailsComponent, },
  { path: 'bank-details',redirectTo: 'claim-details', pathMatch: 'full', },
  { path: 'claim-status',component: ClaimStatus, },
  { path: 'approve-claims',component: ApproveClaims, },
  { path: 'subsistence-travel-claim-form',component: SubsistenceTravelClaimFormComponent, },
  { path: 'authorisation',component: AuthorisationComponent, },
  { path: 'pay-claims/:claimId',component: PayClaimsComponent, },
  { path: 'admin-dashboard',redirectTo: 'dashboard', pathMatch: 'full', },
  { path: 'private-owned',component: PrivateOwnedComponent, },
  { path: 'details-of-journey',component: DetailsOfJourneyComponent, },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})

export class AppRoutingModule {}
