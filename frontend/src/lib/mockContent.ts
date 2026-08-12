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
}

export const infraTabs: InfraTab[] = [
  {
    id: 'modern',
    label: 'Kiến trúc hiện đại',
    title: 'Kiến trúc hiện đại',
    description:
      'Bệnh viện Quân y 175 là một trong những công trình y tế hiện đại tiêu biểu của cả nước, được đầu tư xây dựng với định hướng kết hợp hài hòa giữa công năng chuyên môn cao, kiến trúc hiện đại và không gian xanh nhân văn, hướng đến mục tiêu chữa lành toàn diện cho người bệnh.',
  },
  {
    id: 'helipad',
    label: 'Sân đáp trực thăng',
    title: 'Sân đáp trực thăng',
    description:
      'Sân đáp trực thăng phục vụ cấp cứu và vận chuyển bệnh nhân nặng, rút ngắn thời gian tiếp cận điều trị trong các tình huống khẩn cấp.',
  },
  {
    id: 'green',
    label: 'Không gian xanh',
    title: 'Không gian xanh',
    description: 'Khuôn viên bệnh viện được quy hoạch với nhiều mảng xanh, tạo môi trường thư giãn, hỗ trợ quá trình hồi phục của người bệnh.',
  },
  {
    id: 'equipment',
    label: 'Trang thiết bị',
    title: 'Trang thiết bị hiện đại',
    description: 'Hệ thống trang thiết bị chẩn đoán và điều trị được đầu tư đồng bộ, cập nhật theo tiêu chuẩn y tế hiện đại.',
  },
  {
    id: 'specialty',
    label: 'Viện chuyên khoa',
    title: 'Viện chuyên khoa',
    description: 'Các viện, trung tâm chuyên khoa sâu quy tụ đội ngũ chuyên gia đầu ngành trong nhiều lĩnh vực điều trị.',
  },
];

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
