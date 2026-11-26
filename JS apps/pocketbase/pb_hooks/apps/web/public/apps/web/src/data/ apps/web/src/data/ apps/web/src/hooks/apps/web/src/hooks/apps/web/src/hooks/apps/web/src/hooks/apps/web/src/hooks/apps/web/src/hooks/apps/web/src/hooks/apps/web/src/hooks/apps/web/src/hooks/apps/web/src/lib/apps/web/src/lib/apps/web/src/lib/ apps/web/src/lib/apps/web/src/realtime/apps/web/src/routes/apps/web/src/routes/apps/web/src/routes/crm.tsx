import { redirect } from 'react-router';
import type { Route } from './+types/crm';
import { requireAuth } from '@/lib/require-auth';
import { seo } from '@/lib/seo';
import { heroImage } from '@/data/clearpath';
import { Workspace } from '@/components/crm/workspace';
export function meta({ matches, location }: Route.MetaArgs) { return seo({ matches, location }, { title: 'Advisor workspace | Student Loans Solutions', description: 'Private Student Loans Solutions CRM for authorized advisors to manage inquiries, pipeline statuses, notes, and student loan guidance follow-ups.', image: heroImage, noindex: true }); }
export function clientLoader() { const user = requireAuth(); if (user.role !== 'admin') throw redirect('/login'); return {}; }
clientLoader.hydrate = true as const;
export function HydrateFallback() { return <main className="crm-empty" role="status">Opening your secure workspace…</main>; }
export default function CrmPage() { return <Workspace/>; }
