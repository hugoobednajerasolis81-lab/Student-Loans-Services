/// <reference path="../pb_data/types.d.ts" />

// Brands the built-in password-reset email for the `users` (advisor) auth
// collection. The default PocketBase reset email is plain text from a generic
// sender, which mail providers often filter as spam — so the seeded super-admin
// never sees it. A branded HTML message with a clear subject and the correct
// /hcgi/platform reset link is recognizable and deliverable.
//
// Fires before the platform `onMailerSend` (builder-mailer) hook, which takes
// `e.message.html` and the relay sender address and performs the actual send.
onMailerRecordPasswordResetSend((e) => {
  const appUrl = $app.settings().meta.appURL;
  const link   = `${appUrl}/_/#/auth/confirm-password-reset/${e.meta.token}`;
  const email  = e.record.getEmail();

  e.message.from.name = "Student Loans Solutions";
  e.message.subject   = "Set your Student Loans Solutions advisor password";
  e.message.html      = `
    <div style="max-width:560px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#263c4a;background:#f7f5f0;padding:32px 24px;">
      <p style="font-size:10px;letter-spacing:1.8px;font-weight:700;color:#704249;margin:0 0 24px;">STUDENT LOANS SOLUTIONS / ADVISOR WORKSPACE</p>
      <h1 style="font-size:26px;font-weight:500;letter-spacing:-.5px;margin:0 0 18px;">Set your advisor password</h1>
      <p style="font-size:14px;line-height:1.8;color:#667279;margin:0 0 18px;">
        A password was not set on your advisor account yet. Use the link below to choose a secure password and sign in to the Student Loans Solutions workspace.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${link}" style="display:inline-block;background:#334f60;color:#f7f5f0;text-decoration:none;font-size:13px;font-weight:600;padding:14px 24px;border-radius:3px;">Set my password</a>
      </p>
      <p style="font-size:12px;line-height:1.8;color:#667279;margin:0 0 12px;">
        Or copy this link into your browser:<br/>
        <span style="word-break:break-all;color:#334f60;">${link}</span>
      </p>
      <p style="font-size:12px;line-height:1.8;color:#667279;margin:0 0 12px;">
        This link expires in 2 hours. If you did not request it, you can safely ignore this email.
      </p>
      <hr style="border:0;border-top:1px solid #d8dad6;margin:24px 0;" />
      <p style="font-size:10px;line-height:1.7;color:#667279;margin:0;">
        Student Loans Solutions — Your path to financial freedom.<br/>
        Sent to ${email}. This is a private workspace; access is by invitation only.
      </p>
    </div>`;

  e.next();
}, "users");
