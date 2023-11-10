// src/App.tsx
import React, { useEffect } from "react";
import SlingshotGame from "./components/SlingshotGame";
import { analytics } from "./lib/firebase";
import { logEvent } from "firebase/analytics";

const App: React.FC = () => {
  useEffect(() => {
    logEvent(analytics, "page_view");
  }, []);
  return <SlingshotGame />;
};

export default App;
