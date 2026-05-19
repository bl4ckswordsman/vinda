import { DragGesture } from "@use-gesture/vanilla";

export interface GestureState {
  deltaX: number; // Exactly how many pixels moved this frame
  isActive: boolean; // true while pointer is down
}

export class GestureController {
  private cleanup: (() => void) | null = null;
  onUpdate: (state: GestureState) => void = () => {};

  attach(element: HTMLElement): void {
    const gesture = new DragGesture(
      element,
      ({ active, delta: [dx], event }) => {
        if (event.cancelable) event.preventDefault();

        // Pass the raw pixel movement directly to our physics engine
        this.onUpdate({ deltaX: active ? dx : 0, isActive: active });
      },
      { eventOptions: { passive: false }, pointer: { touch: true } },
    );
    this.cleanup = () => gesture.destroy();
  }

  detach(): void {
    this.cleanup?.();
    this.cleanup = null;
  }
}
