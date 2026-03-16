export interface VerificationEmailInput {
  verificationUrl: string;
}

export function buildVerificationEmail(input: VerificationEmailInput) {
  const { verificationUrl } = input;

  return {
    subject: "Verify your email - SISWIT",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; }
    .header { text-align: center; margin-bottom: 30px; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .footer { font-size: 12px; color: #777; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SISWIT</h1>
    </div>
    <p>Hello,</p>
    <p>Thank you for signing up for SISWIT! Please click the button below to verify your email address and get started.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" class="btn">Verify Email Address</a>
    </div>
    <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
    <p style="word-break: break-all;"><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p>This verification link will expire in 24 hours.</p>
    <div class="footer">
      &copy; ${new Date().getFullYear()} SISWIT. All rights reserved.
    </div>
  </div>
</body>
</html>
    `,
  };
}
