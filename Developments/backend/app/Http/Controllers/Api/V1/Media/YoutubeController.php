<?php

namespace App\Http\Controllers\Api\V1\Media;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class YoutubeController extends Controller
{
    public function lookup(Request $r)
    {
        $url = trim((string) $r->query('url', ''));
        if ($url === '') return response()->json(['success'=>false,'message'=>'Missing url'], 422);

        if (!preg_match('~(?:youtu\.be/|/embed/|/shorts/|/v/|watch\?v=)([A-Za-z0-9_-]{11})~', $url, $m)) {
            return response()->json(['success'=>false,'message'=>'Invalid YouTube URL'], 422);
        }
        $id    = $m[1];
        $watch = "https://www.youtube.com/watch?v={$id}";
        $embed = "https://www.youtube.com/embed/{$id}";
        $thumb = "https://img.youtube.com/vi/{$id}/hqdefault.jpg";

        $title = null;
        try {
            $o = Http::timeout(4)->get('https://www.youtube.com/oembed', ['url'=>$watch,'format'=>'json']);
            if ($o->ok()) $title = $o->json('title');
        } catch (\Throwable $e) {}

        return response()->json([
            'success'=>true,
            'data'=>[
                'video_id'=>$id,
                'title'=>$title,
                'thumbnail_url'=>$thumb,
                'watch_url'=>$watch,
                'embed_url'=>$embed,
            ]
        ]);
    }
}
