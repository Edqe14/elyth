export class Connection<Driver> {
  constructor(public readonly name: string, public readonly driver: Driver) {}
}
