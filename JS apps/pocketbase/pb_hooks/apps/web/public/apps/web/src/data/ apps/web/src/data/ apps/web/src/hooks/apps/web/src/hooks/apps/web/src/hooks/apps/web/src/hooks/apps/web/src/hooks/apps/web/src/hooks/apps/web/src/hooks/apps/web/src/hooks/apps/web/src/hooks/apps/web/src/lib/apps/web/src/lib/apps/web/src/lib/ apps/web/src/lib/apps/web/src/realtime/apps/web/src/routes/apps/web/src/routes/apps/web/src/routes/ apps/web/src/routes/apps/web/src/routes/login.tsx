import type { Route } from './+types/login';
import { seo } from '@/lib/seo';
import { heroImage } from '@/data/clearpath';
import { LoginPanel } from '@/components/login/login-panel';
export function meta({ matches, location }: Route.MetaArgs) { return seo({ matches, location }, { title: 'Advisor sign in | Student Loans Solutions', description: 'Sign in to the private Student Loans Solutions advisor workspace to manage student loan guidance inquiries and follow-ups.', image: heroImage, noindex: true }); }
export default function LoginPage() { return <LoginPanel/>; }
