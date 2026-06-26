# SeekerClaw Brand/UI Exposure Audit

날짜: 2026-06-26

범위: `C:\workspace\SeekerClaw`에서 SeekerClaw 관련 이미지, 텍스트, 로고, 아이콘, 노출 가능한 브랜드 surface를 찾는다. 범위는 사용자에게 보이는 UI 또는 사용자에게 보일 수 있는 런타임 surface로 제한한다.

업데이트: 2026-06-26 임시 리브랜딩 패스에서 필수 4항목(App Label / Notifications, Android UI Text, Logo / Icon Images, Agent / Telegram / Discord User-Visible Surfaces)의 직접 노출 문자열/이미지 내용을 `NodeAIgent`로 수정했다. 파일명, resource name, package/class name, deep-link, DB/prefs/keystore/channel ID 같은 migration-sensitive 식별자는 유지했다.

기준 정보:
- 기준 문서: `PROJECT.md`
- 앱 버전: `2.0.0`
- `app/build.gradle.kts`: `versionName = "2.0.0"`, `versionCode = 20`
- 이번 확인에서는 `2.0.0`보다 최신 앱 버전을 찾지 못했다.

## 중요 구분

이 문서는 노출 범위를 아래처럼 구분한다:

- 직접 앱 UI 노출: Android 화면, 앱 라벨, 알림, Setup/Settings/Logs 등 직접 보이는 앱 텍스트.
- 에이전트/사용자 메시지 노출: Telegram/Discord slash command, system prompt, diagnostic text, agent가 사용자에게 말할 수 있는 skill text.
- 외부/배포 노출: User-Agent, referer/title header, wallet identity, APK/release naming.

원래 요청 범위는 UI 노출 확인이므로, 최우선 항목은 Android UI/resource와 직접 보이는 Telegram command response다.

## Review Summary

| Section | Priority | Includes | Recommended action | Verification level |
|---|---|---|---|---|
| App Label / Notifications | P0 | `app_name`, manifest app label, notification channel display names, foreground/error notification titles/body | 사용자가 `SeekerClaw`를 보면 안 되는 임시 리브랜딩이면 변경. notification channel ID는 유지하고 표시명만 변경 | 실제 기기에서 육안 확인 필수. 알림 채널은 가능하면 fresh install 기준도 확인 |
| Android UI Text | P0 | Setup, Dashboard, Settings, System, Logs, wallet warning 등 Android 화면 문구 | 일반 사용자가 보는 앱 화면이면 변경 | 접근 가능한 화면을 직접 확인하거나 스크린샷으로 확인 |
| Logo / Icon Images | P1 | `ic_seekerclaw_symbol`, horizontal logo asset, launcher icon, notification/channel icon contents | 보이는 이미지 내용 교체. 임시 리브랜딩이면 path/resource name rename은 피함 | vector/image 내용이 파일명과 다를 수 있으므로 렌더링된 asset을 육안 확인 |
| Agent / Telegram / Discord User-Visible Surfaces | P1 | system prompt identity, official links, slash command responses, model/provider chat errors | 채팅 사용자에게 `SeekerClaw`가 보이면 안 되면 변경 | 가능한 것은 command/test로 확인. credential이 없어 runtime-only 경로를 못 보면 미확인으로 기록 |
| OAuth / Browser-Visible Text | P2 | OAuth return/error/success page title/body, browser sign-in 안내 | OAuth/browser flow가 이번 범위에 포함될 때만 변경 | flow를 직접 트리거해 확인. 못 하면 보류로 기록 |
| QR / Connection / External App Identity | P2 | QR scanner text, setup URL, config/claim error text, Solana wallet identity name/URI | QR/setup/wallet 연결 surface가 이번 범위에 포함될 때만 변경. deep-link scheme은 보통 유지 | 실제 QR/setup/wallet 연결 flow로 확인 |
| Agent Tool / Skill Text | P3 | tool descriptions, Solana/wallet errors, workspace skills, default skills | agent 답변까지 완전히 리브랜딩해야 하면 변경 | 주요 경로를 unit-test 또는 prompt-test로 확인. 많은 항목은 guaranteed UI가 아니라 possible exposure |
| External Service / Header Exposure | P3 | User-Agent, Referer, X-Title, MCP clientInfo, Discord identify metadata | 임시 UI 리브랜딩에서는 보통 선택 사항 | attribution까지 바꿔야 할 때만 request capture로 확인 |
| Ambiguous / Decide Later | P4 | `com.seekerclaw.app`, `seekerclaw://`, prefs/db names, Keystore alias, notification channel IDs, Kotlin class names | 임시 리브랜딩에서는 보통 유지 | 명시적인 migration/update 전략 없이 변경하지 않음 |

---

**이하 섹션은 위 요약의 각 항목에 대한 상세 finding이다.**

## Temporary Rebrand Result — 2026-06-26

- **반영:** P0~P1 항목의 직접 사용자 노출 텍스트와 대표 로고/아이콘 내용을 `NodeAIgent`로 임시 변경.
- **반영:** Dashboard 진입 화면 좌상단 `AgentOS` 바로 위의 split styled logo text(`Seeker` + `C/aw`)도 `NodeAIgent`로 추가 변경. 정확한 `SeekerClaw` 문자열 검색으로는 잡히지 않는 노출 지점이었다.
- **반영:** 실제 공식 사이트/소셜 링크는 새 URL이 없으므로 `[ NodeAIgent link ]` placeholder로 변경.
- **반영:** 대표 이미지 자산은 기존 경로/파일명을 유지하고 실제 vector 내용만 회색 placeholder(`MAIN LOGO`, `MAIN/LOGO`, `APP`, `CHAN`, `N`)로 변경. Launcher icon은 `APP ICON`처럼 긴 label이 adaptive icon mask에서 잘려 보일 수 있어 `APP`로 단축했다.
- **보류:** 설명 이미지, legacy density bitmap fallback icons, OAuth/browser flow, QR/deep-link target, tool/skill P3 surfaces, external headers/User-Agent, wallet identity, package/class/resource names, storage identifiers.
- **검증:** `.\gradlew.bat assembleDappStoreDebug` 통과. `node tests\nodejs-project\smoke.js` 통과.
- **절차 참고:** `DIAGNOSTICS.md`가 수정됐으므로, 프로젝트 규칙상 merge-ready PR 전에는 SAB audit 실행/기록이 필요하다.

## Annotation Legend

아래 각 항목은 보수적인 형식으로 주석을 달았다:

- `Finding`: 코드나 리소스에서 실제로 발견된 것.
- `Meaning`: 그 항목이 가장 가능성 높게 의미하는 것.
- `Confidence`: 해석의 확실성.
  - `Confirmed`: 플랫폼/API 규칙이나 직접적인 런타임 생성 코드상 의미가 거의 확정적인 경우.
  - `Strong inference`: 파일 위치, 참조 방식, 주변 코드상 의미가 강하게 추론되지만 실제 런타임 확인은 필요한 경우.
  - `Possible exposure`: 에이전트, 채팅, 문서, 템플릿, 외부 시스템을 통해 노출될 수 있으나 정확한 런타임 경로 확인이 필요한 경우.
  - `Internal / migration-sensitive`: 일반 UI는 아니지만 변경 시 호환성, 저장 데이터, 마이그레이션에 영향을 줄 수 있는 경우.
- `Verification needed`: 이 해석을 실제로 확정하거나 반박하려면 필요한 검증.

## App Label / Notifications

### 임시 리브랜딩 상태 — 2026-06-26

- **변경:** `app_name`, `notification_channel_name` 표시 문자열을 `NodeAIgent` 계열로 변경.
- **변경:** 런타임 notification channel 표시명을 `NodeAIgent Service`, `NodeAIgent Alerts`로 변경.
- **변경:** foreground/error notification의 사용자 노출 title/body를 `NodeAIgent`로 변경.
- **변경:** Logs 화면에 보일 수 있는 `Claw Engine` 서비스 로그 라벨을 `NodeAIgent Engine`으로 변경.
- **변경:** split-text/pattern 후속 점검 중 발견한 `BootReceiver.kt`의 boot auto-start 로그도 `Claw Engine`에서 `NodeAIgent Engine`으로 변경.
- **미변경:** `SeekerClawApplication`, `SeekerClawService`, `seekerclaw_service`, `seekerclaw_errors` 같은 Kotlin class/import/channel ID. 사유: 사용자 표시명이 아니라 코드/저장소 식별자이며, 임시 리브랜딩 범위를 벗어난다.
- **미변경:** `SeekerClaw::Service` 같은 wake lock tag. 사유: 일반 앱 UI가 아니라 Android/system diagnostic tag이며, 임시 visual/text 리브랜딩에는 필수 변경이 아니다.

