<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your New Password</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; color: #111827; }
        .box { max-width: 600px; margin: 0 auto; padding: 16px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; }
        .title { font-size: 18px; font-weight: 700; }
        .pw { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; background: #111827; color: #fff; padding: 6px 10px; border-radius: 8px; display: inline-block; }
        .muted { color: #6b7280; font-size: 14px; }
    </style>
    </head>
<body>
    <div class="box">
        <p class="title">Hello {{ $userName }},</p>
        <p>We received a request to reset your password. Your new password is:</p>
        <p><span class="pw">{{ $newPassword }}</span></p>
        <p class="muted">You can change this password later in your profile settings.</p>
        <p>Thanks,<br/>SOUL Team</p>
    </div>
</body>
</html>

