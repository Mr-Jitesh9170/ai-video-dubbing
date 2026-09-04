# AI-Powered Video Dubbing Platform
## Step-by-Step Implementation Documentation

> Purpose: This document is the practical build guide for the 3-day Senior Software Engineer take-home assignment.
>
> Follow the sections in order. Do not start coding randomly.

---

# 0. What Are We Building?

The application accepts a video, identifies speakers and their speech, translates the speech into one or more target languages, generates AI voices, synchronizes the generated audio with the original video, creates subtitles, and provides the final files to the user.

### Simple flow

```text
User
  |
  | Upload video + target language(s)
  v
API Server
  |
  | Validate
  v
Create Job
  |
  v
Queue
  |
  v
Worker
  |
  +--> Extract Audio
  |
  +--> Speaker Diarization
  |
  +--> Speech-to-Text
  |
  +--> Translation
  |
  +--> AI Voice Generation
  |
  +--> Audio Synchronization
  |
  +--> Final Video Generation
  |
  +--> SRT Generation
  |
  v
Store Outputs
  |
  v
Job Completed
  |
  v
User Downloads Video / Transcript / SRT
```

---

# 1. Scope and Priority

The assignment has many production requirements, but the deadline is only 3 calendar days.

## P0 - Must work

- Video upload
- Video validation
- Job creation
- Background processing
- Speaker diarization
- Speech-to-text
- Translation
- AI voice generation
- Audio/video synchronization
- Final video generation
- SRT generation
- Processing status
- Download endpoints
- Retry
- Cancel
- Docker Compose

## P1 - Production quality

- Database
- Object storage abstraction
- AI provider abstraction
- Configuration-driven architecture
- Structured logging
- Error handling
- Rate limiting
- Automated tests
- README
- Architecture documentation
- Design decisions
- API documentation

## P2 - Bonus

- Kubernetes
- CI/CD
- Provider fallback
- Cost-aware routing
- SSE/WebSocket progress
- Distributed tracing
- GPU support
- Terraform
- Multi-region strategy
- Provider benchmarking

### Rule

Do not implement P2 features before the core P0 pipeline works.

---

# 2. Recommended Technology Stack

Keep the stack simple and explainable.

## Backend

- Node.js
- Express
- JavaScript or TypeScript
- MongoDB or PostgreSQL
- Redis
- BullMQ
- FFmpeg

## Frontend

- React
- Bootstrap or simple CSS
- Axios

## Storage

Development:

- Local filesystem or MinIO

Production:

- S3-compatible object storage

## AI

Use provider adapters.

Possible categories:

- STT: Whisper / Deepgram / AssemblyAI
- Translation: OpenAI / Gemini / DeepL
- Voice: ElevenLabs / Azure Speech / OpenVoice

The application should not depend directly on one provider throughout the codebase.

## Deployment

- Docker
- Docker Compose

---

# 3. Before Coding: Create the Project Documents

Create this folder:

```text
docs/
```

Create these files:

```text
docs/
├── 01-requirements.md
├── 02-functional-flow.md
├── 03-system-architecture.md
├── 04-processing-pipeline.md
├── 05-database-design.md
├── 06-storage-design.md
├── 07-api-design.md
├── 08-ai-provider-design.md
├── 09-queue-worker-design.md
├── 10-configuration.md
├── 11-fault-tolerance.md
├── 12-security.md
├── 13-observability.md
├── 14-scaling.md
├── 15-testing.md
├── 16-deployment.md
└── 17-design-decisions.md
```

This master document can remain your main implementation checklist.

---

# 4. Step 1 - Understand the Requirements

The application must support:

1. Video upload
2. Video validation
3. Multiple speakers
4. Speaker boundaries
5. Speaker speaking duration
6. Speaker timeline
7. Automatic source language detection
8. Timestamped transcript
9. Multiple target languages
10. Context-aware translation
11. Consistent speaker mapping
12. AI-generated voices
13. Audio/video synchronization
14. Subtitle generation
15. Processing logs
16. Processing status
17. Retry
18. Cancel
19. Configuration
20. Provider switching
21. Background processing
22. Scaling
23. Storage abstraction
24. Database
25. Fault tolerance
26. Observability
27. Security
28. Docker
29. Automated tests

---

# 5. Step 2 - Define the Main User Flow

The user flow is:

