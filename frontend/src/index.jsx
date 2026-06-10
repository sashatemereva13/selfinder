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
import FloatingGuide from "./designElements/FloatingGuide";
import PhilosopherBadge from "./designElements/PhilosopherBadge";
import RouteLoader from "./designElements/RouteLoader";
import ScrollToTop from "./utils/ScrollToTop";
import EntryGate from "./frontpage/EntryGate";
import UserPathTracker from "./tracking/UserPathTracker.jsx";
import { appendPathStep } from "./tracking/userPathTracker";
import { ChatProvider } from "./guide/ChatContext";
import { AuthProvider } from "./auth/AuthContext";

const ThresholdPage = lazy(() => import("./frontpage/ThresholdPage"));
const AuthPage = lazy(() => import("./auth/AuthPage"));
const FrontPage = lazy(() => import("./frontpage/FrontPage"));
const CoreRoom = lazy(() => import("./rooms/CoreRoom"));
const JungianRoom = lazy(() => import("./rooms/JungianRoom"));
const PersonalSpace = lazy(() => import("./space/PersonalSpace"));
const LevelsFullPage = lazy(() => import("./levels/LevelsFullPage"));
const FrequencyUpgrade = lazy(() => import("./levels/FrequencyUpgrade"));
const Enlightenment = lazy(() => import("./levels/Enlightenment"));
const Peace = lazy(() => import("./levels/Peace"));
const UnconditionalLove = lazy(() => import("./levels/UnconditionalLove"));
const Love = lazy(() => import("./levels/Love"));
const Reason = lazy(() => import("./levels/Reason"));
const Acceptance = lazy(() => import("./levels/Acceptance"));
const Willingness = lazy(() => import("./levels/Willingness"));
const Neutrality = lazy(() => import("./levels/Neutrality"));
const Courage = lazy(() => import("./levels/Courage"));
const Pride = lazy(() => import("./levels/Pride"));
const Anger = lazy(() => import("./levels/Anger"));
const Desire = lazy(() => import("./levels/Desire"));
const Fear = lazy(() => import("./levels/Fear"));
const Grief = lazy(() => import("./levels/Grief"));
const Apathy = lazy(() => import("./levels/Apathy"));
const Guilt = lazy(() => import("./levels/Guilt"));
const Shame = lazy(() => import("./levels/Shame"));
const LunarCalendar = lazy(() => import("./lunarCalendar/LunarCalendar"));
const TuneIn = lazy(() => import("./tunein/TuneIn"));
const Measure = lazy(() => import("./measure/Measure"));
const GuideChat = lazy(() => import("./guide/GuideChat"));

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
            {/* The House — 5 Jungian rooms */}
            <Route
              path="/persona"
              element={
                <PageWrapper>
                  <CoreRoom />
                </PageWrapper>
              }
            />
            <Route
              path="/core"
              element={
                <PageWrapper>
                  <CoreRoom />
                </PageWrapper>
              }
            />
            <Route
              path="/shadow"
              element={
                <PageWrapper>
                  <JungianRoom roomKey="shadow" />
                </PageWrapper>
              }
            />
            <Route
              path="/anima"
              element={
                <PageWrapper>
                  <JungianRoom roomKey="anima" />
                </PageWrapper>
              }
            />
            <Route
              path="/innerchild"
              element={
                <PageWrapper>
                  <JungianRoom roomKey="innerchild" />
                </PageWrapper>
              }
            />
            <Route
              path="/self"
              element={
                <PageWrapper>
                  <JungianRoom roomKey="self" />
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
              path="/levels/enlightenment"
              element={
                <PageWrapper>
                  <Enlightenment />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/peace"
              element={
                <PageWrapper>
                  <Peace />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/unconditionallove"
              element={
                <PageWrapper>
                  <UnconditionalLove />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/love"
              element={
                <PageWrapper>
                  <Love />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/reason"
              element={
                <PageWrapper>
                  <Reason />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/acceptance"
              element={
                <PageWrapper>
                  <Acceptance />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/willingness"
              element={
                <PageWrapper>
                  <Willingness />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/neutrality"
              element={
                <PageWrapper>
                  <Neutrality />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/courage"
              element={
                <PageWrapper>
                  <Courage />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/pride"
              element={
                <PageWrapper>
                  <Pride />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/anger"
              element={
                <PageWrapper>
                  <Anger />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/desire"
              element={
                <PageWrapper>
                  <Desire />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/fear"
              element={
                <PageWrapper>
                  <Fear />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/grief"
              element={
                <PageWrapper>
                  <Grief />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/apathy"
              element={
                <PageWrapper>
                  <Apathy />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/guilt"
              element={
                <PageWrapper>
                  <Guilt />
                </PageWrapper>
              }
            />
            <Route
              path="/levels/shame"
              element={
                <PageWrapper>
                  <Shame />
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

  useEffect(() => {
    if (!hasEntered) {
      appendPathStep({ path: "/entry-gate", source: "gate", navType: null });
    }
  }, [hasEntered]);

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
      <PhilosopherBadge />
      <MenuTab />
      <FloatingGuide />
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
