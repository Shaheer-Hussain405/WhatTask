import nodemailer from "nodemailer"
import { apiError } from "./apiError.js"
import crypto from "crypto"

const sendOTP = async (to,typeReg) => {
    try {
        const transport = nodemailer.createTransport({
            service: "gmail",
            auth:{
                user: process.env.GMAIL_API_USER,
                pass: process.env.GMAIL_API_PASS,
            }
        })

        const otp = crypto.randomInt(100000, 1000000).toString()

        await transport.sendMail({
            from: `${typeReg? "WhatTask Registeration":"WhatTask Authorization"} <${process.env.GMAIL_API_USER}>`,
            to,
            subject: `${typeReg? "Registeration OTP Verification":"Forgot Password"}`,
            html: `
                <div style="font-family:Arial,sans-serif;">
                    <h1 style="text-align:center;padding:20px 0;background-color:#191970;color:white;">
                        ${otp}
                    </h1>
                    <hr>
                    <p>
                        ${typeReg 
                            ? "This is your OTP code for registration."
                            : "This is your reset OTP code."
                        }
                    </p>
                    <p>This OTP will expire in 5 minutes.</p>
                </div>
            `
        })



        return otp
    } catch (error) {
        console.log("Error while sending otp :",erro)
        throw new apiError(401,"otp failed to send")
    }
}

export { sendOTP }