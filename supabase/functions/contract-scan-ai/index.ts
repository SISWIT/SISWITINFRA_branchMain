/// <reference path="../_shared/edge-runtime.d.ts" />

import { getCorsHeaders } from "../_shared/cors.ts";

type RiskLevel = "low" | "medium" | "high";

interface ScanResult {
  parties: string[];
  startDate: string;
  endDate: string;
  value: string;
  paymentTerms: string;
  renewalClause: string;
  riskFlags: { level: RiskLevel; message: string }[];
  keyClausesClauses: { title: string; summary: string; risk: RiskLevel }[];
}

interface ContractScanRequest {
  fileUrl?: string;
  fileName?: string;
  model?: string;
}

interface OpenRouterCallParams {
  apiKey: string;
  appUrl: string;
  appName: string;
  model: string;
  fileName: string;
  fileData: string;
  pdfEngine?: "cloudflare-ai" | "native" | "mistral-ocr";
}

interface OpenRouterTextCallParams {
  apiKey: string;
  appUrl: string;
  appName: string;
  model: string;
  contractText: string;
}

interface OpenRouterRepairCallParams {
  apiKey: string;
  appUrl: string;
  appName: string;
  model: string;
  rawOutput: string;
}

interface OpenRouterTranscriptCallParams {
  apiKey: string;
  appUrl: string;
  appName: string;
  model: string;
  fileName: string;
  fileData: string;
  pdfEngine?: "cloudflare-ai" | "native" | "mistral-ocr";
}

interface HeuristicContext {
  text: string;
}

interface OpenRouterErrorResult {
  ok: false;
  status: number;
  detail: string;
  payload?: unknown;
}

interface OpenRouterSuccessResult {
  ok: true;
  payload: unknown;
}

type OpenRouterCallResult = OpenRouterErrorResult | OpenRouterSuccessResult;

interface FetchedFileData {
  bytes: Uint8Array;
  contentType: string;
}

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/free";
const MIN_PDF_TEXT_CHARS = 120;
const MAX_TEXT_PROMPT_CHARS = 24000;
const MAX_JSON_REPAIR_INPUT_CHARS = 12000;

const DEFAULT_SCAN_RESULT: ScanResult = {
  parties: [],
  startDate: "",
  endDate: "",
  value: "",
  paymentTerms: "",
  renewalClause: "",
  riskFlags: [],
  keyClausesClauses: [],
};

function jsonResponse(status: number, body: unknown, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asDate(value: unknown): string {
  const text = asString(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function asRiskLevel(value: unknown): RiskLevel {
  const text = asString(value).toLowerCase();
  if (text === "high" || text === "medium" || text === "low") {
    return text;
  }
  return "low";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => asString(item))
    .filter(Boolean);
}

function normalizeRiskFlags(value: unknown): { level: RiskLevel; message: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }
      const message = asString(item.message);
      if (!message) {
        return null;
      }
      return {
        level: asRiskLevel(item.level),
        message,
      };
    })
    .filter((item): item is { level: RiskLevel; message: string } => item !== null);
}

function normalizeKeyClauses(value: unknown): { title: string; summary: string; risk: RiskLevel }[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }
      const title = asString(item.title);
      const summary = asString(item.summary);
      if (!title || !summary) {
        return null;
      }
      return {
        title,
        summary,
        risk: asRiskLevel(item.risk),
      };
    })
    .filter((item): item is { title: string; summary: string; risk: RiskLevel } => item !== null);
}

function normalizeScanResult(value: unknown): ScanResult {
  if (!isRecord(value)) {
    return DEFAULT_SCAN_RESULT;
  }

  const keyClausesSource = value.keyClausesClauses ?? value.keyClauses ?? value.clauses;

  return {
    parties: asStringArray(value.parties).slice(0, 8),
    startDate: asDate(value.startDate),
    endDate: asDate(value.endDate),
    value: asString(value.value),
    paymentTerms: asString(value.paymentTerms),
    renewalClause: asString(value.renewalClause),
    riskFlags: normalizeRiskFlags(value.riskFlags).slice(0, 10),
    keyClausesClauses: normalizeKeyClauses(keyClausesSource).slice(0, 20),
  };
}