```text
Open Application
      |
      v
Select Video
      |
      v
Select Target Language(s)
      |
      v
Upload
      |
      v
Validation
      |
      +---- Invalid ---> Return Error
      |
      v
Create Job
      |
      v
Job Queued
      |
      v
Worker Processes Job
      |
      v
Show Processing Status
      |
      v
Job Completed
      |
      +--> Download Dubbed Video
      +--> Download Transcript
      +--> Download SRT
      +--> View Processing Logs
```

---

# 6. Step 3 - Main System Architecture

Use this architecture initially:

```text
                         +----------------+
                         |    React UI    |
                         +-------+--------+
                                 |
                                 | HTTP
                                 v
                         +----------------+
                         |  Node/Express  |
                         |      API       |
                         +-------+--------+
                                 |
                +----------------+----------------+
                |                |                |
                v                v                v
          +-----------+    +-----------+    +-----------+
          | Database  |    |   Redis   |    |  Storage  |
          | Mongo/PG  |    |  BullMQ   |    | S3/MinIO  |
          +-----------+    +-----+-----+    +-----------+
                                 |
                                 v
                         +----------------+
                         |     Worker     |
                         +-------+--------+
                                 |
                 +---------------+----------------+
                 |               |                |
                 v               v                v
              Diarize           STT         Translation
                 |               |                |
                 +---------------+----------------+
                                 |
                                 v
                           Voice Provider
                                 |
                                 v
                          Audio Synchronizer
                                 |
                                 v
                           FFmpeg / Video
                                 |
                                 v
                              Storage
```

---

# 7. Step 4 - Divide the Backend into Responsibilities

Recommended structure:

```text
backend/
└── src/
    ├── config/
    ├── controllers/
    ├── routes/
    ├── services/
    ├── models/
    ├── middleware/
    ├── validators/
    ├── providers/
    │   ├── stt/
    │   ├── translation/
    │   └── voice/
    ├── queue/
    ├── storage/
    ├── utils/
    └── app.js
```

Worker:

```text
worker/
├── processors/
├── pipeline/
└── worker.js
```

### Responsibility

```text
Route
  -> decides which endpoint is called

Controller
  -> handles HTTP request/response

Service
  -> business logic

Provider
  -> external AI provider integration

Queue
  -> background job management

Worker
  -> long-running video processing

Storage
  -> file upload/download/delete

Model
  -> database access
```

---

# 8. Step 5 - Design the Database

Use these main entities.

## Job

```text
Job
-------------------------
id
status
sourceLanguage
targetLanguages
inputFile
outputFiles
progress
currentStep
retryCount
error
createdAt
updatedAt
completedAt
```

Possible statuses:

```text
UPLOADED
QUEUED
PROCESSING
COMPLETED
FAILED
CANCELLED
```

## ProcessingStep

```text
ProcessingStep
-------------------------
id
jobId
step
status
attempt
startedAt
completedAt
duration
error
metadata
```

Steps:

```text
AUDIO_EXTRACTION
DIARIZATION
SPEECH_TO_TEXT
TRANSLATION
VOICE_GENERATION
AUDIO_SYNC
VIDEO_GENERATION
SUBTITLE_GENERATION
```

## Speaker

```text
Speaker
-------------------------
id
jobId
speakerKey
displayName
voiceProvider
voiceId
totalDuration
createdAt
```

Example:

```text
speakerKey = speaker_1
voiceId = provider-specific voice ID
```

## TranscriptSegment

```text
TranscriptSegment
-------------------------
id
jobId
speakerId
startTime
endTime
sourceText
translatedText
sourceLanguage
targetLanguage
```

## AuditLog

```text
AuditLog
-------------------------
id
jobId
event
message
metadata
createdAt
```

---

# 9. Step 6 - Storage Design

Never store large video binaries directly in MongoDB.

Use object storage.

```text
storage/
└── jobs/
    └── {jobId}/
        ├── input/
        │   └── original.mp4
        ├── audio/
        │   └── source.wav
        ├── transcript/
        │   └── transcript.json
        ├── translated/
        │   └── hi.json
        ├── voices/
        │   ├── speaker_1.wav
        │   └── speaker_2.wav
        ├── subtitles/
        │   └── hi.srt
        ├── output/
        │   └── hi.mp4
        └── logs/
            └── processing.json
```

Create a storage interface:

```text
StorageProvider
    |
    +-- LocalStorage
    +-- MinioStorage
    +-- S3Storage
```

Application code should use:

```text
storage.upload()
storage.download()
storage.delete()
storage.getUrl()
```

instead of directly calling S3 or filesystem APIs everywhere.

---

# 10. Step 7 - Design the REST APIs

