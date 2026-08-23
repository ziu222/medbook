/**
 * Editorial copy for the specialty pages, keyed by the slug the API returns.
 *
 * The backend's Specialty row is only { id, name, slug } — everything a patient would actually
 * want to read about a department lives here instead. These blurbs describe what each specialty
 * treats in general clinical terms, which is safe to state; anything that would be a claim about
 * this particular hospital (department codes, staffing, equipment inventories) is not invented.
 *
 * ponytail: move to the backend once there is somewhere to put it — a specialty CMS table, or
 * extra columns on specialties. Until then a missing slug degrades to a generic line.
 */
export interface SpecialtyCopy {
  blurb: string;
}

export const SPECIALTY_COPY: Record<string, SpecialtyCopy> = {
  'tim-mach': {
    blurb: 'Khám và điều trị tăng huyết áp, rối loạn nhịp, suy tim và bệnh mạch vành. Tầm soát nguy cơ tim mạch định kỳ.',
  },
  'noi-tong-quat': {
    blurb: 'Khám tổng quát, chẩn đoán ban đầu và theo dõi các bệnh mạn tính như đái tháo đường, rối loạn mỡ máu, bệnh tuyến giáp.',
  },
  'da-lieu': {
    blurb: 'Điều trị viêm da, mụn trứng cá, nấm da, vảy nến và các bệnh lý da liễu mạn tính. Tư vấn chăm sóc da.',
  },
  'tai-mui-hong': {
    blurb: 'Xử trí viêm xoang, viêm họng, viêm tai giữa, rối loạn giọng nói và các vấn đề thính lực.',
  },
  mat: {
    blurb: 'Đo khúc xạ, điều trị tật khúc xạ, khô mắt, đục thủy tinh thể và theo dõi biến chứng mắt do đái tháo đường.',
  },
  'nhi-khoa': {
    blurb: 'Khám và điều trị bệnh lý trẻ em, theo dõi tăng trưởng, tiêm chủng và tư vấn dinh dưỡng theo lứa tuổi.',
  },
  'san-phu-khoa': {
    blurb: 'Khám phụ khoa, theo dõi thai kỳ, tầm soát ung thư cổ tử cung và tư vấn sức khỏe sinh sản.',
  },
  'co-xuong-khop': {
    blurb: 'Điều trị thoái hóa khớp, thoát vị đĩa đệm, viêm khớp và đau cột sống. Phục hồi chức năng sau chấn thương.',
  },
  'than-kinh': {
    blurb: 'Chẩn đoán và điều trị đau đầu, động kinh, đột quỵ, rối loạn giấc ngủ và bệnh lý thần kinh ngoại biên.',
  },
  'tieu-hoa': {
    blurb: 'Nội soi tiêu hóa, điều trị viêm loét dạ dày, trào ngược, bệnh gan mật và rối loạn tiêu hóa chức năng.',
  },
};

export const DEFAULT_BLURB = 'Khám và điều trị chuyên sâu theo lĩnh vực của chuyên khoa.';

export const copyFor = (slug: string): SpecialtyCopy => SPECIALTY_COPY[slug] ?? { blurb: DEFAULT_BLURB };
