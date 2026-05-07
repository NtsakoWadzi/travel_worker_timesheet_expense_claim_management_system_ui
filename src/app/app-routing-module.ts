import { NgModule } from '@angular/core';

import { RouterModule, Routes } from '@angular/router';

 

import { LoginComponent } from './login/login.component';

import { Timesheet } from './timesheet/timesheet';

 

const routes: Routes = [

  {

    path: '',

    component: LoginComponent,

  },

  {

    path: 'timesheet',

    component: Timesheet,

  },

];

 

@NgModule({

  imports: [RouterModule.forRoot(routes)],

  exports: [RouterModule],

})

export class AppRoutingModule {}