export default {
  type: 'automatic',
  fallbackType: 'none',
  defaultCategory: 0,
  categories: [
    {
      active: true,
      name: 'TV',
      type: 'tv',
      regex: '((staffel|season|folge|episode).{0,3}\\d|[e|s]\\d+)',
    },
    {
      active: true,
      name: 'Movie',
      type: 'movie',
      regex:
        '([hx].?26[45]|xvid|hevc|(dvd|bd)rip|bluray|(720|1080|2160)p|uhd|hdr)',
    },
  ],
  regex: {
    tv: {
      name: 'TV',
      regex: '((staffel|season|folge|episode).{0,3}\\d|[e|s]\\d+)',
    },
    movie: {
      name: 'Movie',
      regex:
        '([hx].?26[45]|xvid|hevc|(dvd|bd)rip|bluray|(720|1080|2160)p|uhd|hdr)',
    },
    own: {
      name: 'Eigene',
      regex: '',
    },
    none: {
      name: 'Aus',
      regex: '',
    },
  },
};
