import crypto from "node:crypto";
import { describe, expect, it } from "vitest";

// prettier-ignore
// @ts-expect-error - mjs module is untyped
import { decryptKairosEnvelope } from "../../server/lib/kairos-crypto.mjs";
// prettier-ignore
// @ts-expect-error - mjs store module is untyped
import { normalizeKairosPayload, summarizeKairosSnapshot, renderKairosContextBlock } from "../../server/lib/kairos-store.mjs";
import type { KairosEnvelope } from "./hefaistia/types";

function encryptKairosEnvelope(sharedSecret: string, payload: unknown) {
  const key = crypto.createHash("sha256").update(sharedSecret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf-8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const data = Buffer.concat([encrypted, tag]);

  return {
    v: 1,
    iv: iv.toString("base64"),
    data: data.toString("base64"),
  };
}

describe("Kairós Tunnel Import", () => {
  const secret = "shared-secret-test-key";
  const samplePayload = {
    identidade: "Kaline faceta 1",
    sedimentos: ["sedimento A", "sedimento B"],
    reunioes: [{ titulo: "Alinhamento", resumo: "Alinhamento operacional" }],
    mensagens: [{ autor: "Ká", conteudo: "Olá" }],
  };

  it("deciphers an envelope compatible with the Totalidade", () => {
    const envelope = encryptKairosEnvelope(secret, samplePayload);
    const decrypted = decryptKairosEnvelope(secret, envelope);

    expect(decrypted).toEqual(samplePayload);
  });

  it("fails with the wrong shared secret", () => {
    const envelope = encryptKairosEnvelope(secret, samplePayload);
    expect(() => decryptKairosEnvelope("wrong-secret", envelope)).toThrow();
  });

  it("fails with an invalid envelope format", () => {
    // version !== 1
    const envBadVersion = { v: 2, iv: "...", data: "..." };
    expect(() => decryptKairosEnvelope(secret, envBadVersion as unknown as KairosEnvelope)).toThrow(
      "Versão do envelope inválida",
    );

    // iv missing
    const envNoIv = { v: 1, data: "..." };
    expect(() => decryptKairosEnvelope(secret, envNoIv as unknown as KairosEnvelope)).toThrow(
      "Envelope iv e data devem ser strings base64",
    );

    // data missing
    const envNoData = { v: 1, iv: "..." };
    expect(() => decryptKairosEnvelope(secret, envNoData as unknown as KairosEnvelope)).toThrow(
      "Envelope iv e data devem ser strings base64",
    );
  });

  it("calculates snapshot counts correctly", () => {
    const counts = summarizeKairosSnapshot(samplePayload);
    expect(counts).toEqual({
      identidade: 1,
      sedimentos: 2,
      reunioes: 1,
      mensagens: 1,
    });

    const emptyCounts = summarizeKairosSnapshot(null);
    expect(emptyCounts).toEqual({
      identidade: 0,
      sedimentos: 0,
      reunioes: 0,
      mensagens: 0,
    });
  });

  it("renders context block correctly", () => {
    const context = renderKairosContextBlock(samplePayload);

    expect(context).toContain("=== TÚNEL DE KAIRÓS / CONTEXTO IMPORTADO DA TOTALIDADE ===");
    expect(context).toContain("Este bloco é contexto importado da Totalidade");
    expect(context).toContain("Kaline faceta 1");
    expect(context).toContain("sedimento A");
    expect(context).toContain("Alinhamento");
    expect(context).toContain("[Ká]: Olá");
    expect(context).not.toContain("sharedKey");
  });

  it("truncates large content blocks", () => {
    const largePayload = {
      identidade: "A".repeat(20000),
    };
    const context = renderKairosContextBlock(largePayload);
    expect(context.length).toBeLessThan(16000);
    expect(context).toContain("...(conteúdo truncado por limite de tamanho)...");
  });

  it("normalizes current and future Totalidade payloads correctly", () => {
    // Current payload format (direct)
    const currentPayload = {
      identidade: "Direct identity",
      sedimentos: ["Direct sedimento"],
    };
    expect(normalizeKairosPayload(currentPayload)).toEqual(currentPayload);

    // Future payload format (nested snapshot)
    const futurePayload = {
      schema_version: 1,
      snapshot_id: "snap_123",
      generated_at: "2026-07-06T00:00:00Z",
      source: "totalidade",
      scope: "kaline",
      excludes: [],
      counts: { identidade: 1, sedimentos: 1, reunioes: 0, mensagens: 0 },
      snapshot: {
        identidade: "Nested identity",
        sedimentos: ["Nested sedimento"],
      },
    };
    const normalized = normalizeKairosPayload(futurePayload);
    expect(normalized.identidade).toBe("Nested identity");
    expect(normalized.sedimentos).toEqual(["Nested sedimento"]);
    expect(normalized.schema_version).toBe(1);
    expect(normalized.snapshot_id).toBe("snap_123");
    expect(normalized.metadata_counts).toEqual(futurePayload.counts);
  });
});
