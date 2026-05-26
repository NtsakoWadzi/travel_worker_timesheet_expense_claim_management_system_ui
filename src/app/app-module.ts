import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';

import { BrowserModule } from '@angular/platform-browser';

import { ReactiveFormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';

import { MatTableModule } from '@angular/material/table';

import { FormsModule } from '@angular/forms';

import { MatDatepickerModule } from '@angular/material/datepicker';

import { MatInputModule } from '@angular/material/input';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatButtonModule } from '@angular/material/button';

import { MatCardModule } from '@angular/material/card';

import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';

import { AppRoutingModule } from './app-routing-module';

import { App } from './app';

import { LoginComponent } from './login/login.component';

import { Timesheet } from './timesheet/timesheet';

import { MatIconModule } from '@angular/material/icon';

import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Claims } from './claims/claims';
import { MatListModule } from '@angular/material/list';
import { DragDirective } from './drag/drag';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApproveClaims } from './approve-claims/approve-claims';
import { HttpClientModule } from '@angular/common/http';
import { ClaimStatus } from './claim-status/claim-status';
import { BankDetailsComponent } from './bank-details/bank-details';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { ClaimDetailsComponent } from './claim-details/claim-details';
import { GenerateReportsComponent } from './generate-reports/generate-reports';
import { PayClaimsComponent } from './pay-claims/pay-claims';
import { PrivateOwnedComponent } from './private-owned/private-owned';
import { DetailsOfJourneyComponent } from './details-of-journey/details-of-journey';
import { SubsistenceTravelClaimFormComponent } from './subsistence-travel-claim-form/subsistence-travel-claim-form';
import { AuthorisationComponent } from './authorisation/authorisation';
import { SntWorkspaceComponent } from './snt-workspace/snt-workspace';

@NgModule({
  declarations: [App, LoginComponent, Timesheet, Claims, DragDirective, ApproveClaims, ClaimStatus, BankDetailsComponent, AdminDashboardComponent, ClaimDetailsComponent, GenerateReportsComponent, PayClaimsComponent, PrivateOwnedComponent, DetailsOfJourneyComponent, SubsistenceTravelClaimFormComponent, AuthorisationComponent, SntWorkspaceComponent],

  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,

    AppRoutingModule,

    ReactiveFormsModule,

    RouterModule,

    MatInputModule,

    MatFormFieldModule,

    MatButtonModule,

    MatCardModule,

    MatTableModule,

    MatDatepickerModule,

    FormsModule,

    MatNativeDateModule,

    MatIconModule,

    MatTimepickerModule,

    MatSelectModule,
    MatListModule,
    MatOptionModule,
    MatStepperModule,
  ],

  providers: [provideBrowserGlobalErrorListeners()],

  bootstrap: [App],
})
export class AppModule {}
