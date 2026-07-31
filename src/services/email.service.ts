// // services/email.service.ts
// // Free email sending via Gmail SMTP using Nodemailer.
// // No paid service needed — Gmail allows ~500 emails/day for free.
// import dns from "node:dns";

// dns.setDefaultResultOrder("ipv4first");

// import nodemailer from "nodemailer";

// // const transporter = nodemailer.createTransport({
// //   service: "gmail",
// //   auth: {
// //     user: process.env.EMAIL_USER,          // your Gmail address
// //     pass: process.env.EMAIL_APP_PASSWORD,  // Gmail App Password (not your normal password)
// //   },
// // });
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 587,
//   secure: false,
//   requireTLS: true,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_APP_PASSWORD,
//   },
//   connectionTimeout: 30000,
//   greetingTimeout: 30000,
//   socketTimeout: 30000,
// });

// export async function sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
//   await transporter.sendMail({
//     from: `"TalentCloud" <${process.env.EMAIL_USER}>`,
//     to,
//     subject: "Verify your TalentCloud account",
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
//         <h2 style="color: #0070C0;">Welcome to TalentCloud, ${name}!</h2>
//         <p style="color: #333; font-size: 15px;">
//           Use the code below to verify your email address. This code expires in 10 minutes.
//         </p>
//         <div style="background: #E6F6FD; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
//           <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0070C0;">${otp}</span>
//         </div>
//         <p style="color: #888; font-size: 13px;">
//           If you didn't create an account with TalentCloud, you can safely ignore this email.
//         </p>
//       </div>
//     `,
//   });
// }

// export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
//   await transporter.sendMail({
//     from: `"TalentCloud" <${process.env.EMAIL_USER}>`,
//     to,
//     subject: "Your account is verified! 🎉",
//     html: `
//       <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
//         <h2 style="color: #0070C0;">You're all set, ${name}!</h2>
//         <p style="color: #333; font-size: 15px;">
//           Your TalentCloud account is now verified. Start browsing Salesforce jobs today.
//         </p>
//       </div>
//     `,
//   });
// }



// services/email.service.ts

import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import nodemailer from "nodemailer";

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,

  tls: {
    rejectUnauthorized: false,
  },
});

// Verify SMTP connection when server starts
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP Verify Error:", err);
  } else {
    console.log("✅ Gmail SMTP Connected");
  }
});

export async function sendOtpEmail(
  to: string,
  name: string,
  otp: string
): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from: `"TalentCloud" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Verify your TalentCloud account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width:480px; margin:auto; padding:24px;">
          <h2 style="color:#0070C0;">
            Welcome to TalentCloud, ${name}!
          </h2>

          <p>
            Use the OTP below to verify your account.
            This code expires in 10 minutes.
          </p>

          <div
            style="
              background:#E6F6FD;
              padding:20px;
              border-radius:8px;
              text-align:center;
              margin:20px 0;
            "
          >
            <span
              style="
                font-size:32px;
                font-weight:bold;
                letter-spacing:8px;
                color:#0070C0;
              "
            >
              ${otp}
            </span>
          </div>

          <p style="font-size:13px;color:#777;">
            If you didn't create this account, simply ignore this email.
          </p>
        </div>
      `,
    });

    console.log("✅ OTP Email Sent:", info.messageId);
  } catch (err) {
    console.error("❌ OTP Email Error:", err);
    throw err;
  }
}

export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<void> {
  try {
    const info = await transporter.sendMail({
      from: `"TalentCloud" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your account is verified! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width:480px; margin:auto; padding:24px;">
          <h2 style="color:#0070C0;">
            You're all set, ${name}!
          </h2>

          <p>
            Your TalentCloud account has been verified successfully.
          </p>

          <p>
            Start browsing Salesforce jobs today.
          </p>
        </div>
      `,
    });

    console.log("✅ Welcome Email Sent:", info.messageId);
  } catch (err) {
    console.error("❌ Welcome Email Error:", err);
  }
}