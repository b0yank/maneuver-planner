import './NumberInput.css';

export function NumberInput(props: { value: number, setValue: (value: number) => void, min?: number, max?: number, step?: number, precision?: number }) {

  const handleKeyDown = (event: KeyboardEvent) => {

    if (event.key === 'ArrowUp') {
      props.setValue(Math.min(props.value + (props.step || 1), props.max || Number.MAX_VALUE));
    } else if (event.key === 'ArrowDown') {
      props.setValue(Math.max(props.value - (props.step || 1), props.min || Number.MIN_VALUE));
    }
  }

  return (
    <div class="number-input-container">
      <button onClick={() => props.setValue(Math.max(props.value - (props.step || 1), props.min || Number.MIN_VALUE))}>-</button>
      <input
        class="number-input-value"
        value={props.value.toFixed(props.precision || 0)}
        onInput={(e) => props.setValue(Number(e.target.value))}
        onKeyDown={handleKeyDown}
      />
      <button onClick={() => props.setValue(Math.min(props.value + (props.step || 1), props.max || Number.MAX_VALUE))}>+</button>
    </div>
  )
}