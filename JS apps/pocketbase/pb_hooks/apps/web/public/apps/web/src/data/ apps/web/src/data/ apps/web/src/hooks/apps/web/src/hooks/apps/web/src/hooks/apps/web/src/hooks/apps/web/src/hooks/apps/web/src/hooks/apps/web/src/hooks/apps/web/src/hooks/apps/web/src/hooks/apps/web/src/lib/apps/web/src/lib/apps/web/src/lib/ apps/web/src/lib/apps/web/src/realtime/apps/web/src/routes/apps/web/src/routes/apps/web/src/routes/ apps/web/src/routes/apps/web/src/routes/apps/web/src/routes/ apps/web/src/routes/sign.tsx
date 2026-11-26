import type { Route } from './+types/sign';
import type { RecordModel } from 'pocketbase';
import { data } from 'react-router';
import { seo } from '@/lib/seo';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import { SignPanel } from '@/components/sign/sign-panel';

export type AgreementView = {
	id: string;
	title: string;
	body: string;
	status: string;
	leadName: string;
	leadEmail: string;
	sentAt: string | null;
	signedAt: string | null;
	signerName: string | null;
} | null;

export function meta({ matches, location }: Route.MetaArgs) {
	return seo({ matches, location }, {
		title: 'Review & sign | Student Loans Solutions',
		description: 'Review and electronically sign your document from Student Loans Solutions.',
		noindex: true,
	});
}

// public-route: token-based e-signature access — the unguessable token in the URL
// is the capability that lets the named borrower view and sign this document.
export async function loader({ params }: Route.LoaderArgs): Promise<{ agreement: AgreementView }> {
	const token = params.token;
	if (!token) throw new Response('Not found', { status: 404 });

	try {
		const result = await pocketbaseAdmin.listRecords<RecordModel>('agreements', {
			filter: pocketbaseAdmin.filter('token = {:token}', { token }),
			perPage: 1,
			expand: 'lead',
		});

		const rec: RecordModel | undefined = result.items[0];
		if (!rec) return { agreement: null };

		// Best-effort: record the first time the borrower opened the document.
		if (rec.status === 'sent' && !rec.viewed_at) {
			try {
				await pocketbaseAdmin.updateRecord('agreements', rec.id, { viewed_at: new Date().toISOString() });
			} catch {
				// Non-fatal: the audit trail still captures the signature itself.
			}
		}

		const lead = rec.expand?.lead;
		return {
			agreement: {
				id: rec.id,
				title: rec.title,
				body: rec.body,
				status: rec.status,
				leadName: lead?.name ?? '',
				leadEmail: lead?.email ?? '',
				sentAt: rec.sent_at ?? null,
				signedAt: rec.signed_at ?? null,
				signerName: rec.signer_name ?? null,
			},
		};
	} catch {
		return { agreement: null };
	}
}

export async function action({ request, params }: Route.ActionArgs) {
	const token = params.token;
	if (!token) return data({ error: 'Invalid signing link.' }, { status: 400 });

	const form = await request.formData();
	const signerName = String(form.get('signer_name') ?? '').trim();
	const consent = form.get('consent') === 'on';

	if (!signerName) return data({ error: 'Please type your full legal name to sign.' }, { status: 400 });
	if (signerName.length > 120) return data({ error: 'The name you entered is too long.' }, { status: 400 });
	if (!consent) return data({ error: 'You must confirm your consent to sign electronically.' }, { status: 400 });

	try {
		const result = await pocketbaseAdmin.listRecords<RecordModel>('agreements', {
			filter: pocketbaseAdmin.filter('token = {:token}', { token }),
			perPage: 1,
		});

		const rec: RecordModel | undefined = result.items[0];
		if (!rec) return data({ error: 'This signing link is invalid or has expired.' }, { status: 404 });
		if (rec.status === 'signed') return data({ error: 'This document has already been signed.' }, { status: 409 });
		if (rec.status !== 'sent') return data({ error: 'This document is no longer available for signature.' }, { status: 409 });

		const forwarded = request.headers.get('x-forwarded-for');
		const ip = (forwarded ? forwarded.split(',')[0]!.trim() : '') || 'unknown';
		const userAgent = (request.headers.get('user-agent') ?? '').slice(0, 500);

		await pocketbaseAdmin.updateRecord('agreements', rec.id, {
			status: 'signed',
			signer_name: signerName,
			signer_consent: true,
			signer_ip: ip,
			signer_user_agent: userAgent,
			signed_at: new Date().toISOString(),
		});

		return data({ ok: true });
	} catch {
		return data({ error: 'We could not complete your signature. Please try again.' }, { status: 500 });
	}
}

export default function SignPage({ loaderData, actionData }: Route.ComponentProps) {
	return <SignPanel agreement={loaderData.agreement} actionData={actionData} />;
}
