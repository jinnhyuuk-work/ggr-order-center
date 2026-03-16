# Data Metadata Guide

## 목적
- 데이터 원본의 식별성과 유지보수성을 높이기 위해 메타 정보를 표준화합니다.
- 런타임 주문 계산 데이터는 그대로 두고, 식별 정보는 별도 메타 레지스트리로 관리합니다.

## 표준 필드
- `label`: 사람이 읽기 쉬운 이름
- `description`: 데이터 용도/의미
- `source`: 원본 파일 경로
- `owner`: 관리 주체
- `updated_at`: 기준 갱신일 (`YYYY-MM-DD`)
- `status`: 상태 (`active`, `deprecated`, ...)
- `tags`: 검색/필터용 태그 배열

## 적용 규칙
- 데이터셋 단위 메타: `*_DATASETS_META`
- 아이템 id 단위 메타: `*_DATA_META_BY_ID` 또는 `*_META_BY_ID`
- 정책/맵처럼 id 배열이 아닌 구조는 `*_META_BY_KEY`로 키 단위 관리

## 태그 예시
- `[internal]`
- `page:top`, `page:board`, `page:door`, `page:system`
- `kind:material`, `kind:option`, `kind:processing`, `kind:addon`
- `dataset:<dataset_id>`