function scanHasUsefulData(scan: ScanResult): boolean {
  return Boolean(
    scan.parties.length > 0 ||
      scan.startDate ||
      scan.endDate ||
      scan.value ||
      scan.paymentTerms ||
      scan.renewalClause ||
      scan.riskFlags.length > 0 ||
      scan.keyClausesClauses.length > 0,
  );
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2019']/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function textContainsValue(text: string, value: string): boolean {
  const normalizedValue = normalizeForMatch(value);
  if (!normalizedValue || normalizedValue.length < 3) {
    return false;
  }

  const normalizedText = normalizeForMatch(text);
  return normalizedText.includes(normalizedValue);
}

function cleanEntityName(value: string): string {
  return value
    .replace(/\("?(provider|client)"?\)/gi, "")
    .replace(/\s+\("?[A-Za-z]+"?\)\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractDateByLabel(text: string, label: string): string {
  const value = extractLineValue(text, label);
  const match = value.match(/([0-9]{4}-[0-9]{2}-[0-9]{2})/);
  return match?.[1] ?? "";
}

function extractLineValue(text: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`(?:^|\\n)\\s*[-*\\d.\\s]*\\*\\*?\\s*${escaped}\\s*\\*\\*?\\s*:?\\s*([^\\n\\r]+)`, "i"),
    new RegExp(`(?:^|\\n)\\s*[-*\\d.\\s]*${escaped}\\s*:?\\s*([^\\n\\r]+)`, "i"),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].replace(/\*\*/g, "").trim();
    }
  }

  return "";
}

function extractPartiesFromText(text: string): string[] {
  const parties: string[] = [];

  const provider = cleanEntityName(extractLineValue(text, "Provider"));
  const client = cleanEntityName(extractLineValue(text, "Client"));

  if (provider) parties.push(provider);
  if (client) parties.push(client);

  if (parties.length >= 2) {
    return parties.slice(0, 8);
  }

  const betweenMatch = text.match(
    /between\s+([^,\n\r]+?)\s*(?:,|\("Provider"\)|\("Provider"\))[\s\S]{0,180}?\s+and\s+([^,\n\r]+?)(?:,|\("Client"\)|\("Client"\))/i,
  );
  if (betweenMatch) {
    const first = cleanEntityName(betweenMatch[1] ?? "");
    const second = cleanEntityName(betweenMatch[2] ?? "");
    if (first && !parties.includes(first)) parties.push(first);
    if (second && !parties.includes(second)) parties.push(second);
  }

  return parties.slice(0, 8);
}

