package com.edutech.supply_of_goods_management.service;

import com.sendgrid.Method;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.SendGrid;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SendGridEmailService {

    private static final String SENDGRID_MAIL_ENDPOINT = "mail/send";
    private static final String CONTENT_TYPE_TEXT_PLAIN = "text/plain";

    @Value("${sendgrid.api-key:dummy}")
    private String apiKey;

    @Value("${sendgrid.from-email:test@test.com}")
    private String fromEmail;

    @Value("${sendgrid.from-name:test}")
    private String fromName;

    // =====================================================
    // LOGIN OTP EMAIL
    // This should fail if email sending fails
    // =====================================================

    public void sendLoginOtpEmail(String toEmail, String username, String otp) {
        String subject = "Login OTP";

        String body = "Hello " + safeValue(username) + ",\n\n"
                + "Your OTP for login is: " + otp + "\n\n"
                + "This OTP is valid for 5 minutes.\n\n"
                + "If you did not request this, please ignore this email.\n\n"
                + "Thank you,\n"
                + "SupplyFlow Nexus";

        sendEmailOrThrow(toEmail, subject, body, "LOGIN OTP");
    }

    // =====================================================
    // REGISTRATION WELCOME EMAIL
    // This should NOT fail registration if email sending fails
    // =====================================================

    public void sendRegistrationEmail(String toEmail, String username) {
        String subject = "Registration Successful";

        String body = "Hello " + safeValue(username) + ",\n\n"
                + "Your account has been successfully registered.\n\n"
                + "Welcome to SupplyFlow Nexus.\n\n"
                + "Thank you!";

        sendEmailSilently(toEmail, subject, body, "REGISTRATION");
    }

    // =====================================================
    // OTP EMAIL
    // Used for registration OTP and forgot-password OTP
    // This should fail if email sending fails
    // =====================================================

    public void sendOtpEmail(String toEmail, String otp) {
        String subject = "Your OTP Verification Code";

        String body = "Hello,\n\n"
                + "Your OTP verification code is: " + otp + "\n\n"
                + "This OTP is valid for 5 minutes only.\n\n"
                + "If you did not request this OTP, please ignore this email.\n\n"
                + "Thank you,\n"
                + "SupplyFlow Nexus";

        sendEmailOrThrow(toEmail, subject, body, "OTP");
    }

    // =====================================================
    // PASSWORD RESET CONFIRMATION EMAIL
    // This should NOT fail password reset if email sending fails
    // =====================================================

    public void sendPasswordResetConfirmationEmail(String toEmail, String username) {
        String subject = "Password Reset Successful";

        String body = "Hello " + safeValue(username) + ",\n\n"
                + "Your password has been successfully reset.\n\n"
                + "If you did not make this change, please contact support immediately.\n\n"
                + "Stay secure,\n"
                + "SupplyFlow Nexus Team";

        sendEmailSilently(toEmail, subject, body, "PASSWORD RESET CONFIRMATION");
    }

    // =====================================================
    // PRIVATE HELPERS
    // =====================================================

    private void sendEmailOrThrow(String toEmail, String subject, String body, String emailType) {
        try {
            Response response = sendEmail(toEmail, subject, body);

            logSendGridResponse(emailType, response);

            if (!isSuccessStatus(response.getStatusCode())) {
                throw new RuntimeException(
                        emailType + " email failed. SendGrid status: " + response.getStatusCode()
                );
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to send " + emailType + " email", e);
        }
    }

    private void sendEmailSilently(String toEmail, String subject, String body, String emailType) {
        try {
            Response response = sendEmail(toEmail, subject, body);
            logSendGridResponse(emailType, response);

        } catch (Exception e) {
            // Do not break main business flow for non-critical emails.
            e.printStackTrace();
        }
    }

    private Response sendEmail(String toEmail, String subject, String body) throws Exception {
        Email from = new Email(fromEmail, fromName);
        Email to = new Email(toEmail);

        Content content = new Content(CONTENT_TYPE_TEXT_PLAIN, body);
        Mail mail = new Mail(from, subject, to, content);

        SendGrid sendGrid = new SendGrid(apiKey);

        Request request = new Request();
        request.setMethod(Method.POST);
        request.setEndpoint(SENDGRID_MAIL_ENDPOINT);
        request.setBody(mail.build());

        return sendGrid.api(request);
    }

    private boolean isSuccessStatus(int statusCode) {
        return statusCode >= 200 && statusCode < 300;
    }

    private void logSendGridResponse(String emailType, Response response) {
        System.out.println(emailType + " Email Status Code: " + response.getStatusCode());

        if (response.getBody() != null && !response.getBody().isBlank()) {
            System.out.println(emailType + " Email Body: " + response.getBody());
        }
    }

    private String safeValue(String value) {
        return value == null || value.trim().isEmpty() ? "User" : value.trim();
    }
}