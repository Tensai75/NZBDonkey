export default {
  defaultPath: 'nzb',
  saveAs: false,
  useCategories: true,
  categories: {
    type: 'automatic',
    fallbackType: 'none',
    defaultCategory: 0,
    categories: [
      {
        active: true,
        name: 'TV',
        type: 'tv',
        regex: '[e|s]\\d+',
      },
      {
        active: true,
        name: 'Movie',
        type: 'movie',
        regex: '(x264|xvid|bluray|720p|1080p|untouched)',
      },
    ],
  },
};
