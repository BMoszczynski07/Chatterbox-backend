class UserLoginDTO {
  private readonly _login: string;
  private readonly _password: string;

  get login(): string {
    return this._login;
  }

  get password(): string {
    return this._password;
  }
}

export default UserLoginDTO;