Base URL:

```text
/api/v1
```

## Upload

```http
POST /api/v1/videos
```

Input:

```text
multipart/form-data

video
targetLanguages[]
```

Response:

```json
{
  "jobId": "job_123",
  "status": "QUEUED"
}
```

## Get status

```http
GET /api/v1/jobs/:jobId
```

Response:

```json
{
  "jobId": "job_123",
  "status": "PROCESSING",
  "progress": 55,
  "currentStep": "VOICE_GENERATION"
}
```

## Get transcript

```http
GET /api/v1/jobs/:jobId/transcript
```

## Download dubbed video

```http
GET /api/v1/jobs/:jobId/video
```

## Download subtitles

```http
GET /api/v1/jobs/:jobId/subtitles
```

## Get processing logs

```http
GET /api/v1/jobs/:jobId/logs
```

## Retry

```http
POST /api/v1/jobs/:jobId/retry
```

## Cancel

```http
POST /api/v1/jobs/:jobId/cancel
```

---

# 11. Step 8 - Video Upload

When a user uploads a video:

```text
Request
  |
  v
Multer / upload middleware
  |
  v
Check file size
  |
  v
Check extension
  |
  v
Check actual media type
  |
  v
Check duration
  |
  v
Generate safe storage key
  |
  v
Upload to storage
  |
  v
Create Job
  |
  v
Add job to queue
```

Maximum duration:

```text
600 seconds
```

Do not hardcode this value. Put it in configuration.

---

# 12. Step 9 - Queue Design

Use Redis + BullMQ.

```text
API
 |
 | create job
 v
BullMQ
 |
 v
Redis
 |
 v
Worker
```

The API should return quickly:

```text
Upload
  |
  +--> Job created
  |
  +--> Queue job
  |
  +--> Return jobId
```

Do NOT keep the HTTP request open while a video is processed.

---

# 13. Step 10 - Worker Design

Worker receives:

```json
{
  "jobId": "job_123",
  "targetLanguages": ["hi", "fr"]
}
```

Worker starts:

```text
Load Job
   |
   v
AUDIO_EXTRACTION
   |
   v
DIARIZATION
   |
   v
SPEECH_TO_TEXT
   |
   v
TRANSLATION
   |
   v
VOICE_GENERATION
   |
   v
AUDIO_SYNC
   |
   v
VIDEO_GENERATION
   |
   v
SUBTITLE_GENERATION
   |
   v
COMPLETED
```

After every step:

```text
Update ProcessingStep
Update Job.progress
Update Job.currentStep
Write structured log
```

---

# 14. Step 11 - Audio Extraction

Use FFmpeg.

Input:

```text
original.mp4
```

Output:

```text
source.wav
```

The processing code should be isolated:

```text
AudioExtractor
    |
    +-- extract(videoPath)
```

Do not put FFmpeg commands directly into controllers.

---

# 15. Step 12 - Speaker Diarization

Goal:

```text
Who spoke when?
```

Example output:

```json
[
  {
    "speaker": "speaker_1",
    "start": 0.4,
    "end": 4.2
  },
  {
    "speaker": "speaker_2",
    "start": 4.3,
    "end": 8.9
  }
]
```

Speaker identity must remain stable:

```text
speaker_1
speaker_1
speaker_2
speaker_1
speaker_2
```

Do not create a new speaker ID every time the person starts speaking.

---

# 16. Step 13 - Speech-to-Text

STT should produce timestamped text.

Example:

```json
[
  {
    "speaker": "speaker_1",
    "start": 0.4,
    "end": 3.1,
    "text": "Hello everyone."
  },
  {
    "speaker": "speaker_2",
    "start": 3.2,
    "end": 6.7,
    "text": "Hello. Nice to meet you."
  }
]
```

The final transcript must preserve:

- speaker
- start time
- end time
- text
- language

---

# 17. Step 14 - Merge Diarization + STT

Sometimes the diarization provider and STT provider return different formats.

Create an internal normalized format.

Use:

```json
{
  "speaker": "speaker_1",
  "start": 0.4,
  "end": 3.1,
  "text": "Hello everyone."
}
```

Everything after this point should use this internal format.

This prevents your business logic from depending on one AI provider's response format.

---

# 18. Step 15 - Translation

Input:

```text
English transcript
```

Output:

```text
Hindi transcript
```

Example:

```json
{
  "speaker": "speaker_1",
  "start": 0.4,
  "end": 3.1,
  "sourceText": "Hello everyone.",
  "translatedText": "नमस्ते सभी को.",
  "sourceLanguage": "en",
  "targetLanguage": "hi"
}
```

