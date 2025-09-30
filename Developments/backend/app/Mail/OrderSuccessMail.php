<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $order;
    public $payment;

    /**
     * Create a new message instance.
     */
    public function __construct($user, $order, $payment)
    {
        $this->user = $user;
        $this->order = $order;
        $this->payment = $payment;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $subject = 'Your SOUL order is confirmed';

        return $this
            ->subject($subject)
            ->markdown('emails.order_success');
    }
}

