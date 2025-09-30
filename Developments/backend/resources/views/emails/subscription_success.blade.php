@component('mail::message')
# Welcome to {{ strtoupper($planKey) }} 🎉

Hi {{ $user->name ?? $user->email }}, your subscription is now active.

@component('mail::panel')
Plan: <strong>{{ strtoupper($planKey) }}</strong><br/>
Status: <strong>{{ $subscription->status }}</strong><br/>
@if(!empty($subscription->end_date))
Renews on: <strong>{{ \Carbon\Carbon::parse($subscription->end_date)->toDayDateTimeString() }}</strong>
@endif
@endcomponent

Enjoy premium content, priority support, and more. We’re excited to have you!

@component('mail::button', ['url' => config('app.url').'/my-package'])
View My Package
@endcomponent

Thank you for supporting SOUL!

— The SOUL Team
@endcomponent

