import os
import json
from pathlib import Path
from difflib import get_close_matches

from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
from ingestor import get_context
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Load static data once at startup (no per-request latency).
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "data" / "static"


def _load_json(filename: str) -> dict:
    path = STATIC_DIR / filename
    if not path.exists():
        print(f"WARNING: Static data file not found: {path}")
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


LABOR_SIGNALS: dict = _load_json("labor_signals.json")
AUTOMATION_SCORES: dict = _load_json("automation_scores.json")

print(f"Loaded labor signals for: {list(LABOR_SIGNALS.keys())}")
print(f"Loaded automation scores for {len(AUTOMATION_SCORES)} occupations")


def lookup_automation_score(role_name: str) -> dict | None:
    """Find the closest Frey-Osborne automation score for an ISCO role."""
    all_roles = list(AUTOMATION_SCORES.keys())

    if role_name in AUTOMATION_SCORES:
        return AUTOMATION_SCORES[role_name]

    matches = get_close_matches(role_name, all_roles, n=1, cutoff=0.5)
    if matches:
        matched = matches[0]
        result = AUTOMATION_SCORES[matched].copy()
        result["matched_to"] = matched
        return result

    return None


def build_labor_context(region: str) -> str:
    """Return a formatted block of real ILO data for the given region."""
    data = LABOR_SIGNALS.get(region)
    if not data:
        return f"No ILO ILOSTAT data available for {region} in the local database."

    breakdown = data.get("employment_sector_breakdown", {})
    agr = breakdown.get("agriculture", {}).get("share_percent", "N/A")
    ind = breakdown.get("industry", {}).get("share_percent", "N/A")
    svc = breakdown.get("services", {}).get("share_percent", "N/A")

    years = data.get("data_years", {})

    return f"""
REAL ILO ILOSTAT DATA FOR {region.upper()} -- USE THESE EXACT NUMBERS, DO NOT INVENT STATISTICS:
  - Youth unemployment rate:   {data.get('youth_unemployment_rate', 'N/A')}%  (year: {years.get('youth_unemployment_rate', 'N/A')})
  - Mean monthly wage (USD):   ${data.get('mean_monthly_wage_usd', 'N/A')}     (year: {years.get('mean_monthly_wage_usd', 'N/A')})
  - NEET rate:                 {data.get('neet_rate', 'N/A')}%  (year: {years.get('neet_rate', 'N/A')})
  - Employment by sector:      Agriculture {agr}% | Industry {ind}% | Services {svc}%
  - Dominant sector:           {data.get('top_employment_sector', 'N/A')}
  - Data source:               {data.get('data_source', 'ILO ILOSTAT')}
"""


@tool
def search_world_bank_database(query: str) -> str:
    """Use this tool to search the local database for World Bank documents, policies, or data."""
    context = get_context(query)
    if not context:
        return "No specific data found in the World Bank database."
    return context


@tool
def get_automation_risk(role_name: str) -> str:
    """
    Use this tool to look up the real Frey-Osborne automation probability
    for a named occupation or ISCO role. Returns risk level and probability score.
    """
    result = lookup_automation_score(role_name)
    if not result:
        return f"No automation data found for '{role_name}'. Use your internal knowledge to estimate."

    matched_to = result.get("matched_to", role_name)
    note = f" (matched to: '{matched_to}')" if "matched_to" in result else ""

    return (
        f"Automation data for '{role_name}'{note}:\n"
        f"  Probability: {result['automation_probability']} "
        f"({int(result['automation_probability'] * 100)}% chance of automation)\n"
        f"  Risk Label:  {result['risk_label']}\n"
        f"  Source:      {result.get('data_source', 'Frey & Osborne 2013')}"
    )


tools = [search_world_bank_database, get_automation_risk]

llm = ChatOpenAI(
    model=GROQ_MODEL,
    api_key=GROQ_API_KEY,
    base_url=GROQ_BASE_URL,
    temperature=0.2,
)

agent_executor = create_react_agent(llm, tools)


