/**
 * Utility functions for handling user data safely
 */

export function getUserInitials(firstName?: string | null, lastName?: string | null): string {
  const firstInitial = firstName ? firstName.charAt(0) : 'U';
  const lastInitial = lastName ? lastName.charAt(0) : 'N';
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

export function getUserDisplayName(firstName?: string | null, lastName?: string | null): string {
  const first = firstName || 'Unknown';
  const last = lastName || 'User';
  return `${first} ${last}`;
}

export function getUserFirstName(firstName?: string | null): string {
  return firstName || 'Unknown';
}

export function getUserLastName(lastName?: string | null): string {
  return lastName || 'User';
}
