import { collection, config, fields } from '@keystatic/core';
import { wrapper } from '@keystatic/core/content-components';

// Check if we're in build mode and missing required env vars
const isBuilding =
  process.env.NODE_ENV === 'production' ||
  process.env.NEXT_PHASE === 'phase-production-build';
const hasRequiredEnvVars =
  process.env.KEYSTATIC_GITHUB_CLIENT_ID &&
  process.env.KEYSTATIC_GITHUB_CLIENT_SECRET &&
  process.env.KEYSTATIC_SECRET;

export default config({
  storage:
    isBuilding && !hasRequiredEnvVars
      ? { kind: 'local' }
      : {
          kind: 'github',
          repo: {
            owner: 'twentyhq',
            name: 'twenty',
          },
          pathPrefix: 'packages/twenty-website',
        },
  collections: {
    developers: collection({
      label: 'Technical documentation',
      slugField: 'title',
      path: 'src/content/developers/**',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        icon: fields.text({ label: 'Icon' }),
        image: fields.text({ label: 'Image' }),
        info: fields.text({ label: 'Info' }),
        content: fields.mdx({
          label: 'Content',
          components: {
            ArticleEditContent: wrapper({
              label: 'ArticleEditContent',
              schema: {},
            }),
          },
        }),
      },
    }),
    releases: collection({
      label: 'Releases',
      slugField: 'release',
      path: 'src/content/releases/*',
      format: { contentField: 'content' },
      schema: {
        release: fields.slug({
          name: {
            label: 'Release',
            validation: {
              pattern: {
                regex: /^\d+\.\d+\.\d+$/,
                message: 'The release must be in the format major.minor.patch',
              },
            },
          },
          slug: {
            generate: (name) => name,
            validation: {
              pattern: {
                regex: /^\d+\.\d+\.\d+$/,
                message: 'The release must be in the format major.minor.patch',
              },
            },
          },
        }),
        // TODO: Define the date with a normalized format
        Date: fields.text({ label: 'Date' }),
        content: fields.mdx({
          label: 'Content',
          options: {
            image: {
              directory: 'public/images/releases',
              publicPath: '/images/releases/',
            },
          },
        }),
      },
      parseSlugForSort: (slug) => {
        const [major, minor, patch] = slug.split('.');

        return `${major.padStart(4, '0')}.${minor.padStart(4, '0')}.${patch.padStart(4, '0')}`;
      },
    }),
  },
});
