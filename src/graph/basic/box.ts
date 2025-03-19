export interface Box {
  get boundary(): { x: number; y: number; width: number; height: number };
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
}
