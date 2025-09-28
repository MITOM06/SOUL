<?php
namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class NotificationController extends Controller
{
    /**
     * POST /api/v1/admin/notifications/broadcast
     * Body: { target: 'all'|'users'|'admins', title: string, message?: string, product_id?: number }
     */
    public function broadcast(Request $r)
    {
        $user = $r->user();
        $data = $r->validate([
            'target'     => 'required|in:all,users,admins',
            'title'      => 'required|string|max:200',
            'message'    => 'nullable|string',
            'product_id' => 'nullable|integer',
        ]);

        $toRole = null;
        if ($data['target'] === 'users') $toRole = 'user';
        if ($data['target'] === 'admins') $toRole = 'admin';

        $payload = null;
        if (!empty($data['product_id'])) {
            $p = DB::table('products')->where('id', (int) $data['product_id'])->first();
            if ($p) {
                $payload = [
                    'product' => [
                        'id' => $p->id,
                        'title' => $p->title,
                        'thumbnail_url' => $p->thumbnail_url,
                        'type' => $p->type,
                        'category' => $p->category,
                        'price_cents' => $p->price_cents,
                    ],
                ];
            }
        }

        DB::table('notifications')->insert([
            'to_role'      => $toRole,
            'to_user_id'   => null,
            'from_user_id' => $user?->id,
            'title'        => $data['title'],
            'body'         => $data['message'] ?? null,
            'payload'      => $payload ? json_encode($payload) : null,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Broadcast created']);
    }

    /**
     * POST /api/v1/admin/notifications/individual
     * Accepts either JSON or multipart form-data.
     * Body JSON: { user_id: number, title: string, message?: string }
     * Or multipart: user_ids[] (multi), title, message, files[] (optional attachments)
     */
    public function individual(Request $r)
    {
        $user = $r->user();

        // When multipart, allow multiple recipients and attachments
        if (str_starts_with(strtolower((string)$r->header('Content-Type')), 'multipart/')) {
            $v = validator($r->all(), [
                'user_ids'   => ['required','array','min:1'],
                'user_ids.*' => ['integer','exists:users,id'],
                'title'      => ['required','string','max:200'],
                'message'    => ['nullable','string'],
                'files'      => ['sometimes','array'],
                'files.*'    => ['file','max:51200'], // up to 50MB per file
            ]);
            if ($v->fails()) {
                return response()->json(['success'=>false,'message'=>$v->errors()->first()], 422);
            }

            $data = $v->validated();
            $attachments = [];
            if ($r->hasFile('files')) {
                foreach ($r->file('files') as $f) {
                    if (!$f->isValid()) continue;
                    $path = $f->store('notifications', 'public');
                    $attachments[] = [
                        'url'  => '/storage/' . $path,
                        'name' => $f->getClientOriginalName(),
                        'mime' => $f->getClientMimeType(),
                        'size' => $f->getSize(),
                    ];
                }
            }

            $payload = [];
            if (!empty($attachments)) $payload['attachments'] = $attachments;
            $payloadJson = !empty($payload) ? json_encode($payload) : null;

            $rows = [];
            $now = now();
            foreach ($data['user_ids'] as $uid) {
                $rows[] = [
                    'to_role'      => null,
                    'to_user_id'   => (int) $uid,
                    'from_user_id' => $user?->id,
                    'title'        => $data['title'],
                    'body'         => $data['message'] ?? null,
                    'payload'      => $payloadJson,
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ];
            }
            DB::table('notifications')->insert($rows);

            return response()->json(['success' => true, 'message' => 'Notifications created']);
        }

        // Fallback: JSON single-recipient
        $data = $r->validate([
            'user_id' => 'required|integer|exists:users,id',
            'title'   => 'required|string|max:200',
            'message' => 'nullable|string',
        ]);

        DB::table('notifications')->insert([
            'to_role'      => null,
            'to_user_id'   => (int) $data['user_id'],
            'from_user_id' => $user?->id,
            'title'        => $data['title'],
            'body'         => $data['message'] ?? null,
            'payload'      => null,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Notification created']);
    }
}
