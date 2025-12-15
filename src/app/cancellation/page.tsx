"use client";

import { AnimatedSection } from "@/components/AnimatedSection";

export default function CancellationAndRefundsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-2 sm:pt-4 md:pt-8 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <AnimatedSection className="mb-6 mt-2 sm:mt-4 md:mt-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-black dark:text-white mb-3 sm:mb-4 md:mb-6">
            Cancellation and Refunds
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
            Last updated on December 12, 2025
          </p>
        </AnimatedSection>

        {/* Content Section */}
        <AnimatedSection>
          <div className="space-y-6 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
            <p>
              We understand that circumstances may change, and you may need to
              cancel your subscription or request a refund. This policy outlines
              our cancellation and refund procedures to ensure transparency and
              fairness.
            </p>

            <section className="mt-8">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-black dark:text-white mb-3 sm:mb-4 md:mb-6">
                Cancellation Policy
              </h2>
              <p className="mb-4">
                You may cancel your subscription at any time. Cancellations can
                be made through your account settings or by contacting our
                support team.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>
                  Cancellations take effect at the end of your current billing
                  period.
                </li>
                <li>
                  You will continue to have access to all features until the end
                  of your paid period.
                </li>
                <li>
                  No partial refunds are provided for the unused portion of your
                  subscription period.
                </li>
                <li>
                  Once cancelled, your subscription will not automatically
                  renew.
                </li>
              </ul>
              <p>
                To cancel your subscription, please visit your account settings
                or contact us at{" "}
                <a
                  href="mailto:amanraj3567@gmail.com"
                  className="text-black dark:text-white underline hover:opacity-70 transition-opacity"
                >
                  amanraj3567@gmail.com
                </a>
                .
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-black dark:text-white mb-3 sm:mb-4 md:mb-6">
                Refund Policy
              </h2>
              <p className="mb-4">
                We offer refunds under the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>
                  Refund requests must be submitted within 14 days of the
                  initial purchase date.
                </li>
                <li>
                  Refunds are only available for first-time subscriptions, not
                  for renewals.
                </li>
                <li>
                  Refunds will be processed to the original payment method
                  within 5-10 business days.
                </li>
                <li>
                  Once a refund is processed, your account access will be
                  immediately revoked.
                </li>
              </ul>
              <p className="mb-4">
                To request a refund, please contact our support team with your
                account details and reason for the refund request. We will
                review your request and respond within 2-3 business days.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-black dark:text-white mb-3 sm:mb-4 md:mb-6">
                Non-Refundable Items
              </h2>
              <p className="mb-4">
                The following items are not eligible for refunds:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Subscriptions that have been active for more than 14 days
                </li>
                <li>Renewed or upgraded subscriptions</li>
                <li>
                  Purchases made during promotional periods or special offers
                </li>
                <li>
                  Virtual items, points, or credits purchased within the
                  platform
                </li>
                <li>
                  Accounts that have been suspended or terminated due to
                  violation of our terms of service
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-black dark:text-white mb-3 sm:mb-4 md:mb-6">
                Processing Time
              </h2>
              <p className="mb-4">
                Refund processing times may vary depending on your payment
                method:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Credit/Debit Cards: 5-10 business days after approval</li>
                <li>PayPal: 3-5 business days after approval</li>
                <li>Bank Transfers: 7-14 business days after approval</li>
              </ul>
              <p className="mt-4">
                Please note that the time it takes for the refund to appear in
                your account may vary depending on your financial institution.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-black dark:text-white mb-3 sm:mb-4 md:mb-6">
                Policy Changes
              </h2>
              <p>
                We reserve the right to modify this cancellation and refund
                policy at any time. Any changes will be posted on this page with
                an updated &quot;Last updated&quot; date. Your continued use of
                our services after any changes constitutes your acceptance of
                the new policy.
              </p>
            </section>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
