import { redirect } from 'next/navigation';

export default function StudentAttendanceRedirectPage() {
  redirect('/student#attendance');
}
