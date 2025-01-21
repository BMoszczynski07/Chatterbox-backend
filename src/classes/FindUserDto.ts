export class FindUserDto {
  constructor(
    public unique_id: string,
    public email: string,
  ) {}
}
