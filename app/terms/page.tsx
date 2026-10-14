import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/Legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions | Posterly",
  description: "Terms & Conditions for using posterly.co.in and purchasing from Posterly.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      lastUpdated="10 October 2026"
      intro="These Terms & Conditions govern your use of posterly.co.in and purchases made through Posterly. By using our website or placing an order, you agree to these terms."
    >
      <LegalSection heading="1. Orders and Payments">
        <p>
          All orders are subject to confirmation and product availability. Prices, product
          descriptions and delivery estimates may change. We reserve the right to cancel orders
          affected by pricing errors, suspected fraud or unavailable products, with an
          appropriate refund where applicable.
        </p>
      </LegalSection>

      <LegalSection heading="2. Custom Posters, Customer Uploads and Reuse Permission">
        <p>
          By uploading an image, you confirm that you own it or have the necessary rights and
          permissions for its intended use. You must not upload content that infringes
          copyright, trademarks, privacy or other legal rights.
        </p>
        <p>
          You grant Posterly permission to use uploaded images as necessary to process, print
          and fulfil your order. Posterly may review, reject or remove content that appears
          unlawful or infringing.
        </p>
        <p>
          If you separately opt in to reuse permission, you grant Posterly a non-exclusive,
          royalty-free permission to display, reproduce and use the uploaded image for product
          listings, promotional materials and marketing. You confirm that you have the
          authority to grant these permissions. This permission does not override third-party
          rights or licences that restrict such use.
        </p>
        <p>
          Reuse permission is optional and is not required to place an order. Posterly will not
          intentionally reuse customer-uploaded images for marketing without this separate
          permission.
        </p>
      </LegalSection>

      <LegalSection heading="3. Copyright and Intellectual Property">
        <p>
          Original artwork, designs, text, branding and website content owned by Posterly may
          not be copied or commercially reused without written permission.
        </p>
        <p>
          Third-party intellectual property remains the property of its respective owners.
          Posterly does not claim ownership of third-party artwork merely by printing or
          displaying it and does not intend to offer unauthorised merchandise as officially
          licensed products.
        </p>
        <p>
          If you believe content on our website infringes your intellectual property rights,
          contact us at [IP complaints email] with the relevant URL, proof of ownership or
          authority, and details of the alleged infringement. We will review complaints and may
          restrict or remove disputed content while investigating.
        </p>
      </LegalSection>

      <LegalSection heading="4. Shipping, Cancellation and Refunds">
        <p>
          Shipping timelines, cancellation eligibility, returns, replacements and refunds are
          governed by our separate Shipping Policy and{" "}
          <Link href="/refund-policy" className="font-semibold text-foreground underline">
            Return &amp; Refund Policy
          </Link>
          . Nothing in these terms excludes rights available to consumers under applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="5. Limitation of Liability">
        <p>
          To the extent permitted by applicable law, Posterly will not be liable for indirect or
          consequential losses arising from website use or orders. Nothing in these terms
          excludes liability that cannot legally be excluded.
        </p>
      </LegalSection>

      <LegalSection heading="6. Changes and Governing Law">
        <p>
          We may update these terms by publishing a revised version on our website. These terms
          are governed by the laws of India, subject to applicable law and jurisdictional
          requirements.
        </p>
      </LegalSection>

      <LegalSection heading="7. Contact and Grievances">
        <p>
          Raise a request at{" "}
          <Link href="/help" className="font-semibold text-foreground underline">
            posterly.co.in/help
          </Link>{" "}
          or email at support@posterly.co.in . We acknowledge every grievance within 48 hours and
          resolve it within one month.
        </p>
      </LegalSection>
    </LegalPage>
  );
}