import { NgModule } from '@angular/core';

import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';

import { Timesheet } from './timesheet/timesheet';
import { Claims } from './claims/claims';
import { ApproveClaims } from './approve-claims/approve-claims';
import { ClaimStatus } from './claim-status/claim-status';
import { BankDetailsComponent } from './bank-details/bank-details';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { ClaimDetailsComponent } from './claim-details/claim-details';
import { PayClaimsComponent } from './pay-claims/pay-claims';
import { PrivateOwnedComponent } from './private-owned/private-owned';
import { DetailsOfJourneyComponent } from './details-of-journey/details-of-journey';
import { SubsistenceTravelClaimFormComponent } from './subsistence-travel-claim-form/subsistence-travel-claim-form';
import { AuthorisationComponent } from './authorisation/authorisation';

 

const routes: Routes = [

  { path: '',component: LoginComponent,},
  { path: 'claim-details',component: ClaimDetailsComponent, },
  { path: 'timesheet',redirectTo: 'claim-details', pathMatch: 'full',},
  { path: 'claims',redirectTo: 'claim-details', pathMatch: 'full', },
  { path: 'bank-details',redirectTo: 'claim-details', pathMatch: 'full', },
  { path: 'claim-status',component: ClaimStatus, },
  { path: 'approve-claims',component: ApproveClaims, },
  { path: 'subsistence-travel-claim-form',component: SubsistenceTravelClaimFormComponent, },
  { path: 'authorisation',component: AuthorisationComponent, },
  { path: 'pay-claims/:claimId',component: PayClaimsComponent, },
  { path: 'admin-dashboard',component: AdminDashboardComponent, },
  { path: 'private-owned',component: PrivateOwnedComponent, },
  { path: 'details-of-journey',component: DetailsOfJourneyComponent, },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})

export class AppRoutingModule {}
