<?php
/* ════════════════════════════════════════════════════════════════
   GR VertiQ — PDF brochure lead capture
   Called via AJAX (fetch POST) from the product cards modal.
   Sends a branded lead-notification email via SMTP and returns JSON.
   Uses the same SMTP config as send-mail.php — fill it in once there.
   ════════════════════════════════════════════════════════════════ */

/* ── SMTP config (keep in sync with send-mail.php) ── */
const SMTP_HOST   = 'mail.grvertiq.com';
const SMTP_PORT   = 587;
const SMTP_SECURE = 'tls';
const SMTP_USER   = 'no-reply@grvertiq.com';
const SMTP_PASS   = 'YOUR_SMTP_PASSWORD_HERE';

const FROM_EMAIL  = 'no-reply@grvertiq.com';
const FROM_NAME   = 'GR VertiQ Website';
const TO_EMAIL    = 'marketing@grvertiq.com';
const TO_NAME     = 'GR VertiQ Marketing';
$CC_EMAILS  = ['gajjardarshan29@gmail.com'];
$BCC_EMAILS = [];

/* ── no edits needed below ── */
header('Content-Type: application/json');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/phpmailer/Exception.php';
require __DIR__ . '/phpmailer/PHPMailer.php';
require __DIR__ . '/phpmailer/SMTP.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$field = fn($k) => trim((string)($_POST[$k] ?? ''));

$name    = $field('name');
$mobile  = $field('mobile');
$email   = $field('email');
$product = $field('product');   /* e.g. "Passenger Elevator Brochure" */
$pdf     = $field('pdf');       /* e.g. "pdf/GRVERTIQ Passenger Elevator.pdf" */

/* basic server-side validation */
if (mb_strlen($name) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL) || empty($product)) {
    echo json_encode(['ok' => false, 'error' => 'Validation failed']);
    exit;
}

/* prevent path traversal — only allow files inside the pdf/ folder */
$realBase = realpath(__DIR__ . '/pdf') ?: '';
$realPdf  = realpath(__DIR__ . '/' . $pdf) ?: '';
if (!$realBase || !str_starts_with($realPdf, $realBase)) {
    echo json_encode(['ok' => false, 'error' => 'Invalid file']);
    exit;
}

$h   = fn($v) => htmlspecialchars($v, ENT_QUOTES, 'UTF-8');
$row = fn($label, $value) =>
    '<tr><td style="padding:11px 16px;border-bottom:1px solid #E7EAF3;font-weight:700;color:#373435;width:200px;background:#F5F7FC;">' . $label . '</td>' .
    '<td style="padding:11px 16px;border-bottom:1px solid #E7EAF3;color:#3a4054;">' . $value . '</td></tr>';

$html =
'<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;border:1px solid #E7EAF3;border-radius:12px;overflow:hidden;">
  <div style="background:#1F3468;padding:22px 26px;">
    <div style="color:#FFDD21;font-size:12px;letter-spacing:3px;font-weight:700;">GR VERTIQ SOLUTION SARL</div>
    <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:4px;">New Brochure Download Lead</div>
  </div>
  <div style="background:#fff8e1;padding:12px 26px;border-bottom:1px solid #E7EAF3;">
    <span style="font-size:13px;font-weight:700;color:#8a6000;">📄 Brochure downloaded: </span>
    <span style="font-size:13px;color:#1F3468;font-weight:800;">' . $h($product) . '</span>
  </div>
  <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;background:#ffffff;">'
    . $row('Name', $h($name))
    . $row('Email', '<a href="mailto:' . $h($email) . '" style="color:#3051A0;">' . $h($email) . '</a>')
    . $row('Mobile / Phone', $mobile !== '' ? $h($mobile) : '&mdash;')
    . $row('Brochure Downloaded', '<strong>' . $h($product) . '</strong>')
    . $row('PDF File', $h(basename($pdf))) .
  '</table>
  <div style="background:#F5F7FC;padding:14px 26px;font-size:12px;color:#5D6478;">
    Lead captured from grvertiq.com product page &middot; ' . $h(date('d M Y, H:i')) . ' UTC &middot; Reply to this email to contact ' . $h($name) . ' directly.
  </div>
</div>';

$text = "New Brochure Download Lead — GR VertiQ\n\n"
      . "Brochure: $product\nFile: " . basename($pdf)
      . "\n\nName: $name\nEmail: $email\nMobile: " . ($mobile !== '' ? $mobile : '—') . "\n";

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
    foreach ($CC_EMAILS as $cc)  { if ($cc)  $mail->addCC($cc); }
    foreach ($BCC_EMAILS as $bcc){ if ($bcc) $mail->addBCC($bcc); }
    $mail->addReplyTo($email, $name);

    $mail->isHTML(true);
    $mail->Subject = "Brochure Download Lead — $product — $name";
    $mail->Body    = $html;
    $mail->AltBody = $text;

    $mail->send();
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    /* still return ok — the JS will download the PDF regardless */
    echo json_encode(['ok' => false, 'error' => 'Mail failed']);
}
