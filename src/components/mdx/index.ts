import FullWidthImage from './FullWidthImage.astro';
import ImageText from './ImageText.astro';
import Carousel from './Carousel.astro';
import VideoEmbed from './VideoEmbed.astro';

/**
 * Components available inside every project .mdx file without importing them.
 */
export const mdxComponents = {
  FullWidthImage,
  ImageText,
  Carousel,
  VideoEmbed,
};
