<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $userName;
    public string $newPassword;

    public function __construct($user, string $newPassword)
    {
        $this->userName    = (string)($user->name ?? $user->email);
        $this->newPassword = $newPassword;
    }

    public function build()
    {
        return $this->subject('Your New Password')
            ->view('emails.password_reset')
            ->with([
                'userName'    => $this->userName,
                'newPassword' => $this->newPassword,
            ]);
    }
}

