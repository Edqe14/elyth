export class UtilsProvider {
  static randomId(length: number) {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  }
}
