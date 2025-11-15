import africastalking from "africastalking";

// Only if you want real SMS sending
const africasTalking = africastalking({
  apiKey: process.env.AT_API_KEY!,
  username: process.env.AT_USERNAME!, // usually "sandbox" for testing
});

// Use default sender ID if not set in .env
const FROM_ID = process.env.AT_FROM || "UgaEats";

export const sendSMS = async (to: string, message: string) => {
  try {
    console.log("AT_USERNAME:", process.env.AT_USERNAME);
    console.log("AT_API_KEY:", process.env.AT_API_KEY?.slice(0, 8) + "...");

    const sms = africasTalking.SMS;
    await sms.send({
      to,
      message,
      from: FROM_ID, // ✅ Required field
    });
    console.log("✅ SMS sent to", to);
  } catch (error) {
    console.error("❌ Failed to send SMS:", error);
  }
};
