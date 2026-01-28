export class AdminTokenResponseDto {
  id: string;
  token: string;
  shortCode: string;
  permissions: string[];
  expiresAt: Date | null;
  isActivated: boolean;
  isRevoked: boolean;
  createdAt: Date;
  activatedAt: Date | null;
  createdBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  assignedToUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}
