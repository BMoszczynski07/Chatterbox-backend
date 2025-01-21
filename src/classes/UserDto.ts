export class UserDto {
  constructor(
    public unique_id: string,
    public firstName: string,
    public lastName: string,
    public email: string,
    public password: string,
  ) {}
}
