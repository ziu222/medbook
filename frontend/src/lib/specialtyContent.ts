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
  /** Two or three paragraphs for the detail page's "Giới thiệu". */
  intro?: string[];
  /**
   * Left empty on purpose. "Máy móc / Trang thiết bị" and "Kỹ thuật mũi nhọn" in the design are
   * assertions about what this hospital owns and performs — not something to invent. The detail
   * page renders each section only when its list has entries, so dropping the hospital's real
   * copy in here is all that is needed to turn them on.
   */
  equipment?: string[];
  techniques?: string[];
}

/** Generic to any hospital department, so these are safe to state for every specialty. */
export const DEPARTMENT_FUNCTIONS = [
  'Khám, chẩn đoán và điều trị người bệnh thuộc phạm vi chuyên khoa, cả nội trú và ngoại trú.',
  'Hội chẩn với các khoa liên quan trong những ca bệnh phức tạp hoặc có nhiều bệnh lý kèm theo.',
  'Theo dõi, tái khám và quản lý người bệnh mạn tính theo phác đồ điều trị.',
  'Tham gia đào tạo, nghiên cứu khoa học và chuyển giao kỹ thuật trong lĩnh vực chuyên khoa.',
];

export const SPECIALTY_COPY: Record<string, SpecialtyCopy> = {
  'tim-mach': {
    blurb: 'Khám và điều trị tăng huyết áp, rối loạn nhịp, suy tim và bệnh mạch vành. Tầm soát nguy cơ tim mạch định kỳ.',
    intro: [
      'Chuyên khoa Tim mạch tiếp nhận người bệnh có triệu chứng đau ngực, khó thở, hồi hộp trống ngực hoặc phát hiện bất thường huyết áp qua khám sức khỏe định kỳ.',
      'Bên cạnh điều trị, khoa chú trọng tầm soát và quản lý các yếu tố nguy cơ — huyết áp, mỡ máu, đường huyết, thuốc lá — vì phần lớn biến cố tim mạch có thể phòng ngừa nếu được phát hiện sớm.',
    ],
  },
  'noi-tong-quat': {
    blurb: 'Khám tổng quát, chẩn đoán ban đầu và theo dõi các bệnh mạn tính như đái tháo đường, rối loạn mỡ máu, bệnh tuyến giáp.',
    intro: [
      'Nội tổng quát thường là nơi tiếp nhận đầu tiên khi người bệnh chưa xác định được vấn đề thuộc chuyên khoa nào. Bác sĩ khám toàn diện, chỉ định cận lâm sàng cần thiết và định hướng chuyên khoa phù hợp.',
      'Khoa cũng theo dõi dài hạn các bệnh mạn tính như đái tháo đường, rối loạn mỡ máu và bệnh tuyến giáp.',
    ],
  },
  'da-lieu': {
    blurb: 'Điều trị viêm da, mụn trứng cá, nấm da, vảy nến và các bệnh lý da liễu mạn tính. Tư vấn chăm sóc da.',
    intro: [
      'Chuyên khoa Da liễu điều trị các bệnh lý của da, tóc và móng — từ viêm da cơ địa, mụn trứng cá, nấm da đến những bệnh mạn tính cần theo dõi lâu dài như vảy nến.',
      'Nhiều bệnh da tiến triển theo đợt, nên việc tái khám đúng hẹn và tuân thủ phác đồ quan trọng không kém lần khám đầu tiên.',
    ],
  },
  'tai-mui-hong': {
    blurb: 'Xử trí viêm xoang, viêm họng, viêm tai giữa, rối loạn giọng nói và các vấn đề thính lực.',
    intro: [
      'Tai Mũi Họng xử trí các bệnh lý vùng tai, mũi, xoang, họng và thanh quản — viêm xoang kéo dài, viêm tai giữa, khàn tiếng, ù tai hoặc giảm thính lực.',
      'Khoa phối hợp với các chuyên khoa khác khi triệu chứng vùng đầu mặt cổ có liên quan tới bệnh lý toàn thân.',
    ],
  },
  mat: {
    blurb: 'Đo khúc xạ, điều trị tật khúc xạ, khô mắt, đục thủy tinh thể và theo dõi biến chứng mắt do đái tháo đường.',
    intro: [
      'Chuyên khoa Mắt khám tật khúc xạ, khô mắt, viêm kết mạc, đục thủy tinh thể và các bệnh lý đáy mắt.',
      'Người bệnh đái tháo đường hoặc tăng huyết áp được khuyến cáo khám mắt định kỳ, vì biến chứng võng mạc thường diễn tiến âm thầm trước khi ảnh hưởng thị lực.',
    ],
  },
  'nhi-khoa': {
    blurb: 'Khám và điều trị bệnh lý trẻ em, theo dõi tăng trưởng, tiêm chủng và tư vấn dinh dưỡng theo lứa tuổi.',
    intro: [
      'Nhi khoa tiếp nhận trẻ từ sơ sinh đến tuổi vị thành niên, khám các bệnh lý cấp tính lẫn theo dõi phát triển thể chất và vận động theo lứa tuổi.',
      'Khoa tư vấn dinh dưỡng, lịch tiêm chủng và hướng dẫn phụ huynh nhận biết các dấu hiệu cần đưa trẻ đi khám ngay.',
    ],
  },
  'san-phu-khoa': {
    blurb: 'Khám phụ khoa, theo dõi thai kỳ, tầm soát ung thư cổ tử cung và tư vấn sức khỏe sinh sản.',
    intro: [
      'Sản phụ khoa chăm sóc sức khỏe phụ nữ ở mọi giai đoạn — khám phụ khoa định kỳ, theo dõi thai kỳ, tầm soát ung thư cổ tử cung và tư vấn kế hoạch hóa gia đình.',
      'Thai phụ được theo dõi theo lịch khám thai chuẩn, phát hiện sớm các nguy cơ cho cả mẹ và thai nhi.',
    ],
  },
  'co-xuong-khop': {
    blurb: 'Điều trị thoái hóa khớp, thoát vị đĩa đệm, viêm khớp và đau cột sống. Phục hồi chức năng sau chấn thương.',
    intro: [
      'Cơ xương khớp điều trị đau cột sống, thoái hóa khớp, thoát vị đĩa đệm, viêm khớp và các chấn thương phần mềm.',
      'Điều trị thường kết hợp thuốc, vật lý trị liệu và hướng dẫn vận động — phục hồi chức năng đóng vai trò quyết định trong kết quả lâu dài.',
    ],
  },
  'than-kinh': {
    blurb: 'Chẩn đoán và điều trị đau đầu, động kinh, đột quỵ, rối loạn giấc ngủ và bệnh lý thần kinh ngoại biên.',
    intro: [
      'Chuyên khoa Thần kinh chẩn đoán và điều trị đau đầu, chóng mặt, động kinh, rối loạn giấc ngủ, bệnh lý thần kinh ngoại biên và di chứng sau đột quỵ.',
      'Nhiều triệu chứng thần kinh cần khai thác bệnh sử kỹ và theo dõi theo thời gian, nên việc mô tả chi tiết diễn biến giúp ích rất nhiều cho chẩn đoán.',
    ],
  },
  'tieu-hoa': {
    blurb: 'Nội soi tiêu hóa, điều trị viêm loét dạ dày, trào ngược, bệnh gan mật và rối loạn tiêu hóa chức năng.',
    intro: [
      'Tiêu hóa khám và điều trị các bệnh lý dạ dày, thực quản, ruột, gan và đường mật — viêm loét dạ dày, trào ngược, hội chứng ruột kích thích, viêm gan.',
      'Nội soi tiêu hóa được chỉ định khi cần đánh giá trực tiếp tổn thương hoặc tầm soát ở nhóm có nguy cơ.',
    ],
  },
};

export const DEFAULT_BLURB = 'Khám và điều trị chuyên sâu theo lĩnh vực của chuyên khoa.';

export const copyFor = (slug: string): SpecialtyCopy => SPECIALTY_COPY[slug] ?? { blurb: DEFAULT_BLURB };
