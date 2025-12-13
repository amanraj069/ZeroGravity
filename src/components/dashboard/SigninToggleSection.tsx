"use client";

interface SigninToggleSectionProps {
  signinEnabled: boolean;
  signinToggleLoading: boolean;
  onToggleSignin: () => void;
}

export default function SigninToggleSection({
  signinEnabled,
  signinToggleLoading,
  onToggleSignin,
}: SigninToggleSectionProps) {
  return (
    <div className="mt-4">
      <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1">
            <h3 className="text-xl font-medium text-black dark:text-white mb-2">
              Signin Settings
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Block all user login and signin attempts
            </p>
          </div>
          <div className="flex items-center justify-end">
            <button
              onClick={onToggleSignin}
              disabled={signinToggleLoading}
              className={`relative inline-flex h-7 w-12 items-center  transition-colors focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                signinEnabled
                  ? "bg-black dark:bg-white"
                  : "bg-gray-200 dark:bg-gray-700"
              } ${signinToggleLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`inline-block h-5 w-5 transform  transition-transform ${
                  signinEnabled
                    ? "bg-white dark:bg-black translate-x-6"
                    : "bg-white dark:bg-gray-400 translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

