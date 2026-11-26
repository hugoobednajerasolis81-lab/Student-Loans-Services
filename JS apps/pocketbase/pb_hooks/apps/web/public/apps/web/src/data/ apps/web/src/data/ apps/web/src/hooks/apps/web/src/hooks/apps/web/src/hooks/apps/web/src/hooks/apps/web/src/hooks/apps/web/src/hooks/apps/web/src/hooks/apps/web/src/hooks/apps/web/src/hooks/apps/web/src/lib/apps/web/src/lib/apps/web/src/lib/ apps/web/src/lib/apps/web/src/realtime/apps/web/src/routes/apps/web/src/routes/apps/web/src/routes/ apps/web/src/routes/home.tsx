import type { Route } from './+types/home';
import { seo } from '@/lib/seo';
import { Hero } from '@/components/home/hero';
import { Programs } from '@/components/home/programs';
import { Process } from '@/components/home/process';
import { Inquiry } from '@/components/home/inquiry';
import { Questions } from '@/components/home/questions';
import { heroImage, faqs } from '@/data/clearpath';
export function meta({ matches, location }: Route.MetaArgs) {
 return seo({ matches, location }, { title: 'Student Loans Solutions | A clearer path through student loans', description: 'Understand student loan forgiveness, explore federal relief programs, and send a free inquiry. Independent guidance for your next chapter.', image: heroImage, jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Student Loans Solutions', description: 'Independent student loan education and guidance' }, { '@context': 'https://schema.org', '@type': 'Organization', name: 'Student Loans Solutions', description: 'Independent student loan guidance website. Not a government agency.' }, { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } })) }] });
}
export default function HomePage() { return <main><Hero/><Programs/><Process/><Inquiry/><Questions/></main>; }
