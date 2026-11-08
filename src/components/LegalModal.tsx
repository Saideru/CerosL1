import React, { useEffect, useRef } from 'react';
import { X, FileText, Shield } from 'lucide-react';

export type LegalDoc = 'terms' | 'privacy';

/** Fill these in before going live. Empty values fall back to "your CerosL1 administrator". */
export const LEGAL_INFO = {
  operator: 'KAMTEAM',
  contactEmail: 'team@kam-team.com',
  governingLaw: 'the Republic of the Philippines',
  effectiveDate: 'November 8, 2026'
};

const contact = LEGAL_INFO.contactEmail ? (
  <a href={`mailto:${LEGAL_INFO.contactEmail}`} className="text-[#34D399] hover:underline">
    {LEGAL_INFO.contactEmail}
  </a>
) : (
  'your CerosL1 administrator'
);

const H: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-[14px] font-bold text-[#F8FAFC] mt-6 mb-2">{children}</h3>
);
const P: React.FC<{ children: React.ReactNode }> = ({ children }) => <p className="mb-3">{children}</p>;
const UL: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>
);
const B: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <strong className="text-[#F8FAFC] font-semibold">{children}</strong>
);

const Terms: React.FC = () => (
  <>
    <P>
      These Terms and Conditions ("Terms") govern your use of the CerosL1 Ledger &amp; Calculator web application
      (the "Service"), operated by {LEGAL_INFO.operator} ("we", "us"). By creating an account or using the Service,
      you agree to these Terms. If you do not agree, do not use the Service.
    </P>

    <H>1. The Service</H>
    <P>
      CerosL1 provides accounting calculators: VAT, Invoice &amp; Bill, Payment, Journal Balancer, Statement Check
      and Aging. They produce suggested figures and journal entries that you can copy or download as CSV.{' '}
      <B>The Service only performs calculations. Nothing is posted to any ledger or accounting system.</B>
    </P>

    <H>2. Not professional advice</H>
    <P>
      Results are provided for convenience and are not accounting, tax, audit or legal advice. You are responsible
      for checking every figure, tax rate and journal entry before you rely on it or enter it into your books.
      Tax rules change, so confirm current rates and treatments with a qualified professional or the relevant tax
      authority.
    </P>

    <H>3. Accounts</H>
    <UL>
      <li>New registrations create a client account. Administrators may activate, deactivate or change accounts.</li>
      <li>Give accurate registration details (name, company, email) and keep them up to date.</li>
      <li>
        You sign in with a username and password. Keep your password confidential, and tell your administrator
        right away if you think someone else has used your account.
      </li>
      <li>You are responsible for everything done under your account.</li>
      <li>Accounts are personal. Do not share them or create accounts for anyone else without permission.</li>
    </UL>

    <H>4. Acceptable use</H>
    <P>You agree not to:</P>
    <UL>
      <li>access accounts, data or admin features you are not authorized to use;</li>
      <li>probe, scan, overload or interfere with the Service or its database;</li>
      <li>reverse engineer the Service or bypass its access controls;</li>
      <li>use the Service for anything unlawful or fraudulent, including falsifying financial records.</li>
    </UL>

    <H>5. Activity monitoring</H>
    <P>
      To keep the Service secure and to support clients, we record account activity such as sign-ins, sign-outs,
      calculators opened and CSV exports. Administrators can view this log. See the Privacy Policy for details.
    </P>

    <H>6. Intellectual property</H>
    <P>
      The Service, its software, design and branding belong to {LEGAL_INFO.operator}. You may use the Service for
      your own business purposes while your account is active. The figures and CSV files you produce are yours to
      use.
    </P>

    <H>7. Availability and changes</H>
    <P>
      We aim to keep the Service available but do not guarantee it will be uninterrupted or error-free. We may
      change, suspend or discontinue features at any time.
    </P>

    <H>8. Suspension and termination</H>
    <P>
      We may deactivate an account that breaks these Terms, puts the Service at risk, or is no longer needed. You
      may ask your administrator to close your account at any time.
    </P>

    <H>9. Disclaimer of warranties</H>
    <P>
      The Service is provided "as is" and "as available", without warranties of any kind, express or implied,
      including accuracy, fitness for a particular purpose and non-infringement, to the extent the law allows.
    </P>

    <H>10. Limitation of liability</H>
    <P>
      To the extent the law allows, {LEGAL_INFO.operator} is not liable for any indirect, incidental or
      consequential loss, or for any loss of profits, data, penalties or tax assessments, arising from your use of
      the Service or reliance on its results.
    </P>

    <H>11. Changes to these Terms</H>
    <P>
      We may update these Terms. The effective date at the top shows the latest version. Continuing to use the
      Service after a change means you accept the updated Terms.
    </P>

    <H>12. Governing law</H>
    <P>
      {LEGAL_INFO.governingLaw
        ? `These Terms are governed by the laws of ${LEGAL_INFO.governingLaw}. Any dispute will be settled by the proper courts of the Philippines.`
        : 'These Terms are governed by the laws of the jurisdiction where the operator of the Service is established.'}
    </P>

    <H>13. Contact</H>
    <P>Questions about these Terms: contact {contact}.</P>
  </>
);

