import { redirect } from 'next/navigation';

export default function JobsPage() {
  // Redirect to main dashboard where job matches are now shown
  redirect('/dashboard');
}