### `app/src/main/res/values/strings.xml`

- line 3: `app_name` = `SeekerClaw`
  - Finding: `app_name`이라는 Android 문자열 리소스.
  - Meaning: Manifest나 UI가 `@string/app_name`을 참조하는 곳에서 쓰이는 앱 표시 이름.
  - Confidence: Manifest 앱 라벨 용도는 Confirmed. 다른 사용처는 참조 위치에 따라 달라짐.
  - Verification needed: `@string/app_name`, `R.string.app_name` 참조를 모두 확인하고, 설치 후 런처와 Android 설정의 앱 이름을 확인.
  - Status: **변경:** 값만 `NodeAIgent`로 변경. 참조 구조와 리소스 이름은 유지.
- line 4: `notification_channel_name` = `SeekerClaw Service`
  - Finding: `notification_channel_name`이라는 Android 문자열 리소스.
  - Meaning: 알림 채널 표시명으로 의도된 값으로 보이나, 현재 런타임 코드는 `"SeekerClaw Service"`를 별도로 하드코딩함.
  - Confidence: Possible exposure.
  - Verification needed: `R.string.notification_channel_name` 참조 여부를 확인하고, 설치 후 Android 알림 설정에서 실제 채널명을 확인.
  - Status: **변경:** 값만 `NodeAIgent Service`로 변경. 참조 구조와 리소스 이름은 유지.

### `app/src/main/AndroidManifest.xml`

- line 38: app icon이 `@mipmap/ic_launcher` 참조
  - Finding: Manifest의 application icon이 `@mipmap/ic_launcher`를 가리킴.
  - Meaning: Android 런처/앱 아이콘의 진입 리소스.
  - Confidence: Confirmed.
  - Verification needed: 앱 설치 후 런처, 앱 정보, 최근 앱, 설치 화면 등에서 아이콘을 확인.
  - Status: **시각 변경:** 연결된 adaptive icon foreground/background 리소스의 실제 표시 내용만 변경. Manifest 참조 경로는 의도적으로 유지.
- line 39: app label이 `@string/app_name` 참조
  - Finding: Manifest의 application label이 `@string/app_name`을 가리킴.
  - Meaning: Android에 보이는 앱 이름이 `app_name` 문자열 리소스에서 나옴.
  - Confidence: Confirmed.
  - Verification needed: 앱 설치 후 런처, 앱 서랍, Android 설정에서 표시명을 확인.
  - Status: **변경:** `@string/app_name` 참조 구조는 유지하고, 해당 문자열 값만 `NodeAIgent`로 변경.

### `app/src/main/java/com/seekerclaw/app/SeekerClawApplication.kt`

- line 150: `"SeekerClaw Service"`
  - Finding: `NotificationChannel` 표시명으로 전달되는 문자열 리터럴.
  - Meaning: 저우선순위 foreground service 알림 채널 이름.
  - Confidence: Confirmed.
  - Verification needed: 새 설치 상태에서 앱을 실행해 채널을 생성한 뒤 Android 알림 채널 설정에서 확인.
  - Status: **변경:** 표시 문자열을 `NodeAIgent Service`로 변경.
- line 162: `"SeekerClaw Alerts"`
  - Finding: `NotificationChannel` 표시명으로 전달되는 문자열 리터럴.
  - Meaning: 고우선순위 경고/오류 알림 채널 이름.
  - Confidence: Confirmed.
  - Verification needed: 새 설치 상태에서 앱을 실행해 채널을 생성한 뒤 Android 알림 채널 설정에서 확인.
  - Status: **변경:** 표시 문자열을 `NodeAIgent Alerts`로 변경.

### `app/src/main/java/com/seekerclaw/app/service/SeekerClawService.kt`

- line 263: `"SeekerClaw is running"`
  - Finding: 서비스 코드 안의 문자열 리터럴.
  - Meaning: foreground service 알림 문구 또는 상태 문구일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: 주변 notification builder 코드를 확인하고 서비스를 실제 실행해 알림 내용을 캡처.
  - Status: **변경:** 사용자 표시 문구를 `NodeAIgent is running`으로 변경.
- line 732: notification title `"SeekerClaw"`
  - Finding: 알림 제목 문자열 리터럴.
  - Meaning: 특정 알림 경로에서 표시되는 제목.
  - Confidence: `setContentTitle`에 직접 전달된다면 Confirmed, 아니라면 알림 문맥 기반 Strong inference.
  - Verification needed: 정확한 builder 호출을 확인하고 해당 알림 경로를 실제 트리거.
  - Status: **변경:** 알림 제목을 `NodeAIgent`로 변경.

### `app/src/main/java/com/seekerclaw/app/receiver/BootReceiver.kt`

- line 35: `"[Boot] Auto-starting Claw Engine..."`
  - Finding: boot receiver가 auto-start 시 LogCollector에 남기는 runtime log 문자열.
  - Meaning: 부팅 후 자동시작 경로에서 Logs 화면에 보일 수 있는 사용자 노출 로그.
  - Confidence: Strong inference.
  - Verification needed: auto-start-on-boot 경로를 실제 기기에서 트리거하고 Logs 화면 확인.
  - Status: **변경:** 로그 문구를 `[Boot] Auto-starting NodeAIgent Engine...`으로 변경.
- line 750: notification title `"SeekerClaw"`
  - Finding: 알림 제목 문자열 리터럴.
  - Meaning: 다른 알림 경로에서 표시되는 제목.
  - Confidence: `setContentTitle`에 직접 전달된다면 Confirmed, 아니라면 알림 문맥 기반 Strong inference.
  - Verification needed: 정확한 builder 호출을 확인하고 해당 알림 경로를 실제 트리거.
  - Status: **변경:** 알림 제목을 `NodeAIgent`로 변경.

## Android UI Text

### 임시 리브랜딩 상태 — 2026-06-26

- **변경:** Setup, Dashboard, Settings, System, Logs, Settings help, Burner Wallet warning surface에서 발견된 직접 UI 문자열과 fallback agent name 값을 `NodeAIgent`로 변경.
- **변경:** Dashboard 좌상단 header logo text를 split styled `Seeker` + `C/aw`에서 `NodeAIgent`로 변경.
- **변경:** `AndroidBridge.kt`의 Android clipboard label을 `SeekerClaw`에서 `NodeAIgent`로 변경. split text는 아니지만 Android clipboard UI에 노출될 수 있다.
- **변경:** 사용자가 볼 수 있는 export/share 파일명 prefix를 `nodeaigent_backup_`, `nodeaigent_skills_`로 변경.
- **변경:** Settings에 보이는 setup-link 문구는 `seekerclaw.xyz`를 직접 노출하지 않고 `[ NodeAIgent link ]`로 변경.
- **변경:** setup symbol의 accessibility content description을 `NodeAIgent`로 변경.
- **미변경:** `https://seekerclaw.xyz/setup`을 여는 `SetupScreen` click target. 사유: 단순 표시 문구가 아니라 실제 동작 URL이며, 이번 임시 패스에서 대체할 NodeAIgent URL이 제공되지 않았다. 대신 Settings에 보이는 문구만 `[ NodeAIgent link ]`로 바꿨다.
- **미변경:** `AgentOS`. 사유: 직접적인 `SeekerClaw` 노출이 아니고 제품/모듈 의미가 애매하다. 바꾸면 임시 리브랜딩 범위를 넘어 UI 의미를 바꿀 수 있다.
- **미변경:** `SeekerClawScaffold`, `SeekerClawSwitch`, `SeekerClawColors` 같은 composable/class name. 사유: 사용자 표시 텍스트가 아니라 code symbol/resource API name이다.
- **미변경:** UI 파일의 code comment. 사유: 개발자 전용 정보이며 이번 임시 사용자 노출 리브랜딩 범위 밖이다.

### `app/src/main/java/com/seekerclaw/app/ui/setup/SetupScreen.kt`

- line 215: 기본 agent name `"SeekerClaw"`
  - Finding: Setup 코드의 기본값/ fallback 문자열.
  - Meaning: 사용자가 agent 이름을 지정하지 않았을 때 쓰이는 기본 agent 이름 후보.
  - Confidence: Strong inference.
  - Verification needed: 주변 상태 초기화 코드를 확인하고, 커스텀 agent 이름 없이 첫 실행 Setup을 테스트.
  - Status: **변경:** 기본 agent name 값을 `NodeAIgent`로 변경.
- line 390: fallback agent name 값 `"SeekerClaw"`
  - Finding: Setup 코드의 fallback 문자열.
  - Meaning: Setup/config 입력이 비어 있거나 누락됐을 때 쓰이는 fallback agent 이름 후보.
  - Confidence: Strong inference.
  - Verification needed: 분기 조건을 확인하고 해당 Setup 상태를 테스트.
  - Status: **변경:** fallback 값을 `NodeAIgent`로 변경.
