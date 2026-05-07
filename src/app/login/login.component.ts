import { Component, OnInit } from '@angular/core';

import { FormGroup, FormControl, Validators } from '@angular/forms';

import { Router } from '@angular/router';

import { AuthService } from '../services/auth';

 

@Component({

  selector: 'app-login',

  standalone: false,

  templateUrl: './login.html',

  styleUrls: ['./login.css'],

})

export class LoginComponent implements OnInit {

  loginForm!: FormGroup;

  errorMessage = '';

  isLoading = false;

 

  constructor(

    private authService: AuthService,

    private router: Router

  ) {}

 

  ngOnInit() {

    this.loginForm = new FormGroup({

      userName: new FormControl('', Validators.required),

      userPassword: new FormControl('', Validators.required),

    });

  }

 

  onSubmit() {

    if (this.loginForm.invalid) return;

 

    this.isLoading = true;

    this.errorMessage = '';

 

    const { userName, userPassword } = this.loginForm.value;

 

    this.authService.login(userName, userPassword).subscribe({

      next: (response) => {

        this.authService.saveToken(response.jwtToken);

        this.authService.saveUser(response.user);

        this.router.navigate(['/timesheet']);

      },

      error: (err) => {

        this.isLoading = false;

        this.errorMessage = 'Invalid username or password';

        console.error(err);

      },

    });

  }

}