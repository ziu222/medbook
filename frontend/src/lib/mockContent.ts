export interface StatItem {
  num: string;
  label: string;
}

export const hospitalStats: StatItem[] = [
  { num: '500+', label: 'Bác sĩ trên nền tảng' },
  { num: '50+', label: 'Chuyên khoa' },
  { num: '30+', label: 'Cơ sở, phòng khám liên kết' },
  { num: '10000+', label: 'Lượt đặt lịch thành công' },
  { num: '98%', label: 'Bệnh nhân hài lòng' },
  { num: '24/7', label: 'Hỗ trợ đặt lịch trực tuyến' },
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
