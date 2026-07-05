// Carrega os marcos locais de conhecimento (knowledge/*.md) usados para
// dirigir a Klio Local. Nunca aceita path vindo do usuário, nunca lê fora do
// diretório knowledge/ e nunca falha o servidor por ausência/tamanho dos
// arquivos — na pior hipótese, devolve contexto vazio com um warning.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_KNOWLEDGE_CHARS } from "./config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = path.join(__dirname, "..", "..", "knowledge");

// Lê os marcos e devolve tanto a listagem (para /api/knowledge) quanto o
// texto combinado (para montar o prompt da Klio Local), já truncado em
// MAX_KNOWLEDGE_CHARS se necessário.
export async function loadKnowledge() {
  const warnings = [];
  let entries;

  try {
    entries = await fs.readdir(KNOWLEDGE_DIR, { withFileTypes: true });
  } catch {
    return {
      items: [],
      total_chars: 0,
      warnings: ["Diretório knowledge/ não encontrado."],
      text: "",
    };
  }

  const mdFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => entry.name)
    .sort();

  const items = [];
  const parts = [];
  let totalChars = 0;

  for (const file of mdFiles) {
    try {
      const filePath = path.join(KNOWLEDGE_DIR, file);
      const content = await fs.readFile(filePath, "utf-8");
      items.push({ file, chars: content.length });
      totalChars += content.length;
      parts.push(`## ${file}\n\n${content.trim()}`);
    } catch {
      warnings.push(`Falha ao ler knowledge/${file} — ignorado.`);
    }
  }

  let text = parts.join("\n\n---\n\n");
  if (text.length > MAX_KNOWLEDGE_CHARS) {
    text = `${text.slice(0, MAX_KNOWLEDGE_CHARS)}\n\n[...conteúdo truncado em ${MAX_KNOWLEDGE_CHARS} caracteres...]`;
    warnings.push(
      `Conhecimento combinado excede ${MAX_KNOWLEDGE_CHARS} caracteres e foi truncado.`,
    );
  }

  return { items, total_chars: totalChars, warnings, text };
}
