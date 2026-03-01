# Ccfolia Helper

ccfolia.com 방에서 마커/스크린 패널을 빠르게 생성할 수 있는 크롬 확장 프로그램입니다.
JSON 붙여넣기, 팝업 생성기, 즐겨찾기 기능을 제공합니다.

---

## 설치 방법

1. 크롬 주소창에 `chrome://extensions/` 입력
2. 우측 상단 **개발자 모드** 토글 ON
3. **압축 해제된 확장 프로그램 로드** 클릭
4. 이 폴더 선택
5. 확장 프로그램 목록에 나타나면 완료 ✅

---

## 사용 방법

### 1. JSON 붙여넣기

아래 형식의 JSON을 클립보드에 복사한 뒤,
ccfolia 방 화면(`https://ccfolia.com/rooms/...`)에서 **입력창 밖**(맵 화면 등)에서 **Ctrl+V** 를 누르면 자동으로 패널이 생성됩니다.

### 2. 팝업 생성기

확장 아이콘 클릭 → **Marker / Screen 탭** → 생성기를 펼쳐 값을 입력 → **JSON 복사** 또는 **즐겨찾기 추가**

### 3. 즐겨찾기

자주 쓰는 패널을 즐겨찾기에 저장해두고 ▶ 버튼으로 바로 생성할 수 있습니다.
폴더 단위로 관리하며, 전체 내보내기/불러오기(JSON)도 지원합니다.

### 4. 우클릭으로 즐겨찾기 추가

ccfolia 맵 위의 **마커/스크린 패널**을 우클릭하면 컨텍스트 메뉴 상단에 **[CCF Helper] 즐겨찾기에 추가** 항목이 표시됩니다.
클릭하면 해당 패널이 즐겨찾기 기본 폴더에 즉시 저장됩니다.
※ 캐릭터(피스)를 우클릭할 때는 해당 항목이 표시되지 않습니다.

---

## JSON 형식

### 마커 패널

```json
{
  "type": "marker",
  "memo": "마커 설명",
  "width": 2,
  "height": 2,
  "overlapPriority": 1,
  "imageUrl": "https://example.com/image.png",
  "fixedPlacement": false,
  "fixedSize": false,
  "clickAction": "sendToChat",
  "clickActionText": "채팅으로 보낼 내용"
}
```

### 스크린 패널

```json
{
  "type": "screen",
  "memo": "스크린 설명",
  "width": 4,
  "height": 4,
  "overlapPriority": 1,
  "imageUrl": "https://example.com/image.png",
  "fixedPlacement": false,
  "fixedSize": false,
  "asPlanePanel": false,
  "clickAction": "sendToChat",
  "clickActionText": "채팅으로 보낼 내용"
}
```

### 필드 설명

| 필드 | 필수 여부 | 기본값 | 설명 |
|---|---|---|---|
| memo | ✅ 필수 | 없음 | 패널 설명 (줄바꿈은 `\n`) |
| type | 선택 | `marker` | `marker` 또는 `screen` |
| width | 선택 | 마커 2 / 스크린 4 | 폭 |
| height | 선택 | 마커 2 / 스크린 4 | 높이 |
| overlapPriority | 선택 | `1` | 겹침 우선도 |
| imageUrl | 선택 | `null` | 패널에 표시할 이미지 URL |
| fixedPlacement | 선택 | `false` | `true`이면 위치 고정 |
| fixedSize | 선택 | `false` | `true`이면 크기 고정 |
| asPlanePanel | 선택 | `false` | `true`이면 단축키 비활성화 (스크린 전용) |
| clickAction | 선택 | `none` | `none` 또는 `sendToChat` |
| clickActionText | 선택 | 없음 | `sendToChat`일 때 보낼 텍스트 |

### 최소 예시 (memo만 있어도 동작)

`type`을 생략하면 기본값인 **마커 패널**로 생성됩니다.

```json
{
  "memo": "이것은 마커입니다"
}
```

---

## 기타

- **자동 저장**: 팝업의 토글로 ON/OFF 가능. ON이면 붙여넣기 직후 자동 저장, OFF면 Save 버튼을 직접 눌러야 합니다.
- **입력창 안**에서 붙여넣기하면 동작하지 않습니다 (일반 타이핑 방해 안 함).
- JSON 형식이 아니거나 `memo` 필드가 없으면 동작하지 않습니다.
