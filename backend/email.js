import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Selfinder <noreply@selfinder.online>";

export async function sendPasswordResetEmail(to, code) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Selfinder password reset code",
    text: `Your password reset code is ${code}.\n\nIt expires in 15 minutes. If you didn't request this, you can safely ignore this email.`,
  });
}
