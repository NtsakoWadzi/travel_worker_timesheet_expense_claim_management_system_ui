import { NgModule } from '@angular/core';

import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';

import { Timesheet } from './timesheet/timesheet';
import { Claims } from './claims/claims';
import { ApproveClaims } from './approve-claims/approve-claims';

 

const routes: Routes = [

  { path: '',component: LoginComponent,},
  { path: 'timesheet',component: Timesheet,},
  { path: 'claims',component: Claims, },
  { path: 'approve-claims',component: ApproveClaims, },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})

export class AppRoutingModule {}