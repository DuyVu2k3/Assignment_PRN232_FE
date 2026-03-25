# Delivery Plan (Team 5 người)

## Mapping member

- `Member-1` (**Bạn - Lead/Architect**): chuẩn kiến trúc, rule, review PR.
- `Member-2` (Backend A - TODO: điền tên): `Exam` service.
- `Member-3` (Backend B - TODO: điền tên): `Submissions` service.
- `Member-4` (Backend C - TODO: điền tên): `Users/Auth` + tích hợp.
- `Member-5` (DevOps/QA - TODO: điền tên): FE

## Milestone 1 - Foundation Core/Rules (Mục 1)

**Scope**
- Chốt layer chuẩn: `Api/Application/Domain/Infrastructure`.
- Chốt coding rule, PR template, DoD.

**Checklist**
- [ ] `ARCHITECTURE_CORE.md` được team approve.
- [ ] `ENGINEERING_RULES.md` được team approve.
- [ ] PR template có checklist bắt buộc.
- [ ] Onboarding docs cho member mới.

**Owner**
- Primary: `Member-1`
- Review: `Member-2`, `Member-3`

## Milestone 2 - Use case + API quality (Mục 2,3,4,5)

**Scope**
- Tạo use case class rõ ràng cho 4 luồng trọng tâm:
  - `CreateExam`
  - `AssignExaminer`
  - `UploadSubmissionBatch`
  - `GradeSubmission`
- DTO request/response + mapping.
- FluentValidation cho input.
- Global exception middleware + JSON error chuẩn.

**Checklist**
- [ ] Không controller nào truy cập DbContext trực tiếp.
- [ ] 100% endpoint mới dùng DTO.
- [ ] Có validator cho toàn bộ command chính.
- [ ] Error format thống nhất giữa 3 service.

**Owner**
- `Exam`: `Member-2`
- `Submissions`: `Member-3`
- `Users/common validation`: `Member-4`
- Kiến trúc review: `Member-1`

## Milestone 3 - Observability + Security + Data baseline (Mục 6,7,8)

**Scope**
- Serilog JSON + audit event chính.
- JWT Bearer + role/policy cho API quan trọng.
- Migration và seed dữ liệu nền.

**Checklist**
- [ ] Có log cho upload/assign/grade/create.
- [ ] Policy theo role `Admin/Manager/Examiner` áp vào API chính.
- [ ] Seed dữ liệu nền chạy được trong môi trường local.
- [ ] Build + smoke test pass sau `database update`.

**Owner**
- Auth/Policy: `Member-4`
- Logging/Audit: `Member-2`
- Migration/Seed: `Member-3`
- Review + integration check: `Member-1`

## Milestone 4 - Integration + Delivery pipeline (Mục 9,10)

**Scope**
- Tích hợp service qua HttpClientFactory hoặc async messaging.
- Sync cache từ Users/Exam sang Submissions.
- Dockerfile từng service + docker-compose.
- CI pipeline build/test.

**Checklist**
- [ ] Submissions đọc được cached data từ Users/Exam.
- [ ] Toàn bộ service chạy qua docker-compose.
- [ ] CI chạy build + test + lint/check tối thiểu.
- [ ] Có checklist release candidate.

**Owner**
- Integration/cache: `Member-4`
- Docker/CI: `Member-5`
- Service compatibility test: `Member-2`, `Member-3`
- Final release gate: `Member-1`

## Working cadence đề xuất

- Sprint planning: đầu tuần (30-45 phút).
- Daily sync: 15 phút/ngày.
- PR review SLA:
  - Critical fix: < 4 giờ
  - Feature: < 24 giờ

## Definition of Ready (DoR) cho mỗi task

- Có mô tả nghiệp vụ rõ ràng.
- Có acceptance criteria.
- Có scope service cụ thể.
- Có owner và reviewer.