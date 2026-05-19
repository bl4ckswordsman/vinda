import adapterStatic from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
export default {
  kit: {
    adapter: adapterStatic({
      fallback: 'index.html',
      precompress: false,
    }),
    prerender: {
      entries: ['/'],
    },
  },
};
