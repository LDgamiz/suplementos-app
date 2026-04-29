import LegalPage from './LegalPage'

const SUPPORT_EMAIL = 'ldgamiz12@gmail.com'

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="2026-04-29">
      <Section title="1. Acceptance">
        <p>
          By creating an account or using DailyStack ("the Service") you agree to these Terms of
          Service. If you do not agree, do not use the Service.
        </p>
      </Section>

      <Section title="2. The service">
        <p>
          DailyStack lets you log the supplements you take each day, view consistency stats and
          optionally share a public profile. The Service is provided "as is" with no uptime or
          availability guarantees.
        </p>
      </Section>

      <Section title="3. Eligibility">
        <p>
          You must be at least 13 years old to use DailyStack. If you are under 18, you should
          obtain a parent or guardian's consent before using the Service.
        </p>
      </Section>

      <Section title="4. Your account">
        <ul className="list-disc pl-5 space-y-1">
          <li>You are responsible for keeping your password safe and for all activity under your account.</li>
          <li>You must provide accurate registration information and not impersonate anyone else.</li>
          <li>One account per person. Sharing an account is not supported.</li>
        </ul>
      </Section>

      <Section title="5. Health disclaimer (important)">
        <p>
          DailyStack is a self-tracking tool. <strong>Nothing in the Service constitutes medical,
          nutritional, or pharmacological advice.</strong> Always consult a qualified healthcare
          professional before starting, stopping or changing any supplement regimen. Information
          shown about supplements (names, doses, categories) is community-curated and may be
          inaccurate. Do not rely on it for medical decisions.
        </p>
      </Section>

      <Section title="6. Public profile">
        <p>
          If you create a username and mark individual supplements as <em>public</em>, the data you
          marked public will be readable at <code>/perfil/&lt;username&gt;</code> by anyone with the
          link, including unauthenticated visitors. You can revert this at any time by toggling
          <em> public</em> off on each supplement.
        </p>
      </Section>

      <Section title="7. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Submit content that is unlawful, defamatory, hateful, sexually explicit or that infringes someone else's rights.</li>
          <li>Suggest fake, malicious, or trademark-infringing entries to the supplement catalog.</li>
          <li>Attempt to access other users' data, abuse our infrastructure, scrape at scale, or reverse-engineer the Service.</li>
          <li>Use the Service to send spam, malware or unsolicited messages.</li>
        </ul>
        <p>
          We may suspend or terminate accounts that violate these rules, with or without notice.
        </p>
      </Section>

      <Section title="8. Intellectual property">
        <p>
          You retain ownership of the content you submit (profile data, supplements logged, bio,
          avatar). By submitting content marked as public you grant us a non-exclusive, worldwide,
          royalty-free license to display it within the Service.
        </p>
        <p>
          The DailyStack name, logo, codebase and visual design are owned by the developer and
          made available under the project's licence terms in the source repository.
        </p>
      </Section>

      <Section title="9. Service changes & termination">
        <p>
          We may add, change or remove features at any time. We may also suspend or terminate the
          Service. If the Service is shut down we will provide reasonable notice and a way to
          export your data. You may delete your account at any time (see Privacy Policy).
        </p>
      </Section>

      <Section title="10. Disclaimer of warranties">
        <p>
          The Service is provided <strong>"as is" and "as available"</strong>, without warranties
          of any kind, whether express or implied, including merchantability, fitness for a
          particular purpose and non-infringement. We do not warrant that the Service will be
          uninterrupted, secure or error-free.
        </p>
      </Section>

      <Section title="11. Limitation of liability">
        <p>
          To the maximum extent permitted by law, DailyStack and its developer will not be liable
          for any indirect, incidental, consequential, special or punitive damages, or for any
          loss of profits, data or goodwill arising out of or in connection with your use of the
          Service. Our total liability for any claim relating to the Service shall not exceed
          USD 50.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          Questions about these Terms can be sent to{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand hover:underline">{SUPPORT_EMAIL}</a>.
        </p>
      </Section>
    </LegalPage>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-slate-100 mb-2 mt-6">{title}</h2>
      <div className="text-sm space-y-3">{children}</div>
    </section>
  )
}