Important:

Do not translate each sentence with no context if it destroys conversation meaning.

For longer content, use context windows/chunks while preserving segment mapping.

---

# 19. Step 16 - AI Voice Generation

For each speaker:

```text
Speaker 1
   |
   v
Voice ID 1
```

```text
Speaker 2
   |
   v
Voice ID 2
```

Then generate audio from translated text.

Example:

```text
speaker_1 + Hindi text
        |
        v
speaker_1_hindi.wav
```

```text
speaker_2 + Hindi text
        |
        v
speaker_2_hindi.wav
```

The same speaker must use the same configured voice identity throughout a target language.

---

# 20. Step 17 - Audio Synchronization

The generated voice may be longer or shorter than the original speech.

You need best-effort timing alignment.

Conceptually:

```text
Original segment
start = 10 sec
end = 14 sec
duration = 4 sec

Generated speech
duration = 5 sec
```

Possible approach:

```text
Generate speech
      |
      v
Measure duration
      |
      v
Adjust speech timing
      |
      v
Place it at original start/end window
```

Use FFmpeg audio filters/time adjustment where appropriate.

Do not claim perfect lip-sync if you have not implemented true lip-sync.

Call it:

```text
Best-effort audio synchronization
```

---

# 21. Step 18 - Final Video Generation

Take:

```text
Original video
+
Generated/mixed dubbed audio
```

Then create:

```text
final.mp4
```

Conceptually:

```text
original video
       +
dubbed audio
       |
       v
FFmpeg
       |
       v
final.mp4
```

Do not unnecessarily re-encode the video if the chosen pipeline allows safe stream copying.

---

# 22. Step 19 - Subtitle Generation

Generate standard SRT.

Example:

```text
1
00:00:00,400 --> 00:00:03,100
Speaker 1: नमस्ते सभी को.

2
00:00:03,200 --> 00:00:06,700
Speaker 2: नमस्ते. आपसे मिलकर अच्छा लगा.
```

SRT must use correct timestamp formatting.

---

# 23. Step 20 - Multiple Target Languages

A single job may request:

```text
targetLanguages = ["hi", "fr", "de"]
```

The architecture should support:

```text
                  Job
                   |
        +----------+----------+
        |          |          |
        v          v          v
       Hindi      French     German
        |          |          |
        v          v          v
      Voice       Voice      Voice
        |          |          |
        v          v          v
     final-hi   final-fr   final-de
```

Do not duplicate the entire codebase for every language.

Loop over target languages using the same pipeline.

---

# 24. Step 21 - AI Provider Abstraction

Create interfaces.

## STT

```text
SpeechToTextProvider
    |
    +-- WhisperProvider
    +-- DeepgramProvider
    +-- AssemblyAIProvider
```

Method:

```text
transcribe(audio)
```

## Translation

```text
TranslationProvider
    |
    +-- OpenAIProvider
    +-- GeminiProvider
    +-- DeepLProvider
```

Method:

```text
translate(segments, targetLanguage)
```

## Voice

```text
VoiceProvider
    |
    +-- ElevenLabsProvider
    +-- AzureVoiceProvider
    +-- OpenVoiceProvider
```

Method:

```text
generate(text, voiceId)
```

The pipeline should depend on interfaces, not concrete providers.

---

# 25. Step 22 - Configuration

Create `.env.example`.

Example:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=

REDIS_URL=

STORAGE_PROVIDER=minio
STORAGE_BUCKET=

MAX_UPLOAD_SIZE_MB=500
MAX_VIDEO_DURATION_SECONDS=600

ALLOWED_VIDEO_FORMATS=mp4,mov,avi,mkv

MAX_CONCURRENT_JOBS=5
PROCESSING_TIMEOUT_SECONDS=1800
MAX_RETRIES=3

STT_PROVIDER=whisper
TRANSLATION_PROVIDER=openai
VOICE_PROVIDER=elevenlabs

STT_API_KEY=
TRANSLATION_API_KEY=
VOICE_API_KEY=
```

Configuration must be loaded in one place.

Example:

```text
config/
├── app.js
├── database.js
├── queue.js
├── storage.js
└── ai.js
```

Never commit real secrets.

---

# 26. Step 23 - Processing Status

The frontend needs to know what is happening.

Example:

```json
{
  "status": "PROCESSING",
  "progress": 65,
  "currentStep": "VOICE_GENERATION"
}
```

Suggested progress:

```text
Upload                 5%
Audio extraction      10%
Diarization            20%
Speech-to-text         35%
Translation            50%
Voice generation       70%
Audio synchronization  80%
Video generation       90%
Subtitles              95%
Completed             100%
```

The exact percentages are configurable/adjustable.

---

# 27. Step 24 - Retry

Each processing step should support retry where safe.

Example:

```text
STT fails
   |
   v
