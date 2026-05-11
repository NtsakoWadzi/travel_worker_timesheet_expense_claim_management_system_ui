import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FileHandle } from '../Model/file-handle.model';
import { Claim } from '../Model/claim.model';

@Component({
  selector: 'app-claims',
  standalone: false,
  templateUrl: './claims.html',
  styleUrl: './claims.css',
})

export class Claims {
  typesOfClaims: string[] = ['Meals', 'Fuel', 'Accommodation', 'Parking', 'Toll Fees', 'Other'];
  singleclaim: Claim = {
    ClaimDate: new Date(),
    totalAmount: '',
    userId: undefined,
    categories: [],
    claimImages: [],
  };

  constructor(private sanitizer: DomSanitizer) { }
  fileDropped(fileHandle: FileHandle): void {
    this.singleclaim.claimImages.push(fileHandle);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];
    const fileHandle: FileHandle = {
      file, url: this.sanitizer.bypassSecurityTrustUrl(
        window.URL.createObjectURL(file)
      ),
    };
    this.singleclaim.claimImages.push(fileHandle);
    input.value = '';
  }

  removeImages(i: number): void {
    this.singleclaim.claimImages.splice(i, 1);
  }
}