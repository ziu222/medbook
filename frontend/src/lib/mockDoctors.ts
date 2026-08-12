export interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

export const doctorTeam: Doctor[] = [
  { id: 'viet-cuong', name: 'Nguyễn Việt Cường', specialty: 'Ngoại thận' },
  { id: 'duc-thanh', name: 'Bùi Đức Thành', specialty: 'Gây mê hồi sức' },
  { id: 'dinh-mung', name: 'Phan Đình Mừng', specialty: 'Chấn thương Chỉnh hình' },
  { id: 'van-ba', name: 'Nguyễn Văn Ba', specialty: 'Giải phẫu Nội chung' },
  { id: 'duc-tien', name: 'Đào Đức Tiến', specialty: 'Nội tiêu hoá' },
  { id: 'thi-lan', name: 'Trần Thị Lan', specialty: 'Tim mạch' },
  { id: 'quoc-hung', name: 'Lê Quốc Hùng', specialty: 'Thần kinh' },
];
