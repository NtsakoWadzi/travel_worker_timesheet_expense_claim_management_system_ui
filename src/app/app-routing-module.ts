import { NgModule } from '@angular/core';

import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';

import { Timesheet } from './timesheet/timesheet';
import { Claims } from './claims/claims';
import { ApproveClaims } from './approve-claims/approve-claims';
import { ClaimStatus } from './claim-status/claim-status';

 

const routes: Routes = [

  { path: '',component: LoginComponent,},
  { path: 'timesheet',component: Timesheet,},
  { path: 'claims',component: Claims, },
  { path: 'claim-status',component: ClaimStatus, },
  { path: 'approve-claims',component: ApproveClaims, },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})

export class AppRoutingModule {}