- line 410: fallback agent name 값 `"SeekerClaw"`
  - Finding: Setup 코드의 fallback 문자열.
  - Meaning: 다른 Setup/config 경로에서 쓰이는 fallback agent 이름 후보.
  - Confidence: Strong inference.
  - Verification needed: 분기 조건을 확인하고 해당 Setup 상태를 테스트.
  - Status: **변경:** fallback 값을 `NodeAIgent`로 변경.
- line 431: fallback agent name 값 `"SeekerClaw"`
  - Finding: Setup 코드의 fallback 문자열.
  - Meaning: 또 다른 Setup/config 경로에서 쓰이는 fallback agent 이름 후보.
  - Confidence: Strong inference.
  - Verification needed: 분기 조건을 확인하고 해당 Setup 상태를 테스트.
  - Status: **변경:** fallback 값을 `NodeAIgent`로 변경.
- line 723: fallback agent name 값 `"SeekerClaw"`
  - Finding: Setup 코드 후반부의 fallback 문자열.
  - Meaning: Setup flow 후반에서 쓰이는 fallback agent 이름 후보.
  - Confidence: Strong inference.
  - Verification needed: 분기 조건을 확인하고 해당 Setup 상태를 테스트.
  - Status: **변경:** fallback 값을 `NodeAIgent`로 변경.
- line 747: `"SeekerClaw runs your AI agent in the background..."`
  - Finding: Setup UI 코드의 제품 설명 문구.
  - Meaning: Setup/onboarding 화면에 보이는 설명 텍스트일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: Setup 화면을 렌더링해 해당 상태에서 실제 텍스트가 보이는지 확인.
  - Status: **변경:** 제품 설명 문구를 `NodeAIgent runs...` 계열로 변경.
- line 834: `R.drawable.ic_seekerclaw_symbol` 참조
  - Finding: Setup 코드가 SeekerClaw symbol drawable을 참조함.
  - Meaning: Setup 화면에 보이는 로고/브랜드 마크일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: Setup 화면을 렌더링해 drawable을 시각 확인.
  - Status: **시각 변경:** resource path/name은 유지하고 실제 vector 내용만 회색 `MAIN/LOGO` placeholder로 변경.
- line 835: contentDescription `"SeekerClaw"`
  - Finding: drawable 참조 근처의 접근성 라벨.
  - Meaning: Setup 로고의 screen reader 라벨일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: 해당 composable 호출을 확인하고 TalkBack 또는 Compose semantics로 테스트.
  - Status: **변경:** 접근성 라벨을 `NodeAIgent`로 변경.
- line 940: `https://seekerclaw.xyz/setup` 열기 동작
  - Finding: Setup 코드에서 여는 URL.
  - Meaning: Setup QR 생성기 또는 Setup 도우미 웹사이트로 보임.
  - Confidence: Strong inference.
  - Verification needed: 클릭 핸들러를 확인하고 실제 액션을 실행.
  - Status: **미변경**. 사유: 실제 동작 URL target이며, 이번 임시 패스에서 대체할 NodeAIgent setup URL이 제공되지 않았다.
- line 1528: `R.drawable.ic_seekerclaw_symbol` 참조
  - Finding: Setup 코드의 또 다른 SeekerClaw symbol drawable 참조.
  - Meaning: 다른 Setup 상태에서도 symbol을 보여줄 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: 해당 Setup 상태를 렌더링해 drawable을 시각 확인.
  - Status: **시각 변경:** resource path/name은 유지하고 실제 vector 내용만 회색 `MAIN/LOGO` placeholder로 변경.
- line 1529: contentDescription `"SeekerClaw"`
  - Finding: 또 다른 drawable 참조 근처의 접근성 라벨.
  - Meaning: 두 번째 Setup 로고 인스턴스의 screen reader 라벨일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: 해당 composable 호출을 확인하고 TalkBack 또는 Compose semantics로 테스트.
  - Status: **변경:** 접근성 라벨을 `NodeAIgent`로 변경.
- line 1685: `https://seekerclaw.xyz/setup` 열기 동작
  - Finding: Setup 코드의 또 다른 URL open 액션.
  - Meaning: QR/setup 웹사이트로 이동하는 다른 Setup 경로.
  - Confidence: Strong inference.
  - Verification needed: 클릭 핸들러를 확인하고 실제 액션을 실행.
  - Status: **미변경**. 사유: 실제 동작 URL target이며, 이번 임시 패스에서 대체할 NodeAIgent setup URL이 제공되지 않았다.

### `app/src/main/java/com/seekerclaw/app/ui/dashboard/DashboardScreen.kt`

- line 132: 기본 agent name `"SeekerClaw"`
  - Finding: Dashboard 코드의 기본값/fallback 문자열.
  - Meaning: 커스텀 이름이 없을 때 Dashboard에 쓰이는 fallback agent 이름 후보.
  - Confidence: Strong inference.
  - Verification needed: configured/custom agent 이름 없이 Dashboard를 실행.
  - Status: **변경:** fallback 값을 `NodeAIgent`로 변경.
- header logo: split styled text `"Seeker"` + `"C/aw"` 노출
  - Finding: Dashboard 좌상단 `AgentOS` 바로 위에 표시되는 브랜드 로고 텍스트.
  - Meaning: 일반 사용자가 앱 진입 후 Dashboard에서 바로 보는 브랜드 노출 지점.
  - Confidence: 코드 확인 기준 Strong inference.
  - Verification needed: Dashboard를 렌더링해 좌상단 헤더를 시각 확인.
  - Status: **변경:** `NodeAIgent`로 변경. 사유: 직접 보이는 브랜드 노출이지만 텍스트가 split/styled 형태라 정확한 `SeekerClaw` 문자열 검색에서 빠졌던 항목이다.
  - 추가 기록: 사용자가 모바일 화면에서 `AgentOS` 위 로고 노출을 지적해 재확인했다. 이 항목은 drawable/image 리소스가 아니라 Compose `Text(buildAnnotatedString { append("Seeker"); append("C/aw") })` 기반의 텍스트 로고였으므로 Logo/Image 태그가 아니라 Android UI Text 태그에서 처리한다.
- line 328: `"AgentOS"`
  - Finding: Dashboard 코드의 UI 텍스트로 보이는 문자열.
  - Meaning: Dashboard 라벨 또는 제품/모듈명 후보. 브랜드 관련성은 해석이 필요함.
  - Confidence: UI 텍스트라는 점은 Strong inference, rebrand 관련성은 Possible exposure.
  - Verification needed: Dashboard를 렌더링해 실제 표시 위치와 문맥을 확인.
  - Status: **미변경**. 사유: 제품/모듈 라벨일 수 있어 의미가 애매하고, 직접적인 `SeekerClaw` 노출이 아니므로 임시 리브랜딩에서는 건드리지 않았다.
- line 658: `"Claw Engine"`
  - Finding: Dashboard 코드의 UI 텍스트로 보이는 문자열.
  - Meaning: 엔진/버전 라벨 후보. 브랜드 관련성은 명명 의도에 따라 달라짐.
  - Confidence: UI 텍스트라는 점은 Strong inference, rebrand 관련성은 Possible exposure.
  - Verification needed: Dashboard를 렌더링해 실제 표시 위치와 문맥을 확인.
  - Status: **변경:** 라벨을 `NodeAIgent Engine`으로 변경.

### `app/src/main/java/com/seekerclaw/app/ui/settings/SettingsScreen.kt`

- line 345: `"valid SeekerClaw backup"`
  - Finding: Settings import/validation 코드의 문자열.
  - Meaning: 잘못된 백업 파일을 가져왔을 때 사용자에게 보이는 검증 메시지일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: 잘못된 백업 import를 트리거해 오류 메시지를 확인.
  - Status: **변경:** 검증 메시지를 `valid NodeAIgent backup` 계열로 변경.
- line 511: 기본 agent name `"SeekerClaw"`
  - Finding: Settings 코드의 기본값/fallback 문자열.
  - Meaning: 커스텀 이름이 없을 때 Settings에 쓰이는 fallback agent 이름 후보.
  - Confidence: Strong inference.
  - Verification needed: configured/custom agent 이름 없이 Settings를 열어 확인.
  - Status: **변경:** fallback 값을 `NodeAIgent`로 변경.
- line 911: export filename prefix `seekerclaw_backup_` 값
  - Finding: 백업 export 파일명 prefix.
  - Meaning: 사용자가 보게 되는 백업 파일명 prefix 후보.
  - Confidence: Strong inference.
  - Verification needed: 백업을 export해 실제 파일명/share target을 확인.
  - Status: **변경:** 파일명 prefix를 `nodeaigent_backup_`로 변경.
