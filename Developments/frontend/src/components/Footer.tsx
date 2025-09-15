import React from 'react'

export default function Footer(){
  return (
    <footer className="border-t mt-12">
      <div className="container-max py-8 text-sm text-zinc-600">
        <div className="flex flex-col sm:flex-row justify-between">
          <div>© {new Date().getFullYear()} Demo. All rights reserved.</div>
          <div className="mt-3 sm:mt-0">Built with ❤️ — chỉnh sửa nội dung & media để hoàn thiện</div>
        </div>
      </div>
    </footer>
  )
}
