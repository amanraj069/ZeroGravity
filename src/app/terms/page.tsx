"use client";

import { AnimatedSection } from "@/components/AnimatedSection";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <AnimatedSection className="mb-6 mt-8">
          <h1 className="text-4xl sm:text-3xl lg:text-4xl font-light text-black dark:text-white mb-4 sm:mb-6">
            Terms and Conditions
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
            Last updated on December 12, 2025
          </p>
        </AnimatedSection>

        {/* Content Section */}
        <AnimatedSection>
          <div className="space-y-6 text-base text-gray-700 dark:text-gray-300">
            <p>
              Please read these Terms and Conditions carefully before using our
              service. By accessing or using ZeroGravity, you agree to be bound
              by these Terms and Conditions.
            </p>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Acceptance of Terms
              </h2>
              <p className="mb-4">
                By accessing and using ZeroGravity, you accept and agree to be
                bound by the terms and provision of this agreement. If you do
                not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Use License
              </h2>
              <p className="mb-4">
                Permission is granted to temporarily use ZeroGravity for
                personal, non-commercial transitory viewing only. This is the
                grant of a license, not a transfer of title, and under this
                license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Modify or copy the materials</li>
                <li>
                  Use the materials for any commercial purpose or for any public
                  display
                </li>
                <li>
                  Attempt to decompile or reverse engineer any software
                  contained on ZeroGravity
                </li>
                <li>
                  Remove any copyright or other proprietary notations from the
                  materials
                </li>
                <li>
                  Transfer the materials to another person or &quot;mirror&quot;
                  the materials on any other server
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                User Accounts
              </h2>
              <p className="mb-4">
                When you create an account with us, you must provide information
                that is accurate, complete, and current at all times. You are
                responsible for safeguarding the password and for all activities
                that occur under your account.
              </p>
              <p>
                You agree not to disclose your password to any third party. You
                must notify us immediately upon becoming aware of any breach of
                security or unauthorized use of your account.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Prohibited Uses
              </h2>
              <p className="mb-4">You may not use our service:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  In any way that violates any applicable national or
                  international law or regulation
                </li>
                <li>
                  To transmit, or procure the sending of, any advertising or
                  promotional material without our prior written consent
                </li>
                <li>
                  To impersonate or attempt to impersonate the company, a
                  company employee, another user, or any other person or entity
                </li>
                <li>
                  In any way that infringes upon the rights of others, or in any
                  way is illegal, threatening, fraudulent, or harmful
                </li>
                <li>
                  To engage in any other conduct that restricts or inhibits
                  anyone&apos;s use or enjoyment of the website
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Intellectual Property Rights
              </h2>
              <p className="mb-4">
                The service and its original content, features, and
                functionality are and will remain the exclusive property of
                ZeroGravity and its licensors. The service is protected by
                copyright, trademark, and other laws.
              </p>
              <p>
                Our trademarks and trade dress may not be used in connection
                with any product or service without our prior written consent.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Subscription and Payment
              </h2>
              <p className="mb-4">
                Some aspects of our service may be provided with a charge. You
                will be provided with pricing information before you make a
                purchase. By making a purchase, you agree to pay the charges
                associated with your subscription.
              </p>
              <p className="mb-4">
                Subscriptions automatically renew unless cancelled. You may
                cancel your subscription at any time through your account
                settings or by contacting us.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Limitation of Liability
              </h2>
              <p className="mb-4">
                In no event shall ZeroGravity, nor its directors, employees,
                partners, agents, suppliers, or affiliates, be liable for any
                indirect, incidental, special, consequential, or punitive
                damages, including without limitation, loss of profits, data,
                use, goodwill, or other intangible losses, resulting from your
                use of the service.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Disclaimer
              </h2>
              <p className="mb-4">
                The information on this service is provided on an &quot;as
                is&quot; basis. To the fullest extent permitted by law,
                ZeroGravity excludes all representations, warranties,
                conditions, and terms relating to our service and the use of
                this service.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Changes to Terms
              </h2>
              <p>
                We reserve the right, at our sole discretion, to modify or
                replace these Terms at any time. If a revision is material, we
                will provide at least 30 days notice prior to any new terms
                taking effect. What constitutes a material change will be
                determined at our sole discretion.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-6 sm:mb-8">
                Contact Information
              </h2>
              <p>
                If you have any questions about these Terms and Conditions,
                please contact us at{" "}
                <a
                  href="mailto:amanraj3567@gmail.com"
                  className="text-black dark:text-white underline hover:opacity-70 transition-opacity"
                >
                  amanraj3567@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
