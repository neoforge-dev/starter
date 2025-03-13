export const mockAuthService = {
  _user: null,
  isAuthenticated: false,

  async login(email, password) {
    if (email === "test@example.com" && password === "password123") {
      this._user = { email };
      this.isAuthenticated = true;
      return this._user;
    }
    throw new Error("Invalid credentials");
  },

  reset() {
    this._user = null;
    this.isAuthenticated = false;
  },
};
