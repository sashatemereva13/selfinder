import "./SupportPage.css";

// A plain, public page at /support — deliberately outside the app's
// EntryGate/router shell (see index.jsx), same pattern as PrivacyPolicyPage.
// App Store Connect and the Play Store console both require a Support URL
// that loads directly, without clicking through the entry gate first.
export default function SupportPage() {
  return (
    <div className="supportPage">
      <div className="supportPageCard">
        <h1>Support</h1>
        <p>
          Something not working, or have a question about Selfinder? Reach
          out and we'll get back to you.
        </p>
        <a className="supportEmail" href="mailto:altem1309@gmail.com">
          altem1309@gmail.com
        </a>
      </div>
    </div>
  );
}
