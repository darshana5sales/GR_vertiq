<?php
/* ════════════════════════════════════════════════════════════════
   GR VertiQ — Contact form mailer (SMTP via PHPMailer)
   ----------------------------------------------------------------
   FILL IN THE SMTP SETTINGS BELOW before going live.
   For cPanel hosting, create an email account (e.g. no-reply@grvertiq.com)
   and use its credentials here. Host is usually mail.yourdomain.com.
   ════════════════════════════════════════════════════════════════ */

const SMTP_HOST   = 'mail.grvertiq.com';        // ← your SMTP server
const SMTP_PORT   = 587;                        // 587 = TLS, 465 = SSL
const SMTP_SECURE = 'tls';                      // 'tls' or 'ssl'
const SMTP_USER   = 'no-reply@grvertiq.com';    // ← SMTP login (full email)
const SMTP_PASS   = 'YOUR_SMTP_PASSWORD_HERE';  // ← SMTP password

const FROM_EMAIL  = 'no-reply@grvertiq.com';    // sender shown on the email
const FROM_NAME   = 'GR VertiQ Website';
const TO_EMAIL    = 'marketing@grvertiq.com';   // main recipient
const TO_NAME     = 'GR VertiQ Marketing';
$CC_EMAILS  = ['gajjardarshan29@gmail.com'];    // carbon copies (add more, comma-separated array)
$BCC_EMAILS = [];                               // blind copies, e.g. ['owner@grvertiq.com']

/* ───────────────────────── no edits needed below ───────────────────────── */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/phpmailer/Exception.php';
require __DIR__ . '/phpmailer/PHPMailer.php';
require __DIR__ . '/phpmailer/SMTP.php';

function back_with_error() {
    header('Location: index.html?mailerr=1#contact');
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: index.html#contact');
    exit;
}

/* honeypot: bots fill this hidden field — silently pretend success */
if (!empty($_POST['_honey'])) {
    header('Location: thank-you.html');
    exit;
}

$field = fn($k) => trim((string)($_POST[$k] ?? ''));

$first   = $field('first_name');
$last    = $field('last_name');
$email   = $field('email');
$phone   = $field('phone');
$product = $field('product');
$message = $field('message');

/* server-side validation (mirrors the client-side rules) */
$validProducts = [
    'Passenger Elevator', 'Hospital Elevator', 'Freight Elevator', 'Car Elevator',
    'Dumbwaiter Elevator', 'Commercial Escalator', 'Heavy Duty Escalator', 'Maintenance / After-Sales'
];
if (
    mb_strlen($first) < 2 || mb_strlen($last) < 2 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    !in_array($product, $validProducts, true) ||      /* placeholder "" never passes */
    mb_strlen($message) < 10 ||
    ($phone !== '' && !preg_match('/^[+0-9 ()\-]{7,20}$/', $phone))
) {
    back_with_error();
}

/* prepend the selected country dialling code (whitelisted) to the phone number */
$validCodes = ['+221', '+220', '+245', '+224', '+232', '+231', '+225', '+233', '+228'];
$phoneCode  = $field('phone_code');
if ($phone !== '' && in_array($phoneCode, $validCodes, true)) {
    $phone = $phoneCode . ' ' . $phone;
}

$h = fn($v) => htmlspecialchars($v, ENT_QUOTES, 'UTF-8');
$name = $h($first) . ' ' . $h($last);

/* branded tabular email body */
$row = fn($label, $value) =>
    '<tr><td style="padding:11px 16px;border-bottom:1px solid #E7EAF3;font-weight:700;color:#373435;width:190px;background:#F5F7FC;">' . $label . '</td>' .
    '<td style="padding:11px 16px;border-bottom:1px solid #E7EAF3;color:#3a4054;">' . $value . '</td></tr>';

$html =
'<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;border:1px solid #E7EAF3;border-radius:12px;overflow:hidden;">
  <div style="background:#1F3468;padding:22px 26px;">
    <div style="color:#FFDD21;font-size:12px;letter-spacing:3px;font-weight:700;">GR VERTIQ SOLUTION SARL</div>
    <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:4px;">New Website Enquiry</div>
  </div>
  <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#ffffff;">'
    . $row('Name', $name)
    . $row('Email', '<a href="mailto:' . $h($email) . '" style="color:#3051A0;">' . $h($email) . '</a>')
    . $row('Phone / WhatsApp', $phone !== '' ? $h($phone) : '&mdash;')
    . $row('Product Interest', $h($product))
    . $row('Message', nl2br($h($message))) .
  '</table>
  <div style="background:#F5F7FC;padding:14px 26px;font-size:12px;color:#5D6478;">
    Sent from the grvertiq.com contact form &middot; ' . $h(date('d M Y, H:i')) . ' &middot; Reply to this email to answer ' . $h($first) . ' directly.
  </div>
</div>';

$text = "New Website Enquiry — GR VertiQ\n\n"
      . "Name: $first $last\nEmail: $email\nPhone: " . ($phone !== '' ? $phone : '—')
      . "\nProduct Interest: $product\n\nMessage:\n$message\n";

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = SMTP_SECURE === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = 'UTF-8';

    $mail->setFrom(FROM_EMAIL, FROM_NAME);
    $mail->addAddress(TO_EMAIL, TO_NAME);
    foreach ($CC_EMAILS as $cc)   { if ($cc)  $mail->addCC($cc); }
    foreach ($BCC_EMAILS as $bcc) { if ($bcc) $mail->addBCC($bcc); }
    $mail->addReplyTo($email, "$first $last");   /* replying goes to the customer */

    $mail->isHTML(true);
    $mail->Subject = "New Website Enquiry — $product — $first $last";
    $mail->Body    = $html;
    $mail->AltBody = $text;

    $mail->send();
    header('Location: thank-you.html');
    exit;
} catch (Exception $e) {
    back_with_error();
}