attempt 1
   |
   v
fails
   |
   v
attempt 2
   |
   v
fails
   |
   v
attempt 3
   |
   v
fails
   |
   v
Job FAILED
```

Configuration:

```env
MAX_RETRIES=3
```

Retry should not create duplicate output or corrupt job state.

Use idempotent processing wherever possible.

---

# 28. Step 25 - Cancel

When the user calls:

```http
POST /api/v1/jobs/:jobId/cancel
```

The system should:

```text
Check job status
     |
     +--> COMPLETED -> cannot cancel
     |
     +--> FAILED -> cannot cancel
     |
     +--> CANCELLED -> already cancelled
     |
     +--> QUEUED/PROCESSING -> request cancellation
```

The worker should check cancellation between major processing steps.

For long-running external commands, terminate the process where safely supported.

---

# 29. Step 26 - Fault Tolerance

Handle:

```text
AI provider timeout
Network failure
Storage failure
Corrupted video
Invalid file
Worker crash
Database failure
Redis failure
FFmpeg failure
Partial processing failure
```

General strategy:

```text
Failure
  |
  v
Log error
  |
  v
Determine retryable?
  |
  +-- Yes --> Retry
  |
  +-- No --> Mark failed
```

Store:

```text
errorCode
errorMessage
failedStep
attempt
timestamp
```

---

# 30. Step 27 - Idempotency

A job step should not produce duplicate results if accidentally executed twice.

Example:

```text
VOICE_GENERATION
```

Before generating:

```text
Does output already exist?
     |
     +-- Yes -> reuse it
     |
     +-- No -> generate it
```

This becomes important when workers retry.

---

# 31. Step 28 - Security

Implement:

- File size validation
- File extension validation
- Actual media/content validation
- Duration validation
- Filename sanitization
- Path traversal protection
- Request body validation
- Rate limiting
- CORS restrictions
- Secure secrets
- No API keys in Git
- Safe download authorization
- Safe FFmpeg argument handling

Do not build shell commands by directly concatenating untrusted user input.

---

# 32. Step 29 - Observability

Use structured logs.

Example:

```json
{
  "level": "info",
  "event": "processing_step_completed",
  "jobId": "job_123",
  "step": "SPEECH_TO_TEXT",
  "durationMs": 12000
}
```

Important events:

```text
UPLOAD_STARTED
UPLOAD_COMPLETED
JOB_CREATED
JOB_QUEUED
PROCESSING_STARTED
STEP_STARTED
STEP_COMPLETED
STEP_FAILED
JOB_RETRY
JOB_CANCELLED
JOB_COMPLETED
JOB_FAILED
```

For a production architecture, mention:

```text
OpenTelemetry
Prometheus
Grafana
ELK
```

You do not need to implement every one in 3 days.

---

# 33. Step 30 - Scaling

The API should be stateless.

```text
             Load Balancer
                  |
       +----------+----------+
       |          |          |
      API        API        API
       |          |          |
       +----------+----------+
                  |
                Queue
                  |
       +----------+----------+
       |          |          |
    Worker     Worker     Worker
```

When queue depth increases:

```text
Queue depth increases
       |
       v
Increase worker count
```

For 5 videos:

```text
3 workers
```

For 500 videos:

```text
More workers
```

For 5000 videos:

```text
Auto-scaled worker pool
```

Production deployment can use Kubernetes/ECS/GKE/AKS/etc.

---

# 34. Step 31 - Why the Queue Matters

Without a queue:

```text
User
  |
  v
API
  |
  v
Process 10-minute video
  |
  v
HTTP request remains open
```

Bad.

With queue:

```text
User
  |
  v
API
  |
  v
Queue
  |
  v
Return jobId immediately

Worker processes later
```

This is one of the most important architectural decisions in the assignment.

---

# 35. Step 32 - Docker

Docker Compose should run:

```text
API
Worker
Redis
Database
MinIO
```

Example:

```text
docker-compose.yml

services:
  api:
    ...

  worker:
    ...

  redis:
    ...

  database:
    ...

  minio:
    ...
