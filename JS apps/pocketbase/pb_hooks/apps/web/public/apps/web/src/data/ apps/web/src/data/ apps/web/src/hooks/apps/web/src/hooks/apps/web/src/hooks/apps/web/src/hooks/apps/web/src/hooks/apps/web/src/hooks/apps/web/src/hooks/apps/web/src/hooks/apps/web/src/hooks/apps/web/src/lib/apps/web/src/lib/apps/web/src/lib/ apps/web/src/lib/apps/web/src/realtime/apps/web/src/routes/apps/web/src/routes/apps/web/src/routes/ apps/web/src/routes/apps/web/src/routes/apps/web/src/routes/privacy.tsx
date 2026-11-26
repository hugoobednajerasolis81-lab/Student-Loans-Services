import type { Route } from './+types/privacy';
import { seo } from '@/lib/seo';
import { heroImage } from '@/data/clearpath';
import { PrivacyContent } from '@/components/privacy/privacy-content';
export function meta({ matches, location }: Route.MetaArgs) { return seo({ matches, location }, { title: 'Privacy policy | Student Loans Solutions', description: 'Learn how Student Loans Solutions collects and protects your student loan inquiry information, how it is used, and the choices available to you.', image: heroImage }); }
export default function PrivacyPage() { return <PrivacyContent/>; }
