import { Injectable } from '@angular/core';
import { BankDetails } from '../Model/claim.model';

@Injectable({
  providedIn: 'root',
})
export class BankDetailsService {
  private readonly storageKey = 'claimBankDetails';

  getBankDetails(): BankDetails | undefined {
    const value = localStorage.getItem(this.storageKey);
    return value ? JSON.parse(value) as BankDetails : undefined;
  }

  saveBankDetails(bankDetails: BankDetails): void {
    localStorage.setItem(this.storageKey, JSON.stringify(bankDetails));
  }

  clearBankDetails(): void {
    localStorage.removeItem(this.storageKey);
  }
}
