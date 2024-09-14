export class UpdatedUserDTO {
  constructor(
    public unique_id: string,
    public first_name: string,
    public last_name: string,
    public user_desc: string,
  ) {}
}
