import api from './api';

export const searchCards = (params: Record<string, any>) => {
  return api.get('/cards/search', { params });
};

export default { searchCards };
