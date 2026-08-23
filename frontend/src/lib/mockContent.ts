export interface StatItem {
  num: string;
  label: string;
}

export const hospitalStats: StatItem[] = [
  { num: '12', label: 'Viện, Trung tâm' },
  { num: '100', label: 'Khoa, Phòng, Ban, Đơn vị trực thuộc' },
  { num: '200+', label: 'Giáo sư, Phó Giáo sư, Tiến sĩ' },
  { num: '2000+', label: 'Giường bệnh trong toàn bệnh viện' },
  { num: '1700+', label: 'Lượt điều trị nội trú hằng ngày' },
  { num: '5000+', label: 'Lượt điều trị ngoại trú hằng ngày' },
];

export interface InfraTab {
  id: string;
  label: string;
  title: string;
  description: string;
  /** Four photos for this tab's thumbnail row, from public/assets/images/car1..car5. */
  images: string[];
}

const infraPhoto = (folder: string, file: string) => `/assets/images/${folder}/${file}.webp`;

/** Poster frame for the hospital intro video — one video, not per tab. */
export const infraVideoPoster = infraPhoto('car1', 'hqdefault');

export const infraTabs: InfraTab[] = [
  {
    id: 'modern',
    label: 'Kiến trúc hiện đại',
    title: 'Kiến trúc hiện đại',
    description:
      'Bệnh viện Quân y 175 là một trong những công trình y tế hiện đại tiêu biểu của cả nước, được đầu tư xây dựng với định hướng kết hợp hài hòa giữa công năng chuyên môn cao, kiến trúc hiện đại và không gian xanh nhân văn, hướng đến mục tiêu chữa lành toàn diện cho người bệnh.',
    images: [
      infraPhoto('car1', '92986f08-9a68-4e8a-944f-d060851dae70'),
      infraPhoto('car1', 'c1fec9b0-7caf-448b-8af7-62b77e65c10f'),
      infraPhoto('car1', 'd0bc4741-1e71-488e-a471-eee9d78f021c'),
      infraPhoto('car1', 'f70ee1bf-fc18-423d-8346-ed0915c38a7e'),
    ],
  },
  {
    id: 'helipad',
    label: 'Sân đáp trực thăng',
    title: 'Sân đáp trực thăng',
    description:
      'Sân đáp trực thăng phục vụ cấp cứu và vận chuyển bệnh nhân nặng, rút ngắn thời gian tiếp cận điều trị trong các tình huống khẩn cấp.',
    images: [
      infraPhoto('car2', '9527f2bb-4136-4098-9162-023980577c5b'),
      infraPhoto('car2', 'b04f5e6b-08c1-45e3-8fe5-76d4a94ee4c3'),
      infraPhoto('car2', 'c5e12e14-4fd1-42de-9da8-a71f34cdc4cc'),
      infraPhoto('car2', 'd95d9ce4-a725-47a1-b518-3f0eb249455f'),
    ],
  },
  {
    id: 'green',
    label: 'Không gian xanh',
    title: 'Không gian xanh',
    description: 'Khuôn viên bệnh viện được quy hoạch với nhiều mảng xanh, tạo môi trường thư giãn, hỗ trợ quá trình hồi phục của người bệnh.',
    images: [
      infraPhoto('car3', '63401136-6f6f-4f60-9140-5ca703118e93'),
      infraPhoto('car3', '92986f08-9a68-4e8a-944f-d060851dae70'),
      infraPhoto('car3', 'a56d2677-f384-454f-b4a5-0a95ae8151e8'),
      infraPhoto('car3', 'e4531538-8354-4070-a678-b009f2ea7a3f'),
    ],
  },
  {
    id: 'equipment',
    label: 'Trang thiết bị',
    title: 'Trang thiết bị hiện đại',
    description: 'Hệ thống trang thiết bị chẩn đoán và điều trị được đầu tư đồng bộ, cập nhật theo tiêu chuẩn y tế hiện đại.',
    images: [
      infraPhoto('car4', '9efd61bf-0717-4233-aa0c-729ae208ba6d'),
      infraPhoto('car4', 'e6a839dc-147d-45ab-8fd2-a8b9be9a7af2'),
      infraPhoto('car4', 'f240d91d-c05b-4d9e-b64c-3ee6f97b3f61'),
      infraPhoto('car4', 'f34b559c-3c2c-41df-8e9f-5d4796dbbcb8'),
    ],
  },
  {
    id: 'specialty',
    label: 'Viện chuyên khoa',
    title: 'Viện chuyên khoa',
    description: 'Các viện, trung tâm chuyên khoa sâu quy tụ đội ngũ chuyên gia đầu ngành trong nhiều lĩnh vực điều trị.',
    images: [
      infraPhoto('car5', '88b8244a-8b4f-4f19-8918-6d05da931f7e'),
      infraPhoto('car5', 'a5d872ef-6480-4d8a-9038-5ae3bd059f56'),
      infraPhoto('car5', 'edf1db01-5fa1-4485-bfab-b0e8132d85a4'),
      infraPhoto('car5', 'f6760b3e-bfe9-4795-a8bc-0bae7e9bf39c'),
    ],
  },
];

export interface DoctorReview {
  author: string;
  stars: number;
  body: string;
}

// ponytail: no reviews table in the backend (see backend/app/doctors/models.py) — placeholder
// content so the profile matches the design. Replace with a real endpoint before launch;
// the rating distribution is derived from the doctor's real rating, only these are invented.
export const doctorReviewCount = 320;

export const doctorReviews: DoctorReview[] = [
  {
    author: 'Nguyễn Hạnh',
    stars: 5,
    body: 'Bác sĩ tận tâm, giải thích rất dễ hiểu. Đặt lịch qua MedBook nhanh gọn.',
  },
  {
    author: 'Lê Minh',
    stars: 5,
    body: 'Khám kỹ, chờ đúng giờ hẹn. Rất hài lòng!',
  },
];

export const feedbackPhoto = '/assets/images/ratingform.webp';

export interface Mood {
  id: string;
  emoji: string;
  label: string;
}

export const feedbackMoods: Mood[] = [
  { id: 'great', emoji: '🤩', label: 'Rất tốt' },
  { id: 'good', emoji: '😊', label: 'Tốt' },
  { id: 'ok', emoji: '🙂', label: 'Khá' },
  { id: 'average', emoji: '😐', label: 'Trung bình' },
  { id: 'bad', emoji: '😔', label: 'Chưa tốt' },
];
