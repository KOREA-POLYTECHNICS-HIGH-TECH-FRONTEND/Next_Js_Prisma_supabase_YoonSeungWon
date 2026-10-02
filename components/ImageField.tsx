'use client'
import { useState } from 'react'

interface Props {
  name: string
  label?: string
  maxCount?: number
}

export default function ImageField({ name, label, maxCount = 3 }: Props) {
  const [message, setMessage] = useState<string | null>(null)

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])

    if (files.length > maxCount) {
      setMessage(`이미지는 ${maxCount}개까지 선택할 수 있습니다.`)
    }
  }

  return (
    <>
      <label>
        {label && <span>{label}</span>}
        <input
          type="file"
          accept="image/*"
          name={name}
          multiple={maxCount > 1}
          onChange={handleChange}
        />
      </label>
      {message && <p>{message}</p>}
    </>
  )
}