- line 953: skills export filename prefix `seekerclaw_skills_` 값
  - Finding: skills export 파일명 prefix.
  - Meaning: 사용자가 보게 되는 skills export 파일명 prefix 후보.
  - Confidence: Strong inference.
  - Verification needed: skills를 export해 실제 파일명/share target을 확인.
  - Status: **변경:** 파일명 prefix를 `nodeaigent_skills_`로 변경.
- line 1028: `"Generate a config QR at seekerclaw.xyz..."`
  - Finding: setup domain을 포함한 Settings/help 문자열.
  - Meaning: QR Setup 안내로 보이는 Settings 문구.
  - Confidence: Strong inference.
  - Verification needed: 관련 Settings 섹션을 렌더링.
  - Status: **변경:** 보이는 setup-link 문구를 `Generate a config QR at [ NodeAIgent link ]...` 계열로 변경.
- line 1054: `InfoRow("Claw Engine", BuildConfig.OPENCLAW_VERSION)`
  - Finding: Settings `InfoRow` 라벨.
  - Meaning: About/version row에 보이는 라벨일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: Settings/About 섹션을 렌더링.
  - Status: **변경:** 라벨을 `NodeAIgent Engine`으로 변경.
- line 1771: permission help path includes `Apps -> SeekerClaw -> Permissions`
  - Finding: 권한 도움말 텍스트에 앱 이름이 포함됨.
  - Meaning: Android 권한 설정 안내로 사용자에게 보일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: 권한 도움말 UI를 표시/트리거.
  - Status: **변경:** 권한 안내 경로를 `Apps -> NodeAIgent -> Permissions` 계열로 변경.

### `app/src/main/java/com/seekerclaw/app/ui/system/SystemScreen.kt`

- line 115: 기본 agent name `"SeekerClaw"`
  - Finding: System screen 코드의 기본값/fallback 문자열.
  - Meaning: System screen fallback agent 이름 후보.
  - Confidence: Strong inference.
  - Verification needed: configured/custom agent 이름 없이 System screen을 열어 확인.
  - Status: **변경:** fallback 값을 `NodeAIgent`로 변경.
- line 176: `InfoRow("Claw Engine", BuildConfig.OPENCLAW_VERSION)`
  - Finding: System screen `InfoRow` 라벨.
  - Meaning: 엔진/버전 row 라벨로 보일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: System screen을 렌더링해 표시 위치와 문맥을 확인.
  - Status: **변경:** 라벨을 `NodeAIgent Engine`으로 변경.

### `app/src/main/java/com/seekerclaw/app/ui/logs/LogsScreen.kt`

- line 168: exported log title `"SeekerClaw Logs"`
  - Finding: 로그 export 제목 문자열.
  - Meaning: export/share된 로그 안에 들어가는 제목 후보.
  - Confidence: Strong inference.
  - Verification needed: 로그를 export해 생성/공유된 내용을 확인.
  - Status: **변경:** 로그 export 제목을 `NodeAIgent Logs`로 변경.
- line 178: share subject `"SeekerClaw Logs"`
  - Finding: share subject 문자열.
  - Meaning: Android share sheet subject 후보.
  - Confidence: Strong inference.
  - Verification needed: 로그 공유 flow를 트리거하고 subject를 지원하는 대상에서 확인.
  - Status: **변경:** share subject를 `NodeAIgent Logs`로 변경.

### `app/src/main/java/com/seekerclaw/app/ui/settings/SettingsHelpTexts.kt`

- line 108: `"help improve SeekerClaw"`
  - Finding: Settings help text 문자열.
  - Meaning: analytics/help 설명으로 보이는 UI 텍스트 후보.
  - Confidence: Strong inference.
  - Verification needed: 이 help text를 사용하는 Settings 섹션을 렌더링.
  - Status: **변경:** help text를 `help improve NodeAIgent` 계열로 변경.

### `app/src/main/java/com/seekerclaw/app/ui/settings/wallet/BurnerWalletScreen.kt`

- line 282: `"SeekerClaw cannot recover this key."`
  - Finding: Wallet 경고 문자열.
  - Meaning: burner wallet/private-key 관련 사용자 경고로 보일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: Burner Wallet 화면을 렌더링해 해당 상태에서 보이는지 확인.
  - Status: **변경:** 경고 문구를 `NodeAIgent cannot recover this key.`로 변경.

### `app/src/main/java/com/seekerclaw/app/ui/settings/wallet/components/DangerZoneSection.kt`

- line 58: `"SeekerClaw cannot recover the key."`
  - Finding: Wallet danger zone 경고 문자열.
  - Meaning: destructive action/key-loss 경고로 보일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: danger zone을 렌더링해 해당 상태에서 보이는지 확인.
  - Status: **변경:** 경고 문구를 `NodeAIgent cannot recover the key.`로 변경.
- line 80: `"SeekerClaw cannot recover this key."`
  - Finding: Wallet danger zone 경고 문자열.
  - Meaning: 또 다른 destructive action/key-loss 경고로 보일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: danger zone을 렌더링해 해당 상태에서 보이는지 확인.
  - Status: **변경:** 경고 문구를 `NodeAIgent cannot recover this key.`로 변경.

### `app/src/main/java/com/seekerclaw/app/bridge/AndroidBridge.kt`

- line 484: `ClipData.newPlainText("SeekerClaw", content)`
  - Finding: agent bridge가 clipboard 내용을 쓸 때 사용하는 Android clipboard label 문자열.
  - Meaning: Android clipboard UI/toast/preview에서 이 label이 사용자에게 노출될 수 있음.
  - Confidence: Strong inference.
  - Verification needed: trigger clipboard write tool and observe Android clipboard overlay/history UI.
  - Status: **변경:** `NodeAIgent`로 변경. 사유: split-text logo pattern은 아니지만 Android clipboard UI에 노출될 수 있는 사용자 노출 surface다.

## Logo / Icon Images

### 임시 리브랜딩 상태 — 2026-06-26

- **변경:** 주요 logo/icon resource의 실제 표시 내용을 역할 식별용 회색 placeholder vector로 변경: `MAIN LOGO`, `MAIN/LOGO`, `APP`, `CHAN`, `N`.
- **변경:** placeholder 식별성을 높이기 위해 adaptive launcher/channel background color를 `#D1D5DB` 회색으로 변경. 이전 `#E5E7EB`는 모바일 launcher surface에서 흰색에 가깝게 보였다.
- **변경:** launcher label은 초기 긴 placeholder 의도였던 `APP ICON` 대신 `APP`로 단축. 사유: adaptive icon masking/scaling 때문에 긴 pixel text가 잘려 `PP ICO`처럼 부분 텍스트로 보일 수 있다.
- **미변경:** `ic_seekerclaw_symbol.xml`, `ic_seekerclaw_logo_horizontal.xml`, `ic_launcher_foreground.xml`, `ic_channel_foreground.xml`, `ic_notification.xml` 같은 image resource path/name. 사유: 임시 리브랜딩에서 resource identifier/reference churn은 피한다.
- **미변경:** 아래 legacy density bitmap launcher/channel asset. 사유: app `minSdk`가 Android 14이고, 지원 target에서는 manifest path가 adaptive icon XML로 해석된다. 이번 임시 패스에서는 이 bitmap fallback을 lower-priority/generated 또는 legacy surface로 취급했다. 최종 release 전 target device에서 육안 확인 필요.
- **미변경:** 설명용/non-brand screenshot 또는 docs image. 사유: 사용자는 logo/대표 image replacement만 요청했고, 설명 이미지는 범위에서 제외했다.

### 직접 SeekerClaw logo resource

- `app/src/main/res/drawable/ic_seekerclaw_symbol.xml`
  - Finding: SeekerClaw 브랜드명이 들어간 파일명의 drawable 리소스.
  - Meaning: 파일명과 참조 위치상 Setup UI에 쓰이는 SeekerClaw 심볼/브랜드 마크일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: 벡터를 렌더링/열람하고 `R.drawable.ic_seekerclaw_symbol` 참조를 모두 확인해 실제 시각 내용과 표시 화면을 검증.
  - Status: **시각 변경:** 회색 `MAIN/LOGO` placeholder로 변경. filename/path는 의도적으로 유지.
  - 추가 기록: 이 리소스는 첫 Setup/Welcome 화면과 Setup success 화면에서 쓰인다. Dashboard 좌상단 `AgentOS` 위 로고는 이 drawable이 아니라 Compose text logo였으므로 별도로 `DashboardScreen.kt`에서 수정했다.
