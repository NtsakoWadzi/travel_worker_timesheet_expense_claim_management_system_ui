import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Login } from './login/login.component';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
@NgModule({
  declarations: [App, Login],
  imports: [BrowserModule, AppRoutingModule, ReactiveFormsModule, MatInputModule, MatFormFieldModule , MatButtonModule , MatCardModule, RouterModule],
  providers: [provideBrowserGlobalErrorListeners()],
  bootstrap: [App],
})
export class AppModule {}
