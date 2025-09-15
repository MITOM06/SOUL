import { Podcast } from '@/types'

export const demoPodcasts: Podcast[] = [
  {
    id: 1,
    title: 'Podcast: Nghệ thuật kể chuyện',
    host: 'Host Demo',
    cover: '',
    description: 'Chia sẻ kỹ thuật kể chuyện cho nội dung audio và báo cáo.',
    category: 'Sáng tạo',
    audio_url: '', // placeholder
    access_level: 'free'
  },
  {
    id: 2,
    title: 'Growth & Product',
    host: 'MG Team',
    cover: '',
    description: 'Phỏng vấn founder về product-market fit và growth hacks.',
    category: 'Business',
    audio_url: '',
    access_level: 'basic'
  }
]
