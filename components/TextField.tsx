interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export default function TextField({ label, className, ...restProps }: Props) {
  return (
    <label className={className}>
      {label && <span>{label}</span>}
      <input {...restProps} />
    </label>
  )
}
