import crypto from "crypto";
import nodemailer from "nodemailer";
import type { NextApiRequest, NextApiResponse } from "next";

import { serverConfig } from "@calcom/lib/serverConfig";

export const config = {
  api: {
    bodyParser: false,
  },
};

type BookingQuestionResponse = {
  label: string;
  value: string | string[];
};

type CalWebhookPayload = {
  triggerEvent: string;
  payload: {
    title?: string;
    startTime?: string;
    endTime?: string;
    organizer?: { email: string; name?: string };
    attendees?: Array<{ name: string; email: string }>;
    responses?: Record<string, BookingQuestionResponse>;
  };
};

function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function verifySignature(raw: Buffer, sig: string | undefined, secret: string): boolean {
  if (!sig) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

function formatValue(val: string | string[]): string {
  return Array.isArray(val) ? val.join(", ") : String(val);
}

function buildHtml(payload: CalWebhookPayload["payload"]): string {
  const attendee = payload.attendees?.[0];
  const start = payload.startTime ? new Date(payload.startTime).toLocaleString("en-US", { timeZone: "UTC" }) : "—";
  const end = payload.endTime ? new Date(payload.endTime).toLocaleString("en-US", { timeZone: "UTC" }) : "—";

  const responses = payload.responses ?? {};
  const responseRows = Object.entries(responses)
    .filter(([, r]) => r.value !== undefined && r.value !== "")
    .map(
      ([, r]) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#444;vertical-align:top;white-space:nowrap">${r.label}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222">${formatValue(r.value)}</td>
        </tr>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Pre-meeting Brief</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f9fa;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.1)">
    <div style="background:#6366f1;padding:24px 32px">
      <h1 style="color:#fff;margin:0;font-size:20px">Pre-meeting Brief</h1>
      <p style="color:#c7d2fe;margin:4px 0 0;font-size:14px">Slotly — intake summary for your upcoming session</p>
    </div>
    <div style="padding:24px 32px">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#444;white-space:nowrap">Client</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222">${attendee?.name ?? "—"} &lt;${attendee?.email ?? "—"}&gt;</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#444;white-space:nowrap">Session</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222">${payload.title ?? "—"}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#444;white-space:nowrap">Start (UTC)</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222">${start}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#444;white-space:nowrap">End (UTC)</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#222">${end}</td>
        </tr>
      </table>

      ${
        responseRows
          ? `<h2 style="font-size:16px;color:#333;margin:0 0 12px">Client intake responses</h2>
      <table style="width:100%;border-collapse:collapse">${responseRows}</table>`
          : `<p style="color:#888;font-size:14px">No intake responses were collected for this booking.</p>`
      }
    </div>
    <div style="padding:16px 32px;background:#f8f9fa;border-top:1px solid #eee;font-size:12px;color:#999">
      Sent by Slotly · you are receiving this because you enabled pre-meeting intake summaries
    </div>
  </div>
</body>
</html>`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookSecret = process.env.SLOTLY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: "SLOTLY_WEBHOOK_SECRET not configured" });
  }

  const raw = await getRawBody(req);

  const sig = req.headers["x-cal-signature-256"] as string | undefined;
  if (!verifySignature(raw, sig, webhookSecret)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  let body: CalWebhookPayload;
  try {
    body = JSON.parse(raw.toString());
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (body.triggerEvent !== "BOOKING_CREATED") {
    return res.status(200).json({ skipped: true });
  }

  const { payload } = body;
  const hostEmail = payload.organizer?.email;
  if (!hostEmail) {
    return res.status(400).json({ error: "No organizer email in payload" });
  }

  const transport = nodemailer.createTransport(serverConfig.transport as Parameters<typeof nodemailer.createTransport>[0]);

  await transport.sendMail({
    from: serverConfig.from,
    to: hostEmail,
    subject: `Pre-meeting brief: ${payload.title ?? "Upcoming session"} with ${payload.attendees?.[0]?.name ?? "client"}`,
    html: buildHtml(payload),
  });

  return res.status(200).json({ ok: true });
}