- `app/src/main/res/drawable/ic_seekerclaw_logo_horizontal.xml`
  - Finding: SeekerClaw 가로형 로고로 보이는 파일명의 drawable 리소스.
  - Meaning: 가로형 로고 후보 자산. 실제로 읽을 수 있는 텍스트가 있는지, 그래픽 path만 있는지는 시각 확인 필요.
  - Confidence: Possible exposure.
  - Verification needed: 벡터를 렌더링/열람해 실제 SeekerClaw 텍스트가 보이는지 확인하고, 이 drawable의 실제 참조 위치를 검색.
  - Status: **시각 변경:** 회색 `MAIN LOGO` placeholder로 변경. filename/path는 의도적으로 유지.

### Launcher icon resources

- `app/src/main/res/drawable/ic_launcher_foreground.xml`
- `app/src/main/res/drawable/ic_launcher_background.xml`
- `app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
- `app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`
- `app/src/main/res/mipmap-hdpi/ic_launcher.webp`
- `app/src/main/res/mipmap-hdpi/ic_launcher_round.webp`
- `app/src/main/res/mipmap-mdpi/ic_launcher.webp`
- `app/src/main/res/mipmap-mdpi/ic_launcher_round.webp`
- `app/src/main/res/mipmap-xhdpi/ic_launcher.webp`
- `app/src/main/res/mipmap-xhdpi/ic_launcher_round.webp`
- `app/src/main/res/mipmap-xxhdpi/ic_launcher.webp`
- `app/src/main/res/mipmap-xxhdpi/ic_launcher_round.webp`
- `app/src/main/res/mipmap-xxxhdpi/ic_launcher.webp`
- `app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.webp`
  - Finding: adaptive launcher icon XML과 해상도별 launcher bitmap 리소스.
  - Meaning: 앱 런처 아이콘과 round icon의 시각 자산 후보.
  - Confidence: Manifest가 launcher 리소스를 가리킨다는 점은 Confirmed. 실제 브랜드 시각 내용은 별도 확인 필요.
  - Verification needed: 각 adaptive icon/bitmap을 렌더링하거나 앱을 설치해 타깃 기기에서 런처/앱 정보 아이콘을 확인.
  - Status: **부분 변경.** `ic_launcher_foreground.xml`은 짧은 회색 `APP` placeholder로 바꾸고 adaptive background color는 `#D1D5DB`로 변경. Density bitmap fallback은 Android 14+ target path에서 쓰이지 않을 것으로 판단해 **미변경**. 최종 release 전 실제 기기 확인 필요.
  - 추가 기록: 초기의 더 긴 placeholder 문구는 Android adaptive icon masking에서 시각적으로 잘릴 수 있어 피했다.

### Notification/channel icon resources

- `app/src/main/res/drawable/ic_notification.xml`
- `app/src/main/res/drawable/ic_channel_foreground.xml`
- `app/src/main/res/mipmap-anydpi-v26/ic_channel.xml`
- `app/src/main/res/mipmap-xhdpi/ic_channel.png`
- `app/src/main/res/values/ic_channel_background.xml`
- `app/src/main/res/values/ic_launcher_background.xml`
  - Finding: 알림/채널 관련으로 보이는 아이콘 및 색상 리소스.
  - Meaning: 알림 또는 채널 아이콘 후보 자산. 실제 표시 여부는 참조 위치와 Android 렌더링 규칙에 따라 달라짐.
  - Confidence: Possible exposure.
  - Verification needed: 리소스 참조를 검색하고, 알림을 실제 발생시킨 뒤 알림 shade/status bar/channel UI와 이미지 내용을 시각 확인.
  - Status: **부분 변경.** `ic_notification.xml`은 `N`, `ic_channel_foreground.xml`은 `CHAN`으로 변경하고 adaptive background color는 `#D1D5DB`로 변경. Density bitmap channel fallback은 같은 Android 14+ adaptive-icon 이유로 **미변경**.

## Agent / Telegram / Discord User-Visible Surfaces

Android UI는 아니지만 실제 Telegram/Discord 사용 중 사용자에게 보일 수 있는 surface다.

### 임시 리브랜딩 상태 — 2026-06-26

- **변경:** `ai.js`의 identity/product/system-prompt text가 `NodeAIgent`를 말하도록 변경.
- **변경:** `ai.js`의 공식 링크 text는 실제 SeekerClaw website/social/repo link 대신 `[ NodeAIgent link ]`를 사용하도록 변경.
- **변경:** `message-handler.js`에서 chat에 보일 수 있는 `/version`, provider-restart fallback, known-model warning 문자열을 `NodeAIgent`로 변경.
- **변경:** `TEMPLATES.md`의 user-message template 문자열을 `NodeAIgent`와 `[ NodeAIgent link ]`로 변경.
- **변경:** `DIAGNOSTICS.md`에서 사용자에게 인용될 수 있는 troubleshooting 문자열을 `NodeAIgent`로 변경.
- **미변경:** `OpenClaw gateway` reference. 사유: OpenClaw는 임시 교체 대상인 SeekerClaw 앱 브랜드가 아니라 upstream/architecture 이름이다.
- **미변경:** `seekerclaw.db`. 사유: 내부 database filename이며, 변경하면 임시 UI/답변 리브랜딩이 아니라 storage/migration 작업이 된다.
- **미변경:** JS code comment와 `SeekerClawService`, `app/src/main/java/com/seekerclaw/**` 같은 diagnostics reference. 사유: 사용자에게 보이는 product copy가 아니라 code symbol/internal path다.
- **미변경:** diagnostic snippet 안의 `seekerclaw-diag` user-agent 예시. 사유: 일반 사용자 답변 문구가 아니라 low-level diagnostic request header 예시이며, 바꾸려면 External Service/Header Exposure 범위에서 다루는 것이 맞다.

### `app/src/main/assets/nodejs-project/ai.js`

- line 642: `"You are a personal AI agent running inside SeekerClaw on Android."`
  - Finding: system prompt의 identity 텍스트.
  - Meaning: agent가 자신을 SeekerClaw on Android 안에서 실행된다고 설명하도록 가르치는 문구.
  - Confidence: prompt 내용 자체는 Confirmed, 사용자 답변 노출은 Possible exposure.
  - Verification needed: agent에게 identity/runtime을 질문하고 생성 답변을 확인.
  - Status: **변경:** identity 문구를 `NodeAIgent`로 변경.
- line 643: describes SeekerClaw as a 24/7 always-on AI agent
  - Finding: system prompt의 제품 설명 문구.
  - Meaning: agent가 사용자에게 반복할 수 있는 자기 설명.
  - Confidence: Possible exposure.
  - Verification needed: 관련 자기소개 질문을 던져 응답을 확인.
  - Status: **변경:** 제품 설명 문구를 `NodeAIgent`로 변경.
- line 644: OpenClaw gateway 언급
  - Finding: system prompt의 architecture 텍스트.
  - Meaning: agent의 구현/구조 self-knowledge.
  - Confidence: Possible exposure.
  - Verification needed: architecture/runtime 관련 질문을 던져 응답을 확인.
  - Status: **미변경**. 사유: OpenClaw는 upstream architecture identity이며, 이번에 임시 교체하려는 앱 brand/logo가 아니다.
- line 645: official channels include `seekerclaw.xyz`, `@SeekerClaw`, `t.me/seekerclaw`, GitHub repo
  - Finding: system prompt의 공식 채널/소셜 링크 텍스트.
  - Meaning: 사용자가 공식 사이트/소셜을 물을 때 agent가 제공할 수 있는 링크/핸들.
  - Confidence: Possible exposure.
  - Verification needed: 공식 사이트/소셜을 질문하고 응답을 확인.
  - Status: **변경:** 공식 링크/핸들 표시를 `[ NodeAIgent link ]`로 변경.
- line 937: `seekerclaw.db`
  - Finding: prompt/data context 안의 내부 DB 파일명.
  - Meaning: agent가 memory/search 설명 중 내부 SQL.js DB 파일명을 언급할 수 있음.
  - Confidence: Possible exposure. 이름을 바꾼다면 Internal / migration-sensitive.
  - Verification needed: memory storage/search를 질문하고 응답을 확인.
  - Status: **미변경**. 사유: 내부 DB filename이자 migration-sensitive storage identity다.
- line 1041: suggests disabling battery optimization for SeekerClaw
  - Finding: system prompt의 troubleshooting 안내.
  - Meaning: agent가 백그라운드 안정성 문제에서 SeekerClaw 배터리 최적화 해제를 안내할 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: background reliability/battery troubleshooting을 질문.
  - Status: **변경:** troubleshooting 안내의 앱 이름을 `NodeAIgent`로 변경.
