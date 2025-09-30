@php
  use Illuminate\Support\Str;
  $abs = function($u) {
    if (!$u) return '';
    $s = trim((string)$u);
    if (Str::startsWith($s, ['http://','https://'])) return $s;
    return rtrim(config('app.url'), '/') . '/' . ltrim($s,'/');
  };
  $order = $order ?? ($payment->order ?? null);
  $items = $order?->items ?? collect();
  $total = number_format(($order->total_cents ?? 0)/100, 2);
@endphp

@component('mail::message')
# Thanks for your purchase, {{ $user->name ?? $user->email }}!

Your order has been paid successfully. Below are the details.

@component('mail::panel')
Order ID: <strong>#{{ $order->id }}</strong><br/>
Total: <strong>${{ $total }}</strong><br/>
Payment ID: <strong>#{{ $payment->id }}</strong>
@endcomponent

## Items

@foreach($items as $item)
- {{ $item->product->title ?? ('Item #'.$item->product_id) }} (x{{ $item->quantity }}) — ${{ number_format(($item->unit_price_cents ?? 0)/100, 2) }}
@endforeach

@component('mail::table')
| Cover | Title | Qty | Price |
|:-----:|:------|:---:|------:|
@foreach($items as $item)
| <img src="{{ $abs($item->product->thumbnail_url ?? '') }}" alt="" width="80"/> | {{ $item->product->title ?? ('#'.$item->product_id) }} | {{ $item->quantity }} | ${{ number_format(($item->unit_price_cents ?? 0)/100, 2) }} |
@endforeach
@endcomponent

We’ve added your items to your library. You can start reading or listening right away.

@component('mail::button', ['url' => config('app.url').'/library'])
Go to My Library
@endcomponent

Cheers,<br>
The SOUL Team

@slot('subcopy')
If you didn’t make this purchase, please contact support immediately.
@endslot
@endcomponent

