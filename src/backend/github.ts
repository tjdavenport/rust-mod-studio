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
      if (!response.ok) {
        throw Error('could not retrieve latest repo release');
      }

      return response.json();
    }).then((releases: Release[]) => {
      const [ latest ] = releases;
      return latest;
    });
};
