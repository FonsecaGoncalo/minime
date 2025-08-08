<div align="center">

<picture>
  <source media="(prefers-color-scheme: light)">
  <img alt="minime logo" src="assets/minime.png" width="25%" height="25%">
</picture>

**Minime**: AI Personal Assistant
<p><a href="https://gfonseca.io"> gfonseca.io</a></p>
</div>

---
Minime is an AI-powered chat assistant that lives on my personal website.
It acts as an AI version of me — able to talk about my background, projects, and even schedule meetings through natural conversation.

It combines:
- Large Language Models (LLMs) for dialogue
- Retrieval-Augmented Generation (RAG) from my Notion knowledge base
- A serverless, event-driven AWS architecture
- Infrastructure as Code (Terraform)
- CI/CD, monitoring, and security best practices

## Features
- **Conversational AI**: Streamed responses via WebSocket for a natural chat feel
- **Personalized knowledge**: RAG retrieval from Notion content via Pinecone
- **Meeting scheduling**: Google Calendar integration for booking calls
- **Geolocation awareness**: Enriches user profile from IP location
- **Email summaries**: Sends conversation summaries via SES
- **Rate limiting**: DynamoDB-backed token bucket to protect resources (💰)
- **Event-driven design**: AWS EventBridge + SQS orchestration


## System Architecture

<div align="center">

<picture>
  <source media="(prefers-color-scheme: light)">
  <img alt="minime logo" src="assets/diagram.png" width="80%" height="80%">
</picture>
</div>

### Flow:
1. Frontend:
   - Static site on S3 served via CloudFront
   - Connects to backend via API Gateway (WebSocket) for low-latency streaming
2. Chat Handling:
   - `chat_handler` Lambda manages incoming messages, streams model output back
   - Rate limiting and error handling built-in 
3. Retrieval:
   - Queries Pinecone with embeddings from Notion documents
4. LLM Invocation:
   - Uses Amazon Bedrock & Anthropic Claude
5. Backend Events:
   - EventBridge + SQS for async tasks like IP geolocation & conversation summaries
   - Summaries emailed via SES
   - Meetings scheduled in Google Calendar

### **Realtime Streaming Flow**
```mermaid
sequenceDiagram
    autonumber
    participant U as User (Browser)
    participant CF as CloudFront + S3
    participant WS as API Gateway (WebSocket)
    participant CH as Lambda chat_handler
    participant C as chat.py
    participant VS as Pinecone (RAG)
    participant LLM as LLM Provider<br/>(Anthropic/Bedrock)
    participant GCal as Google Calendar
    participant DDB as DynamoDB (Conversations)

    U->>CF: Load app (HTML/JS/CSS)
    U->>WS: $connect
    WS->>CH: Connect event
    CH->>EventBridge: ConversationStart (ip)
    CH-->>WS: 200 Connected

    U->>WS: send {message}
    WS->>CH: route:message
    CH->>C: chat(session_id, message, on_stream)

    Note over C: Build memory window<br/>& running summary
    C->>DDB: get_conversation(), get_summary()
    C-->>DDB: messages, summary

    Note over C: RAG
    C->>VS: search(query)
    VS-->>C: top_k snippets

    Note over C: Build LLM messages (system+history+docs)
    C->>LLM: stream(messages, tools=[schedule_meeting, update_user_info])

    loop token stream
      LLM-->>C: text chunk
      C-->>CH: on_stream(chunk)
      CH-->>WS: {"op":"message_chunk", "content":chunk}
      WS-->>U: append to assistant bubble
    end

    alt tool call (schedule_meeting)
      LLM-->>C: tool_use(start_time, duration, summary, email)
      C->>GCal: create event
      GCal-->>C: htmlLink
      C->>LLM: tool_result(htmlLink)
      LLM-->>C: confirmation text (stream)
    end

    C->>DDB: add_message(user), add_message(assistant)
    C->>DDB: save_summary(updated)
    C-->>CH: return full text
    CH-->>WS: {"op":"finish"}
    WS-->>U: mark message done
```
### **Async Tasks: IP Geo & Summaries**
```mermaid
sequenceDiagram
    autonumber
    participant WS as API Gateway (WebSocket)
    participant CH as Lambda chat_handler
    participant EB as EventBridge
    participant QG as SQS (geo)
    participant QSUM as SQS (summary)
    participant GEO as Lambda ip_geolocation_handler
    participant SUM as Lambda conversation_summary_handler
    participant GEOAPI as ip-api.com
    participant DDB as DynamoDB
    participant SES as Amazon SES

    WS->>CH: $connect
    CH->>EB: PutEvent ConversationStart {session_id, ip}
    EB->>QG: Rule -> SQS (geo)

    QG->>GEO: Invoke with {session_id, ip}
    GEO->>GEOAPI: Lookup(ip)
    GEOAPI-->>GEO: city, country, tz, zip
    GEO->>DDB: save_user_info(session_id, details)

    Note over CH: ...user chats...

    WS->>CH: $disconnect
    CH->>EB: PutEvent ConversationEnded {session_id}
    EB->>QSUM: Rule -> SQS (summary)

    QSUM->>SUM: Invoke with {session_id}
    SUM->>DDB: get_conversation(), get_summary(), get_user_info()
    SUM->>LLM: Summarise messages (short)
    SUM->>SES: send_email(from, to, "Conversation Summary", body)
```
