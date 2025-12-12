"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCall } from "@/config/api";
import { AnimatedSection } from "@/components/AnimatedSection";

export default function ContactPage() {
  const { user, isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      setFormData({
        fullName: fullName || "",
        email: user.email || "",
        contactNumber: user.phoneNumber || "",
        message: "",
      });
    }
  }, [isLoggedIn, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    setTicketNumber(null);

    // Validation
    if (!formData.fullName || !formData.email || !formData.message) {
      setError("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (formData.message.trim().length < 10) {
      setError("Message must be at least 10 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiCall(API_ENDPOINTS.CONTACT.SUBMIT, {
        method: "POST",
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          contactNumber: formData.contactNumber || null,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Your message has been submitted successfully!");
        setTicketNumber(data.data.ticketNumber);
        // Reset form
        setFormData({
          fullName:
            isLoggedIn && user
              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
              : "",
          email: isLoggedIn && user ? user.email || "" : "",
          contactNumber: isLoggedIn && user ? user.phoneNumber || "" : "",
          message: "",
        });
      } else {
        setError(data.message || "Failed to submit contact form");
      }
    } catch (err) {
      console.error("Contact form error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <AnimatedSection className="mb-6 mt-8">
          <h1 className="text-4xl sm:text-3xl lg:text-4xl font-light text-black dark:text-white mb-4 sm:mb-6">
            Contact Us
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            We&apos;d love to hear from you. Send us a message and we&apos;ll
            respond as soon as possible.
          </p>
        </AnimatedSection>

        {/* Contact Form */}
        <AnimatedSection>
          <div className="bg-white dark:bg-gray-900 mb-12">
            <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-8 sm:mb-10">
              Send us a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {error && (
                <div className="text-red-600 dark:text-red-400 text-base text-center py-3 px-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-600 dark:text-green-400 text-base text-center py-3 px-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
                  {success}
                  {ticketNumber && (
                    <p className="mt-3 font-medium">
                      Your ticket number is:{" "}
                      <span className="font-medium">#{ticketNumber}</span>
                    </p>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="fullName"
                  className="block text-base font-medium text-black dark:text-white mb-3"
                >
                  Full Name{" "}
                  <span className="text-gray-500 dark:text-gray-400 font-normal">
                    *
                  </span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 text-base border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-base font-medium text-black dark:text-white mb-3"
                >
                  Email Address{" "}
                  <span className="text-gray-500 dark:text-gray-400 font-normal">
                    *
                  </span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 text-base border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label
                  htmlFor="contactNumber"
                  className="block text-base font-medium text-black dark:text-white mb-3"
                >
                  Contact Number
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 text-base border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors"
                  placeholder="Enter your contact number (optional)"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-base font-medium text-black dark:text-white mb-3"
                >
                  Message{" "}
                  <span className="text-gray-500 dark:text-gray-400 font-normal">
                    *
                  </span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3.5 text-base border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors resize-none"
                  placeholder="Enter your message (minimum 10 characters)"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {formData.message.length} / 5000 characters
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-8 sm:px-10 py-4 sm:py-4.5 bg-black dark:bg-white text-white dark:text-black text-base sm:text-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </AnimatedSection>

        {/* Contact Information Section */}
        <AnimatedSection className="mb-10 sm:mb-12 lg:mb-16">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-8 sm:p-10 lg:p-12 border border-gray-200 dark:border-gray-700/50">
            <h2 className="text-lg sm:text-xl font-light text-black dark:text-white mb-6 sm:mb-8">
              If you have any issues, you may contact us using the information
              below:
            </h2>
            <div className="space-y-4 text-base text-gray-700 dark:text-gray-300">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-medium text-black dark:text-white min-w-[80px]">
                  Name:
                </span>
                <span>Aman Raj</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="font-medium text-black dark:text-white min-w-[80px]">
                  Email:
                </span>
                <a
                  href="mailto:amanraj3567@gmail.com"
                  className="text-black dark:text-white hover:opacity-70 transition-opacity underline"
                >
                  amanraj3567@gmail.com
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
