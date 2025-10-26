"use client";

interface SignupToggleSectionProps {
  signupEnabled: boolean;
  signupToggleLoading: boolean;
  onToggleSignup: () => void;
}

export default function SignupToggleSection({
  signupEnabled,
  signupToggleLoading,
  onToggleSignup,
}: SignupToggleSectionProps) {
  return (
    <div className="mt-4">
      <div className="border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h3 className="text-xl font-medium text-black mb-2">
              Signup Settings
            </h3>
            <p className="text-gray-600 text-sm">
              Enable User registration on the signup page
            </p>
          </div>
          <div className="flex items-center justify-end">
            <button
              onClick={onToggleSignup}
              disabled={signupToggleLoading}
              className={`relative inline-flex h-7 w-12 items-center  transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
                signupEnabled ? "bg-black" : "bg-gray-200"
              } ${signupToggleLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`inline-block h-5 w-5 transform  bg-white transition-transform ${
                  signupEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
