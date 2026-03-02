const nodemailer = require('nodemailer');
const db = require('./database');

class EmailService {
  constructor() {
    // Initialize email transporter
    // In production, configure with actual SMTP settings
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verify connection
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      this.transporter.verify((error) => {
        if (error) {
          console.warn('⚠️  Email service not configured properly:', error.message);
        } else {
          console.log('✅ Email service ready');
        }
      });
    } else {
      console.log('📝 Email service: Using mock mode (SMTP not configured)');
    }
  }

  // Get organization branding for emails
  async getOrganizationBranding(orgId) {
    if (!orgId) {
      return this.getDefaultBranding();
    }

    try {
      const settings = await db.getWhiteLabelSettings(orgId);
      if (settings) {
        return {
          logo: settings.branding.logo || null,
          companyName: settings.branding.companyName || 'PolyOne',
          supportEmail: settings.branding.supportEmail || process.env.SUPPORT_EMAIL || 'support@polyone.io',
          primaryColor: settings.colors.primary || '#a855f7',
          secondaryColor: settings.colors.secondary || '#ec4899',
        };
      }
    } catch (error) {
      console.error('Error fetching organization branding:', error);
    }

    return this.getDefaultBranding();
  }

  getDefaultBranding() {
    return {
      logo: null,
      companyName: 'PolyOne',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@polyone.io',
      primaryColor: '#a855f7',
      secondaryColor: '#ec4899',
    };
  }

  // Generate email HTML template
  generateEmailTemplate(branding, subject, content, footerText = null) {
    const { logo, companyName, supportEmail, primaryColor, secondaryColor } = branding;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      max-width: 150px;
      max-height: 60px;
      margin-bottom: 20px;
    }
    .email-body {
      padding: 40px 20px;
    }
    .email-footer {
      background-color: #f9f9f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666666;
      border-top: 1px solid #eeeeee;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer-link {
      color: ${primaryColor};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      ${logo ? `<img src="${logo}" alt="${companyName}" class="logo" />` : `<h1 style="color: #ffffff; margin: 0;">${companyName}</h1>`}
    </div>
    <div class="email-body">
      ${content}
    </div>
    <div class="email-footer">
      ${footerText || `<p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>`}
      <p>Need help? Contact us at <a href="mailto:${supportEmail}" class="footer-link">${supportEmail}</a></p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  // Send welcome email
  async sendWelcomeEmail(userEmail, userName, orgId = null) {
    const branding = await this.getOrganizationBranding(orgId);
    const subject = `Welcome to ${branding.companyName}!`;
    
    const content = `
      <h2>Welcome, ${userName}!</h2>
      <p>Thank you for joining ${branding.companyName}. We're excited to have you on board!</p>
      <p>You can now start deploying your blockchain networks and managing your app chains.</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    `;

    return this.sendEmail(userEmail, subject, content, branding);
  }

  // Send chain deployment notification
  async sendChainDeploymentEmail(userEmail, chainName, status, orgId = null) {
    const branding = await this.getOrganizationBranding(orgId);
    const subject = `Chain Deployment ${status === 'active' ? 'Successful' : 'Update'}: ${chainName}`;
    
    const statusColor = status === 'active' ? '#10b981' : status === 'failed' ? '#ef4444' : '#f59e0b';
    const statusText = status === 'active' ? 'Successfully Deployed' : status === 'failed' ? 'Deployment Failed' : 'In Progress';
    
    const content = `
      <h2>Chain Deployment ${statusText}</h2>
      <p>Your chain <strong>${chainName}</strong> has been ${status === 'active' ? 'successfully deployed' : status === 'failed' ? 'failed to deploy' : 'is being deployed'}.</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Status:</strong> <span style="color: ${statusColor};">${statusText}</span></p>
        <p style="margin: 5px 0 0 0;"><strong>Chain Name:</strong> ${chainName}</p>
      </div>
      ${status === 'active' ? `<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/chains" class="button">View Chain</a>` : ''}
    `;

    return this.sendEmail(userEmail, subject, content, branding);
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, resetToken, orgId = null) {
    const branding = await this.getOrganizationBranding(orgId);
    const subject = `Reset Your ${branding.companyName} Password`;
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const content = `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password for your ${branding.companyName} account.</p>
      <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
      <p style="font-size: 12px; color: #666666;">Or copy and paste this link: ${resetUrl}</p>
    `;

    return this.sendEmail(userEmail, subject, content, branding);
  }

  // Send email verification email
  async sendEmailVerificationEmail(userEmail, verificationToken, orgId = null) {
    const branding = await this.getOrganizationBranding(orgId);
    const subject = `Verify Your ${branding.companyName} Email`;
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const content = `
      <h2>Verify Your Email Address</h2>
      <p>Thank you for signing up for ${branding.companyName}!</p>
      <p>Please verify your email address by clicking the button below. This link will expire in 24 hours.</p>
      <a href="${verificationUrl}" class="button">Verify Email</a>
      <p>If you didn't create an account, please ignore this email.</p>
      <p style="font-size: 12px; color: #666666;">Or copy and paste this link: ${verificationUrl}</p>
    `;

    return this.sendEmail(userEmail, subject, content, branding);
  }

  // Send notification email
  async sendNotificationEmail(userEmail, title, message, actionUrl = null, actionText = null, orgId = null) {
    const branding = await this.getOrganizationBranding(orgId);
    const subject = title;
    
    let content = `<h2>${title}</h2><p>${message}</p>`;
    
    if (actionUrl && actionText) {
      content += `<a href="${actionUrl}" class="button">${actionText}</a>`;
    }

    return this.sendEmail(userEmail, subject, content, branding);
  }

  // Generic email sender
  async sendEmail(to, subject, htmlContent, branding = null) {
    if (!branding) {
      branding = this.getDefaultBranding();
    }

    const html = this.generateEmailTemplate(branding, subject, htmlContent);

    // If SMTP is not configured, log the email instead
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('📧 Email (mock mode):');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   HTML length: ${html.length} chars`);
      return { success: true, mock: true };
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${branding.companyName}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });

      console.log('✅ Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();