def generate_solution(informal_text: str, region: str, config: dict):
    """Runs the agentic pipeline with real ILO and Frey-Osborne data injected."""
    labor_context = build_labor_context(region)

    system_instruction = f"""
You are the UNMAPPED Protocol AI.
Translate a youth's informal labor experience into formal economic signals.

SYSTEM CONFIGURATION:
  - Target Region:       {region}
  - Output Language:     {config['language']}
  - Skills Taxonomy:     {config['taxonomy']}
  - Automation Model:    {config['automation_model']}

{labor_context}

INSTRUCTIONS:
1. Translate the informal experience into formal skills using your internal knowledge.
2. Map those skills to 2-4 official {config['taxonomy']} occupational titles.
3. For EACH matched role, call the `get_automation_risk` tool to retrieve
   the real Frey-Osborne automation probability. Do NOT guess the risk level.
4. Use the ILO data above (do not invent numbers) for the econometric_signals field.
5. Write your entire response in {config['language']}.

TOOL RULE: Only use `search_world_bank_database` if you need policy or program context.
Always use `get_automation_risk` for every matched role.

OUTPUT FORMAT -- respond with ONLY this JSON, no markdown, no preamble:
{{
  "region": "{region}",
  "informal_input": "<original text verbatim>",
  "formal_skills": ["Skill 1", "Skill 2", "Skill 3"],
  "isco_matched_roles": [
    {{
      "title": "Role title",
      "isco_code": "ISCO-08 code e.g. 7421",
      "automation_probability": 0.00,
      "automation_risk_label": "Low/Medium/High",
      "automation_source": "Frey & Osborne (2013)"
    }}
  ],
  "automation_risk_level": "Low/Medium/High",
  "automation_analysis": "One sentence using the real probability scores above.",
  "econometric_signals": [
    {{
      "label": "Youth Unemployment Rate",
      "value": "<use exact ILO number above>",
      "unit": "%",
      "year": "<use exact year from ILO data above>",
      "source": "ILO ILOSTAT"
    }},
    {{
      "label": "Mean Monthly Wage",
      "value": "<use exact ILO number above>",
      "unit": "USD",
      "year": "<use exact year from ILO data above>",
      "source": "ILO ILOSTAT"
    }},
    {{
      "label": "NEET Rate",
      "value": "<use exact ILO number above>",
      "unit": "%",
      "year": "<use exact year from ILO data above>",
      "source": "ILO ILOSTAT"
    }}
  ],
  "skills_by_category": {{
    "technical": ["Skill 1"],
    "interpersonal": ["Skill 2"],
    "entrepreneurial": ["Skill 3"]
  }}
}}
"""

    full_prompt = f"{system_instruction}\n\nUser's Informal Experience: {informal_text}"

    try:
        print(f"Agent analyzing labor signals for region: {region}...")
        response = agent_executor.invoke({"messages": [("user", full_prompt)]})

        final_output = response["messages"][-1].content
        final_output = final_output.replace("```json", "").replace("```", "").strip()

        parsed_output = json.loads(final_output)

        if "isco_matched_roles" not in parsed_output and "matched_roles" in parsed_output:
            parsed_output["isco_matched_roles"] = parsed_output.pop("matched_roles")

        country_data = LABOR_SIGNALS.get(region)
        if country_data:
            years = country_data.get("data_years", {})
            parsed_output["econometric_signals"] = [
                {
                    "label": "Youth Unemployment Rate",
                    "value": str(country_data.get("youth_unemployment_rate", "N/A")),
                    "unit": "%",
                    "year": str(years.get("youth_unemployment_rate", "N/A")),
                    "source": country_data.get("data_source", "ILO ILOSTAT"),
                },
                {
                    "label": "Mean Monthly Wage",
                    "value": str(country_data.get("mean_monthly_wage_usd", "N/A")),
                    "unit": "USD",
                    "year": str(years.get("mean_monthly_wage_usd", "N/A")),
                    "source": country_data.get("data_source", "ILO ILOSTAT"),
                },
                {
                    "label": "NEET Rate",
                    "value": str(country_data.get("neet_rate", "N/A")),
                    "unit": "%",
                    "year": str(years.get("neet_rate", "N/A")),
                    "source": country_data.get("data_source", "ILO ILOSTAT"),
                },
                {
                    "label": "Top Employment Sector",
                    "value": country_data.get("top_employment_sector", "N/A"),
                    "unit": "",
                    "year": str(years.get("employment_sector_breakdown", "N/A")),
                    "source": country_data.get("data_source", "ILO ILOSTAT"),
                },
            ]

        final_output = json.dumps(parsed_output)

        if "{" not in final_output or "}" not in final_output:
            raise ValueError("Agent produced malformed JSON output.")

        return {"status": "success", "data": final_output}

    except Exception as e:
        print(f"Agent workflow failed: {str(e)}")
        country_data = LABOR_SIGNALS.get(region, {})
        years = country_data.get("data_years", {})

        fallback = {
            "region": region,
            "informal_input": informal_text,
            "formal_skills": ["Processing error -- please retry"],
            "isco_matched_roles": [],
            "automation_risk_level": "Unknown",
            "automation_analysis": "System fallback triggered. Please retry.",
            "econometric_signals": [
                {
                    "label": "Youth Unemployment Rate",
                    "value": str(country_data.get("youth_unemployment_rate", "N/A")),
                    "unit": "%",
                    "year": str(years.get("youth_unemployment_rate", "N/A")),
                    "source": country_data.get("data_source", "ILO ILOSTAT"),
                },
                {
                    "label": "Mean Monthly Wage",
                    "value": str(country_data.get("mean_monthly_wage_usd", "N/A")),
                    "unit": "USD",
                    "year": str(years.get("mean_monthly_wage_usd", "N/A")),
                    "source": country_data.get("data_source", "ILO ILOSTAT"),
                },
            ],
            "skills_by_category": {"technical": [], "interpersonal": [], "entrepreneurial": []},
        }
        return {"status": "error", "data": json.dumps(fallback)}