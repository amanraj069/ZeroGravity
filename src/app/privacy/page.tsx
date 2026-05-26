"use client";

import { AnimatedSection } from "@/components/AnimatedSection";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-transparent pt-2 sm:pt-4 md:pt-8 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <AnimatedSection className="mb-6 mt-2 sm:mt-4 md:mt-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light text-black dark:text-white mb-3 sm:mb-4 md:mb-6">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
            Last updated on December 12, 2025
          </p>
        </AnimatedSection>

        {/* Content Section */}
        <AnimatedSection>
          <div className="space-y-6 text-xs sm:text-sm md:text-base text-gray-700 dark:text-gray-300">
            <p>
              This privacy policy sets out how we use and protect any
              information that you give us when you visit our website and/or
              agree to purchase from us.
            </p>

            <p>
              We are committed to ensuring that your privacy is protected.
              Should we ask you to provide certain information by which you can
              be identified when using this website, and then you can be assured
              that it will only be used in accordance with this privacy
              statement.
            </p>

            <p>
              We may change this policy from time to time by updating this page.
              You should check this page from time to time to ensure that you
              adhere to these changes.
            </p>

            <section className="mt-8">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-black dark:text-white mb-3 sm:mb-4 md:mb-6">
                We may collect the following information:
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name</li>
                <li>Contact information including email address</li>
                <li>
                  Demographic information such as postcode, preferences and
                  interests, if required
                </li>
                <li>
                  Other information relevant to customer surveys and/or offers
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-black dark:text-white mb-3 sm:mb-4 md:mb-6">
                What we do with the information we gather
              </h2>
              <p className="mb-4">
                We require this information to understand your needs and provide
                you with a better service, and in particular for the following
                reasons:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Internal record keeping.</li>
                <li>
                  We may use the information to improve our products and
                  services.
                </li>
                <li>
                  We may periodically send promotional emails about new
                  products, special offers or other information which we think
                  you may find interesting using the email address which you
                  have provided.
                </li>
                <li>
                  From time to time, we may also use your information to contact
                  you for market research purposes. We may contact you by email,
                  phone, fax or mail. We may use the information to customise
                  the website according to your interests.
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <p>
                We are committed to ensuring that your information is secure. In
                order to prevent unauthorised access or disclosure we have put
                in suitable measures.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-black dark:text-white mb-3 sm:mb-4 md:mb-6">
                How we use cookies
              </h2>
              <p className="mb-4">
                A cookie is a small file which asks permission to be placed on
                your computer&apos;s hard drive. Once you agree, the file is
                added and the cookie helps analyze web traffic or lets you know
                when you visit a particular site. Cookies allow web applications
                to respond to you as an individual. The web application can
                tailor its operations to your needs, likes and dislikes by
                gathering and remembering information about your preferences.
              </p>
              <p className="mb-4">
                We use traffic log cookies to identify which pages are being
                used. This helps us analyze data about webpage traffic and
                improve our website in order to tailor it to customer needs. We
                only use this information for statistical analysis purposes and
                then the data is removed from the system.
              </p>
              <p className="mb-4">
                Overall, cookies help us provide you with a better website, by
                enabling us to monitor which pages you find useful and which you
                do not. A cookie in no way gives us access to your computer or
                any information about you, other than the data you choose to
                share with us.
              </p>
              <p>
                You can choose to accept or decline cookies. Most web browsers
                automatically accept cookies, but you can usually modify your
                browser setting to decline cookies if you prefer. This may
                prevent you from taking full advantage of the website.
              </p>
            </section>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
