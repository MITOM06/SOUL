<?php
namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    /**
     * GET /api/v1/notifications
     * Returns notifications for the authenticated user.
     * Includes: direct (to_user_id) + role-targeted (to_role matches user's role) + global (to_role null).
     */
    public function index(Request $r)
    {
        $user = $r->user();
        $role = $user->role ?? 'user';

        $per  = (int) ($r->query('per_page', 50));
        $page = (int) ($r->query('page', 1));

        $q = DB::table('notifications')
            ->where(function($x) use ($user) {
                $x->where('to_user_id', $user->id)
                  ->orWhereNull('to_user_id');
            })
            ->where(function($x) use ($role) {
                $x->whereNull('to_role')
                  ->orWhere('to_role', $role);
            });

        $total = $q->count();
        $items = $q->orderByDesc('id')
            ->forPage($page, $per)
            ->get(['id','to_role','to_user_id','from_user_id','title','body','payload','read_at','created_at']);

        // Decode payload JSON
        $items->transform(function($row) {
            if (isset($row->payload) && is_string($row->payload)) {
                $decoded = json_decode($row->payload, true);
                $row->payload = $decoded ?: null;
            }
            return $row;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $items,
                'pagination' => [
                    'page'        => $page,
                    'per_page'    => $per,
                    'total'       => $total,
                    'total_pages' => (int) ceil($total / max($per, 1)),
                ],
            ],
        ]);
    }

    /**
     * GET /api/v1/notifications/unread-count
     * Returns count of notifications with read_at IS NULL for the current user (direct+role+global).
     */
    public function unreadCount(Request $r)
    {
        $user = $r->user();
        $role = $user->role ?? 'user';

        $q = DB::table('notifications')
            ->where(function($x) use ($user) {
                $x->where('to_user_id', $user->id)
                  ->orWhereNull('to_user_id');
            })
            ->where(function($x) use ($role) {
                $x->whereNull('to_role')
                  ->orWhere('to_role', $role);
            })
            ->whereNull('read_at');

        $count = (int) $q->count();
        return response()->json(['success' => true, 'data' => ['unread' => $count]]);
    }

    /**
     * POST /api/v1/notifications/mark-read
     * Body: { ids?: number[] } — if not provided, mark all current-user notifications as read.
     */
    public function markRead(Request $r)
    {
        $user = $r->user();
        $ids = $r->input('ids');

        $q = DB::table('notifications')
            ->where(function($x) use ($user) {
                $x->where('to_user_id', $user->id)
                  ->orWhereNull('to_user_id');
            })
            ->where(function($x) use ($user) {
                $role = $user->role ?? 'user';
                $x->whereNull('to_role')
                  ->orWhere('to_role', $role);
            })
            ->whereNull('read_at');

        if (is_array($ids) && !empty($ids)) {
            $q->whereIn('id', array_map('intval', $ids));
        }

        $updated = $q->update(['read_at' => now()]);
        return response()->json(['success' => true, 'data' => ['updated' => (int) $updated]]);
    }
}
