<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>{{ $title ?? 'Report' }}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: DejaVu Sans, Arial, Helvetica, sans-serif; font-size: 12px; color: #111; }
      .header { margin-bottom: 16px; }
      .title { font-size: 20px; font-weight: bold; }
      .muted { color: #666; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px; }
      .label { font-size: 11px; color: #555; }
      .value { font-size: 14px; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
      th { background: #f8fafc; }
      .foot { margin-top: 12px; font-size: 11px; color: #555; }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="title">{{ $title ?? 'Report' }}</div>
      <div class="muted">Mode: {{ strtoupper($mode ?? '') }} | Range: {{ $range ?? '' }}</div>
      <div class="muted">Generated at: {{ $generated_at ?? '' }}</div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="label">Total Orders</div>
        <div class="value">{{ number_format(($summary['orders'] ?? 0)) }}</div>
      </div>
      <div class="card">
        <div class="label">Plan Purchases</div>
        <div class="value">{{ number_format(($summary['subs'] ?? 0)) }}</div>
      </div>
      <div class="card">
        <div class="label">Total Products</div>
        <div class="value">{{ number_format(($summary['products'] ?? 0)) }}</div>
      </div>
      <div class="card">
        <div class="label">Total Revenue (USD)</div>
        @php $totalCents = array_sum($values ?? []); @endphp
        <div class="value">${{ number_format(($totalCents/100), 2) }}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>{{ $mode === 'month' ? 'Month' : 'Date' }}</th>
          <th>Revenue (USD)</th>
        </tr>
      </thead>
      <tbody>
        @foreach(($labels ?? []) as $i => $label)
          @php $cents = (int) (($values[$i] ?? 0)); @endphp
          <tr>
            <td>{{ $label }}</td>
            <td>${{ number_format(($cents/100), 2) }}</td>
          </tr>
        @endforeach
      </tbody>
    </table>

    <div class="foot">Confidential — internal use only.</div>
  </body>
  </html>

