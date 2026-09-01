interface FormFieldProps {
  label: string
  htmlFor?: string
  children: React.ReactNode
}

export default function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  )
}
