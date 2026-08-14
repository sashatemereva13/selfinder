import { useId } from "react";
import TermsOfUseContent from "./TermsOfUseContent";
import "../auth/PrivacyPolicyModal.css";
import "./PrivacyPolicyPage.css";

// A plain, public page at /terms — same reasoning as legal/PrivacyPolicyPage:
// deliberately outside the app's EntryGate/router shell (see index.jsx) so
// it's reachable without clicking through anything first. App Store Connect
// and the Play Store console both need a Terms of Use URL that loads
// directly for a subscription offer's metadata (Guideline 3.1.2).
export default function TermsOfUsePage() {
  const titleId = useId();

  return (
    <div className="privacyPage">
      <div className="privacyPageCard">
        <TermsOfUseContent titleId={titleId} />
      </div>
    </div>
  );
}
