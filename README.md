# Ccfolia Marker Panel Auto Creator

ccfolia.com/rooms/ 에서 JSON을 붙여넣으면 자동으로 마커 패널을 생성해주는 크롬 확장 프로그램입니다.

---

## 설치 방법

1. 크롬 주소창에 `chrome://extensions/` 입력
2. 우측 상단 **개발자 모드** 토글 ON
3. **압축 해제된 확장 프로그램 로드** 클릭
4. 이 폴더(`ccfolia-marker-extension`) 선택
5. 확장 프로그램 목록에 나타나면 완료 ✅

---

## 사용 방법

클립보드에 아래 형식의 JSON을 복사한 뒤,  
ccfolia 방 화면(`https://ccfolia.com/rooms/...`)에서 **Ctrl+V** 를 누르면 됩니다.

### JSON 형식

```json
{
  "width": 2,
  "height": 2,
  "overlapPriority": 1,
  "memo": "설명 내용\n두번째 줄",
  "clickAction": "sendToChat",
  "clickActionText": "채팅으로 보낼 내용\n두번째 줄"
}
```

### 필드 설명

| 필드 | 필수 여부 | 기본값 | 설명 |
|---|---|---|---|
| memo | ✅ 필수 | 없음 | 마커 패널 설명 (줄바꿈은 \n) |
| width | 선택 | 2 | 폭 |
| height | 선택 | 2 | 높이 |
| overlapPriority | 선택 | 1 | 겹침 우선도 |
| clickAction | 선택 | none | `none` 또는 `sendToChat` |
| clickActionText | 선택 | 없음 | clickAction이 sendToChat일 때 보낼 텍스트 |

### 최소 예시 (memo만 있어도 동작)

```json
{
  "memo": "이것은 마커입니다"
}
```

---

## 주의사항

- **입력창 안**에서 붙여넣기하면 동작하지 않습니다 (일반 타이핑 방해 안 함)
- 입력창 **밖** (맵 화면 등)에서 Ctrl+V 해야 동작합니다
- JSON 형식이 아니면 일반 붙여넣기로 처리됩니다
- memo 필드가 없으면 동작하지 않습니다
