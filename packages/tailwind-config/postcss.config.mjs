import { join } from 'path';
import { fileURLToPath } from 'url';
import tailwindNesting from '@tailwindcss/nesting';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default {
  plugins: [
    tailwindNesting,
    tailwindcss({
      config: join(__dirname, 'tailwind.config.js')
    }),
    autoprefixer
  ]
};
