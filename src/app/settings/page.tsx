"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCallWithAuth } from "@/config/api";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { DashboardLayout } from "@/components/dashboard";
// Removed unused Link import
import Image from "next/image";
import PhotoEditor from "@/components/PhotoEditor";
import { BackButton } from "@/components/BackButton";
import { Lock } from "lucide-react";
import { CurrencyIcon } from "@/components/CurrencyIcon";

type EditMode = "none" | "email" | "password";
type Tab = "basic" | "security" | "platform";

export default function EditProfile() {
  const { user, isLoggedIn, isLoading: authLoading, setUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Navigation state
  const [activeTab, setActiveTab] = useState<Tab>("basic");

  // Platform settings state
  const [autoStopQuizDuration, setAutoStopQuizDuration] = useState("4");
  const [autoStopQuizDurationError, setAutoStopQuizDurationError] =
    useState("");
  const [autoStopQuizDurationShake, setAutoStopQuizDurationShake] =
    useState(false);
  const [savingPlatform, setSavingPlatform] = useState(false);
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);

  // OTP state
  const [editMode, setEditMode] = useState<EditMode>("none");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [sendingPasswordOtp, setSendingPasswordOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setUsername(user.username || "");
      setPhoneNumber(user.phoneNumber || "");
      setAutoStopQuizDuration(String(user.autoStopQuizDuration ?? 4));
      setIsProfilePublic(user.isProfilePublic !== false); // default to true
    }
  }, [isLoggedIn, authLoading, user, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    // Show photo editor
    setSelectedImageFile(file);
    setShowPhotoEditor(true);
    setError("");

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePhotoEditorSave = async (croppedFile: File) => {
    setShowPhotoEditor(false);
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("profilePicture", croppedFile);

      const token = localStorage.getItem("authToken");
      const response = await fetch(API_ENDPOINTS.AUTH.UPLOAD_PROFILE_PICTURE, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          setSuccess("Profile picture updated successfully");
          setTimeout(() => setSuccess(""), 3000);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to upload profile picture");
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      setError("Failed to upload profile picture");
    } finally {
      setUploading(false);
      setSelectedImageFile(null);
    }
  };

  const handlePhotoEditorCancel = () => {
    setShowPhotoEditor(false);
    setSelectedImageFile(null);
  };

  const handleSaveProfile = async () => {
    setError("");
    setSaving(true);

    try {
      const response = await apiCallWithAuth(
        API_ENDPOINTS.AUTH.UPDATE_PROFILE,
        {
          method: "PUT",
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            username: username.trim(),
            phoneNumber: phoneNumber.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setSuccess("Profile updated successfully");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlatformSettings = async () => {
    const durationValue = Number(autoStopQuizDuration);

    if (
      autoStopQuizDuration === "" ||
      Number.isNaN(durationValue) ||
      durationValue < 1 ||
      durationValue > 99
    ) {
      triggerAutoStopQuizDurationError("Enter a value from 1 to 99.");
      return;
    }

    setError("");
    setSuccess("");
    setSavingPlatform(true);

    try {
      const response = await apiCallWithAuth(
        API_ENDPOINTS.AUTH.UPDATE_PROFILE,
        {
          method: "PUT",
          body: JSON.stringify({
            autoStopQuizDuration: durationValue,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("Platform settings updated successfully");
        if (data.user && setUser) {
          setUser(data.user);
        }
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update platform settings");
      }
    } catch (err) {
      console.error("Save platform settings error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSavingPlatform(false);
    }
  };

  const handleToggleProfilePrivacy = async (newValue: boolean) => {
    setTogglingPrivacy(true);
    setError("");
    try {
      const response = await apiCallWithAuth(
        API_ENDPOINTS.AUTH.UPDATE_PROFILE,
        {
          method: "PUT",
          body: JSON.stringify({ isProfilePublic: newValue }),
        },
      );
      const data = await response.json();
      if (data.success) {
        setIsProfilePublic(newValue);
        if (data.user && setUser) setUser(data.user);
        setSuccess(
          newValue ? "Profile is now public" : "Profile is now private",
        );
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update privacy setting");
      }
    } catch (err) {
      console.error("Toggle privacy error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setTogglingPrivacy(false);
    }
  };

  const triggerAutoStopQuizDurationError = (message: string) => {
    setAutoStopQuizDurationError(message);
    setAutoStopQuizDurationShake(true);
    window.setTimeout(() => setAutoStopQuizDurationShake(false), 350);
  };

  const handleAutoStopQuizDurationChange = (value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits === "") {
      setAutoStopQuizDuration("");
      setAutoStopQuizDurationError("");
      return;
    }

    if (digits.length > 2 || Number(digits) > 99) {
      triggerAutoStopQuizDurationError("It cannot be more than 99.");
      return;
    }

    setAutoStopQuizDuration(digits);
    setAutoStopQuizDurationError("");
  };

  const handleSendEmailOtp = async () => {
    if (!newEmail) {
      setError("Please enter a new email address");
      return;
    }

    setError("");
    setSendingEmailOtp(true);

    try {
      const response = await apiCallWithAuth(
        API_ENDPOINTS.AUTH.SEND_EMAIL_CHANGE_OTP,
        {
          method: "POST",
          body: JSON.stringify({ newEmail }),
        },
      );

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Try to parse error response
        let errorMessage = "Failed to send OTP";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        setError(errorMessage);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setEditMode("email");
        setResendCooldown(60);
        setOtp(["", "", "", "", "", ""]);
        setOtpError("");
        setError(""); // Clear any previous errors
        setSuccess("OTP sent to your new email address");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Error sending email OTP:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send OTP. Please check your connection and try again.",
      );
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleSendPasswordOtp = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setError("");
    setSendingPasswordOtp(true);

    try {
      const response = await apiCallWithAuth(
        API_ENDPOINTS.AUTH.SEND_PASSWORD_CHANGE_OTP,
        {
          method: "POST",
        },
      );

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        // Try to parse error response
        let errorMessage = "Failed to send OTP";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        setError(errorMessage);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setEditMode("password");
        setResendCooldown(60);
        setOtp(["", "", "", "", "", ""]);
        setOtpError("");
        setError(""); // Clear any previous errors
        setSuccess("OTP sent to your current email address");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("Error sending password OTP:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send OTP. Please check your connection and try again.",
      );
    } finally {
      setSendingPasswordOtp(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      const newOtp = [...otp];
      digits.split("").forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, "");
      setOtp(newOtp);

      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
    setOtpError("");
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    if (!paste) return;
    const digits = paste.replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    const newOtp = [...otp];
    digits.split("").forEach((digit, i) => {
      if (index + i < 6) newOtp[index + i] = digit;
    });
    setOtp(newOtp);
    const nextIndex = Math.min(index + digits.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
    setOtpError("");
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP");
      return;
    }

    setVerifyingOtp(true);
    setOtpError("");
    setError(""); // Clear general error state

    try {
      let response;

      if (editMode === "email") {
        response = await apiCallWithAuth(
          API_ENDPOINTS.AUTH.VERIFY_EMAIL_CHANGE,
          {
            method: "POST",
            body: JSON.stringify({ otp: otpCode }),
          },
        );
      } else {
        response = await apiCallWithAuth(
          API_ENDPOINTS.AUTH.VERIFY_PASSWORD_CHANGE,
          {
            method: "POST",
            body: JSON.stringify({ otp: otpCode, newPassword }),
          },
        );
      }

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = "Verification failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        if (editMode === "email") {
          setOtpError(errorMessage);
        } else {
          setOtpError(errorMessage);
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        if (editMode === "email" && data.user) {
          setUser(data.user);
        }
        setEditMode("none");
        setNewEmail("");
        setNewPassword("");
        setConfirmPassword("");
        setOtp(["", "", "", "", "", ""]);
        setOtpError("");
        setSuccess(
          editMode === "email"
            ? "Email updated successfully"
            : "Password updated successfully",
        );
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setOtpError(data.message || "Verification failed");
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setOtpError("Verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    if (editMode === "email") {
      setSendingEmailOtp(true);
    } else {
      setSendingPasswordOtp(true);
    }
    setOtpError("");
    setError("");

    try {
      let response;

      if (editMode === "email") {
        response = await apiCallWithAuth(
          API_ENDPOINTS.AUTH.SEND_EMAIL_CHANGE_OTP,
          {
            method: "POST",
            body: JSON.stringify({ newEmail }),
          },
        );
      } else {
        response = await apiCallWithAuth(
          API_ENDPOINTS.AUTH.SEND_PASSWORD_CHANGE_OTP,
          {
            method: "POST",
          },
        );
      }

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        let errorMessage = "Failed to resend OTP";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        if (editMode === "email") {
          setError(errorMessage);
        } else {
          setOtpError(errorMessage);
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setResendCooldown(60);
        setOtp(["", "", "", "", "", ""]);
        if (editMode === "email") {
          setSuccess("OTP resent to your new email address");
        } else {
          setSuccess("OTP resent to your current email address");
        }
        setTimeout(() => setSuccess(""), 3000);
      } else {
        if (editMode === "email") {
          setError(data.message || "Failed to resend OTP");
        } else {
          setOtpError(data.message || "Failed to resend OTP");
        }
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      if (editMode === "email") {
        setError("Failed to resend OTP. Please try again.");
      } else {
        setOtpError("Failed to resend OTP");
      }
    } finally {
      if (editMode === "email") {
        setSendingEmailOtp(false);
      } else {
        setSendingPasswordOtp(false);
      }
    }
  };

  if (authLoading) {
    return (
      <ZeroGravityLoading
        title="Loading Profile"
        subtitle="Fetching your profile..."
        showNavigation={false}
      />
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <ZeroGravityLoading
        title="Redirecting"
        subtitle="Redirecting to login..."
        showNavigation={false}
      />
    );
  }

  return (
    <DashboardLayout>
      {/* Photo Editor Modal */}
      {showPhotoEditor && selectedImageFile && (
        <PhotoEditor
          imageFile={selectedImageFile}
          onSave={handlePhotoEditorSave}
          onCancel={handlePhotoEditorCancel}
        />
      )}

      <div className="mt-2 min-h-[calc(100dvh-12rem)]">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4 sm:mb-8">
          <BackButton />
          <h1 className="text-xl md:text-3xl font-light text-black dark:text-white">
            Settings
          </h1>
        </div>

        {/* Messages */}
        {success && (
          <div className="p-3 mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-sm rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="p-3 mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Picture (Sticky) */}
          <div className="lg:col-span-1">
            <div className="border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-800 lg:sticky lg:top-20 rounded-xl">
              <div className="flex flex-col items-center">
                <div className="relative group mb-4">
                  <div className="w-32 h-32 overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-xl">
                    {user.profilePicture ? (
                      <Image
                        src={user.profilePicture}
                        alt={`${user.firstName} ${user.lastName}`}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl font-light text-gray-400 dark:text-gray-500">
                        {user.firstName.charAt(0).toUpperCase()}
                        {user.lastName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleImageClick}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploading ? (
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                <h2 className="text-lg font-medium text-black dark:text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{user.username}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  Click image to change
                </p>
              </div>

              {/* Navigation Tabs */}
              <div className="mt-8 flex flex-col gap-2 w-full">
                <button
                  onClick={() => setActiveTab("basic")}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                    activeTab === "basic"
                      ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }`}
                >
                  Basic Information
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                    activeTab === "security"
                      ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }`}
                >
                  Security Settings
                </button>
                {/* Platform Settings - visible to ALL users */}
                <button
                  onClick={() => setActiveTab("platform")}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                    activeTab === "platform"
                      ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }`}
                >
                  Platform Settings
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Edit Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            {activeTab === "basic" && (
              <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 rounded-xl min-h-[40vh] lg:min-h-[75vh]">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-sm font-medium text-black dark:text-white uppercase tracking-wider">
                    Basic Information
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm text-black dark:text-white bg-transparent rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm text-black dark:text-white bg-transparent rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Username
                      </label>
                      {user && (user.usernameChangesCount || 0) < 2 && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Cost:</span>
                          <span
                            className={`text-xs font-medium ${(user.points || 0) >= ((user.usernameChangesCount || 0) === 0 ? 500 : 1000) ? "text-gray-700 dark:text-gray-300" : "text-red-500"}`}
                          >
                            {((user.usernameChangesCount || 0) === 0
                              ? 500
                              : 1000
                            ).toLocaleString()}
                          </span>
                          <CurrencyIcon size={12} />
                        </div>
                      )}
                    </div>
                    <div className="relative group">
                      <span
                        className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm transition-colors ${
                          (user?.usernameChangesCount || 0) >= 2 ||
                          (user?.points || 0) <
                            ((user?.usernameChangesCount || 0) === 0
                              ? 500
                              : 1000)
                            ? "text-gray-500"
                            : "text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white"
                        }`}
                      >
                        @
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={
                          (user?.usernameChangesCount || 0) >= 2 ||
                          (user?.points || 0) <
                            ((user?.usernameChangesCount || 0) === 0
                              ? 500
                              : 1000)
                        }
                        className={`w-full pl-7 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none transition-all ${
                          (user?.usernameChangesCount || 0) >= 2 ||
                          (user?.points || 0) <
                            ((user?.usernameChangesCount || 0) === 0
                              ? 500
                              : 1000)
                            ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed opacity-70"
                            : "bg-transparent border-gray-300 dark:border-gray-700 text-black dark:text-white focus:border-purple-500 dark:focus:border-purple-400 focus:ring-1 focus:ring-purple-500/20"
                        }`}
                      />
                      {((user?.usernameChangesCount || 0) >= 2 ||
                        (user?.points || 0) <
                          ((user?.usernameChangesCount || 0) === 0
                            ? 500
                            : 1000)) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* Status Messages */}
                    <div className="mt-2">
                      {(user?.usernameChangesCount || 0) >= 2 ? (
                        <p className="text-[11px] text-red-500 dark:text-red-400 flex items-center gap-1">
                          You have reached the maximum number of username
                          changes (2/2).
                        </p>
                      ) : (user?.points || 0) <
                        ((user?.usernameChangesCount || 0) === 0
                          ? 500
                          : 1000) ? (
                        <p className="text-[11px] text-red-500 dark:text-red-400 flex items-center">
                          You need{" "}
                          {((user?.usernameChangesCount || 0) === 0
                            ? 500
                            : 1000) - (user?.points || 0)}{" "}
                          more
                          <CurrencyIcon size={12} className="mx-1 shrink-0" />
                          to change your username.
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          You can change your username up to 2 times. (
                          {user?.usernameChangesCount || 0}/2 used)
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Phone Number
                    </label>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-3 py-2.5 border border-r-0 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 rounded-l-lg">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          const value = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10);
                          setPhoneNumber(value);
                        }}
                        placeholder="9876543210"
                        maxLength={10}
                        className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm text-black dark:text-white bg-transparent placeholder-gray-400 rounded-r-lg"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full bg-black dark:bg-red-700 text-white py-2.5 px-4 font-medium hover:bg-gray-800 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm rounded-lg"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === "security" && (
              <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 rounded-xl min-h-[40vh] lg:min-h-[75vh]">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-sm font-medium text-black dark:text-white uppercase tracking-wider">
                    Security Settings
                  </h2>
                </div>

                {/* Change Email */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-black dark:text-white">
                        Email Address
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Current: {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email"
                      disabled={editMode === "email"}
                      className="w-full md:flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm text-black dark:text-white bg-transparent placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                    />
                    <button
                      onClick={handleSendEmailOtp}
                      disabled={
                        sendingEmailOtp || !newEmail || editMode === "email"
                      }
                      className="w-full md:w-auto px-4 py-2.5 bg-black dark:bg-gray-700 text-white text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap rounded-lg"
                    >
                      {sendingEmailOtp ? "Sending..." : "Change Email"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    OTP will be sent to your new email for verification
                  </p>

                  {/* OTP Input Section - Shown when OTP is sent for email change */}
                  {editMode === "email" && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-black dark:text-white mb-2">
                          Enter OTP
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Enter the 6-digit code sent to {newEmail}
                        </p>
                      </div>

                      {otpError && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg">
                          {otpError}
                        </div>
                      )}

                      {/* OTP Input */}
                      <div className="grid grid-cols-6 gap-2 w-full max-w-[280px] mx-auto mb-4">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => {
                              otpInputRefs.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            onPaste={(e) => handleOtpPaste(index, e)}
                            value={digit}
                            onChange={(e) =>
                              handleOtpChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-full h-12 text-center text-xl font-semibold border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-black dark:text-white bg-transparent rounded-lg"
                            autoFocus={index === 0 && otp.join("") === ""}
                          />
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleVerifyOtp}
                          disabled={verifyingOtp || otp.join("").length !== 6}
                          className="flex-1 bg-black dark:bg-red-700 text-white py-2.5 px-4 font-medium hover:bg-gray-800 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm rounded-lg"
                        >
                          {verifyingOtp
                            ? "Verifying..."
                            : "Verify & Update Email"}
                        </button>
                        <button
                          onClick={() => {
                            setEditMode("none");
                            setOtp(["", "", "", "", "", ""]);
                            setOtpError("");
                            setNewEmail("");
                          }}
                          disabled={verifyingOtp}
                          className="px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="text-center mt-4">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Didn&apos;t receive the code?{" "}
                          {resendCooldown > 0 ? (
                            <span className="text-gray-500">
                              Resend in {resendCooldown}s
                            </span>
                          ) : (
                            <button
                              onClick={handleResendOtp}
                              disabled={sendingEmailOtp}
                              className="text-black dark:text-white hover:underline font-medium disabled:opacity-50"
                            >
                              {sendingEmailOtp ? "Sending..." : "Resend OTP"}
                            </button>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Change Password */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-black dark:text-white">
                      Change Password
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter your new password below. An OTP will be sent to
                      verify the change.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            disabled={editMode === "password"}
                            className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm text-black dark:text-white bg-transparent placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showPassword ? (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            disabled={editMode === "password"}
                            className="w-full px-3 py-2.5 pr-10 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm text-black dark:text-white bg-transparent placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showConfirmPassword ? (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleSendPasswordOtp}
                      disabled={
                        sendingPasswordOtp ||
                        !newPassword ||
                        !confirmPassword ||
                        editMode === "password"
                      }
                      className="w-full bg-black dark:bg-red-700 text-white py-2.5 px-4 font-medium hover:bg-gray-800 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm rounded-lg"
                    >
                      {sendingPasswordOtp ? "Sending..." : "Send OTP"}
                    </button>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      OTP will be sent to your current email for verification
                    </p>

                    {/* OTP Input Section - Shown when OTP is sent for password change */}
                    {editMode === "password" && (
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-black dark:text-white mb-2">
                            Enter OTP
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Enter the 6-digit code sent to {user.email}
                          </p>
                        </div>

                        {otpError && (
                          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg">
                            {otpError}
                          </div>
                        )}

                        {/* OTP Input */}
                        <div className="grid grid-cols-6 gap-2 w-full max-w-[280px] mx-auto mb-4">
                          {otp.map((digit, index) => (
                            <input
                              key={index}
                              ref={(el) => {
                                otpInputRefs.current[index] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              onPaste={(e) => handleOtpPaste(index, e)}
                              value={digit}
                              onChange={(e) =>
                                handleOtpChange(index, e.target.value)
                              }
                              onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              className="w-full h-12 text-center text-xl font-semibold border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-black dark:text-white bg-transparent rounded-lg"
                              autoFocus={index === 0 && otp.join("") === ""}
                            />
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleVerifyOtp}
                            disabled={verifyingOtp || otp.join("").length !== 6}
                            className="flex-1 bg-black dark:bg-red-700 text-white py-2.5 px-4 font-medium hover:bg-gray-800 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm rounded-lg"
                          >
                            {verifyingOtp
                              ? "Verifying..."
                              : "Verify & Update Password"}
                          </button>
                          <button
                            onClick={() => {
                              setEditMode("none");
                              setOtp(["", "", "", "", "", ""]);
                              setOtpError("");
                              setNewPassword("");
                              setConfirmPassword("");
                            }}
                            disabled={verifyingOtp}
                            className="px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="text-center mt-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Didn&apos;t receive the code?{" "}
                            {resendCooldown > 0 ? (
                              <span className="text-gray-500">
                                Resend in {resendCooldown}s
                              </span>
                            ) : (
                              <button
                                onClick={handleResendOtp}
                                disabled={sendingPasswordOtp}
                                className="text-black dark:text-white hover:underline font-medium disabled:opacity-50"
                              >
                                {sendingPasswordOtp
                                  ? "Sending..."
                                  : "Resend OTP"}
                              </button>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Platform Settings */}
            {activeTab === "platform" && (
              <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 rounded-xl min-h-[40vh] lg:min-h-[75vh]">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-sm font-medium text-black dark:text-white uppercase tracking-wider">
                    Platform Settings
                  </h2>
                </div>

                {/* Profile Privacy — available to ALL users */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-black dark:text-white">
                          Profile Visibility
                        </h3>
                        {!isProfilePublic && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                            <Lock className="w-2.5 h-2.5" />
                            Private
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isProfilePublic
                          ? "Your profile's activity is public. Anyone on ZeroGravity can view it."
                          : "Your profile's activity is private. Only you can view it - others will see a locked icon."}
                      </p>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      id="profile-visibility-toggle"
                      onClick={() =>
                        handleToggleProfilePrivacy(!isProfilePublic)
                      }
                      disabled={togglingPrivacy}
                      aria-pressed={isProfilePublic}
                      aria-label={
                        isProfilePublic
                          ? "Make profile private"
                          : "Make profile public"
                      }
                      className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white disabled:opacity-60 disabled:cursor-not-allowed ${
                        isProfilePublic
                          ? "bg-black dark:bg-white"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black shadow transition-transform duration-200 ${
                          isProfilePublic ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Auto Stop Quiz Duration — Available to ALL users */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-black dark:text-white">
                          Auto Stop Quiz Duration
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Automatically end active quizzes after a certain
                          number of hours (1-72 hours).
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={autoStopQuizDuration}
                        onChange={(e) =>
                          handleAutoStopQuizDurationChange(e.target.value)
                        }
                        aria-invalid={Boolean(autoStopQuizDurationError)}
                        className={`w-full flex-1 bg-transparent border rounded-lg px-4 py-2.5 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-shadow text-sm ${autoStopQuizDurationError || autoStopQuizDurationShake ? "border-red-500 shake-light" : "border-gray-300 dark:border-gray-700"}`}
                        placeholder="e.g. 4"
                      />
                      <button
                        onClick={handleSavePlatformSettings}
                        disabled={
                          savingPlatform ||
                          autoStopQuizDuration === "" ||
                          Number(autoStopQuizDuration) < 1 ||
                          Number(autoStopQuizDuration) > 99
                        }
                        className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center min-w-[120px] rounded-lg shrink-0"
                      >
                        {savingPlatform ? "Saving..." : "Save Duration"}
                      </button>
                    </div>
                    {autoStopQuizDurationError && (
                      <p className="mt-2 text-xs text-red-500">
                        {autoStopQuizDurationError}
                      </p>
                    )}
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
