import crypto from "node:crypto";

export function decryptKairosEnvelope(sharedSecret, envelope) {
  if (!envelope || envelope.v !== 1) {
    throw new Error("Versão do envelope inválida ou formato incorreto.");
  }
  if (typeof envelope.iv !== "string" || typeof envelope.data !== "string") {
    throw new Error("Envelope iv e data devem ser strings base64.");
  }

  const key = crypto.createHash("sha256").update(sharedSecret).digest();
  const iv = Buffer.from(envelope.iv, "base64");
  const data = Buffer.from(envelope.data, "base64");

  if (iv.length !== 12) {
    throw new Error("IV inválido (deve ter exatamente 12 bytes).");
  }

  if (data.length < 16) {
    throw new Error("Dados cifrados muito curtos (devem conter a tag de autenticação).");
  }

  const ciphertext = data.subarray(0, data.length - 16);
  const tag = data.subarray(data.length - 16);

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return JSON.parse(decrypted.toString("utf-8"));
  } catch (err) {
    throw new Error(
      "Falha ao decifrar o envelope. Verifique a chave compartilhada: " + err.message,
    );
  }
}
