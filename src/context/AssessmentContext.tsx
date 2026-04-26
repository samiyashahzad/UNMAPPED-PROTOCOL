import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AgentResponse } from "@/lib/agent-response";
import { loadAgentResponse, saveAgentResponse } from "@/lib/profile-store";

interface AssessmentContextValue {
  data: AgentResponse | null;
  setData: (data: AgentResponse | null) => void;
  clear: () => void;
}

const AssessmentContext = createContext<AssessmentContextValue | undefined>(undefined);

/**
 * Global store for the user's assessment payload returned by the
 * skill-mapping agent. Hydrates from localStorage on mount so the data
 * survives navigation but resets to empty on a hard refresh without prior
 * onboarding.
 */
export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AgentResponse | null>(null);

  // Hydrate once on the client.
  useEffect(() => {
    const stored = loadAgentResponse<AgentResponse>();
    if (stored) setDataState(stored);

    const sync = () => setDataState(loadAgentResponse<AgentResponse>());
    window.addEventListener("storage", sync);
    window.addEventListener("dsp:agent-response", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("dsp:agent-response", sync as EventListener);
    };
  }, []);

  const setData = useCallback((next: AgentResponse | null) => {
    setDataState(next);
    if (next) saveAgentResponse(next);
  }, []);

  const clear = useCallback(() => {
    setDataState(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("dsp.agentResponse.v1");
    }
  }, []);

  return (
    <AssessmentContext.Provider value={{ data, setData, clear }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment(): AssessmentContextValue {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessment must be used inside <AssessmentProvider>");
  return ctx;
}