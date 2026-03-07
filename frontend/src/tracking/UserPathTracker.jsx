import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { appendPathStep } from "./userPathTracker";

export default function UserPathTracker() {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    appendPathStep({
      path: fullPath,
      source: "route",
      navType,
    });
  }, [location.pathname, location.search, location.hash, navType]);

  return null;
}
