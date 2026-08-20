#Requires -Version 5.1
<#
.SYNOPSIS
Creates issues from the QLDAPM project plan and adds them to a GitHub Project.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File .\scripts\setup-github-project-tasks.ps1 -ProjectNumber 1

.EXAMPLE
powershell -ExecutionPolicy Bypass -File .\scripts\setup-github-project-tasks.ps1 -ProjectNumber 1 -DryRun
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateRange(1, [int]::MaxValue)]
    [int]$ProjectNumber,

    [string]$Repository = 'ziu222/medbook',
    [string]$Owner = 'ziu222',
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Assert-GitHubCli {
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        throw 'GitHub CLI (gh) chưa được cài. Cài tại https://cli.github.com/ rồi chạy lại script.'
    }

    gh auth status 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw 'Chưa đăng nhập GitHub CLI. Chạy: gh auth login -s repo,project'
    }
}

$tasks = @(
    [pscustomobject]@{ Id = 2; Phase = 'Khởi tạo & lập kế hoạch dự án'; Title = 'Xây dựng Project Charter'; Start = '2026-07-17'; Finish = '2026-07-17'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 3; Phase = 'Khởi tạo & lập kế hoạch dự án'; Title = 'Xây dựng WBS'; Start = '2026-07-20'; Finish = '2026-07-20'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 4; Phase = 'Khởi tạo & lập kế hoạch dự án'; Title = 'Xây dựng sơ đồ Gantt & xác định mốc thời gian'; Start = '2026-07-21'; Finish = '2026-07-21'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 5; Phase = 'Khởi tạo & lập kế hoạch dự án'; Title = 'Lập kế hoạch quản lý nguồn lực, rủi ro, chi phí'; Start = '2026-07-21'; Finish = '2026-07-21'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 6; Phase = 'Khởi tạo & lập kế hoạch dự án'; Title = 'Phê duyệt kế hoạch dự án'; Start = '2026-07-22'; Finish = '2026-07-22'; Duration = '1 ngày' },

    [pscustomobject]@{ Id = 8; Phase = 'Phân tích & thiết kế hệ thống'; Title = 'Khảo sát yêu cầu'; Start = '2026-07-23'; Finish = '2026-07-23'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 9; Phase = 'Phân tích & thiết kế hệ thống'; Title = 'Xây dựng Use Case Diagram tổng quát'; Start = '2026-07-24'; Finish = '2026-07-24'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 11; Phase = 'Phân tích & thiết kế hệ thống'; Title = 'Phân tích và thiết kế chức năng đặt lịch khám'; Start = '2026-07-27'; Finish = '2026-07-27'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 12; Phase = 'Phân tích & thiết kế hệ thống'; Title = 'Phân tích và thiết kế chức năng tìm kiếm bác sĩ'; Start = '2026-07-27'; Finish = '2026-07-27'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 13; Phase = 'Phân tích & thiết kế hệ thống'; Title = 'Phân tích và thiết kế chức năng đăng ký lịch làm việc'; Start = '2026-07-27'; Finish = '2026-07-27'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 14; Phase = 'Phân tích & thiết kế hệ thống'; Title = 'Phân tích và thiết kế chức năng hủy lịch'; Start = '2026-07-27'; Finish = '2026-07-27'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 15; Phase = 'Phân tích & thiết kế hệ thống'; Title = 'Thiết kế sơ đồ lớp và CSDL quan hệ'; Start = '2026-07-28'; Finish = '2026-07-28'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 16; Phase = 'Phân tích & thiết kế hệ thống'; Title = 'Thiết kế giao diện cho các màn hình chính'; Start = '2026-07-27'; Finish = '2026-07-27'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 17; Phase = 'Phân tích & thiết kế hệ thống'; Title = 'Thiết kế xử lý logic cho từng màn hình giao diện'; Start = '2026-07-29'; Finish = '2026-07-29'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 18; Phase = 'Phân tích & thiết kế hệ thống'; Title = 'Review & phê duyệt tài liệu thiết kế hệ thống'; Start = '2026-07-30'; Finish = '2026-07-30'; Duration = '1 ngày' },

    [pscustomobject]@{ Id = 20; Phase = 'Thiết lập môi trường & hạ tầng kỹ thuật'; Title = 'Khởi tạo Git repository & cấu trúc dự án'; Start = '2026-07-23'; Finish = '2026-07-23'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 21; Phase = 'Thiết lập môi trường & hạ tầng kỹ thuật'; Title = 'Thiết lập GitHub Project quản lý backlog/sprint'; Start = '2026-07-24'; Finish = '2026-07-24'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 22; Phase = 'Thiết lập môi trường & hạ tầng kỹ thuật'; Title = 'Cài đặt môi trường FastAPI + PostgreSQL'; Start = '2026-07-24'; Finish = '2026-07-24'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 24; Phase = 'Thiết lập môi trường & hạ tầng kỹ thuật'; Title = 'Cấu hình Docker Compose cho môi trường dev'; Start = '2026-07-27'; Finish = '2026-07-27'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 25; Phase = 'Thiết lập môi trường & hạ tầng kỹ thuật'; Title = 'Cấu hình Docker Compose cho môi trường production'; Start = '2026-07-28'; Finish = '2026-07-28'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 26; Phase = 'Thiết lập môi trường & hạ tầng kỹ thuật'; Title = 'Thiết lập bảng CSDL'; Start = '2026-07-27'; Finish = '2026-07-27'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 28; Phase = 'Thiết lập môi trường & hạ tầng kỹ thuật'; Title = 'Cấu hình Dependabot'; Start = '2026-07-24'; Finish = '2026-07-24'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 29; Phase = 'Thiết lập môi trường & hạ tầng kỹ thuật'; Title = 'Build, test và publish image container'; Start = '2026-07-28'; Finish = '2026-07-28'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 30; Phase = 'Thiết lập môi trường & hạ tầng kỹ thuật'; Title = 'Cấu hình security scanner'; Start = '2026-07-29'; Finish = '2026-07-29'; Duration = '1 ngày' },

    [pscustomobject]@{ Id = 32; Phase = 'Quản lý người dùng & xác thực'; Title = 'Xây dựng API đăng ký/đăng nhập/đăng xuất'; Start = '2026-07-31'; Finish = '2026-07-31'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 33; Phase = 'Quản lý người dùng & xác thực'; Title = 'Xây dựng phân quyền người dùng (Bệnh nhân/Bác sĩ/Admin)'; Start = '2026-08-03'; Finish = '2026-08-03'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 34; Phase = 'Quản lý người dùng & xác thực'; Title = 'Mã hóa mật khẩu (MD5) & bảo mật xác thực request'; Start = '2026-08-04'; Finish = '2026-08-04'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 35; Phase = 'Quản lý người dùng & xác thực'; Title = 'Xây dựng giao diện đăng ký/đăng nhập'; Start = '2026-08-03'; Finish = '2026-08-03'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 36; Phase = 'Quản lý người dùng & xác thực'; Title = 'Kiểm thử module xác thực'; Start = '2026-08-05'; Finish = '2026-08-05'; Duration = '1 ngày' },

    [pscustomobject]@{ Id = 38; Phase = 'Tìm kiếm & hồ sơ bác sĩ'; Title = 'Xây dựng CSDL bác sĩ & chuyên khoa'; Start = '2026-08-06'; Finish = '2026-08-06'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 39; Phase = 'Tìm kiếm & hồ sơ bác sĩ'; Title = 'Xây dựng API tìm kiếm bác sĩ theo từ khóa'; Start = '2026-08-07'; Finish = '2026-08-07'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 40; Phase = 'Tìm kiếm & hồ sơ bác sĩ'; Title = 'Xây dựng API lọc bác sĩ theo chuyên khoa'; Start = '2026-08-07'; Finish = '2026-08-07'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 41; Phase = 'Tìm kiếm & hồ sơ bác sĩ'; Title = 'Xây dựng API hồ sơ bác sĩ (level, kinh nghiệm, chứng chỉ, đánh giá)'; Start = '2026-08-07'; Finish = '2026-08-07'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 42; Phase = 'Tìm kiếm & hồ sơ bác sĩ'; Title = 'Xây dựng giao diện tìm kiếm & danh sách bác sĩ'; Start = '2026-08-10'; Finish = '2026-08-10'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 43; Phase = 'Tìm kiếm & hồ sơ bác sĩ'; Title = 'Xây dựng giao diện trang hồ sơ bác sĩ'; Start = '2026-08-10'; Finish = '2026-08-10'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 44; Phase = 'Tìm kiếm & hồ sơ bác sĩ'; Title = 'Kiểm thử module tìm kiếm & hồ sơ bác sĩ'; Start = '2026-08-11'; Finish = '2026-08-11'; Duration = '1 ngày' },

    [pscustomobject]@{ Id = 46; Phase = 'Lịch làm việc bác sĩ'; Title = 'Xây dựng CSDL lịch làm việc (ca khám 30 phút / 1 giờ)'; Start = '2026-08-12'; Finish = '2026-08-12'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 47; Phase = 'Lịch làm việc bác sĩ'; Title = 'Xây dựng API bác sĩ tùy chỉnh lịch làm việc'; Start = '2026-08-13'; Finish = '2026-08-14'; Duration = '2 ngày' },
    [pscustomobject]@{ Id = 48; Phase = 'Lịch làm việc bác sĩ'; Title = 'Xây dựng API admin khóa/quản lý slot lịch'; Start = '2026-08-13'; Finish = '2026-08-14'; Duration = '2 ngày' },
    [pscustomobject]@{ Id = 49; Phase = 'Lịch làm việc bác sĩ'; Title = 'Xây dựng giao diện quản lý lịch làm việc (bác sĩ)'; Start = '2026-08-17'; Finish = '2026-08-17'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 50; Phase = 'Lịch làm việc bác sĩ'; Title = 'Xây dựng giao diện xem lịch trống theo khung giờ (bệnh nhân)'; Start = '2026-08-17'; Finish = '2026-08-17'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 51; Phase = 'Lịch làm việc bác sĩ'; Title = 'Kiểm thử module lịch làm việc'; Start = '2026-08-18'; Finish = '2026-08-18'; Duration = '1 ngày' },

    [pscustomobject]@{ Id = 53; Phase = 'Đặt lịch hẹn & thanh toán'; Title = 'Xây dựng cơ chế giữ chỗ tạm thời (hold slot), timeout 10–15 phút'; Start = '2026-08-19'; Finish = '2026-08-20'; Duration = '2 ngày' },
    [pscustomobject]@{ Id = 54; Phase = 'Đặt lịch hẹn & thanh toán'; Title = 'Xây dựng luồng đặt lịch cho bản thân'; Start = '2026-08-21'; Finish = '2026-08-24'; Duration = '2 ngày' },
    [pscustomobject]@{ Id = 55; Phase = 'Đặt lịch hẹn & thanh toán'; Title = 'Xây dựng luồng đặt hộ người khác (họ tên, quan hệ, SĐT, triệu chứng)'; Start = '2026-08-21'; Finish = '2026-08-24'; Duration = '2 ngày' },
    [pscustomobject]@{ Id = 56; Phase = 'Đặt lịch hẹn & thanh toán'; Title = 'Tích hợp thanh toán phí đặt lịch (150.000 VNĐ/lượt)'; Start = '2026-08-25'; Finish = '2026-08-26'; Duration = '2 ngày' },
    [pscustomobject]@{ Id = 57; Phase = 'Đặt lịch hẹn & thanh toán'; Title = 'Xây dựng cơ chế xác nhận ai thanh toán trước, người đó được nhận'; Start = '2026-08-27'; Finish = '2026-08-28'; Duration = '2 ngày' },
    [pscustomobject]@{ Id = 58; Phase = 'Đặt lịch hẹn & thanh toán'; Title = 'Xây dựng logic chuyển trạng thái booking (thanh toán xong → booking done)'; Start = '2026-08-31'; Finish = '2026-09-01'; Duration = '2 ngày' },
    [pscustomobject]@{ Id = 59; Phase = 'Đặt lịch hẹn & thanh toán'; Title = 'Xử lý slot hết hạn/thanh toán thất bại (mở lại slot cho người khác)'; Start = '2026-09-02'; Finish = '2026-09-03'; Duration = '2 ngày' },
    [pscustomobject]@{ Id = 60; Phase = 'Đặt lịch hẹn & thanh toán'; Title = 'Xây dựng giao diện chọn khung giờ, đặt lịch & thanh toán'; Start = '2026-08-25'; Finish = '2026-08-25'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 61; Phase = 'Đặt lịch hẹn & thanh toán'; Title = 'Kiểm thử luồng đặt lịch & thanh toán (bao gồm test tranh chấp slot)'; Start = '2026-09-04'; Finish = '2026-09-07'; Duration = '2 ngày' },
    [pscustomobject]@{ Id = 62; Phase = 'Đặt lịch hẹn & thanh toán'; Title = 'Hoàn thành chức năng đặt lịch cốt lõi'; Start = '2026-09-08'; Finish = '2026-09-09'; Duration = '2 ngày' },

    [pscustomobject]@{ Id = 64; Phase = 'Quản lý cuộc hẹn, hủy lịch & hoàn tiền'; Title = 'Xây dựng API xem/quản lý danh sách cuộc hẹn'; Start = '2026-09-10'; Finish = '2026-09-10'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 65; Phase = 'Quản lý cuộc hẹn, hủy lịch & hoàn tiền'; Title = 'Xây dựng chức năng hủy lịch từ người dùng (theo mốc thời gian quy định)'; Start = '2026-09-11'; Finish = '2026-09-11'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 66; Phase = 'Quản lý cuộc hẹn, hủy lịch & hoàn tiền'; Title = 'Xây dựng chức năng hủy/từ chối lịch từ bác sĩ/phòng khám'; Start = '2026-09-11'; Finish = '2026-09-11'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 67; Phase = 'Quản lý cuộc hẹn, hủy lịch & hoàn tiền'; Title = 'Xây dựng cấu hình quy tắc hủy & hoàn tiền (admin tùy chỉnh %)'; Start = '2026-09-11'; Finish = '2026-09-11'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 68; Phase = 'Quản lý cuộc hẹn, hủy lịch & hoàn tiền'; Title = 'Xây dựng logic tính % hoàn tiền theo mốc thời gian hủy'; Start = '2026-09-14'; Finish = '2026-09-14'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 69; Phase = 'Quản lý cuộc hẹn, hủy lịch & hoàn tiền'; Title = 'Tích hợp gửi email thông báo khi hủy lịch (nêu rõ lý do)'; Start = '2026-09-15'; Finish = '2026-09-15'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 70; Phase = 'Quản lý cuộc hẹn, hủy lịch & hoàn tiền'; Title = 'Xây dựng giao diện quản lý & hủy cuộc hẹn'; Start = '2026-09-11'; Finish = '2026-09-11'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 71; Phase = 'Quản lý cuộc hẹn, hủy lịch & hoàn tiền'; Title = 'Kiểm thử module quản lý cuộc hẹn, hủy & hoàn tiền'; Start = '2026-09-16'; Finish = '2026-09-16'; Duration = '1 ngày' },

    [pscustomobject]@{ Id = 73; Phase = 'Kiểm thử hệ thống'; Title = 'Kiểm thử tích hợp toàn hệ thống (Integration Testing)'; Start = '2026-09-17'; Finish = '2026-09-17'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 74; Phase = 'Kiểm thử hệ thống'; Title = 'Kiểm thử hiệu suất (500–1000 người dùng đồng thời, <500ms/<2s)'; Start = '2026-09-18'; Finish = '2026-09-18'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 75; Phase = 'Kiểm thử hệ thống'; Title = 'Kiểm thử bảo mật (xác thực, mã hóa mật khẩu)'; Start = '2026-09-18'; Finish = '2026-09-18'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 76; Phase = 'Kiểm thử hệ thống'; Title = 'Sửa lỗi phát sinh sau kiểm thử (Bug fixing)'; Start = '2026-09-21'; Finish = '2026-09-22'; Duration = '2 ngày' },

    [pscustomobject]@{ Id = 78; Phase = 'Triển khai hệ thống'; Title = 'Triển khai hệ thống lên môi trường localhost'; Start = '2026-09-23'; Finish = '2026-09-23'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 79; Phase = 'Triển khai hệ thống'; Title = 'Kiểm tra vận hành sau triển khai (Smoke test)'; Start = '2026-09-24'; Finish = '2026-09-24'; Duration = '1 ngày' },

    [pscustomobject]@{ Id = 81; Phase = 'Hoàn thiện hồ sơ dự án & bảo vệ đồ án'; Title = 'Tổng hợp tài liệu lập kế hoạch dự án (Charter, WBS, Gantt, rủi ro, chi phí)'; Start = '2026-07-23'; Finish = '2026-07-23'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 82; Phase = 'Hoàn thiện hồ sơ dự án & bảo vệ đồ án'; Title = 'Tổng hợp tài liệu thiết kế hệ thống (use case, sequence, activity, class, CSDL, UI)'; Start = '2026-07-31'; Finish = '2026-07-31'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 83; Phase = 'Hoàn thiện hồ sơ dự án & bảo vệ đồ án'; Title = 'Viết tài liệu hướng dẫn sử dụng & triển khai hệ thống'; Start = '2026-08-12'; Finish = '2026-08-12'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 84; Phase = 'Hoàn thiện hồ sơ dự án & bảo vệ đồ án'; Title = 'Biên soạn báo cáo tổng kết đồ án (đầy đủ)'; Start = '2026-09-10'; Finish = '2026-09-14'; Duration = '3 ngày' },
    [pscustomobject]@{ Id = 85; Phase = 'Hoàn thiện hồ sơ dự án & bảo vệ đồ án'; Title = 'Dự phòng xử lý rủi ro / hoàn thiện phát sinh (Buffer)'; Start = '2026-09-23'; Finish = '2026-09-23'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 86; Phase = 'Hoàn thiện hồ sơ dự án & bảo vệ đồ án'; Title = 'Chuẩn bị slide & kịch bản thuyết trình bảo vệ đồ án'; Start = '2026-09-15'; Finish = '2026-09-15'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 87; Phase = 'Hoàn thiện hồ sơ dự án & bảo vệ đồ án'; Title = 'Rà soát & tổng duyệt (rehearsal) trước khi bảo vệ'; Start = '2026-09-24'; Finish = '2026-09-24'; Duration = '1 ngày' },
    [pscustomobject]@{ Id = 88; Phase = 'Hoàn thiện hồ sơ dự án & bảo vệ đồ án'; Title = 'Nộp báo cáo & Bảo vệ đồ án [Mốc kết thúc dự án]'; Start = '2026-09-25'; Finish = '2026-09-25'; Duration = '1 ngày' }
)