- line 1154: `SeekerClaw sends you periodic heartbeat polls...`
  - Finding: system prompt의 heartbeat 동작 설명.
  - Meaning: agent가 heartbeat/status polling을 설명할 때 SeekerClaw 이름을 쓸 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: heartbeat/status polling을 질문하고 응답 확인.
  - Status: **변경:** heartbeat 설명의 앱 이름을 `NodeAIgent`로 변경.
- line 1218: silent-reply behavior says SeekerClaw will discard it
  - Finding: system prompt의 silent-reply 동작 설명.
  - Meaning: agent가 silent response를 설명할 때 SeekerClaw 이름을 언급할 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: silent reply/no-response behavior를 질문.
  - Status: **변경:** silent-reply 설명의 앱 이름을 `NodeAIgent`로 변경.
- line 1369: user-initiated Stop 설명에서 SeekerClaw 언급
  - Finding: system prompt의 Stop 동작 설명.
  - Meaning: agent가 Stop/cancellation을 설명할 때 SeekerClaw 이름을 언급할 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: Stop 동작을 질문하거나 Stop flow를 트리거.
  - Status: **변경:** Stop 설명의 앱 이름을 `NodeAIgent`로 변경.

### `app/src/main/assets/nodejs-project/message-handler.js`

- line 225: command response가 `**SeekerClaw**`로 시작
  - Finding: command response 문자열.
  - Meaning: Telegram/Discord slash command 응답 header로 보일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: 해당 command를 트리거해 chat output을 확인.
  - Status: **변경:** command response header를 `**NodeAIgent**`로 변경.
- line 901: restart failure asks user to restart SeekerClaw app
  - Finding: chat-facing 실패/복구 문자열.
  - Meaning: provider switch/restart automation 실패 시 사용자에게 보일 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: 해당 error branch를 트리거하거나 unit-test.
  - Status: **변경:** 복구 안내의 앱 이름을 `NodeAIgent app`으로 변경.
- line 1359: known model list 문구에서 SeekerClaw 언급
  - Finding: model warning/help 문자열.
  - Meaning: SeekerClaw registry 밖의 model을 선택할 때 사용자에게 보일 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: model selection warning 경로를 트리거.
  - Status: **변경:** known model list 안내의 앱 이름을 `NodeAIgent` 계열로 변경.

### `app/src/main/assets/nodejs-project/TEMPLATES.md`

- line 1: `SeekerClaw Message Templates`
  - Finding: template/document title.
  - Meaning: 그 자체가 반드시 user-visible은 아니며, 파일이 로드된다면 message template 또는 참조 텍스트에 영향을 줄 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: 이 파일이 runtime에 로드되는지, title이 실제 surface에 나가는지 확인.
  - Status: **변경:** title을 `NodeAIgent Message Templates`로 변경.
- line 207: `SeekerClaw web setup tool`
  - Finding: setup tool을 언급하는 template 텍스트.
  - Meaning: 사용자에게 보내지는 setup/help template 문구 후보.
  - Confidence: Possible exposure.
  - Verification needed: template loading/call site를 추적하고 관련 message path를 트리거.
  - Status: **변경:** setup tool 안내를 `NodeAIgent web setup tool at [ NodeAIgent link ]` 계열로 변경.
- line 231: `SeekerClaw - Your companion is awake`
  - Finding: foreground-service 스타일 message template 텍스트. 원본 파일에는 separator가 인코딩 손상처럼 보였음.
  - Meaning: 사용자에게 나갈 수 있는 message template 후보이나, runtime 사용 여부 확인 필요.
  - Confidence: Possible exposure.
  - Verification needed: template loading/call site를 추적하고 관련 notification/message path를 트리거.
  - Status: **변경:** 같은 의미의 template 문구를 `NodeAIgent - Your companion is awake` 계열로 변경.

### `app/src/main/assets/nodejs-project/DIAGNOSTICS.md`

사용자에게 인용될 수 있는 troubleshooting text는 아래와 같다:

- line 1: title `SeekerClaw Agent Troubleshooting Guide`
  - Finding: diagnostic document title.
  - Meaning: 그 자체가 직접 UI는 아니며, agent나 support flow가 인용/요약할 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: `DIAGNOSTICS.md`가 어떻게 로드되는지, title 텍스트가 실제 surface에 나가는지 확인.
  - Status: **변경:** title을 `NodeAIgent Agent Troubleshooting Guide`로 변경.
- line 62: update token in SeekerClaw Settings
  - Finding: diagnostic instruction 텍스트.
  - Meaning: 사용자에게 나갈 수 있는 troubleshooting 안내.
  - Confidence: Possible exposure.
  - Verification needed: 관련 diagnostic response를 트리거하거나 retrieval/loading path를 확인.
  - Status: **변경:** Settings 안내의 앱 이름을 `NodeAIgent`로 변경.
- line 63: restart SeekerClaw
  - Finding: diagnostic instruction 텍스트.
  - Meaning: 사용자에게 나갈 수 있는 troubleshooting 안내.
  - Confidence: Possible exposure.
  - Verification needed: 관련 diagnostic response를 트리거하거나 retrieval/loading path를 확인.
  - Status: **변경:** restart 안내의 앱 이름을 `NodeAIgent`로 변경.
- line 240: clear space in SeekerClaw app
  - Finding: diagnostic instruction 텍스트.
  - Meaning: 사용자에게 나갈 수 있는 storage troubleshooting 안내.
  - Confidence: Possible exposure.
  - Verification needed: 관련 diagnostic response를 트리거하거나 retrieval/loading path를 확인.
  - Status: **변경:** storage troubleshooting 안내의 앱 이름을 `NodeAIgent app`으로 변경.
- line 297: open SeekerClaw app to restart bridge
  - Finding: diagnostic instruction 텍스트.
  - Meaning: 사용자에게 나갈 수 있는 Android bridge recovery 안내.
  - Confidence: Possible exposure.
  - Verification needed: bridge-down diagnostic response를 트리거하거나 retrieval/loading path를 확인.
  - Status: **변경:** bridge recovery 안내의 앱 이름을 `NodeAIgent app`으로 변경.
- line 478: reopen SeekerClaw app
  - Finding: diagnostic instruction 텍스트.
  - Meaning: 사용자에게 나갈 수 있는 stale-state recovery 안내.
  - Confidence: Possible exposure.
  - Verification needed: 관련 diagnostic response를 트리거하거나 retrieval/loading path를 확인.
  - Status: **변경:** stale-state recovery 안내의 앱 이름을 `NodeAIgent app`으로 변경.
- line 621: open Dashboard in SeekerClaw
  - Finding: diagnostic instruction 텍스트.
  - Meaning: 사용자에게 나갈 수 있는 health/status troubleshooting 안내.
  - Confidence: Possible exposure.
  - Verification needed: 관련 diagnostic response를 트리거하거나 retrieval/loading path를 확인.
  - Status: **변경:** Dashboard 안내의 앱 이름을 `NodeAIgent`로 변경.
- line 686: open SeekerClaw Settings -> Burner Wallet
  - Finding: diagnostic instruction 텍스트.
  - Meaning: 사용자에게 나갈 수 있는 burner wallet setup 안내.
  - Confidence: Possible exposure.
  - Verification needed: 관련 diagnostic response를 트리거하거나 retrieval/loading path를 확인.
  - Status: **변경:** Burner Wallet setup 안내 경로를 `NodeAIgent -> Settings -> Burner Wallet` 계열로 변경.

## OAuth / Browser-Visible Text

### `app/src/main/java/com/seekerclaw/app/oauth/OpenAIOAuthActivity.kt`

- line 312: `"Return to SeekerClaw to retry or cancel the sign-in."` 원문 문자열
  - Finding: OAuth/browser-facing 문자열.
  - Meaning: OAuth 오류/재시도 안내 문구 후보.
  - Confidence: Strong inference.
  - Verification needed: 해당 OAuth 분기를 트리거하거나 주변 response builder를 확인.
- line 325: `"A newer sign-in attempt is active. Return to SeekerClaw."` 원문 문자열
  - Finding: OAuth/browser-facing 문자열.
  - Meaning: stale session 안내 문구 후보.
  - Confidence: Strong inference.
  - Verification needed: 중복 OAuth 시도를 트리거하거나 주변 response builder를 확인.
- line 335: `"Already processing ... return to SeekerClaw..."` 원문 문자열
  - Finding: OAuth/browser-facing 문자열.
  - Meaning: OAuth 처리 중 상태 안내 문구 후보.
  - Confidence: Strong inference.
  - Verification needed: duplicate callback/processing 경로를 트리거.
- line 438: `"You can close this tab and return to SeekerClaw."` 원문 문자열
  - Finding: OAuth/browser-facing 완료 문자열.
  - Meaning: OAuth 성공 완료 페이지 문구 후보.
  - Confidence: Strong inference.
  - Verification needed: OAuth flow를 완료하고 browser page를 확인.
