# 주문센터 보안 운영 가이드 v2

- 문서 버전: `v2.0`
- 작성일: `2026-04-27`
- 목적: Cloudflare Worker, Resend, Cloudinary 기반의 현재 주문센터 운영 구조를 기준으로 보안 설정과 점검 항목을 정리한다.

## 1. 현재 운영 구조

1. 브라우저는 허용 도메인에서만 주문 전송과 이미지 업로드를 허용한다.
2. 주문 알림은 Cloudflare Worker가 받아 Resend 메일로 중계한다.
3. 고객 사진과 시스템 미리보기 이미지는 Cloudinary에 업로드한다.
4. 연동값은 `window.__ORDER_CENTER_CONFIG__` 런타임 설정으로 주입한다.

기본 허용 도메인:

1. `order-center.ggr.kr`
2. `ggr.kr`
3. `localhost`
4. `127.0.0.1`
5. 접미사 허용: `.ggr.kr`

## 2. 런타임 설정 주입 방식

공통 부트스트랩 스크립트 1개를 사용한다.

```html
<script src="assets/js/runtime-config-bootstrap.js"></script>
```

운영 배포에서 환경값을 덮어써야 하면, 아래 스니펫을 `runtime-config-bootstrap.js`보다 먼저 선언한다.

```html
<script>
  window.__ORDER_CENTER_CONFIG__ = {
    security: {
      enforceAllowedHosts: true,
      allowedHosts: ["order-center.ggr.kr", "ggr.kr", "localhost", "127.0.0.1"],
      allowedHostSuffixes: [".ggr.kr"]
    },
    orderApi: {
      endpoint: "https://ggr-order-api.example.workers.dev/",
      timeoutMs: 15000
    },
    cloudinary: {
      enabled: true,
      cloudName: "cloud_xxx",
      uploadPreset: "preset_xxx",
      folder: "ggr-order-center/system-preview",
      customerPhotoFolder: "ggr-order-center/customer-photo"
    }
  };
</script>
<script src="assets/js/runtime-config-bootstrap.js"></script>
```

`customerPhotoFolder`는 현장사진의 기본 루트다. 실제 업로드 경로는 `pageKey`를 붙여
`ggr-order-center/customer-photo/board`, `ggr-order-center/customer-photo/door`,
`ggr-order-center/customer-photo/plywood`처럼 자동으로 나뉜다.

운영 원칙:

1. 운영 배포에서는 `enforceAllowedHosts: true` 유지
2. 주문 전송은 `orderApi.endpoint`가 비어 있지 않아야 동작한다.
3. 값 로테이션 시 런타임 설정과 Worker Secret을 함께 교체한다.

## 3. Cloudflare Worker / Resend 운영 체크리스트

1. Worker `ALLOWED_ORIGINS`에 `order-center.ggr.kr` 및 필요한 `ggr.kr` 계열만 등록
2. Worker Secret `RESEND_API_KEY`가 등록되어 있는지 확인
3. `MAIL_FROM`, `MAIL_TO` 값이 운영 주소와 일치하는지 확인
4. Resend 발신 도메인(`order@ggr.kr`)이 `Verified` 상태인지 확인
5. Worker 응답 로그와 Resend 발송 로그를 함께 확인할 수 있게 운영 콘솔 접근 권한을 유지

## 4. Cloudinary 운영 제한 체크리스트

1. 업로드 프리셋을 주문센터 전용으로 분리
2. 허용 포맷 제한(`jpg,jpeg,png,webp`)
3. 최대 파일 크기 제한(권장: `10MB` 이하)
4. 업로드 폴더 강제(`ggr-order-center/*`)
5. 비정상 트래픽 모니터링 알림 설정
6. 오남용 발생 시 프리셋 즉시 비활성화

## 5. 장애/오남용 대응 순서

1. Cloudinary 프리셋 비활성화 또는 이름 교체
2. Worker `ALLOWED_ORIGINS`를 최소 권한으로 재조정
3. `RESEND_API_KEY` 재발급 및 Worker Secret 교체
4. `orderApi.endpoint`를 점검 페이지나 대체 Worker로 전환
5. 런타임 설정 교체 배포 후 허용 도메인 목록을 재검토
