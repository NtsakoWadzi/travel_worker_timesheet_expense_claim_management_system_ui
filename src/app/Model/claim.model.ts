import { FileHandle } from "./file-handle.model";

export interface Claim{
    ClaimDate: Date;
    totalAmount: string;
    userId?: number;
    categories: string[];
    claimImages: FileHandle[];
}