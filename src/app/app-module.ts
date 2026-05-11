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
import { Claims } from './claims/claims';
import { MatListModule } from '@angular/material/list';
import { DragDirective } from './drag/drag';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApproveClaims } from './approve-claims/approve-claims';

@NgModule({
  declarations: [App, LoginComponent, Timesheet, Claims, DragDirective, ApproveClaims],

  imports: [
    BrowserModule,
    BrowserAnimationsModule,

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
  ],

  providers: [provideBrowserGlobalErrorListeners()],

  bootstrap: [App],
})
export class AppModule {}
