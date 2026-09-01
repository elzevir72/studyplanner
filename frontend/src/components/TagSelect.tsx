interface TagSelectProps {
  options: string[]
  selected: string[]
  multiple?: boolean
  onChange: (next: string[]) => void
}

// 단일 선택(multiple=false, 기본값): 이미 선택된 옵션을 다시 클릭하면 선택 해제(빈 값).
// 다중 선택(multiple=true): 클릭할 때마다 토글(추가/제거).
export default function TagSelect({ options, selected, multiple = false, onChange }: TagSelectProps) {
  const handleClick = (option: string) => {
    const isSelected = selected.includes(option)
    if (multiple) {
      onChange(isSelected ? selected.filter((o) => o !== option) : [...selected, option])
      return
    }
    onChange(isSelected ? [] : [option])
  }

  return (
    <div className="tag-select">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`tag-btn${selected.includes(option) ? ' selected' : ''}`}
          onClick={() => handleClick(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
