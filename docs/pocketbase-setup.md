# PocketBase setup for Student Loans Solutions

The application uses PocketBase for the authoritative CRM database and advisor authentication. Google Sheets is not used as the live CRM database.

## Environment

Configure these server-side variables in the web host:

- `POCKETBASE_URL`: PocketBase base URL.
- `POCKETBASE_SERVICE_EMAIL`: dedicated PocketBase users-auth account for server-side public inquiry and signing actions.
- `POCKETBASE_SERVICE_PASSWORD`: password for that service account.
- `VITE_POCKETBASE_URL`: same PocketBase base URL, exposed to the browser SDK only.

Do not use a superuser password as the normal service account. Create a dedicated account with role `admin`, protect its password as a server secret, and never use a `VITE_` prefix for credentials.

## Required collections and fields

The app expects the following existing collections:

### users (auth collection)
- `role`: text/select value `admin` or `advisor`.
- Enable password authentication.
- Only invited staff accounts should exist.

### leads (base collection)
- `name` text, required
- `email` email/text, required
- `phone` text
- `loan_type` text
- `balance` text
- `message` text
- `status` text/select
- `consent` bool
- `notes` text
- `follow_up` date/text

### agreements (base collection)
- `lead` relation to `leads`
- `title` text
- `body` text
- `status` text/select (draft, sent, signed, voided)
- `token` unique text (64 lowercase hexadecimal characters)
- `created_by` relation to `users` (optional if your existing schema does not have it)
- `sent_at`, `viewed_at`, `signed_at` date/text fields
- `signer_name` text
- `signer_consent` bool
- `signer_ip` text
- `signer_user_agent` text

## Collection API rules

The browser must never have list/view access to client records without staff authentication. A starting rule for all list/view/create/update/delete operations on `leads` and `agreements` is:

```
@request.auth.id != "" && (@request.auth.role = "admin" || @request.auth.role = "advisor")
```

For `users`, do not allow public list/view/create/update/delete. Permit only the authentication endpoints and restrict account administration to an authorized administrator.

Public inquiries and public signing are handled by server routes using the dedicated service account, not by making CRM collections publicly readable. The service account must have the same necessary collection access and no superuser privileges.

## Validation before production

1. Confirm the collection names and fields match the above.
2. Confirm the service account can create leads and update agreements.
3. Confirm the public API cannot list, view, update or delete CRM records.
4. Confirm advisors can only access the records permitted by your business rules.
5. Set the environment variables in the hosting environment; never commit a real `.env`.
6. Test a real inquiry, advisor login, CRM edit, signing link, and completed signature using synthetic data.

The signing route captures a typed name, affirmative electronic-signature consent, timestamp, user agent and source IP as provided by the host proxy. It is a basic electronic-signature workflow, not a certificate-based digital signature or a legal opinion that any particular agreement satisfies all electronic-signature laws.
