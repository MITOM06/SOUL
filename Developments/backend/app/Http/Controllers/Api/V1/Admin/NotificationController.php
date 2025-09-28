<?php
namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
     * Body: { user_id: number, title: string, message?: string, product_id?: number }
     */
    public function individual(Request $r)
    {
        $user = $r->user();
        $data = $r->validate([
            'user_id'    => 'required|integer|exists:users,id',
            'title'      => 'required|string|max:200',
            'message'    => 'nullable|string',
            'product_id' => 'nullable|integer',
        ]);

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
            'to_role'      => null,
            'to_user_id'   => (int) $data['user_id'],
            'from_user_id' => $user?->id,
            'title'        => $data['title'],
            'body'         => $data['message'] ?? null,
            'payload'      => $payload ? json_encode($payload) : null,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Notification created']);
    }
}