const Privacy: React.FC = () => (
  <>
    <P>
      This Privacy Policy explains what personal information the CerosL1 Ledger &amp; Calculator (the "Service")
      collects, how it is used, and the choices you have. It is operated by {LEGAL_INFO.operator} ("we", "us"),
      which acts as the personal information controller. We handle personal information in line with the Data
      Privacy Act of 2012 (Republic Act No. 10173), its Implementing Rules and Regulations, and the issuances of the
      National Privacy Commission.
    </P>

    <H>1. Information we collect</H>
    <P>
      <B>Account details you give us:</B> full name, company or organisation name, email address, username and
      password. Passwords are handled by our authentication provider and stored only in hashed form. We never see
      them in plain text.
    </P>
    <P>
      <B>Activity log:</B> when you sign up, sign in or out, open a calculator, copy or download a journal CSV, or
      open the acceptance tests, we record the action, the calculator involved, the time, and your browser's user
      agent (browser and device type). Administrator actions on accounts are logged the same way.
    </P>
    <P>
      <B>Technical data:</B> our hosting and authentication providers may keep standard server logs, such as IP
      addresses and request times, for security and reliability.
    </P>
    <P>
      <B>What we do not collect:</B> the amounts, rates and other figures you enter into the calculators are
      processed in your browser and are <B>not stored</B> on our servers.
    </P>

    <H>2. How we use it</H>
    <UL>
      <li>to create and manage your account and let you sign in;</li>
      <li>to control access by user type (client or administrator);</li>
      <li>to keep the Service secure, investigate misuse and keep an audit trail;</li>
      <li>to show administrators usage reports so they can support clients and improve the Service;</li>
      <li>to contact you about your account.</li>
    </UL>
    <P>We do not sell your personal information, and we do not use it for advertising.</P>

    <H>3. Who can see it</H>
    <UL>
      <li>
        <B>You:</B> your own profile.
      </li>
      <li>
        <B>Administrators:</B> account details and activity logs, to manage accounts and support clients.
      </li>
      <li>
        <B>Service providers:</B> Supabase (database and authentication) and Vercel (hosting) process data on our
        behalf to run the Service.
      </li>
      <li>
        <B>Authorities:</B> when the law requires it.
      </li>
    </UL>

    <H>4. Cookies and local storage</H>
    <P>
      The Service uses your browser's storage to keep you signed in and to remember your light or dark theme. It
      does not use advertising or third-party tracking cookies.
    </P>

    <H>5. Security</H>
    <P>
      Data travels over encrypted connections (HTTPS). Database access rules limit each user to what their user
      type allows. No system is completely secure, so please use a strong, unique password. If a personal data
      breach occurs that requires notification, we will notify the National Privacy Commission and affected users
      as the law requires.
    </P>
    <P>
      Our service providers may store data on servers outside the Philippines. We stay responsible for that data
      and require these providers to protect it.
    </P>

    <H>6. How long we keep it</H>
    <P>
      We keep account details while your account exists. Activity logs are kept as long as they are needed for
      security and auditing. When an account is deleted, its profile and activity log are deleted with it.
    </P>

    <H>7. Your rights</H>
    <P>Under the Data Privacy Act of 2012, you have the right to:</P>
    <UL>
      <li>be informed about how your personal information is collected and processed;</li>
      <li>access your personal information;</li>
      <li>object to its processing;</li>
      <li>have inaccurate information corrected;</li>
      <li>have your information erased or blocked;</li>
      <li>data portability (a copy in an electronic, commonly used format);</li>
      <li>be compensated for damages caused by inaccurate, unlawfully obtained or unauthorized use of your data;</li>
      <li>file a complaint with the National Privacy Commission.</li>
    </UL>
    <P>
      To use these rights, contact {contact}. We may need to confirm your identity first. If you are not satisfied
      with our response, you may contact the National Privacy Commission at{' '}
      <a href="https://privacy.gov.ph" target="_blank" rel="noopener noreferrer" className="text-[#34D399] hover:underline">
        privacy.gov.ph
      </a>
      .
    </P>

    <H>8. Children</H>
    <P>The Service is for business use and is not intended for anyone under 18.</P>

    <H>9. Changes to this policy</H>
    <P>
      We may update this policy. The effective date at the top shows the latest version. Significant changes will
      be announced in the Service.
    </P>

    <H>10. Contact</H>
    <P>Questions or requests about your privacy: contact {contact}.</P>
  </>
);

export const LegalModal: React.FC<{ doc: LegalDoc; onClose: () => void; onSwitch: (d: LegalDoc) => void }> = ({
  doc,
  onClose,
  onSwitch
}) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [doc]);

  const title = doc === 'terms' ? 'Terms and Conditions' : 'Privacy Policy';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[720px] max-h-[88vh] flex flex-col bg-[#111B2E] border border-[#1E293B] rounded-[12px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-[#F8FAFC]"
      >
        <div className="px-6 py-4 border-b border-[#1E293B] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {doc === 'terms' ? (
              <FileText className="w-5 h-5 text-[#34D399]" />
            ) : (
              <Shield className="w-5 h-5 text-[#34D399]" />
            )}
            <div>
              <h2 id="legal-title" className="text-[18px] font-bold tracking-tight">
                {title}
              </h2>
              <p className="text-[12px] text-[#94A3B8]">Effective {LEGAL_INFO.effectiveDate}</p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#059669]/30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-3">
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#0F172A] border border-[#1E293B] rounded-[8px]">
            {(['terms', 'privacy'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onSwitch(d)}
                className={`py-2 text-[13px] font-semibold rounded-[6px] transition-all ${
                  doc === d ? 'bg-[#1E293B] text-[#F8FAFC]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {d === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
              </button>
            ))}
          </div>
        </div>

        <div ref={bodyRef} className="px-6 py-4 overflow-y-auto text-[13px] leading-relaxed text-[#CBD5E1]">
          {doc === 'terms' ? <Terms /> : <Privacy />}
        </div>

        <div className="px-6 py-3 border-t border-[#1E293B] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-[#059669] hover:bg-[#047857] text-white font-bold text-[13px] rounded-[8px] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
