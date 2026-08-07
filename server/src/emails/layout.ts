export function emailLayout(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="background-color: #6366f1; padding: 24px 32px;">
                <h1 style="margin: 0; color: #ffffff; font-size: 22px;">EventOS</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px; color: #18181b; font-size: 15px; line-height: 1.6;">
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 32px; border-top: 1px solid #e4e4e7; color: #71717a; font-size: 12px;">
                You received this email because you have an account with EventOS.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
