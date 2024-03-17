import { Setter } from 'solid-js';
import './NumberInput.css';

export function NumberInput(props: { value: number, setValue: Setter<number>, min?: number, max?: number, step?: number }) {
    return (
        <div class="number-input-container">
            <button onClick={() => props.setValue(value => Math.min(value + (props.step || 1), props.max || Number.MAX_SAFE_INTEGER))}>+</button>
            <div>{ props.value }</div>
            <button onClick={() => props.setValue(value => Math.max(value - (props.step || 1), props.min || Number.MIN_SAFE_INTEGER))}>-</button>
        </div>
    )
}