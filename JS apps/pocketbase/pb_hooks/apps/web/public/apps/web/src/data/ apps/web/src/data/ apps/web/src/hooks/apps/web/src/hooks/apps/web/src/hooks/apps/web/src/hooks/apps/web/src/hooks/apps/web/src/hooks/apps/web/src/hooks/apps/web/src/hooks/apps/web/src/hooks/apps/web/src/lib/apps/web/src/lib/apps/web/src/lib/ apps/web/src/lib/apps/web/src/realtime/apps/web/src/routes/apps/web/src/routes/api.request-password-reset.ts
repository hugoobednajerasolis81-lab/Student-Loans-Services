import type { Route } from './+types/api.request-password-reset';
import { ClientResponseError } from 'pocketbase';
import { withApi, apiError, readJsonBody } from '@/lib/api.server';
import { pocketbaseAdmin } from '@/lib/pocketbase-client.server';
import logger from '@/lib/logger.server';

type ResetResponse = { status: 'sent' | 'not_found' | 'error'; message: string };

/**
 * Triggers a password-reset email for an advisor account. Unlike the browser
 * SDK call (which always returns 204 to prevent email enumeration), this action
 * first verifies the account exists as a superuser, then requests the reset and
 * reports the real outcome — account not found, send failure, or success — so
 * the initial super-admin can tell whether the setup email actually went out.
 *
 * It is a POST action (never cached) and is reachable from the public internet,
 * but it only ever sends a reset email to an existing advisor account; it never
 * exposes or invents a password.
 */
export const action = withApi(async ({ request }) => {
	let email: string;
	try {
		const body = await readJsonBody<{ email?: unknown }>(request);
		email = String(body?.email ?? '').trim().toLowerCase();
	} catch {
		return apiError(400, 'Invalid request.');
	}

	if (!email || !email.includes('@')) {
		return apiError(422, 'Please enter a valid email address.');
	}

	// Confirm an advisor account exists before requesting the reset, so we can
	// report "no account" instead of a silent 204. Superuser bypasses rules.
	let userId: string | null = null;
	try {
		const { items } = await pocketbaseAdmin.listRecords<{ id: string }>('users', {
			filter: pocketbaseAdmin.filter('email = {:email}', { email }),
			perPage: 1,
			skipTotal: true,
		});
		userId = items[0]?.id ?? null;
	} catch (error) {
		logger.error('password-reset user lookup failed', error instanceof Error ? error.message : String(error));
		return apiError(500, 'We could not verify the account right now. Please try again in a moment.');
	}

	if (!userId) {
		return apiError(404, 'No advisor account was found for this email. Contact the site owner if you believe this is an error.');
	}

	// Request the reset as superuser. PocketBase returns 204 on success (and on
	// its built-in per-record cooldown, which only fires after a prior send — so
	// a 204 here means a reset email has been sent). A mailer failure throws.
	try {
		await pocketbaseAdmin.send('/api/collections/users/request-password-reset', {
			method: 'POST',
			body: { email },
		});
	} catch (error) {
		const message =
			error instanceof ClientResponseError && error.status === 429
				? 'Too many reset requests. Please wait a few minutes and try again.'
				: 'We could not send the reset email right now. Please try again in a few minutes.';
		logger.error('password-reset send failed', error instanceof Error ? error.message : String(error));
		return apiError(error instanceof ClientResponseError && error.status === 429 ? 429 : 502, message);
	}

	const response: ResetResponse = {
		status: 'sent',
		message: `A password reset email has been sent to ${email}. Check your inbox and spam folder — the link is valid for 2 hours.`,
	};

	return response;
});
