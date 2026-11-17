interface SendCampaignArgs {
  campaignName: string;
  destination: string; // digits only with country code, e.g. 919876543210
  userName: string;
  templateParams: string[];
  source?: string;
}

export async function sendAiSensyCampaign({
  campaignName,
  destination,
  userName,
  templateParams,
  source = "posterly-site",
}: SendCampaignArgs) {
  const apiKey = process.env.AISENSY_API_KEY;
  if (!apiKey) throw new Error("AISENSY_API_KEY is not set");

  const res = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey,
      campaignName,
      destination,
      userName,
      source,
      templateParams,
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`AiSensy ${res.status}: ${text}`);
  return text;
}