import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [new MakerSquirrel({}), new MakerZIP({}, ['darwin']), new MakerRpm({}), new MakerDeb({})],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      // unsafe-eval seems to be needed to load monaco from cdn
      devContentSecurityPolicy: "worker-src 'self' blob:; script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net; connect-src 'self'",
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/windows/main/index.html',
            js: './src/windows/main/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/windows/main/preload.ts',
            },
          },
          {
            html: './src/windows/setup/index.html',
            js: './src/windows/setup/renderer.ts',
            name: 'setup_window',
            preload: {
              js: './src/windows/setup/preload.ts',
            },
          },
        ],
      },
    }),
  ],
};

export default config;
