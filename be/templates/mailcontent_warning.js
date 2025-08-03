
function getMailData(organizerEmail, countbacklist) {
    return {
        subject: `Usage Warning - Smart Conference Display System`,
        body: `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Conference Room Booking Warning</title>
                    <!--[if mso]>
                    <style type="text/css">
                        table { border-collapse: collapse; }
                        .fallback-text { font-family: Arial, sans-serif !important; }
                    </style>
                    <![endif]-->
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa; line-height: 1.6;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f7fa; padding: 20px 0;">
                        <tr>
                            <td align="center">
                                <!-- ✅ ปรับ width และเพิ่ม responsive styling -->
                                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 800px; min-width: 320px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden; margin: 0 auto;">
                                    <!-- Header -->
                                    <tr>
                                        <td style="background: #375f9e; padding: 25px 20px; text-align: center;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                                                Conference Room Access PIN
                                            </h1>
                                            <p style="color: #e2e8f0; margin: 10px 0 0; font-size: 14px;">
                                                Smart Conference Display System
                                            </p>
                                        </td>
                                    </tr>
                                    
                                    <!-- Main Content -->
                                    <tr>
                                        <td style="padding: 30px 20px;">
                                            
                                            <!-- Greeting -->
                                            <div style="margin-bottom: 25px;">
                                                <h2 style="color: #2c3e50; margin: 0 0 15px; font-size: 20px; font-weight: 600; line-height: 1.3;">
                                                    Dear User,
                                                </h2>
                                                <p style="color: #4a5568; margin: 0; font-size: 15px; line-height: 1.6;">
                                                    <strong style="color: #e53e3e;">Please be informed that the system</strong> has recorded five or more instances of unattended room reservations under your account.
                                                </p>
                                            </div>

                                            <!-- Warning Notice -->
                                            <div style="background-color: #fff5f5; border-left: 4px solid #e53e3e; padding: 15px; margin: 25px 0; border-radius: 6px;">
                                                <p style="color: #4a5568; margin: 0; font-size: 15px; line-height: 1.6;">
                                                    This notification serves as a formal reminder to <strong style="color: #e53e3e;">use the conference room booking system responsibly</strong>. Unattended reservations without prior cancellation reduce the availability of <strong style="color: #e53e3e;">meeting spaces</strong> for other users.
                                                </p>
                                            </div>

                                            <!-- Account Information -->
                                            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px 15px; margin: 25px 0;">
                                                <h3 style="color: #2d3748; margin: 0 0 15px; font-size: 17px; font-weight: 600; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
                                                    Account Information
                                                </h3>
                                                <!-- ✅ เปลี่ยนจาก table เป็น responsive divs -->
                                                <div style="margin: 10px 0;">
                                                    <div style="display: block; padding: 5px 0;">
                                                        <strong style="color: #4a5568; font-size: 14px; display: inline-block;">Email:</strong>
                                                        <span style="color: #4a5568; font-size: 14px; word-break: break-word; margin-left: 10px;">
                                                            ${organizerEmail}
                                                        </span>
                                                    </div>
                                                    <div style="display: block; padding: 5px 0;">
                                                        <strong style="color: #4a5568; font-size: 14px; display: inline-block;">Total Missed Bookings:</strong>
                                                        <span style="color: #4a5568; font-size: 14px; margin-left: 10px;">
                                                            ${countbacklist.pinMissCount}
                                                        </span>
                                                    </div>
                                                    <div style="display: block; padding: 5px 0;">
                                                        <strong style="color: #4a5568; font-size: 14px; display: inline-block;">Status:</strong>
                                                        <span style="color: #4a5568; font-size: 14px; margin-left: 10px;">
                                                            Warning Issued
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Action Required -->
                                            <div style="margin: 20px 0;">
                                                <p style="margin: 0; font-size: 14px; line-height: 1.5; opacity: 0.95;">
                                                    We kindly <strong style="color: #e53e3e;">request</strong> that you review your upcoming bookings and cancel in advance if you are unable to attend.  <strong style="color: #e53e3e;">Please note that continued misuse may result in a</strong> temporary suspension of your booking privileges.
                                                </p>
                                            </div>

                                            <!-- Closing -->
                                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                                                <p style="color: #4a5568; margin: 0 0 15px; font-size: 15px; line-height: 1.6;">
                                                    Thank you for your attention and cooperation.
                                                </p>
                                                <div style="color: #2d3748; margin: 0; font-size: 15px; font-weight: 600;">
                                                    Sincerely,<br>
                                                    <span style="color: #4299e1;">Smart Conference Display System Team</span><br>
                                                    <!-- ✅ ทำให้ logo responsive -->
                                                    <div style="margin-top: 10px;">
                                                        <img src="cid:thumbnail_Outlook-tnktrguf.png" alt="Company Logo" style="max-width: 150px; height: auto; display: block;">
                                                    </div>
                                                </div>
                                            </div>

                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="background-color: #375f9e; padding: 20px 15px; text-align: center;">
                                            <p style="color: #a0aec0; margin: 0; font-size: 13px; line-height: 1.4;">
                                                This is an automated message from the Smart Conference Display System.<br>
                                                Please do not reply to this email.
                                            </p>
                                        </td>
                                    </tr>
                                    
                                </table>
                            </td>
                        </tr>
                        
                    </table>

                    <!-- ✅ เพิ่ม Media Queries สำหรับ responsive -->
                    <style type="text/css">
                        @media only screen and (max-width: 600px) {
                            .email-container {
                                width: 100% !important;
                                max-width: 100% !important;
                            }
                            
                            .content-padding {
                                padding: 20px 15px !important;
                            }
                            
                            .mobile-center {
                                text-align: center !important;
                            }
                            
                            .mobile-stack {
                                display: block !important;
                                width: 100% !important;
                            }
                            
                            .mobile-hide {
                                display: none !important;
                            }
                            
                            h2 {
                                font-size: 18px !important;
                                line-height: 1.2 !important;
                            }
                            
                            h3 {
                                font-size: 16px !important;
                            }
                            
                            p, span, div {
                                font-size: 14px !important;
                                line-height: 1.5 !important;
                            }
                            
                            .warning-box {
                                padding: 12px !important;
                                margin: 15px 0 !important;
                            }
                            
                            .info-box {
                                padding: 15px 10px !important;
                                margin: 15px 0 !important;
                            }
                            
                            .footer-padding {
                                padding: 15px 10px !important;
                            }
                        }

                        @media only screen and (max-width: 480px) {
                            .outer-table {
                                padding: 10px 0 !important;
                            }
                            
                            h2 {
                                font-size: 16px !important;
                            }
                            
                            .info-item {
                                margin: 8px 0 !important;
                            }
                            
                            .logo-img {
                                max-width: 120px !important;
                            }
                        }
                    </style>
                    
                </body>
                </html>`,
    };
};

module.exports = getMailData;