function extractHeadingSummary(text: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headingPattern = new RegExp(`(?:^|\\n)\\s*(?:#+\\s*)?(?:\\d{1,2}\\.?\\s*)?${escaped}\\s*\\n([\\s\\S]{0,320})`, "i");
  const match = text.match(headingPattern);
  if (!match?.[1]) {
    return "";
  }

  const firstMeaningfulLine = match[1]
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .find((line) => line.length > 0 && !/^#{1,6}\s/.test(line) && !/^\d+\.\d+/.test(line));

  if (!firstMeaningfulLine) {
    return "";
  }

  return firstMeaningfulLine.slice(0, 220);
}

function heuristicRiskFlags(paymentTerms: string, renewalClause: string, value: string): { level: RiskLevel; message: string }[] {
  const flags: { level: RiskLevel; message: string }[] = [];

  if (renewalClause.toLowerCase().includes("automatically renew")) {
    const daysMatch = renewalClause.match(/(\d+)\s*days?/i);
    const noticeDays = daysMatch ? Number(daysMatch[1]) : 0;
    if (noticeDays > 0 && noticeDays < 90) {
      flags.push({
        level: "medium",
        message: `Auto-renewal requires notice ${noticeDays} days before term end.`,
      });
    } else {
      flags.push({
        level: "low",
        message: "Auto-renewal clause detected with standard notice window.",
      });
    }
  }

  if (paymentTerms.toLowerCase().includes("net 30")) {
    flags.push({
      level: "low",
      message: "Payment terms appear standard (Net 30).",
    });
  } else if (paymentTerms) {
    flags.push({
      level: "medium",
      message: "Non-standard payment term detected, review required.",
    });
  }

  if (!value) {
    flags.push({
      level: "medium",
      message: "Contract value not clearly detected from the document.",
    });
  }

  if (flags.length === 0) {
    flags.push({
      level: "low",
      message: "No obvious high-risk signals detected in extracted text.",
    });
  }

  return flags.slice(0, 10);
}

function extractHeuristicScan(context: HeuristicContext): ScanResult {
  const text = context.text;
  const parties = extractPartiesFromText(text);
  const startDate = extractDateByLabel(text, "Start Date") || extractDateByLabel(text, "Effective Date");
  const endDate = extractDateByLabel(text, "End Date");
  const value =
    extractLineValue(text, "Contract Value") ||
    (text.match(/\b(?:INR|USD|EUR|GBP|CAD|AUD|₹|\$|€)\s?[0-9][0-9,.\s]*(?:crore|lakh|million|billion)?/i)?.[0] ?? "");
  const paymentTerms =
    extractLineValue(text, "Payment Terms") ||
    (text.match(/\bNet\s*\d{1,3}(?:\s*days?)?\b/i)?.[0] ?? "");
  const renewalClause =
    extractLineValue(text, "Renewal Clause") ||
    (text.match(/[^.\n\r]{0,120}\b(auto(?:matic(?:ally)?)?\s*renew(?:al)?|renew(?:al)?\b)[^.\n\r]{0,220}[.\n\r]?/i)?.[0]?.trim() ?? "");

  const keyClauseHeadings: Array<{ heading: string; risk: RiskLevel }> = [
    { heading: "Indemnification", risk: "medium" },
    { heading: "Limitation of Liability", risk: "low" },
    { heading: "Termination", risk: "medium" },
    { heading: "Confidentiality", risk: "low" },
    { heading: "Data Protection", risk: "low" },
    { heading: "Governing Law and Jurisdiction", risk: "low" },
  ];

  const keyClausesClauses = keyClauseHeadings
    .map((item) => {
      const summary = extractHeadingSummary(text, item.heading);
      if (!summary) {
        return null;
      }
      return {
        title: item.heading,
        summary,
        risk: item.risk,
      };
    })
    .filter((item): item is { title: string; summary: string; risk: RiskLevel } => item !== null)
    .slice(0, 20);

  return {
    parties,
    startDate,
    endDate,
    value,
    paymentTerms,
    renewalClause,
    riskFlags: heuristicRiskFlags(paymentTerms, renewalClause, value),
    keyClausesClauses,
  };
}

function selectPreferredTextValue(primaryValue: string, fallbackValue: string, sourceText: string): string {
  if (!fallbackValue) {
    return primaryValue;
  }
  if (!primaryValue) {
    return fallbackValue;
  }

  const primaryInText = textContainsValue(sourceText, primaryValue);
  const fallbackInText = textContainsValue(sourceText, fallbackValue);

  if (!primaryInText && fallbackInText) {
    return fallbackValue;
  }

  return primaryValue;
}

function selectPreferredParties(primaryParties: string[], fallbackParties: string[], sourceText: string): string[] {
  if (fallbackParties.length === 0) {
    return primaryParties;
  }
  if (primaryParties.length === 0) {
    return fallbackParties;
  }

  const primaryConfirmed = primaryParties.filter((party) => textContainsValue(sourceText, party));
  const fallbackConfirmed = fallbackParties.filter((party) => textContainsValue(sourceText, party));

  if (primaryConfirmed.length === 0 && fallbackConfirmed.length > 0) {
    return fallbackParties;
  }

  return primaryParties;
}

function mergeScanResults(primary: ScanResult, fallback: ScanResult, sourceText = ""): ScanResult {
  return {
    parties: selectPreferredParties(primary.parties, fallback.parties, sourceText),
    startDate: selectPreferredTextValue(primary.startDate, fallback.startDate, sourceText),
    endDate: selectPreferredTextValue(primary.endDate, fallback.endDate, sourceText),
    value: selectPreferredTextValue(primary.value, fallback.value, sourceText),
    paymentTerms: selectPreferredTextValue(primary.paymentTerms, fallback.paymentTerms, sourceText),
    renewalClause: selectPreferredTextValue(primary.renewalClause, fallback.renewalClause, sourceText),
    riskFlags: primary.riskFlags.length > 0 ? primary.riskFlags : fallback.riskFlags,
    keyClausesClauses: primary.keyClausesClauses.length > 0 ? primary.keyClausesClauses : fallback.keyClausesClauses,
  };
}

function assistantContentToString(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  const chunks = content.map((part) => {
    if (typeof part === "string") {
      return part;
    }

    if (!isRecord(part)) {
      return "";
    }

    if (typeof part.text === "string") {
      return part.text;
    }

    return "";
  });

  return chunks.join("\n").trim();
}

function parseJsonFromText(text: string): unknown | null {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    // Continue with recovery strategies.
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {
      // Continue with object extraction.
    }
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      const normalized = candidate
        .replace(/^\uFEFF/, "")
        .replace(/[\u201C\u201D]/g, "\"")
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/,\s*([}\]])/g, "$1");

      try {
        return JSON.parse(normalized);
      } catch {
        return null;
      }
    }
  }

  return null;
}

