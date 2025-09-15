import { Book } from '@/types'

export const demoBooks: Book[] = [
  {
    id: 1,
    title: 'Lập Trình Tư Duy — Từ Zero lên Hero',
    author: 'Nguyễn Demo',
    cover: '', // placeholder
    description: 'Hành trình học lập trình bài bản: tư duy, roadmap, project thực tế.',
    category: 'Lập trình',
    access_level: 'free',
    content_preview: `Chương 1: Tư duy và phương pháp...
    
Để bắt đầu, hãy hiểu problem solving...`
  },
  {
    id: 2,
    title: 'Thiết kế sản phẩm — Từ ý tưởng đến thực thi',
    author: 'Trần Mẫu',
    cover: '',
    description: 'Bài học về UX, product discovery, testing và phát triển.',
    category: 'Sản phẩm',
    access_level: 'basic',
    content_preview: 'Chương 1: Đặt câu hỏi đúng...'
  },
  {
    id: 3,
    title: 'Kỹ năng mềm cho dev',
    author: 'Team Demo',
    cover: '',
    description: 'Giao tiếp, quản lý thời gian, làm việc nhóm và thăng tiến.',
    category: 'Kỹ năng',
    access_level: 'free',
    content_preview: 'Chương 1: Giao tiếp hiệu quả...'
  }
]
