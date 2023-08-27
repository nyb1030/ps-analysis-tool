/*
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * External dependencies.
 */
import { Command } from 'commander';
import puppeteer from 'puppeteer';
import Sitemapper from 'sitemapper';
import promptly from 'promptly';
import ora from 'ora';
import clc from 'cli-color';
import { ensureFile, writeFile } from 'fs-extra';

/**
 * Internal dependencies.
 */
import {
  generatePageVisitCookies,
  generateTechnology,
  getCSVbyObject,
  normalizeCookie,
} from './utils';
import { CookieLogDetails } from './types';

const program = new Command();

program
  .version('0.0.1')
  .description('CLI to test a URL for 3p cookies')
  .option('-u, --url <value>', 'URL of a site')
  .option('-s, --sitemap-url <value>', 'URL of a sitemap')
  .option(
    '-nh, --no-headless ',
    'flag for running puppeteer in non headless mode'
  );

program.parse();

const isHeadless = Boolean(program.opts().headless);

export const initialize = async () => {
  const url = program.opts().url;
  const sitemapURL = program.opts().sitemapUrl;

  // Browser.
  // @see https://developer.chrome.com/articles/new-headless/
  const browser = await puppeteer.launch({
    devtools: true,
    headless: isHeadless ? 'new' : false,
  });

  if (url) {
    // Single URL.
    let spinner = ora('Analyzing cookies set on first page visit...').start();

    const cookies = await generatePageVisitCookies(new URL(url), browser);

    const cookiesDetails: Array<CookieLogDetails> = [];

    if (cookies) {
      cookies.forEach((theCookie) => {
        const cookie = normalizeCookie(theCookie, url);

        if (cookie) {
          cookiesDetails.push(cookie);
        }
      });
    }

    const csvCookies: string = getCSVbyObject(cookiesDetails);

    spinner.stop();
    console.log(clc.green('Done analyzing cookies!'));

    spinner = ora('Analyzing technologies used on the page...').start();

    const technologies = await generateTechnology(url);

    const csvTechnologies: string = getCSVbyObject(
      technologies.map(({ name }) => ({ name }))
    );

    spinner.stop();
    console.log(clc.green('Done analyzing technologies!'));
    console.log(
      'The following output files were generated in the "out" directory'
    );
    console.log('- cookies.csv (Cookie report)');
    console.log('- technologies. (Technologies report)');
    console.log('- data.json (Both reports in JSON)');

    await ensureFile('./out/cookies.csv');
    await writeFile('./out/cookies.csv', csvCookies);

    await ensureFile('./out/technologies.csv');
    await writeFile('./out/technologies.csv', csvTechnologies);

    await ensureFile('./out/data.json');
    await writeFile(
      './out/data.json',
      JSON.stringify(
        { cookies: cookiesDetails, technologies: technologies },
        undefined,
        2
      )
    );
  } else if (sitemapURL) {
    const siteMapper = new Sitemapper({
      url: sitemapURL,
      timeout: 3000, // 3 seconds
    });

    let { sites: urls } = await siteMapper.fetch();

    if (urls.length === 0) {
      throw new Error('Unable to parse sitemap');
    }

    const countInput: number = parseInt(
      await promptly.prompt(
        `Provided sitemap has ${urls.length} sites. Please enter the number of pages you want to analyze:`,
        (err, val) => {
          if (
            (parseInt(val) && parseInt(val) < 0) ||
            parseInt(val) > urls.length
          ) {
            throw new Error('Bad Input');
          }
        }
      )
    );

    urls = urls.slice(0, countInput);

    const resources = await Promise.all(
      urls.map(async (_url) => {
        const cookies = await generatePageVisitCookies(new URL(_url), browser);

        const cookiesDetails: Array<CookieLogDetails> = [];

        if (cookies) {
          cookies.forEach((theCookie) => {
            const cookie: CookieLogDetails | null = normalizeCookie(
              theCookie,
              url
            );

            if (cookie) {
              cookiesDetails.push(cookie);
            }
          });
        }

        return { url, cookies: cookiesDetails };
      })
    );

    const cookieList: CookieLogDetails[] = [];

    resources.forEach(({ cookies }) => {
      cookies.forEach((cookie) => {
        const ind = cookieList.findIndex(
          ({ name, domain }) => cookie.name === name && cookie.domain === domain
        );

        if (ind === -1) {
          cookieList.push(cookie);
        }
      });
    });

    const csvCookies: string = getCSVbyObject(cookieList);

    await ensureFile('./out/cookies.csv');
    await writeFile('./out/cookies.csv', csvCookies);

    const technologies = await Promise.all(
      urls.map((_url) => {
        return generateTechnology(_url);
      })
    );

    const techMap = technologies
      .reduce((acc, curr) => [...acc, ...curr])
      .reduce<{ name: string; frequency: number }[]>((acc, curr) => {
        const index = acc.findIndex(({ name }) => name === curr.name);

        if (index === -1) {
          return [...acc, { name: curr.name, frequency: 1 }];
        } else {
          return [
            ...acc.slice(0, index),
            { name: curr.name, frequency: acc[index].frequency + 1 },
            ...acc.slice(index + 1),
          ];
        }
      }, []);

    const csvTechnologies: string = getCSVbyObject(techMap);

    await ensureFile('./out/technologies.csv');
    await writeFile('./out/technologies.csv', csvTechnologies);
  }

  await browser.close();
  process.exit(1);
};

(async () => {
  await initialize();
})();
