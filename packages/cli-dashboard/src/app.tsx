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
 * External dependencies
 */
import React, { useEffect, useMemo, useState } from 'react';

/**
 * Internal dependencies
 */
import './app.css';
import SiteReport from './components/siteReport';
import type { TechnologyData } from '@cookie-analysis-tool/common';
import type { CookieFrameStorageType, CookieJsonDataType } from './types';
import SiteMapReport from './components/siteMapReport';

enum DisplayType {
  SITEMAP,
  SITE,
}

const App = () => {
  const [cookies, setCookies] = useState<CookieFrameStorageType>({});
  const [technologies, setTechnologies] = useState<TechnologyData[]>([]);

  const [type, path] = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return [
      urlParams.get('type') === 'sitemap'
        ? DisplayType.SITEMAP
        : DisplayType.SITE,
      urlParams.get('path')?.substring(1) || '',
    ];
  }, []);

  useEffect(() => {
    (async () => {
      const response = await fetch(path);
      const data = await response.json();

      let _cookies: CookieFrameStorageType = {},
        _technologies: TechnologyData[] = [];

      if (type === DisplayType.SITEMAP) {
        _technologies = data.reduce(
          (
            acc: TechnologyData[],
            {
              technologyData,
              pageUrl,
            }: { technologyData: TechnologyData[]; pageUrl: string }
          ) => {
            return [
              ...acc,
              ...technologyData.map((technology) => ({
                ...technology,
                pageUrl,
              })),
            ];
          },
          [] as TechnologyData[]
        );

        data.forEach(
          ({
            cookieData,
            pageUrl,
          }: {
            cookieData: {
              frameCookies: CookieFrameStorageType;
            };
            pageUrl: string;
          }) => {
            const _cookieData = Object.entries(cookieData).reduce(
              (acc: CookieFrameStorageType, [frame, _data]) => {
                acc[frame] = Object.fromEntries(
                  Object.entries(_data.frameCookies).map(([key, cookie]) => [
                    key + pageUrl,
                    {
                      ...cookie,
                      pageUrl,
                      frameUrl: frame,
                    } as CookieJsonDataType,
                  ])
                );

                return acc;
              },
              {}
            );

            Object.entries(_cookieData).forEach(([frame, _cData]) => {
              if (!_cookies[frame]) {
                _cookies[frame] = {};
              }

              Object.entries(_cData).forEach(([key, cookie]) => {
                _cookies[frame][key] = cookie;
              });
            });
          }
        );
      } else {
        _technologies = data.technologyData;

        _cookies = Object.entries(
          data.cookieData as {
            frameCookies: CookieFrameStorageType;
          }
        ).reduce((acc: CookieFrameStorageType, [frame, _data]) => {
          acc[frame] = Object.fromEntries(
            Object.entries(_data.frameCookies).map(([key, cookie]) => [
              key,
              {
                ...cookie,
                pageUrl: data.pageUrl,
                frameUrl: frame,
              },
            ])
          );

          return acc;
        }, {});
      }

      setCookies(_cookies);
      setTechnologies(_technologies as TechnologyData[]);
    })();
  }, [path, type]);

  if (!path) {
    return (
      <div className="flex justify-center items-center">
        <div className="text-2xl">No path provided</div>
      </div>
    );
  }

  if (type === DisplayType.SITEMAP) {
    return <SiteMapReport cookies={cookies} technologies={technologies} />;
  } else {
    return (
      <div className="w-full h-screen flex">
        <SiteReport cookies={cookies} technologies={technologies} />
      </div>
    );
  }
};

export default App;
