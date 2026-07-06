# Totalidade — Guia futuro para o Túnel de Kairós

## Objetivo

Orientar mudanças futuras no repo Tonyus-dev/totalidade para melhorar o handoff com a Klio Hefaístia.

Este documento não altera a Totalidade. Ele apenas define o contrato esperado para um PR futuro.

## Estado atual

A Totalidade já possui:

- `GET /api/bridge/olhar-de-kairos`
- envelope cifrado AES-GCM
- uso de `KALINE_BRIDGE_SHARED_KEY`
- snapshot Kaline sem Kuan-Yin
- contexto vivo
- identidade
- sedimentos
- reuniões
- mensagens recentes da faceta Kaline

## Contrato mantido

O envelope deve continuar no formato:

```json
{
  "v": 1,
  "iv": "...",
  "data": "..."
}
```

### Detalhes técnicos do envelope

1. **Criptografia**: AES-256-GCM.
2. **Derivação de chave**: A chave de criptografia de 256 bits é gerada a partir do SHA-256 da chave compartilhada (`sharedKey`).
3. **Vetor de Inicialização (IV)**: Exatamente 12 bytes, codificado em Base64 no campo `iv`.
4. **Dados e Tag (data)**: O campo `data` deve ser a string Base64 resultante da concatenação dos dados cifrados (ciphertext) com a tag de autenticação GCM de 16 bytes (padrão do Web Crypto API e do Node `crypto` quando concatenados).
5. **Formato JSON decifrado**:
   ```json
   {
     "identidade": "...",
     "sedimentos": [...],
     "reunioes": [...],
     "mensagens": [...]
   }
   ```
