"use client";

export default function Terms() {
  return (
    <div style={{minHeight:"100vh",background:"#f5f3ef",color:"#0a0a0a",fontFamily:"Plus Jakarta Sans, system-ui, sans-serif",padding:"60px 20px"}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        <div style={{marginBottom:40}}>
          <a href="https://studio.buildwithtav.co" style={{color:"#BB9900",fontWeight:700,textDecoration:"none",fontSize:14}}>← Back to Carousel Studio</a>
        </div>
        <h1 style={{fontSize:32,fontWeight:800,marginBottom:8}}>Terms of Service</h1>
        <p style={{color:"#888",fontSize:13,marginBottom:40}}>Last updated: June 2026</p>

        {[
          {
            title: "1. About Carousel Studio",
            body: "Carousel Studio is a web-based AI content generation tool operated by Build with Tav, a sole trader business based in the United Kingdom. By using Carousel Studio you agree to these terms. If you do not agree, please do not use the service.\n\nContact: tav@buildwithtav.co"
          },
          {
            title: "2. Your Account",
            body: "You must provide a valid email address to use Carousel Studio. You are responsible for maintaining the security of your account. You must not share your account with others or attempt to circumvent usage limits by creating multiple accounts. We reserve the right to suspend or terminate accounts that violate these terms."
          },
          {
            title: "3. Subscription Plans & Credits",
            body: "Carousel Studio offers a free tier and paid subscription plans (Starter, Pro, and Agency). One-time licence options (Affiliate Licence and White Label Licence) are also available. Credits are allocated monthly and do not roll over to the following month.\n\nPayments are processed securely via Stripe. Monthly subscriptions renew automatically each month unless cancelled. You may cancel at any time — your access continues until the end of your current billing period.\n\nOne-time licence purchases are non-refundable after 30 days. Within 30 days of purchase, refund requests will be considered at our sole discretion.\n\nRefunds are not provided for partial months of subscription except at our sole discretion."
          },
          {
            title: "4. Fair Usage Policy",
            body: "All plans are subject to their stated monthly credit limits. Credits exist to ensure fair access for all users and to cover the costs of AI generation.\n\nAccounts found to be using the service in an automated or abusive manner, or attempting to circumvent credit limits, may be suspended without notice.\n\nCredit allowances are subject to change. We will provide reasonable notice to active subscribers before reducing any credit limits."
          },
          {
            title: "5. Affiliate Programme",
            body: "Carousel Studio operates an affiliate programme available to paid subscribers. By participating you agree to the following terms.\n\nEligibility: Affiliate access is available to active paid subscribers on Starter, Pro, Agency, Affiliate Licence, or White Label plans. Free plan users are not eligible.\n\nCommission rates: Tier 1 commission rates vary by plan (20% Starter, 30% Pro, 40% Agency, 35% Affiliate Licence, 40% White Label). Tier 2 commission is fixed at 8% on payments made by your direct referrals' referrals. Commission rates are subject to change with 30 days notice to active affiliates.\n\nRate calculation: Your commission rate is determined by the plan you hold on the first and last day of each calendar month. The lower of the two rates applies for that entire month. This prevents gaming of the commission system through short-term plan changes.\n\nNetwork rate: Your commission rate applies to your entire active referral network, not just new referrals. Upgrading your plan increases your rate across all existing referrals from the following month. Downgrading reduces your rate across all referrals from the following month.\n\nHolding period: All commissions are held for 30 days before becoming available for withdrawal. This allows for refund reversals.\n\nPayouts: Minimum withdrawal is $30. Payouts are processed on the 10th of each month via Wise. You are responsible for providing accurate payout details. Build with Tav is not liable for failed payments due to incorrect details provided.\n\nRefund reversals: If a referred subscriber receives a refund, the associated commission will be reversed from your balance.\n\nProhibited promotion: You must not promote Carousel Studio using misleading claims, fake reviews, spam, paid search ads on branded terms, or any method that violates applicable law. Accounts found in violation may have commissions withheld and affiliate access revoked.\n\nBuild with Tav reserves the right to modify, suspend, or terminate the affiliate programme at any time with 30 days notice to active affiliates."
          },
          {
            title: "6. White Label Licence",
            body: "The White Label Licence grants you the right to resell Carousel Studio under your own brand and domain. This licence is personal and non-transferable.\n\nBuild with Tav retains all intellectual property rights to the underlying platform. You may not sublicence, resell, or transfer the white label licence itself to a third party.\n\nWe reserve the right to update the underlying platform at any time. White label branding customisation is applied on a reasonable efforts basis and may take up to 14 days from purchase.\n\nWhite label licences are subject to the same fair usage and prohibited use policies as all other plans."
          },
          {
            title: "7. AI-Generated Content",
            body: "Content generated by Carousel Studio is produced by AI and may not always be accurate, appropriate, or suitable for your specific use case. You are solely responsible for reviewing, editing, and approving any content before publishing it.\n\nBuild with Tav makes no warranties regarding the quality, accuracy, or fitness for purpose of AI-generated content."
          },
          {
            title: "8. Intellectual Property",
            body: "Content you generate using Carousel Studio belongs to you. You retain full ownership of your brand settings, uploaded images, and generated outputs.\n\nThe Carousel Studio platform, its design, code, and underlying systems remain the intellectual property of Build with Tav. You may not copy, reverse engineer, or redistribute any part of the platform."
          },
          {
            title: "9. Prohibited Use",
            body: "You must not use Carousel Studio to generate content that is unlawful, harmful, defamatory, discriminatory, or in violation of any third party rights. You must not use the service to generate spam, misinformation, or content designed to deceive.\n\nWe reserve the right to remove content and suspend accounts that violate these prohibitions."
          },
          {
            title: "10. Email Communications",
            body: "By creating an account you agree to receive emails from Carousel Studio including account notices, product updates, and promotional communications. You may unsubscribe from marketing emails at any time using the unsubscribe link in any email. Transactional emails such as payment confirmations may still be sent regardless of marketing preferences."
          },
          {
            title: "11. Service Availability & API Dependency",
            body: "We aim to keep Carousel Studio available at all times but do not guarantee uninterrupted access. The service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.\n\nCarousel Studio relies on third-party AI services to generate content. In the event that these services become unavailable or change their terms, we may need to modify or suspend certain features. We will communicate any significant changes to active subscribers.\n\nWe are not liable for any loss caused by service downtime or interruptions."
          },
          {
            title: "12. Limitation of Liability",
            body: "To the maximum extent permitted by law, Build with Tav shall not be liable for any indirect, incidental, or consequential damages arising from your use of Carousel Studio. Our total liability to you shall not exceed the amount you have paid us in the 3 months prior to any claim."
          },
          {
            title: "13. Changes to These Terms",
            body: "We may update these terms from time to time. We will notify active subscribers of significant changes by email. Continued use of the service after changes constitutes acceptance of the updated terms."
          },
          {
            title: "14. Governing Law",
            body: "These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales."
          },
          {
            title: "15. Contact",
            body: "For any questions about these terms, contact us at tav@buildwithtav.co."
          },
        ].map(({title, body})=>(
          <div key={title} style={{marginBottom:32}}>
            <h2 style={{fontSize:16,fontWeight:800,marginBottom:10}}>{title}</h2>
            {body.split("\n\n").map((para,i)=>(
              <p key={i} style={{fontSize:14,lineHeight:1.8,color:"#333",margin:"0 0 12px"}}>{para}</p>
            ))}
          </div>
        ))}

        <div style={{borderTop:"1px solid #e0ddd8",paddingTop:24,marginTop:40,display:"flex",gap:24,flexWrap:"wrap"}}>
          <a href="/privacy" style={{color:"#BB9900",fontWeight:700,textDecoration:"none",fontSize:13}}>Privacy Policy</a>
          <a href="https://studio.buildwithtav.co" style={{color:"#BB9900",fontWeight:700,textDecoration:"none",fontSize:13}}>Back to Carousel Studio</a>
          <span style={{fontSize:13,color:"#888"}}>© 2026 Build with Tav</span>
        </div>
      </div>
    </div>
  );
}
