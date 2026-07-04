import api from './api';

const userService = {
  updateProfile: (payload) => api.put('/users/profile', payload).then((res) => res.data.data.user),
  updateAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api
      .put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => res.data.data.user);
  },
  changePassword: (currentPassword, newPassword) =>
    api.put('/auth/change-password', { currentPassword, newPassword }).then((res) => res.data),
};

export default userService;
