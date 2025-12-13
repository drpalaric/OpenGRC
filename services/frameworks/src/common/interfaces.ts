export interface IUser {
  id: string;
  organizationId: string;
  keycloakId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  permissions?: string[];
}
