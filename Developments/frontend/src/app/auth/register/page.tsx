// frontend/src/app/auth/register/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  terms: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser, refreshUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      terms: false,
    },
  });

  const password = watch('password');

  const showTopError = (msg: string) => {
    toast.dismiss();
    toast.error(msg, { position: 'top-center', duration: 3000 });
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const ok = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      if (!ok) return;
      try { await refreshUser(); } catch {}
      router.replace('/');
    } catch (error) {
      console.error('Register error:', error);
      showTopError('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = () => {
    const firstError =
      errors.name?.message ||
      errors.email?.message ||
      errors.password?.message ||
      errors.password_confirmation?.message ||
      errors.terms?.message;
    if (firstError) showTopError(firstError.toString());
    else showTopError('Please check the form and try again');
  };

  const RequiredLabel = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
      {children} <span className="text-red-500">*</span>
    </label>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create a new account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to an existing account
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
          <div className="space-y-4">
            {/* Name (required) */}
            <div>
              <RequiredLabel htmlFor="name">Full name</RequiredLabel>
              <input
                id="name"
                {...register('name', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  validate: (v) => v.trim().length > 0 || 'Full name cannot be empty',
                })}
                type="text"
                required
                aria-invalid={!!errors.name}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* Email (required) */}
            <div>
              <RequiredLabel htmlFor="email">Email</RequiredLabel>
              <input
                id="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                required
                aria-invalid={!!errors.email}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            {/* Password (required) */}
            <div>
              <RequiredLabel htmlFor="password">Password</RequiredLabel>
              <div className="mt-1 relative">
                <input
                  id="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  required
                  aria-invalid={!!errors.password}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password (required) */}
            <div>
              <RequiredLabel htmlFor="password_confirmation">Confirm password</RequiredLabel>
              <div className="mt-1 relative">
                <input
                  id="password_confirmation"
                  {...register('password_confirmation', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Password confirmation does not match',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  aria-invalid={!!errors.password_confirmation}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="mt-1 text-sm text-red-600">{errors.password_confirmation.message}</p>
              )}
            </div>
          </div>

          {/* Terms (required) */}
          <div className="flex items-start gap-2">
            <input
              id="terms"
              type="checkbox"
              aria-invalid={!!errors.terms}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register('terms', {
                validate: (v) =>
                  v === true || 'Please agree to the Terms and Privacy Policy to register.',
              })}
            />
            <div className="text-sm">
              <RequiredLabel htmlFor="terms">
                I agree to the{' '}
                <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                  Terms of Use
                </Link>{' '}
                and the{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </Link>
              </RequiredLabel>
              {errors.terms && (
                <p className="mt-1 text-sm text-red-600">{errors.terms.message as string}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Register'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