function extractModelResponse(payload: unknown): { text: string; model: string } {
  if (!isRecord(payload)) {
    return { text: "", model: "" };
  }

  const model = asString(payload.model);
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  if (choices.length === 0 || !isRecord(choices[0])) {
    return { text: "", model };
  }

  const choice = choices[0];
  const message = isRecord(choice.message) ? choice.message : null;

  if (message && isRecord(message.parsed)) {
    return {
      text: JSON.stringify(message.parsed),
      model,
    };
  }

  let content = message ? assistantContentToString(message.content) : "";
  if (!content && typeof choice.text === "string") {
    content = choice.text;
  }

  return { text: content, model };
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, Math.min(index + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function extractOpenRouterDetail(payload: unknown, fallback: string): string {
  if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message;
  }
  return fallback;
}

function shouldRetryParseFailure(detail: string): boolean {
  const normalized = detail.toLowerCase();
  return normalized.includes("failed to parse") || normalized.includes("parse");
}

function isFileBalanceError(detail: string): boolean {
  const normalized = detail.toLowerCase();
  return normalized.includes("requires at least") && normalized.includes("balance") && normalized.includes("files");
}

function shouldUsePdfTextFallback(detail: string): boolean {
  return shouldRetryParseFailure(detail) || isFileBalanceError(detail);
}

function isPdfFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf");
}

function decodePdfStringLiteral(input: string): string {
  let output = "";

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char !== "\\") {
      output += char;
      continue;
    }

    const next = input[i + 1];
    if (!next) {
      break;
    }

    i += 1;
    if (next === "n") output += "\n";
    else if (next === "r") output += "\r";
    else if (next === "t") output += "\t";
    else if (next === "b") output += "\b";
    else if (next === "f") output += "\f";
    else if (/[0-7]/.test(next)) {
      let octal = next;
      for (let j = 0; j < 2; j += 1) {
        const candidate = input[i + 1];
        if (!candidate || !/[0-7]/.test(candidate)) {
          break;
        }
        octal += candidate;
        i += 1;
      }
      output += String.fromCharCode(parseInt(octal, 8));
    } else {
      output += next;
    }
  }

  return output;
}

function extractPdfLiteralStrings(input: string): string[] {
  const values: string[] = [];

  for (let i = 0; i < input.length; i += 1) {
    if (input[i] !== "(") {
      continue;
    }

    let depth = 1;
    let cursor = i + 1;
    let raw = "";

    while (cursor < input.length && depth > 0) {
      const char = input[cursor];

      if (char === "\\") {
        const next = input[cursor + 1] ?? "";
        raw += `\\${next}`;
        cursor += 2;
        continue;
      }

      if (char === "(") {
        depth += 1;
        raw += char;
        cursor += 1;
        continue;
      }

      if (char === ")") {
        depth -= 1;
        if (depth === 0) {
          cursor += 1;
          break;
        }
        raw += char;
        cursor += 1;
        continue;
      }

      raw += char;
      cursor += 1;
    }

    i = cursor - 1;
    const decoded = decodePdfStringLiteral(raw).replace(/\s+/g, " ").trim();
    if (decoded.length >= 2) {
      values.push(decoded);
    }
  }

  return values;
}

function normalizeExtractedText(chunks: string[]): string {
  const unique = new Set<string>();
  const cleaned: string[] = [];

  for (const chunk of chunks) {
    const normalized = chunk.replace(/\s+/g, " ").trim();
    if (!normalized) {
      continue;
    }
    if (unique.has(normalized)) {
      continue;
    }
    unique.add(normalized);
    cleaned.push(normalized);
  }

  return cleaned.join("\n");
}

function extractPdfTextFromBytes(bytes: Uint8Array): string {
  const raw = new TextDecoder("latin1").decode(bytes);
  const textBlocks = raw.match(/BT[\s\S]*?ET/g) ?? [];
  const primarySource = textBlocks.length > 0 ? textBlocks.join("\n") : raw;

  const literalChunks = extractPdfLiteralStrings(primarySource);
  let result = normalizeExtractedText(literalChunks);

  if (result.length >= MIN_PDF_TEXT_CHARS) {
    return result;
  }

  // Last-resort fallback for PDFs where operators are difficult to parse:
  // gather readable ASCII runs and let the LLM infer structure.
  const asciiRuns = raw.match(/[A-Za-z0-9][ -~]{12,}/g) ?? [];
  result = normalizeExtractedText(asciiRuns);

  return result;
}

