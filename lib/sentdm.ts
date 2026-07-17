/**
 * Sent.dm Integration Library
 * Provides helper methods to interface with the Sent.dm REST API for SMS & WhatsApp delivery.
 */

const SENT_DM_BASE_URL = process.env.SENT_DM_BASE_URL || "https://api.sent.dm";

export interface SendMessageOptions {
  to: string;
  templateName: string;
  parameters: Record<string, string>;
  sandbox?: boolean;
}

/**
 * Sends a WhatsApp templated message using Sent.dm API
 */
export async function sendWhatsAppMessage(options: SendMessageOptions) {
  const apiKey = process.env.SENT_DM_API_KEY;
  if (!apiKey) {
    console.error("[Sent.dm] Error: SENT_DM_API_KEY is not defined in environment.");
    return { success: false, error: { message: "SENT_DM_API_KEY is missing" } };
  }

  // Ensure phone number starts with a plus sign for E.164
  let formattedTo = options.to.trim();
  if (!formattedTo.startsWith("+")) {
    // If it's a South African number starting with 0, convert to +27
    if (formattedTo.startsWith("0")) {
      formattedTo = "+27" + formattedTo.substring(1);
    } else {
      formattedTo = "+" + formattedTo;
    }
  }

  try {
    const response = await fetch(`${SENT_DM_BASE_URL}/v3/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: [formattedTo],
        channel: ["whatsapp"],
        template: {
          name: options.templateName,
          parameters: options.parameters,
        },
        sandbox: options.sandbox ?? false,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("[Sent.dm] Failed to send message via Sent.dm:", error);
    return {
      success: false,
      error: {
        message: error.message || "Unknown transport error occurred",
      },
    };
  }
}

/**
 * Retrieve the status of a message by ID
 */
export async function getMessageStatus(messageId: string) {
  const apiKey = process.env.SENT_DM_API_KEY;
  if (!apiKey) {
    return { success: false, error: "SENT_DM_API_KEY is missing" };
  }

  try {
    const response = await fetch(`${SENT_DM_BASE_URL}/v3/messages/${messageId}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("[Sent.dm] Failed to fetch message status:", error);
    return { success: false, error: error.message };
  }
}
