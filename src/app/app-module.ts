
import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';

import { BrowserModule } from '@angular/platform-browser';

import { ReactiveFormsModule } from '@angular/forms';

import { RouterModule } from '@angular/router';

import { MatTableModule } from '@angular/material/table'

import { FormsModule } from '@angular/forms';
 
import {MatDatepickerModule} from '@angular/material/datepicker';

import { MatInputModule } from '@angular/material/input';

import { MatFormFieldModule } from '@angular/material/form-field';

import { MatButtonModule } from '@angular/material/button';

import { MatCardModule } from '@angular/material/card';

 import { MatNativeDateModule } from '@angular/material/core';

import { AppRoutingModule } from './app-routing-module';

import { App } from './app';

import { LoginComponent } from './login/login.component';

import { Timesheet } from './timesheet/timesheet';


import { MatIconModule } from '@angular/material/icon';


import {MatTimepickerModule } from '@angular/material/timepicker';
import { MatSelectModule } from '@angular/material/select';
 

@NgModule({

  declarations: [

    App,

    LoginComponent,

    Timesheet,

  ],

  imports: [

    BrowserModule,

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

MatSelectModule




 


  ],

  providers: [

    provideBrowserGlobalErrorListeners(),

  ],

  bootstrap: [

    App,

  ],

})

export class AppModule {}