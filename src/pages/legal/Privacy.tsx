import LegalPage from './LegalPage'

const SUPPORT_EMAIL = 'ldgamiz12@gmail.com'

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="2026-04-29">
      <Section title="1. Who we are">
        <p>
          StackForge ("we", "us") is a personal supplement-tracking application
          maintained by an individual developer. You can reach us at{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand hover:underline">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section title="2. Data we collect">
        <p>When you create an account and use StackForge, the following data is stored:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account:</strong> email address and password (hashed by our auth provider).</li>
          <li><strong>Profile (optional):</strong> full name, username, avatar image, bio, birth date, weight, height, gender, country, goal and activity level.</li>
          <li><strong>Supplement activity:</strong> the supplements you log, doses, dates and whether you took them.</li>
          <li><strong>Routines:</strong> any saved supplement stacks you create.</li>
          <li><strong>Notifications:</strong> if you enable the daily reminder, your reminder time, time zone and the browser push subscription endpoint required to deliver it.</li>
          <li><strong>Diagnostics:</strong> minimal request metadata (IP and user agent) is processed by our hosting providers for fraud and abuse prevention.</li>
        </ul>
      </Section>

      <Section title="3. How we use it">
        <ul className="list-disc pl-5 space-y-1">
          <li>To run the service: authenticate you, persist your data and render your daily list.</li>
          <li>To deliver opt-in push reminders at the time you configured.</li>
          <li>To render your public profile at <code>/perfil/&lt;username&gt;</code> <em>only</em> if you choose a username and mark supplements as public.</li>
          <li>To prevent abuse and keep the catalog clean (admin moderation).</li>
        </ul>
        <p>We do not sell your data, share it with advertisers, or use it for profiling outside the service.</p>
      </Section>

      <Section title="4. Where it's stored">
        <p>
          Data is stored in our managed Postgres database hosted on{' '}
          <a className="text-brand hover:underline" href="https://supabase.com" target="_blank" rel="noreferrer">Supabase</a>.
          Static assets and the application are served by{' '}
          <a className="text-brand hover:underline" href="https://vercel.com" target="_blank" rel="noreferrer">Vercel</a>.
          Both providers may process the data outside your country of residence.
        </p>
      </Section>

      <Section title="5. Third-party services">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Open Food Facts</strong> — when you search for a food/supplement, your query
            is sent to their public API. See their{' '}
            <a className="text-brand hover:underline" href="https://world.openfoodfacts.org/terms-of-use" target="_blank" rel="noreferrer">terms</a>.
          </li>
          <li>
            <strong>Web Push (browser vendors)</strong> — if you opt in to reminders, your browser
            registers a subscription with its push provider (Apple / Google / Mozilla). We only
            store the endpoint required to deliver the notification.
          </li>
        </ul>
      </Section>

      <Section title="6. Cookies & local storage">
        <p>
          We do not use marketing cookies. Our auth provider stores a session token in your
          browser's local storage so you stay signed in. Clearing local storage signs you out.
        </p>
      </Section>

      <Section title="7. Your rights">
        <p>You can, at any time:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access and edit your data from the <strong>Profile</strong> page.</li>
          <li>Delete individual supplements, routines or your avatar.</li>
          <li>Disable push reminders from the <strong>Daily reminder</strong> section.</li>
          <li>Request full account deletion by emailing us at{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand hover:underline">{SUPPORT_EMAIL}</a>.
            We will remove your account and associated data within 30 days.
          </li>
          <li>If you reside in the EU/UK or California, you additionally have the rights to
            access, rectify, port and object to processing of your data, plus the right to lodge
            a complaint with your local data protection authority.
          </li>
        </ul>
      </Section>

      <Section title="8. Health information disclaimer">
        <p>
          StackForge is a tracking tool, <strong>not a medical device</strong>. The data you log
          is for personal reference only and is not a substitute for professional medical advice,
          diagnosis or treatment. We do not infer, diagnose or recommend treatment based on it.
        </p>
      </Section>

      <Section title="9. Children">
        <p>
          StackForge is not directed to children under 13. If we become aware that a user is under
          13, we will delete their account.
        </p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>
          We may update this policy. The "Last updated" date above will reflect the latest version.
          For material changes that affect your data, we will notify you via the email associated
          with your account before the change takes effect.
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
