<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\User;
use App\Mail\PasswordResetMail;
use Illuminate\Support\Facades\App;

class PasswordResetController extends Controller
{
    /**
     * POST /api/v1/auth/forgot-password
     * Body: { email: string }
     * - Generate a random 8-char alphanumeric password
     * - Update user's password_hash
     * - Send the new password to the email
     */
    public function forgot(Request $request)
    {
        $data = $request->validate([
            'email' => ['required','email'],
        ]);

        $email = strtolower(trim($data['email']));
        // Case-insensitive lookup to avoid collation issues
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Email not found',
            ], 404);
        }

        // 8-char alphanumeric password
        $newPassword = Str::random(8);
        $user->password_hash = Hash::make($newPassword);
        $user->save();

        try {
            Mail::to($user->email)->send(new PasswordResetMail($user, $newPassword));
        } catch (\Throwable $e) {
            // password already changed above; log failure and inform caller
            Log::error('PasswordResetMail send failed', [
                'user_id' => $user->id,
                'email'   => $user->email,
                'error'   => $e->getMessage(),
            ]);
            $payload = [
                'success' => true,
                'message' => 'Password updated but failed to send email. Please contact support.',
            ];
            // In local/dev or when using log mailer, return the new password to help testing
            $isDebug = App::environment('local') || config('mail.default') === 'log' || env('MAIL_MAILER') === 'log';
            if ($isDebug) $payload['debug_password'] = $newPassword;
            return response()->json($payload, 200);
        }

        $payload = [
            'success' => true,
            'message' => 'A new password has been sent to your email.',
        ];
        $isDebug = App::environment('local') || config('mail.default') === 'log' || env('MAIL_MAILER') === 'log';
        if ($isDebug) $payload['debug_password'] = $newPassword;
        return response()->json($payload, 200);
    }
} 
