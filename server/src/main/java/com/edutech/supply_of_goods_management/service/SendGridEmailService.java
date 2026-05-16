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

    @Value("${sendgrid.api-key}")
    private String apiKey;

    @Value("${sendgrid.from-email}")
    private String fromEmail;

    @Value("${sendgrid.from-name}")
    private String fromName;

    // ✅ LOGIN OTP EMAIL (FAIL if SendGrid fails)
    public void sendLoginOtpEmail(String toEmail, String username, String otp) {
        try {
            Email from = new Email(fromEmail, fromName);
            Email to = new Email(toEmail);

            String subject = "Login OTP ✅";
            String body = "Hello " + username + ",\n\n" +
                    "Your OTP for login is: " + otp + "\n\n" +
                    "This OTP is valid for 5 minutes.\n\n" +
                    "If you did not request this, ignore this email.";

            Content content = new Content("text/plain", body);
            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(apiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);

            System.out.println("LOGIN OTP Email Status Code: " + response.getStatusCode());
            System.out.println("LOGIN OTP Email Body: " + response.getBody());

            // ✅ If SendGrid fails, login OTP request API should fail
            if (response.getStatusCode() < 200 || response.getStatusCode() >= 300) {
                throw new RuntimeException("Failed to send LOGIN OTP email. SendGrid status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to send LOGIN OTP email");
        }
    }

    // ✅ REGISTRATION WELCOME EMAIL (DO NOT FAIL registration)
    public void sendRegistrationEmail(String toEmail, String username) {
        try {
            Email from = new Email(fromEmail, fromName);
            Email to = new Email(toEmail);

            String subject = "Registration Successful ✅";

            String body = "Hello " + username + ",\n\n" +
                    "Your account has been successfully registered.\n\n" +
                    "Welcome to Supply Of Goods Management System 🚀\n\n" +
                    "Thank you!";

            Content content = new Content("text/plain", body);
            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(apiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);
            System.out.println("Registration Email Status Code: " + response.getStatusCode());

        } catch (Exception e) {
            // ✅ IMPORTANT — don't break registration
            e.printStackTrace();
        }
    }

    // ✅ EMAIL OTP (Registration verification) — FAIL if SendGrid fails
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            Email from = new Email(fromEmail, fromName);
            Email to = new Email(toEmail);

            String subject = "Your OTP Verification Code";

            String body = "Hello,\n\n" +
                    "Your OTP for email verification is: " + otp + "\n\n" +
                    "This OTP is valid for 1 minute only.\n\n" +
                    "If you did not request this OTP, please ignore this email.\n\n" +
                    "Thank you,\n" +
                    "Supply Of Goods Management System";

            Content content = new Content("text/plain", body);
            Mail mail = new Mail(from, subject, to, content);

            SendGrid sg = new SendGrid(apiKey);
            Request request = new Request();
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());

            Response response = sg.api(request);
            System.out.println("OTP Email Status Code: " + response.getStatusCode());
            System.out.println("OTP Email Body: " + response.getBody());

            // ✅ If SendGrid fails, OTP API should fail
            if (response.getStatusCode() < 200 || response.getStatusCode() >= 300) {
                throw new RuntimeException("Failed to send OTP email. SendGrid status: " + response.getStatusCode());
            }

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to send OTP email");
        }
    }
}
