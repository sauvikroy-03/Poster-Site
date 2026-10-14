import type { Metadata } from "next";
import LegalPage, { LegalSection } from "@/components/Legal/LegalPage";

export const metadata: Metadata = {
  title: "Return, Refund & Replacement Policy | Posterly",
  description: "Posterly's policy on returns, refunds and replacements.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Return, Refund & Replacement Policy" lastUpdated="10 October 2026">
      <LegalSection heading="1. General Policy">
        <p>
          As Posterly products may be printed on demand, we do not offer returns or refunds for
          change of mind, personal preference, incorrect size selection or other reasons
          unrelated to a product defect or fulfilment error, subject to applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="2. Eligible Cases">
        <p>Customers may request a return, refund or replacement if:</p>
        <ul>
          <li>The product arrives severely damaged or defective.</li>
          <li>The product delivered is materially different from the product ordered.</li>
        </ul>
        <p>
          Requests will be reviewed individually and handled in accordance with applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="3. How to Raise a Request">
        <p>
  Contact{" "}
  <a
    href="mailto:support@posterly.co.in"
    className="font-semibold text-foreground underline"
  >
    support@posterly.co.in
  </a>{" "}
  within 48 hours of delivery, providing:
</p>
        <ul>
          <li>Your order number.</li>
          <li>Clear photographs of the product and packaging.</li>
          <li>
            A continuous, unedited unboxing video, if available, showing the package and the
            issue.
          </li>
        </ul>
        <p>
          An unboxing video helps us verify claims but is not the sole basis for denying a claim
          where other evidence or applicable law supports the customer&apos;s request.
        </p>
      </LegalSection>

      <LegalSection heading="4. Review and Return Process">
        <p>
          All requests are reviewed manually. If a return is approved, we will provide return
          instructions and the applicable return address. Customers must follow these
          instructions before shipping the product back.
        </p>
        <p>
          Where the issue is attributable to Posterly, we will provide appropriate
          return-shipping arrangements or reimburse reasonable return-shipping costs, as
          applicable.
        </p>
      </LegalSection>

      <LegalSection heading="5. Refunds and Replacements">
        <p>
          Following verification, Posterly may offer a replacement or refund, as appropriate to
          the circumstances and applicable law. Approved refunds will be processed through the
          original payment method wherever practicable, within the applicable timeframe.
        </p>
      </LegalSection>

      <LegalSection heading="6. Contact">
        <p>For return, refund or replacement requests:</p>
        <ul>
          <li>Business: Posterly</li>
          <li>Email: support@posterly.co.in</li>
          <li>
            Website:{" "}
            <a
              href="https://posterly.co.in"
              className="font-semibold text-foreground underline"
            >
              https://posterly.co.in
            </a>
          </li>
        </ul>
        <p>Nothing in this policy limits consumer rights available under applicable law.</p>
      </LegalSection>
    </LegalPage>
  );
}