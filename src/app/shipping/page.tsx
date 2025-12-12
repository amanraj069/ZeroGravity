"use client";

import { AnimatedSection } from "@/components/AnimatedSection";

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <AnimatedSection className="mb-6 mt-8">
          <h1 className="text-4xl sm:text-3xl lg:text-4xl font-light text-black dark:text-white mb-4 sm:mb-6">
            Shipping Policy
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Last updated on December 12, 2025
          </p>
        </AnimatedSection>

        {/* Content Section */}
        <AnimatedSection>
          <div className="space-y-6 text-base text-gray-700 dark:text-gray-300">
            <p>
              ZeroGravity is a digital platform that provides software services
              and virtual products. This shipping policy outlines how we deliver
              our digital services and any physical products, if applicable.
            </p>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Digital Products and Services
              </h2>
              <p className="mb-4">
                Since ZeroGravity primarily offers digital products and
                services, most of our offerings are delivered instantly upon
                purchase:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Subscriptions and account upgrades are activated immediately
                  upon successful payment
                </li>
                <li>
                  Virtual items, points, and credits are added to your account
                  instantly
                </li>
                <li>
                  Access to premium features is granted immediately after
                  purchase
                </li>
                <li>No physical shipping is required for digital products</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Delivery Confirmation
              </h2>
              <p className="mb-4">
                For all digital purchases, you will receive:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  An email confirmation sent to your registered email address
                  immediately after purchase
                </li>
                <li>
                  Instant access to your purchased items through your account
                  dashboard
                </li>
                <li>
                  A receipt available for download from your account settings
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Physical Products (If Applicable)
              </h2>
              <p className="mb-4">
                In the event that we offer physical products in the future, the
                following shipping terms will apply:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>
                  Shipping times will be clearly stated at the time of purchase
                </li>
                <li>Standard shipping typically takes 5-10 business days</li>
                <li>
                  Express shipping options may be available for an additional
                  fee
                </li>
                <li>
                  Shipping costs will be calculated and displayed before
                  checkout
                </li>
              </ul>
              <p>
                We will provide tracking information via email once your order
                has been shipped.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                International Availability
              </h2>
              <p className="mb-4">
                Our digital services are available worldwide. However, certain
                features or content may be restricted based on your geographic
                location due to local laws and regulations.
              </p>
              <p>
                If you experience any issues accessing our services from your
                location, please contact our support team for assistance.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Delivery Issues
              </h2>
              <p className="mb-4">
                If you do not receive access to your purchased digital products
                or services:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Check your spam/junk folder for the confirmation email</li>
                <li>
                  Verify that the email address associated with your account is
                  correct
                </li>
                <li>
                  Log into your account to check if the items are available in
                  your dashboard
                </li>
                <li>
                  Contact our support team with your order number or purchase
                  receipt
                </li>
              </ul>
              <p>
                We aim to resolve delivery issues within 24-48 hours of
                notification.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Policy Updates
              </h2>
              <p>
                We reserve the right to modify this shipping policy at any time.
                Any changes will be posted on this page with an updated
                &quot;Last updated&quot; date. Your continued use of our
                services after any changes constitutes your acceptance of the
                new policy.
              </p>
            </section>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