- line 459: HTML title `SeekerClaw - ...` 원문
  - Finding: HTML title 문자열.
  - Meaning: OAuth 결과 페이지의 browser tab/page title 후보.
  - Confidence: Strong inference.
  - Verification needed: OAuth HTML page를 성공/오류 상태별로 렌더링.
- line 543: SeekerClaw로 돌아가라는 HTML hint 문구
  - Finding: OAuth HTML hint 텍스트.
  - Meaning: browser에 보이는 hint 문구 후보.
  - Confidence: Strong inference.
  - Verification needed: 해당 OAuth HTML page/state를 렌더링.
- line 596: `"Complete sign-in in your browser, then return to SeekerClaw."` 원문 문자열
  - Finding: OAuth sign-in 안내 문자열.
  - Meaning: in-app/browser 사용자 안내 문구 후보.
  - Confidence: Strong inference.
  - Verification needed: OAuth flow를 시작하고 표시되는 안내를 확인.

## QR / Connection / External App Identity

### `app/src/main/java/com/seekerclaw/app/qr/ScannerOverlay.kt`

- line 268: 보이는 text `seekerclaw.xyz/setup`
  - Finding: setup domain이 포함된 scanner overlay 문자열.
  - Meaning: QR/setup 안내로 보이는 UI 텍스트 후보.
  - Confidence: Strong inference.
  - Verification needed: scanner overlay를 렌더링.

### `app/src/main/java/com/seekerclaw/app/config/ConfigClaimImporter.kt`

- line 36: QR error message가 `seekerclaw://config`, `seekerclaw://claim`을 언급
  - Finding: deep-link scheme을 언급하는 error/help 텍스트.
  - Meaning: QR/claim 오류 시 사용자에게 보일 수 있는 문구이면서, 실제 deep-link scheme 이름을 드러냄.
  - Confidence: error text는 Strong inference, scheme 이름은 Internal / migration-sensitive.
  - Verification needed: 잘못된 QR/claim import를 트리거해 메시지를 확인하고, manifest intent filter의 scheme 처리를 확인.
- line 158: 기본값 `"SeekerClaw"`
  - Finding: Config claim importer의 기본값 문자열.
  - Meaning: import된 설정에서 agent 이름이 없을 때 쓰이는 기본값 후보.
  - Confidence: Strong inference.
  - Verification needed: field assignment를 확인하고 agent 이름 없는 config를 import.
- line 159: fallback 값 `"SeekerClaw"`
  - Finding: Config claim importer의 fallback 문자열.
  - Meaning: 제공된 agent 이름이 blank일 때 쓰이는 fallback 후보.
  - Confidence: Strong inference.
  - Verification needed: blank agent 이름이 들어간 config를 import.
- line 366: User-Agent `"SeekerClaw/Android"`
  - Finding: HTTP User-Agent 리터럴.
  - Meaning: claim/config 서버로 보내는 request identity.
  - Confidence: request header로 직접 전달된다면 Confirmed, 아니면 header 이름 기반 Strong inference.
  - Verification needed: 정확한 request 코드를 확인하거나 request header를 캡처.

### `app/src/main/java/com/seekerclaw/app/solana/SolanaWalletManager.kt`

- line 16: wallet identity URI `https://seekerclaw.xyz`
  - Finding: Solana wallet identity URI.
  - Meaning: Mobile Wallet Adapter identity URI 후보.
  - Confidence: Strong inference.
  - Verification needed: wallet을 연결하고 wallet approval prompt/log를 확인.
- line 18: wallet identity name `"SeekerClaw"`
  - Finding: Solana wallet identity name.
  - Meaning: wallet 연결/승인 prompt에 표시되는 앱 이름 후보.
  - Confidence: Strong inference.
  - Verification needed: wallet을 연결하고 wallet approval prompt를 확인.

## Agent Tool / Skill Text

### `app/src/main/assets/nodejs-project/solana.js`

- line 463: `Connect a wallet in SeekerClaw Settings > Solana Wallet.`
  - Finding: Solana error/help 문자열.
  - Meaning: wallet-dependent Solana action을 wallet 연결 없이 실행할 때 반환될 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: wallet 미연결 상태에서 wallet-dependent tool을 트리거.

### `app/src/main/assets/nodejs-project/tools/solana.js`

- line 68: tool description이 `SeekerClaw app`을 언급
  - Finding: tool description 텍스트.
  - Meaning: agent에게 제공되는 tool metadata이며, 사용자 설명 방식에 영향을 줄 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: agent에게 wallet address access를 질문하고 model에 제공되는 tool schema를 확인.
- line 265: error 문자열이 `SeekerClaw app Settings`를 언급
  - Finding: tool error 문자열.
  - Meaning: wallet이 연결되지 않았을 때 사용자에게 보이는 error일 가능성이 높음.
  - Confidence: Strong inference.
  - Verification needed: 해당 error branch를 트리거.
- lines 862, 1127, 1210, 1354, 1617, 1712, 1850, 1933, 2022, 2087: guide string이 SeekerClaw Settings를 언급
  - Finding: 여러 Solana/Jupiter/Helius guide 문자열.
  - Meaning: 필요한 API key/settings에 대한 사용자-facing setup guide 후보.
  - Confidence: Possible exposure.
  - Verification needed: 각 guide branch를 트리거하거나 guide가 반환되는 조건을 tests/call site로 확인.

### `app/src/main/assets/nodejs-project/tools/memory.js`

- line 80: tool description이 `seekerclaw.db`를 언급
  - Finding: 내부 DB 파일명을 언급하는 tool description.
  - Meaning: agent-facing metadata이며, agent가 memory search를 설명할 때 반복할 수 있음.
  - Confidence: Possible exposure. 이름을 바꾼다면 Internal / migration-sensitive.
  - Verification needed: model에 제공되는 tool schema를 확인하고 memory-search 설명 질문을 던짐.

### `app/src/main/assets/nodejs-project/workspace/skills/solana-wallet.md`

- line 15: `SeekerClaw app`
  - Finding: workspace skill instruction 텍스트.
  - Meaning: agent가 이 skill을 읽고 wallet 기능 답변에 해당 표현을 사용할 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: skill loading을 확인하고 wallet 관련 질문으로 skill trigger를 확인.
- line 183: `Open the SeekerClaw app > Settings > Solana Wallet...`
  - Finding: workspace skill guidance 텍스트.
  - Meaning: agent response를 통해 사용자에게 전달될 수 있는 안내.
  - Confidence: Possible exposure.
  - Verification needed: skill loading을 확인하고 관련 wallet setup 답변을 트리거.

### `app/src/main/assets/nodejs-project/workspace/skills/solana-dapp.md`

- line 13: `Solana Seeker dApp`
  - Finding: Solana Seeker ecosystem에 관한 workspace skill 텍스트.
  - Meaning: agent response 문구가 될 수 있으나 SeekerClaw 앱 브랜딩 자체는 아닐 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: skill trigger/load path를 확인하고 관련 dApp 질문을 던짐.
- line 15: `Solana Seeker device`
  - Finding: device 관련 workspace skill 텍스트.
  - Meaning: agent response 문구가 될 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: skill trigger/load path를 확인하고 관련 device 질문을 던짐.
- line 40: `The Solana Seeker runs...`
  - Finding: device capability 관련 workspace skill 텍스트.
  - Meaning: agent response 문구가 될 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: skill trigger/load path를 확인하고 관련 device 질문을 던짐.
- line 203: `The Solana Seeker is purpose-built...`
  - Finding: device positioning 관련 workspace skill 텍스트.
  - Meaning: agent response 문구가 될 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: skill trigger/load path를 확인하고 관련 device 질문을 던짐.
- line 208: `Ideal for running SeekerClaw 24/7`
  - Finding: SeekerClaw를 명시적으로 언급하는 workspace skill 텍스트.
  - Meaning: SeekerClaw를 24/7 use case와 연결하는 agent response 문구가 될 수 있음.
  - Confidence: Possible exposure.
  - Verification needed: skill trigger/load path를 확인하고 관련 Seeker device/use-case 질문을 던짐.

### `app/src/main/assets/default-skills/burner-wallet/SKILL.md`

- line 15: `lives inside SeekerClaw`
  - Finding: bundled skill 텍스트.
  - Meaning: burner wallet architecture를 설명할 때 agent가 사용할 수 있는 문구.
  - Confidence: Possible exposure.
  - Verification needed: bundled skill seeding/loading을 확인하고 burner-wallet 설명 질문을 던짐.

## External Service / Header Exposure

