package com.bikespares.shop.service;

import com.bikespares.shop.model.Order;
import com.bikespares.shop.model.OrderItem;
import com.bikespares.shop.model.User;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import java.util.logging.Level;
import java.util.logging.Logger;

@Service
public class EmailService {

    private static final Logger LOGGER = Logger.getLogger(EmailService.class.getName());

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendOrderConfirmationEmail(User user, Order order) {
        if (mailSender == null) {
            LOGGER.warning("JavaMailSender is not configured. Email confirmation skipped.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(user.getEmail());
            helper.setSubject("Order Confirmed! Order #" + order.getId() + " - Bike Spare Parts Shop");

            // Construct HTML email content
            StringBuilder itemsHtml = new StringBuilder();
            for (OrderItem item : order.getOrderItems()) {
                itemsHtml.append("<tr>")
                         .append("<td style='padding: 8px; border-bottom: 1px solid #ddd;'>")
                         .append(item.getProduct() != null ? item.getProduct().getName() : "Unknown Spare Part")
                         .append("</td>")
                         .append("<td style='padding: 8px; border-bottom: 1px solid #ddd; text-align: center;'>")
                         .append(item.getQuantity())
                         .append("</td>")
                         .append("<td style='padding: 8px; border-bottom: 1px solid #ddd; text-align: right;'>")
                         .append("Rs. ").append(item.getPrice())
                         .append("</td>")
                         .append("</tr>");
            }

            String htmlBody = "<html><body style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>"
                    + "<div style='max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;'>"
                    + "<h2 style='color: #d97706; text-align: center;'>Thank You For Your Order!</h2>"
                    + "<p>Hi " + user.getName() + ",</p>"
                    + "<p>Your order <strong>#" + order.getId() + "</strong> has been successfully processed and is being prepared for dispatch.</p>"
                    + "<h3>Order Details:</h3>"
                    + "<table style='width: 100%; border-collapse: collapse;'>"
                    + "<thead><tr style='background-color: #f8f9fa;'>"
                    + "<th style='padding: 8px; border-bottom: 2px solid #ddd; text-align: left;'>Item</th>"
                    + "<th style='padding: 8px; border-bottom: 2px solid #ddd; text-align: center;'>Qty</th>"
                    + "<th style='padding: 8px; border-bottom: 2px solid #ddd; text-align: right;'>Price</th>"
                    + "</tr></thead>"
                    + "<tbody>" + itemsHtml.toString() + "</tbody>"
                    + "</table>"
                    + "<h3 style='text-align: right; margin-top: 20px;'>Total Amount Paid: <span style='color: #d97706;'>Rs. " + order.getTotalAmount() + "</span></h3>"
                    + "<hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>"
                    + "<p><strong>Delivery Address:</strong><br>" + order.getShippingAddress() + "</p>"
                    + "<p style='font-size: 12px; color: #888; text-align: center; margin-top: 30px;'>"
                    + "This is an automated confirmation email from Bike Spare Parts Shop. Please do not reply to this email.</p>"
                    + "</div></body></html>";

            helper.setText(htmlBody, true);
            mailSender.send(message);
            LOGGER.info("Confirmation email sent successfully to: " + user.getEmail());

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Failed to send order confirmation email to " + user.getEmail() + ": " + e.getMessage());
        }
    }
}
