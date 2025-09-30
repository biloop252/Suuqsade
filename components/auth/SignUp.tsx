'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { UserPlusIcon, ArrowLeftIcon } from 'lucide-react';

export default function SignUp() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <UserPlusIcon className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Join Suuqsade
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Create your account and start shopping with amazing deals
            </p>
          </div>
          
          <div className="bg-white py-8 px-6 shadow-lg rounded-xl border border-gray-100">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#f97316',
                      brandAccent: '#ea580c',
                      brandButtonText: '#ffffff',
                      defaultButtonBackground: '#f97316',
                      defaultButtonBackgroundHover: '#ea580c',
                      inputBackground: '#f9fafb',
                      inputBorder: '#d1d5db',
                      inputBorderHover: '#f97316',
                      inputBorderFocus: '#f97316',
                      inputText: '#111827',
                      inputLabelText: '#374151',
                      messageText: '#6b7280',
                      messageTextDanger: '#dc2626',
                      anchorTextColor: '#f97316',
                      anchorTextHoverColor: '#ea580c',
                    },
                    space: {
                      spaceSmall: '4px',
                      spaceMedium: '8px',
                      spaceLarge: '16px',
                      labelBottomMargin: '8px',
                      anchorBottomMargin: '4px',
                      emailInputSpacing: '4px',
                      socialAuthSpacing: '4px',
                      buttonPadding: '12px 16px',
                      inputPadding: '12px 16px',
                    },
                    fontSizes: {
                      baseBodySize: '14px',
                      baseInputSize: '14px',
                      baseLabelSize: '14px',
                      baseButtonSize: '14px',
                    },
                    fonts: {
                      bodyFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                      buttonFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                      inputFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                      labelFontFamily: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '8px',
                      buttonBorderRadius: '8px',
                      inputBorderRadius: '8px',
                    },
                  },
                },
              }}
              view="sign_up"
              providers={['google', 'facebook']}
              redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
            />
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                href="/auth/signin" 
                className="font-medium text-orange-600 hover:text-orange-500 transition-colors inline-flex items-center"
              >
                <ArrowLeftIcon className="mr-1 h-4 w-4" />
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}




