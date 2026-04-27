# Order Notification Template Params v1

## 1. 대상
- 전달 경로: 브라우저 `templateParams` -> Cloudflare Worker -> Resend 메일 본문
- 사용 페이지: `top`, `board`, `door`, `measurement`, `plywood`, `system`

## 2. 공통 파라미터
- `name`
- `time`
- `subject`
- `message`
- `customer_name`
- `customer_phone`
- `customer_email`
- `customer_ggr_id`
- `customer_phone_last4`
- `customer_postcode`
- `customer_address`
- `customer_memo`
- `customer_photo_count`
- `customer_photo_urls`
- `customer_photo_upload_error`
- `order_lines`
- `order_payload_json`

## 3. 호환 파라미터
아래 값들은 기존 주문 데이터와의 호환을 위해 남겨두지만, 신규 폼에서는 비어 있을 수 있다.
- `customer_ggr_id`
- `customer_phone_last4`

## 4. 시스템 전용 파라미터
- `preview_image_url`
- `preview_image_public_id`
- `preview_image_error`

## 5. 비시스템 페이지 기본값
- `top/board/door`에서는 `preview_image_*`를 `"-"`로 전달한다.

## 6. 템플릿 본문 예시
```text
제목: {{subject}}
접수시각: {{time}}

[고객 기본]
이름: {{customer_name}}
연락처: {{customer_phone}}
이메일: {{customer_email}}
우편번호: {{customer_postcode}}
주소: {{customer_address}}
요청사항: {{customer_memo}}

[호환 필드]
GGR 아이디: {{customer_ggr_id}}
휴대폰 뒤 4자리: {{customer_phone_last4}}

[고객 사진]
업로드 개수: {{customer_photo_count}}
URL 목록:
{{customer_photo_urls}}
업로드 오류:
{{customer_photo_upload_error}}

[시스템 미리보기]
URL: {{preview_image_url}}
Public ID: {{preview_image_public_id}}
오류: {{preview_image_error}}

[요약 라인]
{{order_lines}}

[Payload JSON]
{{order_payload_json}}

[전체 메시지]
{{message}}
```

## 7. 운영 권장사항
- Worker는 이 키 이름을 기준으로 메일 본문을 조합하므로, 템플릿 예시나 운영 점검 문서에서 같은 이름을 유지한다.
- `{{message}}`와 `{{order_payload_json}}`를 함께 두면 상담용 요약과 디버깅용 원본을 같이 확인할 수 있다.
- `{{customer_photo_urls}}`는 줄바꿈 그대로 표시되도록 텍스트 블록으로 렌더링하는 편이 읽기 쉽다.
- `preview_image_*`는 비시스템 페이지에서 `"-"` 값이 들어오므로 조건부 없이 출력해도 안전하다.
