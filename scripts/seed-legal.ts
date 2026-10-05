/**
 * Upserts the Terms of Service and Privacy Policy into the database as published.
 * Run with: npx tsx scripts/seed-legal.ts
 */

import { PrismaClient } from '@prisma/client'

const seedDatabaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!seedDatabaseUrl) throw new Error('DATABASE_URL or DIRECT_URL must be set.')

const prisma = new PrismaClient({ datasources: { db: { url: seedDatabaseUrl } } })

const SITE_NAME = 'ChefMate'
const CONTACT_EMAIL = 'huchainy2@gmail.com'
const SITE_URL = 'https://chefmate.app'
const EFFECTIVE_DATE = 'October 4, 2026'

// ---------------------------------------------------------------------------
// Terms of Service
// ---------------------------------------------------------------------------
const termsHtml = `
<h1>Terms of Service</h1>
<p><strong>Effective date:</strong> ${EFFECTIVE_DATE}</p>

<p>Welcome to ${SITE_NAME}. By accessing or using this website you agree to these Terms of Service. Please read them carefully. If you do not agree, do not use the service.</p>

<h2>1. Who We Are</h2>
<p>${SITE_NAME} ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>") is a cooking and meal-planning platform. Our contact email is <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. Our website is available at <a href="${SITE_URL}">${SITE_URL}</a>.</p>

<h2>2. What ChefMate Provides</h2>
<p>${SITE_NAME} is an ingredient-first cooking assistant. The service lets you:</p>
<ul>
  <li>Browse a library of Indian and global recipes with step-by-step cooking instructions.</li>
  <li>Scan or manually enter what ingredients you already have at home.</li>
  <li>Discover recipes that match your available ingredients.</li>
  <li>Plan meals for the week using a built-in meal planner.</li>
  <li>Build a grocery list of missing ingredients.</li>
  <li>Play Chef Slice, a browser-based food-themed arcade game.</li>
  <li>Submit enquiries through our contact form.</li>
</ul>
<p>Grocery delivery integration is not yet live. If you operate a grocery or quick-commerce service and would like to integrate, please contact us.</p>

<h2>3. Accounts</h2>
<p>Some features (meal planner, favourites, inventory, grocery lists) require a registered account.</p>
<ul>
  <li>You must provide a valid email address and a password of at least 8 characters.</li>
  <li>You are responsible for keeping your credentials secure.</li>
  <li>You must not share your account with others or create accounts on behalf of third parties without their consent.</li>
  <li>We reserve the right to suspend or terminate accounts that violate these terms or that we believe are being used fraudulently.</li>
  <li>To close your account, contact us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> and we will delete your data within 30 days.</li>
</ul>

<h2>4. Acceptable Use</h2>
<p>You agree not to:</p>
<ul>
  <li>Use the service for any unlawful purpose or in a way that violates any applicable laws.</li>
  <li>Attempt to gain unauthorised access to any part of the service or its underlying infrastructure.</li>
  <li>Scrape, crawl, or copy content at scale without our written permission.</li>
  <li>Submit false, misleading, or harmful content through the contact form or any other input.</li>
  <li>Interfere with or disrupt the service or servers connected to it.</li>
  <li>Impersonate another person or entity.</li>
</ul>

<h2>5. Intellectual Property</h2>
<p>All recipe content, UI design, text, graphics, and code on ${SITE_NAME} are owned by or licensed to us. You may browse and use the site for personal, non-commercial use. You may not reproduce, redistribute, or republish our content without prior written permission.</p>

<h2>6. Recipe Content and Nutritional Information</h2>
<p>Nutritional values (calories, protein, carbohydrates, fat) shown on recipe pages are estimates only. They are provided for general informational purposes and should not be relied on for medical or dietary decisions. Always consult a qualified health professional if you have specific dietary needs or health conditions.</p>

<h2>7. Fridge Scan and AI Features</h2>
<p>The fridge scanning feature may use an AI vision service to identify ingredients from photos you upload. This feature is optional and may not be available in all configurations of the site. AI identification results are approximate and should always be reviewed and corrected by you before use. We are not responsible for errors in ingredient identification.</p>

<h2>8. Third-Party Services</h2>
<p>The service is hosted on infrastructure provided by Supabase (database). We may also use third-party APIs such as YouTube (for recipe videos) and AI vision providers. These third parties have their own terms of service and privacy policies which govern their services independently of ours.</p>

<h2>9. Limitation of Liability</h2>
<p>The service is provided on an "as is" and "as available" basis without warranties of any kind. To the fullest extent permitted by law, we exclude all warranties, express or implied, including but not limited to implied warranties of merchantability and fitness for a particular purpose.</p>
<p>We are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the service.</p>

<h2>10. Changes to These Terms</h2>
<p>We may update these terms from time to time. We will update the effective date at the top of this page when we do. Continued use of the service after changes are published constitutes acceptance of the updated terms.</p>

<h2>11. Governing Law</h2>
<p>These terms are governed by applicable law. If you have a dispute with us that cannot be resolved informally, please contact us first at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>

<h2>12. Contact</h2>
<p>If you have questions about these terms, email us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
`.trim()