이 항목들은 UI는 아니지만 third-party service에 보일 수 있다.

### `app/src/main/assets/nodejs-project/config.js`

- line 456: User-Agent `SeekerClaw/1.0 (Android; +https://seekerclaw.com)`
  - Finding: HTTP User-Agent 값.
  - Meaning: 일부 web/API call에서 외부로 나가는 request identity.
  - Confidence: Strong inference.
  - Verification needed: call site를 확인하고 outgoing request header를 캡처.

### `app/src/main/assets/nodejs-project/discord.js`

- line 113: Discord identify properties가 `seekerclaw` 사용
  - Finding: Discord gateway identify metadata.
  - Meaning: 일반 사용자 UI가 아니라 Discord infrastructure로 전송되는 metadata.
  - Confidence: Strong inference.
  - Verification needed: Discord identify payload를 확인하거나 test에서 gateway frame을 캡처.
- line 279: User-Agent `SeekerClaw (https://seekerclaw.xyz, 1.0)`
  - Finding: Discord request용 HTTP User-Agent.
  - Meaning: Discord/server log에서 볼 수 있는 외부 request identity.
  - Confidence: Strong inference.
  - Verification needed: outgoing request header를 캡처.
- line 438: multipart boundary가 `----SeekerClaw`로 시작
  - Finding: multipart boundary 문자열.
  - Meaning: raw HTTP body boundary이며, low-level traffic/log에서만 보일 수 있음.
  - Confidence: Strong inference.
  - Verification needed: multipart upload를 트리거하고 raw request를 확인.

### `app/src/main/assets/nodejs-project/telegram.js`

- line 342: User-Agent `SeekerClaw/1.0`
  - Finding: Telegram request용 HTTP User-Agent.
  - Meaning: Telegram/server log에서 볼 수 있는 외부 request identity.
  - Confidence: Strong inference.
  - Verification needed: outgoing request header를 캡처.

### `app/src/main/assets/nodejs-project/web.js`

- line 138: HTTP referer `https://seekerclaw.com`
  - Finding: HTTP Referer header.
  - Meaning: web request에 붙는 외부 attribution/origin header.
  - Confidence: Strong inference.
  - Verification needed: web fetch/search의 outgoing request header를 캡처.
- line 139: X-Title `SeekerClaw Web Search`
  - Finding: HTTP title/metadata header.
  - Meaning: 이를 사용하는 서비스에 전달되는 외부 attribution/title header.
  - Confidence: Strong inference.
  - Verification needed: web fetch/search의 outgoing request header를 캡처.

### `app/src/main/assets/nodejs-project/providers/openrouter.js`

- line 400: HTTP referer `https://seekerclaw.com`
  - Finding: OpenRouter HTTP Referer header.
  - Meaning: OpenRouter attribution header.
  - Confidence: Strong inference.
  - Verification needed: OpenRouter request header를 캡처.
- line 401: X-Title `SeekerClaw`
  - Finding: OpenRouter title header.
  - Meaning: OpenRouter attribution title.
  - Confidence: Strong inference.
  - Verification needed: OpenRouter request header를 캡처.

### `app/src/main/java/com/seekerclaw/app/ui/settings/ProviderConfigScreen.kt`

- line 1157: HTTP referer `https://seekerclaw.com`
  - Finding: provider configuration/test request의 Referer header.
  - Meaning: provider test/config call용 외부 attribution header.
  - Confidence: Strong inference.
  - Verification needed: provider test/config request를 트리거하고 header를 캡처.
- line 1158: X-Title `SeekerClaw`
  - Finding: provider configuration/test request의 title header.
  - Meaning: provider test/config call용 외부 attribution title.
  - Confidence: Strong inference.
  - Verification needed: provider test/config request를 트리거하고 header를 캡처.

### `app/src/main/java/com/seekerclaw/app/ui/settings/ChannelConfigScreen.kt`

- line 415: User-Agent `SeekerClaw (https://seekerclaw.xyz, 1.0)`
  - Finding: channel configuration/test request User-Agent.
  - Meaning: channel config/test call용 외부 request identity.
  - Confidence: Strong inference.
  - Verification needed: channel config/test request를 트리거하고 header를 캡처.

### `app/src/main/assets/nodejs-project/tools/agent_pay.js`

- line 441: User-Agent `SeekerClaw-agent_pay/1.0`
  - Finding: `agent_pay`용 HTTP User-Agent.
  - Meaning: autonomous x402 payment request용 외부 request identity.
  - Confidence: Strong inference.
  - Verification needed: 안전한 test request를 트리거하고 header를 캡처.

### `app/src/main/assets/nodejs-project/mcp-client.js`

- line 367: MCP clientInfo name `SeekerClaw`
  - Finding: MCP initialization client name.
  - Meaning: remote MCP server로 전송되는 client identity.
  - Confidence: Strong inference.
  - Verification needed: test MCP server에 연결하고 initialize payload를 확인.

## Ambiguous / Decide Later

아래 항목은 full rebrand에서는 중요할 수 있지만, 단순한 visible UI text는 아니다:

- `com.seekerclaw.app`: Android application ID/package namespace.
  - Finding: Android package/application identity.
  - Meaning: Android와 store가 설치 앱을 식별하는 identity.
  - Confidence: Internal / migration-sensitive.
  - Verification needed: rename 전에 Gradle `applicationId`, namespace, manifest package behavior, update path, store requirements를 확인.
- `seekerclaw://`: deep-link/config scheme.
  - Finding: 앱 deep-link scheme.
  - Meaning: QR/config/claim flow에서 쓰이는 link identity.
  - Confidence: Internal / migration-sensitive. link/error에서는 사용자 노출도 가능.
  - Verification needed: manifest intent filter, QR generator payload, 기존 link 호환성을 확인.
- `seekerclaw_prefs`: SharedPreferences name.
  - Finding: 내부 preferences storage name.
  - Meaning: 앱 설정 저장소 identity.
  - Confidence: Internal / migration-sensitive.
  - Verification needed: rename 전에 preference 생성/마이그레이션 코드를 확인.
- `seekerclaw.db`: internal database filename, sometimes shown in tool descriptions.
  - Finding: 내부 SQL.js database filename.
  - Meaning: memory/analytics DB identity이며, tool description을 통해 노출될 수도 있음.
  - Confidence: Internal / migration-sensitive plus possible exposure through agent text.
  - Verification needed: rename 전에 database open/migration 코드와 agent-facing reference를 확인.
- `seekerclaw_config_key`: Android Keystore alias.
  - Finding: encryption key alias.
  - Meaning: encrypted config용 key identity.
  - Confidence: Internal / migration-sensitive.
  - Verification needed: rename 전에 Keystore migration 전략을 확인하고 기존 encrypted config가 유지되는지 테스트.
- `seekerclaw_service`, `seekerclaw_errors`: notification channel IDs.
  - Finding: 내부 Android notification channel ID.
  - Meaning: notification channel의 stable identifier.
  - Confidence: Internal / migration-sensitive.
  - Verification needed: notification channel 생성 코드를 확인하고 rename이 기존 사용자 channel 설정에 미치는 영향을 테스트.
- `SeekerClawService`, `SeekerClawApplication`, `SeekerClawTheme`, `SeekerClawColors`: code symbol/class이며 일반 사용자에게 직접 보이는 텍스트는 아니다.
  - Finding: Kotlin/code symbol name.
  - Meaning: 내부 구현 이름이며 일반 사용자에게는 보통 보이지 않음.
  - Confidence: full namespace/class rename이 필요한 경우에만 Internal / migration-sensitive.
  - Verification needed: full fork identity cleanup이 필요할 때만 IDE/refactor support와 전체 build/test pass로 rename.

이 항목들을 변경하면 app identity, 설치된 앱의 update behavior, 저장 데이터, encrypted config, migration compatibility에 영향을 줄 수 있다.

## Recommended Review Threshold

현재 임시 리브랜딩 패스 기준:

- 실패 조건: Android app user 또는 Telegram/Discord user가 일반적인 setup, settings, logs, notifications, local slash-command 사용 중 `SeekerClaw` name/logo를 보는 경우.
- 1차 제외 범위: package name, class name, internal prefs/db filename, code comment, 대부분의 developer docs.

권장 단계:

1. 직접 Android UI/resource: app label, launcher icon, setup logo, setup/settings/dashboard/system/logs text, notifications.
2. Telegram/Discord local command와 agent-message surface: `message-handler.js`, `ai.js`, `TEMPLATES.md`, 관련 tool description.
3. 외부/배포 surface: User-Agent, OpenRouter title, MCP clientInfo, Solana wallet identity, APK/release name.
4. Full fork identity: applicationId, package namespace, deep link, prefs/db/keystore name, migration strategy.