async function fetchFileData(fileUrl: string): Promise<FetchedFileData | null> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    return null;
  }

  return {
    bytes: new Uint8Array(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") || "application/pdf",
  };
}

async function callOpenRouter(params: OpenRouterCallParams): Promise<OpenRouterCallResult> {
  const prompt = `Analyze this contract and return ONLY a JSON object with this exact shape:
{
  "parties": string[],
  "startDate": "YYYY-MM-DD or empty string",
  "endDate": "YYYY-MM-DD or empty string",
  "value": "string",
  "paymentTerms": "string",
  "renewalClause": "string",
  "riskFlags": [{ "level": "low|medium|high", "message": "string" }],
  "keyClausesClauses": [{ "title": "string", "summary": "string", "risk": "low|medium|high" }]
}
If something is unknown, use empty strings/arrays. Do not include markdown or explanations.`;

  const requestBody: Record<string, unknown> = {
    model: params.model,
    messages: [
      {
        role: "system",
        content: "You are a contract analyst. Extract only factual details from the document and output strict JSON.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "file",
            file: {
              filename: params.fileName,
              fileData: params.fileData,
              file_data: params.fileData,
            },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: 1400,
    stream: false,
  };

  if (params.pdfEngine) {
    requestBody.plugins = [
      {
        id: "file-parser",
        pdf: { engine: params.pdfEngine },
      },
    ];
  }

  const upstreamResponse = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": params.appUrl,
      "X-Title": params.appName,
    },
    body: JSON.stringify(requestBody),
  });

  const upstreamRaw = await upstreamResponse.text();
  let upstreamJson: unknown = null;
  try {
    upstreamJson = JSON.parse(upstreamRaw);
  } catch {
    upstreamJson = null;
  }

  if (!upstreamResponse.ok) {
    return {
      ok: false,
      status: upstreamResponse.status,
      detail: extractOpenRouterDetail(upstreamJson, upstreamResponse.statusText || "Unknown upstream error"),
      payload: upstreamJson,
    };
  }

  return {
    ok: true,
    payload: upstreamJson,
  };
}

async function callOpenRouterTextOnly(params: OpenRouterTextCallParams): Promise<OpenRouterCallResult> {
  const textSnippet = params.contractText.slice(0, MAX_TEXT_PROMPT_CHARS);
  const prompt = `Analyze this contract text and return ONLY a JSON object with this exact shape:
{
  "parties": string[],
  "startDate": "YYYY-MM-DD or empty string",
  "endDate": "YYYY-MM-DD or empty string",
  "value": "string",
  "paymentTerms": "string",
  "renewalClause": "string",
  "riskFlags": [{ "level": "low|medium|high", "message": "string" }],
  "keyClausesClauses": [{ "title": "string", "summary": "string", "risk": "low|medium|high" }]
}
If something is unknown, use empty strings/arrays. Do not include markdown or explanations.

Contract text:
"""${textSnippet}"""`;

  const requestBody = {
    model: params.model,
    messages: [
      {
        role: "system",
        content:
          "You are a contract analyst. Extract only factual details from the provided text and output strict JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: 1400,
    stream: false,
  };

  const upstreamResponse = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": params.appUrl,
      "X-Title": params.appName,
    },
    body: JSON.stringify(requestBody),
  });

  const upstreamRaw = await upstreamResponse.text();
  let upstreamJson: unknown = null;
  try {
    upstreamJson = JSON.parse(upstreamRaw);
  } catch {
    upstreamJson = null;
  }

  if (!upstreamResponse.ok) {
    return {
      ok: false,
      status: upstreamResponse.status,
      detail: extractOpenRouterDetail(upstreamJson, upstreamResponse.statusText || "Unknown upstream error"),
      payload: upstreamJson,
    };
  }

  return {
    ok: true,
    payload: upstreamJson,
  };
}

