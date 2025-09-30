<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SubscriptionSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $planKey;
    public $subscription;

    public function __construct($user, string $planKey, $subscription)
    {
        $this->user = $user;
        $this->planKey = $planKey;
        $this->subscription = $subscription;
    }

    public function build()
    {
        $subject = 'Your SOUL subscription is active';
        return $this
            ->subject($subject)
            ->markdown('emails.subscription_success');
    }
}

