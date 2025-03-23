interface IProps {
  type: string;
}
export default class Box {
  box: any;
  type: string;
  constructor({ type }: IProps) {
    this.type = type;
  }
  render() {}
}