async function callOpenRouterJsonRepair(params: OpenRouterRepairCallParams): Promise<OpenRouterCallResult> {
  const rawSnippet = params.rawOutput.slice(0, MAX_JSON_REPAIR_INPUT_CHARS);

  const prompt = `Fix this malformed model output and return ONLY valid JSON object for this schema:
{
  "parties": string[],
  "startDate": "YYYY-MM-DD or empty string",
  "endDate": "YYYY-MM-DD or empty string",
  "value": "string",
  "paymentTerms": "string",
  "renewalClause": "string",
  "riskFlags": [{ "level": "low|medium|high", "message": "string" }],
  "keyClausesClauses": [{ "title": "string", "summary": "string", "risk": "low|medium|high" }]
}
If unknown, use empty strings/arrays.
Do not include markdown or explanations.

Malformed output:
"""${rawSnippet}"""`;

  const requestBody = {
    model: params.model,
    messages: [
      {
        role: "system",
        content: "You repair malformed AI output into strict JSON. Return only JSON object.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: 900,
    stream: false,
  };

  const upstreamResponse = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": params.appUrl,
      "X-Title": params.appName,
    },
    body: JSON.stringify(requestBody),
  });

  const upstreamRaw = await upstreamResponse.text();
  let upstreamJson: unknown = null;
  try {
    upstreamJson = JSON.parse(upstreamRaw);
  } catch {
    upstreamJson = null;
  }

  if (!upstreamResponse.ok) {
    return {
      ok: false,
      status: upstreamResponse.status,
      detail: extractOpenRouterDetail(upstreamJson, upstreamResponse.statusText || "Unknown upstream error"),
      payload: upstreamJson,
    };
  }

  return {
    ok: true,
    payload: upstreamJson,
  };
}

