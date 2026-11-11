const GRAPH = "https://graph.facebook.com/v21.0"; // use a current version

export async function sendWhatsAppTemplate(opts: {
  to: string;
  template: string;
  language: string;
  params?: string[];
}) {
  const token = process.env.WA_TOKEN;
  const phoneId = process.env.WA_PHONE_ID;
  if (!token || !phoneId) {
    console.error("❌ WhatsApp env vars missing");
    return { ok: false };
  }

  // Meta wants country code + number, digits only (no + or spaces)
  const digits = opts.to.replace(/\D/g, "");
  const to = digits.length === 10 ? `91${digits}` : digits;

  const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: opts.template,
        language: { code: opts.language },
        ...(opts.params?.length && {
          components: [
            {
              type: "body",
              parameters: opts.params.map((text) => ({ type: "text", text })),
            },
          ],
        }),
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("❌ WhatsApp API Error:", JSON.stringify(data));
    return { ok: false };
  }
  return { ok: true, id: data?.messages?.[0]?.id };
}