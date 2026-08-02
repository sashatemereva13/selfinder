import "./DeleteAccountPage.css";

// A plain, public page at /delete-account — deliberately outside the app's
// EntryGate/router shell (see index.jsx), same pattern as PrivacyPolicyPage
// and SupportPage. Google Play's Data Safety form requires a URL users can
// use to request account/data deletion, shown directly on the store
// listing. Selfinder's mobile app and web app share one backend/account
// system (same username+password work on both — confirmed via
// frontend/src/api/baseUrl.js and mobile/src/api/client.ts both hitting
// the same selfinder.online backend), and each has its own real,
// working self-service deletion already built (AccountSection.tsx on
// mobile, PersonalSpace.jsx's "Delete account" card on web at /space) —
// this page documents both paths rather than duplicating a third
// deletion mechanism.
export default function DeleteAccountPage() {
  return (
    <div className="deleteAccountPage">
      <div className="deleteAccountPageCard">
        <h1>Delete your account</h1>
        <p>
          Selfinder is operated by Aleksandra Temereva. Your account works
          the same way on the mobile app and on the web — the same
          username and password sign you into both. You can permanently
          delete your account and all associated data yourself, from
          either one, no need to contact us.
        </p>

        <h2>On the mobile app</h2>
        <ol>
          <li>Open Selfinder and go to the <strong>You</strong> tab</li>
          <li>Under <strong>Account</strong>, scroll to <strong>Your data &amp; privacy</strong></li>
          <li>Tap <strong>Delete</strong></li>
          <li>Type your username to confirm, then tap <strong>Confirm delete</strong></li>
        </ol>

        <h2>On the web</h2>
        <ol>
          <li>Go to <a href="https://selfinder.online/space">selfinder.online/space</a> and sign in</li>
          <li>Find the <strong>Delete account</strong> card</li>
          <li>Click <strong>Delete</strong>, type your username to confirm, and submit</li>
        </ol>

        <h2>What gets deleted</h2>
        <p>
          Deleting your account permanently removes your account record,
          saved conversations, saved Measure readings, and any feedback you
          submitted — regardless of which app you delete it from. This
          cannot be undone.
        </p>

        <h2>No account, or can't access either app?</h2>
        <p>
          If you never created an account, no data is stored under your
          identity — Selfinder works without one, and readings taken
          without signing in are kept only on your own device. If you have
          an account but can't access the app or the website to delete it
          yourself, email <a href="mailto:altem1309@gmail.com">altem1309@gmail.com</a>{" "}
          from the address on file (if you added one) or with your
          username, and we'll delete it for you.
        </p>
      </div>
    </div>
  );
}