```

Start:

```bash
docker compose up --build
```

Stop:

```bash
docker compose down
```

The README should explain this.

---

# 36. Step 33 - Testing

Create tests for:

## Upload

```text
valid MP4 -> accepted
invalid extension -> rejected
oversized file -> rejected
>10 minute video -> rejected
corrupted video -> rejected
```

## Jobs

```text
job created
job queued
status updates
retry
cancel
```

## Pipeline

```text
audio extraction
diarization mapping
transcript normalization
translation mapping
voice mapping
SRT generation
```

## Provider abstraction

```text
mock provider
real provider adapter
provider failure
```

## Integration

```text
Upload
  -> Job
  -> Queue
  -> Worker
  -> Output
```

---

# 37. Step 34 - Git Workflow

Initialize Git immediately.

```bash
git init
```

Use meaningful commits:

```text
initial project setup
add configuration module
add database models
add video upload
add upload validation
add job queue
add worker
add audio extraction
add diarization provider
add stt provider
add translation provider
add voice provider
add video synchronization
add subtitle generation
add retry handling
add cancellation
add tests
add docker compose
update documentation
```

Do not wait until the end to create commits.

---

# 38. Step 35 - Recommended Folder Structure

```text
ai-video-dubbing/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── providers/
│   │   │   ├── stt/
│   │   │   ├── translation/
│   │   │   └── voice/
│   │   ├── queue/
│   │   ├── storage/
│   │   └── utils/
│   └── package.json
│
├── worker/
│   ├── processors/
│   ├── pipeline/
│   └── worker.js
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       └── utils/
│
├── tests/
│
├── docs/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# 39. Step 36 - Development Order

This is the exact order to follow.

## Phase 1 - Planning

```text
[ ] Read assignment
[ ] Write requirements
[ ] Draw user flow
[ ] Draw architecture
[ ] Design database
[ ] Design storage
[ ] Design APIs
```

## Phase 2 - Project Setup

```text
[ ] Create Git repository
[ ] Create backend
[ ] Create frontend
[ ] Setup database
[ ] Setup Redis
[ ] Setup configuration
[ ] Setup Docker
```

## Phase 3 - Upload

```text
[ ] Upload endpoint
[ ] File validation
[ ] Duration validation
[ ] Storage upload
[ ] Job creation
[ ] Queue job
```

## Phase 4 - Worker

```text
[ ] Worker setup
[ ] Job status updates
[ ] Error handling
[ ] Retry handling
```

## Phase 5 - AI Pipeline

```text
[ ] Audio extraction
[ ] Diarization
[ ] STT
[ ] Transcript normalization
[ ] Translation
[ ] Voice generation
[ ] Audio synchronization
[ ] Final video
[ ] SRT
```

## Phase 6 - Job APIs

```text
[ ] Status
[ ] Transcript
[ ] Video download
[ ] Subtitle download
[ ] Logs
[ ] Retry
[ ] Cancel
```

## Phase 7 - Production Quality

```text
[ ] Provider abstraction
[ ] Storage abstraction
[ ] Configuration
[ ] Structured logs
[ ] Security
[ ] Rate limiting
[ ] Fault tolerance
```

## Phase 8 - Testing

```text
[ ] Unit tests
[ ] API tests
[ ] Pipeline tests
[ ] Integration tests
```

## Phase 9 - Documentation

```text
[ ] README
[ ] Architecture
[ ] Design decisions
[ ] API docs
[ ] Configuration guide
[ ] Deployment guide
```

## Phase 10 - Final

```text
[ ] Docker Compose test
[ ] Clean Git repository
[ ] Test from fresh setup
[ ] Record walkthrough
[ ] Final review
[ ] Submit
```

---

# 40. Three-Day Schedule

## DAY 1 - Core Infrastructure

### Morning

```text
1. Requirements
2. Architecture
3. Database
4. API design
5. Project setup
```

### Afternoon

```text
6. Upload API
7. Validation
8. Storage
9. Job creation
10. Redis/BullMQ
```

### Evening

```text
11. Worker
12. Job status
13. Audio extraction
14. First end-to-end pipeline test
```

### Day 1 target

You should have:

```text
Upload
  ↓
Job
  ↓
Queue
  ↓
Worker
```

working.

---

# 41. DAY 2 - AI Pipeline

### Morning

```text
1. Diarization
2. STT
3. Transcript normalization
4. Translation
```

### Afternoon

```text
5. Voice generation
6. Audio synchronization
7. Video generation
8. SRT
```

### Evening

