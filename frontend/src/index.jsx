import { StrictMode, Suspense, lazy, useEffect, useState } from "react";
import "./css/style.css";
import "./css/selfinder-system.css";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageWrapper } from "./designElements/PageWrapper";
import MenuTab from "./designElements/MenuTab";
import GuideAnchor from "./designElements/GuideAnchor";
import RouteLoader from "./designElements/RouteLoader";
import ScrollToTop from "./utils/ScrollToTop";
import { suppressThreeClockWarning } from "./utils/suppressThreeClockWarning";
import EntryGate from "./frontpage/EntryGate";
import UserPathTracker from "./tracking/UserPathTracker.jsx";
import { appendPathStep } from "./tracking/userPathTracker";
import { ChatProvider } from "./guide/ChatContext";
import { AuthProvider } from "./auth/AuthContext";
import PrivacyPolicyPage from "./legal/PrivacyPolicyPage";
import SupportPage from "./legal/SupportPage";

const AuthPage = lazy(() => import("./auth/AuthPage"));
const FrontPage = lazy(() => import("./frontpage/FrontPage"));
const Depths = lazy(() => import("./depths/Depths"));
const PersonalSpace = lazy(() => import("./space/PersonalSpace"));
const LevelsFullPage = lazy(() => import("./levels/LevelsFullPage"));
const FrequencyUpgrade = lazy(() => import("./levels/FrequencyUpgrade"));
const LevelDetail = lazy(() => import("./levels/LevelDetail"));
const LunarCalendar = lazy(() => import("./lunarCalendar/LunarCalendar"));
const TuneIn = lazy(() => import("./tunein/TuneIn"));
const Measure = lazy(() => import("./measure/Measure"));
const GuideChat = lazy(() => import("./guide/GuideChat"));

suppressThreeClockWarning();

const root = ReactDOM.createRoot(document.querySelector("#root"));

function AnimatedRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteLoader />}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route
              path="/"
              element={
                <PageWrapper>
                  <FrontPage />
                </PageWrapper>
              }
            />
            {/* The Depths — measure your vibration across body, mind, heart, spirit */}
            <Route
              path="/depths"
              element={
                <PageWrapper>
                  <Depths />
                </PageWrapper>
              }
            />
            <Route
              path="/depths/spheres"
              element={
                <PageWrapper>
                  <Measure />
                </PageWrapper>
              }
            />
            <Route path="/threshold" element={<PageWrapper><FrontPage /></PageWrapper>} />
            <Route path="/space" element={<PageWrapper><PersonalSpace /></PageWrapper>} />
            <Route path="/frequencyupgrade" element={<FrequencyUpgrade />} />
            <Route
              path="/levels"
              element={
                <PageWrapper>
                  <LevelsFullPage />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/frequencyupgrade"
              element={
                <PageWrapper>
                  <FrequencyUpgrade />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/:slug"
              element={
                <PageWrapper>
                  <LevelDetail />
                </PageWrapper>
              }
            />

            <Route
              path="/luna"
              element={
                <PageWrapper>
                  <LunarCalendar />
                </PageWrapper>
              }
            />
            <Route
              path="/tunein"
              element={
                <PageWrapper>
                  <TuneIn />
                </PageWrapper>
              }
            />
            <Route
              path="/measure"
              element={
                <PageWrapper>
                  <Measure />
                </PageWrapper>
              }
            />
            <Route
              path="/guide"
              element={
                <PageWrapper>
                  <GuideChat />
                </PageWrapper>
              }
            />
            <Route path="/login" element={<AuthPage />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
}

function App() {
  const [hasEntered, setHasEntered] = useState(false);
  // Bypasses the entry gate entirely — App Store/Play Store review and
  // anyone else need this to load directly, not after clicking through the
  // philosopher-selection landing screen.
  const isPrivacyRoute = window.location.pathname === "/privacy";
  const isSupportRoute = window.location.pathname === "/support";

  useEffect(() => {
    if (isPrivacyRoute || isSupportRoute) return;
    if (!hasEntered) {
      appendPathStep({ path: "/entry-gate", source: "gate", navType: null });
    }
  }, [hasEntered, isPrivacyRoute, isSupportRoute]);

  if (isPrivacyRoute) {
    return <PrivacyPolicyPage />;
  }

  if (isSupportRoute) {
    return <SupportPage />;
  }

  if (!hasEntered) {
    return (
      <>
        <EntryGate onEnter={() => setHasEntered(true)} />

      </>
    );
  }

  return (
    <Router>
      <UserPathTracker />
      <MenuTab />
      <GuideAnchor />
      <AnimatedRoutes />
    </Router>
  );
}

root.render(
  <StrictMode>
    <AuthProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </AuthProvider>
  </StrictMode>,
);
