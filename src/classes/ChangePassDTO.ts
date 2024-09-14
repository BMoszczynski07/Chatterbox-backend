export class ChangePassDTO {
  constructor(
    public cur_pass: string,
    public new_pass: string,
    public confirm_new_pass: string,
  ) {}
}
