export const mockAuthService = {
  _token: null,
  _user: null,
  isAuthenticated: false,

  login: async (email, password) => {
    mockAuthService._token = "mock_token";
    mockAuthService._user = { email, id: 1, name: "Test User" };
    mockAuthService.isAuthenticated = true;
    return { token: mockAuthService._token, user: mockAuthService._user };
  },

  register: async (email, password, name) => {
    mockAuthService._token = "mock_token";
    mockAuthService._user = { email, id: 1, name };
    mockAuthService.isAuthenticated = true;
    return { token: mockAuthService._token, user: mockAuthService._user };
  },

  logout: () => {
    mockAuthService._token = null;
    mockAuthService._user = null;
    mockAuthService.isAuthenticated = false;
  },

  getAuthHeaders: () => {
    return mockAuthService._token
      ? { Authorization: `Bearer ${mockAuthService._token}` }
      : {};
  },

  // Test helper methods
  reset: () => {
    mockAuthService._token = null;
    mockAuthService._user = null;
    mockAuthService.isAuthenticated = false;
  },
};
