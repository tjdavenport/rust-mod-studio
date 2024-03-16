import log from '../log';
import fsx from 'fs-extra';
import xml2js from 'xml2js';
import fetch from 'node-fetch';
import * as path from '../path';
import { join } from 'node:path';
import decompress from 'decompress';
import { finished } from 'stream/promises';
import { DependencyName } from '../../shared';
import { getLatestRepoRelease } from '../github';
import * as rustDedicated from './rustDedicated';
import { DependencyInstallError } from '../error';
import { emitInstallError, emitInstallProgress } from './events';

export const MSG_DOWNLOADING = 'Downloading Oxide';
export const MSG_EXTRACTING = 'Extracting Oxide';
export const MSG_CREATING_PROJECT_FILE = 'Creating c# project file';
export const MSG_COMPLETE = 'Setup complete';
export const MSG_RUST_DEDICATED_REQUIRED = 'Cannot install Oxide without Rust Dedicated';
export const MSG_FAILED_FETCHING_DOWNLOAD_URL = 'Cannot get Oxide.Rust download url';
export const MSG_FAILED_DOWNLOADING = 'Failed to download Oxide';
export const MSG_FAILED_EXTRACTING = 'Failed to extract Oxide';
export const MSG_FAILED_CREATING_PROJECT_FILE = 'Failed to create c# project file';

const ARCHIVE_PREFIX = 'oxide-rust-';

/**
 * @TODO - Consider moving event emission into ./index.ts under a wider try/catch
 */
export const getLatestTaggedPlatformAsset = async () => {
  const release = await getLatestRepoRelease('/repos/OxideMod/Oxide.Rust/releases');

  if (!release) {
    emitInstallError(DependencyName.OxideRust, MSG_FAILED_FETCHING_DOWNLOAD_URL);
    throw new DependencyInstallError(MSG_FAILED_FETCHING_DOWNLOAD_URL);
  }

  if (process.platform === 'win32') {
    return {
      asset: release.assets.find(asset => {
        return !asset.name.includes('linux');
      }),
      tag: release.tag_name
    };
  }

  return {
    asset: release.assets.find(asset => {
      return asset.name.includes('linux');
    }),
    tag: release.tag_name,
  };
};

export const deleteArtifact = async (app: Electron.App) => {
  const artifacts = await fsx.readdir(path.artifactDir(app));

  const archiveFilename = artifacts.find(filename => {
    return filename.includes(ARCHIVE_PREFIX) && filename.includes('.zip');
  }) ?? '';

  if (!archiveFilename) {
    return;
  }

  return await fsx.unlink(join(path.artifactDir(app), archiveFilename));
};

export const getArtifactTag = async (app: Electron.App) => {
  const artifacts = await fsx.readdir(path.artifactDir(app));

  const archiveFilename = artifacts.find(filename => {
    return filename.includes(ARCHIVE_PREFIX) && filename.includes('.zip');
  }) ?? '';

  return archiveFilename.replace(ARCHIVE_PREFIX, '').replace('.zip', '');
};

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
/**
 * @TODO - Consider moving event emission into ./index.ts under a wider try/catch
 */
export const install = (app: Electron.App) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      if (!await rustDedicated.isInstalled(app)) {
        const error = new DependencyInstallError(MSG_RUST_DEDICATED_REQUIRED);
        emitInstallError(DependencyName.OxideRust, error.message);
        return reject(error);
      }

      const taggedAsset = await getLatestTaggedPlatformAsset();
      if (!taggedAsset.asset) {
        emitInstallError(DependencyName.OxideRust, MSG_FAILED_FETCHING_DOWNLOAD_URL);
        return reject(new DependencyInstallError(MSG_FAILED_FETCHING_DOWNLOAD_URL));
      }

      const downloadURL = taggedAsset.asset.browser_download_url;
      const response = await fetch(downloadURL);
      emitInstallProgress(DependencyName.OxideRust, MSG_DOWNLOADING);

      if (response.ok) {
        await fsx.ensureDir(getInstallPath(app));
        await fsx.ensureDir(path.artifactDir(app));

        const zipFilename = `${ARCHIVE_PREFIX}${taggedAsset.tag}.zip`
        const zipPath = join(path.artifactDir(app), zipFilename);
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
      log.error(error);
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