async function callOpenRouterFileTranscript(params: OpenRouterTranscriptCallParams): Promise<OpenRouterCallResult> {
  const prompt = `Extract all readable text from this contract file.
Return plain text only.
Do not summarize.
Do not add markdown.
Do not invent content.`;

  const requestBody: Record<string, unknown> = {
    model: params.model,
    messages: [
      {
        role: "system",
        content: "You extract text faithfully from documents.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "file",
            file: {
              filename: params.fileName,
              fileData: params.fileData,
              file_data: params.fileData,
            },
          },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 3500,
    stream: false,
  };

  if (params.pdfEngine) {
    requestBody.plugins = [
      {
        id: "file-parser",
        pdf: { engine: params.pdfEngine },
      },
    ];
  }

  const upstreamResponse = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": params.appUrl,
      "X-Title": params.appName,
    },
    body: JSON.stringify(requestBody),
  });

  const upstreamRaw = await upstreamResponse.text();
  let upstreamJson: unknown = null;
  try {
    upstreamJson = JSON.parse(upstreamRaw);
  } catch {
    upstreamJson = null;
  }

  if (!upstreamResponse.ok) {
    return {
      ok: false,
      status: upstreamResponse.status,
      detail: extractOpenRouterDetail(upstreamJson, upstreamResponse.statusText || "Unknown upstream error"),
      payload: upstreamJson,
    };
  }

  return {
    ok: true,
    payload: upstreamJson,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, req);
  }

  try {
    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterApiKey) {
      return jsonResponse(500, { error: "Missing OPENROUTER_API_KEY secret" }, req);
    }

    const body = (await req.json()) as ContractScanRequest;
    const fileUrl = asString(body.fileUrl);
    const fileName = asString(body.fileName) || "contract.pdf";
    const model = asString(body.model) || Deno.env.get("OPENROUTER_MODEL") || DEFAULT_MODEL;

    if (!fileUrl) {
      return jsonResponse(400, { error: "Missing required field: fileUrl" }, req);
    }

    const appName = Deno.env.get("OPENROUTER_APP_NAME") || "SISWIT CLM Scanner";
    const appUrl = Deno.env.get("OPENROUTER_APP_URL") || "http://localhost:8080";
    const isPdf = isPdfFileName(fileName);

    const attemptSummaries: string[] = [];
    let extractedPdfTextForFallback = "";
    let analysisText = "";
    let cachedFileData: FetchedFileData | null | undefined;
    const getFileData = async (): Promise<FetchedFileData | null> => {
      if (cachedFileData !== undefined) {
        return cachedFileData;
      }
      cachedFileData = await fetchFileData(fileUrl);
      return cachedFileData;
    };

    let upstreamResult = await callOpenRouter({
      apiKey: openRouterApiKey,
      appName,
      appUrl,
      model,
      fileName,
      fileData: fileUrl,
      pdfEngine: "cloudflare-ai",
    });

    if (!upstreamResult.ok) {
      attemptSummaries.push(`url+cloudflare-ai => ${upstreamResult.status}: ${upstreamResult.detail}`);
    }

    let base64DataUrl: string | null = null;
    const canRetryParsing = !upstreamResult.ok && shouldRetryParseFailure(upstreamResult.detail);

    if (canRetryParsing) {
      try {
        const fileData = await getFileData();
        if (!fileData) {
          attemptSummaries.push("fetch-file-for-base64 => failed to fetch file");
        } else {
          const fileBytes = fileData.bytes;
          const fallbackBytesLimit = 8 * 1024 * 1024; // 8MB safety cap for edge memory overhead

          if (fileBytes.byteLength <= fallbackBytesLimit) {
            base64DataUrl = `data:${fileData.contentType};base64,${uint8ArrayToBase64(fileBytes)}`;
          } else {
            attemptSummaries.push(
              `base64-fallback-skipped => file too large (${fileBytes.byteLength} bytes, max ${fallbackBytesLimit})`,
            );
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        attemptSummaries.push(`fetch-file-for-base64 => ${message}`);
      }
    }

    if (!upstreamResult.ok && base64DataUrl) {
      upstreamResult = await callOpenRouter({
        apiKey: openRouterApiKey,
        appName,
        appUrl,
        model,
        fileName,
        fileData: base64DataUrl,
        pdfEngine: "cloudflare-ai",
      });
      if (!upstreamResult.ok) {
        attemptSummaries.push(`base64+cloudflare-ai => ${upstreamResult.status}: ${upstreamResult.detail}`);
      }
    }

    if (!upstreamResult.ok && shouldRetryParseFailure(upstreamResult.detail)) {
      upstreamResult = await callOpenRouter({
        apiKey: openRouterApiKey,
        appName,
        appUrl,
        model,
        fileName,
        fileData: fileUrl,
        pdfEngine: "native",
      });
      if (!upstreamResult.ok) {
        attemptSummaries.push(`url+native => ${upstreamResult.status}: ${upstreamResult.detail}`);
      }
    }

    if (!upstreamResult.ok && base64DataUrl && shouldRetryParseFailure(upstreamResult.detail)) {
      upstreamResult = await callOpenRouter({
        apiKey: openRouterApiKey,
        appName,
        appUrl,
        model,
        fileName,
        fileData: base64DataUrl,
        pdfEngine: "native",
      });
      if (!upstreamResult.ok) {
        attemptSummaries.push(`base64+native => ${upstreamResult.status}: ${upstreamResult.detail}`);
      }
    }

    if (!upstreamResult.ok && isPdf && shouldUsePdfTextFallback(upstreamResult.detail)) {
      try {
        const fileData = await getFileData();
        if (!fileData) {
          attemptSummaries.push("pdf-text-fallback => failed to fetch pdf bytes");
        } else {
          const extractedPdfText = extractPdfTextFromBytes(fileData.bytes);
          extractedPdfTextForFallback = extractedPdfText;
          if (extractedPdfText.length > analysisText.length) {
            analysisText = extractedPdfText;
          }
          if (extractedPdfText.length < MIN_PDF_TEXT_CHARS) {
            attemptSummaries.push(
              `pdf-text-fallback => extracted text too short (${extractedPdfText.length} chars)`,
            );
          } else {
            attemptSummaries.push(`pdf-text-fallback => extracted ${extractedPdfText.length} chars`);
            upstreamResult = await callOpenRouterTextOnly({
              apiKey: openRouterApiKey,
              appName,
              appUrl,
              model,
              contractText: extractedPdfText,
            });

            if (!upstreamResult.ok) {
              attemptSummaries.push(`text-only => ${upstreamResult.status}: ${upstreamResult.detail}`);
            }
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        attemptSummaries.push(`pdf-text-fallback => ${message}`);
      }
    }

    if (!upstreamResult.ok) {
      return jsonResponse(
        502,
        {
          error: "OpenRouter request failed",
          detail: upstreamResult.detail,
          status: upstreamResult.status,
          attempts: attemptSummaries,
        },
        req,
      );
    }

    const primaryResponse = extractModelResponse(upstreamResult.payload);
    let parsed = parseJsonFromText(primaryResponse.text);
    let finalModel = primaryResponse.model || model;

    if (!parsed) {
      attemptSummaries.push("primary-json-parse => failed");
      const repairResult = await callOpenRouterJsonRepair({
        apiKey: openRouterApiKey,
        appName,
        appUrl,
        model,
        rawOutput: primaryResponse.text,
      });

      if (!repairResult.ok) {
        return jsonResponse(
          502,
          {
            error: "Model response was not valid JSON",
            detail: `Repair step failed: ${repairResult.detail}`,
            model: finalModel,
            rawPreview: primaryResponse.text.slice(0, 500),
            attempts: attemptSummaries,
          },
          req,
        );
      }

      const repairedResponse = extractModelResponse(repairResult.payload);
      const repairedParsed = parseJsonFromText(repairedResponse.text);
      if (!repairedParsed) {
        return jsonResponse(
          502,
          {
            error: "Model response was not valid JSON",
            detail: "Repair step still returned non-JSON output",
            model: repairedResponse.model || finalModel,
            rawPreview: primaryResponse.text.slice(0, 500),
            repairedPreview: repairedResponse.text.slice(0, 500),
            attempts: attemptSummaries,
          },
          req,
        );
      }

      parsed = repairedParsed;
      finalModel = repairedResponse.model || finalModel;
      attemptSummaries.push("json-repair => success");
    }

    let scan = normalizeScanResult(parsed);
    if (!scanHasUsefulData(scan) && isPdf) {
      let fallbackText = extractedPdfTextForFallback;

      if (!fallbackText) {
        const fileData = await getFileData();
        if (fileData) {
          fallbackText = extractPdfTextFromBytes(fileData.bytes);
          attemptSummaries.push(`local-pdf-extract => ${fallbackText.length} chars`);
        }
      }

      if (fallbackText.length < MIN_PDF_TEXT_CHARS) {
        const transcriptAttempts: Array<{ fileData: string; engine: "cloudflare-ai" | "native" }> = [
          { fileData: fileUrl, engine: "cloudflare-ai" },
        ];
        if (base64DataUrl) {
          transcriptAttempts.push({ fileData: base64DataUrl, engine: "cloudflare-ai" });
        }
        transcriptAttempts.push({ fileData: fileUrl, engine: "native" });
        if (base64DataUrl) {
          transcriptAttempts.push({ fileData: base64DataUrl, engine: "native" });
        }

        for (const attempt of transcriptAttempts) {
          const transcriptResult = await callOpenRouterFileTranscript({
            apiKey: openRouterApiKey,
            appName,
            appUrl,
            model,
            fileName,
            fileData: attempt.fileData,
            pdfEngine: attempt.engine,
          });

          if (!transcriptResult.ok) {
            attemptSummaries.push(
              `file-transcript(${attempt.engine}${attempt.fileData.startsWith("data:") ? "+base64" : "+url"}) => ${transcriptResult.status}: ${transcriptResult.detail}`,
            );
            continue;
          }

          const transcriptText = extractModelResponse(transcriptResult.payload).text.trim();
          if (transcriptText.length >= MIN_PDF_TEXT_CHARS) {
            fallbackText = transcriptText;
            if (transcriptText.length > analysisText.length) {
              analysisText = transcriptText;
            }
            attemptSummaries.push(
              `file-transcript(${attempt.engine}${attempt.fileData.startsWith("data:") ? "+base64" : "+url"}) => ${transcriptText.length} chars`,
            );
            break;
          }

          attemptSummaries.push(
            `file-transcript(${attempt.engine}${attempt.fileData.startsWith("data:") ? "+base64" : "+url"}) => too short (${transcriptText.length} chars)`,
          );
        }
      }

      if (fallbackText.length >= MIN_PDF_TEXT_CHARS) {
        const heuristicScan = extractHeuristicScan({ text: fallbackText });
        const merged = mergeScanResults(scan, heuristicScan, fallbackText);
        if (scanHasUsefulData(merged)) {
          scan = merged;
          attemptSummaries.push("heuristic-extract => merged");
        }
      }
    }

    if (analysisText.length >= MIN_PDF_TEXT_CHARS) {
      const heuristicScan = extractHeuristicScan({ text: analysisText });
      const merged = mergeScanResults(scan, heuristicScan, analysisText);
      if (scanHasUsefulData(merged)) {
        scan = merged;
        attemptSummaries.push("heuristic-extract => always-merge");
      }
    }

    return jsonResponse(
      200,
      {
        scan,
        model: finalModel,
        attempts: attemptSummaries,
      },
      req,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse(500, { error: message }, req);
  }
});
