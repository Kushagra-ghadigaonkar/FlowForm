import nodemailer from "nodemailer";

import { env } from "../env";

const PRODUCT_NAME = "FlowForm";

export type SubmissionNotificationInput = {
  creatorEmail: string | null;
  respondentEmail: string | null;
  formId: string;
  formTitle: string;
  formSlug: string;
  responseId: string;
};

type TemplateInput = SubmissionNotificationInput & {
  formUrl: string;
  resultsUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function appUrl(path = "") {
  return `${env.WEB_APP_URL.replace(/\/$/, "")}${path}`;
}

function formatSubmittedAt() {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

function subjectFragment(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim() || "Untitled form";
}

function emailShell({
  body,
  eyebrow,
  preview,
  title,
}: {
  body: string;
  eyebrow: string;
  preview: string;
  title: string;
}) {
  const safePreview = escapeHtml(preview);
  const safeEyebrow = escapeHtml(eyebrow);
  const safeTitle = escapeHtml(title);

  return `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;background:#f7f4ee;color:#241410;font-family:Arial,Helvetica,sans-serif;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">
      ${safePreview}
    </span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f4ee;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e9ded1;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(36,20,16,0.10);">
            <tr>
              <td style="background:#2b120d;padding:24px 28px;border-bottom:4px solid #f7df00;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <div style="font-size:24px;line-height:1;font-weight:900;letter-spacing:0.02em;color:#f7df00;">
                        ${PRODUCT_NAME}
                      </div>
                      <div style="margin-top:8px;font-size:11px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;color:#d9c6b8;">
                        ${safeEyebrow}
                      </div>
                    </td>
                    <td align="right" style="font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#98f38d;">
                      Notification
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:34px 30px 32px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 30px;background:#fbf8f2;border-top:1px solid #e9ded1;">
                <p style="margin:0;font-size:12px;line-height:1.7;color:#826e62;">
                  This is an automated message from ${PRODUCT_NAME}. If you were not expecting this
                  email, you can safely ignore it.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function metaRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eadfce;font-size:13px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#826e62;">
        ${escapeHtml(label)}
      </td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid #eadfce;font-size:14px;font-weight:700;color:#241410;word-break:break-word;">
        ${escapeHtml(value)}
      </td>
    </tr>
  `;
}

function ctaButton(label: string, href: string) {
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;background:#20c968;color:#06180c;text-decoration:none;border-radius:10px;padding:15px 22px;font-size:13px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;box-shadow:0 5px 0 #0a5528;">
      ${escapeHtml(label)}
    </a>
  `;
}

function buildCreatorEmail(input: TemplateInput) {
  const formTitle = escapeHtml(input.formTitle);
  const submittedAt = formatSubmittedAt();

  const body = `
    <h1 style="margin:0;font-size:28px;line-height:1.18;color:#241410;">
      A new response is ready for review
    </h1>
    <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#604c42;">
      Hello, a respondent submitted <strong>${formTitle}</strong>. The response has been saved
      successfully and is available in your ${PRODUCT_NAME} results dashboard.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:26px 0 28px;border-collapse:collapse;">
      ${metaRow("Form", input.formTitle)}
      ${metaRow("Response ID", input.responseId)}
      ${metaRow("Received", submittedAt)}
    </table>

    ${ctaButton("Review response", input.resultsUrl)}

    <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#826e62;">
      Shareable form link:
      <a href="${escapeHtml(input.formUrl)}" style="color:#7a4a00;font-weight:700;">${escapeHtml(input.formUrl)}</a>
    </p>
    <p style="margin:12px 0 0;font-size:13px;line-height:1.7;color:#826e62;">
      Tip: open the results page to review answers, export CSV data, and monitor response trends.
    </p>
  `;

  return emailShell({
    body,
    eyebrow: "Creator notification",
    preview: `${input.formTitle} received a new response in ${PRODUCT_NAME}.`,
    title: "New response ready for review",
  });
}

function buildRespondentEmail(input: TemplateInput) {
  const formTitle = escapeHtml(input.formTitle);

  const body = `
    <h1 style="margin:0;font-size:28px;line-height:1.18;color:#241410;">
      Thank you. Your response has been submitted.
    </h1>
    <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#604c42;">
      We received your submission for <strong>${formTitle}</strong>. Your answers were recorded
      successfully and shared with the form owner for review.
    </p>

    <div style="margin:26px 0;padding:18px 20px;background:#fbf8f2;border:1px solid #eadfce;border-radius:14px;">
      <div style="font-size:12px;font-weight:900;letter-spacing:0.16em;text-transform:uppercase;color:#826e62;">
        Reference ID
      </div>
      <div style="margin-top:8px;font-size:16px;font-weight:800;color:#241410;word-break:break-all;">
        ${escapeHtml(input.responseId)}
      </div>
    </div>

    ${ctaButton("Open form", input.formUrl)}

    <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#826e62;">
      Please keep this email for your records. If you need to reference this submission later,
      share the reference ID with the form owner.
    </p>
  `;

  return emailShell({
    body,
    eyebrow: "Submission confirmation",
    preview: `Your response for ${input.formTitle} was submitted successfully.`,
    title: "Submission received",
  });
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter() {
    if (!env.EMAIL_USER || !env.EMAIL_PASS) return null;
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS.replace(/\s+/g, ""),
      },
    });

    return this.transporter;
  }

  public async sendSubmissionNotifications(input: SubmissionNotificationInput): Promise<void> {
    const transporter = this.getTransporter();

    if (!transporter) {
      console.info("[email:submission:skipped]", {
        reason: "EMAIL_USER or EMAIL_PASS is not configured",
        formTitle: input.formTitle,
        responseId: input.responseId,
      });
      return;
    }

    const from = env.EMAIL_FROM ?? `FlowForm <${env.EMAIL_USER}>`;
    const formUrl = appUrl(`/f/${input.formSlug}`);
    const resultsUrl = appUrl(`/forms/${input.formId}/results`);
    const templateInput = { ...input, formUrl, resultsUrl };
    const safeFormSubject = subjectFragment(input.formTitle);
    const messages = [
      input.creatorEmail
        ? {
            from,
            to: input.creatorEmail,
            subject: `[${PRODUCT_NAME}] New response for ${safeFormSubject}`,
            text: [
              "A new response is ready for review",
              "",
              `Form: ${input.formTitle}`,
              `Response ID: ${input.responseId}`,
              `Results: ${resultsUrl}`,
              `Shareable form link: ${formUrl}`,
              "",
              `The response has been saved successfully in your ${PRODUCT_NAME} workspace.`,
            ].join("\n"),
            html: buildCreatorEmail(templateInput),
          }
        : null,
      input.respondentEmail
        ? {
            from,
            to: input.respondentEmail,
            subject: `Submission received for ${safeFormSubject}`,
            text: [
              "Thank you. Your response has been submitted.",
              "",
              `Thanks for submitting "${input.formTitle}".`,
              "Your answers were recorded successfully and shared with the form owner.",
              `Reference ID: ${input.responseId}`,
              `Form: ${formUrl}`,
            ].join("\n"),
            html: buildRespondentEmail(templateInput),
          }
        : null,
    ].filter((message): message is NonNullable<typeof message> => Boolean(message));

    if (!messages.length) return;

    try {
      await Promise.all(messages.map((message) => transporter.sendMail(message)));
      console.info("[email:submission:sent]", {
        recipients: messages.map((message) => message.to),
        formTitle: input.formTitle,
        responseId: input.responseId,
      });
    } catch (error) {
      console.error("[email:submission:error]", error instanceof Error ? error.message : error);
    }
  }
}

export const emailService = new EmailService();
export default EmailService;
