import { redirect } from 'next/navigation';

/** Old link-based reset URL; recovery is now OTP on /auth/forgot-password */
export default function UpdatePasswordRedirectPage() {
  redirect('/auth/forgot-password');
}