```text
9. Multiple target languages
10. Status updates
11. Retry
12. Cancel
13. Download endpoints
```

### Day 2 target

One uploaded video should successfully become:

```text
input.mp4
     |
     v
dubbed.mp4
transcript.json
subtitles.srt
processing-log.json
```

---

# 42. DAY 3 - Production Readiness

### Morning

```text
1. Provider abstraction
2. Configuration
3. Fault tolerance
4. Security
5. Structured logging
```

### Afternoon

```text
6. Automated tests
7. Docker Compose
8. README
9. Architecture document
10. Design decisions
```

### Evening

```text
11. Fresh installation test
12. Fix bugs
13. Record walkthrough
14. Final Git cleanup
15. Submit
```

---

# 43. Final Architecture Flow

The final system should be explainable like this:

```text
                         USER
                           |
                           v
                    React Frontend
                           |
                           v
                    Node.js API
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
       Database         Redis Queue       Storage
                           |
                           v
                        Worker
                           |
                           v
                    Processing Pipeline
                           |
       +-------------------+-------------------+
       |                   |                   |
       v                   v                   v
   Diarization            STT             Translation
                                               |
                                               v
                                        Voice Generation
                                               |
                                               v
                                       Audio Synchronization
                                               |
                                               v
                                        FFmpeg Processing
                                               |
                                    +----------+----------+
                                    |                     |
                                    v                     v
                              Dubbed Video              SRT
                                    |
                                    v
                                 Storage
                                    |
                                    v
                              Download APIs
```

---

# 44. How to Explain the Architecture in the Interview

Use this simple explanation:

> "The API is responsible only for request handling, validation, job creation and status APIs. Video processing is asynchronous because AI processing can take several minutes. Once a video is uploaded, the API stores it and creates a job in Redis/BullMQ. A worker consumes the job and executes the processing pipeline: audio extraction, speaker diarization, speech recognition, translation, voice generation, synchronization and final video generation. Results are stored in object storage, while job metadata and processing state are stored in the database."

Then explain:

> "The AI integrations are behind provider abstractions so I can switch STT, translation or voice providers through configuration without changing business logic."

Then:

> "The API is stateless, so multiple API instances can run behind a load balancer. Workers can scale independently based on queue depth."

This is the core senior-level explanation.

---

# 45. Important Design Trade-offs

Document decisions honestly.

## Redis/BullMQ vs Kafka

For this 3-day assignment:

```text
Redis + BullMQ
```

is simpler and provides the required background-job functionality.

Kafka would make sense at much larger event-streaming scale, but it adds operational complexity that is unnecessary for the first implementation.

## MongoDB vs PostgreSQL

MongoDB is acceptable and fast to develop with.

PostgreSQL is attractive when relational consistency and reporting across jobs, speakers, transcripts and audit records become important.

Choose one and explain why.

## Local storage vs S3

Local storage:

```text
easy development
```

Object storage:

```text
production scalability
durability
large-file handling
```

Use an abstraction so both are possible.

## Synchronous vs asynchronous processing

Always use asynchronous processing for the video pipeline.

Reason:

```text
video processing = long-running
```

HTTP request:

```text
should return jobId quickly
```

---

# 46. What NOT to Do

Do not:

```text
[ ] Put all code in one controller
[ ] Process 10-minute videos inside HTTP requests
[ ] Hardcode API keys
[ ] Hardcode upload limits
[ ] Store videos directly in MongoDB
[ ] Call ElevenLabs/OpenAI/etc. from random files
[ ] Put provider-specific logic everywhere
[ ] Ignore failed jobs
[ ] Ignore worker crashes
[ ] Use user-provided filenames directly as filesystem paths
[ ] Claim perfect lip-sync without implementing it
[ ] Build Kubernetes before the core pipeline works
```

---

# 47. Minimum Successful Demo

Your walkthrough should demonstrate this:

```text
1. Start Docker Compose
2. Open application/API
3. Upload sample video
4. Select Hindi
5. Receive jobId
6. Show QUEUED
7. Show PROCESSING
8. Show current step
9. Show speaker-aware transcript
10. Show translated transcript
11. Show generated dubbed video
12. Show SRT
13. Download output
14. Demonstrate retry/error handling
15. Show configuration
16. Show provider abstraction
17. Show queue
18. Show Docker services
```

---

# 48. Walkthrough Video Structure

The company requires 15-20 minutes.

Use this structure.

## 0-2 minutes

Problem and solution.

```text
What does the application do?
```

## 2-5 minutes

