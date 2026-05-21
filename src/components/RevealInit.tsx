'use client'

import { useEffect } from 'react'

export default function RevealInit() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    )

    const observe = () => {
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    }

    observe()
    const t = setTimeout(observe, 400)
    return () => {
      clearTimeout(t)
      observer.disconnect()
    }
  }, [])

  return null
}
