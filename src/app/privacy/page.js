"use client";

export default function Privacy() {
  return (
    <div style={{minHeight:"100vh",background:"#f5f3ef",color:"#0a0a0a",fontFamily:"Plus Jakarta Sans, system-ui, sans-serif",padding:"60px 20px"}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        <div style={{marginBottom:40}}>
          <a href="https://studio.buildwithtav.co" style={{color:"#BB9900",fontWeight:700,textDecoration:"none",fontSize:14}}>← Back to Carousel Studio</a>
        </div>
        <h1 style={{fontSize:32,fontWeight:800,marginBottom:8}}>Privacy Policy</h1>
        <p style={{color:"#888",fontSize:13,marginBottom:40}}>Last updated: June 2026</p>

        {[
          {
            title: "1. Who We Are",
            body: "Carousel Studio is operated by Build with Tav, a sole trader business based in the United Kingdom.\n\nContact: tav@buildwithtav.co\nWebsite: studio.buildwithtav.co"
          },
          {
            title: "2. What Data We Collect",
            body: "We collect the following information when you use Carousel Studio:\n\n• Email address — required to create and manage your account\n• Usage data — credits used, plan type, generation history\n• Brand settings — name, handle, colours, and preferences you enter\n• Payment information — processed securely by Stripe, we do not store card details\n• Technical data — browser type, device type, and IP address for security purposes"
          },
          {
            title: "3. How We Use Your Data",
            body: "We use your data to:\n\n• Provide and improve the Carousel Studio service\n• Manage your account and subscription\n• Send transactional emails (login codes, payment receipts)\n• Send product updates and relevant communications (you may opt out at any time)\n• Detect and prevent abuse or fraud\n• Comply with legal obligations"
          },
          {
            title: "4. Email Marketing",
            body: "When you create an account, your email address may be added to our marketing list via Systeme.io. You will receive occasional updates about Carousel Studio and related products from Build with Tav.\n\nYou can unsubscribe at any time by clicking the unsubscribe link in any email or by contacting us at tav@buildwithtav.co."
          },
          {
            title: "5. Third Party Services",
            body: "We use the following third party services to operate Carousel Studio:\n\n• Supabase — database and authentication (EU data hosting)\n• Stripe — payment processing\n• Anthropic — AI content generation (your prompts are processed by their API)\n• Resend — transactional email delivery\n• Vercel — website hosting\n• Systeme.io — email marketing\n\nEach of these services has their own privacy policy. We only share the minimum data necessary for each service to function."
          },
          {
            title: "6. Data Retention",
            body: "We retain your account data for as long as your account is active. If you delete your account or request deletion, we will remove your personal data within 30 days, except where we are required to retain it for legal or financial reasons."
          },
          {
            title: "7. Your Rights (UK GDPR)",
            body: "Under UK data protection law, you have the right to:\n\n• Access the personal data we hold about you\n• Request correction of inaccurate data\n• Request deletion of your data\n• Object to processing of your data\n• Data portability\n\nTo exercise any of these rights, contact us at tav@buildwithtav.co. We will respond within 30 days."
          },
          {
            title: "8. Cookies",
            body: "Carousel Studio uses essential cookies and local storage to keep you logged in and save your preferences. We do not use advertising or tracking cookies. No cookie consent banner is required for essential cookies under UK law."
          },
          {
            title: "9. Security",
            body: "We take reasonable technical measures to protect your data including encrypted connections (HTTPS), secure authentication tokens, and access controls. No system is completely secure — if you believe your account has been compromised, contact us immediately."
          },
          {
            title: "10. Changes to This Policy",
            body: "We may update this privacy policy from time to time. We will notify you of significant changes by email. Continued use of the service constitutes acceptance of the updated policy."
          },
          {
            title: "11. Contact",
            body: "For any privacy-related questions or requests, contact us at tav@buildwithtav.co."
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
          <a href="/terms" style={{color:"#BB9900",fontWeight:700,textDecoration:"none",fontSize:13}}>Terms of Service</a>
          <a href="https://studio.buildwithtav.co" style={{color:"#BB9900",fontWeight:700,textDecoration:"none",fontSize:13}}>Back to Carousel Studio</a>
          <span style={{fontSize:13,color:"#888"}}>© 2026 Build with Tav</span>
        </div>
      </div>
    </div>
  );
}
