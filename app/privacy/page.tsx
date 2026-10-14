import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/components/Legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Posterly",
  description: "How Posterly collects, uses and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="10 October 2026"
      intro="Posterly respects your privacy and handles personal information in connection with orders placed through posterly.co.in."
    >
      <LegalSection heading="1. Information We Collect">
        <p>
          We may collect your name, phone number, email address, shipping and billing address,
          order details, payment status, communications and images uploaded for custom posters.
        </p>
        <p>
          Payments are processed through our payment service providers. We do not intend to
          store full card details on our own systems.
        </p>
      </LegalSection>

      <LegalSection heading="2. How We Use Your Information">
        <p>We use your information to:</p>
        <ul>
          <li>Process payments and fulfil orders.</li>
          <li>Arrange shipping and provide tracking updates.</li>
          <li>Respond to customer queries and complaints.</li>
          <li>Prevent fraud, maintain security and comply with legal obligations.</li>
          <li>Send promotional communications where applicable consent has been obtained.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Sharing of Information">
        <p>
          We may share necessary information with payment gateways, courier partners, hosting
          providers and other service providers that help us operate Posterly. We may also
          disclose information where required by law.
        </p>
        <p>We do not sell personal information to third parties.</p>
      </LegalSection>

      <LegalSection heading="4. Uploaded Images and Reuse">
        <p>
          Images uploaded for custom printing are used to process and fulfil the relevant order.
          We restrict access to what is reasonably necessary for these purposes.
        </p>
        <p>
          We will use customer-uploaded images for public product listings, promotional
          materials or marketing only where the customer has separately opted in to reuse
          permission and has the necessary rights to authorise that use. This permission is
          optional and is not a condition of purchase.
        </p>
        <p>
          We may retain uploaded images for as long as reasonably necessary to fulfil orders,
          manage disputes, comply with legal obligations or carry out authorised reuse. You may
          contact us to request withdrawal of reuse permission for future use. Withdrawal does
          not affect uses already lawfully made or records we must retain, and we will review
          reasonable removal requests subject to applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="5. Data Security and Retention">
        <p>
          We take reasonable measures to protect personal information against unauthorised
          access, loss or misuse. We retain information only as long as reasonably necessary for
          order fulfilment, customer support, legal compliance and legitimate business records,
          subject to applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="6. Your Rights">
        <p>
          You may contact us to request access to, correction of or deletion of your personal
          information, subject to applicable legal and record-retention requirements. You may
          also withdraw consent where processing is based on consent.
        </p>
      </LegalSection>

      <LegalSection heading="7. Cookies and Third-Party Services">
        <p>
          Our website may use cookies and similar technologies for essential functionality,
          security and analytics. Third-party services are subject to their own privacy
          practices.
        </p>
      </LegalSection>

      <LegalSection heading="8. Updates and Contact">
        <p>We may update this policy by publishing a revised version on our website.</p>
        <p>For privacy-related questions or requests:</p>
        <ul>
          <li>Business: Posterly</li>
          <li>
            Website:{" "}
            <a
              href="https://posterly.co.in"
              className="font-semibold text-foreground underline"
            >
              https://posterly.co.in
            </a>
          </li>
          <li>Email: support@posterly.co.in</li>
          <li>Address: [Business address]</li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}