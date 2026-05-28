"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCall } from "@/config/api";
import { AnimatedSection } from "@/components/AnimatedSection";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import { Mail, Phone, Send, User, MessageSquare } from "lucide-react";

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

  // Generate random stars for background atmosphere (client-side only to avoid hydration mismatch)
  const [stars, setStars] = useState<Array<{left: string, top: string, size: number, opacity: number, delay: number}>>([]);
  
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 40 : 100;
    const baseSize = isMobile ? 0.5 : 0.8;
    const sizeVariance = isMobile ? 1 : 1.5;

    setStars(Array.from({ length: starCount }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * sizeVariance + baseSize,
      opacity: Math.random() * 0.8 + 0.4,
      delay: Math.random() * 5,
    })));
  }, []);

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
    <div className="min-h-screen bg-white dark:bg-[#111116] transition-colors duration-1000 relative overflow-hidden py-10 sm:py-16">
      {/* Background Atmosphere & Stars */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Floating Background Blobs */}
        <motion.div 
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-5%] right-[-5%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-purple-500/[0.05] dark:bg-indigo-500/[0.08] rounded-full blur-[80px] md:blur-[140px]" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-rose-500/[0.05] dark:bg-blue-900/[0.1] rounded-full blur-[60px] md:blur-[120px]" 
        />

        {/* Stars */}
        <div className="absolute inset-0">
          {stars.map((star, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [star.opacity, 0.1, star.opacity],
                scale: [1, 0.8, 1],
              }}
              transition={{
                duration: 1.5 + Math.random() * 2,
                repeat: Infinity,
                delay: star.delay,
                ease: "easeInOut",
              }}
              className="absolute rounded-full bg-indigo-400 dark:bg-white/40"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-4">
        {/* Header Section */}
        <AnimatedSection className="mb-6 sm:mb-12">
          <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-4">
            <BackButton onClick={() => window.history.back()} />
            <h1 className="text-2xl sm:text-5xl font-light text-black dark:text-white mb-0 tracking-tight">
              Contact Zero<span className="font-normal italic">Gravity</span>
            </h1>
          </div>
        </AnimatedSection>

        {/* Main Grid: Form (Left) & Contact Info (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12">
          {/* Contact Form Container (Frosted Glass Card) */}
          <AnimatedSection className="lg:col-span-2">
            <div className="bg-white/40 dark:bg-[#181820]/40 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-sm dark:shadow-none">
              <h2 className="text-lg sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8 tracking-tight">
                Share Your Ideas or Report Issues
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 dark:text-red-400 text-xs sm:text-sm text-center py-3 px-4 bg-red-50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-900/35 rounded-xl font-medium"
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-600 dark:text-green-400 text-xs sm:text-sm text-center py-3.5 px-4 bg-green-50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-900/35 rounded-xl font-medium"
                  >
                    {success}
                    {ticketNumber && (
                      <p className="mt-2 text-xs font-bold uppercase tracking-wider">
                        Ticket Number: #{ticketNumber}
                      </p>
                    )}
                  </motion.div>
                )}

                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-xs sm:text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2"
                  >
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-white/10 bg-white/20 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-black dark:focus:border-white/30 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white/10 transition-all duration-300 text-sm"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs sm:text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2"
                  >
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-white/10 bg-white/20 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-black dark:focus:border-white/30 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white/10 transition-all duration-300 text-sm"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contactNumber"
                    className="block text-xs sm:text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2"
                  >
                    Contact Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      id="contactNumber"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-white/10 bg-white/20 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-black dark:focus:border-white/30 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white/10 transition-all duration-300 text-sm"
                      placeholder="Enter contact number (optional)"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs sm:text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-4 text-gray-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-white/10 bg-white/20 dark:bg-white/[0.03] backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-black dark:focus:border-white/30 rounded-xl focus:ring-1 focus:ring-black dark:focus:ring-white/10 transition-all duration-300 resize-none text-sm leading-relaxed"
                      placeholder="Describe your ideas, suggestions, or issues (minimum 10 characters)..."
                    />
                  </div>
                  <div className="flex justify-end mt-1 text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500">
                    {formData.message.length} / 5000 characters
                  </div>
                </div>

                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 text-sm sm:text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-out shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    {isLoading ? "Submitting..." : "Submit Message"}
                  </motion.button>
                </div>
              </form>
            </div>
          </AnimatedSection>

          {/* Contact Details Panel (frosted column card) */}
          <AnimatedSection className="lg:col-span-1 flex flex-col gap-6">
            <div className="bg-white/40 dark:bg-[#181820]/40 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex-1 flex flex-col justify-between shadow-sm dark:shadow-none min-h-[480px]">
              <div>
                {/* Top Half: Bug Bounty Program Info (No Icons) */}
                <div className="mb-6">
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-600 dark:text-amber-500 mb-3">
                    Bug Bounty Program
                  </h3>
                  <h4 className="text-base sm:text-lg font-light text-black dark:text-white leading-snug mb-2 tracking-tight">
                    ZeroGravity <span className="font-normal italic text-amber-500">Bug Bounty</span>
                  </h4>
                  <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed font-light mb-4">
                    Help us build a flawless, friction-free productivity sanctuary. Spot a bug? Report it to our team to win <strong className="font-medium text-amber-500">exclusive cash prizes</strong> and prestigious platform rewards!
                  </p>
                  <motion.a
                    href="https://forms.gle/jBC2bEukaqLCKF4KA"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-200 mt-1 w-full justify-center shadow-sm cursor-pointer"
                  >
                    Report Bug & Win
                  </motion.a>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100 dark:bg-white/10 my-6" />

                {/* Bottom Half: Developer Details */}
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 dark:text-gray-500 mb-4">
                    Developer Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        Lead Developer
                      </p>
                      <p className="text-sm font-medium text-black dark:text-white mt-0.5">
                        Aman Raj
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        Email Support
                      </p>
                      <a
                        href="mailto:amanraj3567@gmail.com"
                        className="text-sm font-medium text-black dark:text-white mt-0.5 hover:opacity-75 transition-opacity underline block break-all"
                      >
                        amanraj3567@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10 text-center sm:text-left">
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed font-light">
                  We generally respond to suggestions and bug reports within 24-48 hours. Thank you for supporting ZeroGravity!
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
