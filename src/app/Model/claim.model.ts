import { FileHandle } from "./file-handle.model";

export interface Claim{
    ClaimDate?: Date;
    claimDate?: Date | string;
    userId?: number;
    userName?: string;
    categories: string[] | string;
    claimImages: FileHandle[];
    status?: boolean | string;
    claimId?: number;
    claimReference?: string;
    localSubmitted?: boolean;
    managerId?: number;
    managerMessage?: string;
    managerComment?: string;
    managerRemarks?: string;
    decisionReason?: string;
    statusReason?: string;
    approvalReason?: string;
    rejectionReason?: string;
    userSubmissionCount?: number;
    total_amount?: number;
    claimDescription?: string;
    departureDate?: string;
    arrivalDateTime?: string;
    dateNumberOfDays?: number;
    departureTime?: string;
    arrivalTime?: string;
    timeNumberOfDays?: number;
    numberOfHours?: number;
    claimDetails?: ClaimDetail[];
    timesheetDetails?: ClaimTimesheet[];
    bankDetails?: BankDetails;
}

export interface ClaimTimesheet {
    timesheetId?: number;
    userId?: number;
    workDate: Date | string;
    startTime: Date | string;
    endTime: Date | string;
    total_hours?: number;
    location: string;
    description?: string;
    status?: boolean;
}

export interface BankDetails {
    bankDetailsId?: number;
    claimId?: number;
    userId?: number;
    bankName: string;
    accountNumber: string;
    accountType: string;
}

export interface ClaimImageResponse {
    imageId: number;
    fileName: string;
    contentType?: string;
    imageUrl: string;
}

export interface UserClaimCountResponse {
    userSubmissionCount: number;
}

export interface ClaimStatusSummary {
    claims: Claim[];
    submittedCount: number;
    approvedCount: number;
    rejectedCount: number;
    hasLoaded: boolean;
}

export interface ClaimDetail {
    claimDetailId?: number;
    claimId?: number;
    category: string;
    detailType?: string;
    description?: string;
    kilometers?: number;
    vehicleType?: 'Petrol' | 'Diesel' | string;
    engineSizeCc?: number;
    receiptTime?: string;
    amount?: number;
    allowedAmount?: number;
    reimbursableAmount?: number;
    receiptFileName?: string;
    receiptContentType?: string;
    receiptUrl?: string;
}

export interface ClaimCalculationResponse {
    claimId: number;
    claimReference?: string;
    claimDate?: Date | string;
    totalAmount: number;
    details: ClaimDetail[];
    bankDetails?: BankDetails;
}

export interface PaymentResponse {
    paymentId?: number;
    claimId: number;
    paymentDate?: string;
    reference?: string;
    status?: boolean;
    processedBy?: string;
}
