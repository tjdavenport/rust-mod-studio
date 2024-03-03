import log from './log';
import fetch from 'node-fetch';

/**
 * Because @octokit/types is too complex for the current needs
 */
type Asset = {
  name: string;
  browser_download_url: string;
};
type Release = {
  tag_name: string;
  assets: Asset[]
};

export type TaggedAsset = {
  tag: string;
  asset?: Asset;
};

export const getLatestRepoRelease = async (repoEndpoint: string) => {
  return fetch(`https://api.github.com${repoEndpoint}`)
    .then((response) => {
      return response.json();
    }).then((releases: Release[]) => {
      log.info(JSON.stringify(releases));
      const [ latest ] = releases;
      return latest;
    });
};
