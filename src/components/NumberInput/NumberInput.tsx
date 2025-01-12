import styles from './NumberInput.module.css';

export function NumberInput(props: { value: number, setValue: (value: number) => void, min?: number, max?: number, step?: number, precision?: number }) {

  const handleKeyDown = (event: KeyboardEvent) => {

    if (event.key === 'ArrowUp') {
      props.setValue(Math.min(props.value + (props.step || 1), props.max || Number.MAX_VALUE));
    } else if (event.key === 'ArrowDown') {
      props.setValue(Math.max(props.value - (props.step || 1), props.min || Number.MIN_VALUE));
    }
  }

  return (
    <div class={styles['number-input-container']}>
      <button class={styles.button} onClick={() => props.setValue(Math.max(props.value - (props.step || 1), props.min || Number.MIN_VALUE))}>
        <img src='minus.svg' class={styles['button-image']}></img>
      </button>
      <input
        class={styles['number-input-value']}
        value={props.value.toFixed(props.precision || 0)}
        onInput={(e) => props.setValue(Number(e.target.value))}
        onKeyDown={handleKeyDown}
      />
      <button class={styles.button} onClick={() => props.setValue(Math.min(props.value + (props.step || 1), props.max || Number.MAX_VALUE))}>
        <img src='plus.svg' class={styles['button-image']}></img>
      </button>
    </div>
  )
}