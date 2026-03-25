# EmailJS Template Params v1

## 1. 대상
- Service ID: `service_8iw3ovj`
- Template ID: `template_iaid1xl`
- 사용 페이지: `top`, `board`, `door`, `system`

## 2. 공통 파라미터
- `name`
- `time`
- `subject`
- `message`
- `customer_name`
- `customer_phone`
- `customer_email`
- `customer_address`
- `customer_memo`
- `customer_photo_count`
- `customer_photo_urls`
- `customer_photo_upload_error`
- `order_lines`
- `order_payload_json`

## 3. 시스템 전용 파라미터
- `preview_image_url`
- `preview_image_public_id`
- `preview_image_error`

## 4. 비시스템 페이지 기본값
- `top/board/door`에서는 `preview_image_*`를 `"-"`로 전달한다.

## 5. 템플릿 본문 예시
```text
제목: {{subject}}
접수시각: {{time}}

[고객 기본]
이름: {{customer_name}}
연락처: {{customer_phone}}
이메일: {{customer_email}}
주소: {{customer_address}}
요청사항: {{customer_memo}}

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

## 6. 운영 권장사항
- 템플릿에는 `{{message}}`와 `{{order_payload_json}}`를 모두 둔다.
- `{{customer_photo_urls}}`는 줄바꿈 그대로 출력되도록 Plain Text 블록에 둔다.
- `preview_image_*`는 비시스템 페이지에서 `"-"` 값이 들어오므로 조건부 없이 출력해도 안전하다.
