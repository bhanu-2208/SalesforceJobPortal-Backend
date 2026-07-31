// // services/email.service.ts
// // Free email sending via Gmail SMTP using Nodemailer.
// // No paid service needed — Gmail allows ~500 emails/day for free.
// import dns from "node:dns";
// import nodemailer from "nodemailer";

// dns.setDefaultResultOrder("ipv4first");

// // const transporter = nodemailer.createTransport({
// //   service: "gmail",
// //   auth: {
// //     user: process.env.EMAIL_USER,          // your Gmail address
// //     pass: process.env.EMAIL_APP_PASSWORD,  // Gmail App Password (not your normal password)
// //   },
// // });
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,

//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_APP_PASSWORD,
//   },

//   tls: {
//     rejectUnauthorized: false,
//   },

//   connectionTimeout: 15000,
//   greetingTimeout: 15000,
//   socketTimeout: 15000,
// });
// // const transporter = nodemailer.createTransport({
// //   host: "smtp.gmail.com",
// //   port: 587,
// //   secure: false,
// //   requireTLS: true,
// //   auth: {
// //     user: process.env.EMAIL_USER,
// //     pass: process.env.EMAIL_APP_PASSWORD,
// //   },
// //   connectionTimeout: 30000,
// //   greetingTimeout: 30000,
// //   socketTimeout: 30000,
// // });

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

import { Resend } from "resend";


const resend = new Resend(
  process.env.RESEND_API_KEY
);



export async function sendOtpEmail(
  to: string,
  name: string,
  otp: string
): Promise<void> {

  try {

    const result = await resend.emails.send({

      from: "TalentCloud <onboarding@resend.dev>",

      to: [to],

      subject: "Verify your TalentCloud account",

      html: `
        <div style="font-family:Arial;padding:20px">

          <h2>
            Welcome to TalentCloud, ${name}
          </h2>

          <p>
            Your OTP verification code is:
          </p>


          <h1 style="
            color:#0070C0;
            letter-spacing:8px;
          ">
            ${otp}
          </h1>


          <p>
            This OTP expires in 10 minutes.
          </p>

        </div>
      `
    });


    console.log("✅ OTP email sent", result);


  } catch(error){

    console.error("❌ OTP email error:", error);

    throw error;
  }
}




export async function sendWelcomeEmail(
  to:string,
  name:string
):Promise<void>{

  try {

    await resend.emails.send({

      from:"TalentCloud <onboarding@resend.dev>",

      to:[to],

      subject:"Your TalentCloud account is verified 🎉",

      html:`
        <h2>
          Welcome ${name}
        </h2>

        <p>
          Your account has been verified successfully.
        </p>
      `
    });


    console.log("✅ Welcome email sent");


  } catch(error){

    console.error("❌ Welcome email error:",error);

    throw error;
  }

}