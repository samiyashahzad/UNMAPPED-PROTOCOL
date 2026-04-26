# 🌍 UNMAPPED: The Informal-to-Digital Career Architect

**A Headless Infrastructure Protocol for the World Bank "FutureWorks" Challenge (HackNation 2026)**

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![LangGraph](https://img.shields.io/badge/LangGraph-1C2B2A?style=for-the-badge)
![ChromaDB](https://img.shields.io/badge/ChromaDB-FF6F00?style=for-the-badge)
![MCP](https://img.shields.io/badge/Model_Context_Protocol-0F6E56?style=for-the-badge)

## 📌 The Problem
The World Bank's FutureWorks initiative requires a way to map informal skills globally. A simple dashboard or chatbot cannot scale to meet the needs of diverse NGOs, governments, and enterprise tools. The digital economy doesn't need another fragile app—it needs **resilient infrastructure**.

## 💡 Our Solution
**UNMAPPED** is a deterministic, multi-agent protocol that translates informal, uncertified labor descriptions (e.g., "I fix phones and watch YouTube tutorials") into formal global taxonomies. 

By functioning as a headless Model Context Protocol (MCP) server, UNMAPPED can power our custom React frontend *or* be plugged natively into enterprise AI tools like Claude with zero additional coding.

### Core Capabilities
1. **Module 1: Skills Signaling:** Maps informal input to strict **ISCO-08** occupational codes.
2. **Module 2: AI Readiness:** Cross-references mapped roles against **Frey-Osborne** risk frameworks to output localized automation risk scores.
3. **Enterprise Reliability (Graceful Degradation):** If external data layers fail or API timeouts occur, our dedicated fallback circuit intercepts the error and returns a structured JSON response. The UI never crashes.
4. **Zero-Hallucination RAG:** The LangGraph router acts as a strict traffic cop, ground-truthing all outputs against a local ChromaDB vector store loaded with real **ILOSTAT** labor signals and **World Bank STEP** data.

---

## 🏗️ Technical Architecture

We engineered a decoupled pipeline to separate the agentic logic from the client layer. 

```mermaid
graph TD
    classDef client fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef brain fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef data fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef fallback stroke:#d32f2f,stroke-width:2px,stroke-dasharray: 5 5;

    subgraph "Entry Point"
        UI[Lovable Web UI]:::client
        MCP[Claude MCP Server]:::client
    end

    subgraph "The UNMAPPED Protocol"
        API[FastAPI Gateway]:::brain
        Router[LangGraph Multi-Agent Router]:::brain
    end

    subgraph "Ground Truth Data"
        ILO[(ILOSTAT Labor Signals)]:::data
        Frey[(Frey-Osborne Automation Score)]:::data
        Vector[(ChromaDB: World Bank STEP)]:::data
    end

    UI & MCP --> API
    API --> Router
    Router --> ILO & Frey & Vector
    
    ILO & Frey & Vector -->|Verified Data| Router
    Router -->|Structured JSON| API
    
    Router -.->|Error Intercept| Fallback((Graceful Fallback)):::fallback
    Fallback -.->|Safe JSON| API
