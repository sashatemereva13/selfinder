import { useId } from "react";
import PrivacyPolicyContent from "../auth/PrivacyPolicyContent";
import "../auth/PrivacyPolicyModal.css";
import "./PrivacyPolicyPage.css";

// A plain, public page at /privacy — deliberately outside the app's
// EntryGate/router shell (see index.jsx) so it's reachable without clicking
// through anything first. App Store Connect and the Play Store console both
// require a privacy policy URL that loads directly, which the in-app
// PrivacyPolicyModal alone can't satisfy.
export default function PrivacyPolicyPage() {
  const titleId = useId();

  return (
    <div className="privacyPage">
      <div className="privacyPageCard">
        <PrivacyPolicyContent titleId={titleId} />
      </div>
    </div>
  );
}
