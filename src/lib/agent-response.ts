import { useEffect, useState } from "react";
import { loadAgentResponse } from "@/lib/profile-store";

export type AgentRiskLevel = "Low" | "Medium" | "High";

export interface AgentIscoRole {
  title: string;
  isco_code: string;
  automation_probability: number;
  automation_risk_label: AgentRiskLevel | string;
}

export interface AgentEconometricSignal {
  label: string;
  value: string | number;
  unit?: string;
  year?: number | string;
  source: string;
}

export interface AgentResponse {
  formal_skills: string[];
  skills_by_category: {
    technical: string[];
    interpersonal: string[];
    entrepreneurial: string[];
  };
  isco_matched_roles: AgentIscoRole[];
  automation_risk_level: AgentRiskLevel;
  econometric_signals: AgentEconometricSignal[];
}

/** React hook: returns the most recent agent response from localStorage, syncing on updates. */
export function useAgentResponse(): AgentResponse | null {
  const [data, setData] = useState<AgentResponse | null>(() =>
    loadAgentResponse<AgentResponse>()
  );

  useEffect(() => {
    const sync = () => setData(loadAgentResponse<AgentResponse>());
    window.addEventListener("storage", sync);
    window.addEventListener("dsp:profile", sync as EventListener);
    window.addEventListener("dsp:agent-response", sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("dsp:profile", sync as EventListener);
      window.removeEventListener("dsp:agent-response", sync as EventListener);
    };
  }, []);

  return data;
}