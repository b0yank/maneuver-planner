import { Accessor, JSXElement, Show, createSignal } from "solid-js";
import styles from './DraggableMenu.module.css';

export function DraggableMenu(props: { 
  children: JSXElement, 
  id: string, 
  initialPosition: {
    vertical: {
      from: 'top' | 'bottom';
      value: number;
    },
    horizontal: {
      from: 'left' | 'right';
      value: number;
    }
  };
  canvasPositionFromMouseEvent: (event: MouseEvent) => DOMPoint;
  canvasWidth: Accessor<number>;
  canvasHeight: Accessor<number>;
}) {

  const { id: menuId, initialPosition, canvasPositionFromMouseEvent, canvasWidth, canvasHeight } = props;

  const [menuPosition, setMenuPosition] = createSignal<DOMPointReadOnly>(
    new DOMPointReadOnly(initialPosition.horizontal.value, initialPosition.vertical.value)
  );

  const [menuDragStart, setMenuDragStart] = createSignal<DOMPointReadOnly | null>(null);

  const [expanded, setExpanded] = createSignal<boolean>(true);

  const startMenuDrag = (event: MouseEvent) => {

    if (
      event.target instanceof HTMLInputElement || 
      event.target instanceof HTMLButtonElement || 
      event.target instanceof HTMLImageElement
    ) {
      // it gets annoying if the menu is being dragged while you're trying to change an input or click a button
      return;
    }

    const dragStartPoint = canvasPositionFromMouseEvent(event);
    setMenuDragStart(dragStartPoint);
  }

  const dragMenu = (event: MouseEvent) => {
    
    const oldDragPoint = menuDragStart();
    if (oldDragPoint) {
      const mousePosition = canvasPositionFromMouseEvent(event);

      const currentMenuPosition = menuPosition();
      const menu = document.getElementById(menuId);

      const deltaX = initialPosition.horizontal.from === 'right'
        ? oldDragPoint.x - mousePosition.x
        : mousePosition.x - oldDragPoint.x;

      const deltaY = initialPosition.vertical.from === 'top'
        ? mousePosition.y - oldDragPoint.y
        : oldDragPoint.y - mousePosition.y;

      const newMenuPosition = new DOMPointReadOnly(
        Math.min(Math.max(currentMenuPosition.x + deltaX, 0), canvasWidth() - (menu?.clientWidth || 0)),
        Math.min(Math.max(currentMenuPosition.y + deltaY, 0), canvasHeight() - (menu?.clientHeight || 0)),
      );
      
      setMenuPosition(newMenuPosition);
      setMenuDragStart(mousePosition);
    }
  }

  const endMenuDrag = () => {
    setMenuDragStart(null);
  }

  return (
    <div 
      class={styles.menu}
      style={{
        [initialPosition.vertical.from]: `${menuPosition().y.toString()}px`,
        [initialPosition.horizontal.from]: `${menuPosition().x.toString()}px`,
      }}
      onMouseLeave={endMenuDrag}
      onMouseDown={startMenuDrag}
      onMouseMove={dragMenu}
      onMouseUp={endMenuDrag}
    > 
      <button 
        class={styles['expand-button']} 
        onClick={() => setExpanded(currentExpanded => !currentExpanded)}
        style={{ 'align-self': initialPosition.horizontal.from === 'left' ? 'flex-start' : 'flex-end' }}
      >
        <img src={expanded() ? 'minus.svg' : 'plus.svg'} class={styles.image} title={expanded() ? 'Collapse menu' : 'Expand menu'}></img>
      </button>
      <Show when={expanded()}>
        <div id={menuId}>
          {props.children}
        </div>
      </Show>
    </div>
  )
}