Assert-GitHubCli

# This makes repeated runs safe: completed task IDs are discovered before any issue is created.
$existingIssues = @{}
$existingJson = gh issue list --repo $Repository --state all --limit 1000 --json url,body,isPullRequest
if ($LASTEXITCODE -ne 0) { throw "Không thể đọc issue của $Repository." }
foreach ($issue in ($existingJson | ConvertFrom-Json)) {
    if ($issue.isPullRequest) { continue }
    if ($issue.body -match '<!-- qldapm-mpp-task:(\d+) -->') {
        $existingIssues[[int]$Matches[1]] = $issue.url
    }
}

foreach ($task in $tasks) {
    $body = @"
<!-- qldapm-mpp-task:$($task.Id) -->
## Kế hoạch thực hiện

| Trường | Giá trị |
| --- | --- |
| Phase | $($task.Phase) |
| Bắt đầu dự kiến | $($task.Start) |
| Kết thúc dự kiến | $($task.Finish) |
| Thời lượng | $($task.Duration) |
| Mã task trong MPP | $($task.Id) |

Nguồn: `QLDAPM.mpp`.
"@

    $issueUrl = $existingIssues[$task.Id]
    if (-not $issueUrl) {
        if ($DryRun) {
            Write-Host "[DRY RUN] Sẽ tạo issue: $($task.Title)"
            continue
        }

        Write-Host "Tạo issue [$($task.Id)/88]: $($task.Title)"
        $issueUrl = gh issue create --repo $Repository --title $task.Title --body $body
        if ($LASTEXITCODE -ne 0 -or -not $issueUrl) { throw "Không tạo được issue cho task $($task.Id)." }
    }

    if ($DryRun) {
        Write-Host "[DRY RUN] Sẽ thêm vào Project #${ProjectNumber}: $issueUrl"
        continue
    }

    Write-Host "Thêm task $($task.Id) vào GitHub Project #$ProjectNumber"
    gh project item-add $ProjectNumber --owner $Owner --url $issueUrl 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Không thể thêm $issueUrl. Có thể task đã nằm trong Project hoặc token thiếu quyền 'project'."
    }
}

Write-Host "Hoàn tất. Đã xử lý $($tasks.Count) task thực thi từ kế hoạch QLDAPM."