Architecture.

```text
React
API
Redis
Worker
Database
Storage
AI providers
```

## 5-8 minutes

Code organization.

```text
controllers
services
providers
queue
worker
storage
```

## 8-11 minutes

Processing pipeline.

```text
upload
diarization
STT
translation
voice
sync
video
SRT
```

## 11-13 minutes

Configuration and provider abstraction.

## 13-15 minutes

API demo.

## 15-17 minutes

Docker and scaling.

## 17-19 minutes

Fault tolerance and tests.

## 19-20 minutes

Challenges and design decisions.

---

# 49. Final Submission Checklist

## Code

```text
[ ] Source code
[ ] Clean folder structure
[ ] No secrets
[ ] .env.example
[ ] Meaningful commits
```

## Documentation

```text
[ ] README
[ ] Architecture
[ ] API documentation
[ ] Configuration
[ ] Design decisions
[ ] Scaling strategy
[ ] Failure recovery
```

## Infrastructure

```text
[ ] Docker Compose
[ ] API container
[ ] Worker container
[ ] Redis
[ ] Database
[ ] Storage
```

## Testing

```text
[ ] Unit tests
[ ] API tests
[ ] Core pipeline tests
[ ] Integration tests
```

## Demo

```text
[ ] Upload works
[ ] Processing works
[ ] Status works
[ ] Output works
[ ] SRT works
[ ] Download works
[ ] Retry works
[ ] Cancel works
```

## Video

```text
[ ] 15-20 minutes
[ ] Architecture
[ ] Code
[ ] Configuration
[ ] AI abstraction
[ ] Queue
[ ] Processing
[ ] Scaling
[ ] Fault tolerance
[ ] API demo
[ ] Docker
[ ] Challenges
```

---

# 50. The One Flow You Must Remember

If you forget everything else, remember this:

```text
                  VIDEO
                    |
                    v
                 UPLOAD
                    |
                    v
                VALIDATE
                    |
                    v
                CREATE JOB
                    |
                    v
                  QUEUE
                    |
                    v
                 WORKER
                    |
                    v
             EXTRACT AUDIO
                    |
                    v
            DIARIZE SPEAKERS
                    |
                    v
             SPEECH TO TEXT
                    |
                    v
               TRANSLATE
                    |
                    v
             GENERATE VOICES
                    |
                    v
             SYNC AUDIO
                    |
                    v
             GENERATE VIDEO
                    |
                    v
              GENERATE SRT
                    |
                    v
              STORE OUTPUT
                    |
                    v
             JOB COMPLETED
                    |
                    v
                 DOWNLOAD
```

That is the heart of the entire assignment.

---

# 51. Your Immediate Next Steps

Do these in order:

```text
[ ] Create Git repository
[ ] Create docs/ folder
[ ] Create architecture diagram
[ ] Create database diagram
[ ] Create processing pipeline diagram
[ ] Create backend
[ ] Create frontend
[ ] Setup Docker Compose
[ ] Setup Redis
[ ] Setup database
[ ] Setup storage
[ ] Build upload API
[ ] Build queue
[ ] Build worker
[ ] Build pipeline
```

**Do not start with the frontend.**

Start with:

```text
Upload
  ↓
API
  ↓
Queue
  ↓
Worker
```

Once this foundation works, add each AI processing step one by one.

---

# 52. Definition of Done

The assignment is complete when:

```text
A user can:

1. Upload a supported video
2. Select target language(s)
3. Receive a job ID
4. See processing status
5. The worker processes the video
6. Speakers remain mapped
7. Speech becomes text
8. Text is translated
9. Voices are generated
10. Audio is synchronized
11. Final video is generated
12. SRT is generated
13. Transcript is available
14. Processing logs are available
15. User can download results
16. Failed jobs can be retried
17. Processing can be cancelled
```

And the engineering side demonstrates:

```text
Configuration
Provider abstraction
Queue
Workers
Storage abstraction
Database
Fault tolerance
Security
Logging
Testing
Docker
Scaling strategy
Documentation
```

---

# Final Principle

Build the **smallest complete production-style system** that satisfies the core requirements.

Do not build a giant distributed system just to use more technologies.

The strongest submission is one where you can clearly explain:

```text
WHY did I choose this?
HOW does data move?
WHAT happens when something fails?
HOW do I change providers?
HOW do I scale it?
HOW do I test it?
HOW would I deploy it?
```

If you can answer those questions confidently, the project will look like an engineer designed it rather than someone simply connected a few AI APIs.
