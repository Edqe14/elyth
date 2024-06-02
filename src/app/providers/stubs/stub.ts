export class Stub {
  constructor(public content: string) {}

  public replace(key: string, value: string) {
    this.content = this.content.replace(
      new RegExp(`\`\`${key}\`\``, "g"),
      value
    );

    return this;
  }

  public render() {
    return this.content;
  }
}
