import log from '../log';
import fsx from 'fs-extra';
import xml2js from 'xml2js';
import fetch from 'node-fetch';
import * as path from '../path';
import { join } from 'node:path';
import decompress from 'decompress';
import { finished } from 'stream/promises';
import { DependencyName } from '../../shared';
import * as rustDedicated from './rustDedicated';
import { DependencyInstallError } from '../error';
import { emitInstallError, emitInstallProgress } from './events';

const platformURL = new Map<string, string>();
// darwin will use linux builds because OSX isn't supported
platformURL.set('darwin', 'https://umod.org/games/rust/download/develop');
platformURL.set('windows', 'https://umod.org/games/rust/download?tag=public');
platformURL.set('linux', 'https://umod.org/games/rust/download/develop');

export const MSG_DOWNLOADING = 'Downloading Oxide';
export const MSG_EXTRACTING = 'Extracting Oxide';
export const MSG_CREATING_PROJECT_FILE = 'Creating c# project file';
export const MSG_COMPLETE = 'Setup complete';
export const MSG_RUST_DEDICATED_REQUIRED = 'Cannot install Oxide without Rust Dedicated';
export const MSG_FAILED_DOWNLOADING = 'Failed to download Oxide';
export const MSG_FAILED_EXTRACTING = 'Failed to extract Oxide';
export const MSG_FAILED_CREATING_PROJECT_FILE = 'Failed to create c# project file';

const projectFilePath = (app: Electron.App) => {
  const rustDedicatedInstallPath = rustDedicated.getInstallPath(app);
  return join(rustDedicatedInstallPath, 'oxide', 'plugins');
};

const projectFileFilename = () => {
  return 'oxide.Plugins.csproj';
};

const readReferenceDLLFilenames = async (app: Electron.App) => {
  const filenames = await fsx.readdir(getInstallPath(app));

  return filenames.filter((filename) => {
    return filename.toLowerCase().endsWith('.dll');
  });
};

const buildProjectFile = (referenceDLLFilenames: string[]) => {
  const builder = new xml2js.Builder();

  const references = referenceDLLFilenames.map((referenceDLLFilename) => {
    return {
      $: { Include: referenceDLLFilename.replace(/\.[^/.]+$/, "") }
    };
  });

  return builder.buildObject({
    Project: {
      PropertyGroup: {
        Version: { _: '1.0.0' },
        AssemblyName: { _: 'RustModStudioProject' },
        Description: { _: 'RustModStudio Plugins' },
        TargetFramework: { _: 'net6' },
        DefinedConstants: { _: 'RUST' },
        OutputPath: { _: '..\\..\\bin\\' },
        IsPackable: { _: 'false' },
        NoWarn: { _: 'NU1701' },
        AssemblySearchPaths: { _: '../../RustDedicated_Data/Managed/;$(AssemblySearchPaths)' },
        ReferencePaths: { _: '../../RustDedicated_Data/Managed/;$(ReferencePaths)' }
      },
      Import : [
        { $: { Project: 'Sdk.props', Sdk: 'Microsoft.NET.Sdk' } },
        { $: { Project: 'Sdk.targets', Sdk: 'Microsoft.NET.Sdk' } }
      ],
      ItemGroup: {
        // prevent type forwarder for type 'System.Object' in assembly 'System.Runtime' causing a cycle
        Reference: references.filter(reference => reference.$.Include !== 'System.Runtime')
      },
    }
  });
};

export const getInstallPath = (app: Electron.App) => {
  const rustDedicatedInstallPath = rustDedicated.getInstallPath(app);
  return join(rustDedicatedInstallPath, 'RustDedicated_Data', 'Managed');
};

const emitResponseError = () => emitInstallError(DependencyName.OxideRust, MSG_FAILED_DOWNLOADING);
export const install = (app: Electron.App) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      if (!await rustDedicated.isInstalled(app)) {
        const error = new DependencyInstallError(MSG_RUST_DEDICATED_REQUIRED);
        emitInstallError(DependencyName.OxideRust, error.message);
        return reject(error);
      }

      const downloadURL = platformURL.get(process.platform) ?? platformURL.get('linux');
      const response = await fetch(downloadURL);
      emitInstallProgress(DependencyName.OxideRust, MSG_DOWNLOADING);

      if (response.ok) {
        await fsx.ensureDir(getInstallPath(app));
        await fsx.ensureDir(path.artifactDir(app));

        const zipPath = join(path.artifactDir(app), 'oxiderust.zip');
        const writeZip = fsx.createWriteStream(zipPath, {
          flags: 'wx'
        });

        await finished(response.body.pipe(writeZip));
        emitInstallProgress(DependencyName.OxideRust, MSG_EXTRACTING);
        await decompress(zipPath, rustDedicated.getInstallPath(app), {
          map: (file) => {
            if (file.type === 'file' && file.path.endsWith('/')) {
              file.type = 'directory'
            }
            return file
          },
        });

        emitInstallProgress(DependencyName.OxideRust, MSG_CREATING_PROJECT_FILE);
        const referenceDLLFilenames = await readReferenceDLLFilenames(app);
        const projectFile = buildProjectFile(referenceDLLFilenames);
        await fsx.ensureDir(projectFilePath(app));
        await fsx.writeFile(
          join(projectFilePath(app), projectFileFilename()),
          projectFile
        );
        emitInstallProgress(DependencyName.OxideRust, MSG_COMPLETE);
        return resolve();
      } else {
        emitResponseError();
        return reject(new DependencyInstallError(MSG_FAILED_DOWNLOADING));
      }

    } catch (error) {
      emitResponseError();
      return reject(error);
    }
  });
};

export const isInstalled = async (app: Electron.App) => {
  try {
    return await fsx.pathExists(
      join(projectFilePath(app), projectFileFilename())
    );
  } catch (error) {
    log.error(error);
    return false;
  }
};
