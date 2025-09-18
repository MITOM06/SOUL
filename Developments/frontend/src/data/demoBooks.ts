import { Book } from '@/types'

export const demoBooks: Book[] = [
  {
    id: 1,
    title: 'Programming Mindset — From Zero to Hero',
    author: 'Nguyen Demo',
    cover: '', // placeholder
    description: 'A structured learning journey for programming: mindset, roadmap, and practical projects.',
    category: 'Programming',
    access_level: 'free',
  content_preview: `Chapter 1: Mindset and methods...

To get started, understand problem solving...`
  },
  {
    id: 2,
    title: 'Product Design — From Idea to Execution',
    author: 'Tran Mau',
    cover: '',
    description: 'Lessons on UX, product discovery, testing and product development.',
    category: 'Product',
    access_level: 'basic',
  content_preview: 'Chapter 1: Asking the right questions...'
  },
  {
    id: 3,
    title: 'Soft Skills for Developers',
    author: 'Demo Team',
    cover: '',
    description: 'Communication, time management, teamwork and career growth.',
    category: 'Skills',
    access_level: 'free',
    content_preview: 'Chapter 1: Effective communication...'
  }
]