// ---------------------------------------------------------------------------
// Privacy Policy
// ---------------------------------------------------------------------------
const privacyHtml = `
<h1>Privacy Policy</h1>
<p><strong>Effective date:</strong> ${EFFECTIVE_DATE}</p>

<p>This Privacy Policy explains what personal data ${SITE_NAME} collects, why we collect it, how we use and protect it, and your rights. By using the service you agree to the practices described here.</p>

<h2>1. Who Is Responsible for Your Data</h2>
<p>${SITE_NAME} is the data controller. You can contact us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> with any privacy-related questions or requests.</p>

<h2>2. What Data We Collect</h2>

<h3>Account data</h3>
<p>When you register, we collect your email address and optionally your name. Your password is never stored in plain text — we store only a cryptographic hash using the Argon2id algorithm.</p>

<h3>Session data</h3>
<p>When you log in we create a session. We store a hashed session token server-side and set an HTTP-only session cookie in your browser. We also record the IP address and browser user-agent string associated with each session. This cookie is not used for advertising or tracking across other websites.</p>

<h3>Content you create</h3>
<p>If you use authenticated features we store:</p>
<ul>
  <li><strong>Inventory</strong> — the ingredients and quantities you enter.</li>
  <li><strong>Favourites</strong> — which recipes you have saved.</li>
  <li><strong>Meal plans</strong> — the recipes you plan per date and meal type.</li>
  <li><strong>Grocery lists</strong> — your shopping list items and their purchased status.</li>
</ul>
<p>This data is linked to your account and is deleted when your account is deleted.</p>

<h3>Contact form submissions</h3>
<p>When you use our contact form we store your name, email, subject, message, IP address, and browser user-agent. We use this to read and respond to your message. If you were logged in when you submitted, your user ID is also recorded.</p>

<h3>Uploaded images (fridge scan)</h3>
<p>If you upload a photo through the fridge scanner, we store the file along with its MIME type and size. If you were logged in the upload is linked to your account. Images may be passed to a third-party AI vision service to identify ingredients; the image is not retained by that service beyond the request.</p>

<h3>Log data</h3>
<p>We maintain audit logs of key account actions (registration, login, failed login attempts, contact form submissions, and admin actions). These logs contain your IP address, browser user-agent, and a description of the action. We use them for security monitoring and fraud prevention.</p>

<h3>Rate-limit counters</h3>
<p>We count requests from your IP address per time window to enforce rate limits. These counters contain only your IP address and the endpoint accessed and are not used for any other purpose.</p>

<h2>3. How We Use Your Data</h2>
<ul>
  <li><strong>Providing the service</strong> — to show you personalised recipe matches, your meal plans, grocery lists, and inventory.</li>
  <li><strong>Account management</strong> — to authenticate you, reset your password, and keep your account secure.</li>
  <li><strong>Security and abuse prevention</strong> — to detect and block suspicious login attempts, spam, and fraud through rate limiting and audit logs.</li>
  <li><strong>Responding to contact enquiries</strong> — to read and reply to messages you send through our contact form.</li>
  <li><strong>Improving the service</strong> — to understand how features are used and fix issues.</li>
</ul>
<p>We do not sell your data to third parties. We do not use your data for advertising or share it with advertising networks.</p>

<h2>4. Cookies</h2>
<p>We use a single HTTP-only session cookie that is set when you log in and removed when you log out or your session expires. It is strictly necessary for authentication and cannot be opted out of while using authenticated features.</p>
<p>We do not use any analytics cookies, tracking pixels, or third-party advertising cookies.</p>

<h2>5. Third-Party Services</h2>
<p>The following third parties may process some of your data as part of delivering the service:</p>
<ul>
  <li><strong>Supabase</strong> — our database hosting provider. Your account data, inventory, meal plans, and all other stored content lives in a Supabase PostgreSQL database. See <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase's Privacy Policy</a>.</li>
  <li><strong>AI vision provider</strong> (optional feature) — if you use the fridge scanner, the uploaded image may be sent to a configured AI vision API to identify ingredients. This feature may not be enabled in all deployments.</li>
  <li><strong>YouTube</strong> (optional) — recipe pages may embed or link to YouTube videos. YouTube has its own privacy policy and may set cookies if you interact with embedded players. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's Privacy Policy</a>.</li>
</ul>

<h2>6. Data Retention</h2>
<ul>
  <li><strong>Account data</strong> — retained until you request deletion.</li>
  <li><strong>Session tokens</strong> — expire automatically and are cleared on logout.</li>
  <li><strong>Contact submissions</strong> — retained until we have handled your enquiry and for a reasonable period thereafter for our records.</li>
  <li><strong>Audit logs</strong> — retained for security purposes for up to 12 months.</li>
  <li><strong>Rate-limit counters</strong> — automatically expire after their rolling time window.</li>
</ul>

<h2>7. Your Rights</h2>
<p>Depending on where you are located you may have rights including:</p>
<ul>
  <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
  <li><strong>Correction</strong> — ask us to correct inaccurate data.</li>
  <li><strong>Deletion</strong> — ask us to delete your account and associated data.</li>
  <li><strong>Portability</strong> — request your data in a machine-readable format.</li>
  <li><strong>Objection</strong> — object to our processing of your data in certain circumstances.</li>
</ul>
<p>To exercise any of these rights, email us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. We will respond within 30 days.</p>

<h2>8. Children's Privacy</h2>
<p>ChefMate is not directed at children under 13. We do not knowingly collect personal data from anyone under 13. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.</p>

<h2>9. Security</h2>
<p>We use industry-standard security measures including Argon2id password hashing, HTTP-only secure cookies, CSRF token protection, rate limiting on authentication endpoints, and server-side audit logging. No system is 100% secure, but we take reasonable precautions to protect your data.</p>

<h2>10. Changes to This Policy</h2>
<p>We may update this policy from time to time. We will update the effective date at the top of this page when we do. Material changes will be communicated by updating this page.</p>

<h2>11. Contact</h2>
<p>For any privacy-related questions or requests, contact us at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
`.trim()

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const now = new Date()

  for (const { type, title, body } of [
    { type: 'terms', title: 'Terms of Service', body: termsHtml },
    { type: 'privacy', title: 'Privacy Policy', body: privacyHtml },
  ]) {
    await prisma.legalDocument.upsert({
      where: { type },
      update: { title, body, status: 'published', publishedAt: now, version: 1 },
      create: { type, title, body, status: 'published', publishedAt: now, version: 1 },
    })
    console.log(`✓ ${title} upserted as published.`)
  }
}

main()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
