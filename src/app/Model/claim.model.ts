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
    managerId?: number;
    userSubmissionCount?: number;
    total_amount?: number;
    claimDetails?: ClaimDetail[];
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
    totalAmount: number;
    details: ClaimDetail[];
}

export interface ReceiptAnalysisResponse {
    receiptTime?: string;
    amount?: number;
    mealType?: string;
    rawText?: string;
    message?: string;
}
