import nodemailer from "nodemailer"
import { apiError } from "./apiError.js"

const sendOTP = async (to) => {
    try {
        const transport = nodemailer.createTransport({
            service: "gmail",
            auth:{
                user: process.env.GMAIL_API_USER,
                pass: process.env.GMAIL_API_PASS,
            }
        })

        const otp = String(Math.floor(100000 + Math.random() * 999999))

        await transport.sendMail({
            from: `"WhatTask Registeration" <${process.env.GMAIL_API_USER}>`,
            to,
            subject: `Registeration OTP Verification`,
            html: `
            <div>
                <h1 style="text-align:center;padding:20px 0;background-color:#191970;color:white;">${otp}</h1>
                <hr>
                <p>This is Your OTP Code</p>
                <p>Thanks for registering to our App!</p>
            </div>
            `
        })

        return otp
    } catch (error) {
        console.log("Error while sending otp :",errr)
        throw new apiError(401,"otp failed to send")
    }
}

export { sendOTP }