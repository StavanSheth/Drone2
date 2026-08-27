# Threat Model
1. **Unauthenticated Video Feed Hijack**: Mitigated via private LAN / TLS.
2. **Serial Port Injection**: Handled by strict line parsing and numerical validation.
3. **Prompt Injection on RAG**: Mitigated via strict prompt templates.
